/**
 * @fileoverview Contestant and administrator dashboard page.
 * @module pages/dashboard.page
 */

import { USER_ROLES } from '../users/user.constants.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { navigateTo } from '../services/router.service.js';
import { ContestantDashboardService } from '../dashboard/ContestantDashboardService.js';
import {
  renderContestantDashboard,
  renderContestantDashboardLoading,
} from '../dashboard/renderers/contestant-dashboard.renderer.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders the dashboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initDashboard(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initDashboard(outlet) {
  await AuthorizationService.resolve();
  const role = AuthorizationService.getCurrentRole();

  if (role === USER_ROLES.ADMIN) {
    await navigateTo(AUTH_ROUTES.ADMIN, true);
    return;
  }

  outlet.innerHTML = renderContestantDashboardLoading();

  try {
    const contestantData = await ContestantDashboardService.getDashboardData();
    outlet.innerHTML = renderContestantDashboard(contestantData);
    initializeCountdowns(outlet);
  } catch (error) {
    Logger.error('[Dashboard] Failed to load contestant dashboard:', error);
    outlet.innerHTML = renderContestantDashboard({
      displayName: 'User',
      role: USER_ROLES.CONTESTANT,
      hasActiveTournaments: false,
      activeTournamentCount: 0,
      welcomeMessage: 'Welcome back!',
      emptyStateTitle: 'Unable to Load Dashboard',
      emptyStateMessage: 'Please refresh the page and try again.',
      tournamentsPath: '/tournaments',
      leaderboardVisible: false,
      leaderboardPath: '/leaderboard',
      leaderboardPendingMessage: '',
      activeTournament: null,
      tournaments: [],
      tournamentCards: [],
      featuredMatch: null,
      featuredMatchCountdown: null,
      featuredMatchPrediction: null,
      featuredLiveMatch: null,
      featuredLiveMatchPrediction: null,
      liveMatches: [],
      upcomingMatches: [],
      upcomingPredictions: {},
      predictionStats: { total: 0, submitted: 0, pending: 0 },
      myRank: null,
      recentActivity: [],
    });
  }
}
