/**
 * @fileoverview Archived tournaments list renderer.
 * @module tournament/renderers/archived-list.renderer
 */

import { renderEmptyState } from '../../components/empty-state.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from '../tournament.constants.js';
import { renderStatusBadge, renderVisibilityBadge } from './status-badge.renderer.js';
import { renderDashboardStyleTournamentCard } from './tournament-card.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/**
 * @param {Tournament[]} tournaments
 * @param {{ matchStatsByTournamentId?: Record<string, import('./tournament-card.renderer.js').TournamentMatchStats> }} [options]
 * @returns {string}
 */
export function renderArchivedTournamentTableBody(tournaments, options = {}) {
  const { matchStatsByTournamentId = {} } = options;
  if (tournaments.length === 0) {
    return renderEmptyState({
      title: 'No Archived Tournaments',
      message: TOURNAMENT_MESSAGES.NO_ARCHIVED_TOURNAMENTS,
      icon: 'bi-archive',
    });
  }

  const tableRows = tournaments.map((tournament) => renderArchivedTournamentRow(tournament)).join('');
  const cardList = tournaments
    .map((tournament) => renderArchivedTournamentCard(tournament, matchStatsByTournamentId[tournament.id]))
    .join('');

  return `
    <div class="d-none d-lg-block table-responsive">
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
    <div class="d-lg-none ptw-admin-card-list ptw-admin-tournament-card-list" aria-label="Archived tournament cards">
      ${cardList}
    </div>
  `;
}

/**
 * @param {Tournament} tournament
 * @param {import('./tournament-card.renderer.js').TournamentMatchStats} [stats]
 * @returns {string}
 */
export function renderArchivedTournamentCard(tournament, stats) {
  const viewUrl = `${TOURNAMENT_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(tournament.id)}&mode=view`;

  return renderDashboardStyleTournamentCard(tournament, {
    label: 'Archived Tournament',
    stats: stats ?? { totalMatches: 0, upcomingMatches: 0, liveMatches: 0 },
    actionsHtml: `
      <div class="d-flex flex-column gap-2">
        <a class="btn btn-ptw-primary ptw-active-tournament-hero__cta w-100" href="${viewUrl}" data-route>
          <i class="bi bi-eye me-2" aria-hidden="true"></i>View Tournament
        </a>
        <button
          type="button"
          class="btn btn-outline-success w-100"
          data-ptw-tournament-restore
          data-tournament-id="${escapeHtml(tournament.id)}"
        >
          <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Restore
        </button>
        <button
          type="button"
          class="btn btn-outline-danger w-100"
          data-ptw-tournament-delete
          data-tournament-id="${escapeHtml(tournament.id)}"
        >
          <i class="bi bi-trash me-1" aria-hidden="true"></i>Delete
        </button>
      </div>
    `,
  });
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
