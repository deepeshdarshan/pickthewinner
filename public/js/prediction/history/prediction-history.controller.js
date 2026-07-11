/**
 * @fileoverview Shared controller for contestant and admin prediction history pages.
 * @module prediction/history/prediction-history.controller
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../../components/loading-overlay.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../components/contestant-page-shell.component.js';
import { renderContestantPageHeader } from '../../components/page-header.component.js';
import { renderEmptyState } from '../../components/empty-state.component.js';
import { showErrorToast } from '../../utils/toast.util.js';
import { predictionHistoryService } from './PredictionHistoryService.js';
import {
  parseHistoryQueryParams,
  buildHistoryQueryString,
} from './prediction-history.validator.js';
import {
  PREDICTION_HISTORY_MESSAGES,
  PREDICTION_HISTORY_ROUTES,
} from './prediction-history.constants.js';
import {
  renderHistoryLoadingState,
  renderHistoryPage,
  renderHistoryErrorState,
} from './renderers/prediction-history-page.renderer.js';
import { renderPredictionDetail } from './renderers/prediction-history-detail.renderer.js';
import { Logger } from '../../utils/logger.util.js';

/** @typedef {import('./prediction-history.validator.js').PredictionHistoryQueryParams} PredictionHistoryQueryParams */
/** @typedef {import('./renderers/prediction-history-page.renderer.js').PredictionHistoryPageContext} PredictionHistoryPageContext */

/**
 * @typedef {Object} PredictionHistoryControllerConfig
 * @property {string} targetUserId
 * @property {string} authUserId
 * @property {string} baseRoute
 * @property {boolean} [isAdmin]
 * @property {Partial<PredictionHistoryPageContext>} [pageContext]
 * @property {() => string} [renderAuthRequiredState]
 */

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryControllerConfig} config
 * @returns {Promise<void>}
 */
export async function initPredictionHistoryPage(outlet, config) {
  const pageContext = resolveControllerPageContext(config);
  outlet.innerHTML = renderHistoryLoadingState(pageContext);
  showLoadingOverlay(PREDICTION_HISTORY_MESSAGES.LOADING);

  try {
    if (!config.authUserId) {
      outlet.innerHTML = config.renderAuthRequiredState
        ? config.renderAuthRequiredState()
        : renderDefaultAuthRequiredState(pageContext);
      return;
    }

    const params = parseHistoryQueryParams(new URLSearchParams(window.location.search));

    if (params.predictionId) {
      await renderDetailView(outlet, config, params.predictionId, pageContext);
      return;
    }

    const data = await predictionHistoryService.getHistoryPageData(
      config.targetUserId,
      config.authUserId,
      params,
      { isAdmin: config.isAdmin ?? false },
    );
    outlet.innerHTML = renderHistoryPage(data, params, pageContext);
    attachHistoryHandlers(outlet, config, params, pageContext);
  } catch (error) {
    Logger.error('[prediction-history.controller] init failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    outlet.innerHTML = renderHistoryErrorState(message, pageContext);
    showErrorToast(message);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {PredictionHistoryControllerConfig} config
 * @returns {PredictionHistoryPageContext}
 */
function resolveControllerPageContext(config) {
  return {
    shellClasses: CONTESTANT_PAGE_SHELL_CLASSES,
    baseRoute: config.baseRoute,
    listTitle: 'Prediction History',
    listSubtitle: 'Review your predictions and track your performance',
    detailTitle: 'Prediction Details',
    detailSubtitle: 'Review your prediction and scoring breakdown',
    backHref: config.baseRoute,
    backLabel: 'Back to History',
    ...config.pageContext,
  };
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryControllerConfig} config
 * @param {string} predictionId
 * @param {PredictionHistoryPageContext} pageContext
 * @returns {Promise<void>}
 */
async function renderDetailView(outlet, config, predictionId, pageContext) {
  try {
    const detail = await predictionHistoryService.getPredictionDetail(
      config.targetUserId,
      config.authUserId,
      predictionId,
      { isAdmin: config.isAdmin ?? false },
    );

    outlet.innerHTML = `
      <div class="${pageContext.shellClasses}">
        ${renderContestantPageHeader({
          title: pageContext.detailTitle,
          subtitle: pageContext.detailSubtitle,
        })}
        ${renderPredictionDetail(detail.item, detail.lifecycle, {
          backHref: pageContext.backHref,
          backLabel: pageContext.backLabel,
        })}
      </div>
    `;

    attachDetailHandlers(outlet, config);
  } catch (error) {
    Logger.error('[prediction-history.controller] detail failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    outlet.innerHTML = renderHistoryErrorState(message, pageContext);
    showErrorToast(message);
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryControllerConfig} config
 * @param {PredictionHistoryQueryParams} currentParams
 * @param {PredictionHistoryPageContext} pageContext
 * @returns {void}
 */
function attachHistoryHandlers(outlet, config, currentParams, pageContext) {
  outlet.querySelectorAll('[data-ph-filter]').forEach((element) => {
    element.addEventListener('change', () => {
      void navigateWithFilters(outlet, config, currentParams, readFiltersFromDom(outlet, currentParams), pageContext);
    });
  });

  const searchInput = outlet.querySelector('[data-ph-filter="search"]');
  if (searchInput instanceof HTMLInputElement) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        void navigateWithFilters(outlet, config, currentParams, readFiltersFromDom(outlet, currentParams), pageContext);
      }, 300);
    });
  }

  outlet.querySelectorAll('[data-ph-scope]').forEach((button) => {
    button.addEventListener('click', () => {
      const scope = button.getAttribute('data-ph-scope');
      if (!scope || scope === currentParams.scope) {
        return;
      }
      void navigateWithFilters(outlet, config, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        scope,
        tournamentId: '',
        page: 1,
      }, pageContext);
    });
  });

  outlet.querySelectorAll('[data-ph-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.getAttribute('data-ph-view');
      if (!view) {
        return;
      }
      void navigateWithFilters(outlet, config, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        view,
        page: 1,
      }, pageContext);
    });
  });

  outlet.querySelectorAll('[data-ph-quick-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const resultFilter = button.getAttribute('data-ph-quick-filter');
      if (!resultFilter) {
        return;
      }
      void navigateWithFilters(outlet, config, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        resultFilter,
        page: 1,
      }, pageContext);
    });
  });

  const pageSizeSelect = outlet.querySelector('[data-ph-page-size]');
  if (pageSizeSelect instanceof HTMLSelectElement) {
    pageSizeSelect.addEventListener('change', () => {
      void navigateWithFilters(outlet, config, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        pageSize: Number(pageSizeSelect.value),
        page: 1,
      }, pageContext);
    });
  }

  outlet.querySelectorAll('.ptw-pagination a[data-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = Number(link.getAttribute('data-page'));
      if (!Number.isInteger(page) || page < 1) {
        return;
      }
      void navigateWithFilters(outlet, config, currentParams, {
        ...readFiltersFromDom(outlet, currentParams),
        page,
      }, pageContext);
    });
  });

  outlet.querySelectorAll('[data-ph-detail]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const predictionId = link.getAttribute('data-ph-detail');
      if (!predictionId) {
        return;
      }
      const nextUrl = `${config.baseRoute}?id=${encodeURIComponent(predictionId)}`;
      window.history.pushState({}, '', nextUrl);
      void initPredictionHistoryPage(outlet, config);
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
      const nextUrl = `${config.baseRoute}?id=${encodeURIComponent(predictionId)}`;
      window.history.pushState({}, '', nextUrl);
      void initPredictionHistoryPage(outlet, config);
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryControllerConfig} config
 * @returns {void}
 */
function attachDetailHandlers(outlet, config) {
  const backLink = outlet.querySelector('[data-ph-back]');
  if (backLink instanceof HTMLAnchorElement) {
    backLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.history.pushState({}, '', config.baseRoute);
      void initPredictionHistoryPage(outlet, config);
    });
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {PredictionHistoryControllerConfig} config
 * @param {PredictionHistoryQueryParams} currentParams
 * @param {Partial<PredictionHistoryQueryParams>} updates
 * @param {PredictionHistoryPageContext} pageContext
 * @returns {Promise<void>}
 */
async function navigateWithFilters(outlet, config, currentParams, updates, pageContext) {
  const nextParams = { ...currentParams, ...updates, predictionId: '' };
  const query = buildHistoryQueryString(nextParams);
  const nextUrl = `${config.baseRoute}${query}`;

  window.history.pushState({}, '', nextUrl);
  showLoadingOverlay(PREDICTION_HISTORY_MESSAGES.LOADING);

  try {
    if (!config.authUserId) {
      outlet.innerHTML = config.renderAuthRequiredState
        ? config.renderAuthRequiredState()
        : renderDefaultAuthRequiredState(pageContext);
      return;
    }

    const data = await predictionHistoryService.getHistoryPageData(
      config.targetUserId,
      config.authUserId,
      nextParams,
      { isAdmin: config.isAdmin ?? false },
    );
    outlet.innerHTML = renderHistoryPage(data, nextParams, pageContext);
    attachHistoryHandlers(outlet, config, nextParams, pageContext);
  } catch (error) {
    Logger.error('[prediction-history.controller] filter navigation failed:', error);
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
 * @param {PredictionHistoryPageContext} pageContext
 * @returns {string}
 */
function renderDefaultAuthRequiredState(pageContext) {
  return `
    <div class="${pageContext.shellClasses}">
      ${renderContestantPageHeader({
        title: pageContext.listTitle,
        subtitle: pageContext.listSubtitle,
      })}
      ${renderEmptyState({
        title: 'Authentication Required',
        message: PREDICTION_HISTORY_MESSAGES.AUTH_REQUIRED,
        icon: 'bi-lock',
      })}
    </div>
  `;
}

/**
 * @param {string} authUserId
 * @returns {PredictionHistoryControllerConfig}
 */
export function createContestantHistoryConfig(authUserId) {
  return {
    targetUserId: authUserId,
    authUserId,
    baseRoute: PREDICTION_HISTORY_ROUTES.LIST,
    isAdmin: false,
  };
}
