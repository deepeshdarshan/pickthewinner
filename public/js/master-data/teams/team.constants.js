/**
 * @fileoverview Team module constants — collections, routes, defaults, and messages.
 * @module master-data/teams/team.constants
 */

import { FIRESTORE_COLLECTIONS } from '../../config/application.constants.js';
import { SPORT_OPTIONS } from '../../tournament/tournament.constants.js';

/** @enum {string} */
export const TEAM_COLLECTIONS = Object.freeze({
  TEAMS: FIRESTORE_COLLECTIONS.TEAMS,
});

/** @enum {string} */
export const TEAM_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/teams',
});

/** @type {ReadonlySet<string>} */
export const PROTECTED_TEAM_FIELDS = new Set([
  'id',
  'createdBy',
  'createdAt',
]);

/** @type {Readonly<Record<string, string>>} */
export const TEAM_VALIDATION_MESSAGES = Object.freeze({
  NAME_REQUIRED: 'Team name is required.',
  NAME_TOO_SHORT: 'Team name must be at least 2 characters.',
  FLAG_INVALID: 'Select a valid flag.',
});

/** @type {Readonly<Record<string, string>>} */
export const TEAM_MESSAGES = Object.freeze({
  LOADING: 'Loading teams…',
  LOADING_TEAM: 'Loading team…',
  CREATING: 'Creating team…',
  UPDATING: 'Updating team…',
  DELETING: 'Deleting team…',
  CREATED: 'Team created successfully.',
  UPDATED: 'Team updated successfully.',
  DELETED: 'Team deleted successfully.',
  NOT_FOUND: 'Team not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage teams.',
  NO_TEAMS: 'No teams have been created yet.',
  CONFIRM_DELETE: 'Delete this team? Matches referencing it may be affected.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

export { SPORT_OPTIONS };

/**
 * @returns {Record<string, unknown>}
 */
export function createDefaultTeamFields() {
  return {
    shortName: '',
    country: '',
    flagUrl: '',
    sport: SPORT_OPTIONS[0],
    active: true,
  };
}
