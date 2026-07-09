/**
 * @fileoverview Countdown timer utilities.
 * @module utils/countdown.util
 */

import { msUntil } from './time.util.js';

/**
 * @typedef {Object} CountdownParts
 * @property {number} days
 * @property {number} hours
 * @property {number} minutes
 * @property {number} seconds
 * @property {number} totalMs
 * @property {boolean} expired
 */

/**
 * Breaks remaining milliseconds into countdown parts.
 * @param {number} totalMs
 * @returns {CountdownParts}
 */
export function getCountdownParts(totalMs) {
  const safeMs = Math.max(0, totalMs);
  const totalSeconds = Math.floor(safeMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs: safeMs,
    expired: safeMs <= 0,
  };
}

/**
 * Formats countdown parts as DD:HH:MM:SS (days omitted when zero).
 * @param {CountdownParts} parts
 * @returns {string}
 */
export function formatCountdown(parts) {
  const pad = (value) => String(value).padStart(2, '0');

  if (parts.days > 0) {
    return `${parts.days}d ${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
  }

  return `${pad(parts.hours)}:${pad(parts.minutes)}:${pad(parts.seconds)}`;
}

/**
 * Formats countdown parts as verbose dashboard labels (e.g. "07 HRS : 26 MINS : 38 SECS").
 * @param {CountdownParts} parts
 * @returns {string}
 */
export function formatCountdownVerbose(parts) {
  const pad = (value) => String(value).padStart(2, '0');
  const segments = [];

  if (parts.days > 0) {
    segments.push(`${pad(parts.days)} DAYS`);
  }

  segments.push(`${pad(parts.hours)} HRS`);
  segments.push(`${pad(parts.minutes)} MINS`);
  segments.push(`${pad(parts.seconds)} SECS`);

  return segments.join(' : ');
}

/**
 * Formats countdown parts for the prediction window display (e.g. "07h 26m 38s").
 * @param {CountdownParts} parts
 * @returns {string}
 */
export function formatPredictionWindowCountdown(parts) {
  const pad = (value) => String(value).padStart(2, '0');

  if (parts.expired) {
    return 'Closed';
  }

  if (parts.days > 0) {
    return `${parts.days}d ${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s`;
  }

  return `${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s`;
}

/**
 * Starts an interval countdown that invokes a callback on each tick.
 * @param {Date|string|number} target
 * @param {(parts: CountdownParts) => void} onTick
 * @param {number} [intervalMs=1000]
 * @returns {() => void} Cleanup function to stop the countdown.
 */
export function startCountdown(target, onTick, intervalMs = 1000) {
  /** @type {number|undefined} */
  let timerId;

  /**
   * @returns {void}
   */
  const stop = () => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
      timerId = undefined;
    }
  };

  /**
   * @returns {void}
   */
  const tick = () => {
    const parts = getCountdownParts(msUntil(target));
    onTick(parts);

    if (parts.expired) {
      stop();
    }
  };

  tick();
  timerId = window.setInterval(tick, intervalMs);

  return stop;
}
