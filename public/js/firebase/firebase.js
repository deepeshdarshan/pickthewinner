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

/** @type {Promise<void>|null} */
let ensureOnlineInFlight = null;

/**
 * Re-enables the Firestore network client.
 * Called before reads/writes to recover from the brief offline state that can
 * follow a Google popup sign-in (COOP side-effect).
 *
 * Concurrent callers share one in-flight enableNetwork call so the SDK async
 * queue is not disrupted by overlapping network toggles.
 * @returns {Promise<void>}
 */
export async function ensureFirestoreOnline() {
  if (ensureOnlineInFlight) {
    return ensureOnlineInFlight;
  }

  ensureOnlineInFlight = enableNetwork(db)
    .catch((error) => {
      if (error?.code !== 'failed-precondition') {
        Logger.warn('[Firebase] ensureFirestoreOnline failed:', error);
      }
    })
    .finally(() => {
      ensureOnlineInFlight = null;
    });

  return ensureOnlineInFlight;
}

export { app };
