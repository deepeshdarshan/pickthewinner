/**
 * @fileoverview Leaderboard module events.
 * @module leaderboard/leaderboard.events
 */

import { createEventBus } from '../shared/events/event-bus.js';

/** @enum {string} */
export const LEADERBOARD_EVENTS = Object.freeze({
  LOADED: 'leaderboard:loaded',
  ERROR: 'leaderboard:error',
  REFRESHED: 'leaderboard:refreshed',
  FILTER_CHANGED: 'leaderboard:filter_changed',
  SORT_CHANGED: 'leaderboard:sort_changed',
  SEARCH_CHANGED: 'leaderboard:search_changed',
});

const leaderboardEventBus = createEventBus('leaderboard');

/**
 * @param {string} event
 * @param {unknown} data
 * @returns {void}
 */
export function emitLeaderboardEvent(event, data) {
  leaderboardEventBus.emit(event, data);
}

/**
 * @param {string} event
 * @param {Function} handler
 * @returns {Function}
 */
export function onLeaderboardEvent(event, handler) {
  return leaderboardEventBus.on(event, handler);
}

