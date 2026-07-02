/**
 * @fileoverview Leaderboard service — orchestrates leaderboard data and statistics.
 * @module leaderboard/leaderboard.service
 */

import { leaderboardRepository } from './leaderboard.repository.js';
import { LeaderboardDomain } from '../domain/leaderboard.domain.js';
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
   * @returns {Promise<LeaderboardEntry[]>}
   */
  async getTournamentLeaderboard(tournamentId, currentUserId = null, useCache = true) {
    try {
      const cacheKey = `${tournamentId}:${currentUserId}`;

      if (useCache && this.isCacheValid() && this.cache.has(cacheKey)) {
        Logger.info('[LeaderboardService] Returning cached leaderboard');
        return this.cache.get(cacheKey);
      }

      Logger.info('[LeaderboardService] Fetching leaderboard for tournament:', tournamentId);

      // Get leaderboard cache with user points
      const leaderboardCache = await leaderboardRepository.getLeaderboardCache(tournamentId);

      if (!leaderboardCache || !leaderboardCache.totals) {
        Logger.warn('[LeaderboardService] No leaderboard data found');
        return [];
      }

      // Get all predictions to calculate detailed statistics
      const predictions = await leaderboardRepository.listPredictionsByTournament(tournamentId);
      const matches = await leaderboardRepository.listMatchesByTournament(tournamentId);

      // Get unique user IDs
      const userIds = Object.keys(leaderboardCache.totals);

      if (userIds.length === 0) {
        return [];
      }

      // Fetch user data
      const users = await leaderboardRepository.getUsersByIds(userIds);

      // Build leaderboard entries
      const entries = userIds.map((userId) => {
        const userPredictions = predictions.filter((p) => p.userId === userId);
        const scoredPredictions = userPredictions.filter((p) => p.scored === true);
        const correctWinners = scoredPredictions.filter((p) =>
          p.scoringBreakdown?.correctMatchScore || p.scoringBreakdown?.correctPenaltyWinner
        ).length;
        const exactScores = scoredPredictions.filter((p) =>
          p.scoringBreakdown?.correctMatchScore
        ).length;

        const user = users[userId] || {};
        const totalPoints = leaderboardCache.totals[userId] || 0;
        const accuracy = LeaderboardDomain.calculateAccuracy(correctWinners, scoredPredictions.length);

        return {
          userId,
          totalPoints,
          correctWinnerCount: correctWinners,
          exactScoreCount: exactScores,
          bonusPoints: 0, // TODO: Implement bonus points if needed
          accuracy,
          matchesPredicted: userPredictions.length,
          matchesRemaining: matches.length - userPredictions.length,
          previousRank: null, // TODO: Implement historical rank tracking
          displayName: user.displayName || 'Unknown User',
          photoURL: user.photoURL || null,
          country: user.country || null,
          isCurrentUser: userId === currentUserId,
        };
      });

      // Load tournament configuration for tie-breaker rules
      await TournamentConfigurationService.load(tournamentId);
      const tieBreakerConfig = TournamentConfigurationService.getTieBreakerConfig();

      // Rank entries with tie-breakers
      const rankedEntries = LeaderboardDomain.rankEntriesWithTieBreakers(entries, tieBreakerConfig);

      // Calculate movement
      const entriesWithMovement = rankedEntries.map((entry) => ({
        ...entry,
        movement: LeaderboardDomain.calculateMovement(entry.rank, entry.previousRank),
      }));

      // Cache the result
      this.cache.set(cacheKey, entriesWithMovement);
      this.cacheTimestamp = Date.now();

      emitLeaderboardEvent(LEADERBOARD_EVENTS.LOADED, { tournamentId, entries: entriesWithMovement });

      return entriesWithMovement;
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
   * @returns {Promise<ContestantStatistics>}
   */
  async getContestantStatistics(tournamentId, userId) {
    try {
      const leaderboard = await this.getTournamentLeaderboard(tournamentId, userId);
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
          movement: 'new',
        };
      }

      return {
        userId: userEntry.userId,
        currentRank: userEntry.rank,
        previousRank: userEntry.previousRank,
        totalPoints: userEntry.totalPoints,
        correctWinnerCount: userEntry.correctWinnerCount,
        exactScoreCount: userEntry.exactScoreCount,
        bonusPoints: userEntry.bonusPoints,
        accuracy: userEntry.accuracy,
        predictionsSubmitted: userEntry.matchesPredicted,
        predictionsRemaining: userEntry.matchesRemaining,
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
      const matches = await leaderboardRepository.listMatchesByTournament(tournamentId);
      const predictions = await leaderboardRepository.listPredictionsByTournament(tournamentId);

      const completedMatches = matches.filter((m) => m.result?.published).length;
      const totalContestants = leaderboard.length;

      const averagePoints = totalContestants > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.totalPoints, 0) / totalContestants)
        : 0;

      const averageAccuracy = totalContestants > 0
        ? Math.round(leaderboard.reduce((sum, e) => sum + e.accuracy, 0) / totalContestants)
        : 0;

      const predictionCompletionPercentage = matches.length > 0
        ? Math.round((predictions.length / (matches.length * totalContestants)) * 100)
        : 0;

      const leaderboardCache = await leaderboardRepository.getLeaderboardCache(tournamentId);
      const lastUpdated = leaderboardCache?.updatedAt
        ? new Date(leaderboardCache.updatedAt.seconds * 1000).toISOString()
        : null;

      return {
        tournamentId,
        tournamentName,
        totalContestants,
        totalMatches: matches.length,
        completedMatches,
        remainingMatches: matches.length - completedMatches,
        totalPredictions: predictions.length,
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
   * @returns {Promise<LeaderboardEntry[]>}
   */
  async refreshLeaderboard(tournamentId, currentUserId = null) {
    this.clearCache();
    const entries = await this.getTournamentLeaderboard(tournamentId, currentUserId, false);
    emitLeaderboardEvent(LEADERBOARD_EVENTS.REFRESHED, { tournamentId, entries });
    return entries;
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

