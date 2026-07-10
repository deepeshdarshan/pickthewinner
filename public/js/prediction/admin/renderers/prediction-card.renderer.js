/**
 * @fileoverview Mobile prediction card renderer for admin views.
 * @module prediction/admin/renderers/prediction-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';
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
 * @param {string} icon
 * @param {string} label
 * @returns {string}
 */
function renderFieldLabel(icon, label) {
  return `
    <p class="ptw-prediction-card__label mb-1">
      <i class="bi ${icon} me-1" aria-hidden="true"></i>${escapeHtml(label)}
    </p>
  `;
}

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
    <article class="card ptw-card ptw-prediction-card" data-prediction-id="${escapeHtml(prediction.id)}" tabindex="0" role="button" aria-label="View prediction by ${escapeHtml(contestantName)}">
      <div class="card-body">
        <div class="d-flex align-items-center gap-2 mb-3">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 32 })}
          <div class="flex-grow-1 min-w-0">
            <p class="ptw-prediction-card__label mb-0">
              <i class="bi bi-person me-1" aria-hidden="true"></i>Contestant
            </p>
            <h3 class="h6 mb-0 text-truncate ptw-prediction-card__contestant">${escapeHtml(contestantName)}</h3>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-12 ptw-prediction-card__score-field">
            ${renderFieldLabel('bi-bullseye', 'Predicted Score')}
            <div class="ptw-prediction-card__value ptw-prediction-card__value--score mb-0">${renderPredictedScoreHtml(match, prediction)}</div>
          </div>
          <div class="col-12 ptw-prediction-card__score-field">
            ${renderFieldLabel('bi-check-circle', 'Actual Score')}
            <div class="ptw-prediction-card__value ptw-prediction-card__value--score mb-0">${renderActualScoreHtml(match, result)}</div>
          </div>
          <div class="col-6">
            ${renderFieldLabel('bi-trophy', 'Predicted Winner')}
            <div class="ptw-prediction-card__value mb-0">${renderPredictedWinnerHtml(match, prediction, { result })}</div>
          </div>
          <div class="col-6">
            ${renderFieldLabel('bi-award', 'Actual Winner')}
            <div class="ptw-prediction-card__value mb-0">${renderActualWinnerHtml(match, result)}</div>
          </div>
          <div class="col-6">
            ${renderFieldLabel('bi-star-fill', 'Points')}
            <p class="mb-0 fw-semibold ptw-prediction-card__value ptw-prediction-card__points">${renderPointsHtml(prediction, result)}</p>
          </div>
          <div class="col-6">
            ${renderFieldLabel('bi-clock', 'Submitted')}
            <p class="mb-0 ptw-prediction-card__value">${escapeHtml(formatDateTime(prediction.submittedAt) || '—')}</p>
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
