/**
 * @fileoverview Application-level event bus for cross-module communication.
 * @module app/app.events
 */

import { Logger } from '../utils/logger.util.js';

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

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

/**
 * Subscribes to an application event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void} Unsubscribe function.
 */
export function onAppEvent(event, handler) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }

  listeners.get(event).add(handler);

  return () => {
    listeners.get(event)?.delete(handler);
  };
}

/**
 * Emits an application event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitAppEvent(event, detail) {
  const handlers = listeners.get(event);

  if (!handlers) {
    return;
  }

  handlers.forEach((handler) => {
    try {
      handler(detail);
    } catch (err) {
      Logger.error('[AppEvents] Handler error for', event, err);
    }
  });
}
