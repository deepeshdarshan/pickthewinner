/**
 * @fileoverview Match list renderer — admin table and mobile cards.
 * @module match/renderers/list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { renderCountdown } from '../../components/countdown.component.js';
import { renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../../utils/html.util.js';
import {
  MATCH_MESSAGES,
  MATCH_ROUTES,
  MATCH_ROUNDS,
  MATCH_STATUS_LABELS,
  getRoundLabel,
} from '../match.constants.js';
import { renderMatchStatusBadge } from './status-badge.renderer.js';

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 */

/**
 * @returns {string}
 */
export function renderMatchListLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(MATCH_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(MATCH_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(MATCH_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {EnrichedMatch[]} matches
 * @param {{ tournaments?: Array<{ id: string, name: string }> }} [options]
 * @returns {string}
 */
export function renderMatchListPage(matches, options = {}) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${MATCH_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add Match
    </a>
  `;

  const filters = renderFilters(options.tournaments ?? []);

  const body = matches.length === 0
    ? renderEmptyState({
      title: 'No Matches',
      message: MATCH_MESSAGES.NO_MATCHES,
      icon: 'bi-flag',
      actionHtml: createButton,
    })
    : `
      <div class="d-none d-lg-block table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table ptw-match-table" aria-label="Matches">
          <thead>
            <tr>
              <th scope="col"><input type="checkbox" aria-label="Select all matches" data-ptw-match-select-all></th>
              <th scope="col">#</th>
              <th scope="col">Match</th>
              <th scope="col">Tournament</th>
              <th scope="col">Round</th>
              <th scope="col">Kickoff</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>${matches.map((match) => renderMatchRow(match)).join('')}</tbody>
        </table>
      </div>
      <div class="d-lg-none ptw-match-cards">
        ${matches.map((match) => renderMatchCard(match)).join('')}
      </div>
    `;

  return `
    <div class="container-fluid ptw-page-content ptw-match-list-page">
      ${renderPageHeader({
    title: 'Matches',
    subtitle: 'Create, schedule, and manage tournament matches',
    actionsHtml: createButton,
  })}
      ${filters}
      <div class="card ptw-card">
        <div class="card-body">${body}</div>
      </div>
      <a class="btn btn-ptw-primary ptw-match-fab d-lg-none" href="${MATCH_ROUTES.ADMIN_LIST}?action=create" data-route aria-label="Add match">
        <i class="bi bi-plus-lg" aria-hidden="true"></i>
      </a>
    </div>
  `;
}

/**
 * @param {Array<{ id: string, name: string }>} tournaments
 * @returns {string}
 */
function renderFilters(tournaments) {
  const roundOptions = MATCH_ROUNDS.map((round) => `<option value="${escapeHtml(round.value)}">${escapeHtml(round.label)}</option>`).join('');
  const statusOptions = Object.entries(MATCH_STATUS_LABELS)
    .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`)
    .join('');

  const tournamentOptions = tournaments
    .map((tournament) => `<option value="${escapeHtml(tournament.id)}">${escapeHtml(tournament.name)}</option>`)
    .join('');

  return `
    <div class="card ptw-card mb-3 ptw-match-filters">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label" for="ptw-match-filter-search">Search</label>
            <input type="search" class="form-control" id="ptw-match-filter-search" placeholder="Search matches…">
          </div>
          <div class="col-md-2">
            <label class="form-label" for="ptw-match-filter-tournament">Tournament</label>
            <select class="form-select" id="ptw-match-filter-tournament">
              <option value="">All</option>
              ${tournamentOptions}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label" for="ptw-match-filter-round">Round</label>
            <select class="form-select" id="ptw-match-filter-round">
              <option value="">All</option>
              ${roundOptions}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label" for="ptw-match-filter-status">Status</label>
            <select class="form-select" id="ptw-match-filter-status">
              <option value="">All</option>
              ${statusOptions}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label" for="ptw-match-filter-date">Date</label>
            <input type="date" class="form-control" id="ptw-match-filter-date">
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
function renderMatchRow(match) {
  const editUrl = `${MATCH_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(match.id)}`;

  return `
    <tr data-match-id="${escapeHtml(match.id)}">
      <td><input type="checkbox" aria-label="Select match" data-ptw-match-select value="${escapeHtml(match.id)}"></td>
      <td>${match.matchNumber}</td>
      <td>${renderTeamsCell(match)}</td>
      <td>${escapeHtml(match.tournamentName ?? '')}</td>
      <td>${escapeHtml(getRoundLabel(match.round))}</td>
      <td>${escapeHtml(formatKickoff(match))}</td>
      <td>${renderMatchStatusBadge(match.status)}</td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>Manage</a>
      </td>
    </tr>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
function renderMatchCard(match) {
  const editUrl = `${MATCH_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(match.id)}`;
  const kickoffIso = toIso(match.kickoffUtc);

  return `
    <article class="card ptw-card ptw-match-card mb-3" data-match-id="${escapeHtml(match.id)}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>${renderTeamsCell(match)}</div>
          ${renderMatchStatusBadge(match.status)}
        </div>
        <div class="small ptw-text-muted mb-2">
          <div>${escapeHtml(match.tournamentName ?? '')} · ${escapeHtml(getRoundLabel(match.round))}</div>
          <div>${escapeHtml(formatKickoff(match))}</div>
        </div>
        ${kickoffIso ? renderCountdown({ targetDate: kickoffIso, label: 'Kickoff in', id: `ptw-countdown-${match.id}` }) : ''}
        <div class="mt-2 small">Prediction: ${escapeHtml(match.predictionStatus ?? '—')}</div>
        <a class="btn btn-sm btn-outline-light mt-3" href="${editUrl}" data-route>Manage</a>
      </div>
    </article>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
function renderTeamsCell(match) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const homeFlag = renderTeamFlagHtml(home?.flagUrl, { marginClass: 'me-1' });
  const awayFlag = renderTeamFlagHtml(away?.flagUrl, { marginClass: 'me-1' });

  return `
    <div class="d-flex align-items-center gap-2 flex-wrap">
      <span>${homeFlag}${escapeHtml(home?.name ?? 'Home')}</span>
      <span class="ptw-text-muted">vs</span>
      <span>${awayFlag}${escapeHtml(away?.name ?? 'Away')}</span>
    </div>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
function formatKickoff(match) {
  const date = toDate(match.kickoffUtc);
  if (!date) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function toIso(value) {
  const date = toDate(value);
  return date ? date.toISOString() : '';
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function mountMatchListLoading(outlet) {
  outlet.innerHTML = renderMatchListLoading();
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderMatchNotFound(message = MATCH_MESSAGES.NOT_FOUND) {
  return `
    <div class="container ptw-page-content">
      ${renderEmptyState({ title: 'Match', message, icon: 'bi-flag' })}
    </div>
  `;
}
