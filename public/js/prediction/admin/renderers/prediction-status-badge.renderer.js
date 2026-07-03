/**
 * @fileoverview Prediction status badge renderer for admin views.
 * @module prediction/admin/renderers/prediction-status-badge.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import {
  PREDICTION_ADMIN_STATUS,
  PREDICTION_ADMIN_STATUS_LABELS,
} from '../prediction-management.constants.js';

/** @type {Readonly<Record<string, string>>} */
const STATUS_BADGE_CLASSES = Object.freeze({
  [PREDICTION_ADMIN_STATUS.NOT_SUBMITTED]: 'bg-secondary',
  [PREDICTION_ADMIN_STATUS.SUBMITTED]: 'bg-primary',
  [PREDICTION_ADMIN_STATUS.UPDATED]: 'bg-info text-dark',
  [PREDICTION_ADMIN_STATUS.LOCKED]: 'bg-warning text-dark',
  [PREDICTION_ADMIN_STATUS.SCORED]: 'bg-success',
});

/**
 * @param {string} status
 * @returns {string}
 */
export function renderPredictionStatusBadge(status) {
  const normalized = String(status);
  const label = PREDICTION_ADMIN_STATUS_LABELS[normalized] ?? normalized;
  const badgeClass = STATUS_BADGE_CLASSES[normalized] ?? 'bg-secondary';

  return `<span class="badge ${badgeClass}">${escapeHtml(label)}</span>`;
}

/**
 * @param {boolean|null|undefined} correct
 * @param {string} [label]
 * @returns {string}
 */
export function renderResultBadge(correct, label = '') {
  if (correct === null || correct === undefined) {
    return '<span class="text-muted">—</span>';
  }

  if (correct) {
    return `<span class="badge bg-success"><i class="bi bi-check-lg me-1" aria-hidden="true"></i>${escapeHtml(label || 'Correct')}</span>`;
  }

  return `<span class="badge bg-danger"><i class="bi bi-x-lg me-1" aria-hidden="true"></i>${escapeHtml(label || 'Incorrect')}</span>`;
}
