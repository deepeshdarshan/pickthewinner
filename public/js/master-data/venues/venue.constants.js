/**
 * @fileoverview Venue module constants — collections, routes, defaults, and messages.
 * @module master-data/venues/venue.constants
 */

import { FIRESTORE_COLLECTIONS } from '../../config/application.constants.js';

/** @enum {string} */
export const VENUE_COLLECTIONS = Object.freeze({
  VENUES: FIRESTORE_COLLECTIONS.VENUES,
});

/** @enum {string} */
export const VENUE_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/venues',
});

/** @type {ReadonlySet<string>} */
export const PROTECTED_VENUE_FIELDS = new Set([
  'id',
  'createdBy',
  'createdAt',
]);

/** @type {Readonly<Record<string, string>>} */
export const VENUE_VALIDATION_MESSAGES = Object.freeze({
  NAME_REQUIRED: 'Venue name is required.',
  NAME_TOO_SHORT: 'Venue name must be at least 2 characters.',
  CITY_REQUIRED: 'City is required.',
  COUNTRY_REQUIRED: 'Country is required.',
  CAPACITY_INVALID: 'Capacity must be a positive whole number.',
});

/** @type {Readonly<Record<string, string>>} */
export const VENUE_MESSAGES = Object.freeze({
  LOADING: 'Loading venues…',
  LOADING_VENUE: 'Loading venue…',
  CREATING: 'Creating venue…',
  UPDATING: 'Updating venue…',
  DELETING: 'Deleting venue…',
  CREATED: 'Venue created successfully.',
  UPDATED: 'Venue updated successfully.',
  DELETED: 'Venue deleted successfully.',
  NOT_FOUND: 'Venue not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage venues.',
  NO_VENUES: 'No venues have been created yet.',
  CONFIRM_DELETE: 'Delete this venue? Matches referencing it may be affected.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

/**
 * @returns {Record<string, unknown>}
 */
export function createDefaultVenueFields() {
  return {
    city: '',
    country: '',
    capacity: null,
    active: true,
  };
}
