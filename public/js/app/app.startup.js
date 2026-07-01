/**
 * @fileoverview Application startup sequence — orchestrates module initialization.
 * @module app/app.startup
 */

import { initGlobalErrorHandler } from './error-handler.js';
import { initSession } from '../auth/session.service.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { initUserModule } from '../users/user.bootstrap.js';
import { initAuthorizationModule } from '../authorization/authorization.bootstrap.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { loadCurrentUser } from '../users/user.service.js';
import { Logger } from '../utils/logger.util.js';
import { APP_EVENTS, emitAppEvent } from './app.events.js';
import { AppContext, initAppContext } from './app.context.js';

/**
 * Runs the application startup sequence in the correct order.
 * @returns {Promise<void>}
 */
export async function runStartup() {
  Logger.info('Starting application…');

  initGlobalErrorHandler();
  initAppContext();

  await initSession();

  await initUserModule();
  await initAuthorizationModule();

  if (isAuthenticated()) {
    try {
      await loadCurrentUser();
      await AuthorizationService.resolve();
      AppContext.markReady();
      Logger.info('User context ready.');
    } catch (err) {
      Logger.error('Failed to initialize user context:', err);
    }
  } else {
    AppContext.reset();
  }

  emitAppEvent(APP_EVENTS.APPLICATION_STARTED);
  Logger.info('Application startup complete.');
}
