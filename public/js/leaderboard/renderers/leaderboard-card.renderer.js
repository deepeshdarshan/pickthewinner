/**
 * @fileoverview Leaderboard card renderer — mobile view.
 * @module leaderboard/renderers/leaderboard-card.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import {
  RANK_MOVEMENT_ICONS,
  RANK_MOVEMENT_COLORS,
} from '../leaderboard.constants.js';

/**
 * Renders leaderboard as card list for mobile.
 * @param {Array<import('../leaderboard.service.js').LeaderboardEntry>} entries
 * @returns {string}
 */
export function renderLeaderboardCards(entries) {
  if (!entries || entries.length === 0) {
    return '<p class="text-center text-muted">No leaderboard data available</p>';
  }

  return `
    <div class="ptw-leaderboard-cards">
      ${entries.map((entry) => renderLeaderboardCard(entry)).join('')}
    </div>
  `;
}

/**
 * Renders a single leaderboard card.
 * @param {import('../leaderboard.service.js').LeaderboardEntry} entry
 * @returns {string}
 */
function renderLeaderboardCard(entry) {
  const rankBadgeClass = getRankBadgeClass(entry.rank);
  const movementIcon = RANK_MOVEMENT_ICONS[entry.movement] || '';
  const movementClass = RANK_MOVEMENT_COLORS[entry.movement] || 'text-muted';
  return `
    <div class="card ptw-card mb-3" data-user-id="${escapeHtml(entry.userId)}">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <span class="badge ${rankBadgeClass} fs-5 me-3">${entry.rank}</span>
          ${renderAvatar(entry.photoURL, entry.displayName)}
          <div class="ms-3 flex-grow-1">
            <h6 class="mb-0 fw-semibold">${escapeHtml(entry.displayName)}</h6>
            ${entry.country ? `<small class="text-muted">${escapeHtml(entry.country)}</small>` : ''}
          </div>
          <span class="${movementClass} fw-bold fs-4">${movementIcon}</span>
        </div>

        <div class="row g-3">
          <div class="col-6">
            <div class="text-center">
              <div class="text-muted small">Points</div>
              <div class="fs-4 fw-bold text-primary">${entry.totalPoints}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="text-center">
              <div class="text-muted small">Accuracy</div>
              <div class="fs-4 fw-bold">${entry.accuracy}%</div>
            </div>
          </div>
          <div class="col-6">
            <div class="text-center">
              <div class="text-muted small">Winners</div>
              <div class="fs-5 text-success">${entry.correctWinnerCount}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="text-center">
              <div class="text-muted small">Exact Scores</div>
              <div class="fs-5 text-info">${entry.exactScoreCount}</div>
            </div>
          </div>
        </div>

        <div class="mt-3 pt-3 border-top border-secondary">
          <div class="d-flex justify-content-between text-muted small">
            <span>Predicted: ${entry.matchesPredicted}</span>
            <span>Remaining: ${entry.matchesRemaining}</span>
          </div>
        </div>
      </div>
    </div>
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
        style="width: 48px; height: 48px; object-fit: cover;"
      />
    `;
  }

  const initial = displayName.charAt(0).toUpperCase();
  return `
    <div 
      class="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
      style="width: 48px; height: 48px;"
    >
      <span class="text-white fw-bold fs-5">${escapeHtml(initial)}</span>
    </div>
  `;
}

