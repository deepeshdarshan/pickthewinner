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
 * Formats a date as YYYY-MM-DD for HTML date inputs in the app timezone.
 * @param {Date|string|number} value
 * @returns {string}
 */
export function formatDateInput(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-CA', { timeZone: APP_TIMEZONE });
}

/**
 * Parses date and time strings as an instant in the app timezone.
 * @param {string} dateStr - YYYY-MM-DD
 * @param {string} timeStr - HH:mm
 * @returns {Date|null}
 */
export function parseAppDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) {
    return null;
  }

  const parsed = new Date(`${dateStr}T${timeStr}:00+05:30`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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
 * Handles Date, ISO strings, epoch numbers, and Firestore Timestamps.
 * @param {Date|string|number|{ toDate?: () => Date, seconds?: number, _seconds?: number, nanoseconds?: number, _nanoseconds?: number }|null|undefined} value
 * @returns {Date|null}
 */
export function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'object') {
    if ('toDate' in value && typeof value.toDate === 'function') {
      const date = value.toDate();
      return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
    }

    const seconds = 'seconds' in value
      ? value.seconds
      : ('_seconds' in value ? value._seconds : undefined);

    if (typeof seconds === 'number') {
      const nanoseconds = 'nanoseconds' in value
        ? Number(value.nanoseconds ?? 0)
        : Number(value._nanoseconds ?? 0);
      const date = new Date(seconds * 1000 + nanoseconds / 1e6);
      return Number.isNaN(date.getTime()) ? null : date;
    }
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

/**
 * Returns a stable day index for calendar-day comparisons in the app timezone.
 * @param {Date} date
 * @returns {number}
 */
function getCalendarDayIndex(date) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  const [year, month, day] = formatted.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

/**
 * Returns whole calendar days between two instants in the app timezone.
 * @param {Date} earlier
 * @param {Date} [later]
 * @returns {number}
 */
export function getCalendarDayDifference(earlier, later = new Date()) {
  return getCalendarDayIndex(later) - getCalendarDayIndex(earlier);
}
