/**
 * @fileoverview Tournament module bootstrap — session hooks and active tournament loading.
 * @module tournament/tournament.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { Logger } from '../utils/logger.util.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { TournamentConfigurationService } from './configuration/TournamentConfigurationService.js';
import {
  clearTournamentCache,
  loadActiveTournamentIntoContext,
} from './tournament.service.js';
import { TOURNAMENT_EVENTS, onTournamentEvent } from './tournament.events.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/** @type {(() => void)|null} */
let unsubscribeActiveChanged = null;

/**
 * Initializes tournament module listeners and loads active tournament context.
 * @returns {Promise<void>}
 */
export async function initTournamentModule() {
  unsubscribeLogout?.();
  unsubscribeActiveChanged?.();

  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    clearTournamentCache();
    TournamentConfigurationService.clearCache();
  });

  unsubscribeActiveChanged = onTournamentEvent(TOURNAMENT_EVENTS.ACTIVE_TOURNAMENT_CHANGED, (detail) => {
    if (detail && typeof detail === 'object') {
      void TournamentConfigurationService.load(
        /** @type {{ id?: string }} */ (detail).id ?? null,
      );
    }
  });

  if (isAuthenticated()) {
    await handleSessionTournamentLoad();
  }

  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
    void handleSessionTournamentLoad();
  });

  onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, () => {
    void handleSessionTournamentLoad();
  });
}

/**
 * @returns {Promise<void>}
 */
async function handleSessionTournamentLoad() {
  try {
    const tournament = await loadActiveTournamentIntoContext();

    if (tournament?.id) {
      await TournamentConfigurationService.load(tournament.id);
    }
  } catch (error) {
    Logger.error('[TournamentBootstrap] Failed to load active tournament:', error);
  }
}

/**
 * Tears down tournament module listeners.
 * @returns {void}
 */
export function destroyTournamentModule() {
  unsubscribeLogout?.();
  unsubscribeActiveChanged?.();
  unsubscribeLogout = null;
  unsubscribeActiveChanged = null;
  clearTournamentCache();
  TournamentConfigurationService.clearCache();
}
