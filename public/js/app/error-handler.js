/**
 * @fileoverview Global error handler for unhandled errors and rejections.
 * @module app/error-handler
 */

import { Logger } from '../utils/logger.util.js';
import { MESSAGES } from '../config/application.constants.js';
import { showErrorToast } from '../utils/toast.util.js';

/** @type {boolean} */
let initialized = false;

/** @type {number} */
let lastGlobalErrorToastAt = 0;

/** @type {number} */
const GLOBAL_ERROR_TOAST_DEBOUNCE_MS = 4000;

/**
 * @param {unknown} reason
 * @returns {boolean}
 */
function isFirestoreInternalError(reason) {
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  return message.includes('INTERNAL ASSERTION FAILED');
}

/**
 * @param {unknown} reason
 * @returns {void}
 */
function notifyGlobalError(reason) {
  if (isFirestoreInternalError(reason)) {
    Logger.error('Firestore internal error (toast suppressed):', reason);
    return;
  }

  const now = Date.now();

  if (now - lastGlobalErrorToastAt < GLOBAL_ERROR_TOAST_DEBOUNCE_MS) {
    return;
  }

  lastGlobalErrorToastAt = now;
  showErrorToast(MESSAGES.GENERIC_ERROR);
}

/**
 * Initializes global error handling listeners.
 * @returns {void}
 */
export function initGlobalErrorHandler() {
  if (initialized) {
    return;
  }

  initialized = true;

  window.addEventListener('error', (event) => {
    Logger.error('Unhandled error:', event.error ?? event.message);
    notifyGlobalError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    Logger.error('Unhandled promise rejection:', event.reason);
    notifyGlobalError(event.reason);
  });
}

/**
 * Handles a recoverable application error with optional user feedback.
 * @param {unknown} err
 * @param {string} [userMessage]
 * @returns {void}
 */
export function handleAppError(err, userMessage) {
  Logger.error(userMessage ?? 'Application error:', err);

  if (userMessage) {
    showErrorToast(userMessage);
  }
}
