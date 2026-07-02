/**
 * @fileoverview Contestant dashboard aggregation service.
 * @module dashboard/ContestantDashboardService
 */

import { ApplicationContext } from '../app/application-context.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { escapeHtml } from '../utils/html.util.js';
import { getActiveTournament, listTournamentsForContestant } from '../tournament/tournament.service.js';
import { LEADERBOARD_MESSAGES, TOURNAMENT_ROUTES } from '../tournament/tournament.constants.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { getPredictionSummary } from '../prediction/prediction-submission.service.js';
import { getCurrentUser } from '../auth/auth.service.js';

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
 * @property {boolean} leaderboardVisible
 * @property {string} leaderboardPath
 * @property {string} leaderboardPendingMessage
 * @property {{ name: string, season: string, id: string }|null} activeTournament
 * @property {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @property {import('../match/match.service.js').EnrichedMatch[]} upcomingMatches
 * @property {{ total: number, submitted: number, pending: number }} predictionStats
 */

/**
 * @typedef {Object} TournamentStats
 * @property {string} tournamentId
 * @property {number} totalMatches
 * @property {number} predictionsSubmitted
 * @property {number} predictionsPending
 * @property {number} completionPercentage
 * @property {number} pointsEarned
 * @property {number|null} currentRank
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

    await TournamentConfigurationService.load();
    const leaderboardVisible = TournamentConfigurationService.isLeaderboardVisible();

    // Get upcoming matches
    const allMatches = await listMatchesForContestant();
    const now = new Date();
    const upcomingMatches = allMatches
      .filter((match) => {
        const kickoff = match.kickoffUtc instanceof Date ? match.kickoffUtc : match.kickoffUtc?.toDate?.() ?? null;
        return kickoff && kickoff > now;
      })
      .sort((a, b) => {
        const aKickoff = a.kickoffUtc instanceof Date ? a.kickoffUtc : a.kickoffUtc?.toDate?.() ?? new Date(0);
        const bKickoff = b.kickoffUtc instanceof Date ? b.kickoffUtc : b.kickoffUtc?.toDate?.() ?? new Date(0);
        return aKickoff.getTime() - bKickoff.getTime();
      })
      .slice(0, 5);

    // Get prediction stats
    const user = getCurrentUser();
    let predictionStats = { total: 0, submitted: 0, pending: 0 };

    if (user && activeTournament) {
      const summary = await getPredictionSummary(user.uid, activeTournament.id);
      const tournamentMatches = allMatches.filter((m) => m.tournamentId === activeTournament.id);
      predictionStats = {
        total: tournamentMatches.length,
        submitted: summary.submitted,
        pending: tournamentMatches.length - summary.submitted,
      };
    }

    return {
      displayName: escapeHtml(displayName),
      role,
      hasActiveTournaments: activeTournamentCount > 0,
      activeTournamentCount,
      welcomeMessage: `Welcome ${escapeHtml(displayName)}!`,
      emptyStateTitle: 'No Active Tournaments',
      emptyStateMessage: 'Once a tournament is published, you can begin submitting predictions.',
      tournamentsPath: TOURNAMENT_ROUTES.CONTESTANT_LIST,
      leaderboardVisible,
      leaderboardPath: '/leaderboard',
      leaderboardPendingMessage: LEADERBOARD_MESSAGES.DASHBOARD_PENDING,
      activeTournament: activeTournament
        ? { name: activeTournament.name, season: activeTournament.season, id: activeTournament.id }
        : null,
      tournaments: visibleTournaments,
      upcomingMatches,
      predictionStats,
    };
  },

  /**
   * Gets tournament-specific statistics for a contestant.
   * @param {string} tournamentId
   * @param {string} userId
   * @returns {Promise<TournamentStats>}
   */
  async getTournamentStats(tournamentId, userId) {
    const allMatches = await listMatchesForContestant({ tournamentId });
    const summary = await getPredictionSummary(userId, tournamentId);

    const totalMatches = allMatches.length;
    const predictionsSubmitted = summary.submitted;
    const predictionsPending = totalMatches - predictionsSubmitted;
    const completionPercentage = totalMatches > 0 ? Math.round((predictionsSubmitted / totalMatches) * 100) : 0;

    return {
      tournamentId,
      totalMatches,
      predictionsSubmitted,
      predictionsPending,
      completionPercentage,
      pointsEarned: 0, // TODO: Calculate from scoring results
      currentRank: null, // TODO: Fetch from leaderboard
    };
  },
};
