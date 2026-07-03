/**
 * @fileoverview Admin match management page.
 * @module match/match-admin.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showConfirmationModal } from '../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { listTeams } from '../master-data/teams/team.service.js';
import { listTournamentsForAdmin } from '../tournament/tournament.service.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { TOURNAMENT_STATUS } from '../domain/tournament.domain.js';
import { MATCH_STATUS } from '../domain/match.domain.js';
import { WINNER_RESOLUTION } from '../domain/match.domain.js';
import { MATCH_MESSAGES, MATCH_LIFECYCLE_ACTIONS, MATCH_VALIDATION_MESSAGES } from './match.constants.js';
import { getMatchValidationMessage, validateCreatePayload } from './match.validator.js';
import {
  createMatch,
  getMatchById,
  getMatchErrorMessage,
  listMatchesForAdmin,
  runMatchLifecycle,
  updateMatch,
} from './match.service.js';
import {
  filterMatches,
  handleDeleteMatch,
  paginateMatches,
  sortMatchesByKickoff,
} from './match-list.controller.js';
import { MATCH_ROUTES } from './match.constants.js';
import { publishMatchResult, recalculateMatchScores } from './match-result.service.js';
import {
  activateAdminListTab,
  consumeAdminTabFlag,
  setAdminTabFlag,
} from '../components/admin-list-tabs.component.js';
import {
  applyFormErrors,
  mountMatchListLoading,
  readMatchForm,
  readResultForm,
  renderMatchDetailPage,
  renderMatchFormPage,
  renderMatchListPageWithTabs,
  renderMatchListTabContent,
  renderMatchNotFound,
  renderInheritedConfigPanel,
} from './match.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initMatchAdminPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initMatchAdminPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.CREATE_MATCH)) {
    outlet.innerHTML = renderMatchNotFound(MATCH_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const matchId = params.get('id');

  if (action === 'create') {
    await renderCreateView(outlet);
    return;
  }

  if (matchId) {
    await renderEditView(outlet, matchId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @param {{ activeTabId?: string }} [options]
 * @returns {Promise<void>}
 */
async function renderListView(outlet, options = {}) {
  const activeTabId = options.activeTabId
    ?? (consumeAdminTabFlag('matches-archived') ? 'archived' : 'active');

  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const [activeMatches, archivedMatches, activeTournaments, archivedTournaments] = await Promise.all([
      listMatchesForAdmin(),
      listMatchesForAdmin({ archivedOnly: true }),
      listTournamentsForAdmin(),
      listTournamentsForAdmin({ includeArchived: true }),
    ]);

    let activePage = 1;
    let archivedPage = 1;
    /** @type {{ search: string, tournamentId: string, status: string, date: string }} */
    let activeFilterState = { search: '', tournamentId: '', status: '', date: '' };
    /** @type {{ search: string, tournamentId: string, status: string, date: string }} */
    let archivedFilterState = { search: '', tournamentId: '', status: '', date: '' };

    const paintActivePane = () => {
      const filtered = filterMatches(sortMatchesByKickoff(activeMatches), activeFilterState);
      const pagination = paginateMatches(filtered, activePage);
      activePage = pagination.currentPage;

      const pane = outlet.querySelector('[data-ptw-match-tab="active"]');

      if (!pane) {
        return;
      }

      pane.innerHTML = renderMatchListTabContent(pagination.pageMatches, {
        tournaments: activeTournaments,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        filterState: activeFilterState,
        filterIdPrefix: 'ptw-match-filter',
        paginationId: 'ptw-match-pagination',
      });

      bindListInteractions(pane, activeMatches, activeFilterState, {
        getCurrentPage: () => activePage,
        setCurrentPage: (page) => {
          activePage = page;
        },
        repaint: paintActivePane,
        filterIdPrefix: 'ptw-match-filter',
        paginationId: 'ptw-match-pagination',
      });
    };

    const paintArchivedPane = () => {
      const filtered = filterMatches(sortMatchesByKickoff(archivedMatches), archivedFilterState);
      const pagination = paginateMatches(filtered, archivedPage);
      archivedPage = pagination.currentPage;

      const pane = outlet.querySelector('[data-ptw-match-tab="archived"]');

      if (!pane) {
        return;
      }

      pane.innerHTML = renderMatchListTabContent(pagination.pageMatches, {
        tournaments: archivedTournaments,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,
        filterState: archivedFilterState,
        archivedOnly: true,
        allowDelete: true,
        showCreateFab: false,
        listRoute: MATCH_ROUTES.ADMIN_LIST,
        filterIdPrefix: 'ptw-match-archived-filter',
        paginationId: 'ptw-match-archived-pagination',
      });

      bindListInteractions(pane, archivedMatches, archivedFilterState, {
        getCurrentPage: () => archivedPage,
        setCurrentPage: (page) => {
          archivedPage = page;
        },
        repaint: paintArchivedPane,
        filterIdPrefix: 'ptw-match-archived-filter',
        paginationId: 'ptw-match-archived-pagination',
        allowDelete: true,
      });
    };

    const paintShell = () => {
      outlet.innerHTML = renderMatchListPageWithTabs({
        activeTabId,
        activeContentHtml: '',
        archivedContentHtml: '',
      });

      paintActivePane();
      paintArchivedPane();

      if (activeTabId === 'archived') {
        activateAdminListTab(outlet, 'archived', 'ptw-match-list-tabs');
      }
    };

    paintShell();
  } catch (error) {
    Logger.error('[MatchAdmin] List failed:', error);
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderCreateView(outlet) {
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const [tournaments, teams] = await Promise.all([
      listActiveTournaments(),
      listTeams({ activeOnly: true }),
    ]);

    outlet.innerHTML = renderMatchFormPage({
      tournaments,
      teams,
      isCreate: true,
    });

    bindMatchForm(outlet, null, tournaments, teams);
  } catch (error) {
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
async function renderEditView(outlet, matchId) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING_MATCH);

  try {
    const match = await getMatchById(matchId);

    if (!match) {
      outlet.innerHTML = renderMatchNotFound();
      return;
    }

    const isArchived = match.status === MATCH_STATUS.ARCHIVED;

    const [tournaments, teams, config] = await Promise.all([
      isArchived ? listTournamentsForAdmin({ includeArchived: true }) : listActiveTournaments(),
      listTeams({ activeOnly: !isArchived }),
      isArchived ? Promise.resolve(null) : TournamentConfigurationService.load(match.tournamentId),
    ]);

    outlet.innerHTML = renderMatchDetailPage(match, {
      tournaments,
      teams: isArchived
        ? [match.homeTeam, match.awayTeam].filter(Boolean)
        : teams,
      inheritedConfig: config,
      readOnly: isArchived,
    });

    if (!isArchived) {
      bindMatchForm(outlet, match, tournaments, teams);
      bindLifecycleActions(outlet, match);
      bindResultForm(outlet, match);
    }

    bindMatchDeleteAction(outlet, match, isArchived);
  } catch (error) {
    Logger.error('[MatchAdmin] Load failed:', error);
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @returns {Promise<import('../tournament/tournament.service.js').Tournament[]>}
 */
async function listActiveTournaments() {
  const tournaments = await listTournamentsForAdmin();
  return tournaments.filter((tournament) => !tournament.archived
    && [TOURNAMENT_STATUS.PUBLISHED, TOURNAMENT_STATUS.LIVE].includes(tournament.status));
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch|null} match
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @param {import('../master-data/teams/team.service.js').Team[]} teams
 * @returns {void}
 */
function bindMatchForm(outlet, match, tournaments, teams) {
  const form = outlet.querySelector('#ptw-match-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  bindTeamValidation(form);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readMatchForm(form);
    const validation = validateCreatePayload(payload);

    if (!validation.valid) {
      applyFormErrors(form, validation.errors);
      showErrorToast(getMatchValidationMessage(validation));
      return;
    }

    applyFormErrors(form, {});
    showLoadingOverlay(match ? MATCH_MESSAGES.UPDATING : MATCH_MESSAGES.CREATING);

    try {
      if (match) {
        await updateMatch(match.id, payload);
        showSuccessToast(MATCH_MESSAGES.UPDATED);
        await renderEditView(outlet, match.id);
      } else {
        const created = await createMatch(payload);
        showSuccessToast(MATCH_MESSAGES.CREATED);
        window.history.pushState({}, '', `/admin/matches?id=${encodeURIComponent(created.id)}`);
        await renderEditView(outlet, created.id);
      }
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'validation' in error) {
        applyFormErrors(form, /** @type {{ validation: { errors: Record<string, string> } }} */ (error).validation.errors);
      }

      showErrorToast(getMatchErrorMessage(error));
    } finally {
      hideLoadingOverlay();
    }
  });

  void teams;

  bindTournamentPreview(outlet, tournaments);
}

/**
 * @param {HTMLFormElement} form
 * @returns {void}
 */
function bindTeamValidation(form) {
  const homeField = form.querySelector('#ptw-match-homeTeamId');
  const awayField = form.querySelector('#ptw-match-awayTeamId');

  if (!(homeField instanceof HTMLSelectElement) || !(awayField instanceof HTMLSelectElement)) {
    return;
  }

  const syncTeamValidation = () => {
    const errors = {};

    if (homeField.value && awayField.value && homeField.value === awayField.value) {
      errors.homeTeamId = MATCH_VALIDATION_MESSAGES.TEAMS_MUST_DIFFER;
      errors.awayTeamId = MATCH_VALIDATION_MESSAGES.TEAMS_MUST_DIFFER;
    }

    ['homeTeamId', 'awayTeamId'].forEach((field) => {
      if (errors[field]) {
        return;
      }

      const input = form.querySelector(`#ptw-match-${field}`);
      const errorEl = form.querySelector(`#ptw-match-${field}-error`);

      if (input instanceof HTMLElement) {
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
      }

      if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('ptw-invalid-feedback--visible');
      }
    });

    if (Object.keys(errors).length > 0) {
      applyFormErrors(form, errors);
    }
  };

  homeField.addEventListener('change', syncTeamValidation);
  awayField.addEventListener('change', syncTeamValidation);
}

/**
 * @param {HTMLElement} outlet
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @returns {void}
 */
function bindTournamentPreview(outlet, tournaments) {
  const tournamentField = outlet.querySelector('#ptw-match-tournamentId');

  if (!(tournamentField instanceof HTMLSelectElement)) {
    return;
  }

  tournamentField.addEventListener('change', async () => {
    const tournament = tournaments.find((item) => item.id === tournamentField.value);
    const panel = outlet.querySelector('#ptw-match-inherited-config');

    if (!panel) {
      return;
    }

    if (!tournament) {
      panel.outerHTML = renderInheritedConfigPanel(null);
      return;
    }

    const config = await TournamentConfigurationService.load(tournament.id);
    panel.outerHTML = renderInheritedConfigPanel(config);
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {void}
 */
function bindLifecycleActions(outlet, match) {
  outlet.querySelectorAll('[data-ptw-lifecycle]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.getAttribute('data-ptw-lifecycle');

      if (!action) {
        return;
      }

      const confirmArchive = action === MATCH_LIFECYCLE_ACTIONS.ARCHIVE;

      const run = async () => {
        showLoadingOverlay('Updating match…');

        try {
          await runMatchLifecycle(match.id, action);
          showSuccessToast('Match updated successfully.');
          await renderEditView(outlet, match.id);
        } catch (error) {
          showErrorToast(getMatchErrorMessage(error));
        } finally {
          hideLoadingOverlay();
        }
      };

      if (confirmArchive) {
        const confirmed = await showConfirmationModal({
          title: 'Archive Match',
          message: MATCH_MESSAGES.CONFIRM_ARCHIVE,
          confirmLabel: 'Archive',
          confirmClass: 'btn-danger',
        });

        if (!confirmed) {
          return;
        }

        await run();
        return;
      }

      await run();
    });
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {void}
 */
function bindResultForm(outlet, match) {
  const form = outlet.querySelector('#ptw-match-result-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  const resolutionSelect = form.querySelector('#ptw-match-result-winnerResolution');
  const winningTeamSelect = form.querySelector('#ptw-match-result-winningTeamId');

  const syncWinningTeamField = () => {
    if (!(resolutionSelect instanceof HTMLSelectElement)
      || !(winningTeamSelect instanceof HTMLSelectElement)) {
      return;
    }

    const isPenalties = resolutionSelect.value === WINNER_RESOLUTION.PENALTIES;
    winningTeamSelect.disabled = !isPenalties;
    winningTeamSelect.required = isPenalties;
    winningTeamSelect.setAttribute('aria-disabled', String(!isPenalties));

    if (!isPenalties) {
      winningTeamSelect.value = '';
    }
  };

  resolutionSelect?.addEventListener('change', syncWinningTeamField);
  syncWinningTeamField();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readResultForm(form);
    const action = form.querySelector('[data-ptw-result-action]')?.getAttribute('data-ptw-result-action');
    showLoadingOverlay(action === 'recalculate' ? 'Recalculating scores…' : 'Publishing result…');

    try {
      if (action === 'recalculate') {
        await recalculateMatchScores(match.id, payload);
        showSuccessToast('Scores recalculated successfully.');
      } else {
        await publishMatchResult(match.id, payload);
        showSuccessToast('Result published successfully.');
      }

      await renderEditView(outlet, match.id);
    } catch (error) {
      showErrorToast(getMatchErrorMessage(error));
    } finally {
      hideLoadingOverlay();
    }
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {boolean} [fromArchived]
 * @returns {void}
 */
function bindMatchDeleteAction(outlet, match, fromArchived = false) {
  const deleteButton = outlet.querySelector('[data-ptw-match-delete]');

  if (!(deleteButton instanceof HTMLButtonElement)) {
    return;
  }

  deleteButton.addEventListener('click', () => {
    void handleDeleteMatch(outlet, match.id, async () => {
      window.history.pushState({}, '', MATCH_ROUTES.ADMIN_LIST);

      if (fromArchived) {
        setAdminTabFlag('matches-archived');
      }

      await renderListView(outlet, fromArchived ? { activeTabId: 'archived' } : {});
    });
  });
}

/**
 * @param {HTMLElement} scope
 * @param {import('./match.service.js').EnrichedMatch[]} allMatches
 * @param {{ search: string, tournamentId: string, status: string, date: string }} filterState
 * @param {{
 *   getCurrentPage: () => number,
 *   setCurrentPage: (page: number) => void,
 *   repaint: () => void,
 *   filterIdPrefix?: string,
 *   paginationId?: string,
 *   allowDelete?: boolean,
 * }} options
 * @returns {void}
 */
function bindListInteractions(scope, allMatches, filterState, options) {
  const {
    getCurrentPage,
    setCurrentPage,
    repaint,
    filterIdPrefix = 'ptw-match-filter',
    paginationId = 'ptw-match-pagination',
    allowDelete = false,
  } = options;

  const search = scope.querySelector(`#${filterIdPrefix}-search`);
  const searchBtn = scope.querySelector(`#${filterIdPrefix}-search-btn`);
  const tournamentFilter = scope.querySelector(`#${filterIdPrefix}-tournament`);
  const statusFilter = scope.querySelector(`#${filterIdPrefix}-status`);
  const dateFilter = scope.querySelector(`#${filterIdPrefix}-date`);

  const applyFilters = () => {
    filterState.search = search instanceof HTMLInputElement ? search.value : '';
    filterState.tournamentId = tournamentFilter instanceof HTMLSelectElement ? tournamentFilter.value : '';
    filterState.status = statusFilter instanceof HTMLSelectElement ? statusFilter.value : '';
    filterState.date = dateFilter instanceof HTMLInputElement ? dateFilter.value : '';
    setCurrentPage(1);
    repaint();
  };

  searchBtn?.addEventListener('click', applyFilters);
  search?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      applyFilters();
    }
  });

  tournamentFilter?.addEventListener('change', applyFilters);
  statusFilter?.addEventListener('change', applyFilters);
  dateFilter?.addEventListener('change', applyFilters);

  if (allowDelete) {
    scope.querySelectorAll('[data-ptw-match-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        const matchId = button.getAttribute('data-match-id');

        if (matchId) {
          void handleDeleteMatch(scope, matchId, async () => {
            const index = allMatches.findIndex((item) => item.id === matchId);

            if (index >= 0) {
              allMatches.splice(index, 1);
            }

            repaint();
          });
        }
      });
    });
  }

  scope.querySelectorAll(`#${paginationId} [data-page]`).forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const page = Number(link.getAttribute('data-page'));
      const filtered = filterMatches(sortMatchesByKickoff(allMatches), filterState);
      const { totalPages } = paginateMatches(filtered, getCurrentPage());

      if (!Number.isInteger(page) || page < 1 || page > totalPages) {
        return;
      }

      setCurrentPage(page);
      repaint();
    });
  });
}
