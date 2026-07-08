/**
 * @fileoverview Prediction comparison renderer for contestant history views.
 * @module prediction/history/renderers/prediction-comparison.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderResultBadges } from '../../admin/renderers/prediction-status-badge.renderer.js';
import {
  renderPredictedScoreHtml,
  renderPredictedWinnerHtml,
  renderActualScoreHtml,
  renderActualWinnerHtml,
  renderPointsHtml,
} from '../../admin/renderers/prediction-display.renderer.js';
import { resolveBonusPoints, resolveResultBadges } from '../../../domain/prediction-history.domain.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
export function renderComparisonBadges(item) {
  const result = item.match?.result ?? {};
  const hasResult = Boolean(result.published);

  if (!hasResult) {
    return '<span class="text-muted small">Awaiting result</span>';
  }

  const bonusPoints = resolveBonusPoints(item.scoringBreakdown);
  const resultBadges = resolveResultBadges(item);

  return `
    <div class="d-flex flex-wrap gap-2 ptw-prediction-badges">
      ${renderResultBadges(resultBadges)}
      ${bonusPoints > 0 ? `<span class="badge bg-warning text-dark" aria-label="Bonus points awarded"><i class="bi bi-star-fill me-1" aria-hidden="true"></i>Bonus +${bonusPoints}</span>` : ''}
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
export function renderScoringBreakdown(item) {
  const breakdown = /** @type {Array<{ label: string, points: number, correct: boolean }>} */ (
    item.scoringBreakdown ?? []
  );
  const totalPoints = Number(item.calculatedPoints ?? 0);
  const result = item.match?.result ?? {};

  if (!result.published) {
    return '<p class="text-muted mb-0">Points will be awarded after the result is published.</p>';
  }

  if (breakdown.length === 0) {
    return `<p class="mb-0 fw-semibold">Total: ${totalPoints} pts</p>`;
  }

  return `
    <ul class="list-unstyled mb-2">
      ${breakdown.map((entry) => `
        <li class="d-flex justify-content-between align-items-center py-1">
          <span>
            <i class="bi ${entry.correct ? 'bi-check-circle text-success' : 'bi-x-circle text-danger'} me-1" aria-hidden="true"></i>
            ${escapeHtml(entry.label)}
          </span>
          <span class="fw-semibold">${entry.points} pts</span>
        </li>
      `).join('')}
    </ul>
    <p class="mb-0 fw-semibold">Total: ${totalPoints} pts</p>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
export function renderPredictionComparisonPanel(item) {
  const match = item.match ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const hasResult = Boolean(result.published);
  const showPenaltyWinner = hasResult
    && PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result);
  const predictedWinnerHtml = renderPredictedWinnerHtml(match, item, { result });
  const actualWinnerHtml = hasResult ? renderActualWinnerHtml(match, result) : '';

  return `
    <div class="row g-4 ptw-prediction-comparison">
      <div class="col-md-6 ptw-prediction-comparison__column">
        <h3 class="h6 text-uppercase ptw-text-muted mb-0">My Prediction</h3>
        <div class="ptw-prediction-comparison__score">
          ${renderPredictedScoreHtml(match, item)}
        </div>
        ${showPenaltyWinner ? renderWinnerComparisonRow('Predicted Winner', predictedWinnerHtml) : ''}
      </div>
      <div class="col-md-6 ptw-prediction-comparison__column">
        <h3 class="h6 text-uppercase ptw-text-muted mb-0">Official Result</h3>
        <div class="ptw-prediction-comparison__score">
          ${hasResult ? renderActualScoreHtml(match, result) : '<span class="ptw-text-muted">Not published yet</span>'}
        </div>
        ${showPenaltyWinner ? renderWinnerComparisonRow('Penalty Winner', actualWinnerHtml) : ''}
      </div>
    </div>
    <hr>
    <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
      <div>${renderComparisonBadges(item)}</div>
      <div class="text-end">${renderPointsHtml(item, result)}</div>
    </div>
    <div class="mt-3">
      <h3 class="h6">Scoring Breakdown</h3>
      ${renderScoringBreakdown(item)}
    </div>
  `;
}

/**
 * @param {string} label
 * @param {string} valueHtml
 * @returns {string}
 */
function renderWinnerComparisonRow(label, valueHtml) {
  return `
    <div class="ptw-prediction-comparison__winner-row">
      <span class="ptw-prediction-comparison__winner-label">${escapeHtml(label)}</span>
      <span class="ptw-prediction-comparison__winner-value">${valueHtml}</span>
    </div>
  `;
}
