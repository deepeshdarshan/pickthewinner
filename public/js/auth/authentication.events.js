/**
 * @fileoverview Authentication event bus — pub/sub for auth lifecycle events.
 * @module auth/authentication.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

const bus = createEventBus('AuthEvents');

/**
 * Subscribes to an authentication event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onAuthEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits an authentication event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAuthEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as authEventBus };
