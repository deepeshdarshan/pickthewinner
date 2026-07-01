/**
 * @fileoverview Permission constants — roles, permissions, routes, and messages.
 * @module authorization/permission.constants
 */

import { USER_ROLES } from '../users/user.constants.js';

/** @enum {string} */
export const Roles = USER_ROLES;

/** @enum {string} */
export const Permissions = Object.freeze({
  VIEW_DASHBOARD: 'VIEW_DASHBOARD',
  VIEW_PROFILE: 'VIEW_PROFILE',
  EDIT_PROFILE: 'EDIT_PROFILE',
  VIEW_LEADERBOARD: 'VIEW_LEADERBOARD',
  CREATE_TOURNAMENT: 'CREATE_TOURNAMENT',
  UPDATE_TOURNAMENT: 'UPDATE_TOURNAMENT',
  DELETE_TOURNAMENT: 'DELETE_TOURNAMENT',
  CREATE_MATCH: 'CREATE_MATCH',
  UPDATE_MATCH: 'UPDATE_MATCH',
  DELETE_MATCH: 'DELETE_MATCH',
  SUBMIT_PREDICTION: 'SUBMIT_PREDICTION',
  EDIT_PREDICTION: 'EDIT_PREDICTION',
  VIEW_ALL_PREDICTIONS: 'VIEW_ALL_PREDICTIONS',
  MANAGE_CONTESTANTS: 'MANAGE_CONTESTANTS',
  PUBLISH_RESULTS: 'PUBLISH_RESULTS',
  CONFIGURE_SETTINGS: 'CONFIGURE_SETTINGS',
});

/** @enum {string} */
export const AUTHORIZATION_ROUTES = Object.freeze({
  ACCESS_DENIED: '/403',
  NOT_FOUND: '/404',
});

/** @type {Readonly<Record<string, string>>} */
export const AUTHORIZATION_MESSAGES = Object.freeze({
  ACCESS_DENIED: "You don't have permission to view this page.",
  ACCESS_DENIED_TITLE: 'Access Denied',
  NOT_FOUND: 'The page you are looking for does not exist.',
  NOT_FOUND_TITLE: 'Page Not Found',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  RESOLVING_PERMISSIONS: 'Checking permissions…',
  RETURN_HOME: 'Go to Home',
  RETURN_DASHBOARD: 'Go to Dashboard',
  RETURN_ADMIN: 'Go to Admin',
  SIGN_IN: 'Sign In',
});
