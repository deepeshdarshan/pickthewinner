/**
 * @fileoverview Firebase initialization — single entry point for Firebase SDK.
 * @module firebase/firebase
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import {
  getFirestore,
  enableNetwork,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
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
let firestoreNetworkPromise = null;

/**
 * Ensures the Firestore client is online before reads/writes.
 * Popup sign-in can briefly leave Firestore in an offline state.
 * @returns {Promise<void>}
 */
export async function ensureFirestoreOnline() {
  if (!firestoreNetworkPromise) {
    firestoreNetworkPromise = enableNetwork(db)
      .catch((error) => {
        firestoreNetworkPromise = null;

        if (error?.code === 'failed-precondition') {
          return;
        }

        throw error;
      });
  }

  await firestoreNetworkPromise;
}

void ensureFirestoreOnline().catch((error) => {
  Logger.warn('[Firebase] Initial Firestore network enable failed:', error);
});

export { app };
