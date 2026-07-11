/**
 * @fileoverview Tournament detail hero section for contestant views.
 * @module tournament/renderers/tournament-detail.renderer
 */

import { appSettings } from '../../config/app.config.js';
import { renderStatusBadge } from '../../components/status-badge.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderTournamentCardLogo } from './tournament-card.renderer.js';

/** @type {Readonly<Record<string, { label: string, variant: 'success'|'warning'|'danger'|'info'|'muted', icon: string }>>} */
const STATUS_CONFIG = Object.freeze({
  draft: { label: 'Draft', variant: 'muted', icon: 'bi-pencil' },
  published: { label: 'Upcoming', variant: 'warning', icon: 'bi-calendar-event' },
  live: { label: 'Live', variant: 'success', icon: 'bi-broadcast' },
  completed: { label: 'Completed', variant: 'muted', icon: 'bi-check-circle' },
  archived: { label: 'Archived', variant: 'muted', icon: 'bi-archive' },
});

/**
 * @param {import('../tournament.service.js').Tournament} tournament
 * @param {{
 *   totalMatches: number,
 *   submittedPredictions: number,
 * }} stats
 * @returns {string}
 */
export function renderTournamentDetailHero(tournament, stats) {
  const { totalMatches, submittedPredictions } = stats;
  const progressPercentage = totalMatches > 0
    ? Math.round((submittedPredictions / totalMatches) * 100)
    : 0;
  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.published;
  const heroBackground = tournament.banner || appSettings.assets.dashboardHeroBanner;
  const seasonLabel = String(tournament.season ?? '').trim();
  const description = String(tournament.description ?? '').trim();

  return `
    <section
      class="ptw-active-tournament-hero ptw-tournament-detail-hero mb-4"
      aria-labelledby="ptw-tournament-detail-heading"
      style="--ptw-hero-bg: url('${escapeHtml(heroBackground)}');"
    >
      <div class="ptw-active-tournament-hero__overlay"></div>
      <div class="ptw-active-tournament-hero__body">
        <div class="ptw-active-tournament-hero__content ptw-tournament-detail-hero__content">
          <div class="d-flex align-items-start gap-3">
            ${renderTournamentCardLogo(tournament)}
            <div class="min-w-0 flex-grow-1">
              <p class="ptw-active-tournament-hero__label mb-1">
                ${escapeHtml(seasonLabel || 'Tournament')}
              </p>
              <h1 class="ptw-active-tournament-hero__name mb-2" id="ptw-tournament-detail-heading">
                ${escapeHtml(tournament.name)}
              </h1>
              ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
            </div>
          </div>

          ${description ? `
            <p class="ptw-tournament-detail-hero__description mb-0">${escapeHtml(description)}</p>
          ` : ''}

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
        </div>
      </div>
    </section>
  `;
}
