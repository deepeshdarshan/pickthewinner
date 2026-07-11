/**
 * @fileoverview Main page layout renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-page.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderContestantPageHeader } from '../../../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { renderPagination } from '../../../components/pagination.component.js';
import { renderSkeletonCardGrid } from '../../../components/skeleton.component.js';
import {
  PREDICTION_HISTORY_VIEW,
  PREDICTION_HISTORY_PAGE_SIZE_OPTIONS,
  PREDICTION_HISTORY_MESSAGES,
  PREDICTION_HISTORY_ROUTES,
  PREDICTION_HISTORY_SCOPE,
} from '../prediction-history.constants.js';
import { buildHistoryQueryString } from '../prediction-history.validator.js';
import { renderSummaryCards, renderHistorySidebar } from './prediction-history-statistics.renderer.js';
import { renderHistoryFilters } from './prediction-history-filters.renderer.js';
import { renderHistoryCardList } from './prediction-history-card.renderer.js';
import { renderHistoryTimeline } from './prediction-history-timeline.renderer.js';
import { renderHistoryTable } from './prediction-history-table.renderer.js';

/**
 * @typedef {import('../PredictionHistoryService.js').HistoryPageData} HistoryPageData
 * @typedef {import('../prediction-history.validator.js').PredictionHistoryQueryParams} PredictionHistoryQueryParams
 */

/**
 * @typedef {Object} PredictionHistoryPageContext
 * @property {string} shellClasses
 * @property {string} baseRoute
 * @property {string} listTitle
 * @property {string} listSubtitle
 * @property {string} detailTitle
 * @property {string} detailSubtitle
 * @property {string} backHref
 * @property {string} backLabel
 */

/** @type {PredictionHistoryPageContext} */
const DEFAULT_PAGE_CONTEXT = {
  shellClasses: CONTESTANT_PAGE_SHELL_CLASSES,
  baseRoute: PREDICTION_HISTORY_ROUTES.LIST,
  listTitle: 'Prediction History',
  listSubtitle: 'Review your predictions and track your performance',
  detailTitle: 'Prediction Details',
  detailSubtitle: 'Review your prediction and scoring breakdown',
  backHref: PREDICTION_HISTORY_ROUTES.LIST,
  backLabel: 'Back to History',
};

/**
 * @param {Partial<PredictionHistoryPageContext>} [overrides]
 * @returns {PredictionHistoryPageContext}
 */
function resolvePageContext(overrides = {}) {
  return { ...DEFAULT_PAGE_CONTEXT, ...overrides };
}

/**
 * @param {Partial<PredictionHistoryPageContext>} [context]
 * @returns {string}
 */
export function renderHistoryLoadingState(context) {
  const resolved = resolvePageContext(context);

  return `
    <div class="${resolved.shellClasses}">
      ${renderContestantPageHeader({
        title: resolved.listTitle,
        subtitle: resolved.listSubtitle,
      })}
      ${renderSkeletonCardGrid(3)}
    </div>
  `;
}

/**
 * @param {HistoryPageData} data
 * @param {PredictionHistoryQueryParams} params
 * @param {Partial<PredictionHistoryPageContext>} [context]
 * @returns {string}
 */
export function renderHistoryPage(data, params, context) {
  const resolved = resolvePageContext(context);
  const hasAnyPredictions = data.allItems.length > 0;
  const hasFilteredResults = data.pageItems.length > 0;
  const isArchivedScope = params.scope === PREDICTION_HISTORY_SCOPE.ARCHIVED;
  const emptyScopeMessage = isArchivedScope
    ? PREDICTION_HISTORY_MESSAGES.NO_PREDICTIONS_ARCHIVED
    : PREDICTION_HISTORY_MESSAGES.NO_PREDICTIONS_ACTIVE;

  const startRecord = data.totalRecords === 0 ? 0 : ((data.currentPage - 1) * data.pageSize) + 1;
  const endRecord = Math.min(data.currentPage * data.pageSize, data.totalRecords);

  const listContent = hasFilteredResults
    ? renderHistoryListContent(data.pageItems, params.view, {
      startIndex: data.totalRecords === 0 ? 0 : startRecord,
    })
    : renderEmptyState({
      title: hasAnyPredictions ? 'No Matching Predictions' : 'No Predictions Yet',
      message: hasAnyPredictions
        ? PREDICTION_HISTORY_MESSAGES.NO_FILTER_MATCHES
        : emptyScopeMessage,
      icon: hasAnyPredictions ? 'bi-funnel' : 'bi-bullseye',
    });

  const basePath = `${resolved.baseRoute}${buildHistoryQueryString({ ...params, page: undefined })}`;
  const pageSizeOptions = PREDICTION_HISTORY_PAGE_SIZE_OPTIONS.map((size) => `
    <option value="${size}"${data.pageSize === size ? ' selected' : ''}>${size} / page</option>
  `).join('');

  return `
    <div class="${resolved.shellClasses} ptw-prediction-history">
      ${renderContestantPageHeader({
        title: resolved.listTitle,
        subtitle: resolved.listSubtitle,
      })}

      ${renderHistoryScopeTabs(params.scope, data.scopeCounts)}

      <section class="mb-4" aria-label="Summary statistics">
        ${renderSummaryCards(data.overallStats)}
      </section>

      ${renderHistoryFilters(params, data.tournaments, data.stages)}

      <div class="row g-4">
        <div class="col-lg-8">
          <div id="ph-list-content" data-ph-list>
            ${listContent}
          </div>

          ${data.totalRecords > 0 ? `
            <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mt-4">
              <p class="small ptw-text-muted mb-0">
                Showing ${startRecord} to ${endRecord} of ${data.totalRecords} predictions
              </p>
              <div class="d-flex flex-wrap align-items-center gap-3">
                <label class="small ptw-text-muted mb-0" for="ph-page-size">Per page</label>
                <select class="form-select form-select-sm" id="ph-page-size" data-ph-page-size style="width:auto">
                  ${pageSizeOptions}
                </select>
                ${renderPagination({
                  currentPage: data.currentPage,
                  totalPages: data.totalPages,
                  basePath: `${basePath}${basePath.includes('?') ? '&' : '?'}page=`,
                })}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="col-lg-4">
          ${renderHistorySidebar(data.overallStats, data.tournamentSummaries, data.stageStats)}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {string} activeScope
 * @param {{ active: number, archived: number }} scopeCounts
 * @returns {string}
 */
export function renderHistoryScopeTabs(activeScope, scopeCounts) {
  const tabs = [
    {
      id: PREDICTION_HISTORY_SCOPE.ACTIVE,
      label: 'Active Tournaments',
      count: scopeCounts.active,
    },
    {
      id: PREDICTION_HISTORY_SCOPE.ARCHIVED,
      label: 'Archived Tournaments',
      count: scopeCounts.archived,
    },
  ];

  const buttons = tabs.map((tab) => {
    const isActive = tab.id === activeScope;

    return `
      <li class="nav-item" role="presentation">
        <button
          type="button"
          class="nav-link${isActive ? ' active' : ''}"
          data-ph-scope="${tab.id}"
          role="tab"
          aria-selected="${isActive ? 'true' : 'false'}"
        >
          ${escapeHtml(tab.label)} (${tab.count})
        </button>
      </li>
    `;
  }).join('');

  return `
    <ul class="nav nav-tabs ptw-admin-list-tabs__nav ptw-prediction-history__scope-tabs mb-4" role="tablist" aria-label="Tournament scope">
      ${buttons}
    </ul>
  `;
}

/**
 * @param {import('../../../domain/prediction-history.domain.js').HistoryItem[]} items
 * @param {string} view
 * @param {{ startIndex?: number }} [options]
 * @returns {string}
 */
export function renderHistoryListContent(items, view, options = {}) {
  switch (view) {
    case PREDICTION_HISTORY_VIEW.CARD:
      return renderHistoryCardList(items);
    case PREDICTION_HISTORY_VIEW.TABLE:
      return renderHistoryTable(items, options);
    case PREDICTION_HISTORY_VIEW.TIMELINE:
    default:
      return renderHistoryTimeline(items);
  }
}

/**
 * @param {string} message
 * @param {Partial<PredictionHistoryPageContext>} [context]
 * @returns {string}
 */
export function renderHistoryErrorState(message, context) {
  const resolved = resolvePageContext(context);

  return `
    <div class="${resolved.shellClasses}">
      ${renderContestantPageHeader({
        title: resolved.listTitle,
        subtitle: resolved.listSubtitle,
      })}
      ${renderEmptyState({
        title: 'Unable to Load History',
        message: escapeHtml(message),
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}
