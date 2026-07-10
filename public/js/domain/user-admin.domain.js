/**
 * @fileoverview User admin domain — business rules for user management operations.
 * @module domain/user-admin.domain
 */

import { USER_ROLES, USER_STATUS } from '../users/user.constants.js';
import { formatDateTime, getCalendarDayDifference, toDate } from '../utils/date.util.js';

/**
 * @typedef {import('../users/user.service.js').UserProfile} UserProfile
 */

export const UserAdminDomain = {
  /**
   * Validates whether an admin can lock a target user.
   * @param {UserProfile|null|undefined} targetProfile
   * @param {UserProfile|null|undefined} adminProfile
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canLockUser(targetProfile, adminProfile) {
    if (!targetProfile || !adminProfile) {
      return { allowed: false, reason: 'Invalid user profiles.' };
    }

    if (targetProfile.uid === adminProfile.uid) {
      return { allowed: false, reason: 'You cannot lock your own account.' };
    }

    if (targetProfile.role === USER_ROLES.ADMIN) {
      return { allowed: false, reason: 'You cannot lock another administrator account.' };
    }

    if (targetProfile.status === USER_STATUS.LOCKED) {
      return { allowed: false, reason: 'User is already locked.' };
    }

    return { allowed: true };
  },

  /**
   * Validates whether an admin can unlock a target user.
   * @param {UserProfile|null|undefined} targetProfile
   * @param {UserProfile|null|undefined} adminProfile
   * @returns {{ allowed: boolean, reason?: string }}
   */
  canUnlockUser(targetProfile, adminProfile) {
    if (!targetProfile || !adminProfile) {
      return { allowed: false, reason: 'Invalid user profiles.' };
    }

    if (targetProfile.status !== USER_STATUS.LOCKED) {
      return { allowed: false, reason: 'User is not locked.' };
    }

    return { allowed: true };
  },

  /**
   * Validates the lock reason text.
   * @param {string} [reason]
   * @returns {{ valid: boolean, error?: string }}
   */
  validateLockReason(reason) {
    if (!reason || !reason.trim()) {
      return { valid: true }; // Reason is optional
    }

    if (reason.length > 500) {
      return { valid: false, error: 'Lock reason must be 500 characters or less.' };
    }

    return { valid: true };
  },

  /**
   * Formats user status for display.
   * @param {string} status
   * @returns {string}
   */
  formatUserStatus(status) {
    const labels = {
      [USER_STATUS.ACTIVE]: 'Active',
      [USER_STATUS.LOCKED]: 'Locked',
      [USER_STATUS.INACTIVE]: 'Inactive',
      [USER_STATUS.SUSPENDED]: 'Suspended',
    };

    return labels[status] ?? 'Unknown';
  },

  /**
   * Formats user role for display.
   * @param {string} role
   * @returns {string}
   */
  formatUserRole(role) {
    const labels = {
      [USER_ROLES.ADMIN]: 'Administrator',
      [USER_ROLES.CONTESTANT]: 'Contestant',
    };

    return labels[role] ?? 'Unknown';
  },

  /**
   * Returns a human-readable label for user activity.
   * @param {import('firebase/firestore').Timestamp|Date|null} [lastLogin]
   * @returns {string}
   */
  getUserActivityLabel(lastLogin) {
    const date = toDate(lastLogin);

    if (!date) {
      return 'Never';
    }

    const diffDays = getCalendarDayDifference(date);

    if (diffDays === 0) {
      return 'Today';
    }

    if (diffDays === 1) {
      return 'Yesterday';
    }

    if (diffDays < 7) {
      return `${diffDays} days ago`;
    }

    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }

    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }

    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  },

  /**
   * Formats last login for admin tables with an absolute timestamp and relative label.
   * @param {import('firebase/firestore').Timestamp|Date|null|undefined} lastLogin
   * @returns {{ primary: string, secondary: string }}
   */
  formatLastLoginDisplay(lastLogin) {
    const date = toDate(lastLogin);

    if (!date) {
      return { primary: 'Never', secondary: '' };
    }

    return {
      primary: formatDateTime(date),
      secondary: UserAdminDomain.getUserActivityLabel(lastLogin),
    };
  },

  /**
   * Returns the CSS class for a status badge.
   * @param {string} status
   * @returns {string}
   */
  getStatusBadgeClass(status) {
    const classes = {
      [USER_STATUS.ACTIVE]: 'bg-success',
      [USER_STATUS.LOCKED]: 'bg-danger',
      [USER_STATUS.INACTIVE]: 'bg-secondary',
      [USER_STATUS.SUSPENDED]: 'bg-warning',
    };

    return classes[status] ?? 'bg-secondary';
  },

  /**
   * Returns the CSS class for a role badge.
   * @param {string} role
   * @returns {string}
   */
  getRoleBadgeClass(role) {
    const classes = {
      [USER_ROLES.ADMIN]: 'bg-primary',
      [USER_ROLES.CONTESTANT]: 'bg-info',
    };

    return classes[role] ?? 'bg-secondary';
  },
};

