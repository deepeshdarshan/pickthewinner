/**
 * @fileoverview Countdown component placeholder — displays a target date countdown.
 * @module components/countdown.component
 */

/**
 * @typedef {Object} CountdownOptions
 * @property {string} targetDate - ISO date string for the countdown target.
 * @property {string} [label]
 * @property {string} [id]
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
 * Mounts a countdown into a container element.
 * @param {HTMLElement} container
 * @param {CountdownOptions} options
 * @returns {HTMLElement}
 */
export function mountCountdown(container, options) {
  container.innerHTML = renderCountdown(options);
  return container.querySelector('.ptw-countdown');
}
