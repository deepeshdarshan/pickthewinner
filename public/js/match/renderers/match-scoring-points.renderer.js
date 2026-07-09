/**
 * @fileoverview Renders match scoring stakes for contestant prediction cards.
 * @module match/renderers/match-scoring-points.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {import('../../scoring/scoring.domain.js').EffectiveScoringConfig} EffectiveScoringConfig
 */

/**
 * @typedef {Object} MatchScoringPointsOptions
 * @property {boolean} [compact]
 * @property {'default'|'dashboard'} [variant]
 */

/**
 * Renders a badge indicating custom match-level scoring override.
 * @param {EffectiveScoringConfig|null|undefined} effectiveScoringConfig
 * @returns {string}
 */
export function renderCustomScoringSourceBadge(effectiveScoringConfig) {
  if (effectiveScoringConfig?.source !== 'match') {
    return '';
  }

  return '<span class="badge bg-warning text-dark"><i class="bi bi-stars me-1" aria-hidden="true"></i>Custom match points</span>';
}

/**
 * Renders configured point stakes for a match prediction card.
 * @param {EffectiveScoringConfig|null|undefined} effectiveScoringConfig
 * @param {MatchScoringPointsOptions} [options]
 * @returns {string}
 */
export function renderMatchScoringPointsHtml(effectiveScoringConfig, options = {}) {
  if (!effectiveScoringConfig) {
    return '';
  }

  const { compact = false, variant = 'default' } = options;
  const matchScorePoints = effectiveScoringConfig.correctMatchScorePoints;
  const penaltyPoints = effectiveScoringConfig.correctPenaltyWinnerPoints;
  const showPenalty = effectiveScoringConfig.showPenaltyWinnerPoints;

  if (compact && variant === 'dashboard') {
    const parts = [
      `<span class="ptw-match-scoring-points__pill">Exact Score (90' + ET) [${escapeHtml(String(matchScorePoints))} pts]</span>`,
    ];

    if (showPenalty) {
      parts.push(
        `<span class="ptw-match-scoring-points__pill">Penalty Winner (if applicable) [${escapeHtml(String(penaltyPoints))} pts]</span>`,
      );
    }

    return `
      <div class="ptw-match-scoring-points ptw-match-scoring-points--dashboard d-flex flex-wrap justify-content-center gap-2">
        ${parts.join('')}
      </div>
    `;
  }

  if (compact) {
    const parts = [
      `<span class="ptw-match-scoring-points__compact-item"><i class="bi bi-bullseye me-1" aria-hidden="true"></i>${escapeHtml(String(matchScorePoints))} pts</span>`,
    ];

    if (showPenalty) {
      parts.push(
        `<span class="ptw-match-scoring-points__compact-item"><i class="bi bi-shield-check me-1" aria-hidden="true"></i>${escapeHtml(String(penaltyPoints))} pts</span>`,
      );
    }

    return `
      <div class="ptw-match-scoring-points ptw-match-scoring-points--compact small ptw-text-muted d-flex flex-wrap gap-2">
        ${parts.join('')}
      </div>
    `;
  }

  const penaltyRow = showPenalty
    ? `
        <div class="ptw-match-scoring-points__row">
          <span class="ptw-match-scoring-points__label">
            <i class="bi bi-shield-check me-1" aria-hidden="true"></i>Penalty Winner
          </span>
          <span class="ptw-match-scoring-points__value">${escapeHtml(String(penaltyPoints))} pts</span>
        </div>
      `
    : '';

  return `
    <div class="ptw-match-scoring-points mt-3 pt-3 border-top">
      <h6 class="mb-2">Points at Stake</h6>
      <div class="ptw-match-scoring-points__rows">
        <div class="ptw-match-scoring-points__row">
          <span class="ptw-match-scoring-points__label">
            <i class="bi bi-bullseye me-1" aria-hidden="true"></i>Exact Score (90' + ET)
          </span>
          <span class="ptw-match-scoring-points__value">${escapeHtml(String(matchScorePoints))} pts</span>
        </div>
        ${penaltyRow}
      </div>
    </div>
  `;
}
