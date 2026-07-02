/**
 * @fileoverview Leaderboard route guard — enforces tournament leaderboard visibility for contestants.
 * @module leaderboard/leaderboard.guard
 */

import { AuthorizationService } from '../authorization/authorization.service.js';
import { Roles } from '../authorization/permission.constants.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';

/** @type {ReadonlySet<string>} */
const LEADERBOARD_GUARDED_PATHS = new Set(['/leaderboard', '/leaderboard/unavailable']);

/**
 * @typedef {Object} LeaderboardGuardResult
 * @property {boolean} allowed
 * @property {string} [redirectTo]
 * @property {boolean} [replace]
 */

/**
 * Evaluates leaderboard visibility for contestant routes.
 * Administrators always retain access regardless of the visibility setting.
 * @param {import('../config/routes.js').RouteDefinition} route
 * @returns {Promise<LeaderboardGuardResult>}
 */
export async function canActivateLeaderboardRoute(route) {
  if (!LEADERBOARD_GUARDED_PATHS.has(route.path)) {
    return { allowed: true };
  }

  await AuthorizationService.resolve();

  if (AuthorizationService.hasRole(Roles.ADMIN)) {
    if (route.path === '/leaderboard/unavailable') {
      return { allowed: false, redirectTo: '/leaderboard', replace: true };
    }

    return { allowed: true };
  }

  await TournamentConfigurationService.load();
  const leaderboardVisible = TournamentConfigurationService.isLeaderboardVisible();

  if (route.path === '/leaderboard') {
    if (leaderboardVisible) {
      return { allowed: true };
    }

    return { allowed: false, redirectTo: '/leaderboard/unavailable', replace: true };
  }

  if (route.path === '/leaderboard/unavailable') {
    if (leaderboardVisible) {
      return { allowed: false, redirectTo: '/leaderboard', replace: true };
    }

    return { allowed: true };
  }

  return { allowed: true };
}
