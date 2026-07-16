/**
 * @fileoverview Match module constants — collections, routes, defaults, and messages.
 * @module match/match.constants
 */

import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { MATCH_STATUS } from '../domain/match.domain.js';
import { getMatchStageLabel } from '../master-data/match-stages/match-stage.labels.js';

export { MATCH_STATUS };

/** @enum {string} */
export const MATCH_COLLECTIONS = Object.freeze({
  MATCHES: FIRESTORE_COLLECTIONS.MATCHES,
});

/** @enum {string} */
export const MATCH_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/matches',
  ARCHIVED_LIST: '/admin/matches',
  CONTESTANT_LIST: '/matches',
  CONTESTANT_UPCOMING_LIST: '/matches',
  CONTESTANT_COMPLETED_LIST: '/matches',
  CONTESTANT_ARCHIVED_LIST: '/matches',
});

/** @enum {string} */
export const MATCH_LIFECYCLE_ACTIONS = Object.freeze({
  PUBLISH: 'publish',
  HIDE: 'hide',
  OPEN_PREDICTIONS: 'open_predictions',
  CLOSE_PREDICTIONS: 'close_predictions',
  REOPEN_PREDICTIONS: 'reopen_predictions',
  GO_LIVE: 'go_live',
  COMPLETE: 'complete',
  ARCHIVE: 'archive',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_STATUS_LABELS = Object.freeze({
  [MATCH_STATUS.DRAFT]: 'Draft',
  [MATCH_STATUS.PUBLISHED]: 'Published',
  [MATCH_STATUS.PREDICTION_OPEN]: 'Prediction Open',
  [MATCH_STATUS.PREDICTION_LOCKED]: 'Prediction Locked',
  [MATCH_STATUS.LIVE]: 'Live',
  [MATCH_STATUS.COMPLETED]: 'Completed',
  [MATCH_STATUS.RESULT_PUBLISHED]: 'Result Published',
  [MATCH_STATUS.ARCHIVED]: 'Archived',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_VALIDATION_MESSAGES = Object.freeze({
  TOURNAMENT_REQUIRED: 'Select a tournament.',
  HOME_TEAM_REQUIRED: 'Select team 1.',
  AWAY_TEAM_REQUIRED: 'Select team 2.',
  ROUND_REQUIRED: 'Select match stage.',
  TEAMS_MUST_DIFFER: 'Team 1 and team 2 must be different.',
  KICKOFF_REQUIRED: 'Match date and kickoff time are required.',
  CUSTOM_POINTS_MATCH_SCORE_REQUIRED: 'Points for correct match score are required when custom points are enabled.',
  CUSTOM_POINTS_MATCH_SCORE_INVALID: 'Custom match score points must be a whole number between 0 and 100.',
  CUSTOM_POINTS_PENALTY_REQUIRED: 'Points for correct penalty winner are required when custom points are enabled.',
  CUSTOM_POINTS_PENALTY_INVALID: 'Custom penalty winner points must be a whole number between 0 and 100.',
  DUPLICATE_MATCH: 'A match with these teams on this date already exists.',
  CANNOT_EDIT: 'This match cannot be edited in its current state.',
  LIFECYCLE_INVALID: 'This action is not allowed for the current match state.',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_MESSAGES = Object.freeze({
  LOADING: 'Loading matches…',
  LOADING_MATCH: 'Loading match…',
  CREATING: 'Creating match…',
  UPDATING: 'Updating match…',
  DELETING: 'Deleting match…',
  CREATED: 'Match created successfully.',
  UPDATED: 'Match updated successfully.',
  DELETED: 'Match deleted successfully.',
  PUBLISHED: 'Match published successfully.',
  HIDDEN: 'Match hidden successfully.',
  ARCHIVED: 'Match archived successfully.',
  NOT_FOUND: 'Match not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage matches.',
  NO_MATCHES: 'No matches have been created yet.',
  NO_ARCHIVED_MATCHES: 'No archived matches.',
  CONFIRM_DELETE: 'Delete this match permanently? This action is irreversible and cannot be undone.',
  CONFIRM_ARCHIVE: 'Archive this match?',
  CANNOT_DELETE_HAS_PREDICTIONS: 'Cannot delete this match because contestants have submitted predictions.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

/**
 * @returns {Record<string, unknown>}
 */
export function createDefaultMatchFields() {
  return {
    status: MATCH_STATUS.DRAFT,
    visible: false,
    scoringStatus: null,
    result: null,
    customScoringConfig: null,
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
export function getRoundLabel(value) {
  return getMatchStageLabel(value);
}
