/**
 * @fileoverview Client-side route definitions for the SPA router.
 * @module config/routes
 */

import { USER_ROLES } from '../users/user.constants.js';
import { AUTHORIZATION_ROUTES } from '../authorization/permission.constants.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';

/** @enum {string} */
export const CONTESTANT_ROUTES = Object.freeze({
  PREDICTIONS: '/predictions',
  SCORE: '/score',
});

/**
 * @typedef {Object} RouteDefinition
 * @property {string} path - URL path (History API).
 * @property {string} name - Route identifier used by the router.
 * @property {string} title - Document title suffix.
 * @property {string} pageModule - Dynamic import path for the page module.
 * @property {boolean} [showInNavbar] - Whether the route appears in desktop navigation.
 * @property {boolean} [showInNav] - @deprecated Use showInNavbar.
 * @property {boolean} [showInMobileNav] - Whether the route appears in mobile bottom navigation.
 * @property {string} [navLabel] - Display label in navigation.
 * @property {string} [icon] - Bootstrap Icons class name.
 * @property {string} [navIcon] - @deprecated Use icon.
 * @property {boolean} [requiresAuth] - Requires authentication.
 * @property {boolean} [requiresProfile] - Requires a completed Firestore profile.
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
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: false,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTH_ROUTES.LOGIN,
    name: 'login',
    title: 'Sign In',
    pageModule: '../pages/login.page.js',
    showInNavbar: true,
    showInMobileNav: false,
    navLabel: 'Sign In',
    icon: 'bi-box-arrow-in-right',
    requiresAuth: false,
    requiresProfile: false,
    guestOnly: true,
    requiredRole: null,
    roles: ['guest'],
  },
  {
    path: AUTH_ROUTES.DASHBOARD,
    name: 'dashboard',
    title: 'Dashboard',
    pageModule: '../pages/dashboard.page.js',
    showInNavbar: true,
    showInMobileNav: true,
    navLabel: 'Dashboard',
    icon: 'bi-grid',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: CONTESTANT_ROUTES.PREDICTIONS,
    name: 'predictions',
    title: 'Predictions',
    pageModule: '../pages/predictions.page.js',
    showInNavbar: true,
    showInMobileNav: true,
    navLabel: 'Predictions',
    icon: 'bi-bullseye',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.CONTESTANT,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: CONTESTANT_ROUTES.SCORE,
    name: 'score',
    title: 'Score',
    pageModule: '../pages/score.page.js',
    showInNavbar: true,
    showInMobileNav: true,
    navLabel: 'Score',
    icon: 'bi-bar-chart',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.CONTESTANT,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: '/leaderboard',
    name: 'leaderboard',
    title: 'Leaderboard',
    pageModule: '../pages/leaderboard.page.js',
    showInNavbar: true,
    showInMobileNav: true,
    navLabel: 'Leaderboard',
    icon: 'bi-trophy',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.ADMIN, USER_ROLES.CONTESTANT],
  },
  {
    path: '/leaderboard/unavailable',
    name: 'leaderboard-unavailable',
    title: 'Leaderboard',
    pageModule: '../pages/leaderboard-unavailable.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.CONTESTANT,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: '/profile',
    name: 'profile',
    title: 'Profile',
    pageModule: '../users/profile.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    navLabel: 'Profile',
    icon: 'bi-person',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: null,
    roles: [USER_ROLES.CONTESTANT, USER_ROLES.ADMIN],
  },
  {
    path: '/settings',
    name: 'settings',
    title: 'Settings',
    pageModule: '../pages/settings.page.js',
    showInNavbar: true,
    showInMobileNav: false,
    navLabel: 'Settings',
    icon: 'bi-gear',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: AUTH_ROUTES.COMPLETE_PROFILE,
    name: 'complete-profile',
    title: 'Complete Profile',
    pageModule: '../users/complete-profile.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTH_ROUTES.ADMIN,
    name: 'admin-dashboard',
    title: 'Admin',
    pageModule: '../pages/admin-dashboard.page.js',
    showInNavbar: true,
    showInMobileNav: false,
    navLabel: 'Admin',
    icon: 'bi-shield-lock',
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/admin/tournaments',
    name: 'admin-tournaments',
    title: 'Tournaments',
    pageModule: '../tournament/tournament-admin.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/admin/teams',
    name: 'admin-teams',
    title: 'Teams',
    pageModule: '../master-data/teams/teams-admin.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/admin/matches',
    name: 'admin-matches',
    title: 'Matches',
    pageModule: '../match/match-admin.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/admin/results',
    name: 'admin-results',
    title: 'Results',
    pageModule: '../pages/admin-section.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    title: 'Users',
    pageModule: '../pages/admin-section.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: true,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: USER_ROLES.ADMIN,
    roles: [USER_ROLES.ADMIN],
  },
  {
    path: '/tournaments',
    name: 'tournaments',
    title: 'Tournaments',
    pageModule: '../tournament/tournaments.page.js',
    showInNavbar: true,
    showInMobileNav: false,
    navLabel: 'Tournaments',
    icon: 'bi-calendar-event',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.CONTESTANT,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: '/matches',
    name: 'matches',
    title: 'Matches',
    pageModule: '../match/matches.page.js',
    showInNavbar: true,
    showInMobileNav: true,
    navLabel: 'Matches',
    icon: 'bi-flag',
    requiresAuth: true,
    requiresProfile: true,
    guestOnly: false,
    requiredRole: USER_ROLES.CONTESTANT,
    roles: [USER_ROLES.CONTESTANT],
  },
  {
    path: AUTHORIZATION_ROUTES.ACCESS_DENIED,
    name: 'access-denied',
    title: 'Access Denied',
    pageModule: '../pages/access-denied.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: false,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: AUTHORIZATION_ROUTES.NOT_FOUND,
    name: 'not-found',
    title: 'Not Found',
    pageModule: '../pages/not-found.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: false,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: null,
  },
  {
    path: '/error',
    name: 'error',
    title: 'Error',
    pageModule: '../pages/error.page.js',
    showInNavbar: false,
    showInMobileNav: false,
    requiresAuth: false,
    requiresProfile: false,
    guestOnly: false,
    requiredRole: null,
  },
]);

/**
 * Normalizes legacy route metadata for backwards compatibility.
 * @param {RouteDefinition} route
 * @returns {RouteDefinition}
 */
export function normalizeRouteMetadata(route) {
  return {
    ...route,
    showInNavbar: route.showInNavbar ?? route.showInNav ?? false,
    icon: route.icon ?? route.navIcon ?? 'bi-circle',
  };
}

/**
 * Finds a route definition by pathname.
 * @param {string} pathname
 * @returns {RouteDefinition|undefined}
 */
export function findRouteByPath(pathname) {
  const normalized = normalizePath(pathname);
  const route = ROUTES.find((item) => item.path === normalized);
  return route ? normalizeRouteMetadata(route) : undefined;
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
  return ROUTES.filter((route) => route.requiresAuth).map(normalizeRouteMetadata);
}
