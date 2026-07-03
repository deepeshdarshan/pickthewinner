/**
 * @fileoverview Tournament statistics renderer.
 * @module leaderboard/renderers/tournament-stats.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { renderStatTileGrid } from '../../components/statistic-card.component.js';

/**
 * Renders tournament statistics card.
 * @param {import('../leaderboard.service.js').TournamentStatistics} stats
 * @returns {string}
 */
export function renderTournamentStats(stats) {
  return `
    <div class="card ptw-card">
      <div class="card-header py-2">
        <h5 class="h6 mb-0">
          <i class="bi bi-trophy me-2"></i>
          Tournament Statistics
        </h5>
      </div>
      <div class="card-body py-2">
        <h6 class="text-primary small mb-2">${escapeHtml(stats.tournamentName)}</h6>
        ${renderStatTileGrid([
    { label: 'Contestants', value: stats.totalContestants },
    { label: 'Total Matches', value: stats.totalMatches },
    { label: 'Completed', value: stats.completedMatches },
    { label: 'Remaining', value: stats.remainingMatches },
    { label: 'Total Predictions', value: stats.totalPredictions },
    { label: 'Completion Rate', value: `${stats.predictionCompletionPercentage}%` },
    { label: 'Average Accuracy', value: `${stats.averageAccuracy}%` },
  ])}
        ${stats.lastUpdated ? `
          <div class="mt-2 text-center">
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
