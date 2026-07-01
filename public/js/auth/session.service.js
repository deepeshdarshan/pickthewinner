/**
 * @fileoverview Session service — restore, monitor, and clear authentication sessions.
 * @module auth/session.service
 */

import { signOut as firebaseSignOut } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { auth } from '../firebase/firebase.js';
import { Logger } from '../utils/logger.util.js';
import { waitForAuthReady } from './auth.service.js';
import { AUTH_EVENTS } from './authentication.constants.js';
import { emitAuthEvent } from './authentication.events.js';

/**
 * Initializes the session layer and waits for Firebase to restore any existing session.
 * @returns {Promise<import('firebase/auth').User|null>}
 */
export async function initSession() {
  Logger.info('Initializing session…');
  const user = await waitForAuthReady();
  Logger.info('Session initialized:', user ? user.uid : 'no session');
  return user;
}

/**
 * Clears the current session and signs out from Firebase.
 * @returns {Promise<void>}
 */
export async function clearSession() {
  try {
    await firebaseSignOut(auth);
    emitAuthEvent(AUTH_EVENTS.LOGOUT);
    Logger.info('Session cleared.');
  } catch (error) {
    Logger.error('[SessionService] Failed to clear session:', error);
    throw error;
  }
}
