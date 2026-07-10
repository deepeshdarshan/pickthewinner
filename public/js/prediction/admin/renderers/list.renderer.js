/**
 * @fileoverview Prediction list renderer — main admin table and filters.
 * @module prediction/admin/renderers/list.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import {
  PREDICTION_VIEW_MODE,
  PREDICTION_ADMIN_STATUS,
  PREDICTION_ADMIN_STATUS_LABELS,
  PREDICTION_SORT_FIELD,
  PREDICTION_PAGE_SIZE_OPTIONS,
  PREDICTION_MANAGEMENT_MESSAGES,
} from '../prediction-management.constants.js';
import { renderPredictionCardList } from './prediction-card.renderer.js';
import { renderPredictionStatisticsCards } from './statistics-cards.renderer.js';
import { renderFilterBar, renderFilterField } from '../../../components/filter-bar.component.js';
import {
  resolveContestantDisplayName,
  renderPredictedScoreHtml,
  renderPredictedWinnerHtml,
  renderActualScoreHtml,
  renderActualWinnerHtml,
  renderPointsHtml,
} from './prediction-display.renderer.js';

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
    <select class="form-select" id="predictionTournamentSelector" aria-label="Select tournament">
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
    tournaments = [],
    selectedTournamentId = '',
    filterState = {},
    sortField = PREDICTION_SORT_FIELD.SUBMITTED_AT,
  } = options;

  const matchOptions = matches.map((match) => `
    <option value="${escapeHtml(match.id)}"${filterState.matchId === match.id ? ' selected' : ''}>
      ${escapeHtml(formatMatchLabel(match))}
    </option>
  `).join('');

  const contestantOptions = contestants.map((contestant) => {
    const name = resolveContestantDisplayName(contestant);
    return `
      <option value="${escapeHtml(String(contestant.uid))}"${filterState.contestantId === contestant.uid ? ' selected' : ''}>
        ${escapeHtml(name)}
      </option>
    `;
  }).join('');

  const statusOptions = Object.values(PREDICTION_ADMIN_STATUS).map((status) => `
    <option value="${escapeHtml(status)}"${filterState.status === status ? ' selected' : ''}>
      ${escapeHtml(PREDICTION_ADMIN_STATUS_LABELS[status])}
    </option>
  `).join('');

  const fieldsHtml = [
    renderFilterField({
      label: 'Tournament',
      id: 'predictionTournamentSelector',
      width: 'wide',
      html: renderTournamentSelector(tournaments, selectedTournamentId),
    }),
    renderFilterField({
      label: 'View By',
      id: 'predictionViewMode',
      html: `
        <select class="form-select" id="predictionViewMode" aria-label="View mode">
          <option value="${PREDICTION_VIEW_MODE.LIST}"${viewMode === PREDICTION_VIEW_MODE.LIST ? ' selected' : ''}>All Predictions</option>
          <option value="${PREDICTION_VIEW_MODE.MATCH}"${viewMode === PREDICTION_VIEW_MODE.MATCH ? ' selected' : ''}>Match-wise</option>
          <option value="${PREDICTION_VIEW_MODE.CONTESTANT}"${viewMode === PREDICTION_VIEW_MODE.CONTESTANT ? ' selected' : ''}>Contestant-wise</option>
        </select>
      `,
    }),
    renderFilterField({
      label: 'Match',
      id: 'predictionMatchFilter',
      html: `
        <select class="form-select" id="predictionMatchFilter" aria-label="Filter by match"${viewMode !== PREDICTION_VIEW_MODE.MATCH ? ' disabled' : ''}>
          <option value="">All Matches</option>
          ${matchOptions}
        </select>
      `,
    }),
    renderFilterField({
      label: 'Contestant',
      id: 'predictionContestantFilter',
      html: `
        <select class="form-select" id="predictionContestantFilter" aria-label="Filter by contestant">
          <option value="">All Contestants</option>
          ${contestantOptions}
        </select>
      `,
    }),
    renderFilterField({
      label: 'Status',
      id: 'predictionStatusFilter',
      html: `
        <select class="form-select" id="predictionStatusFilter" aria-label="Filter by status">
          <option value="">All Status</option>
          ${statusOptions}
        </select>
      `,
    }),
    renderFilterField({
      label: 'Search',
      id: 'predictionSearchInput',
      width: 'search',
      html: `
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            id="predictionSearchInput"
            placeholder="Search contestants, matches, teams…"
            value="${escapeHtml(filterState.search ?? '')}"
            aria-label="Search predictions"
          >
          <button
            type="button"
            class="btn btn-ptw-primary"
            id="predictionSearchBtn"
            aria-label="Search predictions"
          >
            <i class="bi bi-search me-1" aria-hidden="true"></i>Search
          </button>
        </div>
      `,
    }),
    renderFilterField({
      label: 'Sort By',
      id: 'predictionSortField',
      html: `
        <select class="form-select" id="predictionSortField" aria-label="Sort predictions">
          <option value="${PREDICTION_SORT_FIELD.SUBMITTED_AT}"${sortField === PREDICTION_SORT_FIELD.SUBMITTED_AT ? ' selected' : ''}>Submission Time</option>
          <option value="${PREDICTION_SORT_FIELD.MATCH_DATE}"${sortField === PREDICTION_SORT_FIELD.MATCH_DATE ? ' selected' : ''}>Match Date</option>
          <option value="${PREDICTION_SORT_FIELD.CONTESTANT}"${sortField === PREDICTION_SORT_FIELD.CONTESTANT ? ' selected' : ''}>Contestant</option>
          <option value="${PREDICTION_SORT_FIELD.UPDATED_AT}"${sortField === PREDICTION_SORT_FIELD.UPDATED_AT ? ' selected' : ''}>Last Updated</option>
          <option value="${PREDICTION_SORT_FIELD.STATUS}"${sortField === PREDICTION_SORT_FIELD.STATUS ? ' selected' : ''}>Status</option>
          <option value="${PREDICTION_SORT_FIELD.POINTS}"${sortField === PREDICTION_SORT_FIELD.POINTS ? ' selected' : ''}>Points</option>
        </select>
      `,
    }),
  ].join('');

  return renderFilterBar({ fieldsHtml, extraClass: 'ptw-admin-predictions__filters ptw-filter-bar--scrollable' });
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
    const contestantName = resolveContestantDisplayName(contestant);
    const rowNumber = (currentPage - 1) * pageSize + index + 1;

    return `
      <tr class="ptw-prediction-row" data-prediction-id="${escapeHtml(prediction.id)}" tabindex="0" role="button" aria-label="View prediction by ${escapeHtml(contestantName)}">
        <td class="ptw-prediction-table__index">${rowNumber}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 28 })}
            <div class="min-w-0 fw-semibold text-truncate">${escapeHtml(contestantName)}</div>
          </div>
        </td>
        <td class="d-none d-xl-table-cell">${escapeHtml(String(prediction.tournament?.name ?? ''))}</td>
        <td>${renderPredictedScoreHtml(match, prediction, { compact: true })}</td>
        <td class="d-none d-md-table-cell">${renderPredictedWinnerHtml(match, prediction, { compact: true, result })}</td>
        <td>${renderActualScoreHtml(match, result, { compact: true })}</td>
        <td class="d-none d-lg-table-cell">${renderActualWinnerHtml(match, result, { compact: true })}</td>
        <td class="fw-semibold">${renderPointsHtml(prediction, result)}</td>
      </tr>
    `;
  }).join('');

  const resultHeaders = `
    <th scope="col">${renderPredictionTableHeader('Actual', 'Score')}</th>
    <th scope="col" class="d-none d-lg-table-cell">${renderPredictionTableHeader('Actual', 'Winner')}</th>
    <th scope="col">Points</th>
  `;

  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  const pageSizeOptions = PREDICTION_PAGE_SIZE_OPTIONS.map((size) => `
    <option value="${size}"${size === pageSize ? ' selected' : ''}>${size} / page</option>
  `).join('');

  return `
    <div class="d-none d-lg-block table-responsive">
      <table class="table table-hover align-middle mb-0 ptw-table ptw-table--compact ptw-prediction-table" aria-label="Predictions">
        <thead>
          <tr>
            <th scope="col" class="ptw-prediction-table__index">#</th>
            <th scope="col">Contestant</th>
            <th scope="col" class="d-none d-xl-table-cell">Tournament</th>
            <th scope="col">${renderPredictionTableHeader('Predicted', 'Score')}</th>
            <th scope="col" class="d-none d-md-table-cell">${renderPredictionTableHeader('Predicted', 'Winner')}</th>
            ${resultHeaders}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>

    <div class="d-lg-none px-3 py-2 ptw-admin-card-list ptw-prediction-card-list" aria-label="Prediction cards">
      ${renderPredictionCardList(predictions)}
    </div>

    <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 px-3 py-2 border-top border-secondary">
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
  } = options;

  const statsHtml = statistics
    ? renderPredictionStatisticsCards(statistics, loadedAt)
    : '';

  const mergedFilterOptions = {
    ...filterOptions,
    tournaments,
    selectedTournamentId,
  };

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Predictions Management',
        subtitle: 'View, search, and analyze contestant predictions',
        actionsHtml: `
          <button type="button" class="btn btn-outline-secondary btn-sm" id="refreshPredictionsBtn">
            <i class="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Refresh
          </button>
        `,
      })}

      ${selectedTournamentId ? `
        <div class="mb-3" id="predictionStatsContainer">${statsHtml}</div>
        ${renderPredictionFilters(mergedFilterOptions)}
        <div class="card ptw-card">
          <div class="card-body p-0" id="predictionTableContainer">
            ${renderPredictionTable(predictions, tableOptions)}
          </div>
        </div>
      ` : `
        ${renderPredictionFilters(mergedFilterOptions)}
        ${renderEmptyState({
        title: 'No Tournament Selected',
        message: PREDICTION_MANAGEMENT_MESSAGES.NO_TOURNAMENT,
        icon: 'bi-trophy',
      })}
      `}
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
/**
 * @param {string} line1
 * @param {string} line2
 * @returns {string}
 */
function renderPredictionTableHeader(line1, line2) {
  return `<span class="ptw-prediction-table__th-label">${escapeHtml(line1)}<br>${escapeHtml(line2)}</span>`;
}

/**
 * @param {Record<string, unknown>} match
 * @returns {string}
 */
function formatMatchLabel(match) {
  const home = match.homeTeam?.name ?? 'TBD';
  const away = match.awayTeam?.name ?? 'TBD';
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
