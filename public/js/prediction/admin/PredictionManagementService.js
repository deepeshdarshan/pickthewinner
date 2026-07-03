/**
 * @fileoverview Prediction management service — admin read-only prediction operations.
 * @module prediction/admin/PredictionManagementService
 */

import { BaseFirestoreService } from '../../services/BaseFirestoreService.js';
import { matchRepository } from '../../match/match.repository.js';
import { normalizeMatchDocument } from '../../match/match.service.js';
import { getTournamentById } from '../../tournament/tournament.service.js';
import { PredictionManagementDomain } from '../../domain/prediction-management.domain.js';
import { predictionManagementRepository } from './PredictionManagementRepository.js';
import { PredictionStatisticsService } from './PredictionStatisticsService.js';
import { PREDICTION_MANAGEMENT_MESSAGES } from './prediction-management.constants.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {Object} TournamentPredictionData
 * @property {string} tournamentId
 * @property {Record<string, unknown>} tournament
 * @property {Array<Record<string, unknown>>} matches
 * @property {Array<import('../../domain/prediction-management.domain.js').EnrichedPrediction>} predictions
 * @property {Record<string, Record<string, unknown>>} users
 * @property {import('./PredictionStatisticsService.js').TournamentStatistics} statistics
 * @property {Date} loadedAt
 */

class PredictionManagementServiceClass extends BaseFirestoreService {
  constructor() {
    super({
      collectionName: 'predictions',
      serviceName: 'PredictionManagementService',
    });

    /** @type {Map<string, TournamentPredictionData>} */
    this.tournamentCache = new Map();
  }

  /**
   * Loads and enriches all prediction data for a tournament.
   * @param {string} tournamentId
   * @param {boolean} [forceRefresh=false]
   * @returns {Promise<TournamentPredictionData>}
   */
  async loadTournamentData(tournamentId, forceRefresh = false) {
    if (!tournamentId) {
      throw new Error(PREDICTION_MANAGEMENT_MESSAGES.NO_TOURNAMENT);
    }

    if (!forceRefresh && this.tournamentCache.has(tournamentId)) {
      return this.tournamentCache.get(tournamentId);
    }

    try {
      const [tournament, rawPredictions, rawMatches] = await Promise.all([
        getTournamentById(tournamentId),
        predictionManagementRepository.listByTournament(tournamentId),
        matchRepository.listByTournament(tournamentId),
      ]);

      if (!tournament) {
        throw new Error(PREDICTION_MANAGEMENT_MESSAGES.ERROR_TOURNAMENT);
      }

      const matches = rawMatches.map((match) => normalizeMatchDocument(match.id, match));
      const matchMap = new Map(matches.map((match) => [match.id, match]));
      const userIds = [...new Set(rawPredictions.map((item) => String(item.userId ?? '')))];
      const users = await predictionManagementRepository.getUsersByIds(userIds);

      const predictions = rawPredictions.map((prediction) => {
        const match = matchMap.get(prediction.matchId) ?? {};
        const enriched = PredictionManagementDomain.enrichPrediction(prediction, match);
        return {
          ...enriched,
          contestant: users[prediction.userId] ?? { uid: prediction.userId },
          match,
          tournament,
        };
      });

      const contestantCount = Object.keys(users).length || predictions.length;
      const statistics = PredictionStatisticsService.calculateTournamentStatistics(
        predictions,
        matches,
        contestantCount,
      );

      const data = {
        tournamentId,
        tournament,
        matches,
        predictions,
        users,
        statistics,
        loadedAt: new Date(),
      };

      this.tournamentCache.set(tournamentId, data);
      return data;
    } catch (error) {
      Logger.error('[PredictionManagementService] loadTournamentData failed:', tournamentId, error);
      throw error;
    }
  }

  /**
   * Lazy-loads a single prediction detail with full enrichment.
   * @param {string} predictionId
   * @param {TournamentPredictionData} [cachedData]
   * @returns {Promise<import('../../domain/prediction-management.domain.js').EnrichedPrediction|null>}
   */
  async getPredictionDetail(predictionId, cachedData = null) {
    if (cachedData) {
      const cached = cachedData.predictions.find((item) => item.id === predictionId);
      if (cached) {
        return cached;
      }
    }

    const prediction = await predictionManagementRepository.getById(predictionId);

    if (!prediction) {
      return null;
    }

    const [matchData, tournament, users] = await Promise.all([
      matchRepository.getById(String(prediction.matchId), true),
      getTournamentById(String(prediction.tournamentId)),
      predictionManagementRepository.getUsersByIds([String(prediction.userId)]),
    ]);

    const match = matchData
      ? normalizeMatchDocument(String(prediction.matchId), matchData)
      : {};

    const enriched = PredictionManagementDomain.enrichPrediction(prediction, match);

    return {
      ...enriched,
      contestant: users[prediction.userId] ?? { uid: prediction.userId },
      match,
      tournament: tournament ?? { id: prediction.tournamentId },
    };
  }

  /**
   * Returns unique stages from matches.
   * @param {Array<Record<string, unknown>>} matches
   * @returns {string[]}
   */
  getAvailableStages(matches) {
    const stages = new Set();

    for (const match of matches) {
      const stage = String(match.stage ?? match.round ?? '').trim();
      if (stage) {
        stages.add(stage);
      }
    }

    return [...stages].sort();
  }

  /**
   * Returns contestants who have submitted predictions.
   * @param {TournamentPredictionData} data
   * @returns {Array<Record<string, unknown>>}
   */
  getContestantsWithPredictions(data) {
    const seen = new Set();
    const contestants = [];

    for (const prediction of data.predictions) {
      if (seen.has(prediction.userId)) {
        continue;
      }

      seen.add(prediction.userId);
      contestants.push(prediction.contestant ?? { uid: prediction.userId });
    }

    return contestants.sort((left, right) => {
      const leftName = String(left.displayName ?? left.fullName ?? left.email ?? '');
      const rightName = String(right.displayName ?? right.fullName ?? right.email ?? '');
      return leftName.localeCompare(rightName);
    });
  }

  /**
   * Clears cached tournament data.
   * @param {string} [tournamentId]
   * @returns {void}
   */
  clearTournamentCache(tournamentId) {
    if (tournamentId) {
      this.tournamentCache.delete(tournamentId);
      return;
    }

    this.tournamentCache.clear();
  }

  /**
   * Export stub for future Excel export.
   * @param {string} tournamentId
   * @returns {Promise<{ format: string, status: string }>}
   */
  async exportPredictionsToExcel(tournamentId) {
    await this.loadTournamentData(tournamentId);
    return { format: 'xlsx', status: 'not_implemented' };
  }

  /**
   * Export stub for future PDF export.
   * @param {string} tournamentId
   * @returns {Promise<{ format: string, status: string }>}
   */
  async exportPredictionsToPdf(tournamentId) {
    await this.loadTournamentData(tournamentId);
    return { format: 'pdf', status: 'not_implemented' };
  }
}

export const predictionManagementService = new PredictionManagementServiceClass();
