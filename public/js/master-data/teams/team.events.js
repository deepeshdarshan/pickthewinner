/**
 * @fileoverview Team event bus — decoupled pub/sub for team lifecycle events.
 * @module master-data/teams/team.events
 */

import { createEventBus } from '../../shared/events/event-bus.js';

/** @enum {string} */
export const TEAM_EVENTS = Object.freeze({
  TEAM_CREATED: 'TEAM_CREATED',
  TEAM_UPDATED: 'TEAM_UPDATED',
  TEAM_DELETED: 'TEAM_DELETED',
});

const bus = createEventBus('TeamEvents');

/**
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onTeamEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitTeamEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as teamEventBus };
