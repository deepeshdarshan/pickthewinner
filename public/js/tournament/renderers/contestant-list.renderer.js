/**
 * @fileoverview Contestant tournament list renderer.
 * @module tournament/renderers/contestant-list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from '../tournament.constants.js';
import { renderStatusBadge } from './status-badge.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/**
 * @returns {string}
 */
export function renderContestantTournamentLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(TOURNAMENT_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(TOURNAMENT_MESSAGES.LOADING)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Tournament[]} tournaments
 * @returns {string}
 */
export function renderContestantTournamentListPage(tournaments) {
  const cards = tournaments.length === 0
    ? renderEmptyState({
      title: 'No Tournaments Available',
      message: TOURNAMENT_MESSAGES.NO_VISIBLE_TOURNAMENTS,
      icon: 'bi-calendar-event',
    })
    : `<div class="row g-4">${tournaments.map(renderContestantTournamentCard).join('')}</div>`;

  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({
    title: 'Tournaments',
    subtitle: 'Published tournaments available for predictions',
  })}
      ${cards}
    </div>
  `;
}

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
function renderContestantTournamentCard(tournament) {
  const detailUrl = `${TOURNAMENT_ROUTES.CONTESTANT_LIST}?id=${encodeURIComponent(tournament.id)}`;
  const logoHtml = tournament.logo
    ? `<img src="${escapeHtml(tournament.logo)}" alt="" class="ptw-tournament-card__logo" loading="lazy" />`
    : '<i class="bi bi-trophy ptw-tournament-card__icon" aria-hidden="true"></i>';

  return `
    <div class="col-12 col-md-6 col-xl-4">
      <article class="card ptw-card h-100">
        <div class="card-body d-flex flex-column gap-3">
          <div class="d-flex align-items-start gap-3">
            ${logoHtml}
            <div class="flex-grow-1">
              <h2 class="h5 mb-1">${escapeHtml(tournament.name)}</h2>
              <p class="small ptw-text-muted mb-2">${escapeHtml(formatTournamentMeta(tournament))}</p>
              ${renderStatusBadge(tournament.status)}
            </div>
          </div>
          <p class="mb-0 flex-grow-1">${escapeHtml(tournament.description || tournament.tournamentType)}</p>
          <a class="btn btn-outline-light mt-auto align-self-start" href="${detailUrl}" data-route>
            View Tournament
          </a>
        </div>
      </article>
    </div>
  `;
}

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
export function renderContestantTournamentDetailPage(tournament) {
  const config = tournament.configuration;

  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({
    title: tournament.name,
    subtitle: formatTournamentMeta(tournament),
    actionsHtml: `
          <a class="btn btn-outline-light" href="${TOURNAMENT_ROUTES.CONTESTANT_LIST}" data-route>All Tournaments</a>
        `,
  })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="d-flex align-items-center gap-2 mb-3">
            ${renderStatusBadge(tournament.status)}
          </div>
          <p>${escapeHtml(tournament.description || 'No description provided.')}</p>
          <dl class="row mb-0">
            <dt class="col-sm-4">Tournament Type</dt>
            <dd class="col-sm-8">${escapeHtml(tournament.tournamentType)}</dd>
            <dt class="col-sm-4">Draw Predictions</dt>
            <dd class="col-sm-8">${config.requireWinnerSelectionForDrawPrediction ? 'Require winner selection' : 'Allowed without winner'}</dd>
          </dl>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
function formatTournamentMeta(tournament) {
  const parts = [tournament.season, tournament.sport].filter((value) => Boolean(value && String(value).trim()));
  return parts.join(' · ') || tournament.tournamentType || 'Tournament';
}
