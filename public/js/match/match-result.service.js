/**
 * @fileoverview Match result service — publish and recalculate official results.
 * @module match/match-result.service
 */

import { serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MATCH_STATUS } from '../domain/match.domain.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { MATCH_MESSAGES } from './match.constants.js';
import { validateResultPayload } from './match.validator.js';
import { matchRepository } from './match.repository.js';
import { normalizeMatchDocument } from './match.service.js';
import { MATCH_EVENTS, emitMatchEvent } from './match.events.js';
import { ScoringEngine } from '../scoring/scoring.service.js';
import { writeAuditLog } from '../audit/audit.service.js';

/**
 * @param {string} matchId
 * @param {Record<string, unknown>} payload
 * @returns {Promise<void>}
 */
export async function publishMatchResult(matchId, payload) {
  const data = await matchRepository.getById(matchId, false);

  if (!data) {
    throw new Error(MATCH_MESSAGES.NOT_FOUND);
  }

  const match = normalizeMatchDocument(matchId, data);

  if (!match || match.status !== MATCH_STATUS.COMPLETED) {
    throw new Error('Result can only be published for completed matches.');
  }

  await TournamentConfigurationService.load(match.tournamentId);
  const tournamentConfig = {
    requiresWinner: TournamentConfigurationService.requiresWinner(),
  };

  const validation = validateResultPayload(
    payload,
    tournamentConfig,
    match.homeTeamId,
    match.awayTeamId,
  );

  if (!validation.valid) {
    throw Object.assign(new Error(MATCH_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();
  const result = {
    homeScore: Number(payload.homeScore),
    awayScore: Number(payload.awayScore),
    winnerResolution: String(payload.winnerResolution),
    winningTeamId: String(payload.winningTeamId ?? ''),
    notes: String(payload.notes ?? ''),
    published: true,
    publishedAt: serverTimestamp(),
    publishedBy: user?.uid ?? '',
  };

  await matchRepository.update(matchId, {
    result,
    status: MATCH_STATUS.RESULT_PUBLISHED,
    updatedBy: user?.uid ?? '',
    updatedAt: serverTimestamp(),
  });

  await writeAuditLog({
    action: 'match_result_published',
    entityType: 'match',
    entityId: matchId,
    details: { homeScore: result.homeScore, awayScore: result.awayScore },
  });

  await ScoringEngine.scoreMatch(matchId);
  emitMatchEvent(MATCH_EVENTS.MATCH_RESULT_PUBLISHED, { matchId, result });
}

/**
 * @param {string} matchId
 * @param {Record<string, unknown>} payload
 * @returns {Promise<void>}
 */
export async function recalculateMatchScores(matchId, payload) {
  const data = await matchRepository.getById(matchId, false);

  if (!data) {
    throw new Error(MATCH_MESSAGES.NOT_FOUND);
  }

  const match = normalizeMatchDocument(matchId, data);

  if (match.status !== MATCH_STATUS.RESULT_PUBLISHED) {
    throw new Error('Scores can only be recalculated after a result has been published.');
  }

  await ScoringEngine.resetMatchScores(matchId);

  const user = getCurrentUser();
  const result = {
    homeScore: Number(payload.homeScore),
    awayScore: Number(payload.awayScore),
    winnerResolution: String(payload.winnerResolution),
    winningTeamId: String(payload.winningTeamId ?? ''),
    notes: String(payload.notes ?? ''),
    published: true,
    publishedAt: serverTimestamp(),
    publishedBy: user?.uid ?? '',
  };

  await matchRepository.update(matchId, {
    result,
    updatedBy: user?.uid ?? '',
    updatedAt: serverTimestamp(),
  });

  await ScoringEngine.scoreMatch(matchId);

  await writeAuditLog({
    action: 'match_scores_recalculated',
    entityType: 'match',
    entityId: matchId,
    details: {},
  });

  emitMatchEvent(MATCH_EVENTS.MATCH_RESULT_PUBLISHED, { matchId, result });
}
