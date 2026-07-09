/**
 * @fileoverview Admin dashboard aggregation service.
 * @module dashboard/AdminDashboardService
 */

import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { TOURNAMENT_ROUTES } from '../tournament/tournament.constants.js';
import { MATCH_ROUTES } from '../match/match.constants.js';
import { listTournamentsForAdmin, getActiveTournament } from '../tournament/tournament.service.js';
import { TOURNAMENT_STATUS_LABELS } from '../tournament/tournament.constants.js';
import { listMatchesForAdmin } from '../match/match.service.js';
import { filterLiveMatches, filterUpcomingMatches } from '../match/match-list.util.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';

/**
 * @typedef {Object} AdminActiveTournamentDto
 * @property {string} id
 * @property {string} name
 * @property {string} season
 * @property {string} logo
 * @property {string} banner
 * @property {string} status
 * @property {string} statusLabel
 * @property {{ totalMatches: number, upcomingMatches: number, liveMatches: number }} stats
 */

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
 * @property {string} matchesPath
 * @property {string} predictionsPath
 * @property {AdminActiveTournamentDto|null} activeTournament
 * @property {import('../match/match.service.js').EnrichedMatch|null} featuredMatch
 * @property {import('../match/match.service.js').EnrichedMatch|null} featuredLiveMatch
 * @property {{ targetDate: string, label: string }|null} featuredMatchCountdown
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
    /** @type {AdminActiveTournamentDto|null} */
    let activeTournament = null;
    /** @type {import('../match/match.service.js').EnrichedMatch|null} */
    let featuredMatch = null;
    /** @type {import('../match/match.service.js').EnrichedMatch|null} */
    let featuredLiveMatch = null;
    /** @type {{ targetDate: string, label: string }|null} */
    let featuredMatchCountdown = null;

    if (isAdmin) {
      const tournaments = await listTournamentsForAdmin();
      tournamentCount = tournaments.length;
      const active = await getActiveTournament();
      const allMatches = await listMatchesForAdmin();
      const now = new Date();

      const tournamentMatches = active
        ? allMatches.filter((match) => match.tournamentId === active.id)
        : [];

      const liveMatches = filterLiveMatches(tournamentMatches, now)
        .sort((a, b) => {
          const aKickoff = toDate(a.kickoffUtc)?.getTime() ?? 0;
          const bKickoff = toDate(b.kickoffUtc)?.getTime() ?? 0;
          return bKickoff - aKickoff;
        });

      const upcomingMatches = filterUpcomingMatches(tournamentMatches, now)
        .sort((a, b) => {
          const aKickoff = toDate(a.kickoffUtc)?.getTime() ?? 0;
          const bKickoff = toDate(b.kickoffUtc)?.getTime() ?? 0;
          return aKickoff - bKickoff;
        });

      featuredLiveMatch = liveMatches[0] ?? null;
      featuredMatch = upcomingMatches[0] ?? null;

      if (featuredMatch) {
        featuredMatchCountdown = await buildFeaturedMatchCountdown(featuredMatch);
      }

      if (active) {
        activeTournament = {
          id: active.id,
          name: active.name,
          season: active.season ?? '',
          logo: active.logo ?? '',
          banner: active.banner ?? '',
          status: active.status,
          statusLabel: TOURNAMENT_STATUS_LABELS[active.status] ?? active.status,
          stats: {
            totalMatches: tournamentMatches.length,
            upcomingMatches: upcomingMatches.length,
            liveMatches: liveMatches.length,
          },
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
      matchesPath: MATCH_ROUTES.ADMIN_LIST,
      predictionsPath: '/admin/predictions',
      activeTournament,
      featuredMatch,
      featuredLiveMatch,
      featuredMatchCountdown,
    };
  },
};

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {Promise<{ targetDate: string, label: string }|null>}
 */
async function buildFeaturedMatchCountdown(match) {
  if (match.predictionStatus === 'Locked' || match.status === MATCH_STATUS.PREDICTION_LOCKED) {
    return null;
  }

  const kickoff = toDate(match.kickoffUtc);
  if (!kickoff || !match.tournamentId) {
    return null;
  }

  try {
    await TournamentConfigurationService.load(match.tournamentId);
    const openHours = TournamentConfigurationService.getPredictionOpenHoursBeforeKickoff();
    const lockMinutes = TournamentConfigurationService.getPredictionLockMinutes();
    const { opensAt, locksAt } = MatchDomain.calculatePredictionWindow(kickoff, openHours, lockMinutes);

    if (match.status === MATCH_STATUS.PREDICTION_OPEN || match.predictionStatus === 'Open') {
      return { targetDate: locksAt.toISOString(), label: 'Closes in' };
    }

    return { targetDate: opensAt.toISOString(), label: 'Prediction opens in' };
  } catch {
    return null;
  }
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
