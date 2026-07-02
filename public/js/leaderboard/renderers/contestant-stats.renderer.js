/**
 * @fileoverview Contestant statistics renderer.
 * @module leaderboard/renderers/contestant-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
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

  return `
    <div class="card ptw-card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-person-badge me-2"></i>
          My Statistics
        </h5>
      </div>
      <div class="card-body">
        <div class="row g-3">
          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Current Rank</div>
              <div class="fs-3 fw-bold text-warning">#${stats.currentRank || 'N/A'}</div>
              ${stats.previousRank ? `
                <div class="mt-2">
                  <span class="${movementClass} fw-bold">${movementIcon}</span>
                  <small class="text-muted ms-1">from #${stats.previousRank}</small>
                </div>
              ` : ''}
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Total Points</div>
              <div class="fs-3 fw-bold text-primary">${stats.totalPoints}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Accuracy</div>
              <div class="fs-3 fw-bold">${stats.accuracy}%</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Correct Winners</div>
              <div class="fs-4 fw-semibold text-success">${stats.correctWinnerCount}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Exact Scores</div>
              <div class="fs-4 fw-semibold text-info">${stats.exactScoreCount}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Bonus Points</div>
              <div class="fs-4 fw-semibold">${stats.bonusPoints}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Predictions Made</div>
              <div class="fs-4 fw-semibold">${stats.predictionsSubmitted}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="text-center p-3 bg-dark rounded">
              <div class="text-muted small mb-1">Remaining</div>
              <div class="fs-4 fw-semibold">${stats.predictionsRemaining}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

