/**
 * @fileoverview Scoring events.
 * @module scoring/scoring.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const SCORING_EVENTS = Object.freeze({
  SCORING_COMPLETED: 'SCORING_COMPLETED',
});

const bus = createEventBus('ScoringEvents');

/**
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onScoringEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitScoringEvent(event, detail) {
  bus.publish(event, detail);
}
