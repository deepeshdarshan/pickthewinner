/**
 * @fileoverview Contestant and administrator dashboard page.
 * @module pages/dashboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { USER_ROLES } from '../users/user.constants.js';
import { AdminDashboardService } from '../dashboard/AdminDashboardService.js';
import { ContestantDashboardService } from '../dashboard/ContestantDashboardService.js';
import { escapeHtml } from '../utils/html.util.js';

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
  const adminData = await AdminDashboardService.getDashboardData();
  const isAdmin = adminData.role === USER_ROLES.ADMIN;

  if (isAdmin) {
    outlet.innerHTML = renderAdminDashboard(adminData);
    return;
  }

  const contestantData = await ContestantDashboardService.getDashboardData();
  outlet.innerHTML = renderContestantDashboard(contestantData);
}

/**
 * @param {import('../dashboard/ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderContestantDashboard(data) {
  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: 'Your predictions and upcoming matches',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">${data.welcomeMessage}</h2>
            <p class="ptw-text-muted mb-0">There are currently no active tournaments.</p>
          </div>
          ${renderEmptyState({
            title: data.emptyStateTitle,
            message: data.emptyStateMessage,
            icon: 'bi-calendar-event',
          })}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import('../dashboard/AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
function renderAdminDashboard(data) {
  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: 'Tournament administration overview',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">${escapeHtml(data.welcomeTitle)}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(data.welcomeMessage)}</p>
          </div>
          ${renderEmptyState({
            title: data.emptyStateTitle,
            message: data.emptyStateMessage,
            icon: 'bi-calendar-plus',
            actionHtml: `<a class="btn btn-ptw-primary" href="${escapeHtml(data.adminConsolePath)}" data-route><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Go to Admin Console</a>`,
          })}
        </div>
      </div>
    </div>
  `;
}
