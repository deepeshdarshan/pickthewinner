/**
 * @fileoverview Permission service — maps roles to permissions. All permission logic lives here.
 * @module authorization/permission.service
 */

import { USER_ROLES } from '../users/user.constants.js';
import { Permissions } from './permission.constants.js';

/** @type {Readonly<Set<string>>} */
const ALL_PERMISSIONS = new Set(Object.values(Permissions));

/** @type {Readonly<Set<string>>} */
const CONTESTANT_PERMISSIONS = new Set([
  Permissions.VIEW_DASHBOARD,
  Permissions.VIEW_PROFILE,
  Permissions.EDIT_PROFILE,
  Permissions.VIEW_LEADERBOARD,
  Permissions.SUBMIT_PREDICTION,
  Permissions.EDIT_PREDICTION,
]);

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const ROLE_PERMISSION_MAP = Object.freeze({
  [USER_ROLES.ADMIN]: ALL_PERMISSIONS,
  [USER_ROLES.CONTESTANT]: CONTESTANT_PERMISSIONS,
});

/**
 * Returns the permission set for a role.
 * Unknown roles receive an empty set for safe defaults.
 * @param {string|null|undefined} role
 * @returns {ReadonlySet<string>}
 */
export function getPermissionsForRole(role) {
  if (!role) {
    return new Set();
  }

  return ROLE_PERMISSION_MAP[role] ?? new Set();
}

/**
 * Checks whether a role grants a specific permission.
 * @param {string|null|undefined} role
 * @param {string} permission
 * @returns {boolean}
 */
export function roleHasPermission(role, permission) {
  return getPermissionsForRole(role).has(permission);
}

/**
 * Returns all defined permission values.
 * @returns {string[]}
 */
export function getAllPermissions() {
  return [...ALL_PERMISSIONS];
}
