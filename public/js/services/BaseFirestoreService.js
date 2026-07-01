/**
 * @fileoverview Base Firestore service — shared CRUD, caching, and error handling.
 * @module services/BaseFirestoreService
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db } from '../firebase/firebase.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} FirestoreServiceOptions
 * @property {string} collectionName
 * @property {string} [serviceName]
 */

export class BaseFirestoreService {
  /**
   * @param {FirestoreServiceOptions} options
   */
  constructor(options) {
    this.collectionName = options.collectionName;
    this.serviceName = options.serviceName ?? options.collectionName;
    /** @type {Map<string, unknown>} */
    this.cache = new Map();
  }

  /**
   * @param {string} id
   * @returns {import('firebase/firestore').DocumentReference}
   */
  getDocRef(id) {
    return doc(db, this.collectionName, id);
  }

  /**
   * @param {string} id
   * @param {boolean} [useCache=true]
   * @returns {Promise<import('firebase/firestore').DocumentData|null>}
   */
  async getById(id, useCache = true) {
    if (useCache && this.cache.has(id)) {
      return /** @type {import('firebase/firestore').DocumentData} */ (this.cache.get(id));
    }

    try {
      const snapshot = await getDoc(this.getDocRef(id));

      if (!snapshot.exists()) {
        return null;
      }

      const data = snapshot.data();
      this.cache.set(id, data);
      return data;
    } catch (error) {
      Logger.error(`[${this.serviceName}] getById failed:`, id, error);
      throw error;
    }
  }

  /**
   * @param {string} id
   * @param {import('firebase/firestore').DocumentData} data
   * @param {import('firebase/firestore').SetOptions} [options]
   * @returns {Promise<void>}
   */
  async create(id, data, options) {
    try {
      await setDoc(this.getDocRef(id), data, options);
      this.cache.set(id, data);
    } catch (error) {
      Logger.error(`[${this.serviceName}] create failed:`, id, error);
      throw error;
    }
  }

  /**
   * @param {string} id
   * @param {import('firebase/firestore').DocumentData} data
   * @returns {Promise<void>}
   */
  async update(id, data) {
    try {
      await updateDoc(this.getDocRef(id), data);
      const existing = this.cache.get(id);

      if (existing && typeof existing === 'object') {
        this.cache.set(id, { ...existing, ...data });
      } else {
        this.cache.delete(id);
      }
    } catch (error) {
      Logger.error(`[${this.serviceName}] update failed:`, id, error);
      throw error;
    }
  }

  /**
   * @param {string} id
   * @returns {Promise<void>}
   */
  async remove(id) {
    try {
      await deleteDoc(this.getDocRef(id));
      this.cache.delete(id);
    } catch (error) {
      Logger.error(`[${this.serviceName}] remove failed:`, id, error);
      throw error;
    }
  }

  /**
   * @param {(batch: import('firebase/firestore').WriteBatch) => void} mutator
   * @returns {Promise<void>}
   */
  async runBatch(mutator) {
    const batch = writeBatch(db);

    try {
      mutator(batch);
      await batch.commit();
    } catch (error) {
      Logger.error(`[${this.serviceName}] batch failed:`, error);
      throw error;
    }
  }

  /**
   * @template T
   * @param {(transaction: import('firebase/firestore').Transaction) => Promise<T>} mutator
   * @returns {Promise<T>}
   */
  async runInTransaction(mutator) {
    try {
      return await runTransaction(db, mutator);
    } catch (error) {
      Logger.error(`[${this.serviceName}] transaction failed:`, error);
      throw error;
    }
  }

  /**
   * @param {string} [id]
   * @returns {void}
   */
  clearCache(id) {
    if (id) {
      this.cache.delete(id);
      return;
    }

    this.cache.clear();
  }
}
