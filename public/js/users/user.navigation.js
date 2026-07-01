/**
 * @fileoverview Post-login navigation helpers based on user profile state.
 * @module users/user.navigation
 */

import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { USER_ROLES, USER_ROUTES } from './user.constants.js';
import { loadCurrentUser } from './user.service.js';

/**
 * Resolves the destination route after a successful sign-in.
 * @param {import('firebase/auth').User} _firebaseUser
 * @param {string} [_authProvider]
 * @returns {Promise<string>}
 */
export async function getPostLoginDestination(_firebaseUser, _authProvider) {
  const profile = await loadCurrentUser();

  if (!profile) {
    return USER_ROUTES.COMPLETE_PROFILE;
  }

  if (profile.role === USER_ROLES.ADMIN) {
    return AUTH_ROUTES.ADMIN;
  }

  return AUTH_ROUTES.DASHBOARD;
}
