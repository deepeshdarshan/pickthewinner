/**
 * @fileoverview Venue validation — no DOM manipulation.
 * @module master-data/venues/venue.validator
 */

import { VENUE_VALIDATION_MESSAGES } from './venue.constants.js';

/**
 * @typedef {Object} VenueValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * @param {VenueValidationResult[]} results
 * @returns {VenueValidationResult}
 */
export function mergeValidationResults(results) {
  const errors = {};
  results.forEach((result) => Object.assign(errors, result.errors));
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {unknown} value
 * @returns {VenueValidationResult}
 */
export function validateName(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.name = VENUE_VALIDATION_MESSAGES.NAME_REQUIRED;
    return { valid: false, errors };
  }

  if (value.trim().length < 2) {
    errors.name = VENUE_VALIDATION_MESSAGES.NAME_TOO_SHORT;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {VenueValidationResult}
 */
export function validateCity(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.city = VENUE_VALIDATION_MESSAGES.CITY_REQUIRED;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {VenueValidationResult}
 */
export function validateCountry(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.country = VENUE_VALIDATION_MESSAGES.COUNTRY_REQUIRED;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {VenueValidationResult}
 */
export function validateCapacity(value) {
  const errors = {};

  if (value === null || value === undefined || value === '') {
    return { valid: true, errors };
  }

  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < 1) {
    errors.capacity = VENUE_VALIDATION_MESSAGES.CAPACITY_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {VenueValidationResult}
 */
export function validateCreatePayload(payload) {
  return mergeValidationResults([
    validateName(payload.name),
    validateCity(payload.city),
    validateCountry(payload.country),
    validateCapacity(payload.capacity),
  ]);
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {VenueValidationResult}
 */
export function validateUpdatePayload(payload) {
  return validateCreatePayload(payload);
}

/**
 * @param {VenueValidationResult} result
 * @returns {string}
 */
export function getVenueValidationMessage(result) {
  if (result.valid) {
    return '';
  }

  return Object.values(result.errors)[0] ?? '';
}

/**
 * @param {HTMLFormElement} form
 * @param {Record<string, string>} errors
 * @returns {void}
 */
export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  form.querySelectorAll('.ptw-invalid-feedback--visible').forEach((el) => {
    el.textContent = '';
    el.classList.remove('ptw-invalid-feedback--visible');
  });

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`) ?? form.querySelector(`#ptw-venue-${field}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    const errorEl = form.querySelector(`#ptw-venue-${field}-error`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });
}
