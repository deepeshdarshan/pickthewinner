/**
 * @fileoverview User route guard — ensures profile completion before protected routes.
 * @module users/user.guard
 */

import { isAuthenticated } from '../auth/auth.service.js';
import { USER_ROUTES } from './user.constants.js';
import { getCachedProfile, loadCurrentUser } from './user.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
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
  const requiresProfile = route.requiresProfile ?? route.requiresAuth;

  if (!requiresProfile && !isCompleteProfileRoute) {
    return { allowed: true };
  }

  let profile = getCachedProfile();

  if (!profile) {
    try {
      profile = await loadCurrentUser();
    } catch (error) {
      Logger.error('[UserGuard] Failed to load profile:', error);
      return {
        allowed: false,
        redirectTo: '/error',
        replace: true,
      };
    }
  }

  const profileComplete = UserDomain.isProfileComplete(profile);

  if (!profileComplete && requiresProfile && !isCompleteProfileRoute) {
    return { allowed: false, redirectTo: USER_ROUTES.COMPLETE_PROFILE, replace: true };
  }

  if (profileComplete && isCompleteProfileRoute) {
    await AuthorizationService.resolve();
    return {
      allowed: false,
      redirectTo: AuthorizationService.getDefaultRouteForRole(),
      replace: true,
    };
  }

  return { allowed: true };
}
