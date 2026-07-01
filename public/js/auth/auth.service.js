/**
 * @fileoverview Authentication service — Google SSO, admin login, logout, and auth state.
 * @module auth/auth.service
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { auth, ensureFirestoreOnline } from '../firebase/firebase.js';
import { Logger } from '../utils/logger.util.js';
import {
  AUTH_EVENTS,
  AUTH_PROVIDERS,
  FIREBASE_AUTH_ERROR_MESSAGES,
  AUTH_MESSAGES,
} from './authentication.constants.js';
import { emitAuthEvent } from './authentication.events.js';

/** @type {import('firebase/auth').User|null} */
let currentUser = null;

/** @type {boolean} */
let authInitialized = false;

/** @type {boolean} */
let isFirstAuthState = true;

/** @type {Promise<import('firebase/auth').User|null>|null} */
let authReadyPromise = null;

/** @type {(() => void)|null} */
let authUnsubscribe = null;

/** @type {boolean} */
let signInInProgress = false;

/**
 * Synchronizes the cached user with Firebase Auth.
 * @returns {import('firebase/auth').User|null}
 */
function syncCurrentUser() {
  currentUser = auth.currentUser;
  return currentUser;
}

/**
 * Returns whether a user is currently authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return (currentUser ?? auth.currentUser) !== null;
}

/**
 * Returns the current Firebase Auth user.
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return currentUser ?? auth.currentUser;
}

/**
 * Returns the active auth provider key for the current user.
 * @returns {string|null}
 */
export function getCurrentAuthProvider() {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  const providerId = user.providerData?.[0]?.providerId;

  if (providerId === 'password') {
    return AUTH_PROVIDERS.EMAIL_PASSWORD;
  }

  return AUTH_PROVIDERS.GOOGLE;
}

/**
 * Waits until the initial Firebase auth state has been resolved.
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export function waitForAuthReady() {
  if (authReadyPromise) {
    return authReadyPromise;
  }

  authReadyPromise = new Promise((resolve) => {
    if (authInitialized) {
      resolve(currentUser);
      return;
    }

    authUnsubscribe = onAuthStateChanged(auth, (user) => {
      const previousUser = currentUser ?? auth.currentUser;

      if (!user && signInInProgress && auth.currentUser) {
        currentUser = auth.currentUser;
        return;
      }

      currentUser = user;

      if (isFirstAuthState) {
        isFirstAuthState = false;
        authInitialized = true;
        Logger.info('Auth state initialized:', user ? 'authenticated' : 'guest');

        if (user) {
          emitAuthEvent(AUTH_EVENTS.SESSION_RESTORED, { user });
        }

        resolve(user);
        return;
      }

      if (user && !previousUser) {
        emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user });
      } else if (!user && previousUser && !signInInProgress) {
        emitAuthEvent(AUTH_EVENTS.LOGOUT);
      } else if (user && previousUser && user.uid !== previousUser.uid) {
        emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user });
      }
    });
  });

  return authReadyPromise;
}

/**
 * Signs in a contestant with Google SSO.
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  signInInProgress = true;

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user ?? syncCurrentUser();

    if (!user) {
      throw Object.assign(new Error('Google sign-in did not return a user.'), {
        code: 'auth/no-user',
      });
    }

    currentUser = user;
    await ensureFirestoreOnline();
    emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user });
    return user;
  } catch (error) {
    const recoveredUser = syncCurrentUser();

    if (recoveredUser && isRecoverablePopupError(error)) {
      Logger.warn('[AuthService] Recovered Google sign-in after popup communication error.');
      currentUser = recoveredUser;
      await ensureFirestoreOnline();
      emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user: recoveredUser });
      return recoveredUser;
    }

    emitAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { error });
    throw error;
  } finally {
    signInInProgress = false;
  }
}

/**
 * Signs in an administrator with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithAdminCredentials(email, password) {
  signInInProgress = true;

  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    const user = result.user ?? syncCurrentUser();

    if (!user) {
      throw Object.assign(new Error('Admin sign-in did not return a user.'), {
        code: 'auth/no-user',
      });
    }

    currentUser = user;
    await ensureFirestoreOnline();
    emitAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, { user });
    return user;
  } catch (error) {
    emitAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { error });
    throw error;
  } finally {
    signInInProgress = false;
  }
}

/**
 * Signs out the current user and clears the auth session.
 * @returns {Promise<void>}
 */
export async function signOut() {
  await firebaseSignOut(auth);
  currentUser = null;
}

/**
 * Maps a Firebase Auth error to a user-friendly message.
 * @param {unknown} error
 * @returns {string}
 */
export function getAuthErrorMessage(error) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String(/** @type {{ code: string }} */ (error).code);
    Logger.error('[AuthService] Firebase auth error:', code);
    return FIREBASE_AUTH_ERROR_MESSAGES[code] ?? AUTH_MESSAGES.GENERIC_ERROR;
  }

  Logger.error('[AuthService] Auth error:', error);
  return AUTH_MESSAGES.GENERIC_ERROR;
}

/**
 * Tears down the auth state listener (for testing or hot reload).
 * @returns {void}
 */
export function destroyAuthListener() {
  authUnsubscribe?.();
  authUnsubscribe = null;
  authInitialized = false;
  isFirstAuthState = true;
  authReadyPromise = null;
  signInInProgress = false;
  currentUser = null;
}

/**
 * Returns whether a popup sign-in error can be recovered from Firebase Auth state.
 * @param {unknown} error
 * @returns {boolean}
 */
function isRecoverablePopupError(error) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = String(/** @type {{ code: string }} */ (error).code);
  return code === 'auth/popup-closed-by-user'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/popup-blocked';
}
