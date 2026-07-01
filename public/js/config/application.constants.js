/**
 * @fileoverview Application-wide constants.
 * @module config/application.constants
 */

/** @enum {string} */
export const USER_ROLES = Object.freeze({
  CONTESTANT: 'contestant',
  ADMIN: 'admin',
});

/** @enum {string} */
export const MATCH_STATES = Object.freeze({
  HIDDEN: 'hidden',
  OPEN: 'open',
  LOCKED: 'locked',
  LIVE: 'live',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

/** @enum {string} */
export const FIRESTORE_COLLECTIONS = Object.freeze({
  USERS: 'users',
  TOURNAMENTS: 'tournaments',
  MATCHES: 'matches',
  PREDICTIONS: 'predictions',
  SETTINGS: 'settings',
  LEADERBOARD_CACHE: 'leaderboard_cache',
});

/** @enum {string} */
export const TOAST_TYPES = Object.freeze({
  SUCCESS: 'success',
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
});

/** @enum {string} */
export const STORAGE_KEYS = Object.freeze({
  THEME: 'ptw_theme',
  LAST_ROUTE: 'ptw_last_route',
});

/**
 * UI messages used across the application shell.
 * @type {Readonly<Record<string, string>>}
 */
export const MESSAGES = Object.freeze({
  LOADING: 'Loading…',
  COMING_SOON: 'This feature is coming soon.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  CONFIRM_DEFAULT_TITLE: 'Confirm Action',
  CONFIRM_DEFAULT_MESSAGE: 'Are you sure you want to continue?',
  CONFIRM_DEFAULT_CONFIRM: 'Confirm',
  CONFIRM_DEFAULT_CANCEL: 'Cancel',
  NOT_FOUND_TITLE: 'Page Not Found',
  NOT_FOUND: 'The page you requested does not exist or has been moved.',
  RETURN_HOME: 'Return Home',
});
