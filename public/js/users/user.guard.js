/**
 * @fileoverview User route guard — ensures profile completion before protected routes.
 * @module users/user.guard
 */

import { isAuthenticated } from '../auth/auth.service.js';
import { USER_ROUTES } from './user.constants.js';
import { loadCurrentUser } from './user.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
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

  if (!route.requiresAuth && !isCompleteProfileRoute) {
    return { allowed: true };
  }

  let profile = null;

  try {
    profile = await loadCurrentUser();
  } catch (error) {
    Logger.error('[UserGuard] Failed to load profile:', error);
    return { allowed: true };
  }

  if (!profile && route.requiresAuth && !isCompleteProfileRoute) {
    return { allowed: false, redirectTo: USER_ROUTES.COMPLETE_PROFILE, replace: true };
  }

  if (profile && isCompleteProfileRoute) {
    await AuthorizationService.resolve();
    return {
      allowed: false,
      redirectTo: AuthorizationService.getDefaultRouteForRole(),
      replace: true,
    };
  }

  return { allowed: true };
}
