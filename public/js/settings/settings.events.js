/**
 * @fileoverview Platform settings event bus.
 * @module settings/settings.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const SETTINGS_EVENTS = Object.freeze({
  SETTINGS_UPDATED: 'SETTINGS_UPDATED',
});

const bus = createEventBus('SettingsEvents');

/**
 * Subscribes to a settings event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onSettingsEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits a settings event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitSettingsEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as settingsEventBus };
