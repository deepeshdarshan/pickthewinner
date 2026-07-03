/**
 * @fileoverview Contestant-wise prediction view renderer.
 * @module prediction/admin/renderers/contestant-view.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderPredictionTable } from './list.renderer.js';

/**
 * @param {Record<string, unknown>} contestant
 * @param {import('../PredictionStatisticsService.js').ContestantStatistics} stats
 * @returns {string}
 */
export function renderContestantHeader(contestant, stats) {
  const name = String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? 'Unknown');

  return `
    <div class="card ptw-card mb-3">
      <div class="card-body">
        <div class="d-flex align-items-center gap-3 mb-3">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 56 })}
          <div>
            <h2 class="h4 mb-1">${escapeHtml(name)}</h2>
            <p class="text-muted mb-0">${escapeHtml(String(contestant.email ?? ''))}</p>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <p class="small text-muted mb-1">Predictions Submitted</p>
            <p class="h5 mb-0">${escapeHtml(String(stats.predictionsSubmitted))}</p>
          </div>
          <div class="col-6 col-md-3">
            <p class="small text-muted mb-1">Pending</p>
            <p class="h5 mb-0">${escapeHtml(String(stats.predictionsPending))}</p>
          </div>
          <div class="col-6 col-md-3">
            <p class="small text-muted mb-1">Current Points</p>
            <p class="h5 mb-0">${escapeHtml(String(stats.currentPoints))}</p>
          </div>
          <div class="col-6 col-md-3">
            <p class="small text-muted mb-1">Accuracy</p>
            <p class="h5 mb-0">${escapeHtml(String(stats.accuracyPercent))}%</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} contestant
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @param {Object} tableOptions
 * @param {import('../PredictionStatisticsService.js').ContestantStatistics} stats
 * @returns {string}
 */
export function renderContestantWiseView(contestant, predictions, tableOptions, stats) {
  return `
    <section aria-label="Contestant predictions">
      ${renderContestantHeader(contestant, stats)}
      <div class="card ptw-card">
        <div class="card-header">
          <h3 class="h5 mb-0">Prediction History</h3>
        </div>
        <div class="card-body p-0">
          ${renderPredictionTable(predictions, tableOptions)}
        </div>
      </div>
    </section>
  `;
}
