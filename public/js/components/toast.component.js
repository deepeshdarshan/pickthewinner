/**
 * @fileoverview Toast notification component.
 * @module components/toast.component
 */

import { appSettings } from '../config/app.config.js';
import { TOAST_TYPES } from '../config/application.constants.js';

/** @type {HTMLElement|null} */
let containerElement = null;

/**
 * @typedef {Object} ToastOptions
 * @property {string} message
 * @property {'success'|'danger'|'warning'|'info'} [type]
 * @property {number} [durationMs]
 */

/**
 * Ensures the toast container exists in the DOM.
 * @returns {HTMLElement}
 */
export function ensureToastContainer() {
  if (containerElement && document.body.contains(containerElement)) {
    return containerElement;
  }

  containerElement = document.createElement('div');
  containerElement.id = 'ptw-toast-container';
  containerElement.className = 'ptw-toast-container';
  containerElement.setAttribute('aria-live', 'polite');
  containerElement.setAttribute('aria-atomic', 'true');
  document.body.appendChild(containerElement);
  return containerElement;
}

/**
 * Displays a toast notification.
 * @param {ToastOptions} options
 * @returns {void}
 */
export function showToast(options) {
  const {
    message,
    type = TOAST_TYPES.INFO,
    durationMs = appSettings.toastDurationMs,
  } = options;

  const container = ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = `ptw-toast ptw-toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex justify-content-between align-items-start gap-3">
      <span>${message}</span>
      <button type="button" class="btn-close btn-close-white btn-sm" aria-label="Dismiss"></button>
    </div>
  `;

  const dismissButton = toast.querySelector('button');
  /**
   * @returns {void}
   */
  const removeToast = () => {
    toast.remove();
  };

  dismissButton?.addEventListener('click', removeToast);
  container.appendChild(toast);

  window.setTimeout(removeToast, durationMs);
}
