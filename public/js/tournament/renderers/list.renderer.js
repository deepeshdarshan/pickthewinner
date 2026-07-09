/**
 * @fileoverview Admin tournament list renderer.
 * @module tournament/renderers/list.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { renderAdminListTabs } from '../../components/admin-list-tabs.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from '../tournament.constants.js';
import { renderStatusBadge, renderVisibilityBadge, renderActiveBadge } from './status-badge.renderer.js';
import { renderArchivedTournamentTableBody } from './archived-list.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/**
 * @returns {string}
 */
export function renderTournamentListLoading() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
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
 * @param {{ createButton?: string }} [options]
 * @returns {string}
 */
export function renderTournamentTableBody(tournaments, options = {}) {
  const createButton = options.createButton ?? `
    <a class="btn btn-ptw-primary" href="${TOURNAMENT_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Create Tournament
    </a>
  `;

  if (tournaments.length === 0) {
    return renderEmptyState({
      title: 'No Tournaments',
      message: TOURNAMENT_MESSAGES.NO_TOURNAMENTS,
      icon: 'bi-calendar-event',
      actionHtml: createButton,
    });
  }

  const tableRows = tournaments.map((tournament) => renderTournamentRow(tournament)).join('');

  return `
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0 ptw-table ptw-table--compact" aria-label="Tournaments">
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
}

/**
 * @param {Tournament[]} activeTournaments
 * @param {Tournament[]} archivedTournaments
 * @param {{ activeTabId?: string }} [options]
 * @returns {string}
 */
export function renderTournamentListPageWithTabs(activeTournaments, archivedTournaments, options = {}) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${TOURNAMENT_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Create Tournament
    </a>
  `;

  const activeBody = renderTournamentTableBody(activeTournaments, { createButton });
  const archivedBody = renderArchivedTournamentTableBody(archivedTournaments);

  const tabs = renderAdminListTabs({
    groupId: 'ptw-tournament-list-tabs',
    activeTabId: options.activeTabId,
    tabs: [
      {
        id: 'active',
        label: 'Active',
        count: activeTournaments.length,
        contentHtml: `
          <div class="card ptw-card">
            <div class="card-body" data-ptw-tournament-tab="active">
              ${activeBody}
            </div>
          </div>
        `,
      },
      {
        id: 'archived',
        label: 'Archived',
        count: archivedTournaments.length,
        contentHtml: `
          <div class="card ptw-card">
            <div class="card-body" data-ptw-tournament-tab="archived">
              ${archivedBody}
            </div>
          </div>
        `,
      },
    ],
  });

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Tournaments',
    subtitle: 'Create, configure, and manage active and archived tournaments',
    actionsHtml: activeTournaments.length > 0 ? createButton : '',
  })}
      ${tabs}
    </div>
  `;
}

/**
 * @param {Tournament[]} tournaments
 * @returns {string}
 * @deprecated Use renderTournamentListPageWithTabs instead.
 */
export function renderTournamentListPage(tournaments) {
  return renderTournamentListPageWithTabs(tournaments, [], { activeTabId: 'active' });
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

/**
 * @param {string} bodyHtml
 * @param {'active' | 'archived'} tab
 * @returns {string}
 */
export function renderTournamentTabPaneBody(bodyHtml, tab) {
  return `
    <div class="card ptw-card">
      <div class="card-body" data-ptw-tournament-tab="${tab}">
        ${bodyHtml}
      </div>
    </div>
  `;
}
