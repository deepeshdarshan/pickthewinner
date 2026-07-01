/**
 * @fileoverview Time formatting utilities — all display uses IST (Asia/Kolkata).
 * @module utils/time.util
 */

import { appSettings } from '../config/app.config.js';
import { toDate } from './date.util.js';

/** @type {Readonly<string>} */
export const APP_TIMEZONE = appSettings.timezone;

/** @type {Readonly<string>} */
export const APP_TIMEZONE_LABEL = appSettings.timezoneLabel;

/**
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {Intl.DateTimeFormatOptions}
 */
function withAppTimezone(options = {}) {
  return {
    timeZone: APP_TIMEZONE,
    ...options,
  };
}

/**
 * Formats a time value for display in IST.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale]
 * @returns {string}
 */
export function formatTime(value, options = {}, locale = appSettings.locale) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, withAppTimezone({
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  })).format(date);
}

/**
 * Formats a combined date and time string in IST.
 * @param {Date|string|number} value
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDateTime(value, locale = appSettings.locale) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, withAppTimezone({
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })).format(date);
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
