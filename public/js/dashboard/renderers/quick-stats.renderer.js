/**
 * @fileoverview Quick statistics card for contestant dashboard.
 * @module dashboard/renderers/quick-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderQuickStatsSection(data) {
  const stats = data.quickStats;

  const rows = [
    { label: 'Tournaments Joined', value: stats.tournamentsJoined },
    { label: 'Predictions Submitted', value: stats.predictionsSubmitted },
    { label: 'Correct Winner Predictions', value: stats.correctWinners },
    { label: 'Exact Score Predictions', value: stats.exactScores },
    { label: 'Current Points', value: stats.currentPoints },
    { label: 'Lifetime Points', value: stats.lifetimePoints },
  ];

  if (data.leaderboardVisible && stats.currentRank !== null) {
    rows.push({ label: 'Current Rank', value: stats.currentRank });
  }

  return `
    <section class="card ptw-card ptw-quick-stats-card h-100" aria-labelledby="ptw-quick-stats-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-quick-stats-heading">Quick Statistics</h2>
      </div>
      <div class="card-body">
        <dl class="ptw-quick-stats-card__list mb-0">
          ${rows.map((row) => `
            <div class="ptw-quick-stats-card__row d-flex justify-content-between align-items-center py-2">
              <dt class="ptw-text-muted mb-0">${escapeHtml(row.label)}</dt>
              <dd class="mb-0 fw-semibold">${escapeHtml(formatStatValue(row.value))}</dd>
            </div>
          `).join('')}
        </dl>
        <a href="/score" class="btn btn-outline-light btn-sm w-100 mt-3" data-route>
          <i class="bi bi-box-arrow-up-right me-1" aria-hidden="true"></i>View Full Stats
        </a>
      </div>
    </section>
  `;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatStatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  return String(value);
}
