/**
 * @fileoverview Tournament detail renderer with lifecycle actions.
 * @module tournament/renderers/detail.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { TournamentDomain } from '../../domain/tournament.domain.js';
import { TOURNAMENT_ROUTES, TOURNAMENT_TIMEZONE_LABEL, TOURNAMENT_VALIDATION_MESSAGES } from '../tournament.constants.js';
import { renderStatusBadge, renderVisibilityBadge, renderActiveBadge } from './status-badge.renderer.js';
import { renderTournamentFormPage } from './form.renderer.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 * @typedef {Object} TournamentDetailPageOptions
 * @property {number} [incompleteVisibleMatchCount=0]
 */

/**
 * @param {Tournament} tournament
 * @param {TournamentDetailPageOptions} [options]
 * @returns {string}
 */
export function renderTournamentDetailPage(tournament, options = {}) {
  const { incompleteVisibleMatchCount = 0 } = options;
  const readOnly = TournamentDomain.isTournamentReadOnly(tournament.status) || tournament.archived;
  const formHtml = renderTournamentFormPage(tournament, { readOnly, isCreate: false });

  return formHtml.replace('</form>', `</form>${renderStatusPanel(tournament, readOnly, incompleteVisibleMatchCount)}`);
}

/**
 * @param {Tournament} tournament
 * @param {boolean} readOnly
 * @param {number} incompleteVisibleMatchCount
 * @returns {string}
 */
function renderStatusPanel(tournament, readOnly, incompleteVisibleMatchCount = 0) {
  const lifecycleActions = readOnly
    ? ''
    : renderLifecycleActions(tournament, incompleteVisibleMatchCount);

  return `
    <section class="card ptw-card ptw-tournament-form__section mt-4" aria-labelledby="ptw-tournament-status-heading">
      <div class="card-header d-flex justify-content-between align-items-center gap-2 flex-wrap">
        <h2 class="h5 mb-0" id="ptw-tournament-status-heading">Tournament Status</h2>
        <div class="d-flex gap-2 flex-wrap">
          ${renderStatusBadge(tournament.status)}
          ${renderVisibilityBadge(tournament.visibility)}
          ${renderActiveBadge(tournament.active)}
        </div>
      </div>
      <div class="card-body">
        ${renderSummaryList(tournament)}
        ${lifecycleActions}
      </div>
    </section>
  `;
}

/**
 * @param {Tournament} tournament
 * @returns {string}
 */
function renderSummaryList(tournament) {
  const config = tournament.configuration;
  const scoring = /** @type {Record<string, unknown>} */ (config.scoringConfiguration ?? {});

  return `
    <dl class="row mb-0">
      <dt class="col-sm-4">Timezone</dt>
      <dd class="col-sm-8">${escapeHtml(TOURNAMENT_TIMEZONE_LABEL)}</dd>
      <dt class="col-sm-4">Require Winner for Draw</dt>
      <dd class="col-sm-8" id="ptw-tournament-status-require-winner-for-draw">${formatBooleanLabel(config.requireWinnerSelectionForDrawPrediction ?? config.requireWinnerForDraw)}</dd>
      <dt class="col-sm-4">Match Score Points</dt>
      <dd class="col-sm-8">${escapeHtml(formatScoringPoints(scoring.correctMatchScorePoints))}</dd>
      <dt class="col-sm-4">Penalty Winner Points</dt>
      <dd class="col-sm-8">${escapeHtml(formatScoringPoints(scoring.correctPenaltyWinnerPoints))}</dd>
      <dt class="col-sm-4">Leaderboard Visible</dt>
      <dd class="col-sm-8">${formatBooleanLabel(config.leaderboardVisible)}</dd>
    </dl>
  `;
}

/**
 * Keeps match behaviour summary values in sync with form toggles.
 * @param {ParentNode} root
 * @returns {void}
 */
export function bindTournamentMatchBehaviourPreview(root) {
  const form = root.querySelector('#ptw-tournament-form');
  const requireWinnerStatus = root.querySelector('#ptw-tournament-status-require-winner-for-draw');
  const requireWinnerInput = form?.querySelector('[name="requireWinnerForDraw"]');

  if (
    !(requireWinnerInput instanceof HTMLInputElement)
    || !(requireWinnerStatus instanceof HTMLElement)
  ) {
    return;
  }

  const sync = () => {
    requireWinnerStatus.textContent = formatBooleanLabel(requireWinnerInput.checked);
  };

  requireWinnerInput.addEventListener('change', sync);
  sync();
}

/**
 * @param {unknown} value
 * @returns {'Yes'|'No'}
 */
function formatBooleanLabel(value) {
  return value ? 'Yes' : 'No';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatScoringPoints(value) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return String(value);
  }

  return 'Not configured';
}

/**
 * @param {Tournament} tournament
 * @param {number} incompleteVisibleMatchCount
 * @returns {string}
 */
function renderLifecycleActions(tournament, incompleteVisibleMatchCount = 0) {
  const actions = [];

  if (TournamentDomain.canPublishTournament(tournament.status)) {
    actions.push(renderActionButton('publish', 'Publish', 'btn-ptw-primary'));
  }

  if (TournamentDomain.canGoLive(tournament.status)) {
    actions.push(renderActionButton('go-live', 'Go Live', 'btn-success'));
  }

  if (TournamentDomain.canCompleteTournament(tournament.status)) {
    if (incompleteVisibleMatchCount > 0) {
      actions.push(`
        <p class="text-warning small mb-2 w-100" role="status">
          ${escapeHtml(TOURNAMENT_VALIDATION_MESSAGES.CANNOT_COMPLETE_INCOMPLETE_MATCHES)}
          (${incompleteVisibleMatchCount} match${incompleteVisibleMatchCount === 1 ? '' : 'es'} remaining.)
        </p>
      `);
      actions.push(renderDisabledActionButton('Mark Completed', 'Complete all visible matches before marking the tournament as completed.'));
    } else {
      actions.push(renderActionButton('complete', 'Mark Completed', 'btn-warning'));
    }
  }

  if (!tournament.active && tournament.status !== 'archived' && !tournament.archived) {
    actions.push(renderActionButton('set-active', 'Set Active', 'btn-outline-success'));
  }

  if (TournamentDomain.canArchiveTournament(tournament.status)) {
    actions.push(renderActionButton('archive', 'Archive', 'btn-outline-danger'));
  }

  if (!tournament.active) {
    actions.push(`
      <button type="button" class="btn btn-danger" data-ptw-tournament-delete>
        Delete Permanently
      </button>
    `);
  }

  if (actions.length === 0) {
    return '';
  }

  return `
    <div class="mt-4 d-flex flex-wrap gap-2" role="group" aria-label="Tournament lifecycle actions">
      ${actions.join('')}
    </div>
  `;
}

/**
 * @param {string} action
 * @param {string} label
 * @param {string} buttonClass
 * @returns {string}
 */
function renderActionButton(action, label, buttonClass) {
  return `
    <button type="button" class="btn ${buttonClass}" data-ptw-lifecycle="${action}">
      ${escapeHtml(label)}
    </button>
  `;
}

/**
 * @param {string} label
 * @param {string} title
 * @returns {string}
 */
function renderDisabledActionButton(label, title) {
  return `
    <button type="button" class="btn btn-warning" disabled title="${escapeHtml(title)}">
      ${escapeHtml(label)}
    </button>
  `;
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderTournamentNotFound(message = 'Tournament not found.') {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({ title: 'Tournament', subtitle: 'Details unavailable' })}
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card">
          <p class="mb-3">${escapeHtml(message)}</p>
          <a class="btn btn-ptw-primary" href="${TOURNAMENT_ROUTES.ADMIN_LIST}" data-route>Back to Tournaments</a>
        </div>
      </div>
    </div>
  `;
}
