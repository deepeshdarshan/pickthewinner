/**
 * @fileoverview Leaderboard card renderer — mobile view.
 * @module leaderboard/renderers/leaderboard-card.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { formatDurationMs } from '../../utils/time.util.js';
import {
  RANK_MOVEMENT,
  RANK_MOVEMENT_ICONS,
} from '../leaderboard.constants.js';
import { getRankRowHighlightClass, renderRankBadge } from '../../shared/badges/rank-badge.component.js';
import {
  renderPerformanceCardFooter,
  renderPerformanceCardFooterMeta,
  renderPerformanceCardHeader,
  renderPerformanceCardStats,
} from '../../shared/cards/performance-card.component.js';
import { adminPredictionHistoryContestantRoute } from '../../prediction/history/prediction-history.constants.js';

/**
 * Renders leaderboard as card list for mobile.
 * @param {Array<import('../leaderboard.service.js').LeaderboardEntry>} entries
 * @param {{ linkProfiles?: boolean, showViewHistory?: boolean }} [options]
 * @returns {string}
 */
export function renderLeaderboardCards(entries, options = {}) {
  const { linkProfiles = false, showViewHistory = false } = options;

  if (!entries || entries.length === 0) {
    return '<p class="text-center text-muted">No leaderboard data available</p>';
  }

  return `
    <div class="ptw-leaderboard-cards">
      ${entries.map((entry) => renderLeaderboardCard(entry, { linkProfiles, showViewHistory })).join('')}
    </div>
  `;
}

/**
 * Renders a single leaderboard card.
 * @param {import('../leaderboard.service.js').LeaderboardEntry} entry
 * @param {{ linkProfiles?: boolean, showViewHistory?: boolean }} options
 * @returns {string}
 */
function renderLeaderboardCard(entry, options = {}) {
  const { linkProfiles = false, showViewHistory = false } = options;
  const rowHighlightClass = getRankRowHighlightClass(entry.rank);
  const nameHtml = linkProfiles
    ? `<a href="/admin/users/${escapeHtml(entry.userId)}" class="ptw-profile-link ptw-performance-card__title mb-0 d-inline-block text-decoration-none" data-route title="View profile">
        ${escapeHtml(entry.displayName)}
      </a>`
    : escapeHtml(entry.displayName);
  const topPerformerBadge = entry.rank === 1
    ? '<span class="ptw-performance-card__badge"><i class="bi bi-trophy-fill" aria-hidden="true"></i> Top Performer</span>'
    : '';
  const pointsTone = entry.rank === 1 ? 'gold' : 'primary';

  return `
    <article class="card ptw-card ptw-leaderboard-card ptw-performance-card mb-3${rowHighlightClass}" data-user-id="${escapeHtml(entry.userId)}">
      <div class="card-body">
        ${renderPerformanceCardHeader({
          indicatorHtml: renderRankBadge(entry.rank, { variant: 'featured', showLabel: true }),
          avatarHtml: renderAvatar(entry.photoURL, entry.displayName),
          title: nameHtml,
          subtitle: entry.country ? escapeHtml(entry.country) : '',
          badgeHtml: topPerformerBadge,
          pointsValue: String(entry.totalPoints),
          pointsLabel: 'Points',
          pointsTone,
        })}

        ${renderPerformanceCardStats([
          {
            icon: 'bi-bullseye',
            value: `${entry.accuracy}%`,
            label: 'Accuracy',
            tone: 'primary',
          },
          {
            icon: 'bi-trophy',
            value: String(entry.correctWinnerCount),
            label: 'Winners',
            tone: 'success',
          },
          {
            icon: 'bi-bullseye',
            value: String(entry.exactScoreCount),
            label: 'Exact Scores',
            tone: 'info',
          },
        ])}

        ${renderPerformanceCardFooter({
          leftIcon: 'bi-clock',
          leftValue: escapeHtml(formatDurationMs(entry.averageResponseTimeMs)),
          leftLabel: 'Avg Response Time',
          inline: !showViewHistory,
          rightHtml: showViewHistory
            ? `
            <a
              href="${escapeHtml(adminPredictionHistoryContestantRoute(entry.userId))}"
              class="btn btn-sm btn-primary w-100"
              data-route
            >
              View History
            </a>
          `
            : `
            ${renderPerformanceCardFooterMeta([
              { icon: 'bi-bullseye', label: 'Predicted', value: entry.matchesPredicted },
              { icon: 'bi-hourglass-split', label: 'Remaining', value: entry.matchesRemaining },
            ])}
            ${renderMovementIndicator(entry.movement)}
          `,
        })}
      </div>
    </article>
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

  return `<div class="ptw-leaderboard-card__movement ptw-leaderboard-card__movement--${movement}" aria-hidden="true">${movementIcon}</div>`;
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
        class="rounded-circle flex-shrink-0"
        width="48"
        height="48"
        style="object-fit: cover;"
      />
    `;
  }

  const initial = displayName.charAt(0).toUpperCase();
  return `
    <div
      class="ptw-leaderboard-card__avatar-placeholder rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
      style="width: 48px; height: 48px;"
    >
      <span class="fw-bold fs-5">${escapeHtml(initial)}</span>
    </div>
  `;
}
