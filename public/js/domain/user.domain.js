/**
 * @fileoverview User domain — pure business rules for user profiles and roles.
 * @module domain/user.domain
 */

import { AUTH_PROVIDERS } from '../auth/authentication.constants.js';
import { USER_ROLES, USER_STATUS } from '../users/user.constants.js';

/**
 * @typedef {import('../users/user.service.js').UserProfile} UserProfile
 */

export const UserDomain = {
  /**
   * Suggests an initial role for a newly created user based on auth provider.
   * Server-side rules must enforce the authoritative role assignment.
   * @param {string} [authProvider]
   * @returns {string}
   */
  suggestRoleForNewUser(authProvider) {
    if (authProvider === AUTH_PROVIDERS.EMAIL_PASSWORD) {
      return USER_ROLES.ADMIN;
    }

    return USER_ROLES.CONTESTANT;
  },

  /**
   * Returns whether a Firestore profile is complete enough for protected routes.
   * @param {UserProfile|null|undefined} profile
   * @returns {boolean}
   */
  isProfileComplete(profile) {
    if (!profile) {
      return false;
    }

    if (profile.status && profile.status !== USER_STATUS.ACTIVE) {
      return false;
    }

    return Boolean(profile.phone?.trim() && profile.timezone?.trim());
  },

  /**
   * Returns whether profile fields may be edited by the current user.
   * @param {UserProfile|null|undefined} profile
   * @returns {boolean}
   */
  canEditProfile(profile) {
    return Boolean(profile && profile.status === USER_STATUS.ACTIVE);
  },

  /**
   * Returns whether a field is protected from client-side updates.
   * @param {string} fieldName
   * @returns {boolean}
   */
  isProtectedField(fieldName) {
    return new Set([
      'uid',
      'role',
      'status',
      'provider',
      'statistics',
      'createdAt',
    ]).has(fieldName);
  },
};
