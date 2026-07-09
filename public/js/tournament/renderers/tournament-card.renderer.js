/**
 * @fileoverview Shared tournament hero card renderer — dashboard-style cards for admin lists.
 * @module tournament/renderers/tournament-card.renderer
 */

import { appSettings } from '../../config/app.config.js';
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
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 * @typedef {{ totalMatches: number, upcomingMatches: number, liveMatches: number }} TournamentMatchStats
 */

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
export function renderTournamentCardLogo(tournament) {
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
 * @param {TournamentMatchStats} stats
 * @returns {string}
 */
function renderTournamentMatchStats(stats) {
  return `
    <div class="row g-2">
      <div class="col-4">
        <div class="ptw-stat-tile text-center">
          <div class="ptw-stat-tile__value">${stats.totalMatches}</div>
          <div class="ptw-stat-tile__label">Matches</div>
        </div>
      </div>
      <div class="col-4">
        <div class="ptw-stat-tile text-center">
          <div class="ptw-stat-tile__value">${stats.upcomingMatches}</div>
          <div class="ptw-stat-tile__label">Upcoming</div>
        </div>
      </div>
      <div class="col-4">
        <div class="ptw-stat-tile text-center">
          <div class="ptw-stat-tile__value">${stats.liveMatches}</div>
          <div class="ptw-stat-tile__label">Live</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a hero-style tournament card with banner background, stats, and actions.
 * @param {Tournament} tournament
 * @param {{
 *   label?: string,
 *   stats?: TournamentMatchStats | null,
 *   actionsHtml?: string,
 *   headingId?: string,
 *   headingTag?: 'h2' | 'h3',
 *   wrapperTag?: 'section' | 'article',
 *   wrapperClass?: string,
 *   heroBackground?: string,
 * }} [options]
 * @returns {string}
 */
export function renderTournamentHeroCard(tournament, options = {}) {
  const {
    label = tournament.active ? 'Active Tournament' : 'Tournament',
    stats = null,
    actionsHtml = '',
    headingId,
    headingTag = 'h2',
    wrapperTag = 'article',
    wrapperClass = 'ptw-active-tournament-hero ptw-tournament-hero-card',
    heroBackground,
  } = options;

  const statusConfig = STATUS_CONFIG[tournament.status] ?? STATUS_CONFIG.published;
  const background = heroBackground || tournament.banner || appSettings.assets.dashboardHeroBanner;
  const headingAttr = headingId ? ` id="${escapeHtml(headingId)}"` : '';

  return `
    <${wrapperTag}
      class="${escapeHtml(wrapperClass)}"
      ${headingId ? `aria-labelledby="${escapeHtml(headingId)}"` : ''}
      style="--ptw-hero-bg: url('${escapeHtml(background)}');"
    >
      <div class="ptw-active-tournament-hero__overlay"></div>
      <div class="ptw-active-tournament-hero__body">
        <div class="ptw-active-tournament-hero__content">
          <div class="d-flex align-items-start gap-3">
            ${renderTournamentCardLogo(tournament)}
            <div class="min-w-0 flex-grow-1">
              <p class="ptw-active-tournament-hero__label mb-1">${escapeHtml(label)}</p>
              <${headingTag} class="ptw-active-tournament-hero__name mb-1"${headingAttr}>
                ${escapeHtml(tournament.name)}
              </${headingTag}>
              ${renderStatusBadge({
    label: statusConfig.label,
    variant: statusConfig.variant,
    icon: statusConfig.icon,
  })}
            </div>
          </div>

          ${stats ? renderTournamentMatchStats(stats) : ''}

          ${actionsHtml ? `<div class="ptw-tournament-hero-card__actions">${actionsHtml}</div>` : ''}
        </div>
      </div>
    </${wrapperTag}>
  `;
}

/**
 * Renders a dashboard-style tournament card for admin mobile lists.
 * @param {Tournament} tournament
 * @param {{ label?: string, stats?: TournamentMatchStats | null, actionsHtml: string }} options
 * @returns {string}
 */
export function renderDashboardStyleTournamentCard(tournament, options) {
  const { label, stats, actionsHtml } = options;

  return renderTournamentHeroCard(tournament, {
    label,
    stats,
    actionsHtml,
    headingTag: 'h3',
    wrapperTag: 'article',
  });
}
