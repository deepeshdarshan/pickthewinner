/**
 * @fileoverview Archived matches admin page.
 * @module match/match-archived.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { listTournamentsForAdmin } from '../tournament/tournament.service.js';
import { MATCH_MESSAGES, MATCH_ROUTES } from './match.constants.js';
import { getMatchById, getMatchErrorMessage, listMatchesForAdmin } from './match.service.js';
import {
  filterMatches,
  handleDeleteMatch,
  paginateMatches,
  sortMatchesByKickoff,
} from './match-list.controller.js';
import {
  mountMatchListLoading,
  renderArchivedMatchListPage,
  renderMatchDetailPage,
  renderMatchNotFound,
} from './match.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initArchivedMatchesPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initArchivedMatchesPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.CREATE_MATCH)) {
    outlet.innerHTML = renderMatchNotFound(MATCH_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('id');

  if (matchId) {
    await renderDetailView(outlet, matchId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const [allMatches, tournaments] = await Promise.all([
      listMatchesForAdmin({ archivedOnly: true }),
      listTournamentsForAdmin({ includeArchived: true }),
    ]);

    const params = new URLSearchParams(window.location.search);
    let currentPage = Number(params.get('page')) || 1;
    /** @type {{ search: string, tournamentId: string, status: string, date: string }} */
    let filterState = {
      search: '',
      tournamentId: '',
      status: '',
      date: '',
    };

    const paint = () => {
      const filtered = filterMatches(sortMatchesByKickoff(allMatches), filterState);
      const pagination = paginateMatches(filtered, currentPage);
      currentPage = pagination.currentPage;

      outlet.innerHTML = renderArchivedMatchListPage(pagination.pageMatches, {
        tournaments,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
      });

      bindListInteractions(outlet, allMatches, filterState, () => currentPage, (page) => {
        currentPage = page;
        paint();
      }, paint);
    };

    paint();
  } catch (error) {
    Logger.error('[MatchArchived] List failed:', error);
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} matchId
 * @returns {Promise<void>}
 */
async function renderDetailView(outlet, matchId) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING_MATCH);

  try {
    const match = await getMatchById(matchId);

    if (!match) {
      outlet.innerHTML = renderMatchNotFound();
      return;
    }

    const tournaments = await listTournamentsForAdmin({ includeArchived: true });

    outlet.innerHTML = renderMatchDetailPage(match, {
      tournaments,
      teams: [match.homeTeam, match.awayTeam].filter(Boolean),
      inheritedConfig: null,
      readOnly: true,
    });

    bindMatchDeleteAction(outlet, matchId);
  } catch (error) {
    Logger.error('[MatchArchived] Detail failed:', error);
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} matchId
 * @returns {void}
 */
function bindMatchDeleteAction(outlet, matchId) {
  const deleteButton = outlet.querySelector('[data-ptw-match-delete]');

  if (!(deleteButton instanceof HTMLButtonElement)) {
    return;
  }

  deleteButton.addEventListener('click', () => {
    void handleDeleteMatch(outlet, matchId, async () => {
      window.history.pushState({}, '', MATCH_ROUTES.ARCHIVED_LIST);
      await renderListView(outlet);
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch[]} allMatches
 * @param {{ search: string, tournamentId: string, status: string, date: string }} filterState
 * @param {() => number} getCurrentPage
 * @param {(page: number) => void} setCurrentPage
 * @param {() => void} repaint
 * @returns {void}
 */
function bindListInteractions(outlet, allMatches, filterState, getCurrentPage, setCurrentPage, repaint) {
  const search = outlet.querySelector('#ptw-match-filter-search');
  const tournamentFilter = outlet.querySelector('#ptw-match-filter-tournament');
  const statusFilter = outlet.querySelector('#ptw-match-filter-status');
  const dateFilter = outlet.querySelector('#ptw-match-filter-date');

  const syncFilters = () => {
    filterState.search = search instanceof HTMLInputElement ? search.value : '';
    filterState.tournamentId = tournamentFilter instanceof HTMLSelectElement ? tournamentFilter.value : '';
    filterState.status = statusFilter instanceof HTMLSelectElement ? statusFilter.value : '';
    filterState.date = dateFilter instanceof HTMLInputElement ? dateFilter.value : '';
    setCurrentPage(1);
    repaint();
  };

  [search, tournamentFilter, statusFilter, dateFilter].forEach((element) => {
    element?.addEventListener('input', syncFilters);
    element?.addEventListener('change', syncFilters);
  });

  outlet.querySelectorAll('[data-ptw-match-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const matchId = button.getAttribute('data-match-id');

      if (matchId) {
        void handleDeleteMatch(outlet, matchId, async () => {
          const index = allMatches.findIndex((item) => item.id === matchId);

          if (index >= 0) {
            allMatches.splice(index, 1);
          }

          repaint();
        });
      }
    });
  });

  outlet.querySelectorAll('#ptw-match-pagination [data-page]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = Number(link.getAttribute('data-page'));
      const filtered = filterMatches(sortMatchesByKickoff(allMatches), filterState);
      const { totalPages } = paginateMatches(filtered, getCurrentPage());

      if (!Number.isInteger(page) || page < 1 || page > totalPages) {
        return;
      }

      setCurrentPage(page);
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(page));
      window.history.replaceState({}, '', url.toString());
      repaint();
    });
  });
}
