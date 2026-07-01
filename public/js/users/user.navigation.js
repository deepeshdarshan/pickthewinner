/**
 * @fileoverview Post-login navigation helpers based on user profile state.
 * @module users/user.navigation
 */

import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { USER_ROLES, USER_ROUTES } from './user.constants.js';
import { getCachedProfile } from './user.service.js';

/**
 * Resolves the destination route after a successful sign-in.
 *
 * Uses only the in-memory profile cache to avoid a redundant Firestore read
 * right after popup sign-in (when the Firestore client may be briefly offline).
 * If the cache is empty the guards on the destination route will do the
 * profile check and redirect appropriately.
 *
 * @param {import('firebase/auth').User} _firebaseUser
 * @param {string} [_authProvider]
 * @returns {Promise<string>}
 */
export async function getPostLoginDestination(_firebaseUser, _authProvider) {
  const cached = getCachedProfile();

  if (cached) {
    if (cached.role === USER_ROLES.ADMIN) {
      return AUTH_ROUTES.ADMIN;
    }

    return AUTH_ROUTES.DASHBOARD;
  }

  // No cache yet — the user.guard on /complete-profile will redirect to
  // /dashboard or /admin once the profile is loaded.
  return USER_ROUTES.COMPLETE_PROFILE;
}
