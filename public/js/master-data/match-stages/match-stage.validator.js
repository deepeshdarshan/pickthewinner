/**
 * @fileoverview Match stage validation.
 * @module master-data/match-stages/match-stage.validator
 */

import { MATCH_STAGE_VALIDATION_MESSAGES, MATCH_STAGE_MESSAGES } from './match-stage.constants.js';

/**
 * @typedef {Object} MatchStageValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * @param {Record<string, unknown>} payload
 * @returns {MatchStageValidationResult}
 */
export function validateCreatePayload(payload) {
  const errors = {};

  const label = String(payload.label ?? '').trim();

  if (!label) {
    errors.label = MATCH_STAGE_VALIDATION_MESSAGES.LABEL_REQUIRED;
  } else if (label.length < 2) {
    errors.label = MATCH_STAGE_VALIDATION_MESSAGES.LABEL_TOO_SHORT;
  }

  const value = String(payload.value ?? '').trim();

  if (!value) {
    errors.value = MATCH_STAGE_VALIDATION_MESSAGES.VALUE_REQUIRED;
  } else if (!/^[a-z0-9_]+$/.test(value)) {
    errors.value = MATCH_STAGE_VALIDATION_MESSAGES.VALUE_INVALID;
  }

  if (payload.sortOrder !== undefined && payload.sortOrder !== '') {
    const sortOrder = Number(payload.sortOrder);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      errors.sortOrder = MATCH_STAGE_VALIDATION_MESSAGES.SORT_ORDER_INVALID;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {MatchStageValidationResult}
 */
export function validateUpdatePayload(payload) {
  return validateCreatePayload(payload);
}

/**
 * @param {MatchStageValidationResult} result
 * @returns {string}
 */
export function getStageValidationMessage(result) {
  if (result.valid) {
    return '';
  }

  return Object.values(result.errors)[0] ?? MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY;
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
    const input = form.querySelector(`[name="${field}"]`) ?? form.querySelector(`#ptw-stage-${field}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    const errorEl = form.querySelector(`#ptw-stage-${field}-error`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });
}

