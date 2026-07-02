/**
 * @fileoverview Team validation — no DOM manipulation.
 * @module master-data/teams/team.validator
 */

import { TEAM_VALIDATION_MESSAGES } from './team.constants.js';

/**
 * @typedef {Object} TeamValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * @param {TeamValidationResult[]} results
 * @returns {TeamValidationResult}
 */
export function mergeValidationResults(results) {
  const errors = {};
  results.forEach((result) => Object.assign(errors, result.errors));
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {unknown} value
 * @returns {TeamValidationResult}
 */
export function validateName(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.name = TEAM_VALIDATION_MESSAGES.NAME_REQUIRED;
    return { valid: false, errors };
  }

  if (value.trim().length < 2) {
    errors.name = TEAM_VALIDATION_MESSAGES.NAME_TOO_SHORT;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {TeamValidationResult}
 */
export function validateCountry(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.country = TEAM_VALIDATION_MESSAGES.COUNTRY_REQUIRED;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {TeamValidationResult}
 */
export function validateFlagUrl(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    return { valid: true, errors };
  }

  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      errors.flagUrl = TEAM_VALIDATION_MESSAGES.FLAG_URL_INVALID;
      return { valid: false, errors };
    }
  } catch {
    errors.flagUrl = TEAM_VALIDATION_MESSAGES.FLAG_URL_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {TeamValidationResult}
 */
export function validateCreatePayload(payload) {
  return mergeValidationResults([
    validateName(payload.name),
    validateCountry(payload.country),
    validateFlagUrl(payload.flagUrl),
  ]);
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {TeamValidationResult}
 */
export function validateUpdatePayload(payload) {
  return validateCreatePayload(payload);
}

/**
 * @param {TeamValidationResult} result
 * @returns {string}
 */
export function getTeamValidationMessage(result) {
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
    const input = form.querySelector(`[name="${field}"]`) ?? form.querySelector(`#ptw-team-${field}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    const errorEl = form.querySelector(`#ptw-team-${field}-error`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });
}
