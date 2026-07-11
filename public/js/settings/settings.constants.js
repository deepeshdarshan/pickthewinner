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

/** @type {ReadonlyArray<number>} */
export const CONTESTANT_LEADERBOARD_LIMIT_OPTIONS = Object.freeze([3, 5, 10, 20, 30, 50]);

/** @type {Readonly<number>} */
export const CONTESTANT_LEADERBOARD_LIMIT_MIN = CONTESTANT_LEADERBOARD_LIMIT_OPTIONS[0];

/** @type {Readonly<number>} */
export const CONTESTANT_LEADERBOARD_LIMIT_MAX = CONTESTANT_LEADERBOARD_LIMIT_OPTIONS[
  CONTESTANT_LEADERBOARD_LIMIT_OPTIONS.length - 1
];

/** @type {Readonly<number>} */
export const DEFAULT_CONTESTANT_LEADERBOARD_LIMIT = 10;

/**
 * Resolves a contestant leaderboard limit to one of the allowed options.
 * Legacy values snap to the nearest allowed option.
 * @param {unknown} value
 * @returns {number}
 */
export function resolveContestantLeaderboardLimit(value) {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric)) {
    return DEFAULT_CONTESTANT_LEADERBOARD_LIMIT;
  }

  if (CONTESTANT_LEADERBOARD_LIMIT_OPTIONS.includes(numeric)) {
    return numeric;
  }

  if (numeric <= CONTESTANT_LEADERBOARD_LIMIT_MIN) {
    return CONTESTANT_LEADERBOARD_LIMIT_MIN;
  }

  if (numeric >= CONTESTANT_LEADERBOARD_LIMIT_MAX) {
    return CONTESTANT_LEADERBOARD_LIMIT_MAX;
  }

  return CONTESTANT_LEADERBOARD_LIMIT_OPTIONS.reduce((nearest, option) => (
    Math.abs(option - numeric) < Math.abs(nearest - numeric) ? option : nearest
  ));
}

/** @type {Readonly<Record<string, unknown>>} */
export const DEFAULT_PLATFORM_SETTINGS = Object.freeze({
  leaderboardVisible: false,
  contestantLeaderboardLimit: DEFAULT_CONTESTANT_LEADERBOARD_LIMIT,
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
