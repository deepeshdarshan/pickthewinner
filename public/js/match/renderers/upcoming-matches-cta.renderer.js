/**
 * @fileoverview Shared contestant CTA for browsing upcoming matches.
 * @module match/renderers/upcoming-matches-cta.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { MATCH_ROUTES } from '../match.constants.js';

/**
 * @param {number} upcomingMatchCount
 * @param {{ className?: string }} [options]
 * @returns {string}
 */
export function renderSeeAllUpcomingMatchesLink(upcomingMatchCount, options = {}) {
  const { className = 'btn btn-ptw-secondary' } = options;

  if (upcomingMatchCount <= 0) {
    return '';
  }

  const countLabel = upcomingMatchCount > 1
    ? ` (${upcomingMatchCount})`
    : '';

  return `
    <a
      href="${escapeHtml(MATCH_ROUTES.CONTESTANT_LIST)}"
      class="${escapeHtml(className)}"
      data-route
    >
      See all upcoming matches${countLabel}
      <i class="bi bi-arrow-right ms-1" aria-hidden="true"></i>
    </a>
  `;
}
