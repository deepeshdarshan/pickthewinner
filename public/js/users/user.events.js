/**
 * @fileoverview User event bus — decoupled pub/sub for profile lifecycle events.
 * @module users/user.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const USER_EVENTS = Object.freeze({
  PROFILE_CREATED: 'PROFILE_CREATED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  PROFILE_LOADED: 'PROFILE_LOADED',
  PROFILE_DELETED: 'PROFILE_DELETED',
  PREFERENCES_UPDATED: 'PREFERENCES_UPDATED',
});

const bus = createEventBus('UserEvents');

/**
 * Subscribes to a user event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onUserEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits a user event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitUserEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as userEventBus };
