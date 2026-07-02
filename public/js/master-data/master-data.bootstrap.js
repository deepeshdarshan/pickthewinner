/**
 * @fileoverview Master data module bootstrap — session hooks and cache lifecycle.
 * @module master-data/master-data.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { clearTeamCache } from './teams/team.service.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/**
 * @returns {Promise<void>}
 */
export async function initMasterDataModule() {
  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    clearTeamCache();
  });
}

/**
 * @returns {void}
 */
export function destroyMasterDataModule() {
  if (unsubscribeLogout) {
    unsubscribeLogout();
    unsubscribeLogout = null;
  }

  clearTeamCache();
}
