/**
 * @fileoverview Match stage list renderer.
 * @module master-data/match-stages/renderers/list.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { MATCH_STAGE_MESSAGES, MATCH_STAGE_ROUTES } from '../match-stage.constants.js';

/**
 * @typedef {import('../match-stage.service.js').MatchStage} MatchStage
 */

/**
 * @returns {string}
 */
export function renderMatchStageListLoading() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(MATCH_STAGE_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(MATCH_STAGE_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(MATCH_STAGE_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {MatchStage[]} stages
 * @returns {string}
 */
export function renderMatchStageListPage(stages) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${MATCH_STAGE_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add Stage
    </a>
  `;

  const body = stages.length === 0
    ? renderEmptyState({
      title: 'No Match Stages',
      message: MATCH_STAGE_MESSAGES.NO_STAGES,
      icon: 'bi-diagram-3',
      actionHtml: createButton,
    })
    : `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table ptw-table--compact" aria-label="Match Stages">
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Key</th>
              <th scope="col">Sort Order</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>${stages.map((stage) => renderStageRow(stage)).join('')}</tbody>
        </table>
      </div>
    `;

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title: 'Match Stages',
    subtitle: 'Configure the stages available in the match creation form',
    actionsHtml: createButton,
  })}
      <div class="card ptw-card">
        <div class="card-body">${body}</div>
      </div>
    </div>
  `;
}

/**
 * @param {MatchStage} stage
 * @returns {string}
 */
function renderStageRow(stage) {
  const editUrl = `${MATCH_STAGE_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(stage.id)}`;

  return `
    <tr>
      <td class="fw-semibold">${escapeHtml(stage.label)}</td>
      <td><code class="ptw-text-muted">${escapeHtml(stage.value)}</code></td>
      <td>${escapeHtml(String(stage.sortOrder))}</td>
      <td>
        ${stage.active
    ? '<span class="badge bg-success-subtle text-success-emphasis border">Active</span>'
    : '<span class="badge bg-secondary-subtle text-secondary-emphasis border">Inactive</span>'}
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
export function mountMatchStageListLoading(outlet) {
  outlet.innerHTML = renderMatchStageListLoading();
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderMatchStageNotFound(message = MATCH_STAGE_MESSAGES.NOT_FOUND) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderEmptyState({
    title: 'Match Stage',
    message,
    icon: 'bi-diagram-3',
  })}
    </div>
  `;
}

