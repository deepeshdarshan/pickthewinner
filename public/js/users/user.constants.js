/**
 * @fileoverview User module constants — collection names, roles, statuses, routes, and messages.
 * @module users/user.constants
 */

/** @enum {string} */
export const USER_COLLECTIONS = Object.freeze({
  USERS: 'users',
});

/** @enum {string} */
export const USER_ROLES = Object.freeze({
  ADMIN: 'ADMIN',
  CONTESTANT: 'CONTESTANT',
});

/** @enum {string} */
export const USER_STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  LOCKED: 'LOCKED',
});

/** @enum {string} */
export const USER_PROVIDERS = Object.freeze({
  GOOGLE: 'GOOGLE',
  EMAIL_PASSWORD: 'EMAIL_PASSWORD',
});

/** @enum {string} */
export const USER_ROUTES = Object.freeze({
  PROFILE: '/profile',
  COMPLETE_PROFILE: '/complete-profile',
});

import { appSettings } from '../config/app.config.js';

/** @type {Readonly<string>} */
export const DEFAULT_TIMEZONE = appSettings.timezone;

/** @type {Readonly<string>} */
export const APP_TIMEZONE_LABEL = appSettings.timezoneLabel;

/** @type {Readonly<string>} */
export const APP_LOCALE = appSettings.locale;

/** @type {Readonly<{ email: boolean, browser: boolean }>} */
export const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  email: false,
  browser: true,
});

/** @type {Readonly<Record<string, string>>} */
export const USER_VALIDATION_MESSAGES = Object.freeze({
  NAME_REQUIRED: 'Name is required.',
  NAME_TOO_SHORT: 'Name must be at least 2 characters.',
  PHONE_REQUIRED: 'Phone number is required.',
  PHONE_INVALID: 'Phone number must be between 10 and 15 digits.',
  DISTRICT_REQUIRED: 'District is required.',
  DISTRICT_INVALID: 'Select a valid district.',
  PRADESHIKA_SABHA_REQUIRED: 'Pradeshika Sabha is required.',
  PRADESHIKA_SABHA_INVALID: 'Select a valid Pradeshika Sabha for the chosen district.',
  TIMEZONE_REQUIRED: 'Timezone is required.',
  TIMEZONE_INVALID: 'Application time is fixed to IST (GMT+05:30).',
});

/** @type {Readonly<Record<string, string>>} */
export const USER_MESSAGES = Object.freeze({
  LOADING_PROFILE: 'Loading profile…',
  CREATING_PROFILE: 'Creating profile…',
  UPDATING_PROFILE: 'Updating profile…',
  PROFILE_CREATED: 'Profile created successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  PROFILE_LOAD_FAILED: 'Unable to load your profile. Please try again.',
  PROFILE_CREATE_FAILED: 'Unable to create your profile. Please try again.',
  PROFILE_UPDATE_FAILED: 'Unable to update your profile. Please try again.',
  PROFILE_NOT_FOUND: 'Profile not found.',
  DUPLICATE_USER: 'A profile already exists for this account.',
  OFFLINE: 'You appear to be offline. Check your connection and try again.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NETWORK_ERROR: 'Network error. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  ACCOUNT_LOCKED: 'Your account has been locked by an administrator. Please contact the administrator for assistance.',
  USER_LOCKED_SUCCESS: 'User account has been locked successfully.',
  USER_UNLOCKED_SUCCESS: 'User account has been unlocked successfully.',
  USER_LOCK_FAILED: 'Unable to lock user account. Please try again.',
  USER_UNLOCK_FAILED: 'Unable to unlock user account. Please try again.',
  CANNOT_LOCK_SELF: 'You cannot lock your own account.',
  CANNOT_LOCK_ADMIN: 'You cannot lock another administrator account.',
  LOADING_USERS: 'Loading users…',
  USERS_LOAD_FAILED: 'Unable to load users. Please try again.',
});

/**
 * Maps Firestore error codes to user-friendly messages.
 * @type {Readonly<Record<string, string>>}
 */
export const FIRESTORE_USER_ERROR_MESSAGES = Object.freeze({
  'permission-denied': USER_MESSAGES.PERMISSION_DENIED,
  unavailable: USER_MESSAGES.OFFLINE,
  'not-found': USER_MESSAGES.PROFILE_NOT_FOUND,
});

/**
 * Application timezone — IST only. Users cannot select a different zone.
 * @type {Readonly<Array<{ value: string, label: string }>>}
 */
export const TIMEZONE_OPTIONS = Object.freeze([
  { value: DEFAULT_TIMEZONE, label: APP_TIMEZONE_LABEL },
]);
