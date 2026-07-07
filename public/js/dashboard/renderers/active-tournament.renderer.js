/**
 * @fileoverview Active tournament hero section for contestant dashboard.
 * @module dashboard/renderers/active-tournament.renderer
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
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderActiveTournamentHero(data) {
  const tournament = data.activeTournament;

  if (!tournament) {
    return '';
  }

  const totalMatches = tournament.stats.totalMatches;
  const submittedPredictions = tournament.stats.predictionsSubmitted;
  const progressPercentage = totalMatches > 0
    ? Math.round((submittedPredictions / totalMatches) * 100)
    : 0;
  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.published;
  const heroImage = tournament.banner || tournament.logo || '';

  return `
    <section class="card ptw-card ptw-active-tournament-hero mb-4" aria-labelledby="ptw-active-tournament-heading">
      <div class="ptw-active-tournament-hero__body">
        <div class="ptw-active-tournament-hero__content">
          <div class="d-flex align-items-start gap-3 mb-3">
            ${tournament.logo ? `
              <img
                src="${escapeHtml(tournament.logo)}"
                alt=""
                class="ptw-active-tournament-hero__logo"
              >
            ` : ''}
            <div class="min-w-0">
              <p class="ptw-active-tournament-hero__label mb-1">Active Tournament:</p>
              <h2 class="ptw-active-tournament-hero__name mb-2" id="ptw-active-tournament-heading">
                ${escapeHtml(tournament.name)}
              </h2>
              ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
            </div>
          </div>

          ${totalMatches > 0 ? `
            <div class="ptw-active-tournament-hero__progress mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="ptw-text-muted">Prediction Progress: ${submittedPredictions}/${totalMatches}</small>
              </div>
              <div class="progress" style="height: 6px;">
                <div
                  class="progress-bar bg-primary"
                  role="progressbar"
                  style="width: ${progressPercentage}%;"
                  aria-valuenow="${progressPercentage}"
                  aria-valuemin="0"
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          ` : ''}

          <a
            href="/tournaments?id=${encodeURIComponent(tournament.id)}"
            class="btn btn-ptw-primary w-100"
            data-route
          >
            <i class="bi bi-eye me-2" aria-hidden="true"></i>View Tournament
          </a>
        </div>

        ${heroImage ? `
          <div class="ptw-active-tournament-hero__art" aria-hidden="true">
            <img src="${escapeHtml(heroImage)}" alt="">
          </div>
        ` : ''}
      </div>
    </section>
  `;
}
