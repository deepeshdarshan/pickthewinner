/**
 * @fileoverview Contestant dashboard page renderer.
 * @module dashboard/renderers/contestant-dashboard.renderer
 */

import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../components/contestant-page-shell.component.js';
import { renderContestantPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { renderSkeletonCardGrid } from '../../components/skeleton.component.js';
import { renderActiveTournamentHero } from './active-tournament.renderer.js';
import { renderFeaturedMatchSection, renderLiveMatchSection } from './featured-match.renderer.js';
import { renderTournamentGridSection } from './tournament-grid.renderer.js';
import { renderQuickStatsSection } from './quick-stats.renderer.js';
import { renderRecentActivitySection } from './recent-activity.renderer.js';

/**
 * @returns {string}
 */
export function renderContestantDashboardLoading() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      ${renderContestantPageHeader({
    title: 'Dashboard',
    subtitle: 'Loading your tournaments and matches…',
  })}
      <div class="mb-4">
        <div class="card ptw-card ptw-skeleton-card" style="height: 180px;"></div>
      </div>
      ${renderSkeletonCardGrid(3)}
    </div>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderContestantDashboard(data) {
  if (!data.hasActiveTournaments) {
    return renderEmptyContestantDashboard(data);
  }

  const liveMatchHtml = renderLiveMatchSection(data);
  const upcomingMatchHtml = renderFeaturedMatchSection(data);
  const hasLiveMatch = Boolean(data.featuredLiveMatch);

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      ${renderContestantPageHeader({
    title: 'Dashboard',
    subtitle: data.welcomeMessage,
  })}

      ${renderActiveTournamentHero(data)}

      ${renderTournamentGridSection(data)}

      <div class="ptw-dashboard-matches mb-4">
        <div class="row g-3">
          ${hasLiveMatch ? `
            <div class="col-12 col-lg-6">
              ${liveMatchHtml}
            </div>
            <div class="col-12 col-lg-6">
              ${upcomingMatchHtml}
            </div>
          ` : `
            <div class="col-12">
              ${upcomingMatchHtml}
            </div>
          `}
        </div>
      </div>

      ${renderQuickStatsSection(data)}

      ${renderRecentActivitySection(data)}
    </div>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderEmptyContestantDashboard(data) {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      ${renderContestantPageHeader({
    title: 'Dashboard',
    subtitle: data.welcomeMessage,
  })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
    title: data.emptyStateTitle,
    message: data.emptyStateMessage,
    icon: 'bi-calendar-event',
    actionHtml: `<a class="btn btn-ptw-primary" href="${data.tournamentsPath}" data-route>Browse Tournaments</a>`,
  })}
        </div>
      </div>
    </div>
  `;
}
