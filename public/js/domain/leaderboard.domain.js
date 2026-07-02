/**
 * @fileoverview Leaderboard domain — pure business rules for rankings.
 * @module domain/leaderboard.domain
 */

import { RANK_MOVEMENT } from '../leaderboard/leaderboard.constants.js';

export const LeaderboardDomain = {
  /**
   * @param {boolean} isAdmin
   * @param {boolean} leaderboardVisible
   * @returns {boolean}
   */
  canContestantViewLeaderboard(isAdmin, leaderboardVisible) {
    return isAdmin || leaderboardVisible === true;
  },

  /**
   * Sorts leaderboard entries by points descending, then name ascending.
   * @param {Array<{ totalPoints: number, displayName: string }>} entries
   * @returns {Array<{ totalPoints: number, displayName: string, rank: number }>}
   */
  rankEntries(entries) {
    const sorted = [...entries].sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }

      return a.displayName.localeCompare(b.displayName);
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },

  /**
   * Applies tie-breaker rules to rank entries.
   * @param {Array<Record<string, unknown>>} entries
   * @param {Record<string, unknown>} tieBreakerConfig
   * @returns {Array<Record<string, unknown>>}
   */
  rankEntriesWithTieBreakers(entries, tieBreakerConfig) {
    const strategy = tieBreakerConfig?.strategy || 'totalPoints';
    const secondary = tieBreakerConfig?.secondary || 'displayName';

    const sorted = [...entries].sort((a, b) => {
      // Primary sort
      const primaryA = a[strategy] ?? 0;
      const primaryB = b[strategy] ?? 0;

      if (primaryB !== primaryA) {
        return primaryB - primaryA;
      }

      // Secondary sort
      if (secondary === 'displayName') {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }

      const secondaryA = a[secondary] ?? 0;
      const secondaryB = b[secondary] ?? 0;
      return secondaryB - secondaryA;
    });

    return sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
  },

  /**
   * Calculates rank movement indicator.
   * @param {number|null} currentRank
   * @param {number|null} previousRank
   * @returns {string}
   */
  calculateMovement(currentRank, previousRank) {
    if (!previousRank || previousRank === null) {
      return RANK_MOVEMENT.NEW;
    }

    if (!currentRank || currentRank === null) {
      return RANK_MOVEMENT.SAME;
    }

    if (currentRank < previousRank) {
      return RANK_MOVEMENT.UP;
    }

    if (currentRank > previousRank) {
      return RANK_MOVEMENT.DOWN;
    }

    return RANK_MOVEMENT.SAME;
  },

  /**
   * Calculates prediction accuracy percentage.
   * @param {number} correctPredictions
   * @param {number} totalPredictions
   * @returns {number}
   */
  calculateAccuracy(correctPredictions, totalPredictions) {
    if (totalPredictions === 0) {
      return 0;
    }

    return Math.round((correctPredictions / totalPredictions) * 100);
  },

  /**
   * @param {number} rank
   * @param {number} totalPlayers
   * @returns {boolean}
   */
  isTopRank(rank, totalPlayers) {
    return rank > 0 && rank <= Math.min(3, totalPlayers);
  },

  /**
   * Filters leaderboard entries by search term.
   * @param {Array<Record<string, unknown>>} entries
   * @param {string} searchTerm
   * @returns {Array<Record<string, unknown>>}
   */
  filterBySearch(entries, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
      return entries;
    }

    const term = searchTerm.toLowerCase().trim();
    return entries.filter((entry) => {
      const displayName = (entry.displayName || '').toLowerCase();
      const country = (entry.country || '').toLowerCase();
      return displayName.includes(term) || country.includes(term);
    });
  },

  /**
   * Filters leaderboard entries by rank range.
   * @param {Array<Record<string, unknown>>} entries
   * @param {string} filterType
   * @param {string|null} currentUserId
   * @returns {Array<Record<string, unknown>>}
   */
  filterByRankRange(entries, filterType, currentUserId) {
    switch (filterType) {
      case 'top10':
        return entries.filter((e) => e.rank <= 10);
      case 'top25':
        return entries.filter((e) => e.rank <= 25);
      case 'top50':
        return entries.filter((e) => e.rank <= 50);
      case 'myPosition':
        if (!currentUserId) return entries;

        const userEntry = entries.find((e) => e.userId === currentUserId);
        if (!userEntry) return entries;

        const userRank = userEntry.rank;
        // Show 5 above and 5 below the user
        return entries.filter((e) => Math.abs(e.rank - userRank) <= 5);
      default:
        return entries;
    }
  },

  /**
   * Validates if user can view contestant details in leaderboard.
   * @param {boolean} isAdmin
   * @param {string} viewerUserId
   * @param {string} targetUserId
   * @returns {boolean}
   */
  canViewContestantDetails(isAdmin, viewerUserId, targetUserId) {
    return isAdmin || viewerUserId === targetUserId;
  },
};
