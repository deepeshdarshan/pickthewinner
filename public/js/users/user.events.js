/**
 * @fileoverview User event bus — decoupled pub/sub for profile lifecycle events.
 * @module users/user.events
 */

/** @enum {string} */
export const USER_EVENTS = Object.freeze({
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_LOADED: 'PROFILE_LOADED',
  PROFILE_DELETED: 'PROFILE_DELETED',
  PREFERENCES_UPDATED: 'PREFERENCES_UPDATED',
});

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Subscribes to a user event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void} Unsubscribe function.
 */
export function onUserEvent(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  listeners.get(event).add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
  };
}

/**
 * Emits a user event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitUserEvent(event, detail) {
  const handlers = listeners.get(event);

  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(detail);
    } catch (error) {
      console.error('[UserEvents] Handler error for', event, error);
    }
  });
}
