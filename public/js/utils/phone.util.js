/**
 * @fileoverview Phone number formatting for tel: and WhatsApp links.
 * @module utils/phone.util
 */

import { appSettings } from '../config/app.config.js';

/**
 * Extracts digits from a phone string.
 * @param {unknown} phone
 * @returns {string}
 */
export function normalizePhoneDigits(phone) {
  return typeof phone === 'string' ? phone.replace(/\D/g, '') : '';
}

/**
 * Derives default country calling code from app support contact.
 * @returns {string}
 */
function getDefaultCountryCode() {
  const digits = normalizePhoneDigits(appSettings.supportContactPhone);
  if (digits.length > 10) {
    return digits.slice(0, digits.length - 10);
  }
  return '91';
}

/**
 * Normalizes a phone number to international digits (no leading +).
 * @param {unknown} phone
 * @returns {string|null}
 */
export function toInternationalDigits(phone) {
  const digits = normalizePhoneDigits(phone);
  if (!digits) {
    return null;
  }

  if (digits.length === 10) {
    return `${getDefaultCountryCode()}${digits}`;
  }

  return digits;
}

/**
 * @param {unknown} phone
 * @returns {string|null}
 */
export function formatPhoneForTel(phone) {
  const digits = toInternationalDigits(phone);
  return digits ? `tel:+${digits}` : null;
}

/**
 * @param {unknown} phone
 * @returns {string|null}
 */
export function formatPhoneForWhatsApp(phone) {
  const digits = toInternationalDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

/**
 * @param {unknown} phone
 * @returns {boolean}
 */
export function hasCallablePhone(phone) {
  return toInternationalDigits(phone) !== null;
}
