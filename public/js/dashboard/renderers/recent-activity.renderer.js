/**
 * @fileoverview Recent activity timeline for contestant dashboard.
 * @module dashboard/renderers/recent-activity.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/** @type {Readonly<Record<string, string>>} */
const ACTIVITY_ICONS = Object.freeze({
  result: 'bi-check-circle-fill text-success',
  prediction: 'bi-bullseye text-primary',
  points: 'bi-trophy text-warning',
  info: 'bi-info-circle text-info',
});

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderRecentActivitySection(data) {
  const items = data.recentActivity;

  return `
    <section class="card ptw-card ptw-activity-timeline" aria-labelledby="ptw-recent-activity-heading">
      <div class="card-header position-relative">
        <h2 class="h5 mb-0" id="ptw-recent-activity-heading">Recent Activity</h2>
        <i class="bi bi-stars ptw-activity-timeline__sparkle" aria-hidden="true"></i>
      </div>
      <div class="card-body">
        ${items.length === 0 ? `
          <p class="ptw-text-muted mb-0">No recent activity yet.</p>
        ` : `
          <ul class="list-unstyled mb-0 ptw-activity-timeline__list">
            ${items.map((item) => `
              <li class="ptw-activity-timeline__item d-flex gap-3 align-items-start">
                <i class="bi ${ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.info}" aria-hidden="true"></i>
                <div class="flex-grow-1">
                  <p class="mb-1">${escapeHtml(item.message)}</p>
                  <small class="ptw-text-muted">${escapeHtml(item.timestampLabel)}</small>
                </div>
              </li>
            `).join('')}
          </ul>
        `}
      </div>
    </section>
  `;
}
