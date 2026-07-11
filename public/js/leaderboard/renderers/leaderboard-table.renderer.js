/**
 * @fileoverview Leaderboard table renderer — desktop view.
 * @module leaderboard/renderers/leaderboard-table.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { formatDurationMs } from '../../utils/time.util.js';
import { getRankRowHighlightClass, renderRankBadge } from '../../shared/badges/rank-badge.component.js';

/**
 * @typedef {Object} LeaderboardTableOptions
 * @property {boolean} [linkProfiles]
 */

/**
 * Renders a leaderboard table for desktop.
 * @param {Array<import('../leaderboard.service.js').LeaderboardEntry>} entries
 * @param {LeaderboardTableOptions} [options]
 * @returns {string}
 */
export function renderLeaderboardTable(entries, options = {}) {
  const { linkProfiles = false } = options;

  if (!entries || entries.length === 0) {
    return '<p class="text-center text-muted">No leaderboard data available</p>';
  }

  return `
    <div class="ptw-leaderboard-table-wrap">
      <table class="table table-dark table-hover ptw-table ptw-table--compact ptw-leaderboard-table">
        <colgroup>
          <col class="ptw-leaderboard-table__rank">
          <col class="ptw-leaderboard-table__contestant">
          <col class="ptw-leaderboard-table__points">
          <col class="ptw-leaderboard-table__stat">
          <col class="ptw-leaderboard-table__stat">
          <col class="ptw-leaderboard-table__stat">
          <col class="ptw-leaderboard-table__stat">
          <col class="ptw-leaderboard-table__stat">
        </colgroup>
        <thead class="sticky-top">
          <tr>
            <th scope="col" class="ptw-leaderboard-table__rank">${renderLeaderboardTableHeader('Rank')}</th>
            <th scope="col" class="ptw-leaderboard-table__contestant">${renderLeaderboardTableHeader('Contestant')}</th>
            <th scope="col" class="text-center ptw-leaderboard-table__points">${renderLeaderboardTableHeader('Points')}</th>
            <th scope="col" class="text-center d-none d-lg-table-cell ptw-leaderboard-table__stat">${renderLeaderboardTableHeader('Winners')}</th>
            <th scope="col" class="text-center d-none d-lg-table-cell ptw-leaderboard-table__stat">${renderLeaderboardTableHeader('Exact')}</th>
            <th scope="col" class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">${renderLeaderboardTableHeader('Accuracy')}</th>
            <th scope="col" class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">${renderLeaderboardTableHeader('Predicted', 'Matches')}</th>
            <th scope="col" class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">${renderLeaderboardTableHeader('Avg Response', 'Time')}</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => renderLeaderboardRow(entry, { linkProfiles })).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders a single leaderboard table row.
 * @param {import('../leaderboard.service.js').LeaderboardEntry} entry
 * @param {LeaderboardTableOptions} options
 * @returns {string}
 */
function renderLeaderboardRow(entry, options = {}) {
  const { linkProfiles = false } = options;
  const rowHighlightClass = getRankRowHighlightClass(entry.rank);
  const nameHtml = linkProfiles
    ? `<a href="/admin/users/${escapeHtml(entry.userId)}" class="ptw-profile-link fw-semibold text-white text-decoration-none text-truncate d-block" data-route title="View profile">
        ${escapeHtml(entry.displayName)}
      </a>`
    : `<span class="fw-semibold text-truncate d-block">${escapeHtml(entry.displayName)}</span>`;

  return `
    <tr data-user-id="${escapeHtml(entry.userId)}"${rowHighlightClass ? ` class="${rowHighlightClass.trim()}"` : ''}>
      <td class="ptw-leaderboard-table__rank">
        ${renderRankBadge(entry.rank, { variant: 'table' })}
      </td>
      <td class="ptw-leaderboard-table__contestant">
        <div class="d-flex align-items-center gap-2 min-w-0">
          ${renderAvatar(entry.photoURL, entry.displayName)}
          <div class="min-w-0">
            ${nameHtml}
            ${entry.country ? `<small class="text-muted text-truncate d-block">${escapeHtml(entry.country)}</small>` : ''}
          </div>
        </div>
      </td>
      <td class="text-center ptw-leaderboard-table__points">
        <span class="badge bg-primary">${entry.totalPoints}</span>
      </td>
      <td class="text-center d-none d-lg-table-cell ptw-leaderboard-table__stat">
        <span class="text-success">${entry.correctWinnerCount}</span>
      </td>
      <td class="text-center d-none d-lg-table-cell ptw-leaderboard-table__stat">
        <span class="text-info">${entry.exactScoreCount}</span>
      </td>
      <td class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">
        ${entry.accuracy}%
      </td>
      <td class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">
        ${entry.matchesPredicted}/${entry.matchesPredicted + entry.matchesRemaining}
      </td>
      <td class="text-center d-none d-xl-table-cell ptw-leaderboard-table__stat">
        ${escapeHtml(formatDurationMs(entry.averageResponseTimeMs))}
      </td>
    </tr>
  `;
}

/**
 * Renders user avatar.
 * @param {string|null} photoURL
 * @param {string} displayName
 * @returns {string}
 */
function renderAvatar(photoURL, displayName) {
  if (photoURL) {
    return `
      <img 
        src="${escapeHtml(photoURL)}" 
        alt="${escapeHtml(displayName)}" 
        class="rounded-circle flex-shrink-0 ptw-leaderboard-table__avatar"
      />
    `;
  }

  const initial = displayName.charAt(0).toUpperCase();
  return `
    <div class="rounded-circle bg-secondary d-flex align-items-center justify-content-center flex-shrink-0 ptw-leaderboard-table__avatar">
      <span class="text-white fw-bold">${escapeHtml(initial)}</span>
    </div>
  `;
}

/**
 * @param {string} line1
 * @param {string} [line2]
 * @returns {string}
 */
function renderLeaderboardTableHeader(line1, line2 = '') {
  if (!line2) {
    return escapeHtml(line1);
  }

  return `<span class="ptw-leaderboard-table__th-label">${escapeHtml(line1)}<br>${escapeHtml(line2)}</span>`;
}
