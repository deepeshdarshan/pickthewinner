/**
 * @fileoverview Tournament card component for contestant views.
 * @module components/tournament-card.component
 */

import { appSettings } from '../config/app.config.js';
import { renderStatusBadge } from './status-badge.component.js';
import { renderSeeAllUpcomingMatchesLink } from '../match/renderers/upcoming-matches-cta.renderer.js';
import { escapeHtml } from '../utils/html.util.js';
import { formatDate } from '../utils/date.util.js';

/** @type {Readonly<Record<string, { label: string, variant: 'success'|'warning'|'danger'|'info'|'muted', icon: string }>>} */
const STATUS_CONFIG = Object.freeze({
  draft: { label: 'Draft', variant: 'muted', icon: 'bi-pencil' },
  published: { label: 'Upcoming', variant: 'warning', icon: 'bi-calendar-event' },
  live: { label: 'Live', variant: 'success', icon: 'bi-broadcast' },
  completed: { label: 'Completed', variant: 'muted', icon: 'bi-check-circle' },
  archived: { label: 'Archived', variant: 'muted', icon: 'bi-archive' },
});

/**
 * @typedef {Object} TournamentCardOptions
 * @property {import('../tournament/tournament.service.js').Tournament} tournament
 * @property {number} [totalMatches]
 * @property {number} [submittedPredictions]
 * @property {boolean} [showProgress]
 * @property {string} [actionLabel]
 * @property {number} [upcomingMatchCount]
 */

/**
 * Renders a tournament card for contestants.
 * @param {TournamentCardOptions} options
 * @returns {string}
 */
export function renderTournamentCard(options) {
  const {
    tournament,
    totalMatches = 0,
    submittedPredictions = 0,
    showProgress = false,
    actionLabel = 'View Tournament',
    upcomingMatchCount = 0,
  } = options;

  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.published;
  const progressPercentage = totalMatches > 0 ? Math.round((submittedPredictions / totalMatches) * 100) : 0;
  const heroBackground = tournament.banner || appSettings.assets.dashboardHeroBanner;
  const seeAllUpcomingHtml = renderSeeAllUpcomingMatchesLink(upcomingMatchCount, {
    className: 'btn btn-ptw-secondary ptw-tournament-list-card__action-btn',
  });

  return `
    <article
      class="ptw-active-tournament-hero ptw-tournament-hero-card ptw-tournament-list-card h-100"
      style="--ptw-hero-bg: url('${escapeHtml(heroBackground)}');"
    >
      <div class="ptw-active-tournament-hero__overlay"></div>
      <div class="ptw-active-tournament-hero__body">
        <div class="ptw-active-tournament-hero__content ptw-tournament-list-card__content">
          <div class="ptw-tournament-list-card__header">
            ${renderTournamentLogo(tournament)}
            <div class="ptw-tournament-list-card__header-text">
              <h3 class="ptw-tournament-list-card__name">${escapeHtml(tournament.name)}</h3>
              ${tournament.season ? `<p class="ptw-tournament-list-card__season">${escapeHtml(tournament.season)}</p>` : ''}
              <div class="ptw-tournament-list-card__meta">
                ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
              </div>
              ${tournament.description ? `
                <p class="ptw-tournament-list-card__description">${escapeHtml(tournament.description)}</p>
              ` : ''}
              ${renderTournamentDuration(tournament)}
            </div>
          </div>

          <div class="ptw-tournament-list-card__footer">
            ${renderTournamentStats({
    showProgress,
    totalMatches,
    submittedPredictions,
    progressPercentage,
  })}

            <div class="ptw-tournament-list-card__actions">
              <a
                href="/tournaments?id=${encodeURIComponent(tournament.id)}"
                class="btn btn-ptw-primary ptw-tournament-list-card__action-btn"
                data-route
              >
                <i class="bi bi-arrow-right-circle me-2" aria-hidden="true"></i>${escapeHtml(actionLabel)}
              </a>
              ${seeAllUpcomingHtml}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @returns {string}
 */
function renderTournamentLogo(tournament) {
  if (tournament.logo) {
    return `
      <div class="ptw-active-tournament-hero__logo-wrap">
        <img
          src="${escapeHtml(tournament.logo)}"
          alt=""
          class="ptw-active-tournament-hero__logo"
        >
      </div>
    `;
  }

  return `
    <div class="ptw-active-tournament-hero__logo-wrap ptw-active-tournament-hero__logo-wrap--placeholder" aria-hidden="true">
      <i class="bi bi-trophy"></i>
    </div>
  `;
}

/**
 * @param {{
 *   showProgress: boolean,
 *   totalMatches: number,
 *   submittedPredictions: number,
 *   progressPercentage: number,
 * }} options
 * @returns {string}
 */
function renderTournamentStats(options) {
  const { showProgress, totalMatches, submittedPredictions, progressPercentage } = options;

  if (showProgress && totalMatches > 0) {
    return `
      <div class="ptw-tournament-list-card__stats ptw-active-tournament-hero__progress">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="ptw-active-tournament-hero__progress-label">Prediction Progress</span>
          <span class="ptw-active-tournament-hero__progress-value">${submittedPredictions} / ${totalMatches}</span>
        </div>
        <div
          class="ptw-active-tournament-hero__progress-bar"
          role="progressbar"
          aria-valuenow="${progressPercentage}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="Prediction progress ${submittedPredictions} of ${totalMatches}"
        >
          <span class="ptw-active-tournament-hero__progress-fill" style="width: ${progressPercentage}%;"></span>
        </div>
      </div>
    `;
  }

  if (totalMatches > 0) {
    return `
      <div class="ptw-tournament-list-card__stats">
        <div class="ptw-stat-tile text-center">
          <div class="ptw-stat-tile__value">${totalMatches}</div>
          <div class="ptw-stat-tile__label">Matches</div>
        </div>
      </div>
    `;
  }

  return '';
}

/**
 * Renders tournament duration.
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @returns {string}
 */
function renderTournamentDuration(tournament) {
  if (!tournament.registrationStart && !tournament.registrationEnd) {
    return '';
  }

  const start = tournament.registrationStart instanceof Date
    ? tournament.registrationStart
    : tournament.registrationStart?.toDate?.() ?? null;

  const end = tournament.registrationEnd instanceof Date
    ? tournament.registrationEnd
    : tournament.registrationEnd?.toDate?.() ?? null;

  if (!start && !end) {
    return '';
  }

  return `
    <p class="ptw-tournament-list-card__duration mb-0 mt-2">
      <i class="bi bi-calendar-range me-1" aria-hidden="true"></i>
      ${start ? escapeHtml(formatDate(start)) : 'TBD'}
      ${end ? ` - ${escapeHtml(formatDate(end))}` : ''}
    </p>
  `;
}

/**
 * Renders a compact tournament card for lists.
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @returns {string}
 */
export function renderCompactTournamentCard(tournament) {
  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.draft;

  return `
    <div class="card ptw-card mb-2">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              ${tournament.logo ? `
                <img src="${escapeHtml(tournament.logo)}" alt="${escapeHtml(tournament.name)}" style="width: 24px; height: 24px; object-fit: contain;">
              ` : ''}
              <strong>${escapeHtml(tournament.name)}</strong>
              ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
            </div>
            ${tournament.season ? `<small class="ptw-text-muted ms-4">${escapeHtml(tournament.season)}</small>` : ''}
          </div>
          <div>
            <a href="/tournaments?id=${encodeURIComponent(tournament.id)}" class="btn btn-sm btn-outline-primary" data-route>
              View
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}
