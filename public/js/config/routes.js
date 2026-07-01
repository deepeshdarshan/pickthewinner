/**
 * @fileoverview Client-side route definitions for the SPA router.
 * @module config/routes
 */

import { USER_ROLES } from '../users/user.constants.js';
import { AUTHORIZATION_ROUTES } from '../authorization/permission.constants.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';

/**
 * @typedef {Object} RouteDefinition
 * @property {string} path - URL path (History API).
 * @property {string} name - Route identifier used by the router.
 * @property {string} title - Document title suffix.
 * @property {string} pageModule - Dynamic import path for the page module.
 * @property {boolean} [showInNav] - Whether the route appears in navigation.
 * @property {string} [navLabel] - Display label in navigation.
 * @property {string} [navIcon] - Bootstrap Icons class name.
 * @property {boolean} [requiresAuth] - Requires authentication.
 * @property {boolean} [guestOnly] - Only accessible to unauthenticated users.
 * @property {string|null} [requiredRole] - Required role for role-based routing.
 * @property {string[]} [roles] - Roles that may see this item in navigation.
 */

/** @type {Readonly<RouteDefinition[]>} */
export const ROUTES = Object.freeze([
  {
    path: '/',
    name: 'landing',
    title: 'Home',
    pageModule: '../pages/landing.page.js',
    showInNav: false,
    requiresAuth: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTH_ROUTES.LOGIN,
    name: 'login',
    title: 'Sign In',
    pageModule: '../pages/login.page.js',
    showInNav: true,
    navLabel: 'Sign In',
    navIcon: 'bi-box-arrow-in-right',
    requiresAuth: false,
    guestOnly: true,
    requiredRole: null,
    roles: ['guest'],
  },
  {
    path: AUTH_ROUTES.DASHBOARD,
    name: 'dashboard',
    title: 'Dashboard',
    pageModule: '../pages/dashboard.page.js',
    showInNav: true,
    navLabel: 'Dashboard',
    navIcon: 'bi-grid',
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT, USER_ROLES.ADMIN],
  },
  {
    path: '/predictions',
    name: 'predictions',
    title: 'Predictions',
    pageModule: '../pages/predictions.page.js',
    showInNav: false,
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    title: 'Leaderboard',
    pageModule: '../pages/leaderboard.page.js',
    showInNav: true,
    navLabel: 'Leaderboard',
    navIcon: 'bi-trophy',
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT, USER_ROLES.ADMIN],
  },
  {
    path: '/profile',
    name: 'profile',
    title: 'Profile',
    pageModule: '../users/profile.page.js',
    showInNav: true,
    navLabel: 'Profile',
    navIcon: 'bi-person',
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT, USER_ROLES.ADMIN],
  },
  {
    path: '/settings',
    name: 'settings',
    title: 'Settings',
    pageModule: '../pages/settings.page.js',
    showInNav: true,
    navLabel: 'Settings',
    navIcon: 'bi-gear',
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT, USER_ROLES.ADMIN],
  },
  {
    path: AUTH_ROUTES.COMPLETE_PROFILE,
    name: 'complete-profile',
    title: 'Complete Profile',
    pageModule: '../users/complete-profile.page.js',
    showInNav: false,
    requiresAuth: true,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTH_ROUTES.ADMIN,
    name: 'admin-dashboard',
    title: 'Admin',
    pageModule: '../pages/admin-dashboard.page.js',
    showInNav: true,
    navLabel: 'Admin',
    navIcon: 'bi-shield-lock',
    requiresAuth: true,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: AUTHORIZATION_ROUTES.ACCESS_DENIED,
    name: 'access-denied',
    title: 'Access Denied',
    pageModule: '../pages/access-denied.page.js',
    showInNav: false,
    requiresAuth: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTHORIZATION_ROUTES.NOT_FOUND,
    name: 'not-found',
    title: 'Not Found',
    pageModule: '../pages/not-found.page.js',
    showInNav: false,
    requiresAuth: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: '/error',
    name: 'error',
    title: 'Error',
    pageModule: '../pages/error.page.js',
    showInNav: false,
    requiresAuth: false,
    guestOnly: false,
    requiredRole: null,
  },
]);

/**
 * Finds a route definition by pathname.
 * @param {string} pathname
 * @returns {RouteDefinition|undefined}
 */
export function findRouteByPath(pathname) {
  const normalized = normalizePath(pathname);
  return ROUTES.find((route) => route.path === normalized);
}

/**
 * Normalizes a pathname for route matching.
 * @param {string} pathname
 * @returns {string}
 */
export function normalizePath(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  const trimmed = pathname.replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * Returns routes that require authentication.
 * @returns {RouteDefinition[]}
 */
export function getProtectedRoutes() {
  return ROUTES.filter((route) => route.requiresAuth);
}

/**
 * Returns routes visible in navigation for a given role.
 * @param {string|null} role
 * @param {boolean} authenticated
 * @returns {RouteDefinition[]}
 */
export function getNavRoutesForRole(role, authenticated) {
  return ROUTES.filter((route) => {
    if (!route.showInNav) {
      return false;
    }

    if (!authenticated) {
      return route.roles?.includes('guest') ?? false;
    }

    if (!route.roles?.length) {
      return true;
    }

    return role ? route.roles.includes(role) : false;
  });
}
