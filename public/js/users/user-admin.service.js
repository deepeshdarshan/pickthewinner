/**
 * @fileoverview User admin service — Firestore operations for user management.
 * @module users/user-admin.service
 */

import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  updateDoc,
  serverTimestamp,
  getCountFromServer,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db } from '../firebase/firebase.js';
import { BaseFirestoreService } from '../services/BaseFirestoreService.js';
import {
  USER_COLLECTIONS,
  USER_STATUS,
  USER_ROLES,
  USER_MESSAGES,
} from './user.constants.js';
import { USER_EVENTS, emitUserEvent } from './user.events.js';
import { Logger } from '../utils/logger.util.js';
import { UserAdminDomain } from '../domain/user-admin.domain.js';

/**
 * @typedef {import('./user.service.js').UserProfile} UserProfile
 */

/**
 * @typedef {Object} PaginationOptions
 * @property {number} [pageSize]
 * @property {import('firebase/firestore').DocumentSnapshot} [startAfterDoc]
 */

/**
 * @typedef {Object} UserListResult
 * @property {UserProfile[]} users
 * @property {import('firebase/firestore').DocumentSnapshot|null} lastDoc
 * @property {boolean} hasMore
 */

/**
 * @typedef {Object} UserStatistics
 * @property {number} totalUsers
 * @property {number} activeUsers
 * @property {number} lockedUsers
 * @property {number} adminUsers
 */

class UserAdminServiceClass extends BaseFirestoreService {
  constructor() {
    super({
      collectionName: USER_COLLECTIONS.USERS,
      serviceName: 'UserAdminService',
    });
  }

  /**
   * Gets all users with pagination support.
   * @param {PaginationOptions} [options]
   * @returns {Promise<UserListResult>}
   */
  async getAllUsers(options = {}) {
    const pageSize = options.pageSize ?? 25;

    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1),
      );

      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;
      const users = docs.slice(0, pageSize).map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      return {
        users: /** @type {UserProfile[]} */ (users),
        lastDoc: hasMore ? docs[pageSize - 1] : null,
        hasMore,
      };
    } catch (error) {
      Logger.error('[UserAdminService] getAllUsers failed:', error);
      throw error;
    }
  }

  /**
   * Gets users by status with pagination.
   * @param {string} status
   * @param {PaginationOptions} [options]
   * @returns {Promise<UserListResult>}
   */
  async getUsersByStatus(status, options = {}) {
    const pageSize = options.pageSize ?? 25;

    try {
      let q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1),
      );

      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;
      const users = docs.slice(0, pageSize).map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      return {
        users: /** @type {UserProfile[]} */ (users),
        lastDoc: hasMore ? docs[pageSize - 1] : null,
        hasMore,
      };
    } catch (error) {
      Logger.error('[UserAdminService] getUsersByStatus failed:', status, error);
      throw error;
    }
  }

  /**
   * Gets users by role with pagination.
   * @param {string} role
   * @param {PaginationOptions} [options]
   * @returns {Promise<UserListResult>}
   */
  async getUsersByRole(role, options = {}) {
    const pageSize = options.pageSize ?? 25;

    try {
      let q = query(
        collection(db, this.collectionName),
        where('role', '==', role),
        orderBy('createdAt', 'desc'),
        limit(pageSize + 1),
      );

      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs;
      const hasMore = docs.length > pageSize;
      const users = docs.slice(0, pageSize).map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      }));

      return {
        users: /** @type {UserProfile[]} */ (users),
        lastDoc: hasMore ? docs[pageSize - 1] : null,
        hasMore,
      };
    } catch (error) {
      Logger.error('[UserAdminService] getUsersByRole failed:', role, error);
      throw error;
    }
  }

  /**
   * Searches users by name, email, or UID.
   * Note: Firestore doesn't support full-text search. This performs case-sensitive prefix matching.
   * For production, consider Algolia or similar search service.
   * @param {string} searchQuery
   * @returns {Promise<UserProfile[]>}
   */
  async searchUsers(searchQuery) {
    if (!searchQuery || !searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.trim();

    try {
      // For now, we'll fetch all users and filter client-side
      // This is acceptable for small to medium user bases
      // For large scale, implement server-side search (Cloud Functions + Algolia)
      const result = await this.getAllUsers({ pageSize: 1000 });

      return result.users.filter((user) => {
        const searchableFields = [
          user.name?.toLowerCase(),
          user.email?.toLowerCase(),
          user.uid?.toLowerCase(),
        ].filter(Boolean);

        const lowerQuery = query.toLowerCase();
        return searchableFields.some((field) => field.includes(lowerQuery));
      });
    } catch (error) {
      Logger.error('[UserAdminService] searchUsers failed:', query, error);
      throw error;
    }
  }

  /**
   * Locks a user account.
   * @param {string} uid
   * @param {string} adminUid
   * @param {string} [reason]
   * @returns {Promise<void>}
   */
  async lockUser(uid, adminUid, reason = '') {
    try {
      const validationResult = UserAdminDomain.validateLockReason(reason);

      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      await updateDoc(this.getDocRef(uid), {
        status: USER_STATUS.LOCKED,
        lockedBy: adminUid,
        lockedAt: serverTimestamp(),
        lockReason: reason || null,
        updatedAt: serverTimestamp(),
      });

      this.cache.delete(uid);
      emitUserEvent(USER_EVENTS.USER_LOCKED, { uid, adminUid, reason });

      Logger.info('[UserAdminService] User locked:', uid);
    } catch (error) {
      Logger.error('[UserAdminService] lockUser failed:', uid, error);
      throw error;
    }
  }

  /**
   * Unlocks a user account.
   * @param {string} uid
   * @param {string} adminUid
   * @returns {Promise<void>}
   */
  async unlockUser(uid, adminUid) {
    try {
      await updateDoc(this.getDocRef(uid), {
        status: USER_STATUS.ACTIVE,
        lockedBy: null,
        lockedAt: null,
        lockReason: null,
        updatedAt: serverTimestamp(),
      });

      this.cache.delete(uid);
      emitUserEvent(USER_EVENTS.USER_UNLOCKED, { uid, adminUid });

      Logger.info('[UserAdminService] User unlocked:', uid);
    } catch (error) {
      Logger.error('[UserAdminService] unlockUser failed:', uid, error);
      throw error;
    }
  }

  /**
   * Gets user statistics for the dashboard.
   * @returns {Promise<UserStatistics>}
   */
  async getUserStatistics() {
    try {
      const [totalSnapshot, activeSnapshot, lockedSnapshot, adminSnapshot] = await Promise.all([
        getCountFromServer(query(collection(db, this.collectionName))),
        getCountFromServer(
          query(collection(db, this.collectionName), where('status', '==', USER_STATUS.ACTIVE)),
        ),
        getCountFromServer(
          query(collection(db, this.collectionName), where('status', '==', USER_STATUS.LOCKED)),
        ),
        getCountFromServer(
          query(collection(db, this.collectionName), where('role', '==', USER_ROLES.ADMIN)),
        ),
      ]);

      return {
        totalUsers: totalSnapshot.data().count,
        activeUsers: activeSnapshot.data().count,
        lockedUsers: lockedSnapshot.data().count,
        adminUsers: adminSnapshot.data().count,
      };
    } catch (error) {
      Logger.error('[UserAdminService] getUserStatistics failed:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        lockedUsers: 0,
        adminUsers: 0,
      };
    }
  }

  /**
   * Gets a user profile by UID.
   * @param {string} uid
   * @returns {Promise<UserProfile|null>}
   */
  async getUserProfile(uid) {
    const data = await this.getById(uid, false);

    if (!data) {
      return null;
    }

    return /** @type {UserProfile} */ ({
      uid,
      ...data,
    });
  }
}

export const UserAdminService = new UserAdminServiceClass();

