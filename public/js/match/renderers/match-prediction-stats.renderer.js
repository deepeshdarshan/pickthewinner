/**
 * @fileoverview Shared prediction stats row for contestant match cards.
 * @module match/renderers/match-prediction-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { PredictionDomain } from '../../domain/prediction.domain.js';
import { renderPredictedWinnerHtml } from '../../prediction/admin/renderers/prediction-display.renderer.js';
import { renderPerformanceCardStats } from '../../shared/cards/performance-card.component.js';

/**
 * @typedef {Object} MatchPredictionStatsOptions
 * @property {boolean} [showResult=false]
 * @property {string} [myPredictionLabelExtraHtml]
 */

/**
 * @param {import('../match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {MatchPredictionStatsOptions} [options]
 * @returns {import('../../shared/cards/performance-card.component.js').PerformanceCardStat[]}
 */
export function buildMatchPredictionStats(match, prediction, options = {}) {
  const { showResult = false, myPredictionLabelExtraHtml = '' } = options;
  const predictedScore = prediction
    ? `${prediction.homeScore} - ${prediction.awayScore}`
    : '—';
  const hasPredictedWinner = Boolean(prediction && PredictionDomain.resolvePredictedWinnerSide(prediction));
  const predictedWinnerValue = hasPredictedWinner
    ? renderPredictedWinnerHtml(match, prediction)
    : '—';
  const officialScore = showResult && match.result?.published
    ? `${match.result.homeScore} - ${match.result.awayScore}`
    : 'Pending';

  return [
    {
      icon: 'bi-bullseye',
      value: escapeHtml(String(predictedScore)),
      label: 'My Prediction',
      tone: prediction ? 'primary' : 'warning',
      labelExtraHtml: myPredictionLabelExtraHtml,
    },
    {
      icon: 'bi-trophy-fill',
      value: predictedWinnerValue,
      label: 'Predicted Winner',
      tone: hasPredictedWinner ? 'success' : 'default',
    },
    {
      icon: 'bi-flag-fill',
      value: escapeHtml(String(officialScore)),
      label: 'Official Result',
      tone: showResult && match.result?.published ? 'default' : 'warning',
    },
  ];
}

/**
 * @param {import('../match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {MatchPredictionStatsOptions} [options]
 * @returns {string}
 */
export function renderMatchPredictionStatsRow(match, prediction, options = {}) {
  return renderPerformanceCardStats(buildMatchPredictionStats(match, prediction, options));
}
