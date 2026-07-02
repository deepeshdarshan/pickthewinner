/**
 * @fileoverview Tournament service — Firestore CRUD and lifecycle management. No DOM manipulation.
 * @module tournament/tournament.service
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { TournamentDomain, TOURNAMENT_STATUS, TOURNAMENT_VISIBILITY } from '../domain/tournament.domain.js';
import {
  TOURNAMENT_COLLECTIONS,
  TOURNAMENT_STATUS as STATUS,
  TOURNAMENT_VISIBILITY as VISIBILITY,
  createDefaultConfiguration,
  createDefaultTournamentFields,
  TOURNAMENT_MESSAGES,
  LIFECYCLE_ACTIONS,
} from './tournament.constants.js';
import {
  validateCreatePayload,
  validateUpdatePayload,
  validateLifecycleAction,
  getTournamentValidationMessage,
} from './tournament.validator.js';
import { TOURNAMENT_EVENTS, emitTournamentEvent } from './tournament.events.js';
import { ApplicationContext } from '../app/application-context.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} ScoringConfiguration
 * @property {number} [correctMatchScorePoints]
 * @property {number} [correctPenaltyWinnerPoints]
 */

/**
 * @typedef {Object} TournamentConfiguration
 * @property {string} timezone
 * @property {boolean} canEndInDraw
 * @property {boolean} requiresWinner
 * @property {string} winnerResolution
 * @property {{ strategy: string, secondary: string }} tieBreaker
 * @property {ScoringConfiguration} [scoringConfiguration]
 */

/**
 * @typedef {Object} Tournament
 * @property {string} id
 * @property {string} name
 * @property {string} shortName
 * @property {string} description
 * @property {string} sport
 * @property {string} season
 * @property {string} tournamentType
 * @property {string} status
 * @property {string} visibility
 * @property {boolean} active
 * @property {boolean} archived
 * @property {import('firebase/firestore').Timestamp|Date|null} registrationStart
 * @property {import('firebase/firestore').Timestamp|Date|null} registrationEnd
 * @property {string} logo
 * @property {string} banner
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {import('firebase/firestore').Timestamp|Date|null} createdAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 * @property {TournamentConfiguration} configuration
 */

/** @type {Map<string, Tournament>} */
const tournamentCache = new Map();

/** @type {Tournament[]|null} */
let adminListCache = null;

/** @type {Tournament[]|null} */
let contestantListCache = null;

/** @type {Tournament|null} */
let activeTournamentCache = null;

/** @type {Promise<unknown>} */
let firestoreWriteChain = Promise.resolve();

/**
 * @template T
 * @param {() => Promise<T>} operation
 * @returns {Promise<T>}
 */
function runSerializedFirestoreWrite(operation) {
  const result = firestoreWriteChain.then(operation);
  firestoreWriteChain = result.catch(() => {});
  return result;
}

/**
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getTournamentsCollection() {
  return collection(db, TOURNAMENT_COLLECTIONS.TOURNAMENTS);
}

/**
 * @param {string} id
 * @returns {import('firebase/firestore').DocumentReference}
 */
function getTournamentDocRef(id) {
  return doc(db, TOURNAMENT_COLLECTIONS.TOURNAMENTS, id);
}

/**
 * @param {string} id
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {Tournament}
 */
function normalizeTournamentDocument(id, data) {
  const defaults = createDefaultTournamentFields();
  const defaultConfig = createDefaultConfiguration();

  return {
    id,
    name: data.name ?? '',
    shortName: data.shortName ?? defaults.shortName,
    description: data.description ?? defaults.description,
    sport: data.sport ?? defaults.sport,
    season: data.season ?? '',
    tournamentType: data.tournamentType ?? defaults.tournamentType,
    status: data.status ?? STATUS.DRAFT,
    visibility: data.visibility ?? defaults.visibility,
    active: Boolean(data.active),
    archived: Boolean(data.archived),
    registrationStart: data.registrationStart ?? null,
    registrationEnd: data.registrationEnd ?? null,
    logo: data.logo ?? '',
    banner: data.banner ?? '',
    createdBy: data.createdBy ?? '',
    updatedBy: data.updatedBy ?? '',
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    configuration: {
      ...defaultConfig,
      ...(data.configuration ?? {}),
      tieBreaker: {
        ...defaultConfig.tieBreaker,
        ...(data.configuration?.tieBreaker ?? {}),
      },
      scoringConfiguration: {
        ...defaultConfig.scoringConfiguration,
        ...(data.configuration?.scoringConfiguration ?? {}),
      },
    },
  };
}

/**
 * @param {unknown} value
 * @returns {import('firebase/firestore').Timestamp|null}
 */
function toFirestoreTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  if (value instanceof Date) {
    return Timestamp.fromDate(value);
  }

  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : Timestamp.fromDate(parsed);
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return /** @type {import('firebase/firestore').Timestamp} */ (value);
  }

  return null;
}

/**
 * Clears all tournament caches.
 * @returns {void}
 */
export function clearTournamentCache() {
  tournamentCache.clear();
  adminListCache = null;
  contestantListCache = null;
  activeTournamentCache = null;
}

/**
 * @param {Tournament} tournament
 * @returns {void}
 */
function cacheTournament(tournament) {
  tournamentCache.set(tournament.id, tournament);

  if (tournament.active) {
    activeTournamentCache = tournament;
    ApplicationContext.setTournament(tournament);
  }
}

/**
 * Maps a Firestore error to a user-friendly message.
 * @param {unknown} error
 * @returns {string}
 */
export function getTournamentErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) {
      const validation = /** @type {{ validation?: { errors?: Record<string, string> } }} */ (error).validation;

      if (validation) {
        return getTournamentValidationMessage(validation);
      }
    }

    if ('message' in error && typeof /** @type {{ message: string }} */ (error).message === 'string') {
      const message = /** @type {{ message: string }} */ (error).message;
      const knownMessages = new Set(Object.values(TOURNAMENT_MESSAGES));

      if (knownMessages.has(message)) {
        return message;
      }
    }

    if ('code' in error) {
      const code = String(/** @type {{ code: string }} */ (error).code);

      if (code === 'permission-denied') {
        return TOURNAMENT_MESSAGES.PERMISSION_DENIED;
      }

      Logger.error('[TournamentService] Firestore error:', code || error);
      return TOURNAMENT_MESSAGES.GENERIC_ERROR;
    }

    Logger.error('[TournamentService] Error:', error);
    return TOURNAMENT_MESSAGES.GENERIC_ERROR;
  }

  return TOURNAMENT_MESSAGES.GENERIC_ERROR;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
function buildFirestorePayload(payload) {
  const configuration = /** @type {Record<string, unknown>} */ (payload.configuration ?? {});
  const result = {
    name: String(payload.name ?? '').trim(),
    shortName: String(payload.shortName ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    sport: String(payload.sport ?? ''),
    season: String(payload.season ?? '').trim(),
    tournamentType: String(payload.tournamentType ?? ''),
    visibility: payload.visibility ?? VISIBILITY.HIDDEN,
    registrationStart: toFirestoreTimestamp(payload.registrationStart),
    registrationEnd: toFirestoreTimestamp(payload.registrationEnd),
    logo: String(payload.logo ?? '').trim(),
    banner: String(payload.banner ?? '').trim(),
    configuration: {
      ...createDefaultConfiguration(),
      ...configuration,
      tieBreaker: {
        ...createDefaultConfiguration().tieBreaker,
        ...(/** @type {Record<string, unknown>} */ (configuration.tieBreaker ?? {})),
      },
      scoringConfiguration: {
        ...createDefaultConfiguration().scoringConfiguration,
        ...(/** @type {Record<string, unknown>} */ (configuration.scoringConfiguration ?? {})),
      },
    },
  };

  return result;
}

/**
 * @param {string} id
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<Tournament|null>}
 */
export async function getTournamentById(id, options = {}) {
  if (!id) {
    return null;
  }

  if (!options.forceRefresh && tournamentCache.has(id)) {
    return tournamentCache.get(id) ?? null;
  }

  await ensureFirestoreOnline();

  const snapshot = await getDoc(getTournamentDocRef(id));

  if (!snapshot.exists()) {
    return null;
  }

  const tournament = normalizeTournamentDocument(snapshot.id, snapshot.data());
  cacheTournament(tournament);
  return tournament;
}

/**
 * @param {{ includeArchived?: boolean, status?: string }} [filters]
 * @returns {Promise<Tournament[]>}
 */
export async function listTournamentsForAdmin(filters = {}) {
  if (!filters.status && !filters.includeArchived && adminListCache) {
    return adminListCache;
  }

  await ensureFirestoreOnline();

  const snapshot = await getDocs(
    query(getTournamentsCollection(), orderBy('updatedAt', 'desc')),
  );

  let tournaments = snapshot.docs.map((item) => normalizeTournamentDocument(item.id, item.data()));

  if (!filters.includeArchived) {
    tournaments = tournaments.filter((item) => item.status !== STATUS.ARCHIVED && !item.archived);
  }

  if (filters.status) {
    tournaments = tournaments.filter((item) => item.status === filters.status);
  }

  if (!filters.status && !filters.includeArchived) {
    adminListCache = tournaments;
  }

  tournaments.forEach(cacheTournament);
  return tournaments;
}

/**
 * @returns {Promise<Tournament[]>}
 */
export async function listTournamentsForContestant() {
  if (contestantListCache) {
    return contestantListCache;
  }

  const all = await listTournamentsForAdmin({ includeArchived: false });

  contestantListCache = all.filter((tournament) => TournamentDomain.isTournamentVisibleToContestants(
    tournament.status,
    tournament.visibility,
  ));

  return contestantListCache;
}

/**
 * @returns {Promise<Tournament|null>}
 */
export async function getActiveTournament() {
  if (activeTournamentCache) {
    return activeTournamentCache;
  }

  await ensureFirestoreOnline();

  const snapshot = await getDocs(
    query(getTournamentsCollection(), where('active', '==', true)),
  );

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const tournament = normalizeTournamentDocument(docSnap.id, docSnap.data());
  cacheTournament(tournament);
  return tournament;
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function createTournament(data, uid) {
  const validation = validateCreatePayload(data);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return runSerializedFirestoreWrite(async () => {
    await ensureFirestoreOnline();

    const payload = buildFirestorePayload(data);
    const docRef = await addDoc(getTournamentsCollection(), {
      ...payload,
      status: STATUS.DRAFT,
      active: false,
      archived: false,
      createdBy: uid,
      updatedBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const tournament = normalizeTournamentDocument(docRef.id, {
      ...payload,
      status: STATUS.DRAFT,
      active: false,
      archived: false,
      createdBy: uid,
      updatedBy: uid,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    cacheTournament(tournament);
    adminListCache = null;
    contestantListCache = null;
    emitTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_CREATED, tournament);
    return tournament;
  });
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function updateTournament(id, data, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateUpdatePayload(data, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return runSerializedFirestoreWrite(async () => {
    await ensureFirestoreOnline();

    const payload = buildFirestorePayload(data);

    await updateDoc(getTournamentDocRef(id), {
      ...payload,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
    });

    const tournament = normalizeTournamentDocument(id, {
      ...existing,
      ...payload,
      updatedBy: uid,
      updatedAt: new Date(),
    });

    cacheTournament(tournament);
    adminListCache = null;
    contestantListCache = null;
    emitTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_UPDATED, tournament);
    return tournament;
  });
}

/**
 * @param {string} id
 * @param {string} uid
 * @param {string} targetStatus
 * @param {Record<string, unknown>} [extra]
 * @returns {Promise<Tournament>}
 */
async function transitionTournamentStatus(id, uid, targetStatus, extra = {}) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  if (!TournamentDomain.canTransitionTo(existing.status, targetStatus)) {
    throw new Error(TOURNAMENT_MESSAGES.GENERIC_ERROR);
  }

  return runSerializedFirestoreWrite(async () => {
    await ensureFirestoreOnline();

    await updateDoc(getTournamentDocRef(id), {
      status: targetStatus,
      updatedBy: uid,
      updatedAt: serverTimestamp(),
      ...extra,
    });

    const tournament = normalizeTournamentDocument(id, {
      ...existing,
      status: targetStatus,
      updatedBy: uid,
      updatedAt: new Date(),
      ...extra,
    });

    cacheTournament(tournament);
    adminListCache = null;
    contestantListCache = null;
    return tournament;
  });
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function publishTournament(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.PUBLISH, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  const tournament = await transitionTournamentStatus(id, uid, STATUS.PUBLISHED, {
    visibility: VISIBILITY.VISIBLE,
  });

  emitTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_PUBLISHED, tournament);
  return tournament;
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function openRegistration(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.OPEN_REGISTRATION, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return transitionTournamentStatus(id, uid, STATUS.REGISTRATION_OPEN);
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function goLive(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.GO_LIVE, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return transitionTournamentStatus(id, uid, STATUS.LIVE);
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function completeTournament(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.COMPLETE, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return transitionTournamentStatus(id, uid, STATUS.COMPLETED, { active: false });
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function archiveTournament(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.ARCHIVE, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  const tournament = await transitionTournamentStatus(id, uid, STATUS.ARCHIVED, {
    archived: true,
    active: false,
    visibility: VISIBILITY.ARCHIVED,
  });

  if (activeTournamentCache?.id === id) {
    activeTournamentCache = null;
    ApplicationContext.setTournament(null);
  }

  emitTournamentEvent(TOURNAMENT_EVENTS.TOURNAMENT_ARCHIVED, tournament);
  return tournament;
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function deleteTournament(id, uid) {
  return archiveTournament(id, uid);
}

/**
 * @param {string} id
 * @param {string} uid
 * @returns {Promise<Tournament>}
 */
export async function setActiveTournament(id, uid) {
  const existing = await getTournamentById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(TOURNAMENT_MESSAGES.NOT_FOUND);
  }

  const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.SET_ACTIVE, existing);

  if (!validation.valid) {
    throw Object.assign(new Error(getTournamentValidationMessage(validation)), { validation });
  }

  return runSerializedFirestoreWrite(async () => {
    await ensureFirestoreOnline();

    const activeSnapshot = await getDocs(
      query(getTournamentsCollection(), where('active', '==', true)),
    );

    await runTransaction(db, async (transaction) => {
      activeSnapshot.docs.forEach((item) => {
        if (item.id !== id) {
          transaction.update(item.ref, {
            active: false,
            updatedAt: serverTimestamp(),
            updatedBy: uid,
          });
        }
      });

      transaction.update(getTournamentDocRef(id), {
        active: true,
        updatedAt: serverTimestamp(),
        updatedBy: uid,
      });
    });

    const tournament = normalizeTournamentDocument(id, {
      ...existing,
      active: true,
      updatedBy: uid,
      updatedAt: new Date(),
    });

    activeTournamentCache = tournament;
    cacheTournament(tournament);
    adminListCache = null;
    contestantListCache = null;
    ApplicationContext.setTournament(tournament);
    emitTournamentEvent(TOURNAMENT_EVENTS.ACTIVE_TOURNAMENT_CHANGED, tournament);
    return tournament;
  });
}

/**
 * Loads the active tournament into application context.
 * @returns {Promise<Tournament|null>}
 */
export async function loadActiveTournamentIntoContext() {
  const tournament = await getActiveTournament();
  ApplicationContext.setTournament(tournament);
  return tournament;
}
