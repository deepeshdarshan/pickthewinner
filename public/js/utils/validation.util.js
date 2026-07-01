/**
 * @fileoverview Input validation helpers.
 * @module utils/validation.util
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {string} [message]
 */

/**
 * Validates that a value is a non-empty string.
 * @param {unknown} value
 * @param {string} [fieldName='Field']
 * @returns {ValidationResult}
 */
export function validateRequired(value, fieldName = 'Field') {
  const valid = typeof value === 'string' && value.trim().length > 0;
  return {
    valid,
    message: valid ? undefined : `${fieldName} is required.`,
  };
}

/**
 * Validates an email address format.
 * @param {unknown} value
 * @returns {ValidationResult}
 */
export function validateEmail(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return { valid: false, message: 'Email is required.' };
  }

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  return {
    valid,
    message: valid ? undefined : 'Enter a valid email address.',
  };
}

/**
 * Validates a numeric score (non-negative integer).
 * @param {unknown} value
 * @param {string} [fieldName='Score']
 * @returns {ValidationResult}
 */
export function validateScore(value, fieldName = 'Score') {
  const number = Number(value);
  const valid = Number.isInteger(number) && number >= 0;
  return {
    valid,
    message: valid ? undefined : `${fieldName} must be a non-negative whole number.`,
  };
}

/**
 * Returns the first failed validation result, or null if all pass.
 * @param {ValidationResult[]} results
 * @returns {ValidationResult|null}
 */
export function firstValidationError(results) {
  return results.find((result) => !result.valid) ?? null;
}
