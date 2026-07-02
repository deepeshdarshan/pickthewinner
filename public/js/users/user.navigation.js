/**
 * @fileoverview Post-login navigation helpers based on user profile state.
 * @module users/user.navigation
 */

import { AUTH_PROVIDERS, AUTH_ROUTES } from '../auth/authentication.constants.js';
import { isAdminAuthUser } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { CONTESTANT_ROUTES } from '../config/routes.js';
import { UserDomain } from '../domain/user.domain.js';
import { USER_ROLES, USER_ROUTES } from './user.constants.js';
import {
  ensureAdminProfile,
  getCachedProfile,
  loadCurrentUser,
} from './user.service.js';

/**
 * @typedef {import('./user.service.js').UserProfile} UserProfile
 */

/**
 * Returns the dashboard route for a user profile.
 * @param {UserProfile} profile
 * @returns {string}
 */
export function getDashboardRouteForProfile(profile) {
  if (profile.role === USER_ROLES.ADMIN) {
    return AUTH_ROUTES.ADMIN;
  }

  return CONTESTANT_ROUTES.PREDICTIONS;
}

/**
 * Resolves the destination route after a successful sign-in.
 * @param {import('firebase/auth').User} _firebaseUser
 * @param {string} [_authProvider]
 * @returns {Promise<string>}
 */
export async function getPostLoginDestination(firebaseUser, authProvider) {
  const isAdminLogin = authProvider === AUTH_PROVIDERS.EMAIL_PASSWORD
    || isAdminAuthUser(firebaseUser);

  if (isAdminLogin) {
    const profile = getCachedProfile() ?? await ensureAdminProfile(firebaseUser);
    await AuthorizationService.resolve(true);

    if (profile) {
      return getDashboardRouteForProfile(profile);
    }

    return AUTH_ROUTES.ADMIN;
  }

  const profile = getCachedProfile() ?? await loadCurrentUser();

  if (!profile || !UserDomain.isProfileComplete(profile)) {
    return USER_ROUTES.COMPLETE_PROFILE;
  }

  return getDashboardRouteForProfile(profile);
}
