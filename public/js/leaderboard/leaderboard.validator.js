/**
 * @fileoverview Leaderboard validation rules.
 * @module leaderboard/leaderboard.validator
 */

import { LEADERBOARD_FILTER_TYPES, LEADERBOARD_SORT_OPTIONS } from './leaderboard.constants.js';

export const LeaderboardValidator = {
  /**
   * Validates tournament ID.
   * @param {string} tournamentId
   * @returns {{valid: boolean, error: string|null}}
   */
  validateTournamentId(tournamentId) {
    if (!tournamentId || typeof tournamentId !== 'string') {
      return { valid: false, error: 'Tournament ID is required' };
    }

    if (tournamentId.trim() === '') {
      return { valid: false, error: 'Tournament ID cannot be empty' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates user ID.
   * @param {string} userId
   * @returns {{valid: boolean, error: string|null}}
   */
  validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
      return { valid: false, error: 'User ID is required' };
    }

    if (userId.trim() === '') {
      return { valid: false, error: 'User ID cannot be empty' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates filter type.
   * @param {string} filterType
   * @returns {{valid: boolean, error: string|null}}
   */
  validateFilterType(filterType) {
    const validFilters = Object.values(LEADERBOARD_FILTER_TYPES);

    if (!validFilters.includes(filterType)) {
      return { valid: false, error: 'Invalid filter type' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates sort option.
   * @param {string} sortOption
   * @returns {{valid: boolean, error: string|null}}
   */
  validateSortOption(sortOption) {
    const validSorts = Object.values(LEADERBOARD_SORT_OPTIONS);

    if (!validSorts.includes(sortOption)) {
      return { valid: false, error: 'Invalid sort option' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates search term.
   * @param {string} searchTerm
   * @returns {{valid: boolean, error: string|null}}
   */
  validateSearchTerm(searchTerm) {
    if (typeof searchTerm !== 'string') {
      return { valid: false, error: 'Search term must be a string' };
    }

    if (searchTerm.length > 100) {
      return { valid: false, error: 'Search term is too long (max 100 characters)' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates page size.
   * @param {number} pageSize
   * @returns {{valid: boolean, error: string|null}}
   */
  validatePageSize(pageSize) {
    if (typeof pageSize !== 'number' || !Number.isInteger(pageSize)) {
      return { valid: false, error: 'Page size must be an integer' };
    }

    if (pageSize < 1) {
      return { valid: false, error: 'Page size must be at least 1' };
    }

    if (pageSize > 100) {
      return { valid: false, error: 'Page size cannot exceed 100' };
    }

    return { valid: true, error: null };
  },

  /**
   * Validates leaderboard entry structure.
   * @param {unknown} entry
   * @returns {{valid: boolean, error: string|null}}
   */
  validateLeaderboardEntry(entry) {
    if (!entry || typeof entry !== 'object') {
      return { valid: false, error: 'Entry must be an object' };
    }

    const required = ['userId', 'rank', 'totalPoints', 'displayName'];
    for (const field of required) {
      if (!(field in entry)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    if (typeof entry.rank !== 'number' || entry.rank < 1) {
      return { valid: false, error: 'Rank must be a positive number' };
    }

    if (typeof entry.totalPoints !== 'number' || entry.totalPoints < 0) {
      return { valid: false, error: 'Total points must be a non-negative number' };
    }

    return { valid: true, error: null };
  },
};

