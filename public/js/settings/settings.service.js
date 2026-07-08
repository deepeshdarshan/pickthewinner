/**
 * @fileoverview Platform settings service — global application configuration.
 * @module settings/settings.service
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { ApplicationContext } from '../app/application-context.js';
import { isAdminAuthUser, getCurrentUser } from '../auth/auth.service.js';
import { Logger } from '../utils/logger.util.js';
import {
  SETTINGS_COLLECTIONS,
  SETTINGS_DOCUMENTS,
  DEFAULT_PLATFORM_SETTINGS,
  SETTINGS_MESSAGES,
} from './settings.constants.js';
import { SETTINGS_EVENTS, emitSettingsEvent } from './settings.events.js';

/**
 * @typedef {Object} PlatformSettings
 * @property {boolean} leaderboardVisible
 */

/** @type {PlatformSettings|null} */
let cachedSettings = null;

/** @type {Promise<PlatformSettings>|null} */
let loadInFlight = null;

/**
 * @returns {import('firebase/firestore').DocumentReference}
 */
function getGeneralSettingsDocRef() {
  return doc(db, SETTINGS_COLLECTIONS.SETTINGS, SETTINGS_DOCUMENTS.GENERAL);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function resolveLeaderboardVisible(value) {
  return Boolean(value);
}

/**
 * @returns {boolean}
 */
function resolveLegacyLeaderboardVisible() {
  const tournament = ApplicationContext.getTournament();

  if (!tournament || typeof tournament !== 'object') {
    return false;
  }

  const configuration = /** @type {Record<string, unknown>} */ (tournament).configuration;

  if (!configuration || typeof configuration !== 'object') {
    return false;
  }

  return resolveLeaderboardVisible(configuration.leaderboardVisible);
}

/**
 * @param {Record<string, unknown>|null|undefined} data
 * @returns {PlatformSettings}
 */
function normalizeSettings(data) {
  return {
    leaderboardVisible: resolveLeaderboardVisible(
      data?.leaderboardVisible ?? DEFAULT_PLATFORM_SETTINGS.leaderboardVisible,
    ),
  };
}

/**
 * @param {PlatformSettings} settings
 * @returns {Promise<void>}
 */
async function persistSettings(settings) {
  await ensureFirestoreOnline();
  await setDoc(getGeneralSettingsDocRef(), {
    leaderboardVisible: settings.leaderboardVisible,
    updatedAt: serverTimestamp(),
    updatedBy: getCurrentUser()?.uid ?? null,
  }, { merge: true });
}

/**
 * Centralized platform settings access for application-wide configuration.
 */
export const PlatformSettingsService = {
  /**
   * Loads and caches platform settings from Firestore.
   * Seeds from legacy tournament configuration when the document is missing.
   * @returns {Promise<PlatformSettings>}
   */
  async load() {
    if (cachedSettings) {
      return cachedSettings;
    }

    if (loadInFlight) {
      return loadInFlight;
    }

    loadInFlight = this._loadFromFirestore();

    try {
      return await loadInFlight;
    } finally {
      loadInFlight = null;
    }
  },

  /**
   * @returns {Promise<PlatformSettings>}
   */
  async _loadFromFirestore() {
    try {
      await ensureFirestoreOnline();
      const snapshot = await getDoc(getGeneralSettingsDocRef());

      if (snapshot.exists()) {
        cachedSettings = normalizeSettings(snapshot.data());
        return cachedSettings;
      }

      const seededSettings = {
        leaderboardVisible: resolveLegacyLeaderboardVisible(),
      };

      cachedSettings = seededSettings;

      if (isAdminAuthUser()) {
        try {
          await persistSettings(seededSettings);
        } catch (error) {
          Logger.warn('[PlatformSettingsService] Failed to seed settings document:', error);
        }
      }

      return cachedSettings;
    } catch (error) {
      Logger.warn('[PlatformSettingsService] Failed to load settings, using legacy fallback:', error);
      cachedSettings = {
        leaderboardVisible: resolveLegacyLeaderboardVisible(),
      };
      return cachedSettings;
    }
  },

  /**
   * @returns {boolean}
   */
  isLeaderboardVisible() {
    const settings = cachedSettings ?? normalizeSettings(DEFAULT_PLATFORM_SETTINGS);
    return settings.leaderboardVisible;
  },

  /**
   * @param {unknown} value
   * @returns {void}
   */
  setLeaderboardVisible(value) {
    const base = cachedSettings ?? normalizeSettings(DEFAULT_PLATFORM_SETTINGS);
    cachedSettings = {
      ...base,
      leaderboardVisible: resolveLeaderboardVisible(value),
    };
  },

  /**
   * @param {boolean} value
   * @param {string} adminUid
   * @returns {Promise<PlatformSettings>}
   */
  async updateLeaderboardVisibility(value, adminUid) {
    if (!adminUid) {
      throw new Error(SETTINGS_MESSAGES.PERMISSION_DENIED);
    }

    const nextValue = resolveLeaderboardVisible(value);
    const previous = cachedSettings ?? normalizeSettings(DEFAULT_PLATFORM_SETTINGS);

    try {
      await ensureFirestoreOnline();
      await updateDoc(getGeneralSettingsDocRef(), {
        leaderboardVisible: nextValue,
        updatedAt: serverTimestamp(),
        updatedBy: adminUid,
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'not-found') {
        await persistSettings({ leaderboardVisible: nextValue });
      } else {
        throw error;
      }
    }

    cachedSettings = {
      ...previous,
      leaderboardVisible: nextValue,
    };

    emitSettingsEvent(SETTINGS_EVENTS.SETTINGS_UPDATED, cachedSettings);
    return cachedSettings;
  },

  /**
   * @returns {void}
   */
  clearCache() {
    cachedSettings = null;
    loadInFlight = null;
  },
};
