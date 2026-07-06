/**
 * @fileoverview Match stage service — Firestore CRUD.
 * @module master-data/match-stages/match-stage.service
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../../firebase/firebase.js';
import { getCurrentUser } from '../../auth/auth.service.js';
import {
  MATCH_STAGE_COLLECTIONS,
  MATCH_STAGE_MESSAGES,
  createDefaultMatchStageFields,
  buildFallbackMatchStages,
} from './match-stage.constants.js';
import {
  validateCreatePayload,
  validateUpdatePayload,
  getStageValidationMessage,
} from './match-stage.validator.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {Object} MatchStage
 * @property {string} id
 * @property {string} label
 * @property {string} value
 * @property {number} sortOrder
 * @property {boolean} active
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {import('firebase/firestore').Timestamp|Date|null} createdAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 */

/** @type {MatchStage[]|null} */
let listCache = null;

/**
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getMatchStagesCollection() {
  return collection(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES);
}

/**
 * @param {string} id
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {MatchStage}
 */
function normalizeDocument(id, data) {
  const defaults = createDefaultMatchStageFields();

  return {
    id,
    label: String(data.label ?? ''),
    value: String(data.value ?? ''),
    sortOrder: typeof data.sortOrder === 'number'
      ? data.sortOrder
      : Number(data.sortOrder ?? defaults.sortOrder),
    active: data.active !== false,
    createdBy: String(data.createdBy ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @returns {void}
 */
export function clearMatchStageCache() {
  listCache = null;
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getMatchStageErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) {
      const validation = /** @type {{ validation?: { errors?: Record<string, string> } }} */ (error).validation;

      if (validation) {
        return getStageValidationMessage(validation);
      }
    }

    if ('message' in error && typeof /** @type {{ message: string }} */ (error).message === 'string') {
      const message = /** @type {{ message: string }} */ (error).message;
      const knownMessages = new Set(Object.values(MATCH_STAGE_MESSAGES));

      if (knownMessages.has(message)) {
        return message;
      }
    }

    if ('code' in error && String(/** @type {{ code: string }} */ (error).code) === 'permission-denied') {
      return MATCH_STAGE_MESSAGES.PERMISSION_DENIED;
    }

    Logger.error('[MatchStageService] Error:', error);
  }

  return MATCH_STAGE_MESSAGES.GENERIC_ERROR;
}

/**
 * @param {MatchStage[]} stages
 * @param {boolean} activeOnly
 * @returns {MatchStage[]}
 */
function filterActiveStages(stages, activeOnly) {
  return activeOnly ? stages.filter((stage) => stage.active) : [...stages];
}

/**
 * @param {{ activeOnly?: boolean, forceRefresh?: boolean, includeDefaults?: boolean }} [options]
 * @returns {Promise<MatchStage[]>}
 */
export async function listMatchStages(options = {}) {
  const { activeOnly = false, forceRefresh = false, includeDefaults = true } = options;

  if (!forceRefresh && listCache !== null) {
    if (listCache.length === 0 && includeDefaults) {
      return filterActiveStages(buildFallbackMatchStages(), activeOnly);
    }

    return filterActiveStages(listCache, activeOnly);
  }

  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(getMatchStagesCollection(), orderBy('sortOrder', 'asc')));

  if (snapshot.empty) {
    listCache = [];
    return includeDefaults ? filterActiveStages(buildFallbackMatchStages(), activeOnly) : [];
  }

  const stages = snapshot.docs.map((item) => normalizeDocument(item.id, item.data()));
  listCache = stages;

  return filterActiveStages(stages, activeOnly);
}

/**
 * @param {string} id
 * @returns {Promise<MatchStage|null>}
 */
export async function getMatchStageById(id) {
  if (!id) {
    return null;
  }

  await ensureFirestoreOnline();
  const snapshot = await getDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id));

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeDocument(snapshot.id, snapshot.data());
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<MatchStage>}
 */
export async function createMatchStage(payload) {
  const validation = validateCreatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(MATCH_STAGE_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    label: String(payload.label ?? '').trim(),
    value: String(payload.value ?? '').trim(),
    sortOrder: Number(payload.sortOrder ?? 10),
    active: payload.active !== false,
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(getMatchStagesCollection(), data);
  const stage = normalizeDocument(ref.id, { ...data, createdAt: new Date(), updatedAt: new Date() });
  listCache = null;
  return stage;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} payload
 * @returns {Promise<MatchStage>}
 */
export async function updateMatchStage(id, payload) {
  const validation = validateUpdatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(MATCH_STAGE_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(MATCH_STAGE_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    label: String(payload.label ?? '').trim(),
    value: String(payload.value ?? '').trim(),
    sortOrder: Number(payload.sortOrder ?? 10),
    active: payload.active !== false,
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id), data);
  listCache = null;

  const updated = await getMatchStageById(id);

  if (!updated) {
    throw new Error(MATCH_STAGE_MESSAGES.NOT_FOUND);
  }

  return updated;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMatchStage(id) {
  await ensureFirestoreOnline();
  await deleteDoc(doc(db, MATCH_STAGE_COLLECTIONS.MATCH_STAGES, id));
  listCache = null;
}

