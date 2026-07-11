/**
 * @fileoverview Admin prediction history service — contestant list for prediction history.
 * @module prediction/admin/AdminPredictionHistoryService
 */

import { predictionHistoryRepository } from '../history/PredictionHistoryRepository.js';
import { leaderboardRepository } from '../../leaderboard/leaderboard.repository.js';
import { leaderboardService } from '../../leaderboard/leaderboard.service.js';
import { getActiveTournament } from '../../tournament/tournament.service.js';
import { AdminPredictionHistoryDomain } from '../../domain/admin-prediction-history.domain.js';
import { resolveContestantDisplayName } from './renderers/prediction-display.renderer.js';
import { Logger } from '../../utils/logger.util.js';

/** @typedef {import('../../domain/admin-prediction-history.domain.js').AdminContestantHistoryRow} AdminContestantHistoryRow */
/** @typedef {import('../../domain/admin-prediction-history.domain.js').AdminContestantListQuery} AdminContestantListQuery */

/**
 * @typedef {Object} AdminContestantListResult
 * @property {AdminContestantHistoryRow[]} pageRows
 * @property {AdminContestantHistoryRow[]} allRows
 * @property {number} totalPages
 * @property {number} currentPage
 * @property {number} totalRecords
 * @property {number} pageSize
 * @property {string|null} activeTournamentName
 */

class AdminPredictionHistoryServiceClass {
  /** @type {AdminContestantHistoryRow[]|null} */
  cachedRows = null;

  /**
   * Clears cached contestant rows.
   * @returns {void}
   */
  clearCache() {
    this.cachedRows = null;
  }

  /**
   * @returns {Promise<AdminContestantHistoryRow[]>}
   */
  async loadContestantRows() {
    if (this.cachedRows) {
      return this.cachedRows;
    }

    const aggregates = await predictionHistoryRepository.aggregateByUser();
    const userIds = [...aggregates.keys()];

    if (userIds.length === 0) {
      this.cachedRows = [];
      return this.cachedRows;
    }

    const [usersById, activeTournament] = await Promise.all([
      leaderboardRepository.getUsersByIds(userIds),
      getActiveTournament(),
    ]);

    /** @type {Map<string, { rank: number, totalPoints: number }>} */
    const leaderboardByUserId = new Map();

    if (activeTournament?.id) {
      try {
        const entries = await leaderboardService.getTournamentLeaderboard(activeTournament.id, null, true);
        for (const entry of entries) {
          leaderboardByUserId.set(entry.userId, {
            rank: entry.rank,
            totalPoints: entry.totalPoints,
          });
        }
      } catch (error) {
        Logger.warn('[AdminPredictionHistoryService] Failed to load active tournament leaderboard:', error);
      }
    }

    this.cachedRows = userIds.map((uid) => {
      const aggregate = aggregates.get(uid);
      const profile = usersById[uid] ?? { uid };
      const leaderboardEntry = leaderboardByUserId.get(uid);

      return {
        uid,
        name: resolveContestantDisplayName({ ...profile, uid }),
        photoURL: String(profile.photoURL ?? ''),
        tournamentsJoined: aggregate?.tournamentIds.size ?? 0,
        predictionsSubmitted: aggregate?.predictionsSubmitted ?? 0,
        currentPoints: leaderboardEntry?.totalPoints ?? null,
        currentRank: leaderboardEntry?.rank ?? null,
      };
    });

    return this.cachedRows;
  }

  /**
   * @param {AdminContestantListQuery} query
   * @returns {Promise<AdminContestantListResult>}
   */
  async getContestantList(query) {
    const allRows = await this.loadContestantRows();
    const pagination = AdminPredictionHistoryDomain.applyListQuery(allRows, query);
    const activeTournament = await getActiveTournament();

    return {
      ...pagination,
      allRows,
      pageSize: query.pageSize,
      activeTournamentName: activeTournament?.name ?? activeTournament?.title ?? null,
    };
  }
}

export const adminPredictionHistoryService = new AdminPredictionHistoryServiceClass();
