/**
 * @fileoverview Shared rank badge renderer for leaderboard and ranking lists.
 * @module shared/badges/rank-badge.component
 */

import { escapeHtml } from '../../utils/html.util.js';

/** @typedef {'table' | 'card' | 'featured'} RankBadgeVariant */

/**
 * @param {number|null|undefined} rank
 * @returns {'gold' | 'silver' | 'bronze' | 'default'}
 */
export function getRankBadgeModifier(rank) {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'default';
}

/**
 * @param {number|null|undefined} rank
 * @returns {string}
 */
export function formatRankLabel(rank) {
  if (rank === null || rank === undefined) {
    return '—';
  }

  return String(rank);
}

/**
 * @param {number|null|undefined} rank
 * @returns {string}
 */
export function getRankRowHighlightClass(rank) {
  const modifier = getRankBadgeModifier(rank);
  return modifier === 'default' ? '' : ` ptw-rank-row--${modifier}`;
}

/**
 * @param {number|null|undefined} rank
 * @returns {string}
 */
function getRankIconClass(rank) {
  if (rank === 1) return 'bi-trophy-fill';
  if (rank === 2) return 'bi-award-fill';
  if (rank === 3) return 'bi-award';
  return '';
}

/**
 * Renders a highlighted rank badge for tables, cards, and featured mobile headers.
 * @param {number|null|undefined} rank
 * @param {{ variant?: RankBadgeVariant, showLabel?: boolean, labelledBy?: string }} [options]
 * @returns {string}
 */
export function renderRankBadge(rank, options = {}) {
  const {
    variant = 'table',
    showLabel = false,
    labelledBy = 'Rank',
  } = options;
  const modifier = getRankBadgeModifier(rank);
  const label = formatRankLabel(rank);
  const iconClass = getRankIconClass(rank);
  const labelHtml = showLabel
    ? `<span class="ptw-rank-badge__label">${escapeHtml(labelledBy)}</span>`
    : '';
  const iconHtml = iconClass
    ? `<i class="bi ${iconClass} ptw-rank-badge__icon" aria-hidden="true"></i>`
    : '';

  return `
    <span
      class="ptw-rank-badge ptw-rank-badge--${modifier} ptw-rank-badge--${variant}"
      title="${escapeHtml(labelledBy)}"
      aria-label="${escapeHtml(`${labelledBy}: ${label}`)}"
    >
      ${labelHtml}
      ${iconHtml}
      <span class="ptw-rank-badge__value">${escapeHtml(label)}</span>
    </span>
  `;
}
