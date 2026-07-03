/**
 * @fileoverview Prediction history page — contestant cross-tournament prediction archive.
 * @module pages/prediction-history.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { predictionHistoryService } from '../prediction/history/PredictionHistoryService.js';
import {
  parseHistoryQueryParams,
  buildHistoryQueryString,
} from '../prediction/history/prediction-history.validator.js';
import {
  PREDICTION_HISTORY_MESSAGES,
  PREDICTION_HISTORY_ROUTES,
} from '../prediction/history/prediction-history.constants.js';
import {
  renderHistoryLoadingState,
  renderHistoryPage,
  renderHistoryErrorState,
} from '../prediction/history/renderers/prediction-history-page.renderer.js';
import { renderPredictionDetail } from '../prediction/history/renderers/prediction-history-detail.renderer.js';
import { Logger } from '../utils/logger.util.js';

/** @typedef {import('../prediction/history/prediction-history.validator.js').PredictionHistoryQueryParams} PredictionHistoryQueryParams */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initPredictionHistoryPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initPredictionHistoryPage(outlet) {
  outlet.innerHTML = renderHistoryLoadingState();
  showLoadingOverlay(PREDICTION_HISTORY_MESSAGES.LOADING);

  try {
    const user = getCurrentUser();

    if (!user) {
      outlet.innerHTML = renderAuthRequiredState();
      return;
    }

    const params = parseHistoryQueryParams(new URLSearchParams(window.location.search));

    if (params.predictionId) {
      await renderDetailView(outlet, user.uid, params.predictionId);
      return;
    }

    const data = await predictionHistoryService.getHistoryPageData(user.uid, user.uid, params);
    outlet.innerHTML = renderHistoryPage(data, params);
    attachHistoryHandlers(outlet, params);
  } catch (error) {
    Logger.error('[prediction-history.page] init failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    outlet.innerHTML = renderHistoryErrorState(message);
    showErrorToast(message);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} userId
 * @param {string} predictionId
 * @returns {Promise<void>}
 */
async function renderDetailView(outlet, userId, predictionId) {
  try {
    const detail = await predictionHistoryService.getPredictionDetail(userId, userId, predictionId);

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        ${renderContestantPageHeader({
          title: 'Prediction Details',
          subtitle: 'Review your prediction and scoring breakdown',
        })}
        ${renderPredictionDetail(detail.item, detail.lifecycle)}
      </div>
    `;

    attachDetailHandlers(outlet);
  } catch (error) {
    Logger.error('[prediction-history.page] detail failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    outlet.innerHTML = renderHistoryErrorState(message);
    showErrorToast(message);
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryQueryParams} currentParams
 * @returns {void}
 */
function attachHistoryHandlers(outlet, currentParams) {
  outlet.querySelectorAll('[data-ph-filter]').forEach((element) => {
    element.addEventListener('change', () => {
      navigateWithFilters(outlet, currentParams, readFiltersFromDom(outlet, currentParams));
    });
  });

  const searchInput = outlet.querySelector('[data-ph-filter="search"]');
  if (searchInput instanceof HTMLInputElement) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        navigateWithFilters(outlet, currentParams, readFiltersFromDom(outlet, currentParams));
      }, 300);
    });
  }

  outlet.querySelectorAll('[data-ph-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-ph-view');
      if (!view) {
        return;
      }
      navigateWithFilters(outlet, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        view,
        page: 1,
      });
    });
  });

  outlet.querySelectorAll('[data-ph-quick-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const resultFilter = button.getAttribute('data-ph-quick-filter');
      if (!resultFilter) {
        return;
      }
      navigateWithFilters(outlet, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        resultFilter,
        page: 1,
      });
    });
  });

  const pageSizeSelect = outlet.querySelector('[data-ph-page-size]');
  if (pageSizeSelect instanceof HTMLSelectElement) {
    pageSizeSelect.addEventListener('change', () => {
      navigateWithFilters(outlet, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        pageSize: Number(pageSizeSelect.value),
        page: 1,
      });
    });
  }

  outlet.querySelectorAll('.ptw-pagination a[data-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = Number(link.getAttribute('data-page'));
      if (!Number.isInteger(page) || page < 1) {
        return;
      }
      navigateWithFilters(outlet, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        page,
      });
    });
  });

  outlet.querySelectorAll('[data-ph-detail]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const predictionId = link.getAttribute('data-ph-detail');
      if (!predictionId) {
        return;
      }
      const nextUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(predictionId)}`;
      window.history.pushState({}, '', nextUrl);
      void initPredictionHistoryPage(outlet);
    });
  });

  outlet.querySelectorAll('[data-ph-detail-row]').forEach((row) => {
    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      const predictionId = row.getAttribute('data-ph-detail-row');
      if (!predictionId) {
        return;
      }
      const nextUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(predictionId)}`;
      window.history.pushState({}, '', nextUrl);
      void initPredictionHistoryPage(outlet);
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachDetailHandlers(outlet) {
  const backLink = outlet.querySelector('[data-ph-back]');
  if (backLink instanceof HTMLAnchorElement) {
    backLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.history.pushState({}, '', PREDICTION_HISTORY_ROUTES.LIST);
      void initPredictionHistoryPage(outlet);
    });
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryQueryParams} currentParams
 * @param {Partial<PredictionHistoryQueryParams>} updates
 * @returns {Promise<void>}
 */
async function navigateWithFilters(outlet, currentParams, updates) {
  const nextParams = { ...currentParams, ...updates, predictionId: '' };
  const query = buildHistoryQueryString(nextParams);
  const nextUrl = `${PREDICTION_HISTORY_ROUTES.LIST}${query}`;

  window.history.pushState({}, '', nextUrl);
  showLoadingOverlay(PREDICTION_HISTORY_MESSAGES.LOADING);

  try {
    const user = getCurrentUser();
    if (!user) {
      outlet.innerHTML = renderAuthRequiredState();
      return;
    }

    const data = await predictionHistoryService.getHistoryPageData(user.uid, user.uid, nextParams);
    outlet.innerHTML = renderHistoryPage(data, nextParams);
    attachHistoryHandlers(outlet, nextParams);
  } catch (error) {
    Logger.error('[prediction-history.page] filter navigation failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    showErrorToast(message);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryQueryParams} currentParams
 * @returns {Partial<PredictionHistoryQueryParams>}
 */
function readFiltersFromDom(outlet, currentParams) {
  /** @type {Partial<PredictionHistoryQueryParams>} */
  const values = { ...currentParams };

  outlet.querySelectorAll('[data-ph-filter]').forEach((element) => {
    const key = element.getAttribute('data-ph-filter');
    if (!key || !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) {
      return;
    }

    switch (key) {
      case 'tournament':
        values.tournamentId = element.value;
        break;
      case 'stage':
        values.stage = element.value;
        break;
      case 'result':
        values.resultFilter = element.value;
        break;
      case 'date':
        values.dateRange = element.value;
        break;
      case 'status':
        values.matchStatus = element.value;
        break;
      case 'search':
        values.search = element.value.trim();
        break;
      case 'sort':
        values.sortField = element.value;
        break;
      default:
        break;
    }
  });

  return values;
}

/**
 * @returns {string}
 */
function renderAuthRequiredState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Prediction History',
        subtitle: 'Review your predictions and track your performance',
      })}
      ${renderEmptyState({
        title: 'Authentication Required',
        message: PREDICTION_HISTORY_MESSAGES.AUTH_REQUIRED,
        icon: 'bi-lock',
      })}
    </div>
  `;
}
