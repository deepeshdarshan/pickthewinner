/**
 * @fileoverview Prediction comparison renderer.
 * @module match/renderers/comparison.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { renderTeamInlineHtml } from '../../master-data/teams/team-flag.util.js';
import { PredictionDomain } from '../../domain/prediction.domain.js';
import { PredictionManagementDomain } from '../../domain/prediction-management.domain.js';

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
  const customScoringConfig = match.customScoringConfig;
  const hasCustomPoints = Boolean(customScoringConfig?.useCustomPoints);
  const showPenaltyWinner = Boolean(result.published)
    && PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result);

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
            <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })} <strong>${escapeHtml(String(result.homeScore ?? ''))}</strong></p>
            <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })} <strong>${escapeHtml(String(result.awayScore ?? ''))}</strong></p>
            ${showPenaltyWinner ? `<p class="mb-0 d-flex align-items-center gap-2 flex-wrap"><strong>Penalty Winner:</strong> ${renderPenaltyWinnerHtml(match, result)}</p>` : ''}
          </div>
          <div class="col-md-6">
            <h3 class="h6">My Prediction</h3>
            <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })} <strong>${escapeHtml(String(prediction.homeScore ?? ''))}</strong></p>
            <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })} <strong>${escapeHtml(String(prediction.awayScore ?? ''))}</strong></p>
            ${showPenaltyWinner && (prediction.predictedWinner ?? prediction.penaltyWinner) ? `<p class="mb-0"><strong>Predicted Penalty Winner:</strong> ${escapeHtml(String(prediction.predictedWinner ?? prediction.penaltyWinner))}</p>` : ''}
          </div>
        </div>
        <hr>
        <h3 class="h6">Scoring Configuration</h3>
        <p class="mb-2">
          Source: ${hasCustomPoints ? '<span class="badge bg-primary-subtle text-primary-emphasis border">Match Custom Points</span>' : '<span class="badge bg-secondary-subtle text-secondary-emphasis border">Tournament Default</span>'}
        </p>
        ${hasCustomPoints ? `
          <p class="mb-0 small ptw-text-muted">
            Match Score Points: ${escapeHtml(String(customScoringConfig?.correctMatchScorePoints ?? '—'))} ·
            Penalty Winner Points: ${escapeHtml(String(customScoringConfig?.correctPenaltyWinnerPoints ?? '—'))}
          </p>
          <hr>
        ` : '<hr>'}
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

/**
 * @param {import('../match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
function renderPenaltyWinnerHtml(match, result) {
  const side = PredictionDomain.resolveResultWinnerSide(result, match);

  if (side === 'HOME') {
    return renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' });
  }

  if (side === 'AWAY') {
    return renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' });
  }

  return escapeHtml(PredictionDomain.resolveResultWinnerName(result, match) ?? '—');
}
