/**
 * @fileoverview Leaderboard domain — pure business rules for rankings.
 * @module domain/leaderboard.domain
 */

import { RANK_MOVEMENT } from '../leaderboard/leaderboard.constants.js';
import {
  CONTESTANT_LEADERBOARD_LIMIT_MAX,
  DEFAULT_CONTESTANT_LEADERBOARD_LIMIT,
} from '../settings/settings.constants.js';
import { MatchDomain } from './match.domain.js';
import { PredictionManagementDomain } from './prediction-management.domain.js';

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
   * Resolves contestant leaderboard visibility limit (1–10, default 10).
   * @param {unknown} value
   * @returns {number}
   */
  resolveContestantLeaderboardLimit(value) {
    const numeric = typeof value === 'number' ? value : Number(value);

    if (!Number.isInteger(numeric)) {
      return DEFAULT_CONTESTANT_LEADERBOARD_LIMIT;
    }

    if (numeric < 1) {
      return 1;
    }

    if (numeric > CONTESTANT_LEADERBOARD_LIMIT_MAX) {
      return CONTESTANT_LEADERBOARD_LIMIT_MAX;
    }

    return numeric;
  },

  /**
   * Returns entries visible to contestants within the configured top-N limit.
   * @param {Array<Record<string, unknown>>} entries
   * @param {unknown} limit
   * @returns {Array<Record<string, unknown>>}
   */
  limitVisibleEntries(entries, limit) {
    const resolvedLimit = LeaderboardDomain.resolveContestantLeaderboardLimit(limit);
    return entries.filter((entry) => Number(entry.rank) <= resolvedLimit);
  },

  /**
   * @param {unknown} rank
   * @param {unknown} limit
   * @returns {boolean}
   */
  isRankVisibleToContestant(rank, limit) {
    const numericRank = typeof rank === 'number' ? rank : Number(rank);

    if (!Number.isInteger(numericRank) || numericRank < 1) {
      return false;
    }

    return numericRank <= LeaderboardDomain.resolveContestantLeaderboardLimit(limit);
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
   * Keeps only contestant-visible, non-archived matches.
   * @param {Array<Record<string, unknown>>} matches
   * @returns {Array<Record<string, unknown>>}
   */
  filterActiveContestantMatches(matches) {
    return matches.filter((match) => MatchDomain.isVisibleToContestants(
      String(match.status ?? ''),
      Boolean(match.visible),
    ));
  },

  /**
   * Calculates how many active matches a contestant has predicted vs still pending.
   * @param {Array<Record<string, unknown>>} userPredictions
   * @param {Array<Record<string, unknown>>} activeMatches
   * @returns {{ matchesPredicted: number, matchesRemaining: number }}
   */
  calculatePredictionParticipation(userPredictions, activeMatches) {
    const activeMatchIds = new Set(activeMatches.map((match) => String(match.id)));
    const activePredictions = userPredictions.filter((prediction) => (
      activeMatchIds.has(String(prediction.matchId ?? ''))
    ));

    return {
      matchesPredicted: activePredictions.length,
      matchesRemaining: Math.max(activeMatches.length - activePredictions.length, 0),
    };
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
   * Calculates contestant prediction stats from published match results.
   * @param {Array<Record<string, unknown>>} predictions
   * @param {Map<string, Record<string, unknown>>} matchById
   * @returns {{ correctWinnerCount: number, exactScoreCount: number, accuracy: number, completedCount: number }}
   */
  calculateContestantStats(predictions, matchById) {
    let correctWinnerCount = 0;
    let exactScoreCount = 0;
    let completedCount = 0;

    for (const prediction of predictions) {
      const match = matchById.get(String(prediction.matchId ?? ''));
      if (!match?.result?.published) {
        continue;
      }

      const enriched = PredictionManagementDomain.enrichPrediction(prediction, match);
      completedCount += 1;

      if (enriched.winnerPredictionCorrect) {
        correctWinnerCount += 1;
      }

      if (enriched.exactScoreCorrect) {
        exactScoreCount += 1;
      }
    }

    return {
      correctWinnerCount,
      exactScoreCount,
      accuracy: LeaderboardDomain.calculateAccuracy(correctWinnerCount, completedCount),
      completedCount,
    };
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
