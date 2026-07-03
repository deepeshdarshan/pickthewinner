/**
 * @fileoverview Statistics cards renderer for prediction management dashboard.
 * @module prediction/admin/renderers/statistics-cards.renderer
 */

import { renderStatisticCardGrid } from '../../../components/statistic-card.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';

/**
 * @param {import('../PredictionStatisticsService.js').TournamentStatistics} stats
 * @param {Date} [lastUpdated]
 * @returns {string}
 */
export function renderPredictionStatisticsCards(stats, lastUpdated = new Date()) {
  const cards = [
    {
      label: 'Total Predictions',
      value: stats.predictionsSubmitted.toLocaleString(),
      icon: 'bi-bullseye',
      trend: stats.expectedPredictions > 0
        ? `${stats.completionPercent}% of expected`
        : '',
      trendDirection: 'neutral',
    },
    {
      label: 'Contestants',
      value: stats.contestantsParticipating.toLocaleString(),
      icon: 'bi-people',
      trend: 'Participating',
      trendDirection: 'neutral',
    },
    {
      label: 'Prediction Completion',
      value: `${stats.completionPercent}%`,
      icon: 'bi-pie-chart',
      trend: `${stats.predictionsSubmitted} / ${stats.expectedPredictions}`,
      trendDirection: 'neutral',
    },
    {
      label: 'Pending Predictions',
      value: stats.pendingPredictions.toLocaleString(),
      icon: 'bi-hourglass-split',
      trend: stats.expectedPredictions > 0
        ? `${roundPercent(100 - stats.completionPercent)}% remaining`
        : '',
      trendDirection: 'neutral',
    },
    {
      label: 'Locked Predictions',
      value: stats.lockedPredictions.toLocaleString(),
      icon: 'bi-lock',
      trend: '',
      trendDirection: 'neutral',
    },
    {
      label: 'Completed Matches',
      value: `${stats.completedMatches} / ${stats.totalMatches}`,
      icon: 'bi-flag',
      trend: stats.totalMatches > 0
        ? `${roundPercent((stats.completedMatches / stats.totalMatches) * 100)}% completed`
        : '',
      trendDirection: 'neutral',
    },
  ];

  const lastUpdatedLabel = formatDateTime(lastUpdated);

  return `
    <section aria-label="Prediction statistics">
      ${renderStatisticCardGrid(cards)}
      <p class="text-muted small mt-2 mb-0">
        <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>
        Last updated: ${escapeHtml(lastUpdatedLabel || 'just now')}
      </p>
    </section>
  `;
}

/**
 * @param {import('../PredictionStatisticsService.js').TournamentStatistics} stats
 * @returns {string}
 */
export function renderTournamentOverviewStats(stats) {
  return `
    <div class="row g-3 mt-1">
      <div class="col-md-4">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <h3 class="h6 text-muted">Prediction Completion</h3>
            <p class="display-6 mb-0">${escapeHtml(String(stats.completionPercent))}%</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <h3 class="h6 text-muted">Avg. Predictions / Match</h3>
            <p class="display-6 mb-0">${escapeHtml(String(stats.averagePredictionsPerMatch))}</p>
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <h3 class="h6 text-muted">Published Matches</h3>
            <p class="display-6 mb-0">${escapeHtml(String(stats.publishedMatches))}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundPercent(value) {
  return Math.round(value * 10) / 10;
}
