/**
 * @fileoverview Prediction repository.
 * @module prediction/prediction.repository
 */

import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  where,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';

/**
 * @param {string} matchId
 * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
 */
export async function listPredictionsByMatch(matchId) {
  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(
    collection(db, FIRESTORE_COLLECTIONS.PREDICTIONS),
    where('matchId', '==', matchId),
  ));

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

/**
 * @param {string} matchId
 * @param {string} userId
 * @returns {Promise<({ id: string } & Record<string, unknown>)|null>}
 */
export async function getPredictionForUser(matchId, userId) {
  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(
    collection(db, FIRESTORE_COLLECTIONS.PREDICTIONS),
    where('matchId', '==', matchId),
    where('userId', '==', userId),
  ));

  if (snapshot.empty) {
    return null;
  }

  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() };
}

/**
 * @param {string} userId
 * @returns {Promise<Array<{ id: string } & Record<string, unknown>>>}
 */
export async function listPredictionsByUser(userId) {
  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(
    collection(db, FIRESTORE_COLLECTIONS.PREDICTIONS),
    where('userId', '==', userId),
  ));

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

/**
 * @param {string} predictionId
 * @param {Record<string, unknown>} data
 * @returns {Promise<void>}
 */
export async function updatePrediction(predictionId, data) {
  await ensureFirestoreOnline();
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.PREDICTIONS, predictionId), data);
}

/**
 * @param {string} matchId
 * @returns {Promise<void>}
 */
export async function resetPredictionScores(matchId) {
  const predictions = await listPredictionsByMatch(matchId);

  await Promise.all(predictions.map((prediction) => updatePrediction(prediction.id, {
    calculatedPoints: 0,
    scoringBreakdown: [],
    scored: false,
    scoredAt: null,
  })));
}
