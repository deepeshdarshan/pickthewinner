/**
 * @fileoverview Leaderboard repository — data access for leaderboard and contestant statistics.
 * @module leaderboard/leaderboard.repository
 */

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { BaseFirestoreService } from '../services/base.service.js';
import { Logger } from '../utils/logger.util.js';

class LeaderboardRepository extends BaseFirestoreService {
  constructor() {
    super({
      collectionName: FIRESTORE_COLLECTIONS.LEADERBOARD_CACHE,
      serviceName: 'LeaderboardRepository',
    });
  }

  /**
   * Gets leaderboard cache for a tournament.
   * @param {string} tournamentId
   * @returns {Promise<{tournamentId: string, matchId: string, totals: Record<string, number>, updatedAt: unknown}|null>}
   */
  async getLeaderboardCache(tournamentId) {
    try {
      await ensureFirestoreOnline();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.LEADERBOARD_CACHE, tournamentId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        tournamentId: snapshot.id,
        ...snapshot.data(),
      };
    } catch (error) {
      Logger.error('[LeaderboardRepository] getLeaderboardCache failed:', tournamentId, error);
      throw error;
    }
  }

  /**
   * Lists all predictions for a tournament to compute detailed statistics.
   * @param {string} tournamentId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listPredictionsByTournament(tournamentId) {
    try {
      await ensureFirestoreOnline();
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.PREDICTIONS),
        where('tournamentId', '==', tournamentId),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      Logger.error('[LeaderboardRepository] listPredictionsByTournament failed:', tournamentId, error);
      throw error;
    }
  }

  /**
   * Gets predictions for a specific user in a tournament.
   * @param {string} tournamentId
   * @param {string} userId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async getUserPredictionsForTournament(tournamentId, userId) {
    try {
      await ensureFirestoreOnline();
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.PREDICTIONS),
        where('tournamentId', '==', tournamentId),
        where('userId', '==', userId),
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      Logger.error('[LeaderboardRepository] getUserPredictionsForTournament failed:', { tournamentId, userId }, error);
      throw error;
    }
  }

  /**
   * Gets user document by ID.
   * @param {string} userId
   * @returns {Promise<Record<string, unknown>|null>}
   */
  async getUserById(userId) {
    try {
      await ensureFirestoreOnline();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return {
        id: snapshot.id,
        ...snapshot.data(),
      };
    } catch (error) {
      Logger.error('[LeaderboardRepository] getUserById failed:', userId, error);
      throw error;
    }
  }

  /**
   * Gets multiple users by their IDs.
   * @param {string[]} userIds
   * @returns {Promise<Record<string, Record<string, unknown>>>}
   */
  async getUsersByIds(userIds) {
    try {
      await ensureFirestoreOnline();
      const uniqueIds = [...new Set(userIds)];
      const users = {};

      // Firestore 'in' queries are limited to 10 items, so batch them
      const batches = [];
      for (let i = 0; i < uniqueIds.length; i += 10) {
        batches.push(uniqueIds.slice(i, i + 10));
      }

      for (const batch of batches) {
        const q = query(
          collection(db, FIRESTORE_COLLECTIONS.USERS),
          where('__name__', 'in', batch),
        );

        const snapshot = await getDocs(q);
        snapshot.docs.forEach((doc) => {
          users[doc.id] = {
            id: doc.id,
            ...doc.data(),
          };
        });
      }

      return users;
    } catch (error) {
      Logger.error('[LeaderboardRepository] getUsersByIds failed:', userIds, error);
      throw error;
    }
  }

  /**
   * Lists all matches for a tournament.
   * Avoids composite index by filtering in memory instead of using where + orderBy.
   * @param {string} tournamentId
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listMatchesByTournament(tournamentId) {
    try {
      await ensureFirestoreOnline();

      // Query with orderBy only (no composite index required)
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.MATCHES),
        orderBy('kickoffUtc', 'asc'),
      );

      const snapshot = await getDocs(q);

      // Filter by tournamentId in memory
      return snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((match) => match.tournamentId === tournamentId);
    } catch (error) {
      Logger.error('[LeaderboardRepository] listMatchesByTournament failed:', tournamentId, error);
      throw error;
    }
  }
}

export const leaderboardRepository = new LeaderboardRepository();

