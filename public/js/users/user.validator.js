/**
 * @fileoverview User profile validation — no DOM manipulation.
 * @module users/user.validator
 */

import {
  USER_VALIDATION_MESSAGES,
  DEFAULT_TIMEZONE,
} from './user.constants.js';
import { DISTRICT_WISE_PS_MAP } from './location.constants.js';

/**
 * @typedef {Object} UserValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * Validates a display name.
 * @param {unknown} value
 * @returns {UserValidationResult}
 */
export function validateName(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.name = USER_VALIDATION_MESSAGES.NAME_REQUIRED;
    return { valid: false, errors };
  }

  if (value.trim().length < 2) {
    errors.name = USER_VALIDATION_MESSAGES.NAME_TOO_SHORT;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates a phone number (10–15 digits).
 * @param {unknown} value
 * @returns {UserValidationResult}
 */
export function validatePhone(value) {
  const errors = {};
  const digits = typeof value === 'string' ? value.replace(/\D/g, '') : '';

  if (!digits) {
    errors.phone = USER_VALIDATION_MESSAGES.PHONE_REQUIRED;
    return { valid: false, errors };
  }

  if (digits.length < 10 || digits.length > 15) {
    errors.phone = USER_VALIDATION_MESSAGES.PHONE_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates a district selection.
 * @param {unknown} value
 * @returns {UserValidationResult}
 */
export function validateDistrict(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.district = USER_VALIDATION_MESSAGES.DISTRICT_REQUIRED;
    return { valid: false, errors };
  }

  if (!Object.prototype.hasOwnProperty.call(DISTRICT_WISE_PS_MAP, value)) {
    errors.district = USER_VALIDATION_MESSAGES.DISTRICT_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates a Pradeshika Sabha selection for a given district.
 * @param {unknown} value
 * @param {unknown} district
 * @returns {UserValidationResult}
 */
export function validatePradeshikaSabha(value, district) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.pradeshikaSabha = USER_VALIDATION_MESSAGES.PRADESHIKA_SABHA_REQUIRED;
    return { valid: false, errors };
  }

  const psList = typeof district === 'string' ? DISTRICT_WISE_PS_MAP[district] : undefined;

  if (!psList || !psList.includes(value)) {
    errors.pradeshikaSabha = USER_VALIDATION_MESSAGES.PRADESHIKA_SABHA_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates that a timezone value matches the application zone (IST).
 * @param {unknown} value
 * @returns {UserValidationResult}
 */
export function validateTimezone(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.timezone = USER_VALIDATION_MESSAGES.TIMEZONE_REQUIRED;
    return { valid: false, errors };
  }

  if (value !== DEFAULT_TIMEZONE) {
    errors.timezone = USER_VALIDATION_MESSAGES.TIMEZONE_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates notification preferences.
 * @param {unknown} preferences
 * @returns {UserValidationResult}
 */
export function validatePreferences(preferences) {
  if (preferences === undefined || preferences === null) {
    return { valid: true, errors: {} };
  }

  if (typeof preferences !== 'object') {
    return {
      valid: false,
      errors: { notificationPreferences: 'Invalid notification preferences.' },
    };
  }

  const { email, browser } = /** @type {{ email?: unknown, browser?: unknown }} */ (preferences);

  if (email !== undefined && typeof email !== 'boolean') {
    return {
      valid: false,
      errors: { 'notificationPreferences.email': 'Email preference must be true or false.' },
    };
  }

  if (browser !== undefined && typeof browser !== 'boolean') {
    return {
      valid: false,
      errors: { 'notificationPreferences.browser': 'Browser preference must be true or false.' },
    };
  }

  return { valid: true, errors: {} };
}

/**
 * Merges multiple validation results into one.
 * @param {UserValidationResult[]} results
 * @returns {UserValidationResult}
 */
export function mergeValidationResults(results) {
  const errors = {};

  results.forEach((result) => {
    Object.assign(errors, result.errors);
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates the complete-profile form payload.
 * @param {{ phone?: unknown, district?: unknown, pradeshikaSabha?: unknown }} data
 * @returns {UserValidationResult}
 */
export function validateCompleteProfileForm(data) {
  return mergeValidationResults([
    validatePhone(data.phone),
    validateDistrict(data.district),
    validatePradeshikaSabha(data.pradeshikaSabha, data.district),
  ]);
}

/**
 * Validates a profile update payload.
 * @param {{ phone?: unknown, notificationPreferences?: unknown }} data
 * @returns {UserValidationResult}
 */
export function validateProfileUpdate(data) {
  const results = [];

  if (data.phone !== undefined) {
    results.push(validatePhone(data.phone));
  }

  if (data.notificationPreferences !== undefined) {
    results.push(validatePreferences(data.notificationPreferences));
  }

  return mergeValidationResults(results);
}
