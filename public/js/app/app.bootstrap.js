/**
 * @fileoverview Application bootstrap — mounts shell, runs startup, and initializes router.
 * @module app/app.bootstrap
 */

import { mountAppShell } from '../services/layout.service.js';
import { initRouter, onNavigate } from '../services/router.service.js';
import { normalizePath } from '../config/routes.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { AUTH_MESSAGES } from '../auth/authentication.constants.js';
import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { USER_EVENTS, onUserEvent } from '../users/user.events.js';
import { AUTHORIZATION_EVENTS, onAuthorizationEvent } from '../authorization/authorization.events.js';
import { updateAppShell } from '../services/layout.service.js';
import { Logger } from '../utils/logger.util.js';
import { runStartup } from './app.startup.js';
import { APP_EVENTS, onAppEvent } from './app.events.js';
import { getCurrentPath } from '../services/router.service.js';
import { TOURNAMENT_EVENTS, onTournamentEvent } from '../tournament/tournament.events.js';

/**
 * Bootstraps the single-page application.
 * @returns {Promise<void>}
 */
export async function bootstrapApplication() {
  const outlet = document.getElementById('ptw-page-outlet');

  if (!outlet) {
    Logger.error('Page outlet element not found.');
    return;
  }

  showLoadingOverlay(AUTH_MESSAGES.RESTORING_SESSION);

  try {
    mountAppShell({
      activePath: normalizePath(window.location.pathname),
    });

    await runStartup();
    registerShellRefreshHandlers();
    await initRouter(outlet);

    Logger.info('Application bootstrap complete.');
  } catch (error) {
    Logger.error('Bootstrap failed:', error);
    throw error;
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Refreshes shell components when auth, profile, or role state changes.
 * @returns {void}
 */
function registerShellRefreshHandlers() {
  const refreshShell = () => {
    updateAppShell(getCurrentPath());
  };

  onNavigate(refreshShell);
  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, refreshShell);
  onAuthEvent(AUTH_EVENTS.LOGOUT, refreshShell);
  onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, refreshShell);
  onUserEvent(USER_EVENTS.PROFILE_LOADED, refreshShell);
  onUserEvent(USER_EVENTS.PROFILE_UPDATED, refreshShell);
  onAuthorizationEvent(AUTHORIZATION_EVENTS.ROLE_CHANGED, refreshShell);
  onAppEvent(APP_EVENTS.CONTEXT_READY, refreshShell);
  onTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_UPDATED, refreshShell);
  onTournamentEvent(TOURNAMENT_EVENTS.ACTIVE_TOURNAMENT_CHANGED, refreshShell);
}
