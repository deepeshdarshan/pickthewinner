/**
 * @fileoverview Centralized authorization API — role and permission evaluation.
 * @module authorization/authorization.service
 *
 * @example
 * AuthorizationService.hasPermission(Permissions.CREATE_MATCH);
 * AuthorizationService.hasRole(Roles.ADMIN);
 * AuthorizationService.canAccessRoute('/admin/matches');
 */

import { isAuthenticated } from '../auth/auth.service.js';
import { loadCurrentUser, getCachedProfile } from '../users/user.service.js';
import { USER_ROUTES } from '../users/user.constants.js';
import { findRouteByPath, normalizePath, CONTESTANT_ROUTES } from '../config/routes.js';
import { Roles, AUTHORIZATION_ROUTES, AUTHORIZATION_MESSAGES } from './permission.constants.js';
import { getPermissionsForRole } from './permission.service.js';
import {
  AUTHORIZATION_EVENTS,
  emitAuthorizationEvent,
} from './authorization.events.js';
import { showWarningToast } from '../utils/toast.util.js';
import { Logger } from '../utils/logger.util.js';
import { ApplicationContext } from '../app/application-context.js';

/** @type {string|null} */
let cachedRole = null;

/** @type {ReadonlySet<string>|null} */
let cachedPermissions = null;

/** @type {boolean} */
let authorizationResolved = false;

/**
 * Centralized authorization API. All permission and role checks go through this service.
 */
export const AuthorizationService = {
  /**
   * Clears cached role and permission data.
   * @returns {void}
   */
  clearCache() {
    cachedRole = null;
    cachedPermissions = null;
    authorizationResolved = false;
  },

  /**
   * Returns whether authorization has been resolved for the current session.
   * @returns {boolean}
   */
  isResolved() {
    return authorizationResolved;
  },

  /**
   * Returns the cached role without triggering a profile load.
   * @returns {string|null}
   */
  getCurrentRole() {
    return cachedRole;
  },

  /**
   * Returns the cached permission set.
   * @returns {ReadonlySet<string>}
   */
  getCurrentPermissions() {
    return cachedPermissions ?? new Set();
  },

  /**
   * Resolves the current user's role and permissions from the user profile.
   * @param {boolean} [forceRefresh=false]
   * @returns {Promise<{ role: string|null, permissions: ReadonlySet<string> }>}
   */
  async resolve(forceRefresh = false) {
    if (!isAuthenticated()) {
      applyAuthorizationState(null);
      return { role: null, permissions: new Set() };
    }

    try {
      const profile = forceRefresh
        ? await loadCurrentUser(true)
        : getCachedProfile() ?? await loadCurrentUser();

      applyAuthorizationState(profile?.role ?? null);
    } catch (error) {
      Logger.error('[Authorization] Failed to resolve profile:', error);
      applyAuthorizationState(null);
    }

    return { role: cachedRole, permissions: this.getCurrentPermissions() };
  },

  /**
   * Checks whether the current user has a permission.
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    return cachedPermissions?.has(permission) ?? false;
  },

  /**
   * Checks whether the current user has a role.
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(role) {
    return cachedRole === role;
  },

  /**
   * Determines whether the current user may access a route by path or definition.
   * @param {string|import('../config/routes.js').RouteDefinition} pathOrRoute
   * @returns {boolean}
   */
  canAccessRoute(pathOrRoute) {
    const route = typeof pathOrRoute === 'string'
      ? findRouteByPath(normalizePath(pathOrRoute))
      : pathOrRoute;

    if (!route) {
      return false;
    }

    if (route.guestOnly) {
      return !isAuthenticated();
    }

    if (!route.requiresAuth && !route.requiredRole) {
      return true;
    }

    if (!isAuthenticated()) {
      return false;
    }

    if (route.requiredRole && !this.hasRole(route.requiredRole)) {
      return false;
    }

    return true;
  },

  /**
   * Validates a permission before feature execution.
   * Emits ACCESS_DENIED and shows a toast when unauthorized.
   * @param {string} permission
   * @param {string} [action]
   * @returns {boolean}
   */
  requirePermission(permission, action) {
    if (this.hasPermission(permission)) {
      return true;
    }

    this.notifyAccessDenied({ permission, action });
    showWarningToast(AUTHORIZATION_MESSAGES.PERMISSION_DENIED);
    return false;
  },

  /**
   * Returns routes that should appear in navigation for the current user.
   * @param {import('../config/routes.js').RouteDefinition[]} routes
   * @returns {import('../config/routes.js').RouteDefinition[]}
   */
  getAuthorizedNavRoutes(routes) {
    const role = this.getCurrentRole();
    const authenticated = isAuthenticated();

    return routes.filter((route) => {
      const showInNavbar = route.showInNavbar ?? route.showInNav ?? false;

      if (!showInNavbar) {
        return false;
      }

      if (!authenticated) {
        return route.roles?.includes('guest') ?? false;
      }

      if (route.requiredRole && !this.hasRole(route.requiredRole)) {
        return false;
      }

      if (route.roles?.length && role) {
        return route.roles.includes(role);
      }

      return this.canAccessRoute(route);
    });
  },

  /**
   * Returns routes visible in mobile navigation for the current user.
   * @param {import('../config/routes.js').RouteDefinition[]} routes
   * @returns {import('../config/routes.js').RouteDefinition[]}
   */
  getAuthorizedMobileNavRoutes(routes) {
    return this.getAuthorizedNavRoutes(routes).filter((route) => route.showInMobileNav);
  },

  /**
   * Returns the default landing route for the current role.
   * @returns {string}
   */
  getDefaultRouteForRole() {
    if (this.hasRole(Roles.ADMIN)) {
      return '/admin';
    }

    if (this.hasRole(Roles.CONTESTANT)) {
      return CONTESTANT_ROUTES.PREDICTIONS;
    }

    if (isAuthenticated()) {
      return USER_ROUTES.COMPLETE_PROFILE;
    }

    return '/';
  },

  /**
   * Returns the access-denied route path.
   * @returns {string}
   */
  getAccessDeniedRoute() {
    return AUTHORIZATION_ROUTES.ACCESS_DENIED;
  },

  /**
   * Returns the not-found route path.
   * @returns {string}
   */
  getNotFoundRoute() {
    return AUTHORIZATION_ROUTES.NOT_FOUND;
  },

  /**
   * Emits an access-denied event for subscribers and logging.
   * @param {Object} [detail]
   * @param {string} [detail.route]
   * @param {string} [detail.permission]
   * @param {string} [detail.action]
   * @returns {void}
   */
  notifyAccessDenied(detail = {}) {
    Logger.warn('[Authorization] Access denied:', detail);
    emitAuthorizationEvent(AUTHORIZATION_EVENTS.ACCESS_DENIED, detail);
  },
};

/**
 * @param {string|null} role
 * @returns {void}
 */
function applyAuthorizationState(role) {
  const previousRole = cachedRole;
  const permissions = getPermissionsForRole(role);

  cachedRole = role;
  cachedPermissions = permissions;
  authorizationResolved = true;
  ApplicationContext.setPermissions(permissions);

  if (previousRole !== role) {
    emitAuthorizationEvent(AUTHORIZATION_EVENTS.ROLE_CHANGED, { role });
    emitAuthorizationEvent(AUTHORIZATION_EVENTS.PERMISSION_CHANGED, {
      role,
      permissions: [...permissions],
    });
  }
}
