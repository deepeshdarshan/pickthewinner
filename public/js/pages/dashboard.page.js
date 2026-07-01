/**
 * @fileoverview Contestant and administrator dashboard page.
 * @module pages/dashboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { AppContext } from '../app/app.context.js';
import { USER_ROLES } from '../users/user.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';

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

  const role = AppContext.getRole();
  const displayName = AppContext.getDisplayName();
  const isAdmin = role === USER_ROLES.ADMIN;

  outlet.innerHTML = `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: isAdmin ? 'Tournament administration overview' : 'Your predictions and upcoming matches',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${isAdmin ? renderAdminEmptyState() : renderContestantEmptyState(displayName)}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {string} name
 * @returns {string}
 */
function renderContestantEmptyState(name) {
  return `
    <div class="ptw-dashboard-welcome mb-4">
      <h2 class="h4 mb-1">Welcome ${name}!</h2>
      <p class="ptw-text-muted mb-0">There are currently no active tournaments.</p>
    </div>
    ${renderEmptyState({
      title: 'No Active Tournaments',
      message: 'Once a tournament is published, you can begin submitting predictions.',
      icon: 'bi-calendar-event',
    })}
  `;
}

/**
 * @returns {string}
 */
function renderAdminEmptyState() {
  return `
    <div class="ptw-dashboard-welcome mb-4">
      <h2 class="h4 mb-1">Welcome Administrator</h2>
      <p class="ptw-text-muted mb-0">There are currently no tournaments.</p>
    </div>
    ${renderEmptyState({
      title: 'No Tournaments Yet',
      message: 'Create your first tournament to get started.',
      icon: 'bi-calendar-plus',
      actionHtml: '<a class="btn btn-ptw-primary" href="/admin" data-route><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Go to Admin Console</a>',
    })}
  `;
}
