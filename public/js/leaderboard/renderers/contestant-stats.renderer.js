/**
 * @fileoverview Contestant statistics renderer.
 * @module leaderboard/renderers/contestant-stats.renderer
 */

import { renderStatTileGrid } from '../../components/statistic-card.component.js';
import { formatDurationMs } from '../../utils/time.util.js';
import {
  RANK_MOVEMENT_ICONS,
  RANK_MOVEMENT_COLORS,
} from '../leaderboard.constants.js';

/**
 * Renders contestant statistics card.
 * @param {import('../leaderboard.service.js').ContestantStatistics} stats
 * @returns {string}
 */
export function renderContestantStats(stats) {
  const movementIcon = RANK_MOVEMENT_ICONS[stats.movement] || '';
  const movementClass = RANK_MOVEMENT_COLORS[stats.movement] || 'text-muted';
  const rankDetail = stats.previousRank
    ? `<span class="${movementClass} fw-bold">${movementIcon}</span> from #${stats.previousRank}`
    : '';

  return `
    <div class="card ptw-card">
      <div class="card-header py-2">
        <h5 class="h6 mb-0">
          <i class="bi bi-person-badge me-2"></i>
          My Statistics
        </h5>
      </div>
      <div class="card-body py-2">
        ${renderStatTileGrid([
    {
      label: 'Current Rank',
      value: `#${stats.currentRank || 'N/A'}`,
      detail: rankDetail,
    },
    { label: 'Total Points', value: stats.totalPoints },
    { label: 'Accuracy', value: `${stats.accuracy}%` },
    { label: 'Correct Winners', value: stats.correctWinnerCount },
    { label: 'Exact Scores', value: stats.exactScoreCount },
    { label: 'Bonus Points', value: stats.bonusPoints },
    { label: 'Predictions Made', value: stats.predictionsSubmitted },
    { label: 'Remaining', value: stats.predictionsRemaining },
    { label: 'Avg Response Time', value: formatDurationMs(stats.averageResponseTimeMs) },
  ])}
      </div>
    </div>
  `;
}
