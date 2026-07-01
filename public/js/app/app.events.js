/**
 * @fileoverview Application-level event bus for cross-module communication.
 * @module app/app.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const APP_EVENTS = Object.freeze({
  APPLICATION_STARTED: 'app:application-started',
  LOGIN_SUCCESS: 'app:login-success',
  LOGIN_FAILED: 'app:login-failed',
  SESSION_RESTORED: 'app:session-restored',
  PROFILE_LOADED: 'app:profile-loaded',
  PROFILE_UPDATED: 'app:profile-updated',
  ROLE_CHANGED: 'app:role-changed',
  LOGOUT: 'app:logout',
  NETWORK_ONLINE: 'app:network-online',
  NETWORK_OFFLINE: 'app:network-offline',
  CONTEXT_READY: 'app:context-ready',
});

const bus = createEventBus('AppEvents');

/**
 * Subscribes to an application event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onAppEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits an application event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAppEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as appEventBus };
