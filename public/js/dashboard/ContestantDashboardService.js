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
import { PlatformSettingsService } from '../settings/settings.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { filterLiveMatches, filterUpcomingMatches } from '../match/match-list.util.js';
import { getPredictionSummary } from '../prediction/prediction-submission.service.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { TournamentDomain } from '../domain/tournament.domain.js';
import { LeaderboardDomain } from '../domain/leaderboard.domain.js';
import { leaderboardService } from '../leaderboard/leaderboard.service.js';
import { buildRecentActivity } from './contestant-dashboard-activity.util.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {Object} ContestantActivityItem
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {string} timestampLabel
 */

/**
 * @typedef {Object} MyRankSummary
 * @property {boolean} isAvailable
 * @property {number|null} rank
 * @property {number} totalContestants
 * @property {number|null} betterThanPercent
 * @property {string|null} topPercentLabel
 * @property {number} points
 * @property {number} accuracy
 * @property {number} predictionsSubmitted
 * @property {number} predictionsTotal
 * @property {boolean} hasLeaderboardEntry
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
 * @property {ActiveTournamentHeroDto|null} activeTournament
 * @property {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @property {Array<import('../tournament/tournament.service.js').Tournament & { stats: TournamentCardStats }>} tournamentCards
 * @property {import('../match/match.service.js').EnrichedMatch|null} featuredMatch
 * @property {import('../match/match-countdown.service.js').MatchCountdownDto|null} featuredMatchCountdown
 * @property {Record<string, unknown>|null} featuredMatchPrediction
 * @property {import('../match/match.service.js').EnrichedMatch|null} featuredLiveMatch
 * @property {Record<string, unknown>|null} featuredLiveMatchPrediction
 * @property {import('../match/match.service.js').EnrichedMatch[]} liveMatches
 * @property {import('../match/match.service.js').EnrichedMatch[]} upcomingMatches
 * @property {Record<string, Record<string, unknown>|null>} upcomingPredictions
 * @property {{ total: number, submitted: number, pending: number }} predictionStats
 * @property {MyRankSummary|null} myRank
 * @property {ContestantActivityItem[]} recentActivity
 */

/**
 * @typedef {Object} ActiveTournamentHeroDto
 * @property {string} id
 * @property {string} name
 * @property {string} [season]
 * @property {string} [logo]
 * @property {string} [banner]
 * @property {string} status
 * @property {{ totalMatches: number, predictionsSubmitted: number }} stats
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

    await PlatformSettingsService.load();
    const leaderboardVisible = PlatformSettingsService.isLeaderboardVisible();

    const allMatches = (await listMatchesForContestant()).filter(
      (match) => visibleTournamentIds.has(match.tournamentId),
    );
    const now = new Date();
    const acceptingPredictionsTournamentIds = new Set(
      visibleTournaments
        .filter((tournament) => !TournamentDomain.isTournamentReadOnly(tournament.status))
        .map((tournament) => tournament.id),
    );
    const upcomingMatches = filterUpcomingMatches(allMatches, now)
      .filter((match) => acceptingPredictionsTournamentIds.has(match.tournamentId))
      .sort((a, b) => {
        const aKickoff = toDate(a.kickoffUtc)?.getTime() ?? 0;
        const bKickoff = toDate(b.kickoffUtc)?.getTime() ?? 0;
        return aKickoff - bKickoff;
      })
      .slice(0, 5);

    const liveMatches = filterLiveMatches(allMatches, now)
      .sort((a, b) => {
        const aKickoff = toDate(a.kickoffUtc)?.getTime() ?? 0;
        const bKickoff = toDate(b.kickoffUtc)?.getTime() ?? 0;
        return bKickoff - aKickoff;
      })
      .slice(0, 3);

    const featuredMatch = upcomingMatches[0] ?? null;
    const featuredLiveMatch = liveMatches[0] ?? null;
    const upcomingPredictions = {};
    let featuredMatchPrediction = null;
    let featuredLiveMatchPrediction = null;

    if (user) {
      const predictionMatchIds = new Set([
        ...upcomingMatches.map((match) => match.id),
        ...liveMatches.map((match) => match.id),
      ]);

      await Promise.all([...predictionMatchIds].map(async (matchId) => {
        const prediction = await getPredictionForUser(matchId, user.uid);
        if (upcomingMatches.some((match) => match.id === matchId)) {
          upcomingPredictions[matchId] = prediction;
        }
        if (liveMatches.some((match) => match.id === matchId)) {
          if (featuredLiveMatch?.id === matchId) {
            featuredLiveMatchPrediction = prediction;
          }
        }
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

    const myRank = await buildMyRankSummary({
      activeTournament,
      userId: user?.uid ?? null,
      leaderboardVisible,
      predictionStats,
    });

    const recentActivity = buildRecentActivity(allMatches, user?.uid ?? null);
    const featuredMatchCountdown = featuredMatch?.matchCountdown ?? null;

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
      activeTournament: buildActiveTournamentHeroDto(activeTournament, tournamentCards),
      tournaments: visibleTournaments,
      tournamentCards,
      featuredMatch,
      featuredMatchCountdown,
      featuredMatchPrediction,
      featuredLiveMatch,
      featuredLiveMatchPrediction,
      liveMatches,
      upcomingMatches,
      upcomingPredictions,
      predictionStats,
      myRank,
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
 * @param {import('../tournament/tournament.service.js').Tournament|null} activeTournament
 * @param {Array<import('../tournament/tournament.service.js').Tournament & { stats: TournamentCardStats }>} tournamentCards
 * @returns {ActiveTournamentHeroDto|null}
 */
function buildActiveTournamentHeroDto(activeTournament, tournamentCards) {
  const card = activeTournament
    ? tournamentCards.find((tournament) => tournament.id === activeTournament.id)
    : tournamentCards[0];

  if (!card) {
    if (!activeTournament) {
      return null;
    }

    return {
      id: activeTournament.id,
      name: activeTournament.name,
      season: activeTournament.season ?? '',
      logo: activeTournament.logo ?? '',
      banner: activeTournament.banner ?? '',
      status: activeTournament.status ?? 'published',
      stats: { totalMatches: 0, predictionsSubmitted: 0 },
    };
  }

  return {
    id: card.id,
    name: card.name,
    season: card.season ?? '',
    logo: card.logo ?? '',
    banner: card.banner ?? '',
    status: card.status ?? 'published',
    stats: {
      totalMatches: card.stats.totalMatches,
      predictionsSubmitted: card.stats.predictionsSubmitted,
    },
  };
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
 *   activeTournament: import('../tournament/tournament.service.js').Tournament|null,
 *   userId: string|null,
 *   leaderboardVisible: boolean,
 *   predictionStats: { total: number, submitted: number, pending: number },
 * }} input
 * @returns {Promise<MyRankSummary|null>}
 */
async function buildMyRankSummary(input) {
  if (!input.activeTournament || !input.userId) {
    return null;
  }

  const baseSummary = {
    isAvailable: input.leaderboardVisible,
    rank: null,
    totalContestants: 0,
    betterThanPercent: null,
    topPercentLabel: null,
    points: 0,
    accuracy: 0,
    predictionsSubmitted: input.predictionStats.submitted,
    predictionsTotal: input.predictionStats.total,
    hasLeaderboardEntry: false,
  };

  if (!input.leaderboardVisible) {
    return baseSummary;
  }

  try {
    const tournamentId = input.activeTournament.id;
    const tournamentName = input.activeTournament.name ?? '';

    const [contestantStats, tournamentStats] = await Promise.all([
      leaderboardService.getContestantStatistics(tournamentId, input.userId, { maxVisibleRank: null }),
      leaderboardService.getTournamentStatistics(tournamentId, tournamentName),
    ]);

    const totalContestants = tournamentStats.totalContestants;
    const rank = contestantStats.currentRank > 0 ? contestantStats.currentRank : null;

    return {
      isAvailable: true,
      rank,
      totalContestants,
      betterThanPercent: rank !== null
        ? LeaderboardDomain.calculateBetterThanPercent(rank, totalContestants)
        : null,
      topPercentLabel: rank !== null
        ? LeaderboardDomain.formatTopPercentLabel(rank, totalContestants)
        : null,
      points: contestantStats.totalPoints,
      accuracy: contestantStats.accuracy,
      predictionsSubmitted: input.predictionStats.submitted,
      predictionsTotal: input.predictionStats.total,
      hasLeaderboardEntry: rank !== null,
    };
  } catch (error) {
    Logger.warn('[ContestantDashboardService] Failed to load my rank summary:', error);
    return baseSummary;
  }
}
