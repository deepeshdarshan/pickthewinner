/**
 * @fileoverview Centralized application context — single source for session state.
 * @module app/app.context
 */

import { getCurrentUser, isAuthenticated } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { getCachedProfile } from '../users/user.service.js';
import { ApplicationContext } from './application-context.js';
import { appSettings } from '../config/app.config.js';
import { getLocalItem } from '../utils/storage.util.js';
import { STORAGE_KEYS } from '../config/application.constants.js';
import { APP_EVENTS, emitAppEvent, onAppEvent } from './app.events.js';
import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { USER_EVENTS, onUserEvent } from '../users/user.events.js';
import { AUTHORIZATION_EVENTS, onAuthorizationEvent } from '../authorization/authorization.events.js';

/** @type {boolean} */
let contextReady = false;

/**
 * Centralized application context. Modules read session state from here
 * instead of querying Firestore or Firebase Auth repeatedly.
 */
export const AppContext = {
  /**
   * Returns whether the application context has been initialized.
   * @returns {boolean}
   */
  isReady() {
    return contextReady;
  },

  /**
   * Returns the current Firebase Auth user, if any.
   * @returns {import('firebase/auth').User|null}
   */
  getUser() {
    return ApplicationContext.getCurrentUser() ?? getCurrentUser();
  },

  /**
   * Returns whether a user is authenticated.
   * @returns {boolean}
   */
  isAuthenticated() {
    return isAuthenticated();
  },

  /**
   * Returns the cached Firestore user profile.
   * @returns {import('../users/user.service.js').UserProfile|null}
   */
  getProfile() {
    return ApplicationContext.getProfile() ?? getCachedProfile();
  },

  /**
   * Returns the current user's display name.
   * @returns {string}
   */
  getDisplayName() {
    const profile = getCachedProfile();
    const authUser = getCurrentUser();
    return profile?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'User';
  },

  /**
   * Returns the current user's email.
   * @returns {string}
   */
  getEmail() {
    const profile = getCachedProfile();
    const authUser = getCurrentUser();
    return profile?.email || authUser?.email || '';
  },

  /**
   * Returns the current user's photo URL.
   * @returns {string}
   */
  getPhotoURL() {
    const profile = getCachedProfile();
    const authUser = getCurrentUser();
    return profile?.photoURL || authUser?.photoURL || '';
  },

  /**
   * Returns the current user's role.
   * @returns {string|null}
   */
  getRole() {
    return AuthorizationService.getCurrentRole();
  },

  /**
   * Returns the current user's permission set.
   * @returns {ReadonlySet<string>}
   */
  getPermissions() {
    return AuthorizationService.getCurrentPermissions();
  },

  /**
   * Returns the active theme preference.
   * @returns {string}
   */
  getTheme() {
    return getLocalItem(STORAGE_KEYS.THEME, appSettings.theme);
  },

  /**
   * Returns the application timezone (IST only).
   * @returns {string}
   */
  getTimezone() {
    return appSettings.timezone;
  },

  /**
   * Returns the application version string.
   * @returns {string}
   */
  getVersion() {
    return appSettings.version;
  },

  /**
   * Marks the context as ready and emits CONTEXT_READY.
   * @returns {void}
   */
  markReady() {
    contextReady = true;
    emitAppEvent(APP_EVENTS.CONTEXT_READY);
  },

  /**
   * Resets context readiness (e.g. on logout).
   * @returns {void}
   */
  reset() {
    contextReady = false;
    ApplicationContext.clear();
  },
};

/** @type {(() => void)|null} */
let teardownContext = null;

/**
 * Wires application context to auth, user, and authorization events.
 * @returns {void}
 */
export function initAppContext() {
  teardownContext?.();

  const unsubs = [
    onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
      AppContext.reset();
      emitAppEvent(APP_EVENTS.LOGOUT);
    }),
    onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
      emitAppEvent(APP_EVENTS.LOGIN_SUCCESS);
    }),
    onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, () => {
      emitAppEvent(APP_EVENTS.SESSION_RESTORED);
    }),
    onUserEvent(USER_EVENTS.PROFILE_LOADED, (detail) => {
      emitAppEvent(APP_EVENTS.PROFILE_LOADED, detail);
    }),
    onUserEvent(USER_EVENTS.PROFILE_UPDATED, (detail) => {
      emitAppEvent(APP_EVENTS.PROFILE_UPDATED, detail);
    }),
    onAuthorizationEvent(AUTHORIZATION_EVENTS.ROLE_CHANGED, (detail) => {
      emitAppEvent(APP_EVENTS.ROLE_CHANGED, detail);
    }),
    onAppEvent(APP_EVENTS.NETWORK_ONLINE, () => {}),
  ];

  if (typeof window !== 'undefined') {
    const handleOnline = () => emitAppEvent(APP_EVENTS.NETWORK_ONLINE);
    const handleOffline = () => emitAppEvent(APP_EVENTS.NETWORK_OFFLINE);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    unsubs.push(() => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });
  }

  teardownContext = () => {
    unsubs.forEach((unsub) => unsub());
    teardownContext = null;
  };
}
