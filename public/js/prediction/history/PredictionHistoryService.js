/**
 * @fileoverview Prediction history service — aggregates contestant prediction history data.
 * @module prediction/history/PredictionHistoryService
 */

import { PredictionManagementDomain } from '../../domain/prediction-management.domain.js';
import { PredictionHistoryDomain } from '../../domain/prediction-history.domain.js';
import { filterHistoryItems } from '../../domain/contestant-match-view.domain.js';
import { predictionHistoryRepository } from './PredictionHistoryRepository.js';
import { matchRepository } from '../../match/match.repository.js';
import { normalizeMatchDocument, enrichMatch } from '../../match/match.service.js';
import { getTournamentById } from '../../tournament/tournament.service.js';
import { leaderboardService } from '../../leaderboard/leaderboard.service.js';
import { PlatformSettingsService } from '../../settings/settings.service.js';
import {
  validateUserAccess,
  validatePredictionOwnership,
  validateHistoryQueryParams,
} from './prediction-history.validator.js';
import { PREDICTION_HISTORY_MESSAGES } from './prediction-history.constants.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {import('./prediction-history.validator.js').PredictionHistoryQueryParams} PredictionHistoryQueryParams
 * @typedef {import('../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 * @typedef {import('../../domain/prediction-history.domain.js').OverallStatistics} OverallStatistics
 * @typedef {import('../../domain/prediction-history.domain.js').TournamentSummary} TournamentSummary
 * @typedef {import('../../domain/prediction-history.domain.js').StageStatistics} StageStatistics
 */

/**
 * @typedef {Object} HistoryPageData
 * @property {HistoryItem[]} allItems
 * @property {HistoryItem[]} pageItems
 * @property {OverallStatistics} overallStats
 * @property {TournamentSummary[]} tournamentSummaries
 * @property {StageStatistics[]} stageStats
 * @property {Array<{ id: string, name: string }>} tournaments
 * @property {string[]} stages
 * @property {number} totalPages
 * @property {number} currentPage
 * @property {number} totalRecords
 * @property {number} pageSize
 */

/**
 * @typedef {Object} PredictionDetailData
 * @property {HistoryItem} item
 * @property {import('../../domain/prediction-history.domain.js').LifecycleStep[]} lifecycle
 */

export class PredictionHistoryService {
  constructor() {
    /** @type {Map<string, Record<string, unknown>>} */
    this.matchCache = new Map();
    /** @type {Map<string, Record<string, unknown>>} */
    this.tournamentCache = new Map();
  }

  /**
   * Clears in-memory caches.
   * @returns {void}
   */
  clearCaches() {
    this.matchCache.clear();
    this.tournamentCache.clear();
  }

  /**
   * @param {string} userId
   * @param {string} authUserId
   * @param {PredictionHistoryQueryParams} queryParams
   * @returns {Promise<HistoryPageData>}
   */
  async getHistoryPageData(userId, authUserId, queryParams) {
    const access = validateUserAccess(authUserId, userId);
    if (!access.valid) {
      throw createHistoryError(access.error ?? PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED, 'permission');
    }

    const validation = validateHistoryQueryParams(queryParams);
    if (!validation.valid) {
      throw createHistoryError(PREDICTION_HISTORY_MESSAGES.UNEXPECTED_ERROR, 'validation');
    }

    this.clearCaches();

    const rawPredictions = await predictionHistoryRepository.listByUser(userId);
    const enrichedItems = filterHistoryItems(await this.enrichPredictions(rawPredictions));

    const filtered = PredictionHistoryDomain.filterHistoryItems(enrichedItems, {
      tournamentId: queryParams.tournamentId,
      stage: queryParams.stage,
      matchStatus: queryParams.matchStatus,
      resultFilter: queryParams.resultFilter,
      dateRange: queryParams.dateRange,
      search: queryParams.search,
    });

    const sorted = PredictionHistoryDomain.sortHistoryItems(
      filtered,
      queryParams.sortField,
      queryParams.sortDirection,
    );

    const pagination = PredictionHistoryDomain.paginateHistoryItems(
      sorted,
      queryParams.page,
      queryParams.pageSize,
    );

    const tournamentSummaries = await this.buildTournamentSummaries(
      enrichedItems,
      userId,
    );

    return {
      allItems: enrichedItems,
      pageItems: pagination.pageItems,
      overallStats: PredictionHistoryDomain.calculateOverallStatistics(enrichedItems),
      tournamentSummaries,
      stageStats: PredictionHistoryDomain.calculateStageStatistics(enrichedItems),
      tournaments: extractTournamentOptions(enrichedItems),
      stages: extractStageOptions(enrichedItems),
      totalPages: pagination.totalPages,
      currentPage: pagination.currentPage,
      totalRecords: pagination.totalRecords,
      pageSize: queryParams.pageSize,
    };
  }

  /**
   * @param {string} userId
   * @param {string} authUserId
   * @param {string} predictionId
   * @returns {Promise<PredictionDetailData>}
   */
  async getPredictionDetail(userId, authUserId, predictionId) {
    const access = validateUserAccess(authUserId, userId);
    if (!access.valid) {
      throw createHistoryError(access.error ?? PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED, 'permission');
    }

    if (!predictionId) {
      throw createHistoryError(PREDICTION_HISTORY_MESSAGES.NOT_FOUND, 'not_found');
    }

    const prediction = await predictionHistoryRepository.getById(predictionId);
    const ownership = validatePredictionOwnership(prediction, userId);

    if (!ownership.valid) {
      throw createHistoryError(ownership.error ?? PREDICTION_HISTORY_MESSAGES.NOT_FOUND, 'not_found');
    }

    const [enriched] = await this.enrichPredictions([prediction]);
    const match = enriched.match ?? {};

    return {
      item: enriched,
      lifecycle: PredictionHistoryDomain.buildPredictionLifecycle(enriched, match),
    };
  }

  /**
   * @param {Array<Record<string, unknown>>} predictions
   * @returns {Promise<HistoryItem[]>}
   */
  async enrichPredictions(predictions) {
    const matchIds = [...new Set(predictions.map((item) => String(item.matchId ?? '')).filter(Boolean))];
    const tournamentIds = [...new Set(predictions.map((item) => String(item.tournamentId ?? '')).filter(Boolean))];

    await Promise.all([
      this.loadMatches(matchIds),
      this.loadTournaments(tournamentIds),
    ]);

    return predictions.map((prediction) => {
      const match = this.matchCache.get(String(prediction.matchId)) ?? {};
      const tournament = this.tournamentCache.get(String(prediction.tournamentId)) ?? {};
      const enriched = PredictionManagementDomain.enrichPrediction(prediction, match);

      return {
        ...enriched,
        match,
        tournament,
      };
    });
  }

  /**
   * @param {string[]} matchIds
   * @returns {Promise<void>}
   */
  async loadMatches(matchIds) {
    const missing = matchIds.filter((id) => !this.matchCache.has(id));

    await Promise.all(missing.map(async (matchId) => {
      try {
        const data = await matchRepository.getById(matchId, false);
        if (!data) {
          return;
        }

        const normalized = normalizeMatchDocument(matchId, data);
        const enriched = await enrichMatch(normalized);
        this.matchCache.set(matchId, enriched);
      } catch (error) {
        Logger.warn('[PredictionHistoryService] Failed to load match:', matchId, error);
      }
    }));
  }

  /**
   * @param {string[]} tournamentIds
   * @returns {Promise<void>}
   */
  async loadTournaments(tournamentIds) {
    const missing = tournamentIds.filter((id) => !this.tournamentCache.has(id));

    await Promise.all(missing.map(async (tournamentId) => {
      try {
        const tournament = await getTournamentById(tournamentId);
        if (tournament) {
          this.tournamentCache.set(tournamentId, tournament);
        }
      } catch (error) {
        Logger.warn('[PredictionHistoryService] Failed to load tournament:', tournamentId, error);
      }
    }));
  }

  /**
   * @param {HistoryItem[]} items
   * @param {string} userId
   * @returns {Promise<TournamentSummary[]>}
   */
  async buildTournamentSummaries(items, userId) {
    const summaries = PredictionHistoryDomain.groupByTournament(items);
    await PlatformSettingsService.load();
    const leaderboardEnabled = PlatformSettingsService.isLeaderboardVisible();

    return Promise.all(summaries.map(async (summary) => {
      if (!leaderboardEnabled) {
        return summary;
      }

      try {
        const stats = await leaderboardService.getContestantStatistics(summary.tournamentId, userId);
        return {
          ...summary,
          rank: stats.currentRank > 0 ? stats.currentRank : null,
        };
      } catch (error) {
        Logger.warn('[PredictionHistoryService] Failed to load rank:', summary.tournamentId, error);
        return summary;
      }
    }));
  }

  /**
   * Maps errors to user-facing messages.
   * @param {unknown} error
   * @returns {string}
   */
  mapErrorMessage(error) {
    if (error && typeof error === 'object' && 'code' in error) {
      const code = String(error.code);

      if (code === 'permission-denied') {
        return PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED;
      }

      if (code === 'unavailable') {
        return PREDICTION_HISTORY_MESSAGES.FIRESTORE_UNAVAILABLE;
      }
    }

    if (error && typeof error === 'object' && 'type' in error) {
      const historyError = /** @type {{ message?: string }} */ (error);
      return historyError.message ?? PREDICTION_HISTORY_MESSAGES.UNEXPECTED_ERROR;
    }

    if (error instanceof Error) {
      if (/network|fetch|offline/i.test(error.message)) {
        return PREDICTION_HISTORY_MESSAGES.NETWORK_ERROR;
      }
    }

    return PREDICTION_HISTORY_MESSAGES.UNEXPECTED_ERROR;
  }
}

/**
 * @param {string} message
 * @param {string} type
 * @returns {Error & { type: string }}
 */
function createHistoryError(message, type) {
  const error = new Error(message);
  Object.assign(error, { type });
  return /** @type {Error & { type: string }} */ (error);
}

/**
 * @param {HistoryItem[]} items
 * @returns {Array<{ id: string, name: string }>}
 */
function extractTournamentOptions(items) {
  const map = new Map();

  for (const item of items) {
    const id = String(item.tournamentId ?? '');
    if (!id || map.has(id)) {
      continue;
    }

    const tournament = item.tournament ?? {};
    map.set(id, {
      id,
      name: String(tournament.name ?? tournament.title ?? 'Tournament'),
    });
  }

  return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * @param {HistoryItem[]} items
 * @returns {string[]}
 */
function extractStageOptions(items) {
  const stages = new Set();

  for (const item of items) {
    const stage = String(item.match?.stage ?? item.match?.round ?? '').trim();
    if (stage) {
      stages.add(stage);
    }
  }

  return Array.from(stages).sort((left, right) => left.localeCompare(right));
}

export const predictionHistoryService = new PredictionHistoryService();
