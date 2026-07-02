/**
 * @fileoverview Tournament event bus — decoupled pub/sub for tournament lifecycle events.
 * @module tournament/tournament.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const TOURNAMENT_EVENTS = Object.freeze({
  TOURNAMENT_CREATED: 'TOURNAMENT_CREATED',
  TOURNAMENT_UPDATED: 'TOURNAMENT_UPDATED',
  TOURNAMENT_PUBLISHED: 'TOURNAMENT_PUBLISHED',
  TOURNAMENT_ARCHIVED: 'TOURNAMENT_ARCHIVED',
  TOURNAMENT_RESTORED: 'TOURNAMENT_RESTORED',
  TOURNAMENT_DELETED: 'TOURNAMENT_DELETED',
  ACTIVE_TOURNAMENT_CHANGED: 'ACTIVE_TOURNAMENT_CHANGED',
});

const bus = createEventBus('TournamentEvents');

/**
 * Subscribes to a tournament event.
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onTournamentEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * Emits a tournament event to all subscribers.
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitTournamentEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as tournamentEventBus };
