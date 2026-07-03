/**
 * @fileoverview Mobile prediction card renderer for admin views.
 * @module prediction/admin/renderers/prediction-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import {
  resolveContestantDisplayName,
  renderPredictedScoreHtml,
  renderPredictedWinnerHtml,
  renderActualScoreHtml,
  renderActualWinnerHtml,
  renderPointsHtml,
} from './prediction-display.renderer.js';

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictionCard(prediction) {
  const contestant = prediction.contestant ?? {};
  const match = prediction.match ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const contestantName = resolveContestantDisplayName(contestant);

  return `
    <article class="card ptw-card ptw-prediction-card mb-2" data-prediction-id="${escapeHtml(prediction.id)}" tabindex="0" role="button" aria-label="View prediction by ${escapeHtml(contestantName)}">
      <div class="card-body py-2">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 28 })}
          <div class="flex-grow-1 min-w-0">
            <h3 class="h6 mb-0 text-truncate">${escapeHtml(contestantName)}</h3>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-6">
            <p class="small text-muted mb-1">Predicted Score</p>
            <div class="mb-0">${renderPredictedScoreHtml(match, prediction)}</div>
          </div>
          <div class="col-6">
            <p class="small text-muted mb-1">Predicted Winner</p>
            <div class="mb-0">${renderPredictedWinnerHtml(match, prediction)}</div>
          </div>
          <div class="col-6">
            <p class="small text-muted mb-1">Actual Score</p>
            <div class="mb-0">${renderActualScoreHtml(match, result)}</div>
          </div>
          <div class="col-6">
            <p class="small text-muted mb-1">Actual Winner</p>
            <div class="mb-0">${renderActualWinnerHtml(match, result)}</div>
          </div>
          <div class="col-6">
            <p class="small text-muted mb-1">Points</p>
            <p class="mb-0 fw-semibold">${renderPointsHtml(prediction, result)}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @returns {string}
 */
export function renderPredictionCardList(predictions) {
  return predictions.map((prediction) => renderPredictionCard(prediction)).join('');
}
