/**
 * @fileoverview Prediction management repository — Firestore queries for admin prediction views.
 * @module prediction/admin/PredictionManagementRepository
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

class PredictionManagementRepository extends BaseFirestoreService {
  constructor() {
    super({
      collectionName: FIRESTORE_COLLECTIONS.PREDICTIONS,
      serviceName: 'PredictionManagementRepository',
    });
  }

  /**
   * Lists all predictions for a tournament.
   * @param {string} tournamentId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listByTournament(tournamentId) {
    try {
      await ensureFirestoreOnline();

      const snapshot = await getDocs(query(
        collection(db, this.collectionName),
        where('tournamentId', '==', tournamentId),
      ));

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
    } catch (error) {
      Logger.error('[PredictionManagementRepository] listByTournament failed:', tournamentId, error);
      throw error;
    }
  }

  /**
   * Lists predictions for a specific match.
   * @param {string} matchId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listByMatch(matchId) {
    try {
      await ensureFirestoreOnline();

      const snapshot = await getDocs(query(
        collection(db, this.collectionName),
        where('matchId', '==', matchId),
      ));

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
    } catch (error) {
      Logger.error('[PredictionManagementRepository] listByMatch failed:', matchId, error);
      throw error;
    }
  }

  /**
   * Lists predictions for a contestant in a tournament.
   * @param {string} tournamentId
   * @param {string} userId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listByContestant(tournamentId, userId) {
    try {
      await ensureFirestoreOnline();

      const snapshot = await getDocs(query(
        collection(db, this.collectionName),
        where('tournamentId', '==', tournamentId),
        where('userId', '==', userId),
      ));

      return snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      }));
    } catch (error) {
      Logger.error('[PredictionManagementRepository] listByContestant failed:', { tournamentId, userId }, error);
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
      Logger.error('[PredictionManagementRepository] getById failed:', predictionId, error);
      throw error;
    }
  }

  /**
   * Fetches multiple users by ID in batches.
   * @param {string[]} userIds
   * @returns {Promise<Record<string, Record<string, unknown>>>}
   */
  async getUsersByIds(userIds) {
    try {
      await ensureFirestoreOnline();
      const uniqueIds = [...new Set(userIds.filter(Boolean))];
      const users = {};

      for (let i = 0; i < uniqueIds.length; i += 10) {
        const batch = uniqueIds.slice(i, i + 10);
        const snapshot = await getDocs(query(
          collection(db, FIRESTORE_COLLECTIONS.USERS),
          where('__name__', 'in', batch),
        ));

        snapshot.docs.forEach((item) => {
          users[item.id] = {
            uid: item.id,
            ...item.data(),
          };
        });
      }

      return users;
    } catch (error) {
      Logger.error('[PredictionManagementRepository] getUsersByIds failed:', userIds, error);
      throw error;
    }
  }
}

export const predictionManagementRepository = new PredictionManagementRepository();
