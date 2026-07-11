/**
 * @fileoverview Constants for the contestant prediction history module.
 * @module prediction/history/prediction-history.constants
 */

/** @enum {string} */
export const PREDICTION_HISTORY_VIEW = Object.freeze({
  TIMELINE: 'timeline',
  CARD: 'card',
  TABLE: 'table',
});

/** @enum {string} */
export const PREDICTION_HISTORY_SORT_FIELD = Object.freeze({
  MATCH_DATE: 'matchDate',
  POINTS: 'points',
  TOURNAMENT: 'tournament',
  ACCURACY: 'accuracy',
});

/** @enum {string} */
export const PREDICTION_HISTORY_RESULT_FILTER = Object.freeze({
  ALL: 'all',
  WINNER_CORRECT: 'winner_correct',
  WINNER_INCORRECT: 'winner_incorrect',
  EXACT_SCORE_CORRECT: 'exact_score_correct',
  EXACT_SCORE_INCORRECT: 'exact_score_incorrect',
  HIGH_POINTS: 'high_points',
});

/** @enum {string} */
export const PREDICTION_HISTORY_DATE_RANGE = Object.freeze({
  ALL: 'all',
  LAST_30: 'last_30',
  LAST_90: 'last_90',
  THIS_YEAR: 'this_year',
});

/** @enum {string} */
export const PREDICTION_HISTORY_MATCH_STATUS = Object.freeze({
  ALL: 'all',
  COMPLETED: 'completed',
  PENDING: 'pending',
  LOCKED: 'locked',
});

/** @enum {string} */
export const PREDICTION_HISTORY_SCOPE = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

/** @type {Readonly<number>} */
export const PREDICTION_HISTORY_DEFAULT_PAGE_SIZE = 10;

/** @type {Readonly<number[]>} */
export const PREDICTION_HISTORY_PAGE_SIZE_OPTIONS = Object.freeze([10, 25, 50, 100]);

/** @type {Readonly<number>} */
export const PREDICTION_HISTORY_HIGH_POINTS_THRESHOLD = 5;

/** @type {Readonly<number>} */
export const PREDICTION_HISTORY_DEFAULT_LOCK_MINUTES = 15;

/** @enum {string} */
export const PREDICTION_HISTORY_ROUTES = Object.freeze({
  LIST: '/predictions/history',
  ADMIN_LIST: '/admin/prediction-history',
});

/**
 * @param {string} uid
 * @returns {string}
 */
export function adminPredictionHistoryContestantRoute(uid) {
  return `${PREDICTION_HISTORY_ROUTES.ADMIN_LIST}/${encodeURIComponent(uid)}`;
}

/** @type {Readonly<Record<string, string>>} */
export const PREDICTION_HISTORY_MESSAGES = Object.freeze({
  LOADING: 'Loading prediction history…',
  AUTH_REQUIRED: 'Please sign in to view your prediction history.',
  PERMISSION_DENIED: 'You do not have permission to view this prediction.',
  NOT_FOUND: 'Prediction not found.',
  TOURNAMENT_NOT_FOUND: 'Tournament not found.',
  NETWORK_ERROR: 'Network error. Check your connection and try again.',
  FIRESTORE_UNAVAILABLE: 'Unable to reach the database. Please try again later.',
  UNEXPECTED_ERROR: 'Something went wrong. Please try again.',
  NO_PREDICTIONS: 'You have not submitted any predictions yet.',
  NO_PREDICTIONS_ACTIVE: 'No predictions in active tournaments yet.',
  NO_PREDICTIONS_ARCHIVED: 'No archived prediction history yet.',
  NO_FILTER_MATCHES: 'No predictions match your current filters.',
  EMPTY_SEARCH: 'Try adjusting your search or filters.',
});

/** @enum {string} */
export const PREDICTION_LIFECYCLE_STEP = Object.freeze({
  SUBMITTED: 'submitted',
  LOCKED: 'locked',
  MATCH_STARTED: 'match_started',
  MATCH_COMPLETED: 'match_completed',
  RESULTS_PUBLISHED: 'results_published',
  POINTS_AWARDED: 'points_awarded',
});

/** @type {Readonly<Record<string, string>>} */
export const PREDICTION_LIFECYCLE_LABELS = Object.freeze({
  [PREDICTION_LIFECYCLE_STEP.SUBMITTED]: 'Prediction Submitted',
  [PREDICTION_LIFECYCLE_STEP.LOCKED]: 'Prediction Locked',
  [PREDICTION_LIFECYCLE_STEP.MATCH_STARTED]: 'Match Started',
  [PREDICTION_LIFECYCLE_STEP.MATCH_COMPLETED]: 'Match Completed',
  [PREDICTION_LIFECYCLE_STEP.RESULTS_PUBLISHED]: 'Results Published',
  [PREDICTION_LIFECYCLE_STEP.POINTS_AWARDED]: 'Points Awarded',
});
