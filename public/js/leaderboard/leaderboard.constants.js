/**
 * @fileoverview Leaderboard module constants.
 * @module leaderboard/leaderboard.constants
 */

/** @enum {string} */
export const LEADERBOARD_ROUTES = Object.freeze({
  MAIN: '/leaderboard',
  UNAVAILABLE: '/leaderboard/unavailable',
  HISTORY: '/leaderboard/history',
  ADMIN: '/admin/leaderboard',
});

/** @enum {string} */
export const LEADERBOARD_SORT_OPTIONS = Object.freeze({
  RANK: 'rank',
  POINTS: 'points',
  CORRECT_WINNERS: 'correctWinners',
  EXACT_SCORES: 'exactScores',
  ACCURACY: 'accuracy',
  NAME: 'name',
  MOVEMENT: 'movement',
});

/** @enum {string} */
export const LEADERBOARD_FILTER_TYPES = Object.freeze({
  ALL: 'all',
  TOP_10: 'top10',
  TOP_25: 'top25',
  TOP_50: 'top50',
  MY_POSITION: 'myPosition',
  COUNTRY: 'country',
});

/** @enum {string} */
export const RANK_MOVEMENT = Object.freeze({
  UP: 'up',
  DOWN: 'down',
  SAME: 'same',
  NEW: 'new',
});

/** @type {Readonly<Record<string, string>>} */
export const LEADERBOARD_MESSAGES = Object.freeze({
  LOADING: 'Loading leaderboard...',
  LOADING_STATS: 'Loading statistics...',
  LOADING_HISTORY: 'Loading leaderboard history...',
  NO_DATA: 'No leaderboard data available',
  NO_DATA_MESSAGE: 'Leaderboard rankings will appear here once matches are scored.',
  NOT_ENABLED: 'Leaderboard not available',
  NOT_ENABLED_MESSAGE: 'The tournament organizer has not enabled the leaderboard for this tournament.',
  NO_CONTESTANTS: 'No contestants found',
  NO_CONTESTANTS_MESSAGE: 'No contestants have joined this tournament yet.',
  NO_PREDICTIONS: 'No predictions submitted',
  NO_TOURNAMENT: 'No tournament selected',
  NO_TOURNAMENT_MESSAGE: 'Please select a tournament to view the leaderboard.',
  ERROR_LOADING: 'Failed to load leaderboard',
  ERROR_LOADING_MESSAGE: 'An error occurred while loading the leaderboard. Please try again.',
  REFRESH_SUCCESS: 'Leaderboard refreshed successfully',
  SEARCH_PLACEHOLDER: 'Search contestants...',
  FILTER_ALL: 'All Contestants',
  FILTER_TOP_10: 'Top 10',
  FILTER_TOP_25: 'Top 25',
  FILTER_TOP_50: 'Top 50',
  FILTER_MY_POSITION: 'My Position',
  SORT_BY: 'Sort by',
  LAST_UPDATED: 'Last updated',
  UNAVAILABLE: 'The tournament organizer has not yet made the leaderboard available.',
  DASHBOARD_PENDING: 'Leaderboard will become available once enabled by the tournament organizer.',
});

/** @type {Readonly<Record<string, string>>} */
export const RANK_MOVEMENT_ICONS = Object.freeze({
  [RANK_MOVEMENT.UP]: '↑',
  [RANK_MOVEMENT.DOWN]: '↓',
  [RANK_MOVEMENT.SAME]: '→',
  [RANK_MOVEMENT.NEW]: 'NEW',
});

/** @type {Readonly<Record<string, string>>} */
export const RANK_MOVEMENT_COLORS = Object.freeze({
  [RANK_MOVEMENT.UP]: 'text-success',
  [RANK_MOVEMENT.DOWN]: 'text-danger',
  [RANK_MOVEMENT.SAME]: 'text-muted',
  [RANK_MOVEMENT.NEW]: 'text-info',
});

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

