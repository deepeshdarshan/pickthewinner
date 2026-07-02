/**
 * @fileoverview Leaderboard unavailable page — informational state when leaderboard is hidden.
 * @module pages/leaderboard-unavailable.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { LEADERBOARD_MESSAGES } from '../tournament/tournament.constants.js';
import { CONTESTANT_ROUTES } from '../config/routes.js';

/**
 * Renders the leaderboard unavailable informational page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  outlet.innerHTML = `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: 'Leaderboard Not Available',
            message: LEADERBOARD_MESSAGES.UNAVAILABLE,
            icon: 'bi-eye-slash',
            actionHtml: `
              <a class="btn btn-ptw-primary" href="${CONTESTANT_ROUTES.PREDICTIONS}" data-route>
                <i class="bi bi-bullseye me-2" aria-hidden="true"></i>Go to Predictions
              </a>
            `,
          })}
        </div>
      </div>
    </div>
  `;
}
