/**
 * @fileoverview Time formatting utilities.
 * @module utils/time.util
 */

import { toDate } from './date.util.js';

/**
 * Formats a time value for display.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatTime(value, options = {}, locale = 'en-US') {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  }).format(date);
}

/**
 * Formats a combined date and time string.
 * @param {Date|string|number} value
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDateTime(value, locale = 'en-US') {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

/**
 * Returns milliseconds until a target timestamp.
 * @param {Date|string|number} target
 * @returns {number}
 */
export function msUntil(target) {
  const date = toDate(target);
  if (!date) {
    return 0;
  }

  return Math.max(0, date.getTime() - Date.now());
}
