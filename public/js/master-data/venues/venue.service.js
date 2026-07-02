/**
 * @fileoverview Venue service — Firestore CRUD. No DOM manipulation.
 * @module master-data/venues/venue.service
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
  VENUE_COLLECTIONS,
  VENUE_MESSAGES,
  createDefaultVenueFields,
} from './venue.constants.js';
import {
  validateCreatePayload,
  validateUpdatePayload,
  getVenueValidationMessage,
} from './venue.validator.js';
import { VENUE_EVENTS, emitVenueEvent } from './venue.events.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {Object} Venue
 * @property {string} id
 * @property {string} name
 * @property {string} city
 * @property {string} country
 * @property {number|null} capacity
 * @property {boolean} active
 * @property {string} createdBy
 * @property {string} updatedBy
 * @property {import('firebase/firestore').Timestamp|Date|null} createdAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 */

/** @type {Map<string, Venue>} */
const venueCache = new Map();

/** @type {Venue[]|null} */
let listCache = null;

/**
 * @returns {import('firebase/firestore').CollectionReference}
 */
function getVenuesCollection() {
  return collection(db, VENUE_COLLECTIONS.VENUES);
}

/**
 * @param {string} id
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {Venue}
 */
function normalizeVenueDocument(id, data) {
  const defaults = createDefaultVenueFields();
  const capacity = data.capacity;

  return {
    id,
    name: data.name ?? '',
    city: data.city ?? defaults.city,
    country: data.country ?? defaults.country,
    capacity: typeof capacity === 'number' ? capacity : (capacity ? Number(capacity) : null),
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
export function clearVenueCache() {
  venueCache.clear();
  listCache = null;
}

/**
 * @param {Venue} venue
 * @returns {void}
 */
function cacheVenue(venue) {
  venueCache.set(venue.id, venue);
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function getVenueErrorMessage(error) {
  if (typeof error === 'object' && error !== null) {
    if ('validation' in error) {
      const validation = /** @type {{ validation?: { errors?: Record<string, string> } }} */ (error).validation;

      if (validation) {
        return getVenueValidationMessage(validation);
      }
    }

    if ('message' in error && typeof /** @type {{ message: string }} */ (error).message === 'string') {
      const message = /** @type {{ message: string }} */ (error).message;
      const knownMessages = new Set(Object.values(VENUE_MESSAGES));

      if (knownMessages.has(message)) {
        return message;
      }
    }

    if ('code' in error && String(/** @type {{ code: string }} */ (error).code) === 'permission-denied') {
      return VENUE_MESSAGES.PERMISSION_DENIED;
    }

    Logger.error('[VenueService] Error:', error);
    return VENUE_MESSAGES.GENERIC_ERROR;
  }

  return VENUE_MESSAGES.GENERIC_ERROR;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Record<string, unknown>}
 */
function buildFirestorePayload(payload) {
  const capacity = payload.capacity;

  return {
    name: String(payload.name ?? '').trim(),
    city: String(payload.city ?? '').trim(),
    country: String(payload.country ?? '').trim(),
    capacity: capacity === null || capacity === undefined || capacity === ''
      ? null
      : Number(capacity),
    active: payload.active !== false,
  };
}

/**
 * @param {{ activeOnly?: boolean, forceRefresh?: boolean }} [options]
 * @returns {Promise<Venue[]>}
 */
export async function listVenues(options = {}) {
  const { activeOnly = false, forceRefresh = false } = options;

  if (!forceRefresh && listCache) {
    return activeOnly ? listCache.filter((venue) => venue.active) : [...listCache];
  }

  await ensureFirestoreOnline();

  const snapshot = await getDocs(query(getVenuesCollection(), orderBy('name', 'asc')));
  const venues = snapshot.docs.map((item) => {
    const venue = normalizeVenueDocument(item.id, item.data());
    cacheVenue(venue);
    return venue;
  });

  listCache = venues;
  return activeOnly ? venues.filter((venue) => venue.active) : venues;
}

/**
 * @param {string} id
 * @param {{ forceRefresh?: boolean }} [options]
 * @returns {Promise<Venue|null>}
 */
export async function getVenueById(id, options = {}) {
  if (!id) {
    return null;
  }

  if (!options.forceRefresh && venueCache.has(id)) {
    return venueCache.get(id) ?? null;
  }

  await ensureFirestoreOnline();
  const snapshot = await getDoc(doc(db, VENUE_COLLECTIONS.VENUES, id));

  if (!snapshot.exists()) {
    return null;
  }

  const venue = normalizeVenueDocument(snapshot.id, snapshot.data());
  cacheVenue(venue);
  return venue;
}

/**
 * @param {string[]} ids
 * @returns {Promise<Map<string, Venue>>}
 */
export async function getVenuesByIds(ids) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const result = new Map();

  await Promise.all(uniqueIds.map(async (id) => {
    const venue = await getVenueById(id);
    if (venue) {
      result.set(id, venue);
    }
  }));

  return result;
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Venue>}
 */
export async function createVenue(payload) {
  const validation = validateCreatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(VENUE_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(VENUE_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    ...buildFirestorePayload(payload),
    createdBy: user.uid,
    updatedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(getVenuesCollection(), data);
  const venue = normalizeVenueDocument(ref.id, { ...data, createdAt: new Date(), updatedAt: new Date() });
  cacheVenue(venue);
  listCache = null;
  emitVenueEvent(VENUE_EVENTS.VENUE_CREATED, venue);
  return venue;
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} payload
 * @returns {Promise<Venue>}
 */
export async function updateVenue(id, payload) {
  const validation = validateUpdatePayload(payload);

  if (!validation.valid) {
    throw Object.assign(new Error(VENUE_MESSAGES.VALIDATION_SUMMARY), { validation });
  }

  const user = getCurrentUser();

  if (!user) {
    throw new Error(VENUE_MESSAGES.PERMISSION_DENIED);
  }

  await ensureFirestoreOnline();

  const data = {
    ...buildFirestorePayload(payload),
    updatedBy: user.uid,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, VENUE_COLLECTIONS.VENUES, id), data);
  const existing = await getVenueById(id, { forceRefresh: true });

  if (!existing) {
    throw new Error(VENUE_MESSAGES.NOT_FOUND);
  }

  listCache = null;
  emitVenueEvent(VENUE_EVENTS.VENUE_UPDATED, existing);
  return existing;
}

/**
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteVenue(id) {
  await ensureFirestoreOnline();
  await deleteDoc(doc(db, VENUE_COLLECTIONS.VENUES, id));
  venueCache.delete(id);
  listCache = null;
  emitVenueEvent(VENUE_EVENTS.VENUE_DELETED, { id });
}
