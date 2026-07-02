/**
 * @fileoverview Match status service — lifecycle transitions and audit hooks.
 * @module match/match-status.service
 */

import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import {
  MATCH_LIFECYCLE_ACTIONS,
  MATCH_MESSAGES,
  MATCH_VALIDATION_MESSAGES,
} from './match.constants.js';
import { validateLifecycleAction } from './match.validator.js';
import { matchRepository } from './match.repository.js';
import { MATCH_EVENTS, emitMatchEvent } from './match.events.js';
import { writeAuditLog } from '../audit/audit.service.js';

/**
 * @typedef {import('./match.service.js').Match} Match
 */

/**
 * @param {Match} match
 * @param {string} action
 * @returns {Promise<Match>}
 */
export async function applyLifecycleAction(match, action) {
  const validation = validateLifecycleAction(action, match);

  if (!validation.valid) {
    throw Object.assign(new Error(MATCH_VALIDATION_MESSAGES.LIFECYCLE_INVALID), { validation });
  }

  const user = getCurrentUser();
  const updates = {
    updatedBy: user?.uid ?? '',
    updatedAt: serverTimestamp(),
  };

  switch (action) {
    case MATCH_LIFECYCLE_ACTIONS.SCHEDULE:
      updates.status = MATCH_STATUS.SCHEDULED;
      break;
    case MATCH_LIFECYCLE_ACTIONS.PUBLISH:
      updates.status = MATCH_STATUS.PUBLISHED;
      updates.visible = true;
      break;
    case MATCH_LIFECYCLE_ACTIONS.HIDE:
      updates.visible = false;
      break;
    case MATCH_LIFECYCLE_ACTIONS.OPEN_PREDICTIONS:
      updates.status = MATCH_STATUS.PREDICTION_OPEN;
      await writeAuditLog({
        action: 'match_prediction_opened',
        entityType: 'match',
        entityId: match.id,
        details: { manual: true },
      });
      break;
    case MATCH_LIFECYCLE_ACTIONS.CLOSE_PREDICTIONS:
      updates.status = MATCH_STATUS.PREDICTION_LOCKED;
      await writeAuditLog({
        action: 'match_prediction_closed',
        entityType: 'match',
        entityId: match.id,
        details: { manual: true },
      });
      break;
    case MATCH_LIFECYCLE_ACTIONS.REOPEN_PREDICTIONS:
      updates.status = MATCH_STATUS.PREDICTION_OPEN;
      await writeAuditLog({
        action: 'match_prediction_reopened',
        entityType: 'match',
        entityId: match.id,
        details: { manual: true },
      });
      break;
    case MATCH_LIFECYCLE_ACTIONS.GO_LIVE:
      updates.status = MATCH_STATUS.LIVE;
      break;
    case MATCH_LIFECYCLE_ACTIONS.COMPLETE:
      updates.status = MATCH_STATUS.COMPLETED;
      break;
    case MATCH_LIFECYCLE_ACTIONS.ARCHIVE:
      updates.status = MATCH_STATUS.ARCHIVED;
      updates.visible = false;
      break;
    default:
      throw new Error(MATCH_VALIDATION_MESSAGES.LIFECYCLE_INVALID);
  }

  await matchRepository.update(match.id, updates);
  const updated = await getMatchWithEffectiveStatus(match.id);

  if (!updated) {
    throw new Error(MATCH_MESSAGES.NOT_FOUND);
  }

  emitMatchEvent(MATCH_EVENTS.MATCH_STATUS_CHANGED, updated);

  if (action === MATCH_LIFECYCLE_ACTIONS.ARCHIVE) {
    emitMatchEvent(MATCH_EVENTS.MATCH_ARCHIVED, updated);
  }

  return updated;
}

/**
 * @param {string} matchId
 * @returns {Promise<Match|null>}
 */
export async function getMatchWithEffectiveStatus(matchId) {
  const data = await matchRepository.getById(matchId, false);

  if (!data) {
    return null;
  }

  const match = normalizeMatchDocument(matchId, data);
  const kickoff = toDate(match.kickoffUtc);

  if (!kickoff || !match.tournamentId) {
    return match;
  }

  try {
    await TournamentConfigurationService.load(match.tournamentId);
    const openHours = TournamentConfigurationService.getPredictionOpenHoursBeforeKickoff();
    const lockMinutes = TournamentConfigurationService.getPredictionLockMinutes();
    const effectiveStatus = MatchDomain.resolveEffectiveStatus(
      match.status,
      kickoff,
      openHours,
      lockMinutes,
    );

    if (effectiveStatus !== match.status && MatchDomain.canTransitionTo(match.status, effectiveStatus)) {
      await matchRepository.update(matchId, { status: effectiveStatus });
      return normalizeMatchDocument(matchId, { ...data, status: effectiveStatus });
    }
  } catch {
    return match;
  }

  return match;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @returns {Match}
 */
function normalizeMatchDocument(id, data) {
  return {
    id,
    tournamentId: String(data.tournamentId ?? ''),
    matchNumber: Number(data.matchNumber ?? 0),
    round: String(data.round ?? ''),
    homeTeamId: String(data.homeTeamId ?? ''),
    awayTeamId: String(data.awayTeamId ?? ''),
    venueId: String(data.venueId ?? ''),
    kickoffUtc: data.kickoffUtc ?? null,
    status: String(data.status ?? MATCH_STATUS.DRAFT),
    visible: Boolean(data.visible),
    result: data.result ?? null,
    scoringStatus: data.scoringStatus ?? null,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
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

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
