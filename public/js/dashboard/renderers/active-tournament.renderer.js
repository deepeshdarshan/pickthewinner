/**
 * @fileoverview Active tournament hero section for contestant dashboard.
 * @module dashboard/renderers/active-tournament.renderer
 */

import { appSettings } from '../../config/app.config.js';
import { renderStatusBadge } from '../../components/status-badge.component.js';
import { renderSeeAllUpcomingMatchesLink } from '../../match/renderers/upcoming-matches-cta.renderer.js';
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
  const heroBackground = tournament.banner || appSettings.assets.dashboardHeroBanner;

  return `
    <section
      class="ptw-active-tournament-hero mb-4"
      aria-labelledby="ptw-active-tournament-heading"
      style="--ptw-hero-bg: url('${escapeHtml(heroBackground)}');"
    >
      <div class="ptw-active-tournament-hero__overlay"></div>
      <div class="ptw-active-tournament-hero__body">
        <div class="ptw-active-tournament-hero__content">
          <div class="d-flex align-items-start gap-3">
            ${tournament.logo ? `
              <div class="ptw-active-tournament-hero__logo-wrap">
                <img
                  src="${escapeHtml(tournament.logo)}"
                  alt=""
                  class="ptw-active-tournament-hero__logo"
                >
              </div>
            ` : ''}
            <div class="min-w-0 flex-grow-1">
              <p class="ptw-active-tournament-hero__label mb-1">Active Tournament</p>
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
            <div class="ptw-active-tournament-hero__progress">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="ptw-active-tournament-hero__progress-label">Prediction Progress</span>
                <span class="ptw-active-tournament-hero__progress-value">${submittedPredictions} / ${totalMatches}</span>
              </div>
              <div class="ptw-active-tournament-hero__progress-bar" role="progressbar"
                aria-valuenow="${progressPercentage}"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Prediction progress ${submittedPredictions} of ${totalMatches}"
              >
                <span class="ptw-active-tournament-hero__progress-fill" style="width: ${progressPercentage}%;"></span>
              </div>
            </div>
          ` : ''}

          <div class="ptw-active-tournament-hero__actions">
            <a
              href="/tournaments?id=${encodeURIComponent(tournament.id)}"
              class="btn btn-ptw-primary ptw-active-tournament-hero__cta"
              data-route
            >
              <i class="bi bi-eye me-2" aria-hidden="true"></i>View Tournament
            </a>
            ${renderSeeAllUpcomingMatchesLink(data.upcomingMatches.length, {
    className: 'btn btn-ptw-secondary ptw-active-tournament-hero__cta',
  })}
          </div>
        </div>
      </div>
    </section>
  `;
}
