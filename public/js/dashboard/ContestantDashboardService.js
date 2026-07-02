/**
 * @fileoverview Contestant dashboard aggregation service.
 * @module dashboard/ContestantDashboardService
 */

import { ApplicationContext } from '../app/application-context.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { escapeHtml } from '../utils/html.util.js';
import { getActiveTournament, listTournamentsForContestant } from '../tournament/tournament.service.js';
import { TOURNAMENT_ROUTES } from '../tournament/tournament.constants.js';

/**
 * @typedef {Object} ContestantDashboardDto
 * @property {string} displayName
 * @property {string} role
 * @property {boolean} hasActiveTournaments
 * @property {number} activeTournamentCount
 * @property {string} welcomeMessage
 * @property {string} emptyStateTitle
 * @property {string} emptyStateMessage
 * @property {string} tournamentsPath
 * @property {{ name: string, season: string }|null} activeTournament
 */

export const ContestantDashboardService = {
  /**
   * Aggregates all data required by the contestant dashboard page.
   * @returns {Promise<ContestantDashboardDto>}
   */
  async getDashboardData() {
    await AuthorizationService.resolve();

    const profile = ApplicationContext.getProfile();
    const role = AuthorizationService.getCurrentRole() ?? USER_ROLES.CONTESTANT;
    const displayName = profile?.name
      || ApplicationContext.getCurrentUser()?.displayName
      || 'User';

    const visibleTournaments = await listTournamentsForContestant();
    const activeTournament = await getActiveTournament();
    const activeTournamentCount = visibleTournaments.length;

    return {
      displayName: escapeHtml(displayName),
      role,
      hasActiveTournaments: activeTournamentCount > 0,
      activeTournamentCount,
      welcomeMessage: `Welcome ${escapeHtml(displayName)}!`,
      emptyStateTitle: 'No Active Tournaments',
      emptyStateMessage: 'Once a tournament is published, you can begin submitting predictions.',
      tournamentsPath: TOURNAMENT_ROUTES.CONTESTANT_LIST,
      activeTournament: activeTournament
        ? { name: activeTournament.name, season: activeTournament.season }
        : null,
    };
  },
};
