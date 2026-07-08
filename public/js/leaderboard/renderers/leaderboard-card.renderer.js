/**
 * @fileoverview Leaderboard card renderer — mobile view.
 * @module leaderboard/renderers/leaderboard-card.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import {
  RANK_MOVEMENT,
  RANK_MOVEMENT_ICONS,
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
  return `
    <div class="card ptw-card ptw-leaderboard-card mb-3" data-user-id="${escapeHtml(entry.userId)}">
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <span class="badge ptw-leaderboard-card__rank ${rankBadgeClass}">${entry.rank}</span>
          ${renderAvatar(entry.photoURL, entry.displayName)}
          <div class="ms-3 flex-grow-1 min-w-0">
            <h6 class="ptw-leaderboard-card__name mb-0">${escapeHtml(entry.displayName)}</h6>
            ${entry.country ? `<small class="ptw-leaderboard-card__country">${escapeHtml(entry.country)}</small>` : ''}
          </div>
          ${renderMovementIndicator(entry.movement)}
        </div>

        <div class="row g-2">
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Points</div>
              <div class="ptw-leaderboard-card__stat-value ptw-leaderboard-card__stat-value--primary">${entry.totalPoints}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Accuracy</div>
              <div class="ptw-leaderboard-card__stat-value">${entry.accuracy}%</div>
            </div>
          </div>
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Winners</div>
              <div class="ptw-leaderboard-card__stat-value ptw-leaderboard-card__stat-value--success">${entry.correctWinnerCount}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Exact Scores</div>
              <div class="ptw-leaderboard-card__stat-value ptw-leaderboard-card__stat-value--info">${entry.exactScoreCount}</div>
            </div>
          </div>
        </div>

        <div class="ptw-leaderboard-card__footer">
          <div class="d-flex justify-content-between">
            <span>Predicted: ${entry.matchesPredicted}</span>
            <span>Remaining: ${entry.matchesRemaining}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders rank movement indicator (omits "new" entries).
 * @param {string} movement
 * @returns {string}
 */
function renderMovementIndicator(movement) {
  if (!movement || movement === RANK_MOVEMENT.NEW) {
    return '';
  }

  const movementIcon = RANK_MOVEMENT_ICONS[movement] || '';
  if (!movementIcon) {
    return '';
  }

  return `<span class="ptw-leaderboard-card__movement ptw-leaderboard-card__movement--${movement}" aria-hidden="true">${movementIcon}</span>`;
}

/**
 * Gets badge class for rank.
 * @param {number} rank
 * @returns {string}
 */
function getRankBadgeClass(rank) {
  if (rank === 1) return 'ptw-leaderboard-card__rank--gold';
  if (rank === 2) return 'ptw-leaderboard-card__rank--silver';
  if (rank === 3) return 'ptw-leaderboard-card__rank--bronze';
  return 'ptw-leaderboard-card__rank--default';
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
      class="ptw-leaderboard-card__avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
      style="width: 48px; height: 48px;"
    >
      <span class="fw-bold fs-5">${escapeHtml(initial)}</span>
    </div>
  `;
}

