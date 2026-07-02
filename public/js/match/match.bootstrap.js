/**
 * @fileoverview Match module bootstrap.
 * @module match/match.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { clearMatchCache } from './match.service.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/**
 * @returns {Promise<void>}
 */
export async function initMatchModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    clearMatchCache();
  });
}

/**
 * @returns {void}
 */
export function destroyMatchModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = null;
  clearMatchCache();
}
