/**
 * @fileoverview Authentication event bus — pub/sub for auth lifecycle events.
 * @module auth/authentication.events
 */

import { Logger } from '../utils/logger.util.js';

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Subscribes to an authentication event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void} Unsubscribe function.
 */
export function onAuthEvent(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  listeners.get(event).add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
  };
}

/**
 * Emits an authentication event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAuthEvent(event, detail) {
  const handlers = listeners.get(event);

  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(detail);
    } catch (err) {
      Logger.error('[AuthEvents] Handler error for', event, err);
    }
  });
}
