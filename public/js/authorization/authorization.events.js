/**
 * @fileoverview Authorization event bus — pub/sub for permission lifecycle events.
 * @module authorization/authorization.events
 */

/** @enum {string} */
export const AUTHORIZATION_EVENTS = Object.freeze({
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  ACCESS_DENIED: 'ACCESS_DENIED',
});

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Subscribes to an authorization event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void} Unsubscribe function.
 */
export function onAuthorizationEvent(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  listeners.get(event).add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
  };
}

/**
 * Emits an authorization event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAuthorizationEvent(event, detail) {
  const handlers = listeners.get(event);

  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(detail);
    } catch (error) {
      console.error('[AuthorizationEvents] Handler error for', event, error);
    }
  });
}
