/**
 * @fileoverview Global error handler for unhandled errors and rejections.
 * @module app/error-handler
 */

import { Logger } from '../utils/logger.util.js';
import { MESSAGES } from '../config/application.constants.js';
import { showErrorToast } from '../utils/toast.util.js';

/** @type {boolean} */
let initialized = false;

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
    showErrorToast(MESSAGES.GENERIC_ERROR);
  });

  window.addEventListener('unhandledrejection', (event) => {
    Logger.error('Unhandled promise rejection:', event.reason);
    showErrorToast(MESSAGES.GENERIC_ERROR);
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
