/**
 * @fileoverview Tournament status and visibility badge renderer.
 * @module tournament/renderers/status-badge.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import {
  TOURNAMENT_STATUS_LABELS,
  TOURNAMENT_VISIBILITY_LABELS,
} from '../tournament.constants.js';

/** @type {Readonly<Record<string, string>>} */
const STATUS_BADGE_CLASS = Object.freeze({
  draft: 'text-bg-secondary',
  published: 'text-bg-primary',
  live: 'text-bg-success',
  completed: 'text-bg-warning',
  archived: 'text-bg-dark',
});

/**
 * @param {string} status
 * @returns {string}
 */
export function renderStatusBadge(status) {
  const label = TOURNAMENT_STATUS_LABELS[status] ?? status;
  const badgeClass = STATUS_BADGE_CLASS[status] ?? 'text-bg-secondary';

  return `<span class="badge ${badgeClass}">${escapeHtml(label)}</span>`;
}

/**
 * @param {string} visibility
 * @returns {string}
 */
export function renderVisibilityBadge(visibility) {
  const label = TOURNAMENT_VISIBILITY_LABELS[visibility] ?? visibility;

  return `<span class="badge text-bg-outline-light border">${escapeHtml(label)}</span>`;
}

/**
 * @param {boolean} active
 * @returns {string}
 */
export function renderActiveBadge(active) {
  if (!active) {
    return '<span class="badge text-bg-secondary">Inactive</span>';
  }

  return '<span class="badge text-bg-success">Active</span>';
}
