/**
 * @fileoverview Contestant-wise prediction view renderer.
 * @module prediction/admin/renderers/contestant-view.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderPredictionTable } from './list.renderer.js';
import { renderStatTileGrid } from '../../../components/statistic-card.component.js';

/**
 * @param {Record<string, unknown>} contestant
 * @param {import('../PredictionStatisticsService.js').ContestantStatistics} stats
 * @returns {string}
 */
export function renderContestantHeader(contestant, stats) {
  const name = String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? 'Unknown');

  return `
    <div class="card ptw-card mb-3">
      <div class="card-body py-2">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 40 })}
          <div class="min-w-0">
            <h2 class="h6 mb-0">${escapeHtml(name)}</h2>
            <p class="small text-muted mb-0 text-truncate">${escapeHtml(String(contestant.email ?? ''))}</p>
          </div>
        </div>
        ${renderStatTileGrid([
    { label: 'Submitted', value: stats.predictionsSubmitted },
    { label: 'Pending', value: stats.predictionsPending },
    { label: 'Points', value: stats.currentPoints },
    { label: 'Accuracy', value: `${stats.accuracyPercent}%` },
  ])}
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
        <div class="card-header py-2">
          <h3 class="h6 mb-0">Prediction History</h3>
        </div>
        <div class="card-body p-0">
          ${renderPredictionTable(predictions, tableOptions)}
        </div>
      </div>
    </section>
  `;
}
