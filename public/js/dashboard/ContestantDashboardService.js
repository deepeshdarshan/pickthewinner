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
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { TournamentDomain } from '../domain/tournament.domain.js';
import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';

/**
 * @typedef {Object} ContestantActivityItem
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {string} timestampLabel
 */

/**
 * @typedef {Object} ContestantQuickStats
 * @property {number} tournamentsJoined
 * @property {number} predictionsSubmitted
 * @property {number} correctWinners
 * @property {number} exactScores
 * @property {number|null} accuracy
 * @property {number} currentPoints
 * @property {number|null} currentRank
 * @property {number} lifetimePoints
 */

/**
 * @typedef {Object} TournamentCardStats
 * @property {string} tournamentId
 * @property {number} totalMatches
 * @property {number} predictionsSubmitted
 * @property {number} completionPercentage
 * @property {number} pointsEarned
 * @property {number|null} currentRank
 */

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
 * @property {Array<import('../tournament/tournament.service.js').Tournament & { stats: TournamentCardStats }>} tournamentCards
 * @property {import('../match/match.service.js').EnrichedMatch|null} featuredMatch
 * @property {{ targetDate: string, label: string }|null} featuredMatchCountdown
 * @property {Record<string, unknown>|null} featuredMatchPrediction
 * @property {import('../match/match.service.js').EnrichedMatch[]} upcomingMatches
 * @property {Record<string, Record<string, unknown>|null>} upcomingPredictions
 * @property {{ total: number, submitted: number, pending: number }} predictionStats
 * @property {ContestantQuickStats} quickStats
 * @property {ContestantActivityItem[]} recentActivity
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

    const user = getCurrentUser();
    const profile = ApplicationContext.getProfile();
    const role = AuthorizationService.getCurrentRole() ?? USER_ROLES.CONTESTANT;
    const authUser = ApplicationContext.getCurrentUser() ?? user;
    const displayName = profile?.name
      || authUser?.displayName
      || authUser?.email?.split('@')[0]
      || 'Contestant';

    const visibleTournaments = await listTournamentsForContestant();
    const visibleTournamentIds = new Set(visibleTournaments.map((tournament) => tournament.id));
    let activeTournament = await getActiveTournament();

    if (activeTournament && !visibleTournamentIds.has(activeTournament.id)) {
      activeTournament = null;
    }

    const activeTournamentCount = visibleTournaments.length;

    await TournamentConfigurationService.load();
    const leaderboardVisible = TournamentConfigurationService.isLeaderboardVisible();

    const allMatches = (await listMatchesForContestant()).filter(
      (match) => visibleTournamentIds.has(match.tournamentId),
    );
    const now = new Date();
    const acceptingPredictionsTournamentIds = new Set(
      visibleTournaments
        .filter((tournament) => !TournamentDomain.isTournamentReadOnly(tournament.status))
        .map((tournament) => tournament.id),
    );
    const upcomingMatches = allMatches
      .filter((match) => {
        const kickoff = toDate(match.kickoffUtc);
        if (!kickoff || kickoff <= now) {
          return false;
        }

        if (!acceptingPredictionsTournamentIds.has(match.tournamentId)) {
          return false;
        }

        if (match.result?.published) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const aKickoff = toDate(a.kickoffUtc)?.getTime() ?? 0;
        const bKickoff = toDate(b.kickoffUtc)?.getTime() ?? 0;
        return aKickoff - bKickoff;
      })
      .slice(0, 5);

    const featuredMatch = upcomingMatches[0] ?? null;
    const upcomingPredictions = {};
    let featuredMatchPrediction = null;

    if (user) {
      await Promise.all(upcomingMatches.map(async (match) => {
        const prediction = await getPredictionForUser(match.id, user.uid);
        upcomingPredictions[match.id] = prediction;
      }));

      if (featuredMatch) {
        featuredMatchPrediction = upcomingPredictions[featuredMatch.id] ?? null;
      }
    }

    let predictionStats = { total: 0, submitted: 0, pending: 0 };

    if (user && activeTournament) {
      const summary = await getPredictionSummary(user.uid, activeTournament.id);
      const tournamentMatches = allMatches.filter((m) => m.tournamentId === activeTournament.id);
      predictionStats = {
        total: tournamentMatches.length,
        submitted: summary.submitted,
        pending: Math.max(tournamentMatches.length - summary.submitted, 0),
      };
    }

    const tournamentCards = user
      ? await Promise.all(visibleTournaments.map(async (tournament) => ({
        ...tournament,
        stats: await ContestantDashboardService.getTournamentStats(tournament.id, user.uid),
      })))
      : visibleTournaments.map((tournament) => ({
        ...tournament,
        stats: {
          tournamentId: tournament.id,
          totalMatches: 0,
          predictionsSubmitted: 0,
          predictionsPending: 0,
          completionPercentage: 0,
          pointsEarned: 0,
          currentRank: null,
        },
      }));

    const quickStats = buildQuickStats({
      tournamentsJoined: activeTournamentCount,
      predictionStats,
      allMatches,
      userId: user?.uid ?? null,
    });

    const recentActivity = buildRecentActivity(allMatches, user?.uid ?? null);
    const featuredMatchCountdown = featuredMatch
      ? await buildFeaturedMatchCountdown(featuredMatch)
      : null;

    return {
      displayName: escapeHtml(displayName),
      role,
      hasActiveTournaments: activeTournamentCount > 0,
      activeTournamentCount,
      welcomeMessage: `Welcome back, ${escapeHtml(displayName)}!`,
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
      tournamentCards,
      featuredMatch,
      featuredMatchCountdown,
      featuredMatchPrediction,
      upcomingMatches,
      upcomingPredictions,
      predictionStats,
      quickStats,
      recentActivity,
    };
  },

  /**
   * Gets tournament-specific statistics for a contestant.
   * @param {string} tournamentId
   * @param {string} userId
   * @returns {Promise<TournamentStats>}
   */
  async getTournamentStats(tournamentId, userId) {
    const allMatches = await listMatchesForContestant();
    const tournamentMatches = allMatches.filter((match) => match.tournamentId === tournamentId);
    const summary = await getPredictionSummary(userId, tournamentId);

    const totalMatches = tournamentMatches.length;
    const predictionsSubmitted = summary.submitted;
    const predictionsPending = Math.max(totalMatches - predictionsSubmitted, 0);
    const completionPercentage = totalMatches > 0 ? Math.round((predictionsSubmitted / totalMatches) * 100) : 0;

    return {
      tournamentId,
      totalMatches,
      predictionsSubmitted,
      predictionsPending,
      completionPercentage,
      pointsEarned: 0,
      currentRank: null,
    };
  },
};

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {Promise<{ targetDate: string, label: string }|null>}
 */
async function buildFeaturedMatchCountdown(match) {
  if (isPredictionWindowLocked(match)) {
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
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function isPredictionWindowLocked(match) {
  return match.predictionStatus === 'Locked' || match.status === MATCH_STATUS.PREDICTION_LOCKED;
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

/**
 * @param {{
 *   tournamentsJoined: number,
 *   predictionStats: { submitted: number },
 *   allMatches: import('../match/match.service.js').EnrichedMatch[],
 *   userId: string|null,
 * }} input
 * @returns {ContestantQuickStats}
 */
function buildQuickStats(input) {
  const completedMatches = input.allMatches.filter((match) => match.result?.published);

  return {
    tournamentsJoined: input.tournamentsJoined,
    predictionsSubmitted: input.predictionStats.submitted,
    correctWinners: 0,
    exactScores: 0,
    accuracy: completedMatches.length > 0 ? null : null,
    currentPoints: 0,
    currentRank: null,
    lifetimePoints: 0,
  };
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {string|null} userId
 * @returns {ContestantActivityItem[]}
 */
function buildRecentActivity(matches, userId) {
  if (!userId) {
    return [];
  }

  const published = matches
    .filter((match) => match.result?.published)
    .slice(0, 3)
    .map((match, index) => ({
      id: `result-${match.id}`,
      type: 'result',
      message: `Result published for ${match.homeTeam?.name ?? 'Home'} vs ${match.awayTeam?.name ?? 'Away'}.`,
      timestampLabel: 'Recently',
    }));

  if (published.length > 0) {
    return published;
  }

  return [{
    id: 'welcome-activity',
    type: 'info',
    message: 'Submit predictions for upcoming matches to see activity here.',
    timestampLabel: 'Now',
  }];
}
