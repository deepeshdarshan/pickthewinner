/**
 * @fileoverview Authorization module bootstrap — session hooks and permission cache lifecycle.
 * @module authorization/authorization.bootstrap
 */

import { AUTH_EVENTS, onAuthEvent } from '../auth/authentication.events.js';
import { USER_EVENTS, onUserEvent } from '../users/user.events.js';
import { AuthorizationService } from './authorization.service.js';
import { ApplicationContext } from '../app/application-context.js';
import {
  AUTHORIZATION_EVENTS,
  onAuthorizationEvent,
} from './authorization.events.js';
import { AUTHORIZATION_MESSAGES } from './permission.constants.js';
import { showWarningToast } from '../utils/toast.util.js';

/** @type {(() => void)|null} */
let unsubscribeLogout = null;

/** @type {(() => void)|null} */
let unsubscribeProfileLoaded = null;

/** @type {(() => void)|null} */
let unsubscribeProfileUpdated = null;

/** @type {(() => void)|null} */
let unsubscribeProfileCreated = null;

/**
 * Initializes authorization listeners and resolves permissions for the current session.
 * @returns {Promise<void>}
 */
export async function initAuthorizationModule() {
  teardownAuthorizationModule();

  unsubscribeLogout = onAuthEvent(AUTH_EVENTS.LOGOUT, () => {
    AuthorizationService.clearCache();
    ApplicationContext.clear();
  });

  unsubscribeProfileLoaded = onUserEvent(USER_EVENTS.PROFILE_LOADED, (detail) => {
    if (detail && typeof detail === 'object' && 'profile' in detail) {
      ApplicationContext.setProfile(/** @type {{ profile: import('../users/user.service.js').UserProfile }} */ (detail).profile);
    }
    void AuthorizationService.resolve(true);
  });

  unsubscribeProfileUpdated = onUserEvent(USER_EVENTS.PROFILE_UPDATED, () => {
    void AuthorizationService.resolve(true);
  });

  unsubscribeProfileCreated = onUserEvent(USER_EVENTS.PROFILE_CREATED, () => {
    void AuthorizationService.resolve(true);
  });

  onAuthEvent(AUTH_EVENTS.SESSION_RESTORED, () => {
    void AuthorizationService.resolve(true);
  });

  onAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, () => {
    void AuthorizationService.resolve(false);
  });

  onAuthorizationEvent(AUTHORIZATION_EVENTS.ACCESS_DENIED, (detail) => {
    if (detail && typeof detail === 'object' && 'action' in detail) {
      showWarningToast(AUTHORIZATION_MESSAGES.PERMISSION_DENIED);
    }
  });

  await AuthorizationService.resolve();
}

/**
 * Tears down authorization module listeners and clears cached permissions.
 * @returns {void}
 */
export function teardownAuthorizationModule() {
  unsubscribeLogout?.();
  unsubscribeProfileLoaded?.();
  unsubscribeProfileUpdated?.();
  unsubscribeProfileCreated?.();

  unsubscribeLogout = null;
  unsubscribeProfileLoaded = null;
  unsubscribeProfileUpdated = null;
  unsubscribeProfileCreated = null;

  AuthorizationService.clearCache();
}
