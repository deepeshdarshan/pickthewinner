/**
 * @fileoverview Display formatting utilities.
 * @module utils/formatting.util
 */

/**
 * Capitalizes the first character of a string.
 * @param {string} value
 * @returns {string}
 */
export function capitalize(value) {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Converts snake_case or kebab-case to Title Case.
 * @param {string} value
 * @returns {string}
 */
export function toTitleCase(value) {
  return value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(capitalize)
    .join(' ');
}

/**
 * Formats a number with locale-aware grouping.
 * @param {number} value
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatNumber(value, locale = 'en-US') {
  if (!Number.isFinite(value)) {
    return '0';
  }

  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Formats a percentage value.
 * @param {number} value - Value between 0 and 1.
 * @param {number} [fractionDigits=0]
 * @param {string} [locale='en-US']
 * @returns {string}
 */
export function formatPercent(value, fractionDigits = 0, locale = 'en-US') {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/**
 * Truncates text with an ellipsis.
 * @param {string} value
 * @param {number} [maxLength=80]
 * @returns {string}
 */
export function truncate(value, maxLength = 80) {
  if (!value || value.length <= maxLength) {
    return value || '';
  }

  return `${value.slice(0, maxLength - 1)}…`;
}
