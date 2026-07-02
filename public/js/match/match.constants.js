/**
 * @fileoverview Match module constants — collections, routes, defaults, and messages.
 * @module match/match.constants
 */

import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { MATCH_STATUS } from '../domain/match.domain.js';

export { MATCH_STATUS };

/** @enum {string} */
export const MATCH_COLLECTIONS = Object.freeze({
  MATCHES: FIRESTORE_COLLECTIONS.MATCHES,
});

/** @enum {string} */
export const MATCH_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/matches',
  CONTESTANT_LIST: '/matches',
});

/** @type {Readonly<Array<{ value: string, label: string }>>} */
export const MATCH_ROUNDS = Object.freeze([
  { value: 'group_stage', label: 'Group Stage' },
  { value: 'round_of_32', label: 'Round of 32' },
  { value: 'round_of_16', label: 'Round of 16' },
  { value: 'quarter_final', label: 'Quarter Final' },
  { value: 'semi_final', label: 'Semi Final' },
  { value: 'third_place', label: 'Third Place' },
  { value: 'final', label: 'Final' },
]);

/** @enum {string} */
export const MATCH_LIFECYCLE_ACTIONS = Object.freeze({
  SCHEDULE: 'schedule',
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
  [MATCH_STATUS.SCHEDULED]: 'Scheduled',
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
  TEAMS_MUST_DIFFER: 'Team 1 and team 2 must be different.',
  ROUND_REQUIRED: 'Select a round.',
  KICKOFF_REQUIRED: 'Match date and kickoff time are required.',
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
  CONFIRM_DELETE: 'Delete this match?',
  CONFIRM_ARCHIVE: 'Archive this match?',
  CONFIRM_ARCHIVE: 'Archive this match?',
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
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
export function getRoundLabel(value) {
  const round = MATCH_ROUNDS.find((item) => item.value === value);
  return round?.label ?? value;
}
