/**
 * @fileoverview Leaderboard table renderer — desktop view.
 * @module leaderboard/renderers/leaderboard-table.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import {
  RANK_MOVEMENT_ICONS,
  RANK_MOVEMENT_COLORS,
} from '../leaderboard.constants.js';

/**
 * Renders a leaderboard table for desktop.
 * @param {Array<import('../leaderboard.service.js').LeaderboardEntry>} entries
 * @returns {string}
 */
export function renderLeaderboardTable(entries) {
  if (!entries || entries.length === 0) {
    return '<p class="text-center text-muted">No leaderboard data available</p>';
  }

  return `
    <div class="table-responsive">
      <table class="table table-dark table-hover ptw-leaderboard-table">
        <thead class="sticky-top">
          <tr>
            <th scope="col" style="width: 60px;">Rank</th>
            <th scope="col" style="width: 60px;"></th>
            <th scope="col">Contestant</th>
            <th scope="col" class="text-center">Points</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Winners</th>
            <th scope="col" class="text-center d-none d-lg-table-cell">Exact</th>
            <th scope="col" class="text-center d-none d-xl-table-cell">Accuracy</th>
            <th scope="col" class="text-center d-none d-xl-table-cell">Predicted</th>
            <th scope="col" class="text-center" style="width: 80px;">Movement</th>
          </tr>
        </thead>
        <tbody>
          ${entries.map((entry) => renderLeaderboardRow(entry)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders a single leaderboard table row.
 * @param {import('../leaderboard.service.js').LeaderboardEntry} entry
 * @returns {string}
 */
function renderLeaderboardRow(entry) {
  const rankBadgeClass = getRankBadgeClass(entry.rank);
  const movementIcon = RANK_MOVEMENT_ICONS[entry.movement] || '';
  const movementClass = RANK_MOVEMENT_COLORS[entry.movement] || 'text-muted';
  const rowClass = entry.isCurrentUser ? 'table-primary' : '';

  return `
    <tr class="${rowClass}" data-user-id="${escapeHtml(entry.userId)}">
      <td>
        <span class="badge ${rankBadgeClass} fs-6">${entry.rank}</span>
      </td>
      <td>
        ${renderAvatar(entry.photoURL, entry.displayName)}
      </td>
      <td>
        <div class="d-flex flex-column">
          <span class="fw-semibold">${escapeHtml(entry.displayName)}</span>
          ${entry.country ? `<small class="text-muted">${escapeHtml(entry.country)}</small>` : ''}
        </div>
      </td>
      <td class="text-center">
        <span class="badge bg-primary fs-6">${entry.totalPoints}</span>
      </td>
      <td class="text-center d-none d-lg-table-cell">
        <span class="text-success">${entry.correctWinnerCount}</span>
      </td>
      <td class="text-center d-none d-lg-table-cell">
        <span class="text-info">${entry.exactScoreCount}</span>
      </td>
      <td class="text-center d-none d-xl-table-cell">
        ${entry.accuracy}%
      </td>
      <td class="text-center d-none d-xl-table-cell">
        ${entry.matchesPredicted} / ${entry.matchesPredicted + entry.matchesRemaining}
      </td>
      <td class="text-center">
        <span class="${movementClass} fw-bold">${movementIcon}</span>
      </td>
    </tr>
  `;
}

/**
 * Gets badge class for rank.
 * @param {number} rank
 * @returns {string}
 */
function getRankBadgeClass(rank) {
  if (rank === 1) return 'bg-warning text-dark';
  if (rank === 2) return 'bg-secondary';
  if (rank === 3) return 'bg-info text-dark';
  return 'bg-dark';
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
        class="rounded-circle"
        style="width: 32px; height: 32px; object-fit: cover;"
      />
    `;
  }

  const initial = displayName.charAt(0).toUpperCase();
  return `
    <div 
      class="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
      style="width: 32px; height: 32px;"
    >
      <span class="text-white fw-bold">${escapeHtml(initial)}</span>
    </div>
  `;
}

