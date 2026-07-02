/**
 * @fileoverview Admin tournament list renderer.
 * @module tournament/renderers/list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from '../tournament.constants.js';
import { renderStatusBadge, renderVisibilityBadge, renderActiveBadge } from './status-badge.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/**
 * @returns {string}
 */
export function renderTournamentListLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(TOURNAMENT_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(TOURNAMENT_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(TOURNAMENT_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Tournament[]} tournaments
 * @returns {string}
 */
export function renderTournamentListPage(tournaments) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${TOURNAMENT_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Create Tournament
    </a>
  `;

  const tableRows = tournaments.length === 0
    ? ''
    : tournaments.map((tournament) => renderTournamentRow(tournament)).join('');

  const body = tournaments.length === 0
    ? renderEmptyState({
      title: 'No Tournaments',
      message: TOURNAMENT_MESSAGES.NO_TOURNAMENTS,
      icon: 'bi-calendar-event',
      actionHtml: createButton,
    })
    : `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table" aria-label="Tournaments">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Visibility</th>
              <th scope="col">Active</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;

  return `
    <div class="container-fluid ptw-page-content">
      ${renderPageHeader({
    title: 'Tournaments',
    subtitle: 'Create, configure, and manage tournaments',
    actionsHtml: tournaments.length > 0 ? createButton : '',
  })}
      <div class="card ptw-card">
        <div class="card-body">
          ${body}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
function renderTournamentRow(tournament) {
  const editUrl = `${TOURNAMENT_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(tournament.id)}`;

  return `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(tournament.name)}</div>
        <div class="small ptw-text-muted">${escapeHtml(tournament.tournamentType)}</div>
      </td>
      <td>${renderStatusBadge(tournament.status)}</td>
      <td>${renderVisibilityBadge(tournament.visibility)}</td>
      <td>${renderActiveBadge(tournament.active)}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end flex-wrap">
          <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route aria-label="Manage ${escapeHtml(tournament.name)}">
            Manage
          </a>
          ${!tournament.active ? `
            <button
              type="button"
              class="btn btn-sm btn-outline-danger"
              data-ptw-tournament-delete
              data-tournament-id="${escapeHtml(tournament.id)}"
              aria-label="Delete ${escapeHtml(tournament.name)}"
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
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function mountTournamentListLoading(outlet) {
  outlet.innerHTML = renderTournamentListLoading();
}
