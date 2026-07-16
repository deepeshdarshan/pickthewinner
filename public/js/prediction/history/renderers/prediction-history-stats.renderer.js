/**
 * @fileoverview Shared prediction stats rows for history cards and detail views.
 * @module prediction/history/renderers/prediction-history-stats.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { PredictionDomain } from '../../../domain/prediction.domain.js';
import {
  renderActualWinnerHtml,
  renderPredictedWinnerHtml,
} from '../../admin/renderers/prediction-display.renderer.js';
import { renderPerformanceCardStats } from '../../../shared/cards/performance-card.component.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @typedef {Object} HistoryPredictionStatsOptions
 * @property {'card'|'detail'} [variant='card']
 */

/**
 * @param {HistoryItem} item
 * @param {HistoryPredictionStatsOptions} [options]
 * @returns {string}
 */
export function renderHistoryPredictionStatsRows(item, options = {}) {
  const { variant = 'card' } = options;
  const match = item.match ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const hasResult = Boolean(result.published);
  const hasPrediction = item.homeScore != null && item.awayScore != null;
  const predictedScore = hasPrediction
    ? `${item.homeScore} - ${item.awayScore}`
    : '—';
  const officialScore = hasResult
    ? `${result.homeScore} - ${result.awayScore}`
    : 'Pending';
  const winnerStat = resolveWinnerStatLabel(item, hasResult);

  const mainStats = renderPerformanceCardStats([
    {
      icon: 'bi-bullseye',
      value: escapeHtml(predictedScore),
      label: 'My Prediction',
      tone: 'primary',
    },
    {
      icon: 'bi-flag-fill',
      value: escapeHtml(String(officialScore)),
      label: 'Official Result',
      tone: hasResult ? 'default' : 'warning',
    },
    {
      icon: 'bi-trophy',
      value: escapeHtml(winnerStat),
      label: 'Winner',
      tone: item.winnerPredictionCorrect === true ? 'success' : item.winnerPredictionCorrect === false ? 'danger' : 'default',
    },
  ]);

  if (variant === 'detail') {
    return mainStats;
  }

  return `
    ${mainStats}
    ${renderHistoryWinnerStatsRow(match, item, result, hasResult)}
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {HistoryItem} item
 * @param {Record<string, unknown>} result
 * @param {boolean} hasResult
 * @returns {string}
 */
export function renderHistoryWinnerStatsRow(match, item, result, hasResult) {
  const hasPredictedWinner = Boolean(PredictionDomain.resolvePredictedWinnerSide(item));
  const predictedWinnerValue = hasPredictedWinner
    ? renderPredictedWinnerHtml(match, item)
    : '—';
  const officialWinnerValue = hasResult
    ? renderActualWinnerHtml(match, result)
    : 'Pending';

  return renderPerformanceCardStats([
    {
      icon: 'bi-trophy-fill',
      value: predictedWinnerValue,
      label: 'Predicted Winner',
      tone: hasPredictedWinner ? 'warning' : 'default',
    },
    {
      icon: 'bi-award-fill',
      value: officialWinnerValue,
      label: 'Official Winner',
      tone: hasResult ? 'default' : 'warning',
    },
  ], {
    className: 'ptw-performance-card__stats--winners',
    ariaLabel: 'Winner comparison',
  });
}

/**
 * @param {HistoryItem} item
 * @param {boolean} hasResult
 * @returns {string}
 */
function resolveWinnerStatLabel(item, hasResult) {
  if (!hasResult) {
    return '—';
  }

  if (item.winnerPredictionCorrect === true) {
    return 'Correct';
  }

  if (item.winnerPredictionCorrect === false) {
    return 'Incorrect';
  }

  return '—';
}
