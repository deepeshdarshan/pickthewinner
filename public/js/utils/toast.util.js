/**
 * @fileoverview Toast notification utility — delegates to the toast component.
 * @module utils/toast.util
 */

import { showToast as renderToast } from '../components/toast.component.js';
import { TOAST_TYPES } from '../config/application.constants.js';

/**
 * Displays a toast notification.
 * @param {string} message
 * @param {'success'|'danger'|'warning'|'info'} [type='info']
 * @param {number} [durationMs]
 * @returns {void}
 */
export function showToast(message, type = TOAST_TYPES.INFO, durationMs) {
  renderToast({ message, type, durationMs });
}

/**
 * @param {string} message
 * @param {number} [durationMs]
 * @returns {void}
 */
export function showSuccessToast(message, durationMs) {
  showToast(message, TOAST_TYPES.SUCCESS, durationMs);
}

/**
 * @param {string} message
 * @param {number} [durationMs]
 * @returns {void}
 */
export function showErrorToast(message, durationMs) {
  showToast(message, TOAST_TYPES.DANGER, durationMs);
}

/**
 * @param {string} message
 * @param {number} [durationMs]
 * @returns {void}
 */
export function showWarningToast(message, durationMs) {
  showToast(message, TOAST_TYPES.WARNING, durationMs);
}

/**
 * @param {string} message
 * @param {number} [durationMs]
 * @returns {void}
 */
export function showInfoToast(message, durationMs) {
  showToast(message, TOAST_TYPES.INFO, durationMs);
}
