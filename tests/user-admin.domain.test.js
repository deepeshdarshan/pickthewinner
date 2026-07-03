/**
 * @fileoverview Tests for user admin domain business rules.
 */

import { describe, it, expect } from '@jest/globals';
import { UserAdminDomain } from '../public/js/domain/user-admin.domain.js';
import { USER_ROLES, USER_STATUS } from '../public/js/users/user.constants.js';

describe('UserAdminDomain', () => {
  describe('canLockUser', () => {
    it('should allow admin to lock a contestant', () => {
      const admin = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const contestant = {
        uid: 'user-1',
        role: USER_ROLES.CONTESTANT,
        status: USER_STATUS.ACTIVE,
      };

      const result = UserAdminDomain.canLockUser(contestant, admin);
      expect(result.allowed).toBe(true);
    });

    it('should prevent admin from locking themselves', () => {
      const admin = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const result = UserAdminDomain.canLockUser(admin, admin);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot lock your own account');
    });

    it('should prevent admin from locking another admin', () => {
      const admin1 = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const admin2 = {
        uid: 'admin-2',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const result = UserAdminDomain.canLockUser(admin2, admin1);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('cannot lock another administrator');
    });

    it('should prevent locking an already locked user', () => {
      const admin = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const lockedUser = {
        uid: 'user-1',
        role: USER_ROLES.CONTESTANT,
        status: USER_STATUS.LOCKED,
      };

      const result = UserAdminDomain.canLockUser(lockedUser, admin);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('already locked');
    });
  });

  describe('canUnlockUser', () => {
    it('should allow admin to unlock a locked user', () => {
      const admin = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const lockedUser = {
        uid: 'user-1',
        role: USER_ROLES.CONTESTANT,
        status: USER_STATUS.LOCKED,
      };

      const result = UserAdminDomain.canUnlockUser(lockedUser, admin);
      expect(result.allowed).toBe(true);
    });

    it('should prevent unlocking a user that is not locked', () => {
      const admin = {
        uid: 'admin-1',
        role: USER_ROLES.ADMIN,
        status: USER_STATUS.ACTIVE,
      };

      const activeUser = {
        uid: 'user-1',
        role: USER_ROLES.CONTESTANT,
        status: USER_STATUS.ACTIVE,
      };

      const result = UserAdminDomain.canUnlockUser(activeUser, admin);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('not locked');
    });
  });

  describe('validateLockReason', () => {
    it('should allow empty reason', () => {
      const result = UserAdminDomain.validateLockReason('');
      expect(result.valid).toBe(true);
    });

    it('should allow valid reason', () => {
      const result = UserAdminDomain.validateLockReason('Violated terms of service');
      expect(result.valid).toBe(true);
    });

    it('should reject reason longer than 500 characters', () => {
      const longReason = 'A'.repeat(501);
      const result = UserAdminDomain.validateLockReason(longReason);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('500 characters');
    });
  });

  describe('formatUserStatus', () => {
    it('should format ACTIVE status', () => {
      expect(UserAdminDomain.formatUserStatus(USER_STATUS.ACTIVE)).toBe('Active');
    });

    it('should format LOCKED status', () => {
      expect(UserAdminDomain.formatUserStatus(USER_STATUS.LOCKED)).toBe('Locked');
    });

    it('should handle unknown status', () => {
      expect(UserAdminDomain.formatUserStatus('UNKNOWN')).toBe('Unknown');
    });
  });

  describe('getUserActivityLabel', () => {
    it('should return "Never" for null lastLogin', () => {
      expect(UserAdminDomain.getUserActivityLabel(null)).toBe('Never');
    });

    it('should return "Today" for today\'s login', () => {
      const today = new Date();
      expect(UserAdminDomain.getUserActivityLabel(today)).toBe('Today');
    });

    it('should return "Yesterday" for yesterday\'s login', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(UserAdminDomain.getUserActivityLabel(yesterday)).toBe('Yesterday');
    });

    it('should return days ago for recent logins', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(UserAdminDomain.getUserActivityLabel(threeDaysAgo)).toBe('3 days ago');
    });
  });

  describe('getStatusBadgeClass', () => {
    it('should return correct class for ACTIVE', () => {
      expect(UserAdminDomain.getStatusBadgeClass(USER_STATUS.ACTIVE)).toBe('bg-success');
    });

    it('should return correct class for LOCKED', () => {
      expect(UserAdminDomain.getStatusBadgeClass(USER_STATUS.LOCKED)).toBe('bg-danger');
    });
  });

  describe('getRoleBadgeClass', () => {
    it('should return correct class for ADMIN', () => {
      expect(UserAdminDomain.getRoleBadgeClass(USER_ROLES.ADMIN)).toBe('bg-primary');
    });

    it('should return correct class for CONTESTANT', () => {
      expect(UserAdminDomain.getRoleBadgeClass(USER_ROLES.CONTESTANT)).toBe('bg-info');
    });
  });
});

