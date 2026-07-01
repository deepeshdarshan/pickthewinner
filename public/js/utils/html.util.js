/**
 * @fileoverview HTML escaping utilities for safe template interpolation.
 * @module utils/html.util
 */

const HTML_ESCAPE_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#96;',
});

/**
 * Escapes a value for safe insertion into HTML text or attribute contexts.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtml(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/[&<>"'`]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

/**
 * Escapes a URL for use in an href or src attribute.
 * Returns empty string for non-http(s) schemes to reduce injection risk.
 * @param {unknown} value
 * @returns {string}
 */
export function escapeUrl(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const url = String(value).trim();

  if (!url) {
    return '';
  }

  if (/^(https?:|data:image\/)/i.test(url)) {
    return escapeHtml(url);
  }

  return '';
}
