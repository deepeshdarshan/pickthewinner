/**
 * @fileoverview Admin dashboard aggregation service.
 * @module dashboard/AdminDashboardService
 */

import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { TOURNAMENT_ROUTES } from '../tournament/tournament.constants.js';
import { listTournamentsForAdmin, getActiveTournament } from '../tournament/tournament.service.js';
import { TOURNAMENT_STATUS_LABELS } from '../tournament/tournament.constants.js';

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
 * @property {string} tournamentsPath
 * @property {{ name: string, season: string, status: string, statusLabel: string }|null} activeTournament
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

    let tournamentCount = 0;
    let activeTournament = null;

    if (isAdmin) {
      const tournaments = await listTournamentsForAdmin();
      tournamentCount = tournaments.length;
      const active = await getActiveTournament();

      if (active) {
        activeTournament = {
          name: active.name,
          season: active.season,
          status: active.status,
          statusLabel: TOURNAMENT_STATUS_LABELS[active.status] ?? active.status,
        };
      }
    }

    const welcomeMessage = tournamentCount > 0
      ? (activeTournament
        ? `Active tournament: ${activeTournament.name} (${activeTournament.season}).`
        : `You have ${tournamentCount} tournament${tournamentCount === 1 ? '' : 's'} configured.`)
      : 'There are currently no tournaments.';

    return {
      role: role ?? USER_ROLES.ADMIN,
      isAdmin,
      tournamentCount,
      welcomeTitle: 'Welcome Administrator',
      welcomeMessage,
      emptyStateTitle: tournamentCount > 0 ? 'Manage Tournaments' : 'No Tournaments Yet',
      emptyStateMessage: tournamentCount > 0
        ? 'Use the tournaments console to configure, publish, and manage tournaments.'
        : 'Create your first tournament to get started.',
      adminConsolePath: '/admin',
      tournamentsPath: TOURNAMENT_ROUTES.ADMIN_LIST,
      activeTournament,
    };
  },
};
