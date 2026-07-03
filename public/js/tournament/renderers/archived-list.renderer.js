/**
 * @fileoverview Archived tournaments list renderer.
 * @module tournament/renderers/archived-list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from '../tournament.constants.js';
import { renderStatusBadge, renderVisibilityBadge } from './status-badge.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/**
 * @param {Tournament[]} tournaments
 * @returns {string}
 */
export function renderArchivedTournamentListPage(tournaments) {
  const tableRows = tournaments.length === 0
    ? ''
    : tournaments.map((tournament) => renderArchivedTournamentRow(tournament)).join('');

  const body = tournaments.length === 0
    ? renderEmptyState({
      title: 'No Archived Tournaments',
      message: TOURNAMENT_MESSAGES.NO_ARCHIVED_TOURNAMENTS,
      icon: 'bi-archive',
    })
    : `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table ptw-table--compact" aria-label="Archived tournaments">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Status</th>
              <th scope="col">Visibility</th>
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
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Archived Tournaments',
    subtitle: 'View, restore, or permanently delete archived tournaments',
    actionsHtml: `
      <a class="btn btn-outline-light" href="${TOURNAMENT_ROUTES.ADMIN_LIST}" data-route>
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Active Tournaments
      </a>
    `,
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
function renderArchivedTournamentRow(tournament) {
  const viewUrl = `${TOURNAMENT_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(tournament.id)}&mode=view`;

  return `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(tournament.name)}</div>
        <div class="small ptw-text-muted">${escapeHtml(tournament.tournamentType)}</div>
      </td>
      <td>${renderStatusBadge(tournament.status)}</td>
      <td>${renderVisibilityBadge(tournament.visibility)}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end flex-wrap">
          <a class="btn btn-sm btn-outline-light" href="${viewUrl}" data-route>View</a>
          <button
            type="button"
            class="btn btn-sm btn-outline-success"
            data-ptw-tournament-restore
            data-tournament-id="${escapeHtml(tournament.id)}"
          >
            Restore
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-danger"
            data-ptw-tournament-delete
            data-tournament-id="${escapeHtml(tournament.id)}"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  `;
}
