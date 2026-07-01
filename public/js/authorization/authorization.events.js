/**
 * @fileoverview Authorization event bus — permission and access lifecycle events.
 * @module authorization/authorization.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const AUTHORIZATION_EVENTS = Object.freeze({
  PERMISSION_CHANGED: 'PERMISSION_CHANGED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  ACCESS_DENIED: 'ACCESS_DENIED',
});

const bus = createEventBus('AuthorizationEvents');

/**
 * Subscribes to an authorization event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onAuthorizationEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits an authorization event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAuthorizationEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as authorizationEventBus };
