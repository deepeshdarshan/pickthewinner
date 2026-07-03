/**
 * @fileoverview User route guard — ensures profile completion before protected routes.
 * @module users/user.guard
 */

import { isAuthenticated, isAdminAuthUser, getCurrentUser } from '../auth/auth.service.js';
import { USER_ROUTES } from './user.constants.js';
import { ensureAdminProfile, getCachedProfile, loadCurrentUser, isUserLocked } from './user.service.js';
import { UserDomain } from '../domain/user.domain.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} UserGuardResult
 * @property {boolean} allowed
 * @property {string} [redirectTo]
 * @property {boolean} [replace]
 */

/**
 * Evaluates whether the user may access a route based on profile state.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<UserGuardResult>}
 */
export async function canActivateUserRoute(route) {
  if (!isAuthenticated()) {
    return { allowed: true };
  }

  const isCompleteProfileRoute = route.path === USER_ROUTES.COMPLETE_PROFILE;

  // /complete-profile is always reachable for authenticated users.
  // The page itself handles existing-profile detection and redirection.
  // Never guard-redirect from /complete-profile → /complete-profile (infinite loop).
  if (isCompleteProfileRoute) {
    return { allowed: true };
  }

  const requiresProfile = route.requiresProfile ?? false;

  if (!requiresProfile) {
    return { allowed: true };
  }

  const authUser = getCurrentUser();

  if (isAdminAuthUser(authUser)) {
    try {
      await ensureAdminProfile(authUser);
    } catch (error) {
      Logger.error('[UserGuard] Failed to ensure admin profile:', error);
    }

    return { allowed: true };
  }

  let profile = getCachedProfile();

  if (!profile) {
    try {
      profile = await loadCurrentUser();
    } catch (error) {
      Logger.error('[UserGuard] Failed to load profile:', error);
      return { allowed: false, redirectTo: USER_ROUTES.COMPLETE_PROFILE, replace: true };
    }
  }

  // Check if user account is locked
  if (isUserLocked(profile)) {
    Logger.warn('[UserGuard] Locked user attempted access:', profile?.uid);
    return { allowed: false, redirectTo: '/account-locked', replace: true };
  }

  if (UserDomain.isAdmin(profile)) {
    return { allowed: true };
  }

  if (!UserDomain.isProfileComplete(profile)) {
    return { allowed: false, redirectTo: USER_ROUTES.COMPLETE_PROFILE, replace: true };
  }

  return { allowed: true };
}
