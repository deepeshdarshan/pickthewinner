/**
 * @fileoverview Shared prediction display helpers for admin list and card views.
 * @module prediction/admin/renderers/prediction-display.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { PENALTY_WINNER, PredictionDomain } from '../../../domain/prediction.domain.js';

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
export function renderPredictedScoreHtml(match, prediction) {
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
export function renderPredictedWinnerHtml(match, prediction) {
  const side = PredictionDomain.resolvePredictedWinnerSide(prediction);

  if (side === PENALTY_WINNER.HOME) {
    return renderTeamInlineHtml(match.homeTeam, { fallback: prediction.predictedWinnerName ?? 'TBD' });
  }

  if (side === PENALTY_WINNER.AWAY) {
    return renderTeamInlineHtml(match.awayTeam, { fallback: prediction.predictedWinnerName ?? 'TBD' });
  }

  return '—';
}

/**
 * @param {Record<string, unknown>} match
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
export function renderActualScoreHtml(match, result) {
  if (!result?.published) {
    return '—';
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
export function renderActualWinnerHtml(match, result) {
  if (!result?.published) {
    return '—';
  }

  const side = PredictionDomain.resolveResultWinnerSide(result, match);

  if (side === PENALTY_WINNER.HOME) {
    return renderTeamInlineHtml(match.homeTeam, { fallback: 'TBD' });
  }

  if (side === PENALTY_WINNER.AWAY) {
    return renderTeamInlineHtml(match.awayTeam, { fallback: 'TBD' });
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
