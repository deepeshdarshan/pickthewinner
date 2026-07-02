/**
 * @fileoverview Audit log service — records administrative actions.
 * @module audit/audit.service
 */

import {
  collection,
  addDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { FIRESTORE_COLLECTIONS } from '../config/application.constants.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} AuditLogEntry
 * @property {string} action
 * @property {string} entityType
 * @property {string} entityId
 * @property {Record<string, unknown>} [details]
 */

/**
 * @param {AuditLogEntry} entry
 * @returns {Promise<void>}
 */
export async function writeAuditLog(entry) {
  const user = getCurrentUser();

  try {
    await ensureFirestoreOnline();
    await addDoc(collection(db, FIRESTORE_COLLECTIONS.AUDIT_LOGS), {
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details ?? {},
      performedBy: user?.uid ?? '',
      performedAt: serverTimestamp(),
    });
  } catch (error) {
    Logger.error('[AuditService] Failed to write audit log:', error);
  }
}
