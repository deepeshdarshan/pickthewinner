/**
 * @fileoverview Team list renderer.
 * @module master-data/teams/renderers/list.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { renderTeamFlagHtml } from '../team-flag.util.js';
import { TEAM_MESSAGES, TEAM_ROUTES } from '../team.constants.js';

/**
 * @typedef {import('../team.service.js').Team} Team
 */

/**
 * @returns {string}
 */
export function renderTeamListLoading() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(TEAM_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(TEAM_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(TEAM_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Team[]} teams
 * @returns {string}
 */
export function renderTeamListPage(teams) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${TEAM_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add Team
    </a>
  `;

  const body = teams.length === 0
    ? renderEmptyState({
      title: 'No Teams',
      message: TEAM_MESSAGES.NO_TEAMS,
      icon: 'bi-people',
      actionHtml: createButton,
    })
    : `
      <div class="d-none d-lg-block table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table ptw-table--compact" aria-label="Teams">
          <thead>
            <tr>
              <th scope="col">Team</th>
              <th scope="col">Country</th>
              <th scope="col">Sport</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${teams.map((team) => renderTeamRow(team)).join('')}
          </tbody>
        </table>
      </div>
      <div class="d-lg-none ptw-admin-card-list" aria-label="Team cards">
        ${teams.map((team) => renderTeamCard(team)).join('')}
      </div>
    `;

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Teams',
    subtitle: 'Manage team master data for matches',
    actionsHtml: teams.length > 0 ? createButton : '',
  })}
      <div class="card ptw-card">
        <div class="card-body">${body}</div>
      </div>
    </div>
  `;
}

/**
 * @param {Team} team
 * @returns {string}
 */
export function renderTeamCard(team) {
  const editUrl = `${TEAM_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(team.id)}`;
  const flag = renderTeamFlagHtml(team.flagUrl);

  return `
    <article class="card ptw-card">
      <div class="card-body">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${flag}
          <div class="min-w-0 flex-grow-1">
            <h3 class="h6 mb-0">${escapeHtml(team.name)}</h3>
            ${team.shortName ? `<p class="ptw-admin-card__meta mb-0">${escapeHtml(team.shortName)}</p>` : ''}
          </div>
        </div>
        <div class="d-flex flex-wrap gap-3 mb-3 ptw-admin-card__meta">
          <span><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${escapeHtml(team.country)}</span>
          <span><i class="bi bi-trophy me-1" aria-hidden="true"></i>${escapeHtml(team.sport)}</span>
        </div>
        <div class="d-flex align-items-center justify-content-between gap-2">
          <span class="badge ${team.active ? 'bg-success' : 'bg-secondary'}">${team.active ? 'Active' : 'Inactive'}</span>
          <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>
            <i class="bi bi-pencil me-1" aria-hidden="true"></i>Edit
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {Team} team
 * @returns {string}
 */
function renderTeamRow(team) {
  const editUrl = `${TEAM_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(team.id)}`;
  const flag = renderTeamFlagHtml(team.flagUrl);

  return `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          ${flag}
          <div>
            <div class="fw-semibold">${escapeHtml(team.name)}</div>
            ${team.shortName ? `<div class="small ptw-text-muted">${escapeHtml(team.shortName)}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${escapeHtml(team.country)}</td>
      <td>${escapeHtml(team.sport)}</td>
      <td>
        <span class="badge ${team.active ? 'bg-success' : 'bg-secondary'}">${team.active ? 'Active' : 'Inactive'}</span>
      </td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>Edit</a>
      </td>
    </tr>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function mountTeamListLoading(outlet) {
  outlet.innerHTML = renderTeamListLoading();
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderTeamNotFound(message = TEAM_MESSAGES.NOT_FOUND) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderEmptyState({ title: 'Team', message, icon: 'bi-people' })}
    </div>
  `;
}
