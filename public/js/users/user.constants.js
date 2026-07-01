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

/** @type {Readonly<string>} */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

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
  TIMEZONE_INVALID: 'Select a valid timezone.',
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
 * Common IANA timezones offered in profile forms.
 * @type {Readonly<Array<{ value: string, label: string }>>}
 */
export const TIMEZONE_OPTIONS = Object.freeze([
  { value: 'Asia/Kolkata', label: 'India (IST) — Asia/Kolkata' },
  { value: 'Asia/Dubai', label: 'UAE — Asia/Dubai' },
  { value: 'Europe/London', label: 'UK — Europe/London' },
  { value: 'Europe/Paris', label: 'Central Europe — Europe/Paris' },
  { value: 'Europe/Berlin', label: 'Germany — Europe/Berlin' },
  { value: 'America/New_York', label: 'US Eastern — America/New_York' },
  { value: 'America/Chicago', label: 'US Central — America/Chicago' },
  { value: 'America/Denver', label: 'US Mountain — America/Denver' },
  { value: 'America/Los_Angeles', label: 'US Pacific — America/Los_Angeles' },
  { value: 'America/Sao_Paulo', label: 'Brazil — America/Sao_Paulo' },
  { value: 'Australia/Sydney', label: 'Australia — Australia/Sydney' },
  { value: 'Pacific/Auckland', label: 'New Zealand — Pacific/Auckland' },
  { value: 'UTC', label: 'UTC' },
]);
