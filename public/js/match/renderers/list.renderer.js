/**
 * @fileoverview Match list renderer — admin table and mobile cards.
 * @module match/renderers/list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { renderCountdown } from '../../components/countdown.component.js';
import { renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderPagination } from '../../components/pagination.component.js';
import {
  MATCH_MESSAGES,
  MATCH_ROUTES,
  MATCH_STATUS,
  MATCH_STATUS_LABELS,
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
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
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

/** @type {Readonly<number>} */
export const MATCH_LIST_PAGE_SIZE = 20;

/**
 * @param {EnrichedMatch[]} matches
 * @param {{
 *   tournaments?: Array<{ id: string, name: string }>,
 *   title?: string,
 *   subtitle?: string,
 *   actionsHtml?: string,
 *   showCreateFab?: boolean,
 *   allowDelete?: boolean,
 *   listRoute?: string,
 *   currentPage?: number,
 *   totalPages?: number,
 *   archivedOnly?: boolean,
 * }} [options]
 * @returns {string}
 */
export function renderMatchListPage(matches, options = {}) {
  const {
    title = 'Matches',
    subtitle = 'Create, schedule, and manage tournament matches',
    actionsHtml = '',
    showCreateFab = true,
    allowDelete = false,
    listRoute = MATCH_ROUTES.ADMIN_LIST,
    currentPage = 1,
    totalPages = 1,
    archivedOnly = false,
  } = options;

  const createButton = showCreateFab ? `
    <a class="btn btn-ptw-primary" href="${MATCH_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add Match
    </a>
  ` : '';

  const filters = renderMatchFilters(options.tournaments ?? [], { archivedOnly });
  const pagination = renderPagination({ currentPage, totalPages, basePath: `${listRoute}?` });

  const body = matches.length === 0
    ? renderEmptyState({
      title: archivedOnly ? 'No Archived Matches' : 'No Matches',
      message: archivedOnly ? MATCH_MESSAGES.NO_ARCHIVED_MATCHES : MATCH_MESSAGES.NO_MATCHES,
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
              <th scope="col">Kickoff</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>${matches.map((match) => renderMatchRow(match, { listRoute, allowDelete })).join('')}</tbody>
        </table>
      </div>
      <div class="d-lg-none ptw-match-cards">
        ${matches.map((match) => renderMatchCard(match, { listRoute, allowDelete })).join('')}
      </div>
      ${pagination ? `<div class="mt-3" id="ptw-match-pagination">${pagination}</div>` : ''}
    `;

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title,
    subtitle,
    actionsHtml: actionsHtml || createButton,
  })}
      ${filters}
      <div class="card ptw-card">
        <div class="card-body">${body}</div>
      </div>
      ${showCreateFab ? `
        <a class="btn btn-ptw-primary ptw-match-fab d-lg-none" href="${MATCH_ROUTES.ADMIN_LIST}?action=create" data-route aria-label="Add match">
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
        </a>
      ` : ''}
    </div>
  `;
}

/**
 * @param {EnrichedMatch[]} matches
 * @param {{ tournaments?: Array<{ id: string, name: string }>, currentPage?: number, totalPages?: number }} [options]
 * @returns {string}
 */
export function renderArchivedMatchListPage(matches, options = {}) {
  return renderMatchListPage(matches, {
    ...options,
    title: 'Archived Matches',
    subtitle: 'View or permanently delete archived matches',
    showCreateFab: false,
    allowDelete: true,
    archivedOnly: true,
    listRoute: MATCH_ROUTES.ARCHIVED_LIST,
    actionsHtml: `
      <a class="btn btn-outline-light" href="${MATCH_ROUTES.ADMIN_LIST}" data-route>
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Active Matches
      </a>
    `,
  });
}

/**
 * @param {Array<{ id: string, name: string }>} tournaments
 * @param {{ archivedOnly?: boolean }} [options]
 * @returns {string}
 */
export function renderMatchFilters(tournaments, options = {}) {
  const statusEntries = Object.entries(MATCH_STATUS_LABELS).filter(([value]) => (
    options.archivedOnly ? value === MATCH_STATUS.ARCHIVED : value !== MATCH_STATUS.ARCHIVED
  ));

  const statusOptions = statusEntries
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
 * @param {{ listRoute?: string, allowDelete?: boolean }} [options]
 * @returns {string}
 */
function renderMatchRow(match, options = {}) {
  const listRoute = options.listRoute ?? MATCH_ROUTES.ADMIN_LIST;
  const editUrl = `${listRoute}?id=${encodeURIComponent(match.id)}`;

  return `
    <tr data-match-id="${escapeHtml(match.id)}">
      <td><input type="checkbox" aria-label="Select match" data-ptw-match-select value="${escapeHtml(match.id)}"></td>
      <td>${match.matchNumber}</td>
      <td>${renderTeamsCell(match)}</td>
      <td>${escapeHtml(match.tournamentName ?? '')}</td>
      <td>${escapeHtml(formatKickoff(match))}</td>
      <td>${renderMatchStatusBadge(match.status)}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end flex-wrap">
          <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>Manage</a>
          ${options.allowDelete ? `
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              data-ptw-match-delete
              data-match-id="${escapeHtml(match.id)}"
            >
              Delete
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @param {{ listRoute?: string, allowDelete?: boolean }} [options]
 * @returns {string}
 */
function renderMatchCard(match, options = {}) {
  const listRoute = options.listRoute ?? MATCH_ROUTES.ADMIN_LIST;
  const editUrl = `${listRoute}?id=${encodeURIComponent(match.id)}`;
  const kickoffIso = toIso(match.kickoffUtc);

  return `
    <article class="card ptw-card ptw-match-card mb-3" data-match-id="${escapeHtml(match.id)}">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>${renderTeamsCell(match)}</div>
          ${renderMatchStatusBadge(match.status)}
        </div>
        <div class="small ptw-text-muted mb-2">
          <div>${escapeHtml(match.tournamentName ?? '')}</div>
          <div>${escapeHtml(formatKickoff(match))}</div>
        </div>
        ${kickoffIso ? renderCountdown({ targetDate: kickoffIso, label: 'Kickoff in', id: `ptw-countdown-${match.id}` }) : ''}
        <div class="mt-2 small">Prediction: ${escapeHtml(match.predictionStatus ?? '—')}</div>
        <div class="d-flex gap-2 mt-3 flex-wrap">
          <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>Manage</a>
          ${options.allowDelete ? `
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              data-ptw-match-delete
              data-match-id="${escapeHtml(match.id)}"
            >
              Delete
            </button>
          ` : ''}
        </div>
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
    <div class="d-flex align-items-center gap-2 flex-nowrap">
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
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderEmptyState({ title: 'Match', message, icon: 'bi-flag' })}
    </div>
  `;
}
