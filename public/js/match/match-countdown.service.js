/**
 * @fileoverview Match countdown service — builds lifecycle countdown state from match + tournament config.
 * @module match/match-countdown.service
 */

import { MatchDomain, MATCH_COUNTDOWN_PHASE } from '../domain/match.domain.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';

/**
 * @typedef {Object} MatchCountdownDto
 * @property {string} phase
 * @property {string|null} targetDate
 * @property {string|null} label
 * @property {string} opensAt
 * @property {string} locksAt
 * @property {string} kickoffUtc
 */

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

/**
 * Builds serializable lifecycle countdown state for a match.
 * @param {Record<string, unknown>} match
 * @param {Date} [now]
 * @returns {Promise<MatchCountdownDto|null>}
 */
export async function buildMatchCountdown(match, now = new Date()) {
  const kickoff = toDate(match.kickoffUtc);
  if (!kickoff || !match.tournamentId) {
    return null;
  }

  try {
    await TournamentConfigurationService.load(String(match.tournamentId));
    const openHours = TournamentConfigurationService.getPredictionOpenHoursBeforeKickoff();
    const lockMinutes = TournamentConfigurationService.getPredictionLockMinutes();

    const resolved = MatchDomain.resolveMatchCountdownPhase({
      kickoffUtc: kickoff,
      openHours,
      lockMinutes,
      status: String(match.status ?? ''),
      predictionStatus: String(match.predictionStatus ?? ''),
      result: /** @type {{ published?: boolean }|undefined} */ (match.result),
      predictionOverride: /** @type {{ isActive?: boolean, status?: string }|undefined} */ (match.predictionOverride),
      now,
    });

    if (
      resolved.phase === MATCH_COUNTDOWN_PHASE.CLOSED
      || resolved.phase === MATCH_COUNTDOWN_PHASE.HIDDEN
    ) {
      return null;
    }

    return {
      phase: resolved.phase,
      targetDate: resolved.targetDate?.toISOString() ?? null,
      label: resolved.label,
      opensAt: resolved.opensAt.toISOString(),
      locksAt: resolved.locksAt.toISOString(),
      kickoffUtc: resolved.kickoffUtc.toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Builds countdown state when tournament config is already loaded.
 * @param {Record<string, unknown>} match
 * @param {number} openHours
 * @param {number} lockMinutes
 * @param {Date} [now]
 * @returns {MatchCountdownDto|null}
 */
export function buildMatchCountdownSync(match, openHours, lockMinutes, now = new Date()) {
  const kickoff = toDate(match.kickoffUtc);
  if (!kickoff) {
    return null;
  }

  const resolved = MatchDomain.resolveMatchCountdownPhase({
    kickoffUtc: kickoff,
    openHours,
    lockMinutes,
    status: String(match.status ?? ''),
    predictionStatus: String(match.predictionStatus ?? ''),
    result: /** @type {{ published?: boolean }|undefined} */ (match.result),
    predictionOverride: /** @type {{ isActive?: boolean, status?: string }|undefined} */ (match.predictionOverride),
    now,
  });

  if (
    resolved.phase === MATCH_COUNTDOWN_PHASE.CLOSED
    || resolved.phase === MATCH_COUNTDOWN_PHASE.HIDDEN
  ) {
    return null;
  }

  return {
    phase: resolved.phase,
    targetDate: resolved.targetDate?.toISOString() ?? null,
    label: resolved.label,
    opensAt: resolved.opensAt.toISOString(),
    locksAt: resolved.locksAt.toISOString(),
    kickoffUtc: resolved.kickoffUtc.toISOString(),
  };
}
