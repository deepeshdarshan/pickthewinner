/**
 * @fileoverview Constants for the admin prediction management module.
 * @module prediction/admin/prediction-management.constants
 */

/** @enum {string} */
export const PREDICTION_VIEW_MODE = Object.freeze({
  LIST: 'list',
  MATCH: 'match',
  CONTESTANT: 'contestant',
});

/** @enum {string} */
export const PREDICTION_ADMIN_STATUS = Object.freeze({
  NOT_SUBMITTED: 'not_submitted',
  SUBMITTED: 'submitted',
  UPDATED: 'updated',
  LOCKED: 'locked',
  SCORED: 'scored',
});

/** @type {Readonly<Record<string, string>>} */
export const PREDICTION_ADMIN_STATUS_LABELS = Object.freeze({
  [PREDICTION_ADMIN_STATUS.NOT_SUBMITTED]: 'Not Submitted',
  [PREDICTION_ADMIN_STATUS.SUBMITTED]: 'Submitted',
  [PREDICTION_ADMIN_STATUS.UPDATED]: 'Updated',
  [PREDICTION_ADMIN_STATUS.LOCKED]: 'Locked',
  [PREDICTION_ADMIN_STATUS.SCORED]: 'Scored',
});

/** @enum {string} */
export const PREDICTION_SORT_FIELD = Object.freeze({
  MATCH_DATE: 'matchDate',
  CONTESTANT: 'contestant',
  SUBMITTED_AT: 'submittedAt',
  UPDATED_AT: 'updatedAt',
  STATUS: 'status',
  POINTS: 'points',
});

/** @type {Readonly<number>} */
export const PREDICTION_LIST_PAGE_SIZE = 20;

/** @type {Readonly<number[]>} */
export const PREDICTION_PAGE_SIZE_OPTIONS = Object.freeze([10, 25, 50, 100]);

/** @enum {string} */
export const PREDICTION_MANAGEMENT_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/predictions',
});

/** @type {Readonly<Record<string, string>>} */
export const PREDICTION_MANAGEMENT_MESSAGES = Object.freeze({
  LOADING: 'Loading predictions…',
  PERMISSION_DENIED: 'You do not have permission to view predictions.',
  NO_TOURNAMENT: 'Select a tournament to view predictions.',
  NO_PREDICTIONS: 'No predictions have been submitted yet.',
  NO_MATCHES: 'No matches found for this tournament.',
  NO_CONTESTANTS: 'No contestants found for this tournament.',
  ERROR_LOADING: 'Unable to load predictions. Please try again.',
  ERROR_NETWORK: 'Network error. Check your connection and try again.',
  ERROR_PERMISSION: 'Permission denied. Administrator access is required.',
  ERROR_TOURNAMENT: 'Tournament not found.',
  REFRESHED: 'Predictions refreshed.',
  EXPORT_COMING_SOON: 'Export functionality coming soon.',
});
