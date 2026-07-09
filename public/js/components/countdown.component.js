/**
 * @fileoverview Countdown component placeholder — displays a target date countdown.
 * @module components/countdown.component
 */

import { escapeHtml } from '../utils/html.util.js';
import {
  startCountdown,
  formatCountdown,
  formatCountdownVerbose,
  formatPredictionWindowCountdown,
} from '../utils/countdown.util.js';

/**
 * @typedef {Object} CountdownOptions
 * @property {string} targetDate - ISO date string for the countdown target.
 * @property {string} [label]
 * @property {string} [id]
 */

/**
 * @typedef {Object} PredictionWindowCountdownOptions
 * @property {string} targetDate
 * @property {string} [id]
 * @property {string} [label]
 */

/**
 * Renders a countdown placeholder block.
 * @param {CountdownOptions} options
 * @returns {string}
 */
export function renderCountdown(options) {
  const { targetDate, label = 'Time remaining', id = `ptw-countdown-${Date.now()}` } = options;

  return `
    <div class="ptw-countdown" id="${id}" data-target="${targetDate}" role="timer" aria-live="polite">
      <span class="ptw-countdown__label">${label}</span>
      <div class="ptw-countdown__display">
        <span class="ptw-countdown__value" data-ptw-countdown-value>--:--:--</span>
      </div>
    </div>
  `;
}

/**
 * Renders the shared prediction-window countdown used on the prediction form and dashboard.
 * @param {PredictionWindowCountdownOptions} options
 * @returns {string}
 */
export function renderPredictionWindowCountdown(options) {
  const {
    targetDate,
    id = `ptw-countdown-${Date.now()}`,
    label = 'Prediction window closes in',
  } = options;

  return `
    <div
      class="ptw-countdown ptw-prediction-form__countdown"
      id="${id}"
      data-target="${escapeHtml(targetDate)}"
      data-ptw-countdown-format="prediction-window"
      role="timer"
      aria-live="polite"
    >
      <span class="ptw-prediction-form__countdown-label">
        <i class="bi bi-clock" aria-hidden="true"></i>
        ${escapeHtml(label)}
      </span>
      <span class="ptw-prediction-form__countdown-value" data-ptw-countdown-value>--h --m --s</span>
    </div>
  `;
}

/**
 * Mounts a countdown into a container element.
 * @param {HTMLElement} container
 * @param {CountdownOptions} options
 * @returns {HTMLElement}
 */
export function mountCountdown(container, options) {
  container.innerHTML = renderCountdown(options);
  return container.querySelector('.ptw-countdown');
}

/**
 * @param {HTMLElement} countdownContainer
 * @returns {'prediction-window'|'verbose'|'default'}
 */
function getCountdownFormat(countdownContainer) {
  const format = countdownContainer.getAttribute('data-ptw-countdown-format');
  if (format === 'prediction-window' || countdownContainer.classList.contains('ptw-prediction-form__countdown')) {
    return 'prediction-window';
  }

  if (countdownContainer.classList.contains('ptw-countdown--verbose')) {
    return 'verbose';
  }

  return 'default';
}

/**
 * Initializes all countdown timers on the page.
 * @param {HTMLElement} [container=document.body] - Container to search for countdowns
 * @returns {Array<() => void>} Array of cleanup functions to stop countdowns
 */
export function initializeCountdowns(container = document.body) {
  const countdowns = container.querySelectorAll('[data-ptw-countdown-value]');
  const cleanupFunctions = [];

  countdowns.forEach((element) => {
    const countdownContainer = element.closest('.ptw-countdown');
    if (!countdownContainer) {
      return;
    }

    const targetDate = countdownContainer.getAttribute('data-target');
    if (!targetDate) {
      return;
    }

    const format = getCountdownFormat(countdownContainer);

    const cleanup = startCountdown(targetDate, (parts) => {
      if (format === 'prediction-window') {
        element.textContent = formatPredictionWindowCountdown(parts);

        if (parts.expired) {
          element.classList.add('is-expired');
        } else {
          element.classList.remove('is-expired');
        }

        return;
      }

      const formatter = format === 'verbose' ? formatCountdownVerbose : formatCountdown;

      if (parts.expired) {
        element.textContent = 'Expired';
        element.classList.add('text-danger');
      } else {
        element.textContent = formatter(parts);
        element.classList.remove('text-danger');
      }
    });

    cleanupFunctions.push(cleanup);
  });

  return cleanupFunctions;
}
