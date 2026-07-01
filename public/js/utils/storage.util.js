/**
 * @fileoverview Browser storage helpers with JSON serialization.
 * @module utils/storage.util
 */

/**
 * Reads and parses a JSON value from localStorage.
 * @template T
 * @param {string} key
 * @param {T} [fallback=null]
 * @returns {T}
 */
export function getLocalItem(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    return /** @type {T} */ (JSON.parse(raw));
  } catch {
    return fallback;
  }
}

/**
 * Serializes and stores a value in localStorage.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function setLocalItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * Removes a key from localStorage.
 * @param {string} key
 * @returns {void}
 */
export function removeLocalItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore storage errors */
  }
}

/**
 * Reads a sessionStorage value.
 * @template T
 * @param {string} key
 * @param {T} [fallback=null]
 * @returns {T}
 */
export function getSessionItem(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }

    return /** @type {T} */ (JSON.parse(raw));
  } catch {
    return fallback;
  }
}

/**
 * Stores a value in sessionStorage.
 * @param {string} key
 * @param {unknown} value
 * @returns {boolean}
 */
export function setSessionItem(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
