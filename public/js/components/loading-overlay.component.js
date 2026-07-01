/**
 * @fileoverview Full-screen loading overlay component.
 * @module components/loading-overlay.component
 */

import { MESSAGES } from '../config/application.constants.js';

/** @type {HTMLElement|null} */
let overlayElement = null;

/**
 * Ensures the loading overlay exists in the DOM.
 * @returns {HTMLElement}
 */
export function ensureLoadingOverlay() {
  if (overlayElement && document.body.contains(overlayElement)) {
    return overlayElement;
  }

  overlayElement = document.createElement('div');
  overlayElement.id = 'ptw-loading-overlay';
  overlayElement.className = 'ptw-loading-overlay';
  overlayElement.setAttribute('role', 'status');
  overlayElement.setAttribute('aria-live', 'polite');
  overlayElement.setAttribute('aria-busy', 'false');
  overlayElement.innerHTML = `
    <div class="text-center">
      <div class="ptw-loading-overlay__spinner" aria-hidden="true"></div>
      <p class="mt-3 ptw-text-muted mb-0">${MESSAGES.LOADING}</p>
    </div>
  `;

  document.body.appendChild(overlayElement);
  return overlayElement;
}

/**
 * Shows the loading overlay.
 * @param {string} [message]
 * @returns {void}
 */
export function showLoadingOverlay(message) {
  const overlay = ensureLoadingOverlay();

  if (message) {
    const text = overlay.querySelector('p');
    if (text) {
      text.textContent = message;
    }
  }

  overlay.classList.add('is-visible');
  overlay.setAttribute('aria-busy', 'true');
}

/**
 * Hides the loading overlay.
 * @returns {void}
 */
export function hideLoadingOverlay() {
  if (!overlayElement) {
    return;
  }

  overlayElement.classList.remove('is-visible');
  overlayElement.setAttribute('aria-busy', 'false');
}
