/**
 * @fileoverview Constants for admin contestant prediction history.
 * @module prediction/admin/admin-prediction-history.constants
 */

import { PREDICTION_HISTORY_ROUTES } from '../history/prediction-history.constants.js';

/** @enum {string} */
export const ADMIN_PREDICTION_HISTORY_SORT_FIELD = Object.freeze({
  NAME: 'name',
  TOURNAMENTS: 'tournaments',
  PREDICTIONS: 'predictions',
  POINTS: 'points',
  RANK: 'rank',
});

/** @type {Readonly<number>} */
export const ADMIN_PREDICTION_HISTORY_DEFAULT_PAGE_SIZE = 25;

/** @type {Readonly<number[]>} */
export const ADMIN_PREDICTION_HISTORY_PAGE_SIZE_OPTIONS = Object.freeze([10, 25, 50, 100]);

/** @type {Readonly<Record<string, string>>} */
export const ADMIN_PREDICTION_HISTORY_MESSAGES = Object.freeze({
  LOADING: 'Loading contestants…',
  PERMISSION_DENIED: 'You do not have permission to view prediction history.',
  LOAD_FAILED: 'Unable to load contestants with predictions.',
  EMPTY: 'No contestants have submitted predictions yet.',
  NO_SEARCH_MATCHES: 'No contestants match your search.',
  CONTESTANT_NOT_FOUND: 'Contestant not found.',
});

/** @type {Readonly<Record<string, string>>} */
export const ADMIN_PREDICTION_HISTORY_ROUTES = Object.freeze({
  LIST: PREDICTION_HISTORY_ROUTES.ADMIN_LIST,
});
