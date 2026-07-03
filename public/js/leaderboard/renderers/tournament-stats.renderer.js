/**
 * @fileoverview Tournament statistics renderer.
 * @module leaderboard/renderers/tournament-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * Renders tournament statistics card.
 * @param {import('../leaderboard.service.js').TournamentStatistics} stats
 * @returns {string}
 */
export function renderTournamentStats(stats) {
  return `
    <div class="card ptw-card">
      <div class="card-header">
        <h5 class="mb-0">
          <i class="bi bi-trophy me-2"></i>
          Tournament Statistics
        </h5>
      </div>
      <div class="card-body">
        <h6 class="text-primary mb-3">${escapeHtml(stats.tournamentName)}</h6>
        
        <div class="row g-3">
          <div class="col-6 col-md-3">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Contestants</div>
              <div class="fs-4 fw-bold text-primary">${stats.totalContestants}</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Total Matches</div>
              <div class="fs-4 fw-bold">${stats.totalMatches}</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Completed</div>
              <div class="fs-4 fw-bold text-success">${stats.completedMatches}</div>
            </div>
          </div>

          <div class="col-6 col-md-3">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Remaining</div>
              <div class="fs-4 fw-bold text-warning">${stats.remainingMatches}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Total Predictions</div>
              <div class="fs-4 fw-semibold">${stats.totalPredictions}</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Completion Rate</div>
              <div class="fs-4 fw-semibold">${stats.predictionCompletionPercentage}%</div>
            </div>
          </div>

          <div class="col-6 col-md-4">
            <div class="ptw-stats-tile">
              <div class="ptw-stats-tile__label">Average Accuracy</div>
              <div class="fs-4 fw-semibold">${stats.averageAccuracy}%</div>
            </div>
          </div>
        </div>

        ${stats.lastUpdated ? `
          <div class="mt-3 text-center">
            <small class="ptw-text-muted">
              <i class="bi bi-clock me-1"></i>
              Last updated: ${formatLastUpdated(stats.lastUpdated)}
            </small>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Formats last updated timestamp.
 * @param {string} isoString
 * @returns {string}
 */
function formatLastUpdated(isoString) {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Unknown';
  }
}

