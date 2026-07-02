/**
 * @fileoverview Match service — Firestore CRUD and lifecycle management.
 * @module match/match.service
 */

import {
  serverTimestamp,
  Timestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { getTournamentById } from '../tournament/tournament.service.js';
import { getTeamsByIds } from '../master-data/teams/team.service.js';
import {
  MATCH_MESSAGES,
  MATCH_VALIDATION_MESSAGES,
  createDefaultMatchFields,
} from './match.constants.js';
import {
  validateCreatePayload,
  validateUpdatePayload,
  getMatchValidationMessage,
} from './match.validator.js';
import { matchRepository } from './match.repository.js';
import { applyLifecycleAction, getMatchWithEffectiveStatus } from './match-status.service.js';
import { MATCH_EVENTS, emitMatchEvent } from './match.events.js';
import { listPredictionsByMatch } from '../prediction/prediction.repository.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} Match
 * @property {string} id
 * @property {string} tournamentId
 * @property {number} matchNumber
 * @property {string} [round]
 * @property {string} homeTeamId
 * @property {string} awayTeamId
 * @property {import('firebase/firestore').Timestamp|Date|null} kickoffUtc
 * @property {string} status
 * @property {boolean} visible
 * @property {Record<string, unknown>|null} result
 * @property {string|null} scoringStatus
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {import('firebase/firestore').Timestamp|Date|null} createdAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 */

/**
 * @typedef {Match & {
 *   tournamentName?: string,
 *   homeTeam?: import('../master-data/teams/team.service.js').Team,
 *   awayTeam?: import('../master-data/teams/team.service.js').Team,
 *   predictionStatus?: string,
 * }} EnrichedMatch
 */

/** @type {Map<string, Match>} */
const matchCache = new Map();

/** @type {Promise<unknown>} */
let writeChain = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
function runSerializedWrite(operation) {
  const result = writeChain.then(operation);
  writeChain = result.catch(() => {});
  return result;
}

/**
 * @returns {void}
 */
export function clearMatchCache() {
  matchCache.clear();
  matchRepository.clearCache();
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getMatchErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) {
      return getMatchValidationMessage(/** @type {{ validation: import('./match.validator.js').MatchValidationResult }} */ (error).validation);
    }

    if ('message' in error && typeof /** @type {{ message: string }} */ (error).message === 'string') {
      const message = /** @type {{ message: string }} */ (error).message;
      const known = new Set(Object.values(MATCH_MESSAGES));

      if (known.has(message)) {
        return message;
      }
    }

    if ('code' in error && String(/** @type {{ code: string }} */ (error).code) === 'permission-denied') {
      return MATCH_MESSAGES.PERMISSION_DENIED;
    }

    Logger.error('[MatchService] Error:', error);
  }

  return MATCH_MESSAGES.GENERIC_ERROR;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @returns {Match}
 */
export function normalizeMatchDocument(id, data) {
  const defaults = createDefaultMatchFields();

  return {
    id,
    tournamentId: String(data.tournamentId ?? ''),
    matchNumber: Number(data.matchNumber ?? 0),
    round: String(data.round ?? ''),
    homeTeamId: String(data.homeTeamId ?? ''),
    awayTeamId: String(data.awayTeamId ?? ''),
    kickoffUtc: data.kickoffUtc ?? null,
    status: String(data.status ?? defaults.status),
    visible: Boolean(data.visible),
    result: /** @type {Record<string, unknown>|null} */ (data.result ?? null),
    scoringStatus: data.scoringStatus ? String(data.scoringStatus) : null,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
function buildFirestorePayload(payload) {
  return {
    tournamentId: String(payload.tournamentId ?? ''),
    matchNumber: Number(payload.matchNumber ?? 0),
    homeTeamId: String(payload.homeTeamId ?? ''),
    awayTeamId: String(payload.awayTeamId ?? ''),
    kickoffUtc: toFirestoreTimestamp(payload.kickoffUtc),
    status: payload.status ?? MATCH_STATUS.DRAFT,
    visible: Boolean(payload.visible),
    result: payload.result ?? null,
    scoringStatus: payload.scoringStatus ?? null,
  };
}

/**
 * @param {unknown} value
 * @returns {import('firebase/firestore').Timestamp|null}
 */
function toFirestoreTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
  }

  return null;
}

/**
 * @param {Match} match
 * @returns {Promise<EnrichedMatch>}
 */
export async function enrichMatch(match) {
  const [tournament, teams] = await Promise.all([
    getTournamentById(match.tournamentId),
    getTeamsByIds([match.homeTeamId, match.awayTeamId]),
  ]);

  const kickoff = toDate(match.kickoffUtc);
  let predictionStatus = 'Unavailable';

  if (kickoff && match.tournamentId) {
    try {
      await TournamentConfigurationService.load(match.tournamentId);
      const lockMinutes = TournamentConfigurationService.getPredictionLockMinutes();
      predictionStatus = MatchDomain.isPredictionOpen(match.status, kickoff, lockMinutes)
        ? 'Open'
        : (match.status === MATCH_STATUS.PREDICTION_LOCKED ? 'Locked' : 'Closed');
    } catch {
      predictionStatus = 'Unknown';
    }
  }

  return {
    ...match,
    tournamentName: tournament?.name ?? '',
    homeTeam: teams.get(match.homeTeamId),
    awayTeam: teams.get(match.awayTeamId),
    predictionStatus,
  };
}

/**
 * @param {import('./match.repository.js').MatchListFilters} [filters]
 * @returns {Promise<EnrichedMatch[]>}
 */
export async function listMatchesForAdmin(filters = {}) {
  const listFilters = {
    ...filters,
    excludeArchived: filters.archivedOnly ? false : filters.excludeArchived !== false,
    archivedOnly: Boolean(filters.archivedOnly),
  };

  const rows = await matchRepository.list(listFilters);
  const matches = await Promise.all(rows.map(async (row) => {
    const match = await getMatchWithEffectiveStatus(row.id);
    return match ? enrichMatch(match) : null;
  }));

  return matches.filter(Boolean);
}

/**
 * @param {import('./match.repository.js').MatchListFilters} [filters]
 * @returns {Promise<EnrichedMatch[]>}
 */
export async function listMatchesForContestant(filters = {}) {
  return listMatchesForAdmin({ ...filters, contestantOnly: true });
}

/**
 * @param {string} id
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<EnrichedMatch|null>}
 */
export async function getMatchById(id, options = {}) {
  if (!id) {
    return null;
  }

  const match = await getMatchWithEffectiveStatus(id);

  if (!match) {
    return null;
  }

  return enrichMatch(match);
}

/**
 * @param {string} tournamentId
 * @returns {Promise<import('../tournament/configuration/TournamentConfigurationService.js').TournamentConfigurationService>}
 */
export async function getMatchConfiguration(tournamentId) {
  await TournamentConfigurationService.load(tournamentId);
  return TournamentConfigurationService;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Match>}
 */
export async function createMatch(payload) {
  return runSerializedWrite(async () => {
    const kickoffUtc = toDate(payload.kickoffUtc);

    const validation = validateCreatePayload({ ...payload, kickoffUtc });

    if (!validation.valid) {
      throw Object.assign(new Error(MATCH_MESSAGES.VALIDATION_SUMMARY), { validation });
    }

    const user = getCurrentUser();

    if (!user) {
      throw new Error(MATCH_MESSAGES.PERMISSION_DENIED);
    }

    const tournament = await getTournamentById(String(payload.tournamentId));

    if (!tournament) {
      throw new Error('Tournament not found.');
    }

    const duplicate = await matchRepository.hasDuplicate(
      String(payload.tournamentId),
      String(payload.homeTeamId),
      String(payload.awayTeamId),
      /** @type {Date} */ (kickoffUtc),
    );

    if (duplicate) {
      throw Object.assign(new Error(MATCH_VALIDATION_MESSAGES.DUPLICATE_MATCH), {
        validation: { valid: false, errors: { form: MATCH_VALIDATION_MESSAGES.DUPLICATE_MATCH } },
      });
    }

    const matchNumber = await matchRepository.getNextMatchNumber(String(payload.tournamentId));
    const defaults = createDefaultMatchFields();
    const data = {
      ...buildFirestorePayload({ ...payload, matchNumber, ...defaults }),
      createdBy: user.uid,
      updatedBy: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const id = await matchRepository.add(data);
    const match = normalizeMatchDocument(id, { ...data, createdAt: new Date(), updatedAt: new Date() });
    matchCache.set(id, match);
    emitMatchEvent(MATCH_EVENTS.MATCH_CREATED, match);
    return match;
  });
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Match>}
 */
export async function updateMatch(id, payload) {
  return runSerializedWrite(async () => {
    const existingData = await matchRepository.getById(id, false);
    const existing = existingData ? normalizeMatchDocument(id, existingData) : null;

    if (!existing) {
      throw new Error(MATCH_MESSAGES.NOT_FOUND);
    }

    const kickoffUtc = toDate(payload.kickoffUtc ?? existing.kickoffUtc);
    const validation = validateUpdatePayload({ ...payload, kickoffUtc }, existing);

    if (!validation.valid) {
      throw Object.assign(new Error(MATCH_MESSAGES.VALIDATION_SUMMARY), { validation });
    }

    const user = getCurrentUser();

    if (!user) {
      throw new Error(MATCH_MESSAGES.PERMISSION_DENIED);
    }

    const duplicate = await matchRepository.hasDuplicate(
      String(payload.tournamentId ?? existing.tournamentId),
      String(payload.homeTeamId ?? existing.homeTeamId),
      String(payload.awayTeamId ?? existing.awayTeamId),
      /** @type {Date} */ (kickoffUtc),
      id,
    );

    if (duplicate) {
      throw Object.assign(new Error(MATCH_VALIDATION_MESSAGES.DUPLICATE_MATCH), {
        validation: { valid: false, errors: { form: MATCH_VALIDATION_MESSAGES.DUPLICATE_MATCH } },
      });
    }

    const data = {
      ...buildFirestorePayload({ ...existing, ...payload, kickoffUtc }),
      updatedBy: user.uid,
      updatedAt: serverTimestamp(),
    };

    await matchRepository.update(id, data);
    matchRepository.clearCache(id);
    const updated = normalizeMatchDocument(id, { ...existing, ...data });
    matchCache.set(id, updated);
    emitMatchEvent(MATCH_EVENTS.MATCH_UPDATED, updated);
    return updated;
  });
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMatch(id) {
  const data = await matchRepository.getById(id, false);

  if (!data) {
    throw new Error(MATCH_MESSAGES.NOT_FOUND);
  }

  const predictions = await listPredictionsByMatch(id);

  if (predictions.length > 0) {
    throw new Error(MATCH_MESSAGES.CANNOT_DELETE_HAS_PREDICTIONS);
  }

  await matchRepository.remove(id);
  matchCache.delete(id);

  await writeAuditLog({
    action: 'match_deleted',
    entityType: 'match',
    entityId: id,
  });

  emitMatchEvent(MATCH_EVENTS.MATCH_DELETED, { id });
}

/**
 * @param {string} id
 * @param {string} action
 * @returns {Promise<Match>}
 */
export async function runMatchLifecycle(id, action) {
  const data = await matchRepository.getById(id, false);

  if (!data) {
    throw new Error(MATCH_MESSAGES.NOT_FOUND);
  }

  const match = normalizeMatchDocument(id, data);
  return applyLifecycleAction(match, action);
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export { applyLifecycleAction };
