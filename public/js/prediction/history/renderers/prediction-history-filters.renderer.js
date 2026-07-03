/**
 * @fileoverview Filter bar renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-filters.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderFilterBar, renderFilterField } from '../../../components/filter-bar.component.js';
import {
  PREDICTION_HISTORY_VIEW,
  PREDICTION_HISTORY_RESULT_FILTER,
  PREDICTION_HISTORY_DATE_RANGE,
  PREDICTION_HISTORY_MATCH_STATUS,
  PREDICTION_HISTORY_SORT_FIELD,
} from '../prediction-history.constants.js';

/**
 * @typedef {import('../prediction-history.validator.js').PredictionHistoryQueryParams} PredictionHistoryQueryParams
 */

/**
 * @param {PredictionHistoryQueryParams} params
 * @param {Array<{ id: string, name: string }>} tournaments
 * @param {string[]} stages
 * @returns {string}
 */
export function renderHistoryFilters(params, tournaments, stages) {
  const tournamentOptions = [
    '<option value="">All Tournaments</option>',
    ...tournaments.map((tournament) => `
      <option value="${escapeHtml(tournament.id)}"${params.tournamentId === tournament.id ? ' selected' : ''}>
        ${escapeHtml(tournament.name)}
      </option>
    `),
  ].join('');

  const stageOptions = [
    '<option value="">All Stages</option>',
    ...stages.map((stage) => `
      <option value="${escapeHtml(stage)}"${params.stage === stage ? ' selected' : ''}>
        ${escapeHtml(stage)}
      </option>
    `),
  ].join('');

  const fieldsHtml = `
    ${renderFilterField({
      label: 'Tournament',
      id: 'ph-filter-tournament',
      html: `<select class="form-select form-select-sm" id="ph-filter-tournament" data-ph-filter="tournament">${tournamentOptions}</select>`,
    })}
    ${renderFilterField({
      label: 'Stage',
      id: 'ph-filter-stage',
      html: `<select class="form-select form-select-sm" id="ph-filter-stage" data-ph-filter="stage">${stageOptions}</select>`,
    })}
    ${renderFilterField({
      label: 'Result',
      id: 'ph-filter-result',
      html: `
        <select class="form-select form-select-sm" id="ph-filter-result" data-ph-filter="result">
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.ALL}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.ALL ? ' selected' : ''}>All Results</option>
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.WINNER_CORRECT}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.WINNER_CORRECT ? ' selected' : ''}>Winner Correct</option>
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.WINNER_INCORRECT}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.WINNER_INCORRECT ? ' selected' : ''}>Winner Incorrect</option>
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_CORRECT}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_CORRECT ? ' selected' : ''}>Exact Score Correct</option>
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_INCORRECT}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_INCORRECT ? ' selected' : ''}>Exact Score Incorrect</option>
          <option value="${PREDICTION_HISTORY_RESULT_FILTER.HIGH_POINTS}"${params.resultFilter === PREDICTION_HISTORY_RESULT_FILTER.HIGH_POINTS ? ' selected' : ''}>High Points (5+)</option>
        </select>
      `,
    })}
    ${renderFilterField({
      label: 'Date Range',
      id: 'ph-filter-date',
      html: `
        <select class="form-select form-select-sm" id="ph-filter-date" data-ph-filter="date">
          <option value="${PREDICTION_HISTORY_DATE_RANGE.ALL}"${params.dateRange === PREDICTION_HISTORY_DATE_RANGE.ALL ? ' selected' : ''}>All Time</option>
          <option value="${PREDICTION_HISTORY_DATE_RANGE.LAST_30}"${params.dateRange === PREDICTION_HISTORY_DATE_RANGE.LAST_30 ? ' selected' : ''}>Last 30 Days</option>
          <option value="${PREDICTION_HISTORY_DATE_RANGE.LAST_90}"${params.dateRange === PREDICTION_HISTORY_DATE_RANGE.LAST_90 ? ' selected' : ''}>Last 90 Days</option>
          <option value="${PREDICTION_HISTORY_DATE_RANGE.THIS_YEAR}"${params.dateRange === PREDICTION_HISTORY_DATE_RANGE.THIS_YEAR ? ' selected' : ''}>This Year</option>
        </select>
      `,
    })}
    ${renderFilterField({
      label: 'Match Status',
      id: 'ph-filter-status',
      html: `
        <select class="form-select form-select-sm" id="ph-filter-status" data-ph-filter="status">
          <option value="${PREDICTION_HISTORY_MATCH_STATUS.ALL}"${params.matchStatus === PREDICTION_HISTORY_MATCH_STATUS.ALL ? ' selected' : ''}>All Statuses</option>
          <option value="${PREDICTION_HISTORY_MATCH_STATUS.COMPLETED}"${params.matchStatus === PREDICTION_HISTORY_MATCH_STATUS.COMPLETED ? ' selected' : ''}>Completed</option>
          <option value="${PREDICTION_HISTORY_MATCH_STATUS.PENDING}"${params.matchStatus === PREDICTION_HISTORY_MATCH_STATUS.PENDING ? ' selected' : ''}>Pending</option>
          <option value="${PREDICTION_HISTORY_MATCH_STATUS.LOCKED}"${params.matchStatus === PREDICTION_HISTORY_MATCH_STATUS.LOCKED ? ' selected' : ''}>Locked</option>
        </select>
      `,
      width: 'wide',
    })}
    ${renderFilterField({
      label: 'Search',
      id: 'ph-filter-search',
      width: 'search',
      html: `
        <input
          type="search"
          class="form-control form-control-sm"
          id="ph-filter-search"
          data-ph-filter="search"
          placeholder="Search matches, teams…"
          value="${escapeHtml(params.search)}"
          aria-label="Search prediction history"
        >
      `,
    })}
    ${renderFilterField({
      label: 'Sort By',
      id: 'ph-filter-sort',
      html: `
        <select class="form-select form-select-sm" id="ph-filter-sort" data-ph-filter="sort">
          <option value="${PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE}"${params.sortField === PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE ? ' selected' : ''}>Match Date</option>
          <option value="${PREDICTION_HISTORY_SORT_FIELD.POINTS}"${params.sortField === PREDICTION_HISTORY_SORT_FIELD.POINTS ? ' selected' : ''}>Points Earned</option>
          <option value="${PREDICTION_HISTORY_SORT_FIELD.TOURNAMENT}"${params.sortField === PREDICTION_HISTORY_SORT_FIELD.TOURNAMENT ? ' selected' : ''}>Tournament</option>
          <option value="${PREDICTION_HISTORY_SORT_FIELD.ACCURACY}"${params.sortField === PREDICTION_HISTORY_SORT_FIELD.ACCURACY ? ' selected' : ''}>Accuracy</option>
        </select>
      `,
    })}
  `;

  return `
    ${renderFilterBar({ fieldsHtml, extraClass: 'ptw-prediction-history__filters' })}
    ${renderViewModeTabs(params.view)}
    ${renderQuickFilterPills(params.resultFilter)}
  `;
}

/**
 * @param {string} activeView
 * @returns {string}
 */
export function renderViewModeTabs(activeView) {
  const tabs = [
    { id: PREDICTION_HISTORY_VIEW.TIMELINE, label: 'Timeline View', icon: 'bi-clock-history' },
    { id: PREDICTION_HISTORY_VIEW.CARD, label: 'Card View', icon: 'bi-grid' },
    { id: PREDICTION_HISTORY_VIEW.TABLE, label: 'Table View', icon: 'bi-table' },
  ];

  const buttons = tabs.map((tab) => {
    const isActive = tab.id === activeView;
    return `
      <button
        type="button"
        class="btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline-secondary'}"
        data-ph-view="${tab.id}"
        aria-pressed="${isActive ? 'true' : 'false'}"
        aria-label="${escapeHtml(tab.label)}"
      >
        <i class="bi ${tab.icon} me-1" aria-hidden="true"></i>${escapeHtml(tab.label)}
      </button>
    `;
  }).join('');

  return `
    <div class="d-flex flex-wrap gap-2 mb-3 ptw-prediction-history__view-tabs" role="group" aria-label="View mode">
      ${buttons}
    </div>
  `;
}

/**
 * @param {string} activeFilter
 * @returns {string}
 */
export function renderQuickFilterPills(activeFilter) {
  const pills = [
    { id: PREDICTION_HISTORY_RESULT_FILTER.ALL, label: 'All' },
    { id: PREDICTION_HISTORY_RESULT_FILTER.WINNER_CORRECT, label: 'Winner Correct' },
    { id: PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_CORRECT, label: 'Exact Score' },
    { id: PREDICTION_HISTORY_RESULT_FILTER.WINNER_INCORRECT, label: 'Incorrect' },
    { id: PREDICTION_HISTORY_RESULT_FILTER.HIGH_POINTS, label: 'High Points (5+)' },
  ];

  const buttons = pills.map((pill) => {
    const isActive = pill.id === activeFilter;
    return `
      <button
        type="button"
        class="btn btn-sm rounded-pill ${isActive ? 'btn-primary' : 'btn-outline-secondary'}"
        data-ph-quick-filter="${pill.id}"
        aria-pressed="${isActive ? 'true' : 'false'}"
      >${escapeHtml(pill.label)}</button>
    `;
  }).join('');

  return `
    <div class="d-flex flex-wrap gap-2 mb-3 d-lg-none" role="group" aria-label="Quick filters">
      ${buttons}
    </div>
  `;
}
