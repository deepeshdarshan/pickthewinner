/**
 * @fileoverview Venue event bus — decoupled pub/sub for venue lifecycle events.
 * @module master-data/venues/venue.events
 */

import { createEventBus } from '../../shared/events/event-bus.js';

/** @enum {string} */
export const VENUE_EVENTS = Object.freeze({
  VENUE_CREATED: 'VENUE_CREATED',
  VENUE_UPDATED: 'VENUE_UPDATED',
  VENUE_DELETED: 'VENUE_DELETED',
});

const bus = createEventBus('VenueEvents');

/**
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onVenueEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitVenueEvent(event, detail) {
  bus.publish(event, detail);
}

export { bus as venueEventBus };
