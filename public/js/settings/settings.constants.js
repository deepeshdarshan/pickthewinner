/**
 * @fileoverview Platform settings constants.
 * @module settings/settings.constants
 */

/** @enum {string} */
export const SETTINGS_COLLECTIONS = Object.freeze({
  SETTINGS: 'settings',
});

/** @enum {string} */
export const SETTINGS_DOCUMENTS = Object.freeze({
  GENERAL: 'general',
});

/** @type {Readonly<Record<string, unknown>>} */
export const DEFAULT_PLATFORM_SETTINGS = Object.freeze({
  leaderboardVisible: false,
});

/** @enum {string} */
export const SETTINGS_MESSAGES = Object.freeze({
  LOADING: 'Loading settings…',
  SAVING: 'Saving settings…',
  SAVED: 'Settings saved successfully.',
  ERROR_LOADING: 'Failed to load settings.',
  ERROR_SAVING: 'Failed to save settings.',
  PERMISSION_DENIED: 'You do not have permission to update settings.',
});
