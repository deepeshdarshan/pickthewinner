/**
 * @fileoverview Tournament grid section for contestant dashboard.
 * @module dashboard/renderers/tournament-grid.renderer
 */

import { renderTournamentCard } from '../../components/tournament-card.component.js';
import { escapeHtml } from '../../utils/html.util.js';

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderTournamentGridSection(data) {
  if (data.tournamentCards.length === 0) {
    return `
      <section class="mb-4" aria-labelledby="ptw-my-tournaments-heading">
        <h2 class="h5 mb-3" id="ptw-my-tournaments-heading">My Tournaments</h2>
        <div class="card ptw-card">
          <div class="card-body">
            <p class="ptw-text-muted mb-0">No tournaments available yet.</p>
          </div>
        </div>
      </section>
    `;
  }

  const cards = data.tournamentCards.map((tournament) => {
    const stats = tournament.stats;

    return `
      <div class="col-12 col-md-6 col-xl-4">
        ${renderTournamentCard({
    tournament,
    totalMatches: stats.totalMatches,
    submittedPredictions: stats.predictionsSubmitted,
    showProgress: stats.totalMatches > 0,
  })}
      </div>
    `;
  }).join('');

  return `
    <section class="mb-4" aria-labelledby="ptw-my-tournaments-heading">
      <div class="mb-3">
        <h2 class="h5 mb-1" id="ptw-my-tournaments-heading">My Tournaments</h2>
        <p class="ptw-text-muted mb-0 small">${escapeHtml(String(data.activeTournamentCount))} active tournament${data.activeTournamentCount === 1 ? '' : 's'}</p>
      </div>
      <div class="row g-3 ptw-tournament-grid">${cards}</div>
    </section>
  `;
}
