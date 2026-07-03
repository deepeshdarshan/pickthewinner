/**
 * @fileoverview Admin predictions management page.
 * @module pages/admin-predictions.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { showModal } from '../components/modal-wrapper.component.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { listTournamentsForAdmin, getActiveTournament } from '../tournament/tournament.service.js';
import { PredictionManagementDomain } from '../domain/prediction-management.domain.js';
import { predictionManagementService } from '../prediction/admin/PredictionManagementService.js';
import { PredictionStatisticsService } from '../prediction/admin/PredictionStatisticsService.js';
import {
  PREDICTION_VIEW_MODE,
  PREDICTION_SORT_FIELD,
  PREDICTION_LIST_PAGE_SIZE,
  PREDICTION_MANAGEMENT_MESSAGES,
} from '../prediction/admin/prediction-management.constants.js';
import {
  mountPredictionListLoading,
  renderPredictionListPage,
  renderPredictionTable,
} from '../prediction/admin/renderers/list.renderer.js';
import { renderMatchWiseView } from '../prediction/admin/renderers/match-view.renderer.js';
import { renderContestantWiseView } from '../prediction/admin/renderers/contestant-view.renderer.js';
import {
  renderPredictionDetailModal,
  renderPredictionDetailBody,
  DETAIL_MODAL_ID,
} from '../prediction/admin/renderers/detail.renderer.js';
import { Logger } from '../utils/logger.util.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';

/** @typedef {import('../prediction/admin/PredictionManagementService.js').TournamentPredictionData} TournamentPredictionData */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminPredictionsPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminPredictionsPage(outlet) {
  mountPredictionListLoading(outlet);
  showLoadingOverlay(PREDICTION_MANAGEMENT_MESSAGES.LOADING);

  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.VIEW_ALL_PREDICTIONS)) {
    outlet.innerHTML = renderErrorState(PREDICTION_MANAGEMENT_MESSAGES.PERMISSION_DENIED);
    hideLoadingOverlay();
    return;
  }

  try {
    const tournaments = await listTournamentsForAdmin({ includeArchived: true });
    const activeTournament = await getActiveTournament();
    const defaultTournamentId = activeTournament?.id ?? tournaments[0]?.id ?? '';

    /** @type {TournamentPredictionData|null} */
    let tournamentData = null;
    let selectedTournamentId = defaultTournamentId;
    let viewMode = PREDICTION_VIEW_MODE.LIST;
    let currentPage = 1;
    let pageSize = PREDICTION_LIST_PAGE_SIZE;
    let sortField = PREDICTION_SORT_FIELD.SUBMITTED_AT;
    /** @type {{ search: string, matchId: string, stage: string, contestantId: string, status: string }} */
    let filterState = {
      search: '',
      matchId: '',
      stage: '',
      contestantId: '',
      status: '',
    };

    const paint = async (refresh = false) => {
      if (!selectedTournamentId) {
        outlet.innerHTML = renderPredictionListPage({
          tournaments,
          selectedTournamentId: '',
        });
        bindStaticHandlers(outlet);
        return;
      }

      try {
        tournamentData = await predictionManagementService.loadTournamentData(
          selectedTournamentId,
          refresh,
        );
      } catch (error) {
        Logger.error('[AdminPredictions] Load failed:', error);
        outlet.innerHTML = renderErrorState(getErrorMessage(error));
        showErrorToast(getErrorMessage(error));
        return;
      }

      const showResults = tournamentData.matches.some((match) => match.result?.published);
      const filtered = applyViewAndFilters(tournamentData, viewMode, filterState, sortField);
      const pagination = PredictionManagementDomain.paginatePredictions(
        filtered,
        currentPage,
        pageSize,
      );

      currentPage = pagination.currentPage;

      const tableOptions = {
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        totalRecords: pagination.totalRecords,
        pageSize,
        showResults,
      };

      const contestants = predictionManagementService.getContestantsWithPredictions(tournamentData);
      const stages = predictionManagementService.getAvailableStages(tournamentData.matches);

      outlet.innerHTML = renderPredictionListPage({
        tournaments,
        selectedTournamentId,
        statistics: tournamentData.statistics,
        loadedAt: tournamentData.loadedAt,
        predictions: pagination.pageItems,
        tableOptions,
        filterOptions: {
          viewMode,
          matches: tournamentData.matches,
          contestants,
          stages,
          filterState,
        },
      });

      const tableContainer = outlet.querySelector('#predictionTableContainer');

      if (tableContainer) {
        const contentHtml = renderViewContent(
          viewMode,
          tournamentData,
          filterState,
          pagination.pageItems,
          tableOptions,
          contestants,
        );
        tableContainer.innerHTML = contentHtml;
      }

      bindPageHandlers(outlet, {
        getState: () => ({
          selectedTournamentId,
          viewMode,
          currentPage,
          pageSize,
          sortField,
          filterState,
        }),
        setState: (updates) => {
          if (updates.selectedTournamentId !== undefined) {
            selectedTournamentId = updates.selectedTournamentId;
            currentPage = 1;
          }
          if (updates.viewMode !== undefined) {
            viewMode = updates.viewMode;
            currentPage = 1;
          }
          if (updates.currentPage !== undefined) {
            currentPage = updates.currentPage;
          }
          if (updates.pageSize !== undefined) {
            pageSize = updates.pageSize;
            currentPage = 1;
          }
          if (updates.sortField !== undefined) {
            sortField = updates.sortField;
          }
          if (updates.filterState) {
            filterState = { ...filterState, ...updates.filterState };
            currentPage = 1;
          }
        },
        paint: () => paint(false),
        refresh: () => paint(true),
        tournamentData: () => tournamentData,
      });
    };

    await paint(false);
  } catch (error) {
    Logger.error('[AdminPredictions] Init failed:', error);
    outlet.innerHTML = renderErrorState(getErrorMessage(error));
    showErrorToast(PREDICTION_MANAGEMENT_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {TournamentPredictionData} data
 * @param {string} viewMode
 * @param {Object} filterState
 * @param {string} sortField
 * @returns {import('../domain/prediction-management.domain.js').EnrichedPrediction[]}
 */
function applyViewAndFilters(data, viewMode, filterState, sortField) {
  let predictions = [...data.predictions];

  if (viewMode === PREDICTION_VIEW_MODE.MATCH && filterState.matchId) {
    predictions = predictions.filter((item) => item.matchId === filterState.matchId);
  }

  if (viewMode === PREDICTION_VIEW_MODE.CONTESTANT && filterState.contestantId) {
    predictions = predictions.filter((item) => item.userId === filterState.contestantId);
  }

  const filtered = PredictionManagementDomain.filterPredictions(predictions, filterState);
  return PredictionManagementDomain.sortPredictions(filtered, sortField, 'desc');
}

/**
 * @param {string} viewMode
 * @param {TournamentPredictionData} data
 * @param {Object} filterState
 * @param {Array} pageItems
 * @param {Object} tableOptions
 * @param {Array} contestants
 * @returns {string}
 */
function renderViewContent(viewMode, data, filterState, pageItems, tableOptions, contestants) {
  if (viewMode === PREDICTION_VIEW_MODE.MATCH && filterState.matchId) {
    const match = data.matches.find((item) => item.id === filterState.matchId);
    if (!match) {
      return renderPredictionTable(pageItems, tableOptions);
    }

    const matchPredictions = data.predictions.filter((item) => item.matchId === filterState.matchId);
    const stats = PredictionStatisticsService.calculateMatchStatistics(
      matchPredictions,
      match,
      data.statistics.contestantsParticipating,
    );

    return renderMatchWiseView(match, pageItems, tableOptions, stats);
  }

  if (viewMode === PREDICTION_VIEW_MODE.CONTESTANT && filterState.contestantId) {
    const contestant = contestants.find((item) => item.uid === filterState.contestantId)
      ?? { uid: filterState.contestantId };
    const contestantPredictions = data.predictions.filter(
      (item) => item.userId === filterState.contestantId,
    );
    const stats = PredictionStatisticsService.calculateContestantStatistics(
      contestantPredictions,
      data.matches,
    );

    return renderContestantWiseView(contestant, pageItems, tableOptions, stats);
  }

  return renderPredictionTable(pageItems, tableOptions);
}

/**
 * @param {HTMLElement} outlet
 * @param {Object} handlers
 * @returns {void}
 */
function bindPageHandlers(outlet, handlers) {
  bindStaticHandlers(outlet, handlers);

  const tournamentSelector = outlet.querySelector('#predictionTournamentSelector');
  tournamentSelector?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    handlers.setState({ selectedTournamentId: target.value });
    void handlers.paint();
  });

  const viewModeSelect = outlet.querySelector('#predictionViewMode');
  viewModeSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    handlers.setState({ viewMode: target.value });
    updateViewModeVisibility(outlet, target.value);
    void handlers.paint();
  });

  bindFilterSelect(outlet, '#predictionMatchFilter', 'matchId', handlers);
  bindFilterSelect(outlet, '#predictionContestantFilter', 'contestantId', handlers);
  bindFilterSelect(outlet, '#predictionStageFilter', 'stage', handlers);
  bindFilterSelect(outlet, '#predictionStatusFilter', 'status', handlers);

  const searchInput = outlet.querySelector('#predictionSearchInput');
  let searchTimeout;
  searchInput?.addEventListener('input', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      handlers.setState({ filterState: { search: target.value } });
      void handlers.paint();
    }, 300);
  });

  const sortSelect = outlet.querySelector('#predictionSortField');
  sortSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    handlers.setState({ sortField: target.value });
    void handlers.paint();
  });

  const refreshBtn = outlet.querySelector('#refreshPredictionsBtn');
  refreshBtn?.addEventListener('click', () => {
    predictionManagementService.clearTournamentCache(handlers.getState().selectedTournamentId);
    void handlers.refresh().then(() => {
      showSuccessToast(PREDICTION_MANAGEMENT_MESSAGES.REFRESHED);
    });
  });

  bindPaginationHandlers(outlet, handlers);
  bindPredictionRowHandlers(outlet, handlers);
}

/**
 * @param {HTMLElement} outlet
 * @param {Object} [handlers]
 * @returns {void}
 */
function bindStaticHandlers(outlet, handlers) {
  const refreshBtn = outlet.querySelector('#refreshPredictionsBtn');
  refreshBtn?.addEventListener('click', () => {
    if (handlers) {
      predictionManagementService.clearTournamentCache(handlers.getState().selectedTournamentId);
      void handlers.refresh();
    }
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {string} selector
 * @param {string} key
 * @param {Object} handlers
 * @returns {void}
 */
function bindFilterSelect(outlet, selector, key, handlers) {
  const element = outlet.querySelector(selector);
  element?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    handlers.setState({ filterState: { [key]: target.value } });
    void handlers.paint();
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {Object} handlers
 * @returns {void}
 */
function bindPaginationHandlers(outlet, handlers) {
  outlet.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const target = /** @type {HTMLButtonElement} */ (event.currentTarget);
      if (target.disabled) {
        return;
      }

      const page = Number(target.dataset.page);
      if (Number.isFinite(page) && page > 0) {
        handlers.setState({ currentPage: page });
        void handlers.paint();
      }
    });
  });

  const pageSizeSelect = outlet.querySelector('#predictionPageSize');
  pageSizeSelect?.addEventListener('change', (event) => {
    const target = /** @type {HTMLSelectElement} */ (event.target);
    handlers.setState({ pageSize: Number(target.value) || PREDICTION_LIST_PAGE_SIZE });
    void handlers.paint();
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {Object} handlers
 * @returns {void}
 */
function bindPredictionRowHandlers(outlet, handlers) {
  const openDetail = async (predictionId) => {
    const data = handlers.tournamentData();
    let prediction = data?.predictions.find((item) => item.id === predictionId) ?? null;

    if (!prediction) {
      prediction = await predictionManagementService.getPredictionDetail(predictionId, data);
    }

    if (!prediction) {
      showErrorToast('Prediction not found.');
      return;
    }

    const existingModal = document.getElementById(DETAIL_MODAL_ID);
    existingModal?.remove();

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderPredictionDetailModal(prediction);
    const modalEl = wrapper.firstElementChild;

    if (modalEl) {
      document.body.appendChild(modalEl);
    }

    showModal({
      id: DETAIL_MODAL_ID,
      title: 'Prediction Detail',
      bodyHtml: renderPredictionDetailBody(prediction),
      sizeClass: 'modal-lg',
      footerHtml: '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>',
    });
  };

  outlet.querySelectorAll('[data-prediction-id]').forEach((element) => {
    const predictionId = element.getAttribute('data-prediction-id');
    if (!predictionId) {
      return;
    }

    element.addEventListener('click', () => {
      void openDetail(predictionId);
    });

    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        void openDetail(predictionId);
      }
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {string} viewMode
 * @returns {void}
 */
function updateViewModeVisibility(outlet, viewMode) {
  const matchFilter = outlet.querySelector('#predictionMatchFilter');
  const contestantFilter = outlet.querySelector('#predictionContestantFilter');

  if (matchFilter) {
    matchFilter.disabled = viewMode !== PREDICTION_VIEW_MODE.MATCH;
  }

  if (contestantFilter) {
    contestantFilter.disabled = viewMode !== PREDICTION_VIEW_MODE.CONTESTANT;
  }
}

/**
 * @param {unknown} error
 * @returns {string}
 */
function getErrorMessage(error) {
  if (error instanceof Error) {
    if (error.message.includes('permission') || error.message.includes('Permission')) {
      return PREDICTION_MANAGEMENT_MESSAGES.ERROR_PERMISSION;
    }

    if (error.message.includes('network') || error.message.includes('offline')) {
      return PREDICTION_MANAGEMENT_MESSAGES.ERROR_NETWORK;
    }

    return error.message;
  }

  return PREDICTION_MANAGEMENT_MESSAGES.ERROR_LOADING;
}

/**
 * @param {string} message
 * @returns {string}
 */
function renderErrorState(message) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="alert alert-danger" role="alert">
        <i class="bi bi-exclamation-triangle me-2" aria-hidden="true"></i>
        ${message}
      </div>
    </div>
  `;
}
