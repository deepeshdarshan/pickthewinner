/**
 * @fileoverview Authentication route guard — identity checks only, no role logic.
 * @module auth/auth.guard
 */

import { isAuthenticated } from './auth.service.js';
import { AUTH_ROUTES } from './authentication.constants.js';
import { USER_ROLES } from '../users/user.constants.js';

/**
 * @typedef {Object} GuardResult
 * @property {boolean} allowed
 * @property {string} [redirectTo]
 * @property {boolean} [replace]
 */

/**
 * Evaluates whether a route may be activated based on authentication state.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<GuardResult>}
 */
export async function canActivate(route) {
  if (route.requiresAuth && !isAuthenticated()) {
    const loginPath = route.requiredRole === USER_ROLES.ADMIN
      ? `${AUTH_ROUTES.LOGIN}?mode=admin`
      : AUTH_ROUTES.LOGIN;

    return { allowed: false, redirectTo: loginPath, replace: true };
  }

  return { allowed: true };
}
