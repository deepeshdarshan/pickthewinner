/**
 * @fileoverview Admin dashboard aggregation service.
 * @module dashboard/AdminDashboardService
 */

import { ApplicationContext } from '../app/application-context.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';

/**
 * @typedef {Object} AdminDashboardDto
 * @property {string} role
 * @property {boolean} isAdmin
 * @property {number} tournamentCount
 * @property {string} welcomeTitle
 * @property {string} welcomeMessage
 * @property {string} emptyStateTitle
 * @property {string} emptyStateMessage
 * @property {string} adminConsolePath
 */

export const AdminDashboardService = {
  /**
   * Aggregates all data required by the admin dashboard page.
   * @returns {Promise<AdminDashboardDto>}
   */
  async getDashboardData() {
    await AuthorizationService.resolve();

    const role = AuthorizationService.getCurrentRole();
    const isAdmin = role === USER_ROLES.ADMIN;
    const tournamentCount = 0;

    return {
      role: role ?? USER_ROLES.ADMIN,
      isAdmin,
      tournamentCount,
      welcomeTitle: 'Welcome Administrator',
      welcomeMessage: 'There are currently no tournaments.',
      emptyStateTitle: tournamentCount > 0 ? 'Manage Tournaments' : 'No Tournaments Yet',
      emptyStateMessage: tournamentCount > 0
        ? 'Use the admin console to manage tournaments and matches.'
        : 'Create your first tournament to get started.',
      adminConsolePath: AUTH_ROUTES.ADMIN,
    };
  },
};
