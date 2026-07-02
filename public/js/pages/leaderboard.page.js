/**
 * @fileoverview Leaderboard page — empty state when no tournaments exist.
 * @module pages/leaderboard.page
 */

import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';

/**
 * Renders the leaderboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  outlet.innerHTML = `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: 'No Tournaments Available',
            message: 'Leaderboard rankings will appear here once tournaments are published.',
            icon: 'bi-trophy',
          })}
        </div>
      </div>
    </div>
  `;
}
