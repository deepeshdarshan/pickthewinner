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
import { auth } from '../firebase/firebase.js';
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

/**
 * Returns whether a user is currently authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Returns the current Firebase Auth user.
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return currentUser;
}

/**
 * Returns the active auth provider key for the current user.
 * @returns {string|null}
 */
export function getCurrentAuthProvider() {
  if (!currentUser) {
    return null;
  }

  const providerId = currentUser.providerData?.[0]?.providerId;

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
      const previousUser = currentUser;
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
      } else if (!user && previousUser) {
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

  try {
    const result = await signInWithPopup(auth, provider);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    emitAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { error });
    throw error;
  }
}

/**
 * Signs in an administrator with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import('firebase/auth').User>}
 */
export async function signInWithAdminCredentials(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    currentUser = result.user;
    return result.user;
  } catch (error) {
    emitAuthEvent(AUTH_EVENTS.LOGIN_FAILED, { error });
    throw error;
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
  currentUser = null;
}
