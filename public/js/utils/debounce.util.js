/**
 * @fileoverview Debounce utility for rate-limiting function calls.
 * @module utils/debounce.util
 */

/**
 * Creates a debounced version of a function.
 * @template {(...args: unknown[]) => unknown} T
 * @param {T} fn
 * @param {number} delayMs
 * @returns {(...args: Parameters<T>) => void}
 */
export function debounce(fn, delayMs) {
  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timerId;

  return (...args) => {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      fn(...args);
    }, delayMs);
  };
}
