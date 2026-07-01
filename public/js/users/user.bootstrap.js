/**
 * @fileoverview User module bootstrap — session hooks and last-login tracking.
 * @module users/user.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { Logger } from '../utils/logger.util.js';
import {
  clearProfileCache,
  loadCurrentUser,
  updateLastLogin,
} from './user.service.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/**
 * Initializes user module listeners and restores the current profile.
 * @returns {Promise<void>}
 */
export async function initUserModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    clearProfileCache();
  });

  onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, () => {
    void handleSessionRestored();
  });

  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
    void handleLoginSuccess();
  });

  await handleSessionRestored();
}

/**
 * Loads profile and updates last login for returning users.
 * @returns {Promise<void>}
 */
async function handleSessionRestored() {
  try {
    const profile = await loadCurrentUser();

    if (profile?.uid) {
      await updateLastLogin(profile.uid);
    }
  } catch (error) {
    Logger.error('[UserBootstrap] Session restore handling failed:', error);
  }
}

/**
 * Ensures profile cache is warm after login.
 * @returns {Promise<void>}
 */
async function handleLoginSuccess() {
  try {
    await loadCurrentUser(true);
  } catch (error) {
    Logger.error('[UserBootstrap] Login handling failed:', error);
  }
}

/**
 * Tears down user module listeners.
 * @returns {void}
 */
export function destroyUserModule() {
  unsubscribeLogout?.();
  unsubscribeLogout = null;
  clearProfileCache();
}
