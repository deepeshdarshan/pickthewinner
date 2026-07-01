/**
 * @fileoverview Global application context — centralized session and app state.
 * @module app/application-context
 */

import { appSettings } from '../config/app.config.js';
import { getLocalItem } from '../utils/storage.util.js';
import { STORAGE_KEYS } from '../config/application.constants.js';

/**
 * @typedef {import('../users/user.service.js').UserProfile} UserProfile
 * @typedef {import('firebase/auth').User} AuthUser
 */

/** @type {AuthUser|null} */
let currentUser = null;

/** @type {UserProfile|null} */
let currentProfile = null;

/** @type {unknown|null} */
let currentTournament = null;

/** @type {ReadonlySet<string>} */
let currentPermissions = new Set();

/**
 * Global application context for cross-module state access.
 */
export const ApplicationContext = {
  /**
   * @returns {AuthUser|null}
   */
  getCurrentUser() {
    return currentUser;
  },

  /**
   * @param {AuthUser|null} user
   * @returns {void}
   */
  setCurrentUser(user) {
    currentUser = user;
  },

  /**
   * @returns {UserProfile|null}
   */
  getProfile() {
    return currentProfile;
  },

  /**
   * @param {UserProfile|null} profile
   * @returns {void}
   */
  setProfile(profile) {
    currentProfile = profile;
  },

  /**
   * @returns {unknown|null}
   */
  getTournament() {
    return currentTournament;
  },

  /**
   * @param {unknown|null} tournament
   * @returns {void}
   */
  setTournament(tournament) {
    currentTournament = tournament;
  },

  /**
   * @returns {ReadonlySet<string>}
   */
  getPermissions() {
    return currentPermissions;
  },

  /**
   * @param {Iterable<string>} permissions
   * @returns {void}
   */
  setPermissions(permissions) {
    currentPermissions = new Set(permissions);
  },

  /**
   * @returns {string}
   */
  getTheme() {
    return getLocalItem(STORAGE_KEYS.THEME, appSettings.theme);
  },

  /**
   * @returns {string}
   */
  getTimezone() {
    return currentProfile?.timezone ?? appSettings.timezone;
  },

  /**
   * @returns {typeof appSettings}
   */
  getSettings() {
    return appSettings;
  },

  /**
   * Clears all session-scoped context state.
   * @returns {void}
   */
  clear() {
    currentUser = null;
    currentProfile = null;
    currentTournament = null;
    currentPermissions = new Set();
  },
};
