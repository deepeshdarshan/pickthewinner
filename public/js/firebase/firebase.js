/**
 * @fileoverview Firebase initialization — single entry point for Firebase SDK.
 * @module firebase/firebase
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore, enableNetwork } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js';
import { firebaseConfig } from '../config/app.config.js';
import { Logger } from '../utils/logger.util.js';

/** @type {import('firebase/app').FirebaseApp} */
const app = initializeApp(firebaseConfig);

/** @type {import('firebase/auth').Auth} */
export const auth = getAuth(app);

/** @type {import('firebase/firestore').Firestore} */
export const db = getFirestore(app);

/** @type {import('firebase/firestore').Firestore} */
export const firestore = db;

/** @type {import('firebase/storage').FirebaseStorage} */
export const storage = getStorage(app);

/** @type {boolean} */
let networkRecoveryNeeded = false;

/** @type {Promise<void>|null} */
let ensureOnlineInFlight = null;

/**
 * Marks that Firestore may need network recovery after a disruptive auth flow.
 * enableNetwork() must only run after disableNetwork() or a known offline event —
 * calling it on every read/write bricks the Firestore async queue.
 * @returns {void}
 */
export function markFirestoreNetworkRecoveryNeeded() {
  networkRecoveryNeeded = true;
}

/**
 * Re-enables the Firestore network client after popup sign-in recovery.
 * No-op during normal operation when the client is already online.
 * @returns {Promise<void>}
 */
export async function ensureFirestoreOnline() {
  if (!networkRecoveryNeeded) {
    return;
  }

  if (ensureOnlineInFlight) {
    return ensureOnlineInFlight;
  }

  ensureOnlineInFlight = enableNetwork(db)
    .then(() => {
      networkRecoveryNeeded = false;
    })
    .catch((error) => {
      if (error?.code === 'failed-precondition') {
        networkRecoveryNeeded = false;
        return;
      }

      Logger.warn('[Firebase] ensureFirestoreOnline failed:', error);
    })
    .finally(() => {
      ensureOnlineInFlight = null;
    });

  return ensureOnlineInFlight;
}

export { app };
