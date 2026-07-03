/**
 * @fileoverview Prediction list renderer — main admin table and filters.
 * @module prediction/admin/renderers/list.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import {
  PREDICTION_VIEW_MODE,
  PREDICTION_ADMIN_STATUS,
  PREDICTION_ADMIN_STATUS_LABELS,
  PREDICTION_SORT_FIELD,
  PREDICTION_PAGE_SIZE_OPTIONS,
  PREDICTION_MANAGEMENT_MESSAGES,
} from '../prediction-management.constants.js';
import { renderPredictionStatusBadge, renderResultBadge } from './prediction-status-badge.renderer.js';
import { renderPredictionCardList } from './prediction-card.renderer.js';
import { renderPredictionStatisticsCards } from './statistics-cards.renderer.js';

/**
 * @returns {string}
 */
export function renderPredictionListLoading() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(PREDICTION_MANAGEMENT_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(PREDICTION_MANAGEMENT_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(PREDICTION_MANAGEMENT_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Array<Record<string, unknown>>} tournaments
 * @param {string} [selectedId]
 * @returns {string}
 */
export function renderTournamentSelector(tournaments, selectedId = '') {
  const { active, archived } = partitionTournaments(tournaments);

  const renderOptions = (items) => items.map((tournament) => `
    <option value="${escapeHtml(String(tournament.id))}"${tournament.id === selectedId ? ' selected' : ''}>
      ${escapeHtml(String(tournament.name))}
    </option>
  `).join('');

  return `
    <select class="form-select bg-dark border-secondary text-white" id="predictionTournamentSelector" aria-label="Select tournament">
      <option value="">Select a tournament</option>
      ${active.length ? `<optgroup label="Active Tournaments">${renderOptions(active)}</optgroup>` : ''}
      ${archived.length ? `<optgroup label="Archived Tournaments">${renderOptions(archived)}</optgroup>` : ''}
    </select>
  `;
}

/**
 * @param {Object} options
 * @returns {string}
 */
export function renderPredictionFilters(options) {
  const {
    viewMode = PREDICTION_VIEW_MODE.LIST,
    matches = [],
    contestants = [],
    stages = [],
    filterState = {},
  } = options;

  const matchOptions = matches.map((match) => `
    <option value="${escapeHtml(match.id)}"${filterState.matchId === match.id ? ' selected' : ''}>
      ${escapeHtml(formatMatchLabel(match))}
    </option>
  `).join('');

  const contestantOptions = contestants.map((contestant) => {
    const name = String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? contestant.uid);
    return `
      <option value="${escapeHtml(String(contestant.uid))}"${filterState.contestantId === contestant.uid ? ' selected' : ''}>
        ${escapeHtml(name)}
      </option>
    `;
  }).join('');

  const stageOptions = stages.map((stage) => `
    <option value="${escapeHtml(stage)}"${filterState.stage === stage ? ' selected' : ''}>${escapeHtml(stage)}</option>
  `).join('');

  const statusOptions = Object.values(PREDICTION_ADMIN_STATUS).map((status) => `
    <option value="${escapeHtml(status)}"${filterState.status === status ? ' selected' : ''}>
      ${escapeHtml(PREDICTION_ADMIN_STATUS_LABELS[status])}
    </option>
  `).join('');

  return `
    <div class="card ptw-card mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-md-6 col-lg-3">
            <label class="form-label" for="predictionViewMode">View By</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionViewMode" aria-label="View mode">
              <option value="${PREDICTION_VIEW_MODE.LIST}"${viewMode === PREDICTION_VIEW_MODE.LIST ? ' selected' : ''}>All Predictions</option>
              <option value="${PREDICTION_VIEW_MODE.MATCH}"${viewMode === PREDICTION_VIEW_MODE.MATCH ? ' selected' : ''}>Match-wise</option>
              <option value="${PREDICTION_VIEW_MODE.CONTESTANT}"${viewMode === PREDICTION_VIEW_MODE.CONTESTANT ? ' selected' : ''}>Contestant-wise</option>
            </select>
          </div>
          <div class="col-12 col-md-6 col-lg-3${viewMode === PREDICTION_VIEW_MODE.MATCH ? '' : ' d-none'}" id="predictionMatchFilterGroup">
            <label class="form-label" for="predictionMatchFilter">Match</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionMatchFilter" aria-label="Filter by match">
              <option value="">All Matches</option>
              ${matchOptions}
            </select>
          </div>
          <div class="col-12 col-md-6 col-lg-3${viewMode === PREDICTION_VIEW_MODE.CONTESTANT ? '' : ' d-none'}" id="predictionContestantFilterGroup">
            <label class="form-label" for="predictionContestantFilter">Contestant</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionContestantFilter" aria-label="Filter by contestant">
              <option value="">Select contestant</option>
              ${contestantOptions}
            </select>
          </div>
          <div class="col-12 col-md-6 col-lg-2">
            <label class="form-label" for="predictionStageFilter">Stage</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionStageFilter" aria-label="Filter by stage">
              <option value="">All Stages</option>
              ${stageOptions}
            </select>
          </div>
          <div class="col-12 col-md-6 col-lg-2">
            <label class="form-label" for="predictionStatusFilter">Status</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionStatusFilter" aria-label="Filter by status">
              <option value="">All Status</option>
              ${statusOptions}
            </select>
          </div>
          <div class="col-12 col-lg-4">
            <label class="form-label" for="predictionSearchInput">Search</label>
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary text-white"><i class="bi bi-search" aria-hidden="true"></i></span>
              <input
                type="search"
                class="form-control bg-dark border-secondary text-white"
                id="predictionSearchInput"
                placeholder="Search contestants, matches, teams…"
                value="${escapeHtml(filterState.search ?? '')}"
                aria-label="Search predictions"
              >
            </div>
          </div>
          <div class="col-12 col-md-6 col-lg-2">
            <label class="form-label" for="predictionSortField">Sort By</label>
            <select class="form-select bg-dark border-secondary text-white" id="predictionSortField" aria-label="Sort predictions">
              <option value="${PREDICTION_SORT_FIELD.SUBMITTED_AT}">Submission Time</option>
              <option value="${PREDICTION_SORT_FIELD.MATCH_DATE}">Match Date</option>
              <option value="${PREDICTION_SORT_FIELD.CONTESTANT}">Contestant</option>
              <option value="${PREDICTION_SORT_FIELD.UPDATED_AT}">Last Updated</option>
              <option value="${PREDICTION_SORT_FIELD.STATUS}">Status</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @param {Object} options
 * @returns {string}
 */
export function renderPredictionTable(predictions, options = {}) {
  const {
    currentPage = 1,
    totalPages = 1,
    totalRecords = 0,
    pageSize = 20,
    showResults = false,
  } = options;

  if (predictions.length === 0) {
    return renderEmptyState({
      title: 'No Predictions Found',
      message: PREDICTION_MANAGEMENT_MESSAGES.NO_PREDICTIONS,
      icon: 'bi-bullseye',
    });
  }

  const rows = predictions.map((prediction, index) => {
    const contestant = prediction.contestant ?? {};
    const match = prediction.match ?? {};
    const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
    const hasResult = Boolean(result.published);
    const contestantName = String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? 'Unknown');
    const rowNumber = (currentPage - 1) * pageSize + index + 1;

    return `
      <tr class="ptw-prediction-row" data-prediction-id="${escapeHtml(prediction.id)}" tabindex="0" role="button" aria-label="View prediction by ${escapeHtml(contestantName)}">
        <td>${rowNumber}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 32 })}
            <div class="min-w-0">
              <div class="fw-semibold text-truncate">${escapeHtml(contestantName)}</div>
              <div class="small text-muted text-truncate">${escapeHtml(String(contestant.email ?? ''))}</div>
            </div>
          </div>
        </td>
        <td class="d-none d-xl-table-cell">${escapeHtml(String(prediction.tournament?.name ?? ''))}</td>
        <td>
          <div class="d-flex flex-wrap align-items-center gap-1">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
            <span class="text-muted">vs</span>
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
          </div>
        </td>
        <td class="d-none d-lg-table-cell">${escapeHtml(String(match.stage ?? match.round ?? '—'))}</td>
        <td class="fw-semibold">${escapeHtml(`${prediction.homeScore} - ${prediction.awayScore}`)}</td>
        <td class="d-none d-md-table-cell">${escapeHtml(prediction.predictedWinnerName ?? '—')}</td>
        <td>${renderPredictionStatusBadge(prediction.displayStatus ?? prediction.status)}</td>
        <td class="d-none d-lg-table-cell">${escapeHtml(formatDateTime(prediction.submittedAt) || '—')}</td>
        <td class="d-none d-xl-table-cell">${escapeHtml(formatDateTime(prediction.updatedAt) || '—')}</td>
        ${showResults && hasResult ? `
          <td class="d-none d-xl-table-cell">${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</td>
          <td class="d-none d-xl-table-cell">${renderResultBadge(prediction.winnerPredictionCorrect)}</td>
          <td class="d-none d-xl-table-cell">${renderResultBadge(prediction.exactScoreCorrect)}</td>
          <td class="fw-semibold">${escapeHtml(String(prediction.calculatedPoints ?? 0))}</td>
        ` : ''}
      </tr>
    `;
  }).join('');

  const resultHeaders = showResults ? `
    <th scope="col" class="d-none d-xl-table-cell">Actual Score</th>
    <th scope="col" class="d-none d-xl-table-cell">Winner Result</th>
    <th scope="col" class="d-none d-xl-table-cell">Exact Score</th>
    <th scope="col">Points</th>
  ` : '';

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const pageSizeOptions = PREDICTION_PAGE_SIZE_OPTIONS.map((size) => `
    <option value="${size}"${size === pageSize ? ' selected' : ''}>${size} / page</option>
  `).join('');

  return `
    <div class="d-none d-lg-block table-responsive">
      <table class="table table-hover align-middle mb-0 ptw-table" aria-label="Predictions">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Contestant</th>
            <th scope="col" class="d-none d-xl-table-cell">Tournament</th>
            <th scope="col">Match</th>
            <th scope="col" class="d-none d-lg-table-cell">Stage</th>
            <th scope="col">Predicted Score</th>
            <th scope="col" class="d-none d-md-table-cell">Predicted Winner</th>
            <th scope="col">Status</th>
            <th scope="col" class="d-none d-lg-table-cell">Submitted</th>
            <th scope="col" class="d-none d-xl-table-cell">Updated</th>
            ${resultHeaders}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="d-lg-none" aria-label="Prediction cards">
      ${renderPredictionCardList(predictions, showResults)}
    </div>

    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 p-3 border-top border-secondary">
      <p class="small text-muted mb-0">
        ${startRecord} to ${endRecord} of ${totalRecords} predictions
        <span class="d-none d-md-inline"> · Page ${currentPage} of ${totalPages}</span>
      </p>
      <div class="d-flex align-items-center gap-2">
        <select class="form-select form-select-sm bg-dark border-secondary text-white" id="predictionPageSize" aria-label="Page size" style="width: auto;">
          ${pageSizeOptions}
        </select>
        <nav aria-label="Prediction pagination">
          <ul class="pagination pagination-sm ptw-pagination mb-0">
            <li class="page-item${currentPage <= 1 ? ' disabled' : ''}">
              <button type="button" class="page-link" data-page="${currentPage - 1}" aria-label="Previous page"${currentPage <= 1 ? ' disabled' : ''}>
                <i class="bi bi-chevron-left" aria-hidden="true"></i>
              </button>
            </li>
            <li class="page-item active" aria-current="page">
              <span class="page-link">${currentPage}</span>
            </li>
            <li class="page-item${currentPage >= totalPages ? ' disabled' : ''}">
              <button type="button" class="page-link" data-page="${currentPage + 1}" aria-label="Next page"${currentPage >= totalPages ? ' disabled' : ''}>
                <i class="bi bi-chevron-right" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  `;
}

/**
 * @param {Object} options
 * @returns {string}
 */
export function renderPredictionListPage(options) {
  const {
    tournaments = [],
    selectedTournamentId = '',
    statistics,
    loadedAt,
    predictions = [],
    tableOptions = {},
    filterOptions = {},
    overviewHtml = '',
  } = options;

  const statsHtml = statistics
    ? renderPredictionStatisticsCards(statistics, loadedAt)
    : '';

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Predictions Management',
        subtitle: 'View, search, and analyze contestant predictions',
        actionsHtml: `
          <button type="button" class="btn btn-outline-secondary" id="refreshPredictionsBtn">
            <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Refresh
          </button>
        `,
      })}

      <div class="row mb-3">
        <div class="col-12 col-md-6 col-lg-4">
          <label class="form-label" for="predictionTournamentSelector">Tournament</label>
          ${renderTournamentSelector(tournaments, selectedTournamentId)}
        </div>
      </div>

      ${selectedTournamentId ? `
        <div class="mb-4" id="predictionStatsContainer">${statsHtml}</div>
        ${renderPredictionFilters(filterOptions)}
        <div class="card ptw-card">
          <div class="card-body p-0" id="predictionTableContainer">
            ${renderPredictionTable(predictions, tableOptions)}
          </div>
        </div>
        ${overviewHtml ? `<div class="mt-4" id="predictionOverviewContainer">${overviewHtml}</div>` : ''}
      ` : renderEmptyState({
        title: 'No Tournament Selected',
        message: PREDICTION_MANAGEMENT_MESSAGES.NO_TOURNAMENT,
        icon: 'bi-trophy',
      })}
    </div>
  `;
}

/**
 * @param {Array<Record<string, unknown>>} tournaments
 * @returns {{ active: Array<Record<string, unknown>>, archived: Array<Record<string, unknown>> }}
 */
function partitionTournaments(tournaments) {
  const active = [];
  const archived = [];

  for (const tournament of tournaments) {
    if (tournament.archived || tournament.status === 'archived') {
      archived.push(tournament);
    } else {
      active.push(tournament);
    }
  }

  return { active, archived };
}

/**
 * @param {Record<string, unknown>} match
 * @returns {string}
 */
function formatMatchLabel(match) {
  const home = match.homeTeam?.name ?? 'Home';
  const away = match.awayTeam?.name ?? 'Away';
  const stage = match.stage ?? match.round ?? '';
  return stage ? `${home} vs ${away} (${stage})` : `${home} vs ${away}`;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function mountPredictionListLoading(outlet) {
  outlet.innerHTML = renderPredictionListLoading();
}
