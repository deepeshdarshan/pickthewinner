/**
 * @fileoverview Admin dashboard page.
 * @module pages/admin-dashboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';

/**
 * Renders the admin dashboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  outlet.innerHTML = `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Admin Dashboard',
        subtitle: 'Tournament and match management',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">Welcome Administrator</h2>
            <p class="ptw-text-muted mb-0">No tournaments have been created.</p>
          </div>
          ${renderEmptyState({
            title: 'Create Your First Tournament',
            message: 'Tournament management will be available here once the tournament module is implemented.',
            icon: 'bi-calendar-plus',
          })}
        </div>
      </div>
    </div>
  `;
}
