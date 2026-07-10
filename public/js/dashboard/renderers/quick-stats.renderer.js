/**
 * @fileoverview Quick statistics card for contestant dashboard.
 * @module dashboard/renderers/quick-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @param {{ label: string, value: unknown, icon: string }} options
 * @returns {string}
 */
function renderDashboardStatCard(options) {
  const { label, value, icon } = options;

  return `
    <div class="ptw-dashboard-stat-card">
      <div class="ptw-dashboard-stat-card__icon" aria-hidden="true">
        <i class="bi ${icon}"></i>
      </div>
      <div class="ptw-dashboard-stat-card__content">
        <p class="ptw-dashboard-stat-card__label mb-0">${escapeHtml(label)}</p>
        <p class="ptw-dashboard-stat-card__value mb-0">${escapeHtml(formatStatValue(value))}</p>
      </div>
    </div>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderQuickStatsSection(data) {
  const stats = data.quickStats;

  const rows = [
    { label: 'Tournaments Joined', value: stats.tournamentsJoined, icon: 'bi-trophy' },
    { label: 'Predictions Submitted', value: stats.predictionsSubmitted, icon: 'bi-pencil-square' },
    { label: 'Correct Winner Predictions', value: stats.correctWinners, icon: 'bi-check-circle' },
    { label: 'Exact Score Predictions', value: stats.exactScores, icon: 'bi-bullseye' },
    { label: 'Current Points', value: stats.currentPoints, icon: 'bi-coin' },
    { label: 'Lifetime Points', value: stats.lifetimePoints, icon: 'bi-star' },
  ];

  if (data.leaderboardVisible && stats.currentRank !== null) {
    rows.push({ label: 'Current Rank', value: stats.currentRank, icon: 'bi-bar-chart' });
  }

  return `
    <section class="card ptw-card ptw-quick-stats-card" aria-labelledby="ptw-quick-stats-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-quick-stats-heading">Quick Statistics</h2>
      </div>
      <div class="card-body">
        <div class="ptw-dashboard-stat-grid">
          ${rows.map((row) => renderDashboardStatCard(row)).join('')}
        </div>
        <div class="text-center mt-3">
          <a href="/score" class="ptw-dashboard-stat-grid__footer-link" data-route>
            <i class="bi bi-eye me-1" aria-hidden="true"></i>View Full Stats
          </a>
        </div>
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
