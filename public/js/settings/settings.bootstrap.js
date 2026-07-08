/**
 * @fileoverview Platform settings module bootstrap.
 * @module settings/settings.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { Logger } from '../utils/logger.util.js';
import { PlatformSettingsService } from './settings.service.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/**
 * Initializes platform settings listeners and loads settings for authenticated sessions.
 * @returns {Promise<void>}
 */
export async function initSettingsModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    PlatformSettingsService.clearCache();
  });

  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
    void handleSessionSettingsLoad();
  });

  onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, () => {
    void handleSessionSettingsLoad();
  });

  if (isAuthenticated()) {
    await handleSessionSettingsLoad();
  }
}

/**
 * @returns {Promise<void>}
 */
async function handleSessionSettingsLoad() {
  try {
    await PlatformSettingsService.load();
  } catch (error) {
    Logger.error('[SettingsBootstrap] Failed to load platform settings:', error);
  }
}

/**
 * Tears down platform settings listeners.
 * @returns {void}
 */
export function destroySettingsModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = null;
  PlatformSettingsService.clearCache();
}
