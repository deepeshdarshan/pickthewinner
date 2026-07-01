/**
 * @fileoverview User service — Firestore CRUD for user profiles. No DOM manipulation.
 * @module users/user.service
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { AUTH_PROVIDERS } from '../auth/authentication.constants.js';
import {
  USER_COLLECTIONS,
  USER_ROLES,
  USER_STATUS,
  USER_PROVIDERS,
  DEFAULT_TIMEZONE,
  DEFAULT_NOTIFICATION_PREFERENCES,
  USER_MESSAGES,
  FIRESTORE_USER_ERROR_MESSAGES,
} from './user.constants.js';
import { USER_EVENTS, emitUserEvent } from './user.events.js';
import { Logger } from '../utils/logger.util.js';
import { UserDomain } from '../domain/user.domain.js';
import { ApplicationContext } from '../app/application-context.js';

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} email
 * @property {boolean} browser
 */

/**
 * @typedef {Object} UserStatistics
 * @property {number} tournamentsPlayed
 * @property {number} matchesPredicted
 * @property {number} exactPredictions
 * @property {number} correctWinnerPredictions
 * @property {number} totalPoints
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} uid
 * @property {string} name
 * @property {string} email
 * @property {string} phone
 * @property {string} photoURL
 * @property {string} role
 * @property {string} provider
 * @property {string} status
 * @property {string} timezone
 * @property {NotificationPreferences} notificationPreferences
 * @property {UserStatistics} statistics
 * @property {import('firebase/firestore').Timestamp|Date|null} [createdAt]
 * @property {import('firebase/firestore').Timestamp|Date|null} [updatedAt]
 * @property {import('firebase/firestore').Timestamp|Date|null} [lastLogin]
 */

/** @type {UserProfile|null} */
let cachedProfile = null;

/** Fields contestants may not update via the client.
 * @type {ReadonlySet<string>}
 */
const PROTECTED_UPDATE_FIELDS = new Set([
  'uid',
  'role',
  'status',
  'provider',
  'statistics',
  'createdAt',
]);

/**
 * Returns the default statistics object for new users.
 * @returns {UserStatistics}
 */
export function createDefaultStatistics() {
  return {
    tournamentsPlayed: 0,
    matchesPredicted: 0,
    exactPredictions: 0,
    correctWinnerPredictions: 0,
    totalPoints: 0,
  };
}

/**
 * Maps an auth provider string to a user provider constant.
 * @param {string} [authProvider]
 * @returns {string}
 */
export function mapAuthProviderToUserProvider(authProvider) {
  if (authProvider === AUTH_PROVIDERS.EMAIL_PASSWORD) {
    return USER_PROVIDERS.EMAIL_PASSWORD;
  }

  return USER_PROVIDERS.GOOGLE;
}

/**
 * Derives the user role from the auth provider via domain rules.
 * @param {string} [authProvider]
 * @returns {string}
 */
export function deriveRoleFromProvider(authProvider) {
  return UserDomain.suggestRoleForNewUser(authProvider);
}

/**
 * Maps a Firestore error to a user-friendly message.
 * @param {unknown} error
 * @returns {string}
 */
export function getUserErrorMessage(error) {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String(/** @type {{ code: string }} */ (error).code);

    if (code === 'already-exists') {
      return USER_MESSAGES.DUPLICATE_USER;
    }

    Logger.error('[UserService] Firestore error:', code || error);
    return FIRESTORE_USER_ERROR_MESSAGES[code] ?? USER_MESSAGES.GENERIC_ERROR;
  }

  Logger.error('[UserService] Error:', error);
  return USER_MESSAGES.GENERIC_ERROR;
}

/**
 * Returns the cached user profile, if any.
 * @returns {UserProfile|null}
 */
export function getCachedProfile() {
  return cachedProfile;
}

/**
 * Clears the in-memory user profile cache.
 * @returns {void}
 */
export function clearProfileCache() {
  cachedProfile = null;
  ApplicationContext.setProfile(null);
}

/**
 * Normalizes a Firestore document into a UserProfile.
 * @param {string} uid
 * @param {import('firebase/firestore').DocumentData} data
 * @returns {UserProfile}
 */
function normalizeUserDocument(uid, data) {
  return {
    uid,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    photoURL: data.photoURL ?? '',
    role: data.role ?? USER_ROLES.CONTESTANT,
    provider: data.provider ?? USER_PROVIDERS.GOOGLE,
    status: data.status ?? USER_STATUS.ACTIVE,
    timezone: data.timezone ?? DEFAULT_TIMEZONE,
    notificationPreferences: {
      email: data.notificationPreferences?.email ?? DEFAULT_NOTIFICATION_PREFERENCES.email,
      browser: data.notificationPreferences?.browser ?? DEFAULT_NOTIFICATION_PREFERENCES.browser,
    },
    statistics: {
      ...createDefaultStatistics(),
      ...(data.statistics ?? {}),
    },
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
    lastLogin: data.lastLogin ?? null,
  };
}

/**
 * Strips protected fields from an update payload.
 * @param {Record<string, unknown>} data
 * @returns {Record<string, unknown>}
 */
function sanitizeUpdatePayload(data) {
  const sanitized = { ...data };

  PROTECTED_UPDATE_FIELDS.forEach((field) => {
    delete sanitized[field];
  });

  return sanitized;
}

/**
 * Returns a reference to a user document.
 * @param {string} uid
 * @returns {import('firebase/firestore').DocumentReference}
 */
function getUserDocRef(uid) {
  return doc(db, USER_COLLECTIONS.USERS, uid);
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isTransientFirestoreError(error) {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const code = String(/** @type {{ code: string }} */ (error).code);
  return code === 'unavailable' || code === 'failed-precondition';
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Reads a user document with Firestore network recovery retries.
 * @param {string} uid
 * @returns {Promise<import('firebase/firestore').DocumentSnapshot>}
 */
async function fetchUserSnapshot(uid) {
  const maxAttempts = 4;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await ensureFirestoreOnline();
      return await getDoc(getUserDocRef(uid));
    } catch (error) {
      lastError = error;

      if (!isTransientFirestoreError(error) || attempt === maxAttempts) {
        throw error;
      }

      Logger.warn(`[UserService] Retrying profile read (${attempt}/${maxAttempts})…`);
      await delay(250 * attempt);
    }
  }

  throw lastError;
}

/**
 * Creates a new user profile in Firestore.
 * @param {string} uid
 * @param {Partial<UserProfile> & { authProvider?: string }} data
 * @returns {Promise<UserProfile>}
 */
export async function createUser(uid, data) {
  const firebaseUser = getCurrentUser();
  const authProvider = data.authProvider ?? data.provider;
  const provider = mapAuthProviderToUserProvider(
    typeof authProvider === 'string' ? authProvider.toLowerCase() : undefined,
  );

  const userDoc = {
    uid,
    name: data.name ?? firebaseUser?.displayName ?? '',
    email: data.email ?? firebaseUser?.email ?? '',
    phone: data.phone ?? '',
    photoURL: data.photoURL ?? firebaseUser?.photoURL ?? '',
    role: data.role ?? deriveRoleFromProvider(
      typeof authProvider === 'string' ? authProvider.toLowerCase() : undefined,
    ),
    provider,
    status: USER_STATUS.ACTIVE,
    timezone: data.timezone ?? DEFAULT_TIMEZONE,
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(data.notificationPreferences ?? {}),
    },
    statistics: createDefaultStatistics(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
  };

  const docRef = getUserDocRef(uid);
  const existing = await fetchUserSnapshot(uid);

  if (existing.exists()) {
    throw Object.assign(new Error('User already exists'), { code: 'already-exists' });
  }

  await setDoc(docRef, userDoc);

  const profile = await getUser(uid);

  if (!profile) {
    throw Object.assign(new Error('User not found after create'), { code: 'not-found' });
  }

  cachedProfile = profile;
  emitUserEvent(USER_EVENTS.PROFILE_CREATED, { profile });

  return profile;
}

/**
 * Fetches a user profile by UID.
 * @param {string} uid
 * @returns {Promise<UserProfile|null>}
 */
export async function getUser(uid) {
  const snapshot = await fetchUserSnapshot(uid);

  if (!snapshot.exists()) {
    return null;
  }

  return normalizeUserDocument(uid, snapshot.data());
}

/**
 * Loads the current authenticated user's profile, using cache when available.
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<UserProfile|null>}
 */
export async function loadCurrentUser(forceRefresh = false) {
  const firebaseUser = getCurrentUser();

  if (!firebaseUser) {
    clearProfileCache();
    return null;
  }

  if (!forceRefresh && cachedProfile?.uid === firebaseUser.uid) {
    return cachedProfile;
  }

  const profile = await getUser(firebaseUser.uid);

  if (profile) {
    cachedProfile = profile;
    ApplicationContext.setProfile(profile);
    ApplicationContext.setCurrentUser(getCurrentUser());
    emitUserEvent(USER_EVENTS.PROFILE_LOADED, { profile });
  } else {
    cachedProfile = null;
    ApplicationContext.setProfile(null);
  }

  return profile;
}

/**
 * Updates a user profile with merge semantics.
 * @param {string} uid
 * @param {Partial<UserProfile>} data
 * @returns {Promise<UserProfile>}
 */
export async function updateUser(uid, data) {
  const sanitized = sanitizeUpdatePayload(/** @type {Record<string, unknown>} */ (data));
  const updatePayload = {
    ...sanitized,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(getUserDocRef(uid), updatePayload);

  const profile = await getUser(uid);

  if (!profile) {
    throw Object.assign(new Error('User not found after update'), { code: 'not-found' });
  }

  cachedProfile = profile;
  emitUserEvent(USER_EVENTS.PROFILE_UPDATED, { profile });

  if (data.notificationPreferences || data.timezone) {
    emitUserEvent(USER_EVENTS.PREFERENCES_UPDATED, {
      notificationPreferences: profile.notificationPreferences,
      timezone: profile.timezone,
    });
  }

  return profile;
}

/**
 * Soft-deletes a user by setting status to INACTIVE.
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function deleteUser(uid) {
  await updateDoc(getUserDocRef(uid), {
    status: USER_STATUS.INACTIVE,
    updatedAt: serverTimestamp(),
  });

  if (cachedProfile?.uid === uid) {
    clearProfileCache();
  }

  emitUserEvent(USER_EVENTS.PROFILE_DELETED, { uid });
}

/**
 * Updates the last login timestamp for a user.
 * @param {string} uid
 * @returns {Promise<void>}
 */
export async function updateLastLogin(uid) {
  await updateDoc(getUserDocRef(uid), {
    lastLogin: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (cachedProfile?.uid === uid) {
    const refreshed = await getUser(uid);

    if (refreshed) {
      cachedProfile = refreshed;
    }
  }
}

/**
 * Returns whether the current user has a Firestore profile.
 * @returns {Promise<boolean>}
 */
export async function hasCurrentUserProfile() {
  const profile = await loadCurrentUser();
  return Boolean(profile);
}
