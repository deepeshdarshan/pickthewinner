/**
 * @fileoverview Match status badge renderer.
 * @module match/renderers/status-badge.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { MATCH_STATUS, MATCH_STATUS_LABELS } from '../match.constants.js';

/** @type {Readonly<Record<string, string>>} */
const STATUS_BADGE_CLASS = Object.freeze({
  [MATCH_STATUS.DRAFT]: 'bg-secondary',
  [MATCH_STATUS.PUBLISHED]: 'bg-primary',
  [MATCH_STATUS.PREDICTION_OPEN]: 'bg-success',
  [MATCH_STATUS.PREDICTION_LOCKED]: 'bg-warning text-dark',
  [MATCH_STATUS.LIVE]: 'bg-danger',
  [MATCH_STATUS.COMPLETED]: 'bg-info',
  [MATCH_STATUS.RESULT_PUBLISHED]: 'bg-success',
  [MATCH_STATUS.ARCHIVED]: 'bg-secondary',
});

/**
 * @param {string} status
 * @returns {string}
 */
export function renderMatchStatusBadge(status) {
  const label = MATCH_STATUS_LABELS[status] ?? status;
  const badgeClass = STATUS_BADGE_CLASS[status] ?? 'bg-secondary';

  return `<span class="badge ${badgeClass}">${escapeHtml(label)}</span>`;
}
