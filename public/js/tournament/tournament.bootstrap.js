/**
 * @fileoverview Tournament module bootstrap — session hooks and active tournament loading.
 * @module tournament/tournament.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { Logger } from '../utils/logger.util.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { TournamentConfigurationService } from './configuration/TournamentConfigurationService.js';
import { ApplicationContext } from '../app/application-context.js';
import {
  clearTournamentCache,
  loadActiveTournamentIntoContext,
} from './tournament.service.js';
import { TOURNAMENT_EVENTS, onTournamentEvent } from './tournament.events.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/** @type {(() => void)|null} */
let unsubscribeActiveChanged = null;

/** @type {(() => void)|null} */
let unsubscribeTournamentUpdated = null;

/**
 * Initializes tournament module listeners and loads active tournament context.
 * @returns {Promise<void>}
 */
export async function initTournamentModule() {
  unsubscribeLogout?.();
  unsubscribeActiveChanged?.();
  unsubscribeTournamentUpdated?.();

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

  unsubscribeTournamentUpdated = onTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_UPDATED, (detail) => {
    if (!detail || typeof detail !== 'object') {
      return;
    }

    const tournament = /** @type {{ id?: string, active?: boolean, configuration?: Record<string, unknown> }} */ (detail);
    const activeTournament = ApplicationContext.getTournament();
    const isActiveTournament = Boolean(tournament.active)
      || (activeTournament && typeof activeTournament === 'object'
        && 'id' in activeTournament
        && activeTournament.id === tournament.id);

    if (isActiveTournament && tournament.id) {
      void TournamentConfigurationService.load(
        tournament.id,
        tournament.configuration ?? null,
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
  unsubscribeTournamentUpdated?.();
  unsubscribeLogout = null;
  unsubscribeActiveChanged = null;
  unsubscribeTournamentUpdated = null;
  clearTournamentCache();
  TournamentConfigurationService.clearCache();
}
