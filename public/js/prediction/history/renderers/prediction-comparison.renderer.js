/**
 * @fileoverview Prediction comparison renderer for contestant history views.
 * @module prediction/history/renderers/prediction-comparison.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { PredictionDomain } from '../../../domain/prediction.domain.js';
import { renderResultBadges } from '../../admin/renderers/prediction-status-badge.renderer.js';
import {
  renderPredictedWinnerHtml,
  renderActualWinnerHtml,
} from '../../admin/renderers/prediction-display.renderer.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import {
  resolveBonusPoints,
  resolvePrimaryResultBadge,
  resolveResultBadges,
} from '../../../domain/prediction-history.domain.js';
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
 * @param {{ variant?: 'default'|'detail' }} [options]
 * @returns {string}
 */
export function renderScoringBreakdown(item, options = {}) {
  const { variant = 'default' } = options;
  const breakdown = /** @type {Array<{ label: string, points: number, correct: boolean }>} */ (
    item.scoringBreakdown ?? []
  );
  const totalPoints = Number(item.calculatedPoints ?? 0);
  const result = item.match?.result ?? {};

  if (!result.published) {
    return '<p class="text-muted mb-0">Points will be awarded after the result is published.</p>';
  }

  if (variant === 'detail') {
    if (breakdown.length === 0) {
      return `
        <div class="ptw-prediction-comparison__breakdown">
          <p class="ptw-prediction-comparison__breakdown-title mb-2">Scoring Breakdown</p>
          <p class="text-muted mb-0 small">No scoring breakdown available.</p>
        </div>
        ${renderTotalPointsEarned(totalPoints)}
      `;
    }

    return `
      <div class="ptw-prediction-comparison__breakdown">
        <p class="ptw-prediction-comparison__breakdown-title mb-2">Scoring Breakdown</p>
        <ul class="list-unstyled mb-0">
          ${breakdown.map((entry) => `
            <li class="ptw-prediction-comparison__breakdown-row">
              <span class="ptw-prediction-comparison__breakdown-label">
                <i class="bi ${entry.correct ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2" aria-hidden="true"></i>
                ${escapeHtml(entry.label)}
              </span>
              <span class="ptw-prediction-comparison__breakdown-points ${entry.correct ? 'text-success' : 'text-danger'}">${entry.points} pts</span>
            </li>
          `).join('')}
        </ul>
      </div>
      ${renderTotalPointsEarned(totalPoints)}
    `;
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
  const hasPredictedWinner = Boolean(PredictionDomain.resolvePredictedWinnerSide(item));
  const predictedWinnerHtml = hasPredictedWinner
    ? renderPredictedWinnerHtml(match, item, { result })
    : '—';
  const actualWinnerHtml = hasResult ? renderActualWinnerHtml(match, result) : 'Pending';

  return `
    <div class="ptw-prediction-comparison ptw-prediction-comparison--detail">
      <div class="ptw-prediction-comparison__row">
        <div class="ptw-prediction-comparison__boxes">
          <div class="ptw-prediction-comparison__box">
            <p class="ptw-prediction-comparison__box-label">Your Prediction</p>
            ${renderDetailedScoreBox(match, item, 'prediction')}
            ${renderWinnerComparisonRow('Predicted Winner', predictedWinnerHtml, { centered: true, showDivider: true })}
          </div>
          <div class="ptw-prediction-comparison__box">
            <p class="ptw-prediction-comparison__box-label">Official Result</p>
            ${hasResult
    ? `
              ${renderDetailedScoreBox(match, result, 'result')}
              ${renderWinnerComparisonRow('Official Winner', actualWinnerHtml, { centered: true, showDivider: true })}
              ${showPenaltyWinner ? '<p class="small text-center ptw-text-muted mb-0 mt-2">Penalty winner included in result</p>' : ''}
            `
    : '<p class="ptw-text-muted mb-0 small text-center">Not published yet</p>'}
          </div>
        </div>
        ${renderComparisonVerdict(item)}
      </div>
      <hr class="ptw-prediction-comparison__divider">
      ${renderScoringBreakdown(item, { variant: 'detail' })}
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {Record<string, unknown>} data
 * @param {'prediction'|'result'} side
 * @returns {string}
 */
function renderDetailedScoreBox(match, data, side) {
  const homeTeam = match.homeTeam ?? {};
  const awayTeam = match.awayTeam ?? {};
  const homeScore = String(data.homeScore ?? '');
  const awayScore = String(data.awayScore ?? '');
  const scoreClass = side === 'result'
    ? 'ptw-prediction-comparison__score-value ptw-prediction-comparison__score-value--result'
    : 'ptw-prediction-comparison__score-value';

  return `
    <div class="ptw-prediction-comparison__scoreline">
      <div class="ptw-prediction-comparison__scoreline-inner">
        ${renderTeamInlineHtml(homeTeam, {
    fallback: 'Home',
    marginClass: 'me-0',
    className: 'ptw-team-flag ptw-team-flag--sm',
  })}
        <span class="${scoreClass}">${escapeHtml(homeScore)} - ${escapeHtml(awayScore)}</span>
        ${renderTeamInlineHtml(awayTeam, {
    fallback: 'Away',
    marginClass: 'me-0',
    className: 'ptw-team-flag ptw-team-flag--sm',
  })}
      </div>
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderComparisonVerdict(item) {
  const result = item.match?.result ?? {};

  if (!result.published) {
    return `
      <div class="ptw-prediction-comparison__verdict ptw-prediction-comparison__verdict--pending" aria-label="Awaiting result">
        <span class="ptw-prediction-comparison__verdict-icon">
          <i class="bi bi-hourglass-split" aria-hidden="true"></i>
        </span>
        <span class="ptw-prediction-comparison__verdict-text">Awaiting Result</span>
      </div>
    `;
  }

  const primaryBadge = resolvePrimaryResultBadge(item);

  if (!primaryBadge || primaryBadge.correct === null || primaryBadge.correct === undefined) {
    return '';
  }

  if (primaryBadge.correct) {
    return `
      <div class="ptw-prediction-comparison__verdict ptw-prediction-comparison__verdict--success" aria-label="Exact score matched">
        <span class="ptw-prediction-comparison__verdict-icon">
          <i class="bi bi-check-lg" aria-hidden="true"></i>
        </span>
        <span class="ptw-prediction-comparison__verdict-text">Exact Score Matched</span>
      </div>
    `;
  }

  return `
    <div class="ptw-prediction-comparison__verdict ptw-prediction-comparison__verdict--failure" aria-label="Exact score not matched">
      <span class="ptw-prediction-comparison__verdict-icon">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </span>
      <span class="ptw-prediction-comparison__verdict-text">Exact Score Not Matched</span>
    </div>
  `;
}

/**
 * @param {number} totalPoints
 * @returns {string}
 */
function renderTotalPointsEarned(totalPoints) {
  const toneClass = totalPoints > 0 ? 'text-success' : 'text-danger';

  return `
    <div class="ptw-prediction-comparison__scoring-footer">
      <span class="ptw-prediction-comparison__scoring-footer-label">Total Points Earned</span>
      <span class="ptw-prediction-comparison__scoring-footer-value ${toneClass}">${totalPoints} pts</span>
    </div>
  `;
}

/**
 * @param {string} label
 * @param {string} valueHtml
 * @param {{ centered?: boolean, showDivider?: boolean }} [options]
 * @returns {string}
 */
function renderWinnerComparisonRow(label, valueHtml, options = {}) {
  const { centered = false, showDivider = false } = options;

  if (centered) {
    return `
      <div class="ptw-prediction-comparison__winner-row ptw-prediction-comparison__winner-row--centered">
        ${showDivider ? '<hr class="ptw-prediction-comparison__winner-divider">' : ''}
        <p class="ptw-prediction-comparison__winner-inline mb-0">
          <span class="ptw-prediction-comparison__winner-label">${escapeHtml(label.toUpperCase())}:</span>
          <span class="ptw-prediction-comparison__winner-value">${valueHtml}</span>
        </p>
      </div>
    `;
  }

  return `
    <div class="ptw-prediction-comparison__winner-row">
      <span class="ptw-prediction-comparison__winner-label">${escapeHtml(label)}</span>
      <span class="ptw-prediction-comparison__winner-value">${valueHtml}</span>
    </div>
  `;
}
