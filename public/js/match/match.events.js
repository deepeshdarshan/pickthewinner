/**
 * @fileoverview Match event bus.
 * @module match/match.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const MATCH_EVENTS = Object.freeze({
  MATCH_CREATED: 'MATCH_CREATED',
  MATCH_UPDATED: 'MATCH_UPDATED',
  MATCH_STATUS_CHANGED: 'MATCH_STATUS_CHANGED',
  MATCH_RESULT_PUBLISHED: 'MATCH_RESULT_PUBLISHED',
  MATCH_ARCHIVED: 'MATCH_ARCHIVED',
});

const bus = createEventBus('MatchEvents');

/**
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onMatchEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitMatchEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as matchEventBus };
