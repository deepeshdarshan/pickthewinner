/**
 * @fileoverview Date formatting and parsing utilities — calendar boundaries use IST.
 * @module utils/date.util
 */

import { appSettings } from '../config/app.config.js';

/** @type {Readonly<string>} */
export const APP_TIMEZONE = appSettings.timezone;

/**
 * Formats a Date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function formatDateISO(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a date for display in IST using locale conventions.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDateDisplay(value, options = {}, locale = appSettings.locale) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

/**
 * Formats a date with time for display (e.g., "Jul 15, 2026, 7:30 PM IST").
 * @param {Date|string|number} value
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDateTime(value, locale = appSettings.locale) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Formats a date without time for display (e.g., "Jul 15, 2026").
 * @param {Date|string|number} value
 * @param {string} [locale]
 * @returns {string}
 */
export function formatDate(value, locale = appSettings.locale) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Converts supported values to a Date instance.
 * @param {Date|string|number} value
 * @returns {Date|null}
 */
export function toDate(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Returns true when two dates fall on the same calendar day in IST.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  const dayKey = (date) => new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return dayKey(a) === dayKey(b);
}
