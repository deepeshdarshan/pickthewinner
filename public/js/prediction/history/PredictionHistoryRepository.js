/**
 * @fileoverview Prediction history repository — Firestore queries for contestant history.
 * @module prediction/history/PredictionHistoryRepository
 */

import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../../firebase/firebase.js';
import { BaseFirestoreService } from '../../services/BaseFirestoreService.js';
import { FIRESTORE_COLLECTIONS } from '../../config/application.constants.js';
import { Logger } from '../../utils/logger.util.js';

class PredictionHistoryRepository extends BaseFirestoreService {
  constructor() {
    super({
      collectionName: FIRESTORE_COLLECTIONS.PREDICTIONS,
      serviceName: 'PredictionHistoryRepository',
    });
  }

  /**
   * Lists all predictions for a contestant across tournaments.
   * @param {string} userId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listByUser(userId) {
    try {
      await ensureFirestoreOnline();

      const snapshot = await getDocs(query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
      ));

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
    } catch (error) {
      Logger.error('[PredictionHistoryRepository] listByUser failed:', userId, error);
      throw error;
    }
  }

  /**
   * Gets a single prediction by ID.
   * @param {string} predictionId
   * @returns {Promise<Record<string, unknown>|null>}
   */
  async getById(predictionId) {
    try {
      await ensureFirestoreOnline();
      const snapshot = await getDoc(doc(db, this.collectionName, predictionId));

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      };
    } catch (error) {
      Logger.error('[PredictionHistoryRepository] getById failed:', predictionId, error);
      throw error;
    }
  }
}

export const predictionHistoryRepository = new PredictionHistoryRepository();
