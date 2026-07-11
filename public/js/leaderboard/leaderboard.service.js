/**
 * @fileoverview Leaderboard service — orchestrates leaderboard data and statistics.
 * @module leaderboard/leaderboard.service
 */

import { leaderboardRepository } from './leaderboard.repository.js';
import { LeaderboardDomain } from '../domain/leaderboard.domain.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { ScoringEngine } from '../scoring/scoring.service.js';
import { ScoringDomain } from '../scoring/scoring.domain.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { Logger } from '../utils/logger.util.js';
import { LEADERBOARD_EVENTS, emitLeaderboardEvent } from './leaderboard.events.js';

/**
 * @typedef {Object} LeaderboardEntry
 * @property {string} userId
 * @property {number} rank
 * @property {number} totalPoints
 * @property {number} correctWinnerCount
 * @property {number} exactScoreCount
 * @property {number} bonusPoints
 * @property {number} accuracy
 * @property {number} matchesPredicted
 * @property {number} matchesRemaining
 * @property {number|null} averageResponseTimeMs
 * @property {number|null} previousRank
 * @property {string} movement
 * @property {string} displayName
 * @property {string|null} photoURL
 * @property {string|null} country
 * @property {boolean} isCurrentUser
 */

/**
 * @typedef {Object} ContestantStatistics
 * @property {string} userId
 * @property {number} currentRank
 * @property {number|null} previousRank
 * @property {number} totalPoints
 * @property {number} correctWinnerCount
 * @property {number} exactScoreCount
 * @property {number} bonusPoints
 * @property {number} accuracy
 * @property {number} predictionsSubmitted
 * @property {number} predictionsRemaining
 * @property {number|null} averageResponseTimeMs
 * @property {string} movement
 */

/**
 * @typedef {Object} TournamentStatistics
 * @property {string} tournamentId
 * @property {string} tournamentName
 * @property {number} totalContestants
 * @property {number} totalMatches
 * @property {number} completedMatches
 * @property {number} remainingMatches
 * @property {number} totalPredictions
 * @property {number} predictionCompletionPercentage
 * @property {number} averageAccuracy
 * @property {number} averagePoints
 * @property {string|null} lastUpdated
 */

class LeaderboardService {
  constructor() {
    /** @type {Map<string, LeaderboardEntry[]>} */
    this.cache = new Map();
    this.cacheTimestamp = null;
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Gets the tournament leaderboard with enriched contestant data.
   * @param {string} tournamentId
   * @param {string|null} currentUserId
   * @param {boolean} useCache
   * @param {{ maxVisibleRank?: number|null }} [options]
   * @returns {Promise<LeaderboardEntry[]>}
   */
  async getTournamentLeaderboard(tournamentId, currentUserId = null, useCache = true, options = {}) {
    const { maxVisibleRank = null } = options;

    try {
      const fullCacheKey = `${tournamentId}:full`;

      if (useCache && this.isCacheValid() && this.cache.has(fullCacheKey)) {
        Logger.info('[LeaderboardService] Returning cached leaderboard');
        return this._finalizeLeaderboardEntries(
          this.cache.get(fullCacheKey),
          currentUserId,
          maxVisibleRank,
        );
      }

      Logger.info('[LeaderboardService] Fetching leaderboard for tournament:', tournamentId);

      const predictions = await leaderboardRepository.listPredictionsByTournament(tournamentId);

      if (predictions.length === 0) {
        Logger.warn('[LeaderboardService] No predictions found for tournament');
        return [];
      }

      const activeMatches = await listMatchesForContestant({ tournamentId });
      const pointsByUser = ScoringDomain.aggregatePointsByUser(predictions);
      const userIds = [...new Set(predictions.map((prediction) => String(prediction.userId ?? '')).filter(Boolean))];

      if (userIds.length === 0) {
        return [];
      }

      await TournamentConfigurationService.load(tournamentId);
      const openHours = TournamentConfigurationService.getPredictionOpenHoursBeforeKickoff();

      const users = await leaderboardRepository.getUsersByIds(userIds);
      const matchById = new Map(activeMatches.map((match) => [match.id, match]));

      const entries = userIds.map((userId) => {
        const userPredictions = predictions.filter((prediction) => prediction.userId === userId);
        const stats = LeaderboardDomain.calculateContestantStats(userPredictions, matchById);
        const participation = LeaderboardDomain.calculatePredictionParticipation(
          userPredictions,
          activeMatches,
        );
        const averageResponseTimeMs = LeaderboardDomain.calculateAverageResponseTime(
          userPredictions,
          matchById,
          openHours,
        );

        const user = users[userId] || {};

        return {
          userId,
          totalPoints: pointsByUser[userId] ?? 0,
          correctWinnerCount: stats.correctWinnerCount,
          exactScoreCount: stats.exactScoreCount,
          bonusPoints: 0,
          accuracy: stats.accuracy,
          matchesPredicted: participation.matchesPredicted,
          matchesRemaining: participation.matchesRemaining,
          averageResponseTimeMs,
          previousRank: null,
          displayName: user.name || user.displayName || user.email?.split('@')[0] || 'Unknown User',
          photoURL: user.photoURL || null,
          country: user.country || null,
          isCurrentUser: userId === currentUserId,
        };
      });

      const rankedEntries = LeaderboardDomain.rankEntriesByStandings(entries);

      // Calculate movement
      const entriesWithMovement = rankedEntries.map((entry) => ({
        ...entry,
        movement: LeaderboardDomain.calculateMovement(entry.rank, entry.previousRank),
      }));

      // Cache the full result
      this.cache.set(fullCacheKey, entriesWithMovement);
      this.cacheTimestamp = Date.now();

      emitLeaderboardEvent(LEADERBOARD_EVENTS.LOADED, { tournamentId, entries: entriesWithMovement });

      return this._finalizeLeaderboardEntries(entriesWithMovement, currentUserId, maxVisibleRank);
    } catch (error) {
      Logger.error('[LeaderboardService] getTournamentLeaderboard failed:', error);
      emitLeaderboardEvent(LEADERBOARD_EVENTS.ERROR, { error });
      throw error;
    }
  }

  /**
   * Gets statistics for a specific contestant in a tournament.
   * @param {string} tournamentId
   * @param {string} userId
   * @param {{ maxVisibleRank?: number|null }} [options]
   * @returns {Promise<ContestantStatistics>}
   */
  async getContestantStatistics(tournamentId, userId, options = {}) {
    const { maxVisibleRank = null } = options;

    try {
      const leaderboard = await this.getTournamentLeaderboard(tournamentId, userId, true, {
        maxVisibleRank: null,
      });
      const userEntry = leaderboard.find((entry) => entry.userId === userId);

      if (!userEntry) {
        return {
          userId,
          currentRank: 0,
          previousRank: null,
          totalPoints: 0,
          correctWinnerCount: 0,
          exactScoreCount: 0,
          bonusPoints: 0,
          accuracy: 0,
          predictionsSubmitted: 0,
          predictionsRemaining: 0,
          averageResponseTimeMs: null,
          movement: 'new',
        };
      }

      const rankVisible = maxVisibleRank === null
        || LeaderboardDomain.isRankVisibleToContestant(userEntry.rank, maxVisibleRank);

      return {
        userId: userEntry.userId,
        currentRank: rankVisible ? userEntry.rank : 0,
        previousRank: userEntry.previousRank,
        totalPoints: userEntry.totalPoints,
        correctWinnerCount: userEntry.correctWinnerCount,
        exactScoreCount: userEntry.exactScoreCount,
        bonusPoints: userEntry.bonusPoints,
        accuracy: userEntry.accuracy,
        predictionsSubmitted: userEntry.matchesPredicted,
        predictionsRemaining: userEntry.matchesRemaining,
        averageResponseTimeMs: userEntry.averageResponseTimeMs,
        movement: userEntry.movement,
      };
    } catch (error) {
      Logger.error('[LeaderboardService] getContestantStatistics failed:', error);
      throw error;
    }
  }

  /**
   * Gets statistics for the entire tournament.
   * @param {string} tournamentId
   * @param {string} tournamentName
   * @returns {Promise<TournamentStatistics>}
   */
  async getTournamentStatistics(tournamentId, tournamentName) {
    try {
      const leaderboard = await this.getTournamentLeaderboard(tournamentId);
      const activeMatches = await listMatchesForContestant({ tournamentId });
      const predictions = await leaderboardRepository.listPredictionsByTournament(tournamentId);
      const activeMatchIds = new Set(activeMatches.map((match) => match.id));
      const activePredictions = predictions.filter((prediction) => (
        activeMatchIds.has(String(prediction.matchId ?? ''))
      ));

      const completedMatches = activeMatches.filter((match) => match.result?.published).length;
      const totalContestants = leaderboard.length;

      const averagePoints = totalContestants > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.totalPoints, 0) / totalContestants)
        : 0;

      const averageAccuracy = totalContestants > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.accuracy, 0) / totalContestants)
        : 0;

      const predictionCompletionPercentage = activeMatches.length > 0 && totalContestants > 0
        ? Math.round((activePredictions.length / (activeMatches.length * totalContestants)) * 100)
        : 0;

      const leaderboardCache = await leaderboardRepository.getLeaderboardCache(tournamentId);
      const lastUpdated = leaderboardCache?.updatedAt
        ? new Date(leaderboardCache.updatedAt.seconds * 1000).toISOString()
        : null;

      return {
        tournamentId,
        tournamentName,
        totalContestants,
        totalMatches: activeMatches.length,
        completedMatches,
        remainingMatches: activeMatches.length - completedMatches,
        totalPredictions: activePredictions.length,
        predictionCompletionPercentage,
        averageAccuracy,
        averagePoints,
        lastUpdated,
      };
    } catch (error) {
      Logger.error('[LeaderboardService] getTournamentStatistics failed:', error);
      throw error;
    }
  }

  /**
   * Filters and sorts leaderboard entries.
   * @param {LeaderboardEntry[]} entries
   * @param {string} searchTerm
   * @param {string} filterType
   * @param {string|null} currentUserId
   * @returns {LeaderboardEntry[]}
   */
  filterAndSort(entries, searchTerm = '', filterType = 'all', currentUserId = null) {
    let filtered = entries;

    // Apply search filter
    if (searchTerm) {
      filtered = LeaderboardDomain.filterBySearch(filtered, searchTerm);
    }

    // Apply rank range filter
    if (filterType !== 'all') {
      filtered = LeaderboardDomain.filterByRankRange(filtered, filterType, currentUserId);
    }

    return filtered;
  }

  /**
   * Refreshes the leaderboard cache.
   * @param {string} tournamentId
   * @param {string|null} currentUserId
   * @param {{ maxVisibleRank?: number|null }} [options]
   * @returns {Promise<LeaderboardEntry[]>}
   */
  async refreshLeaderboard(tournamentId, currentUserId = null, options = {}) {
    this.clearCache();

    try {
      await ScoringEngine.rebuildLeaderboardCache(tournamentId);
    } catch (error) {
      Logger.error('[LeaderboardService] rebuildLeaderboardCache failed:', error);
    }

    const entries = await this.getTournamentLeaderboard(tournamentId, currentUserId, false, options);
    emitLeaderboardEvent(LEADERBOARD_EVENTS.REFRESHED, { tournamentId, entries });
    return entries;
  }

  /**
   * @param {LeaderboardEntry[]} entries
   * @param {string|null} currentUserId
   * @param {number|null} maxVisibleRank
   * @returns {LeaderboardEntry[]}
   */
  _finalizeLeaderboardEntries(entries, currentUserId, maxVisibleRank) {
    const withCurrentUser = entries.map((entry) => ({
      ...entry,
      isCurrentUser: entry.userId === currentUserId,
    }));

    if (maxVisibleRank === null) {
      return withCurrentUser;
    }

    return LeaderboardDomain.limitVisibleEntries(withCurrentUser, maxVisibleRank);
  }

  /**
   * Clears the leaderboard cache.
   * @returns {void}
   */
  clearCache() {
    this.cache.clear();
    this.cacheTimestamp = null;
  }

  /**
   * Checks if cache is still valid.
   * @returns {boolean}
   */
  isCacheValid() {
    if (!this.cacheTimestamp) {
      return false;
    }

    return Date.now() - this.cacheTimestamp < this.cacheDuration;
  }
}

export const leaderboardService = new LeaderboardService();

