/**
 * @fileoverview Shared prediction display helpers for admin list and card views.
 * @module prediction/admin/renderers/prediction-display.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import {
  renderTeamInlineHtml,
  renderTeamFlagTooltipHtml,
} from '../../../master-data/teams/team-flag.util.js';
import { PENALTY_WINNER, PredictionDomain } from '../../../domain/prediction.domain.js';
import {
  shouldShowPenaltyWinnerForPublishedResult,
} from '../../../domain/prediction-management.domain.js';

/**
 * @param {Record<string, unknown>} contestant
 * @returns {string}
 */
export function resolveContestantDisplayName(contestant) {
  const name = String(
    contestant.name
    ?? contestant.displayName
    ?? contestant.fullName
    ?? contestant.email?.split('@')[0]
    ?? '',
  ).trim();

  return name || 'Unknown';
}

/**
 * @param {Record<string, unknown>} match
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictedScoreHtml(match, prediction, options = {}) {
  const { compact = false } = options;

  if (compact) {
    return `
      <span class="d-inline-flex align-items-center gap-1 ptw-prediction-table__score">
        ${renderTeamFlagTooltipHtml(match.homeTeam, { fallback: 'TBD' })}
        <span class="fw-semibold">${escapeHtml(String(prediction.homeScore))} - ${escapeHtml(String(prediction.awayScore))}</span>
        ${renderTeamFlagTooltipHtml(match.awayTeam, { fallback: 'TBD' })}
      </span>
    `;
  }

  return `
    <div class="d-flex flex-wrap align-items-center gap-1">
      ${renderTeamInlineHtml(match.homeTeam, { fallback: 'TBD' })}
      <span class="fw-semibold">${escapeHtml(String(prediction.homeScore))} - ${escapeHtml(String(prediction.awayScore))}</span>
      ${renderTeamInlineHtml(match.awayTeam, { fallback: 'TBD' })}
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictedWinnerHtml(match, prediction, options = {}) {
  const { compact = false, result = null } = options;
  const publishedResult = /** @type {Record<string, unknown>|null} */ (result);

  if (publishedResult?.published && !shouldShowPenaltyWinnerForPublishedResult(publishedResult)) {
    return '—';
  }

  const side = PredictionDomain.resolvePredictedWinnerSide(prediction);

  if (side === PENALTY_WINNER.HOME) {
    const fallback = prediction.predictedWinnerName ?? 'TBD';
    return compact
      ? renderTeamFlagTooltipHtml(match.homeTeam, { fallback })
      : renderTeamInlineHtml(match.homeTeam, { fallback });
  }

  if (side === PENALTY_WINNER.AWAY) {
    const fallback = prediction.predictedWinnerName ?? 'TBD';
    return compact
      ? renderTeamFlagTooltipHtml(match.awayTeam, { fallback })
      : renderTeamInlineHtml(match.awayTeam, { fallback });
  }

  return '—';
}

/**
 * @param {Record<string, unknown>} match
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
export function renderActualScoreHtml(match, result, options = {}) {
  if (!result?.published) {
    return '—';
  }

  const { compact = false } = options;

  if (compact) {
    return `
      <span class="d-inline-flex align-items-center gap-1 ptw-prediction-table__score">
        ${renderTeamFlagTooltipHtml(match.homeTeam, { fallback: 'TBD' })}
        <span class="fw-semibold">${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</span>
        ${renderTeamFlagTooltipHtml(match.awayTeam, { fallback: 'TBD' })}
      </span>
    `;
  }

  return `
    <div class="d-flex flex-wrap align-items-center gap-1">
      ${renderTeamInlineHtml(match.homeTeam, { fallback: 'TBD' })}
      <span class="fw-semibold">${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</span>
      ${renderTeamInlineHtml(match.awayTeam, { fallback: 'TBD' })}
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
export function renderActualWinnerHtml(match, result, options = {}) {
  if (!result?.published) {
    return '—';
  }

  if (!shouldShowPenaltyWinnerForPublishedResult(result)) {
    return '—';
  }

  const { compact = false } = options;
  const side = PredictionDomain.resolveResultWinnerSide(result, match);

  if (side === PENALTY_WINNER.HOME) {
    return compact
      ? renderTeamFlagTooltipHtml(match.homeTeam, { fallback: 'TBD' })
      : renderTeamInlineHtml(match.homeTeam, { fallback: 'TBD' });
  }

  if (side === PENALTY_WINNER.AWAY) {
    return compact
      ? renderTeamFlagTooltipHtml(match.awayTeam, { fallback: 'TBD' })
      : renderTeamInlineHtml(match.awayTeam, { fallback: 'TBD' });
  }

  return 'Draw';
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
export function renderPointsHtml(prediction, result) {
  if (!result?.published) {
    return '—';
  }

  return escapeHtml(String(prediction.calculatedPoints ?? 0));
}
