/**
 * @fileoverview Admin contestant prediction history list page.
 * @module pages/admin-prediction-history-list.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { adminPredictionHistoryService } from '../prediction/admin/AdminPredictionHistoryService.js';
import {
  ADMIN_PREDICTION_HISTORY_MESSAGES,
  ADMIN_PREDICTION_HISTORY_SORT_FIELD,
  ADMIN_PREDICTION_HISTORY_DEFAULT_PAGE_SIZE,
  ADMIN_PREDICTION_HISTORY_PAGE_SIZE_OPTIONS,
} from '../prediction/admin/admin-prediction-history.constants.js';
import {
  renderAdminPredictionHistoryListPage,
  renderAdminPredictionHistoryErrorState,
  renderAdminPredictionHistoryLoadingState,
} from '../prediction/admin/renderers/admin-prediction-history-list.renderer.js';
import { Logger } from '../utils/logger.util.js';

/** @typedef {import('../domain/admin-prediction-history.domain.js').AdminContestantListQuery} AdminContestantListQuery */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminPredictionHistoryListPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminPredictionHistoryListPage(outlet) {
  outlet.innerHTML = renderAdminPredictionHistoryLoadingState();
  showLoadingOverlay(ADMIN_PREDICTION_HISTORY_MESSAGES.LOADING);

  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.VIEW_ALL_PREDICTIONS)) {
    outlet.innerHTML = renderAdminPredictionHistoryErrorState(
      ADMIN_PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED,
    );
    hideLoadingOverlay();
    return;
  }

  try {
    const query = parseListQueryParams(new URLSearchParams(window.location.search));
    const data = await adminPredictionHistoryService.getContestantList(query);
    outlet.innerHTML = renderAdminPredictionHistoryListPage(data, query);
    attachListHandlers(outlet, query);
  } catch (error) {
    Logger.error('[admin-prediction-history-list.page] init failed:', error);
    outlet.innerHTML = renderAdminPredictionHistoryErrorState(
      ADMIN_PREDICTION_HISTORY_MESSAGES.LOAD_FAILED,
    );
    showErrorToast(ADMIN_PREDICTION_HISTORY_MESSAGES.LOAD_FAILED);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {URLSearchParams} params
 * @returns {AdminContestantListQuery}
 */
function parseListQueryParams(params) {
  const sortField = Object.values(ADMIN_PREDICTION_HISTORY_SORT_FIELD).includes(/** @type {string} */ (params.get('sort')))
    ? String(params.get('sort'))
    : ADMIN_PREDICTION_HISTORY_SORT_FIELD.NAME;

  const sortDirection = params.get('dir') === 'desc' ? 'desc' : 'asc';

  const rawPageSize = Number(params.get('size'));
  const pageSize = ADMIN_PREDICTION_HISTORY_PAGE_SIZE_OPTIONS.includes(rawPageSize)
    ? rawPageSize
    : ADMIN_PREDICTION_HISTORY_DEFAULT_PAGE_SIZE;

  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    search: String(params.get('search') ?? '').trim(),
    sortField,
    sortDirection,
    page,
    pageSize,
  };
}

/**
 * @param {AdminContestantListQuery} query
 * @returns {string}
 */
function buildListQueryString(query) {
  const params = new URLSearchParams();

  if (query.search) {
    params.set('search', query.search);
  }

  if (query.sortField !== ADMIN_PREDICTION_HISTORY_SORT_FIELD.NAME) {
    params.set('sort', query.sortField);
  }

  if (query.sortDirection === 'desc') {
    params.set('dir', 'desc');
  }

  if (query.page > 1) {
    params.set('page', String(query.page));
  }

  if (query.pageSize !== ADMIN_PREDICTION_HISTORY_DEFAULT_PAGE_SIZE) {
    params.set('size', String(query.pageSize));
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * @param {HTMLElement} outlet
 * @param {AdminContestantListQuery} currentQuery
 * @returns {void}
 */
function attachListHandlers(outlet, currentQuery) {
  outlet.querySelectorAll('[data-aph-filter]').forEach((element) => {
    element.addEventListener('change', () => {
      void navigateList(outlet, currentQuery, readListFiltersFromDom(outlet, currentQuery));
    });
  });

  const searchInput = outlet.querySelector('[data-aph-filter="search"]');
  if (searchInput instanceof HTMLInputElement) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        void navigateList(outlet, currentQuery, {
          ...readListFiltersFromDom(outlet, currentQuery),
          page: 1,
        });
      }, 300);
    });
  }

  const pageSizeSelect = outlet.querySelector('[data-aph-page-size]');
  if (pageSizeSelect instanceof HTMLSelectElement) {
    pageSizeSelect.addEventListener('change', () => {
      void navigateList(outlet, currentQuery, {
        ...readListFiltersFromDom(outlet, currentQuery),
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
      void navigateList(outlet, currentQuery, {
        ...readListFiltersFromDom(outlet, currentQuery),
        page,
      });
    });
  });

  outlet.querySelectorAll('[data-aph-row]').forEach((row) => {
    const navigateToHistory = () => {
      const link = row.querySelector('[data-aph-view]');
      if (link instanceof HTMLAnchorElement) {
        link.click();
      }
    };

    row.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('[data-aph-view]')) {
        return;
      }
      navigateToHistory();
    });

    row.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      navigateToHistory();
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {AdminContestantListQuery} currentQuery
 * @param {Partial<AdminContestantListQuery>} updates
 * @returns {Promise<void>}
 */
async function navigateList(outlet, currentQuery, updates) {
  const nextQuery = { ...currentQuery, ...updates };
  const nextUrl = `${window.location.pathname}${buildListQueryString(nextQuery)}`;

  window.history.pushState({}, '', nextUrl);
  showLoadingOverlay(ADMIN_PREDICTION_HISTORY_MESSAGES.LOADING);

  try {
    const data = await adminPredictionHistoryService.getContestantList(nextQuery);
    outlet.innerHTML = renderAdminPredictionHistoryListPage(data, nextQuery);
    attachListHandlers(outlet, nextQuery);
  } catch (error) {
    Logger.error('[admin-prediction-history-list.page] navigation failed:', error);
    showErrorToast(ADMIN_PREDICTION_HISTORY_MESSAGES.LOAD_FAILED);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {AdminContestantListQuery} currentQuery
 * @returns {Partial<AdminContestantListQuery>}
 */
function readListFiltersFromDom(outlet, currentQuery) {
  /** @type {Partial<AdminContestantListQuery>} */
  const values = { ...currentQuery };

  outlet.querySelectorAll('[data-aph-filter]').forEach((element) => {
    const key = element.getAttribute('data-aph-filter');
    if (!key || !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) {
      return;
    }

    switch (key) {
      case 'search':
        values.search = element.value.trim();
        break;
      case 'sort':
        values.sortField = element.value;
        break;
      case 'direction':
        values.sortDirection = element.value === 'desc' ? 'desc' : 'asc';
        break;
      default:
        break;
    }
  });

  const pageSizeSelect = outlet.querySelector('[data-aph-page-size]');
  if (pageSizeSelect instanceof HTMLSelectElement) {
    values.pageSize = Number(pageSizeSelect.value);
  }

  return values;
}
