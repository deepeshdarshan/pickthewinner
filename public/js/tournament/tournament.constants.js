/**
 * @fileoverview Tournament module constants — collections, routes, defaults, and messages.
 * @module tournament/tournament.constants
 */

import { appSettings } from '../config/app.config.js';
import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { TOURNAMENT_STATUS, TOURNAMENT_VISIBILITY } from '../domain/tournament.domain.js';

export { TOURNAMENT_STATUS, TOURNAMENT_VISIBILITY };

/** @enum {string} */
export const TOURNAMENT_COLLECTIONS = Object.freeze({
  TOURNAMENTS: FIRESTORE_COLLECTIONS.TOURNAMENTS,
});

/** @enum {string} */
export const TOURNAMENT_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/tournaments',
  ARCHIVED_LIST: '/admin/tournaments/archived',
  CONTESTANT_LIST: '/tournaments',
});

/** @type {Readonly<string>} */
export const DEFAULT_TOURNAMENT_TIMEZONE = appSettings.timezone;

/** @type {Readonly<string>} */
export const TOURNAMENT_TIMEZONE_LABEL = appSettings.timezoneLabel;

/** @type {Readonly<string[]>} */
export const SPORT_OPTIONS = Object.freeze([
  'Football',
  'Cricket',
  'Basketball',
  'Tennis',
  'Hockey',
  'Other',
]);

/** @type {Readonly<string[]>} */
export const TOURNAMENT_TYPE_OPTIONS = Object.freeze([
  'League',
  'Knockout',
  'Group + Knockout',
  'IPL',
  'FIFA World Cup',
  'UEFA Champions League',
  'UEFA Euro',
  'Copa América',
  'Cricket World Cup',
  'EPL',
  'LaLiga',
  'Other',
]);

/** @type {Readonly<{ strategy: string, secondary: string }>} */
export const DEFAULT_TIE_BREAKER_CONFIG = Object.freeze({
  strategy: 'totalPoints',
  secondary: 'correctWinnerPredictions',
});

/** @type {Readonly<number>} */
export const SCORING_POINTS_MIN = 0;

/** @type {Readonly<number>} */
export const SCORING_POINTS_MAX = 100;

/** @type {Readonly<number>} */
export const PREDICTION_LOCK_MINUTES_MIN = 1;

/** @type {Readonly<number>} */
export const PREDICTION_LOCK_MINUTES_MAX = 60;

/** @type {Readonly<number>} */
export const DEFAULT_PREDICTION_LOCK_MINUTES = 10;

/** @type {Readonly<number>} */
export const PREDICTION_OPEN_HOURS_MIN = 1;

/** @type {Readonly<number>} */
export const PREDICTION_OPEN_HOURS_MAX = 168;

/** @type {Readonly<number>} */
export const DEFAULT_PREDICTION_OPEN_HOURS = 48;

/** @type {Readonly<Record<string, string>>} */
export const SCORING_VALIDATION_MESSAGES = Object.freeze({
  MATCH_SCORE_POINTS_REQUIRED: 'Points for correct match score are required.',
  MATCH_SCORE_POINTS_INVALID: 'Match score points must be a whole number between 0 and 100.',
  PENALTY_WINNER_POINTS_REQUIRED: 'Points for correct penalty shootout winner are required.',
  PENALTY_WINNER_POINTS_INVALID: 'Penalty winner points must be a whole number between 0 and 100.',
  PREDICTION_LOCK_MINUTES_REQUIRED: 'Prediction lock minutes are required.',
  PREDICTION_LOCK_MINUTES_INVALID: 'Prediction lock minutes must be between 1 and 60.',
  PREDICTION_OPEN_HOURS_REQUIRED: 'Prediction open hours are required.',
  PREDICTION_OPEN_HOURS_INVALID: 'Prediction open hours must be between 1 and 168.',
});

/** @type {ReadonlySet<string>} */
export const PROTECTED_TOURNAMENT_FIELDS = new Set([
  'id',
  'createdBy',
  'createdAt',
  'status',
  'active',
  'archived',
]);

/** @enum {string} */
export const LIFECYCLE_ACTIONS = Object.freeze({
  PUBLISH: 'publish',
  GO_LIVE: 'go_live',
  COMPLETE: 'complete',
  ARCHIVE: 'archive',
  RESTORE: 'restore',
  DELETE: 'delete',
  SET_ACTIVE: 'set_active',
});

/** @type {Readonly<Record<string, string>>} */
export const TOURNAMENT_VALIDATION_MESSAGES = Object.freeze({
  NAME_REQUIRED: 'Tournament name is required.',
  NAME_TOO_SHORT: 'Tournament name must be at least 2 characters.',
  SEASON_REQUIRED: 'Season is required.',
  TIMEZONE_REQUIRED: 'Timezone is required.',
  TIMEZONE_INVALID: 'Timezone must be Asia/Kolkata (IST).',
  REGISTRATION_END_BEFORE_START: 'Registration end must be after registration start.',
  CANNOT_EDIT: 'This tournament cannot be edited in its current state.',
  LIFECYCLE_INVALID: 'This lifecycle action is not allowed for the current tournament state.',
  VISIBILITY_INVALID: 'Select a valid visibility option.',
});

/** @type {Readonly<Record<string, string>>} */
export const TOURNAMENT_MESSAGES = Object.freeze({
  LOADING: 'Loading tournaments…',
  LOADING_TOURNAMENT: 'Loading tournament…',
  CREATING: 'Creating tournament…',
  UPDATING: 'Updating tournament…',
  PUBLISHING: 'Publishing tournament…',
  ARCHIVING: 'Archiving tournament…',
  CREATED: 'Tournament created successfully.',
  UPDATED: 'Tournament updated successfully.',
  PUBLISHED: 'Tournament published successfully.',
  WENT_LIVE: 'Tournament is now live.',
  COMPLETED: 'Tournament marked as completed.',
  ARCHIVED: 'Tournament archived successfully.',
  RESTORED: 'Tournament restored successfully.',
  DELETED: 'Tournament deleted permanently.',
  DELETING: 'Deleting tournament…',
  ACTIVE_SET: 'Active tournament updated.',
  CREATE_FAILED: 'Unable to create tournament. Please try again.',
  UPDATE_FAILED: 'Unable to update tournament. Please try again.',
  LOAD_FAILED: 'Unable to load tournaments. Please try again.',
  NOT_FOUND: 'Tournament not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage tournaments.',
  CONFIRM_ARCHIVE: 'Archive this tournament? Historical data will be preserved.',
  CONFIRM_PUBLISH: 'Publish this tournament? It will become visible to contestants.',
  CONFIRM_GO_LIVE: 'Mark this tournament as live?',
  CONFIRM_COMPLETE: 'Mark this tournament as completed? It will become read-only.',
  CONFIRM_SET_ACTIVE: 'Set this as the active tournament? Only one tournament can be active.',
  CONFIRM_DELETE: 'Delete this tournament permanently? This action is irreversible and cannot be undone.',
  CONFIRM_RESTORE: 'Restore this tournament? It will become available for management again.',
  CANNOT_DELETE_ACTIVE: 'Cannot delete the active tournament. Set another tournament as active first.',
  CANNOT_DELETE_HAS_PREDICTIONS: 'Cannot delete this tournament because one or more matches have predictions.',
  NO_TOURNAMENTS: 'No tournaments have been created yet.',
  NO_ARCHIVED_TOURNAMENTS: 'No archived tournaments.',
  NO_VISIBLE_TOURNAMENTS: 'No tournaments are available right now.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

/** @type {Readonly<Record<string, string>>} */
export const TOURNAMENT_STATUS_LABELS = Object.freeze({
  [TOURNAMENT_STATUS.DRAFT]: 'Draft',
  [TOURNAMENT_STATUS.PUBLISHED]: 'Published',
  [TOURNAMENT_STATUS.LIVE]: 'Live',
  [TOURNAMENT_STATUS.COMPLETED]: 'Completed',
  [TOURNAMENT_STATUS.ARCHIVED]: 'Archived',
});

/** @type {Readonly<Record<string, string>>} */
export const LEADERBOARD_MESSAGES = Object.freeze({
  UNAVAILABLE: 'The tournament organizer has not yet made the leaderboard available.',
  DASHBOARD_PENDING: 'Leaderboard will become available once enabled by the tournament organizer.',
});

/** @type {Readonly<Record<string, string>>} */
export const TOURNAMENT_VISIBILITY_LABELS = Object.freeze({
  [TOURNAMENT_VISIBILITY.VISIBLE]: 'Visible',
  [TOURNAMENT_VISIBILITY.HIDDEN]: 'Hidden',
  [TOURNAMENT_VISIBILITY.ARCHIVED]: 'Archived',
});

/**
 * Returns default tournament configuration object.
 * @returns {Record<string, unknown>}
 */
export function createDefaultConfiguration() {
  return {
    timezone: DEFAULT_TOURNAMENT_TIMEZONE,
    requireWinnerSelectionForDrawPrediction: false,
    winnerResolution: 'regulation',
    leaderboardVisible: false,
    predictionLockMinutes: DEFAULT_PREDICTION_LOCK_MINUTES,
    predictionOpenHoursBeforeKickoff: DEFAULT_PREDICTION_OPEN_HOURS,
    tieBreaker: { ...DEFAULT_TIE_BREAKER_CONFIG },
    scoringConfiguration: {},
  };
}

/**
 * Returns default tournament document fields for creation.
 * @returns {Record<string, unknown>}
 */
export function createDefaultTournamentFields() {
  return {
    shortName: '',
    description: '',
    sport: SPORT_OPTIONS[0],
    tournamentType: TOURNAMENT_TYPE_OPTIONS[0],
    visibility: TOURNAMENT_VISIBILITY.HIDDEN,
    active: false,
    archived: false,
    registrationStart: null,
    registrationEnd: null,
    logo: '',
    banner: '',
    configuration: createDefaultConfiguration(),
  };
}
