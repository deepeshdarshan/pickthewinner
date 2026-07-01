/**
 * @fileoverview Form validation orchestration — placeholder for domain validators.
 * @module validators/form.validator
 */

import { firstValidationError } from '../utils/validation.util.js';

/**
 * Runs a list of validation results and returns a combined outcome.
 * @param {import('../utils/validation.util.js').ValidationResult[]} results
 * @returns {{ valid: boolean, message?: string }}
 */
export function validateAll(results) {
  const error = firstValidationError(results);

  if (error) {
    return { valid: false, message: error.message };
  }

  return { valid: true };
}
