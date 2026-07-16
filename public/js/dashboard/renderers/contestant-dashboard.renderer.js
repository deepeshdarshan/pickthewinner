/**
 * @fileoverview Contestant dashboard page renderer.
 * @module dashboard/renderers/contestant-dashboard.renderer
 */

import { appSettings } from '../../config/app.config.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderActiveTournamentHero } from './active-tournament.renderer.js';
import { renderFeaturedMatchSection, renderLiveMatchSection } from './featured-match.renderer.js';
import { renderMyRankSection } from './my-rank.renderer.js';
import { renderRecentActivitySection } from './recent-activity.renderer.js';
import { renderDashboardInfoCardsSection } from './info-cards.renderer.js';

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderDashboardWelcomeHeader(data) {
  return `
    <header class="ptw-dashboard-welcome-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
      <h1 class="ptw-dashboard-welcome-header__title mb-0">
        Welcome back, ${data.displayName}! <span aria-hidden="true">👋</span>
      </h1>
      <div class="ptw-dashboard-timezone-badge" title="${escapeHtml(appSettings.timezoneLabel)}">
        <i class="bi bi-clock" aria-hidden="true"></i>
        <span>All times in Indian Standard Time (IST)</span>
      </div>
    </header>
  `;
}

/**
 * @returns {string}
 */
export function renderContestantDashboardLoading() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      <header class="ptw-dashboard-welcome-header mb-4">
        <h1 class="ptw-dashboard-welcome-header__title mb-0">Dashboard</h1>
        <p class="ptw-text-muted mb-0 mt-2">Loading your tournaments and matches…</p>
      </header>
      <div class="mb-4">
        <div class="card ptw-card ptw-skeleton-card" style="height: 200px;"></div>
      </div>
      <div class="row g-3 mb-4 ptw-dashboard-spotlight-row">
        <div class="col-12 col-lg-8">
          <div class="card ptw-card ptw-skeleton-card h-100" style="min-height: 280px;" aria-hidden="true"></div>
        </div>
        <div class="col-12 col-lg-4">
          <div class="ptw-my-rank-card ptw-my-rank-card--skeleton ptw-skeleton-card h-100" aria-hidden="true"></div>
        </div>
      </div>
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
  const myRankHtml = renderMyRankSection(data);
  const hasLiveMatch = Boolean(data.featuredLiveMatch);
  const hasUpcomingMatch = Boolean(data.featuredMatch);
  const hasMyRank = Boolean(data.myRank);
  const showUpcomingMatch = hasUpcomingMatch || !hasLiveMatch;
  const upcomingColumnClass = hasMyRank && showUpcomingMatch ? 'col-12 col-lg-8' : 'col-12';

  const liveRowHtml = hasLiveMatch ? `
    <div class="row g-3 mb-3 ptw-dashboard-match-row">
      <div class="col-12">${liveMatchHtml}</div>
    </div>
  ` : '';

  const upcomingColumnHtml = showUpcomingMatch
    ? `<div class="${upcomingColumnClass} ptw-dashboard-spotlight__match">${upcomingMatchHtml}</div>`
    : '';

  const myRankColumnHtml = hasMyRank
    ? `<div class="col-12 col-lg-4 ptw-dashboard-spotlight__rank">${myRankHtml}</div>`
    : '';

  const spotlightRowHtml = (upcomingColumnHtml || myRankColumnHtml) ? `
    <div class="row g-3 align-items-stretch ptw-dashboard-spotlight-row">
      ${upcomingColumnHtml}
      ${myRankColumnHtml}
    </div>
  ` : '';

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-contestant-dashboard">
      ${renderDashboardWelcomeHeader(data)}

      ${renderActiveTournamentHero(data)}

      <h2 class="h5 mb-3">Matches</h2>

      <div class="ptw-dashboard-main-grid mb-4">
        ${liveRowHtml}
        ${spotlightRowHtml}
      </div>

      <div class="ptw-dashboard-secondary-sections">
        ${renderRecentActivitySection(data)}
      </div>

      ${renderDashboardInfoCardsSection()}
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
      ${renderDashboardWelcomeHeader(data)}
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
