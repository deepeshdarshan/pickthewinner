/**
 * @fileoverview Contestant dashboard page renderer.
 * @module dashboard/renderers/contestant-dashboard.renderer
 */

import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../components/contestant-page-shell.component.js';
import { renderContestantPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { renderSkeletonCardGrid } from '../../components/skeleton.component.js';
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

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      ${renderContestantPageHeader({
    title: 'Dashboard',
    subtitle: data.welcomeMessage,
  })}

      ${renderTournamentGridSection(data)}

      <div class="ptw-dashboard-matches mb-4">
        ${data.featuredLiveMatch ? `
          <div class="mb-3">
            ${renderLiveMatchSection(data)}
          </div>
        ` : ''}

        <div class="row g-3">
          <div class="col-12 ${data.featuredLiveMatch ? 'col-xl-6' : 'col-xl-8'}">
            ${renderFeaturedMatchSection(data)}
          </div>
          <div class="col-12 ${data.featuredLiveMatch ? 'col-xl-6' : 'col-xl-4'}">
            ${renderQuickStatsSection(data)}
          </div>
        </div>
      </div>

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
