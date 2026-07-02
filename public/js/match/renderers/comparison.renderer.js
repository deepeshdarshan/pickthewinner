/**
 * @fileoverview Prediction comparison renderer.
 * @module match/renderers/comparison.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {Object} ComparisonData
 * @property {import('../match.service.js').EnrichedMatch} match
 * @property {Record<string, unknown>|null} prediction
 */

/**
 * @param {ComparisonData} data
 * @returns {string}
 */
export function renderPredictionComparison(data) {
  const { match, prediction } = data;
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const breakdown = /** @type {Array<{ label: string, points: number, correct: boolean }>} */ (
    prediction?.scoringBreakdown ?? []
  );
  const totalPoints = Number(prediction?.calculatedPoints ?? 0);

  if (!prediction) {
    return `
      <div class="card ptw-card mb-3">
        <div class="card-body ptw-text-muted">You have not submitted a prediction for this match.</div>
      </div>
    `;
  }

  return `
    <div class="card ptw-card mb-3 ptw-match-comparison">
      <div class="card-header"><h2 class="h5 mb-0">Your Prediction vs Official Result</h2></div>
      <div class="card-body">
        <div class="row g-4">
          <div class="col-md-6">
            <h3 class="h6">Official Result</h3>
            <p class="mb-1">${escapeHtml(match.homeTeam?.name ?? 'Home')} <strong>${escapeHtml(String(result.homeScore ?? ''))}</strong></p>
            <p class="mb-1">${escapeHtml(match.awayTeam?.name ?? 'Away')} <strong>${escapeHtml(String(result.awayScore ?? ''))}</strong></p>
            <p class="mb-0"><strong>Resolution:</strong> ${escapeHtml(String(result.winnerResolution ?? ''))}</p>
          </div>
          <div class="col-md-6">
            <h3 class="h6">My Prediction</h3>
            <p class="mb-1">${escapeHtml(match.homeTeam?.name ?? 'Home')} <strong>${escapeHtml(String(prediction.homeScore ?? ''))}</strong></p>
            <p class="mb-1">${escapeHtml(match.awayTeam?.name ?? 'Away')} <strong>${escapeHtml(String(prediction.awayScore ?? ''))}</strong></p>
            ${(prediction.predictedWinner ?? prediction.penaltyWinner) ? `<p class="mb-0"><strong>Predicted Winner:</strong> ${escapeHtml(String(prediction.predictedWinner ?? prediction.penaltyWinner))}</p>` : ''}
          </div>
        </div>
        <hr>
        <h3 class="h6">Points Awarded</h3>
        <ul class="list-unstyled mb-2">
          ${breakdown.map((item) => `
            <li class="d-flex justify-content-between">
              <span>${item.correct ? '✔' : '✖'} ${escapeHtml(item.label)}</span>
              <span>${item.points} Points</span>
            </li>
          `).join('')}
        </ul>
        <p class="mb-0 fw-semibold">Total: ${totalPoints} Points</p>
      </div>
    </div>
  `;
}
