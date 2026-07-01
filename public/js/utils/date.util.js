/**
 * @fileoverview Date formatting and parsing utilities.
 * @module utils/date.util
 */

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
 * Formats a date for display using locale conventions.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatDateDisplay(value, options = {}, locale = 'en-US') {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
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
 * Returns true when two dates fall on the same calendar day.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
