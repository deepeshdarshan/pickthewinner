/**
 * @fileoverview Team service — Firestore CRUD. No DOM manipulation.
 * @module master-data/teams/team.service
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
  TEAM_COLLECTIONS,
  TEAM_MESSAGES,
  createDefaultTeamFields,
} from './team.constants.js';
import {
  validateCreatePayload,
  validateUpdatePayload,
  getTeamValidationMessage,
} from './team.validator.js';
import { TEAM_EVENTS, emitTeamEvent } from './team.events.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {Object} Team
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} country
 * @property {string} flagUrl
 * @property {string} sport
 * @property {boolean} active
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {import('firebase/firestore').Timestamp|Date|null} createdAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 */

/** @type {Map<string, Team>} */
const teamCache = new Map();

/** @type {Team[]|null} */
let listCache = null;

/**
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getTeamsCollection() {
  return collection(db, TEAM_COLLECTIONS.TEAMS);
}

/**
 * @param {string} id
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {Team}
 */
function normalizeTeamDocument(id, data) {
  const defaults = createDefaultTeamFields();

  return {
    id,
    name: data.name ?? '',
    shortName: data.shortName ?? defaults.shortName,
    country: data.country ?? defaults.country,
    flagUrl: data.flagUrl ?? defaults.flagUrl,
    sport: data.sport ?? defaults.sport,
    active: data.active !== false,
    createdBy: data.createdBy ?? '',
    updatedBy: data.updatedBy ?? '',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

/**
 * @returns {void}
 */
export function clearTeamCache() {
  teamCache.clear();
  listCache = null;
}

/**
 * @param {Team} team
 * @returns {void}
 */
function cacheTeam(team) {
  teamCache.set(team.id, team);
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getTeamErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) {
      const validation = /** @type {{ validation?: { errors?: Record<string, string> } }} */ (error).validation;

      if (validation) {
        return getTeamValidationMessage(validation);
      }
    }

    if ('message' in error && typeof /** @type {{ message: string }} */ (error).message === 'string') {
      const message = /** @type {{ message: string }} */ (error).message;
      const knownMessages = new Set(Object.values(TEAM_MESSAGES));

      if (knownMessages.has(message)) {
        return message;
      }
    }

    if ('code' in error && String(/** @type {{ code: string }} */ (error).code) === 'permission-denied') {
      return TEAM_MESSAGES.PERMISSION_DENIED;
    }

    Logger.error('[TeamService] Error:', error);
    return TEAM_MESSAGES.GENERIC_ERROR;
  }

  return TEAM_MESSAGES.GENERIC_ERROR;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
function buildFirestorePayload(payload) {
  return {
    name: String(payload.name ?? '').trim(),
    shortName: String(payload.shortName ?? '').trim(),
    flagUrl: String(payload.flagUrl ?? '').trim(),
    active: payload.active !== false,
  };
}

/**
 * @param {{ activeOnly?: boolean, forceRefresh?: boolean }} [options]
 * @returns {Promise<Team[]>}
 */
export async function listTeams(options = {}) {
  const { activeOnly = false, forceRefresh = false } = options;

  if (!forceRefresh && listCache) {
    return activeOnly ? listCache.filter((team) => team.active) : [...listCache];
  }

  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(getTeamsCollection(), orderBy('name', 'asc')));
  const teams = snapshot.docs.map((item) => {
    const team = normalizeTeamDocument(item.id, item.data());
    cacheTeam(team);
    return team;
  });

  listCache = teams;
  return activeOnly ? teams.filter((team) => team.active) : teams;
}

/**
 * @param {string} id
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<Team|null>}
 */
export async function getTeamById(id, options = {}) {
  if (!id) {
    return null;
  }

  if (!options.forceRefresh && teamCache.has(id)) {
    return teamCache.get(id) ?? null;
  }

  await ensureFirestoreOnline();
  const snapshot = await getDoc(doc(db, TEAM_COLLECTIONS.TEAMS, id));

  if (!snapshot.exists()) {
    return null;
  }

  const team = normalizeTeamDocument(snapshot.id, snapshot.data());
  cacheTeam(team);
  return team;
}

/**
 * @param {string[]} ids
 * @returns {Promise<Map<string, Team>>}
 */
export async function getTeamsByIds(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const result = new Map();

  await Promise.all(uniqueIds.map(async (id) => {
    const team = await getTeamById(id);
    if (team) {
      result.set(id, team);
    }
  }));

  return result;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Team>}
 */
export async function createTeam(payload) {
  const validation = validateCreatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(TEAM_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(TEAM_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    ...buildFirestorePayload(payload),
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(getTeamsCollection(), data);
  const team = normalizeTeamDocument(ref.id, { ...data, createdAt: new Date(), updatedAt: new Date() });
  cacheTeam(team);
  listCache = null;
  emitTeamEvent(TEAM_EVENTS.TEAM_CREATED, team);
  return team;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Team>}
 */
export async function updateTeam(id, payload) {
  const validation = validateUpdatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(TEAM_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(TEAM_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    ...buildFirestorePayload(payload),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, TEAM_COLLECTIONS.TEAMS, id), data);
  const existing = await getTeamById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TEAM_MESSAGES.NOT_FOUND);
  }

  listCache = null;
  emitTeamEvent(TEAM_EVENTS.TEAM_UPDATED, existing);
  return existing;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTeam(id) {
  await ensureFirestoreOnline();
  await deleteDoc(doc(db, TEAM_COLLECTIONS.TEAMS, id));
  teamCache.delete(id);
  listCache = null;
  emitTeamEvent(TEAM_EVENTS.TEAM_DELETED, { id });
}
