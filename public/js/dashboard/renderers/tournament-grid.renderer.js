/**
 * @fileoverview Tournament grid section for contestant dashboard.
 * @module dashboard/renderers/tournament-grid.renderer
 */

import { renderStatusBadge } from '../../components/status-badge.component.js';
import { escapeHtml } from '../../utils/html.util.js';

/** @type {Readonly<Record<string, { label: string, variant: 'success'|'warning'|'danger'|'info'|'muted', icon: string }>>} */
const STATUS_CONFIG = Object.freeze({
  draft: { label: 'Draft', variant: 'muted', icon: 'bi-pencil' },
  published: { label: 'Upcoming', variant: 'warning', icon: 'bi-calendar-event' },
  live: { label: 'Live', variant: 'success', icon: 'bi-broadcast' },
  completed: { label: 'Completed', variant: 'muted', icon: 'bi-check-circle' },
  archived: { label: 'Archived', variant: 'muted', icon: 'bi-archive' },
});

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto['tournamentCards'][number]} tournament
 * @returns {string}
 */
function renderDashboardTournamentCard(tournament) {
  const stats = tournament.stats;
  const totalMatches = stats.totalMatches;
  const submittedPredictions = stats.predictionsSubmitted;
  const progressPercentage = totalMatches > 0
    ? Math.round((submittedPredictions / totalMatches) * 100)
    : 0;
  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.published;

  return `
    <article class="ptw-dashboard-tournament-card h-100">
      <div class="d-flex align-items-start gap-3 mb-3">
        ${tournament.logo ? `
          <img
            src="${escapeHtml(tournament.logo)}"
            alt=""
            class="ptw-dashboard-tournament-card__logo"
          >
        ` : ''}
        <div class="min-w-0 flex-grow-1">
          <h3 class="ptw-dashboard-tournament-card__name mb-2">${escapeHtml(tournament.name)}</h3>
          ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
        </div>
      </div>

      ${totalMatches > 0 ? `
        <div class="ptw-dashboard-tournament-card__progress mb-3">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="ptw-dashboard-tournament-card__progress-label">Prediction Progress</span>
            <span class="ptw-dashboard-tournament-card__progress-value">${submittedPredictions} / ${totalMatches}</span>
          </div>
          <div class="ptw-dashboard-tournament-card__progress-bar" role="progressbar"
            aria-valuenow="${progressPercentage}"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="ptw-dashboard-tournament-card__progress-fill" style="width: ${progressPercentage}%;"></span>
          </div>
        </div>
      ` : ''}

      <a
        href="/tournaments?id=${encodeURIComponent(tournament.id)}"
        class="btn btn-outline-primary ptw-dashboard-tournament-card__cta w-100"
        data-route
      >
        View Tournament <i class="bi bi-chevron-right ms-1" aria-hidden="true"></i>
      </a>
    </article>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderTournamentGridSection(data) {
  if (data.tournamentCards.length === 0) {
    return `
      <section class="ptw-dashboard-tournaments h-100" aria-labelledby="ptw-my-tournaments-heading">
        <div class="ptw-dashboard-section-header mb-3">
          <h2 class="ptw-dashboard-section-header__title mb-0" id="ptw-my-tournaments-heading">My Tournaments</h2>
        </div>
        <div class="card ptw-card h-100">
          <div class="card-body">
            <p class="ptw-text-muted mb-0">No tournaments available yet.</p>
          </div>
        </div>
      </section>
    `;
  }

  const cards = data.tournamentCards.map((tournament) => `
    <div class="col-12">
      ${renderDashboardTournamentCard(tournament)}
    </div>
  `).join('');

  return `
    <section class="ptw-dashboard-tournaments h-100" aria-labelledby="ptw-my-tournaments-heading">
      <div class="ptw-dashboard-section-header mb-3">
        <h2 class="ptw-dashboard-section-header__title mb-1" id="ptw-my-tournaments-heading">My Tournaments</h2>
        <p class="ptw-dashboard-section-header__subtitle mb-0">${escapeHtml(String(data.activeTournamentCount))} active tournament${data.activeTournamentCount === 1 ? '' : 's'}</p>
      </div>
      <div class="row g-3 ptw-tournament-grid">${cards}</div>
    </section>
  `;
}
