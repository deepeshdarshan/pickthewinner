/**
 * @fileoverview Throttle utility for limiting function call frequency.
 * @module utils/throttle.util
 */

/**
 * Creates a throttled version of a function.
 * @template {(...args: unknown[]) => unknown} T
 * @param {T} fn
 * @param {number} intervalMs
 * @returns {(...args: Parameters<T>) => void}
 */
export function throttle(fn, intervalMs) {
  /** @type {number} */
  let lastCall = 0;

  return (...args) => {
    const now = Date.now();

    if (now - lastCall >= intervalMs) {
      lastCall = now;
      fn(...args);
    }
  };
}
