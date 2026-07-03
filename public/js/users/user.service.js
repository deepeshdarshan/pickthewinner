/**
 * @fileoverview User service — Firestore CRUD for user profiles. No DOM manipulation.
 * @module users/user.service
 */

import {
  doc,
  getDoc,
  getDocFromCache,
  runTransaction,
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
 * @property {string} district
 * @property {string} pradeshikaSabha
 * @property {string} timezone
 * @property {NotificationPreferences} notificationPreferences
 * @property {UserStatistics} statistics
 * @property {import('firebase/firestore').Timestamp|Date|null} [createdAt]
 * @property {import('firebase/firestore').Timestamp|Date|null} [updatedAt]
 * @property {import('firebase/firestore').Timestamp|Date|null} [lastLogin]
 */

/** @type {UserProfile|null} */
let cachedProfile = null;

/** @type {number} */
const FIRESTORE_READ_DEADLINE_MS = 10000;

/** @type {Promise<unknown>} */
let firestoreWriteChain = Promise.resolve();

/** @type {Promise<UserProfile|null>|null} */
let loadCurrentUserInFlight = null;

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
  loadCurrentUserInFlight = null;
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
    district: data.district ?? '',
    pradeshikaSabha: data.pradeshikaSabha ?? '',
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
function isFirestoreSdkConflictError(error) {
  return error instanceof Error && error.message.includes('Target ID already exists');
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isTransientFirestoreError(error) {
  if (isFirestoreSdkConflictError(error)) {
    return true;
  }

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
 * Runs Firestore writes one at a time to avoid SDK async-queue conflicts.
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
 * @param {import('firebase/firestore').DocumentReference} ref
 * @param {number} [deadlineMs]
 * @returns {Promise<import('firebase/firestore').DocumentSnapshot>}
 */
async function getDocWithDeadline(ref, deadlineMs = FIRESTORE_READ_DEADLINE_MS) {
  let timerId;

  try {
    return await Promise.race([
      getDoc(ref),
      new Promise((_, reject) => {
        timerId = window.setTimeout(() => {
          reject(Object.assign(new Error('Firestore read timed out'), { code: 'unavailable' }));
        }, deadlineMs);
      }),
    ]);
  } finally {
    if (timerId) {
      window.clearTimeout(timerId);
    }
  }
}

/**
 * Reads a user document — cache first, then server with one retry.
 * @param {string} uid
 * @returns {Promise<import('firebase/firestore').DocumentSnapshot>}
 */
async function fetchUserSnapshot(uid) {
  const ref = getUserDocRef(uid);

  try {
    return await getDocFromCache(ref);
  } catch {
    // Not in local cache — fetch from server.
  }

  await ensureFirestoreOnline();

  try {
    return await getDocWithDeadline(ref);
  } catch (error) {
    if (!isTransientFirestoreError(error)) {
      throw error;
    }

    Logger.warn('[UserService] Firestore read failed — one retry…');
    await delay(500);
    await ensureFirestoreOnline();
    return getDocWithDeadline(ref);
  }
}

/**
 * Builds a profile from the create payload when a post-write read is unavailable.
 * @param {string} uid
 * @param {import('firebase/firestore').DocumentData} userDoc
 * @returns {UserProfile}
 */
function buildProfileFromCreatePayload(uid, userDoc) {
  return normalizeUserDocument(uid, {
    uid: userDoc.uid,
    name: userDoc.name,
    email: userDoc.email,
    phone: userDoc.phone,
    photoURL: userDoc.photoURL,
    role: userDoc.role,
    provider: userDoc.provider,
    status: userDoc.status,
    district: userDoc.district,
    pradeshikaSabha: userDoc.pradeshikaSabha,
    timezone: userDoc.timezone,
    notificationPreferences: userDoc.notificationPreferences,
    statistics: userDoc.statistics,
    createdAt: null,
    updatedAt: null,
    lastLogin: null,
  });
}

/**
 * Creates a user document only when it does not already exist.
 * @param {import('firebase/firestore').DocumentReference} docRef
 * @param {import('firebase/firestore').DocumentData} userDoc
 * @returns {Promise<import('firebase/firestore').DocumentSnapshot|null>}
 */
async function createUserDocumentIfAbsent(docRef, userDoc) {
  return runSerializedFirestoreWrite(async () => {
    await ensureFirestoreOnline();

    const runCreateTransaction = () => runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(docRef);

      if (snapshot.exists()) {
        throw Object.assign(new Error('User already exists'), { code: 'already-exists' });
      }

      transaction.set(docRef, userDoc);
    });

    try {
      await runCreateTransaction();
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error
        && String(/** @type {{ code: string }} */ (error).code) === 'already-exists') {
        throw error;
      }

      if (!isTransientFirestoreError(error)) {
        throw error;
      }

      Logger.warn('[UserService] Firestore create failed — one retry…');
      await delay(500);
      await ensureFirestoreOnline();
      await runCreateTransaction();
    }

    try {
      return await getDocFromCache(docRef);
    } catch {
      return null;
    }
  });
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
    district: data.district ?? '',
    pradeshikaSabha: data.pradeshikaSabha ?? '',
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
  const snapshot = await createUserDocumentIfAbsent(docRef, userDoc);

  const profile = snapshot?.exists()
    ? normalizeUserDocument(uid, snapshot.data())
    : buildProfileFromCreatePayload(uid, userDoc);

  cachedProfile = profile;
  emitUserEvent(USER_EVENTS.PROFILE_CREATED, { profile });

  return profile;
}

/**
 * Creates or updates a profile from the complete-profile onboarding form.
 * Existing complete profiles are returned as-is; incomplete profiles are updated.
 * @param {string} uid
 * @param {Partial<UserProfile> & { authProvider?: string }} data
 * @returns {Promise<UserProfile>}
 */
export async function completeUserProfile(uid, data) {
  try {
    return await createUser(uid, data);
  } catch (error) {
    if (typeof error !== 'object' || error === null || !('code' in error)
      || String(/** @type {{ code: string }} */ (error).code) !== 'already-exists') {
      throw error;
    }

    const existing = await getUser(uid);

    if (!existing) {
      throw error;
    }

    cachedProfile = existing;
    ApplicationContext.setProfile(existing);
    emitUserEvent(USER_EVENTS.PROFILE_LOADED, { profile: existing });

    if (UserDomain.isProfileComplete(existing)) {
      return existing;
    }

    return updateUser(uid, {
      phone: data.phone ?? existing.phone,
      district: data.district ?? existing.district,
      pradeshikaSabha: data.pradeshikaSabha ?? existing.pradeshikaSabha,
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      photoURL: data.photoURL ?? existing.photoURL,
    });
  }
}

/**
 * Fetches a user profile by UID.
 * @param {string} uid
 * @returns {Promise<UserProfile|null>}
 */
export async function getUser(uid) {
  try {
    const snapshot = await fetchUserSnapshot(uid);

    if (!snapshot.exists()) {
      return null;
    }

    return normalizeUserDocument(uid, snapshot.data());
  } catch (error) {
    if (isTransientFirestoreError(error)) {
      Logger.warn('[UserService] Profile read unreachable — treating as no profile.');
      return null;
    }

    throw error;
  }
}

/**
 * Ensures an administrator has a Firestore profile after email/password sign-in.
 * Contestant onboarding fields are not required for admins.
 * @param {import('firebase/auth').User} firebaseUser
 * @returns {Promise<UserProfile|null>}
 */
export async function ensureAdminProfile(firebaseUser) {
  const existing = getCachedProfile() ?? await getUser(firebaseUser.uid);

  if (existing) {
    cachedProfile = existing;
    ApplicationContext.setProfile(existing);
    ApplicationContext.setCurrentUser(firebaseUser);
    emitUserEvent(USER_EVENTS.PROFILE_LOADED, { profile: existing });
    return existing;
  }

  try {
    return await createUser(firebaseUser.uid, {
      name: firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Administrator',
      email: firebaseUser.email ?? '',
      photoURL: firebaseUser.photoURL ?? '',
      authProvider: AUTH_PROVIDERS.EMAIL_PASSWORD,
      role: USER_ROLES.ADMIN,
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error
      && String(/** @type {{ code: string }} */ (error).code) === 'already-exists') {
      const profile = await getUser(firebaseUser.uid);

      if (profile) {
        cachedProfile = profile;
        ApplicationContext.setProfile(profile);
        ApplicationContext.setCurrentUser(firebaseUser);
        emitUserEvent(USER_EVENTS.PROFILE_LOADED, { profile });
      }

      return profile;
    }

    throw error;
  }
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

  if (loadCurrentUserInFlight) {
    return loadCurrentUserInFlight;
  }

  const loadPromise = (async () => {
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
  })();

  loadCurrentUserInFlight = loadPromise;

  try {
    return await loadPromise;
  } finally {
    if (loadCurrentUserInFlight === loadPromise) {
      loadCurrentUserInFlight = null;
    }
  }
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

/**
 * Checks if a user profile is locked.
 * @param {UserProfile|null|undefined} profile
 * @returns {boolean}
 */
export function isUserLocked(profile) {
  return profile?.status === USER_STATUS.LOCKED;
}

