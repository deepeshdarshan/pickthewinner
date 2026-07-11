/**
 * @fileoverview Scoring engine — evaluates predictions after result publication.
 * @module scoring/scoring.service
 */

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { matchRepository } from '../match/match.repository.js';
import { normalizeMatchDocument } from '../match/match.service.js';
import {
  listPredictionsByMatch,
  updatePrediction,
  resetPredictionScores,
} from '../prediction/prediction.repository.js';
import { leaderboardRepository } from '../leaderboard/leaderboard.repository.js';
import { ScoringDomain } from './scoring.domain.js';
import { SCORING_EVENTS, emitScoringEvent } from './scoring.events.js';
import { writeAuditLog } from '../audit/audit.service.js';
import { Logger } from '../utils/logger.util.js';

export const ScoringEngine = {
  /**
   * @param {string} matchId
   * @returns {Promise<void>}
   */
  async scoreMatch(matchId) {
    await ensureFirestoreOnline();

    const data = await matchRepository.getById(matchId, false);

    if (!data) {
      throw new Error('Match not found.');
    }

    const match = normalizeMatchDocument(matchId, data);
    const result = /** @type {Record<string, unknown>} */ (match.result ?? {});

    await TournamentConfigurationService.load(match.tournamentId);

    const effectiveConfig = ScoringDomain.resolveEffectiveScoringConfig(
      match,
      TournamentConfigurationService.getScoringConfiguration(),
      TournamentConfigurationService.requireWinnerSelectionForDrawPrediction(),
    );

    if (!effectiveConfig) {
      throw new Error('Scoring configuration is incomplete');
    }

    const scoringConfig = {
      correctMatchScorePoints: effectiveConfig.correctMatchScorePoints,
      correctPenaltyWinnerPoints: effectiveConfig.correctPenaltyWinnerPoints,
    };
    const scoringConfigSource = effectiveConfig.source;

    const predictions = await listPredictionsByMatch(matchId);

    for (const prediction of predictions) {
      const evaluation = ScoringDomain.evaluatePrediction(
        prediction,
        {
          ...result,
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
        },
        scoringConfig,
      );

      await updatePrediction(prediction.id, {
        calculatedPoints: evaluation.totalPoints,
        scoringBreakdown: evaluation.breakdown,
        scoringConfigSource,
        scored: true,
        scoredAt: serverTimestamp(),
      });
    }

    await ScoringEngine.rebuildLeaderboardCache(match.tournamentId, matchId);

    await matchRepository.update(matchId, { scoringStatus: 'completed' });

    await writeAuditLog({
      action: 'scoring_completed',
      entityType: 'match',
      entityId: matchId,
      details: {
        predictionsScored: predictions.length,
        scoringConfigSource,
        correctMatchScorePoints: scoringConfig.correctMatchScorePoints,
        correctPenaltyWinnerPoints: scoringConfig.correctPenaltyWinnerPoints,
      },
    });

    emitScoringEvent(SCORING_EVENTS.SCORING_COMPLETED, { matchId, tournamentId: match.tournamentId });
    Logger.info('[ScoringEngine] Scoring completed for match', matchId);
  },

  /**
   * @param {string} matchId
   * @returns {Promise<void>}
   */
  async resetMatchScores(matchId) {
    const data = await matchRepository.getById(matchId, false);

    if (!data) {
      throw new Error('Match not found.');
    }

    const match = normalizeMatchDocument(matchId, data);

    await resetPredictionScores(matchId);
    await ScoringEngine.rebuildLeaderboardCache(match.tournamentId, matchId);
    await matchRepository.update(matchId, { scoringStatus: null });
  },

  /**
   * Rebuilds tournament leaderboard totals from all scored predictions.
   * @param {string} tournamentId
   * @param {string|null} [matchId]
   * @returns {Promise<void>}
   */
  async rebuildLeaderboardCache(tournamentId, matchId = null) {
    await ensureFirestoreOnline();

    const predictions = await leaderboardRepository.listPredictionsByTournament(tournamentId);
    const totals = ScoringDomain.aggregatePointsByUser(predictions);

    await setDoc(doc(db, FIRESTORE_COLLECTIONS.LEADERBOARD_CACHE, tournamentId), {
      tournamentId,
      ...(matchId ? { matchId } : {}),
      totals,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    Logger.info('[ScoringEngine] Leaderboard cache rebuilt for tournament', tournamentId);
  },
};
