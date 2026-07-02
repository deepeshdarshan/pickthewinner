/**
 * @fileoverview Admin dashboard page.
 * @module pages/admin-dashboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { AdminDashboardService } from '../dashboard/AdminDashboardService.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * Renders the admin dashboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminDashboard(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminDashboard(outlet) {
  const data = await AdminDashboardService.getDashboardData();

  const summaryHtml = data.activeTournament
    ? `
      <div class="card ptw-card mb-4">
        <div class="card-body">
          <h3 class="h5">Active Tournament</h3>
          <p class="mb-1 fw-semibold">${escapeHtml(data.activeTournament.name)}</p>
          <p class="ptw-text-muted mb-3">${escapeHtml(data.activeTournament.season)} · ${escapeHtml(data.activeTournament.statusLabel)}</p>
          <a class="btn btn-outline-light btn-sm" href="${escapeHtml(data.tournamentsPath)}" data-route>Manage Tournaments</a>
        </div>
      </div>
    `
    : '';

  const actionHtml = data.tournamentCount > 0
    ? `<a class="btn btn-ptw-primary" href="${escapeHtml(data.tournamentsPath)}" data-route><i class="bi bi-calendar-event me-2" aria-hidden="true"></i>Manage Tournaments</a>`
    : `<a class="btn btn-ptw-primary" href="${escapeHtml(data.tournamentsPath)}?action=create" data-route><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Create Tournament</a>`;

  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Admin Dashboard',
    subtitle: 'Tournament and match management',
    actionsHtml: actionHtml,
  })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">${escapeHtml(data.welcomeTitle)}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(data.welcomeMessage)}</p>
          </div>
          ${summaryHtml}
          ${data.tournamentCount === 0 ? renderEmptyState({
    title: data.emptyStateTitle,
    message: data.emptyStateMessage,
    icon: 'bi-calendar-plus',
    actionHtml,
  }) : ''}
        </div>
      </div>
    </div>
  `;
}
