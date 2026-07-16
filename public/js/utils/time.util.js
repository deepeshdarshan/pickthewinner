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
 * Formats a time value as HH:mm for HTML time inputs in the app timezone.
 * @param {Date|string|number} value
 * @returns {string}
 */
export function formatTimeInput(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-GB', withAppTimezone({
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })).formatToParts(date);

  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
  return hour && minute ? `${hour}:${minute}` : '';
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

/**
 * Formats a duration in milliseconds for display (e.g. "28 min", "1h 15m").
 * @param {number|null|undefined} ms
 * @returns {string}
 */
export function formatDurationMs(ms) {
  if (ms === null || ms === undefined || !Number.isFinite(ms)) {
    return '—';
  }

  const totalMinutes = Math.round(ms / 60000);

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}
