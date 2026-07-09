/**
 * @fileoverview Admin dashboard page renderer.
 * @module dashboard/renderers/admin-dashboard.renderer
 */

import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderAdminActiveTournamentHero } from './admin-active-tournament.renderer.js';
import { renderAdminFeaturedMatchSection, renderAdminLiveMatchSection } from './admin-featured-match.renderer.js';

/**
 * @returns {string}
 */
export function renderAdminDashboardLoading() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Admin Dashboard',
    subtitle: 'Tournament and match management',
  })}
      <div class="mb-4">
        <div class="card ptw-card" style="min-height: 12rem;" aria-hidden="true"></div>
      </div>
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="Loading dashboard">
            <span class="visually-hidden">Loading dashboard…</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">Loading dashboard…</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import('../AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
export function renderAdminDashboard(data) {
  const actionHtml = data.tournamentCount > 0
    ? `<a class="btn btn-ptw-primary" href="${escapeHtml(data.tournamentsPath)}" data-route><i class="bi bi-calendar-event me-2" aria-hidden="true"></i>Manage Tournaments</a>`
    : `<a class="btn btn-ptw-primary" href="${escapeHtml(data.tournamentsPath)}?action=create" data-route><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Create Tournament</a>`;

  const heroHtml = renderAdminActiveTournamentHero(data);
  const liveMatchHtml = renderAdminLiveMatchSection(data);
  const upcomingMatchHtml = renderAdminFeaturedMatchSection(data);
  const hasSpotlight = Boolean(data.activeTournament || data.featuredMatch || data.featuredLiveMatch);

  const spotlightHtml = hasSpotlight
    ? `
      <div class="ptw-admin-dashboard-spotlight mb-4">
        <div class="row g-3">
          ${data.activeTournament ? `
            <div class="col-12 ${data.featuredMatch || data.featuredLiveMatch ? 'col-lg-6' : ''}">
              ${heroHtml}
            </div>
          ` : ''}
          ${data.featuredMatch || data.featuredLiveMatch ? `
            <div class="col-12 ${data.activeTournament ? 'col-lg-6' : ''}">
              <div class="d-flex flex-column gap-3 h-100">
                ${liveMatchHtml}
                ${upcomingMatchHtml}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `
    : '';

  const emptyStateHtml = data.tournamentCount === 0
    ? renderEmptyState({
      title: data.emptyStateTitle,
      message: data.emptyStateMessage,
      icon: 'bi-calendar-plus',
      actionHtml,
    })
    : '';

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES} ptw-admin-dashboard">
      ${renderPageHeader({
    title: 'Admin Dashboard',
    subtitle: 'Tournament and match management',
    actionsHtml: actionHtml,
  })}

      <div class="card ptw-card mb-4">
        <div class="card-body py-3">
          <div class="ptw-dashboard-welcome">
            <h2 class="h5 mb-1">${escapeHtml(data.welcomeTitle)}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(data.welcomeMessage)}</p>
          </div>
        </div>
      </div>

      ${spotlightHtml}
      ${emptyStateHtml}
    </div>
  `;
}
