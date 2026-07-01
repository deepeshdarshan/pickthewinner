/**
 * @fileoverview Role guard — protects routes based on user role and permissions.
 * @module authorization/role.guard
 */

import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { AuthorizationService } from './authorization.service.js';

/**
 * @typedef {Object} RoleGuardResult
 * @property {boolean} allowed
 * @property {string} [redirectTo]
 * @property {boolean} [forbidden]
 * @property {boolean} [replace]
 */

/**
 * Evaluates whether the current user may access a route based on role.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<RoleGuardResult>}
 */
export async function canActivateRoleRoute(route) {
  if (route.guestOnly) {
    if (!isAuthenticated()) {
      return { allowed: true };
    }

    await AuthorizationService.resolve();
    return {
      allowed: false,
      redirectTo: AuthorizationService.getDefaultRouteForRole(),
      replace: true,
    };
  }

  if (!route.requiredRole) {
    return { allowed: true };
  }

  if (!isAuthenticated()) {
    return { allowed: true };
  }

  await AuthorizationService.resolve();

  if (AuthorizationService.hasRole(route.requiredRole)) {
    return { allowed: true };
  }

  AuthorizationService.notifyAccessDenied({ route: route.path });

  return {
    allowed: false,
    redirectTo: AuthorizationService.getAccessDeniedRoute(),
    forbidden: true,
    replace: true,
  };
}

/**
 * Evaluates guest-only route access for authenticated users.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<RoleGuardResult>}
 */
export async function canActivateGuestRoute(route) {
  return canActivateRoleRoute(route);
}
