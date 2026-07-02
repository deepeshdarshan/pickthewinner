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

const bus = createEventBus('LeaderboardEvents');

/**
 * @param {string} event
 * @param {(detail?: unknown) => void} handler
 * @returns {() => void}
 */
export function onLeaderboardEvent(event, handler) {
  return bus.subscribe(event, handler);
}

/**
 * @param {string} event
 * @param {unknown} [detail]
 * @returns {void}
 */
export function emitLeaderboardEvent(event, detail) {
  bus.publish(event, detail);
}

