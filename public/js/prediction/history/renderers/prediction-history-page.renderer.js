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
 * @returns {string}
 */
export function renderHistoryLoadingState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Prediction History',
        subtitle: 'Review your predictions and track your performance',
      })}
      ${renderSkeletonCardGrid(3)}
    </div>
  `;
}

/**
 * @param {HistoryPageData} data
 * @param {PredictionHistoryQueryParams} params
 * @returns {string}
 */
export function renderHistoryPage(data, params) {
  const hasAnyPredictions = data.allItems.length > 0;
  const hasFilteredResults = data.pageItems.length > 0;
  const listContent = hasFilteredResults
    ? renderHistoryListContent(data.pageItems, params.view)
    : renderEmptyState({
      title: hasAnyPredictions ? 'No Matching Predictions' : 'No Predictions Yet',
      message: hasAnyPredictions
        ? PREDICTION_HISTORY_MESSAGES.NO_FILTER_MATCHES
        : PREDICTION_HISTORY_MESSAGES.NO_PREDICTIONS,
      icon: hasAnyPredictions ? 'bi-funnel' : 'bi-bullseye',
    });

  const startRecord = data.totalRecords === 0 ? 0 : ((data.currentPage - 1) * data.pageSize) + 1;
  const endRecord = Math.min(data.currentPage * data.pageSize, data.totalRecords);
  const basePath = `${PREDICTION_HISTORY_ROUTES.LIST}${buildHistoryQueryString({ ...params, page: undefined })}`;
  const pageSizeOptions = PREDICTION_HISTORY_PAGE_SIZE_OPTIONS.map((size) => `
    <option value="${size}"${data.pageSize === size ? ' selected' : ''}>${size} / page</option>
  `).join('');

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES} ptw-prediction-history">
      ${renderContestantPageHeader({
        title: 'Prediction History',
        subtitle: 'Review your predictions and track your performance',
      })}

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
              <p class="small text-muted mb-0">
                Showing ${startRecord} to ${endRecord} of ${data.totalRecords} predictions
              </p>
              <div class="d-flex flex-wrap align-items-center gap-3">
                <label class="small text-muted mb-0" for="ph-page-size">Per page</label>
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
 * @param {import('../../../domain/prediction-history.domain.js').HistoryItem[]} items
 * @param {string} view
 * @returns {string}
 */
export function renderHistoryListContent(items, view) {
  switch (view) {
    case PREDICTION_HISTORY_VIEW.CARD:
      return renderHistoryCardList(items);
    case PREDICTION_HISTORY_VIEW.TABLE:
      return renderHistoryTable(items);
    case PREDICTION_HISTORY_VIEW.TIMELINE:
    default:
      return renderHistoryTimeline(items);
  }
}

/**
 * @param {string} message
 * @returns {string}
 */
export function renderHistoryErrorState(message) {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Prediction History',
        subtitle: 'Review your predictions and track your performance',
      })}
      ${renderEmptyState({
        title: 'Unable to Load History',
        message: escapeHtml(message),
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}
