/**
 * @fileoverview Firebase initialization — single entry point for Firebase SDK.
 * @module firebase/firebase
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js';
import { firebaseConfig } from '../config/app.config.js';

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

export { app };
