/**
 * @fileoverview Admin contestant prediction history list renderer.
 * @module prediction/admin/renderers/admin-prediction-history-list.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { renderPagination } from '../../../components/pagination.component.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { getRankRowHighlightClass, renderRankBadge } from '../../../shared/badges/rank-badge.component.js';
import {
  ADMIN_PREDICTION_HISTORY_MESSAGES,
  ADMIN_PREDICTION_HISTORY_SORT_FIELD,
  ADMIN_PREDICTION_HISTORY_PAGE_SIZE_OPTIONS,
} from '../admin-prediction-history.constants.js';
import { adminPredictionHistoryContestantRoute } from '../../history/prediction-history.constants.js';

/** @typedef {import('../../../domain/admin-prediction-history.domain.js').AdminContestantHistoryRow} AdminContestantHistoryRow */
/** @typedef {import('../../../domain/admin-prediction-history.domain.js').AdminContestantListQuery} AdminContestantListQuery */
/** @typedef {import('../AdminPredictionHistoryService.js').AdminContestantListResult} AdminContestantListResult */

/**
 * @param {AdminContestantListResult} data
 * @param {AdminContestantListQuery} query
 * @returns {string}
 */
export function renderAdminPredictionHistoryListPage(data, query) {
  const hasRows = data.allRows.length > 0;
  const hasFilteredRows = data.pageRows.length > 0;
  const startRecord = data.totalRecords === 0 ? 0 : ((data.currentPage - 1) * data.pageSize) + 1;
  const endRecord = Math.min(data.currentPage * data.pageSize, data.totalRecords);
  const subtitle = data.activeTournamentName
    ? `Browse contestants who have submitted predictions. Points and rank reflect the active tournament: ${data.activeTournamentName}.`
    : 'Browse contestants who have submitted predictions.';

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Prediction History',
        subtitle,
        actionsHtml: '',
      })}

      ${renderListFilters(query)}

      ${hasFilteredRows
    ? renderContestantTable(data.pageRows)
    : renderEmptyState({
      title: hasRows ? 'No Matching Contestants' : 'No Contestants Yet',
      message: hasRows
        ? ADMIN_PREDICTION_HISTORY_MESSAGES.NO_SEARCH_MATCHES
        : ADMIN_PREDICTION_HISTORY_MESSAGES.EMPTY,
      icon: hasRows ? 'bi-search' : 'bi-people',
    })}

      ${data.totalRecords > 0 ? `
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
          <p class="small ptw-text-muted mb-0">
            Showing ${startRecord} to ${endRecord} of ${data.totalRecords} contestants
          </p>
          <div class="d-flex flex-wrap align-items-center gap-3">
            <label class="small ptw-text-muted mb-0" for="aph-page-size">Per page</label>
            <select class="form-select form-select-sm" id="aph-page-size" data-aph-page-size style="width:auto">
              ${ADMIN_PREDICTION_HISTORY_PAGE_SIZE_OPTIONS.map((size) => `
                <option value="${size}"${data.pageSize === size ? ' selected' : ''}>${size} / page</option>
              `).join('')}
            </select>
            ${renderPagination({
              currentPage: data.currentPage,
              totalPages: data.totalPages,
              basePath: '?page=',
            })}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * @param {AdminContestantListQuery} query
 * @returns {string}
 */
function renderListFilters(query) {
  const sortOptions = [
    { value: ADMIN_PREDICTION_HISTORY_SORT_FIELD.NAME, label: 'Name' },
    { value: ADMIN_PREDICTION_HISTORY_SORT_FIELD.TOURNAMENTS, label: 'Tournaments Joined' },
    { value: ADMIN_PREDICTION_HISTORY_SORT_FIELD.PREDICTIONS, label: 'Predictions Submitted' },
    { value: ADMIN_PREDICTION_HISTORY_SORT_FIELD.POINTS, label: 'Current Points' },
    { value: ADMIN_PREDICTION_HISTORY_SORT_FIELD.RANK, label: 'Current Rank' },
  ];

  return `
    <div class="card ptw-card mb-4">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-md-5">
            <label class="form-label small mb-1" for="aph-search">Contestant Name</label>
            <input
              type="search"
              class="form-control form-control-sm"
              id="aph-search"
              data-aph-filter="search"
              value="${escapeHtml(query.search)}"
              placeholder="Search by name"
            />
          </div>
          <div class="col-md-3">
            <label class="form-label small mb-1" for="aph-sort">Sort By</label>
            <select class="form-select form-select-sm" id="aph-sort" data-aph-filter="sort">
              ${sortOptions.map((option) => `
                <option value="${option.value}"${query.sortField === option.value ? ' selected' : ''}>
                  ${escapeHtml(option.label)}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label small mb-1" for="aph-direction">Direction</label>
            <select class="form-select form-select-sm" id="aph-direction" data-aph-filter="direction">
              <option value="asc"${query.sortDirection === 'asc' ? ' selected' : ''}>Ascending</option>
              <option value="desc"${query.sortDirection === 'desc' ? ' selected' : ''}>Descending</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {AdminContestantHistoryRow[]} rows
 * @returns {string}
 */
function renderContestantTable(rows) {
  return `
    <div class="card ptw-card">
      <div class="card-body p-0">
        <div class="d-none d-lg-block table-responsive">
          <table class="table table-hover align-middle mb-0 ptw-table ptw-admin-prediction-history-table" aria-label="Contestants with predictions">
            <thead>
              <tr>
                <th scope="col" class="ptw-admin-prediction-history-table__rank">Rank</th>
                <th scope="col">Contestant</th>
                <th scope="col">Current Points</th>
                <th scope="col">Predictions Submitted</th>
                <th scope="col">Tournament(s) Joined</th>
                <th scope="col" class="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => renderContestantRow(row)).join('')}
            </tbody>
          </table>
        </div>
        <div class="d-lg-none">
          ${renderContestantCards(rows)}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {AdminContestantHistoryRow[]} rows
 * @returns {string}
 */
export function renderContestantCards(rows) {
  if (rows.length === 0) {
    return '';
  }

  return `
    <div class="ptw-leaderboard-cards" aria-label="Contestant prediction history cards">
      ${rows.map((row) => renderContestantCard(row)).join('')}
    </div>
  `;
}

/**
 * @param {AdminContestantHistoryRow} row
 * @returns {string}
 */
function renderContestantCard(row) {
  const historyRoute = adminPredictionHistoryContestantRoute(row.uid);
  const rowHighlightClass = getRankRowHighlightClass(row.currentRank);

  return `
    <article
      class="card ptw-card ptw-leaderboard-card ptw-admin-prediction-history__row${rowHighlightClass}"
      data-aph-row="${escapeHtml(row.uid)}"
      tabindex="0"
      role="link"
      aria-label="View prediction history for ${escapeHtml(row.name)}"
    >
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          ${renderRankBadge(row.currentRank, { variant: 'featured', showLabel: true })}
          ${renderAvatar({ photoURL: row.photoURL, size: 48, className: 'ptw-avatar flex-shrink-0' })}
          <div class="ms-3 flex-grow-1 min-w-0">
            <h6 class="ptw-leaderboard-card__name mb-0">${escapeHtml(row.name)}</h6>
          </div>
        </div>

        <div class="row g-2 mb-2">
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Current Points</div>
              <div class="ptw-leaderboard-card__stat-value ptw-leaderboard-card__stat-value--primary">${formatNullableNumber(row.currentPoints)}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Predictions</div>
              <div class="ptw-leaderboard-card__stat-value">${row.predictionsSubmitted}</div>
            </div>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-12">
            <div class="ptw-leaderboard-card__stat">
              <div class="ptw-leaderboard-card__stat-label">Tournaments Joined</div>
              <div class="ptw-leaderboard-card__stat-value">${row.tournamentsJoined}</div>
            </div>
          </div>
        </div>

        <div class="ptw-leaderboard-card__footer">
          <a
            href="${escapeHtml(historyRoute)}"
            class="btn btn-sm btn-outline-primary w-100"
            data-route
            data-aph-view="${escapeHtml(row.uid)}"
          >
            View History
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {AdminContestantHistoryRow} row
 * @returns {string}
 */
function renderContestantRow(row) {
  const historyRoute = adminPredictionHistoryContestantRoute(row.uid);
  const rowHighlightClass = getRankRowHighlightClass(row.currentRank);

  return `
    <tr
      class="ptw-admin-prediction-history__row${rowHighlightClass}"
      data-aph-row="${escapeHtml(row.uid)}"
      tabindex="0"
      role="link"
      aria-label="View prediction history for ${escapeHtml(row.name)}"
    >
      <td class="ptw-admin-prediction-history-table__rank">
        ${renderRankBadge(row.currentRank, { variant: 'table' })}
      </td>
      <td>
        <div class="d-flex align-items-center gap-2">
          ${renderAvatar({ photoURL: row.photoURL, size: 36 })}
          <span class="fw-semibold">${escapeHtml(row.name)}</span>
        </div>
      </td>
      <td>
        <span class="badge bg-primary">${formatNullableNumber(row.currentPoints)}</span>
      </td>
      <td>${row.predictionsSubmitted}</td>
      <td>${row.tournamentsJoined}</td>
      <td class="text-end">
        <a
          href="${escapeHtml(historyRoute)}"
          class="btn btn-sm btn-outline-primary"
          data-route
          data-aph-view="${escapeHtml(row.uid)}"
        >
          View History
        </a>
      </td>
    </tr>
  `;
}

/**
 * @param {number|null} value
 * @returns {string}
 */
function formatNullableNumber(value) {
  return value === null || value === undefined ? '—' : String(value);
}

/**
 * @param {string} message
 * @returns {string}
 */
export function renderAdminPredictionHistoryErrorState(message) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Prediction History',
        subtitle: 'Browse contestants who have submitted predictions',
        actionsHtml: '',
      })}
      ${renderEmptyState({
        title: 'Unable to Load Contestants',
        message: escapeHtml(message),
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}

/**
 * @returns {string}
 */
export function renderAdminPredictionHistoryLoadingState() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Prediction History',
        subtitle: 'Browse contestants who have submitted predictions',
        actionsHtml: '',
      })}
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading…</span>
        </div>
        <p class="mt-3 ptw-text-muted mb-0">${ADMIN_PREDICTION_HISTORY_MESSAGES.LOADING}</p>
      </div>
    </div>
  `;
}
