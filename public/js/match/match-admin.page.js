/**
 * @fileoverview Admin match management page.
 * @module match/match-admin.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showConfirmationModal } from '../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { bindSearchableSelects } from '../master-data/shared/searchable-select.component.js';
import { listTeams } from '../master-data/teams/team.service.js';
import { listVenues } from '../master-data/venues/venue.service.js';
import { listTournamentsForAdmin } from '../tournament/tournament.service.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { TOURNAMENT_STATUS } from '../domain/tournament.domain.js';
import { MATCH_MESSAGES, MATCH_LIFECYCLE_ACTIONS } from './match.constants.js';
import {
  createMatch,
  getMatchById,
  getMatchErrorMessage,
  listMatchesForAdmin,
  runMatchLifecycle,
  updateMatch,
} from './match.service.js';
import { publishMatchResult, recalculateMatchScores } from './match-result.service.js';
import {
  applyFormErrors,
  mountMatchListLoading,
  readMatchForm,
  readResultForm,
  renderMatchDetailPage,
  renderMatchFormPage,
  renderMatchListPage,
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
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const [matches, tournaments] = await Promise.all([
      listMatchesForAdmin(),
      listTournamentsForAdmin(),
    ]);

    outlet.innerHTML = renderMatchListPage(matches, { tournaments });
    bindListFilters(outlet, matches, tournaments);
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
    const [tournaments, teams, venues] = await Promise.all([
      listActiveTournaments(),
      listTeams({ activeOnly: true }),
      listVenues({ activeOnly: true }),
    ]);

    outlet.innerHTML = renderMatchFormPage({
      tournaments,
      teams,
      venues,
      isCreate: true,
    });

    bindSearchableSelects(outlet);
    bindMatchForm(outlet, null, tournaments, teams, venues);
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

    const [tournaments, teams, venues, config] = await Promise.all([
      listActiveTournaments(),
      listTeams({ activeOnly: true }),
      listVenues({ activeOnly: true }),
      TournamentConfigurationService.load(match.tournamentId),
    ]);

    outlet.innerHTML = renderMatchDetailPage(match, {
      tournaments,
      teams,
      venues,
      inheritedConfig: config,
    });

    bindSearchableSelects(outlet);
    bindMatchForm(outlet, match, tournaments, teams, venues);
    bindLifecycleActions(outlet, match);
    bindResultForm(outlet, match);
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
    && [TOURNAMENT_STATUS.PUBLISHED, TOURNAMENT_STATUS.LIVE, TOURNAMENT_STATUS.REGISTRATION_OPEN].includes(tournament.status));
}

/**
 * @param {HTMLElement} outlet
 * @param {import('./match.service.js').EnrichedMatch|null} match
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @param {import('../master-data/teams/team.service.js').Team[]} teams
 * @param {import('../master-data/venues/venue.service.js').Venue[]} venues
 * @returns {void}
 */
function bindMatchForm(outlet, match, tournaments, teams, venues) {
  const form = outlet.querySelector('#ptw-match-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readMatchForm(form);
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
  void venues;

  bindTournamentPreview(outlet, tournaments);
}

/**
 * @param {HTMLElement} outlet
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @returns {void}
 */
function bindTournamentPreview(outlet, tournaments) {
  const hidden = outlet.querySelector('#ptw-match-tournamentId');

  if (!(hidden instanceof HTMLInputElement)) {
    return;
  }

  hidden.addEventListener('change', async () => {
    const tournament = tournaments.find((item) => item.id === hidden.value);
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
    bindSearchableSelects(outlet);
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
        showConfirmationModal({
          title: 'Archive Match',
          message: MATCH_MESSAGES.CONFIRM_ARCHIVE ?? 'Archive this match?',
          confirmLabel: 'Archive',
          confirmVariant: 'danger',
          onConfirm: run,
        });
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
 * @param {import('./match.service.js').EnrichedMatch[]} matches
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @returns {void}
 */
function bindListFilters(outlet, matches, tournaments) {
  const search = outlet.querySelector('#ptw-match-filter-search');
  const tournamentFilter = outlet.querySelector('#ptw-match-filter-tournament');
  const roundFilter = outlet.querySelector('#ptw-match-filter-round');
  const statusFilter = outlet.querySelector('#ptw-match-filter-status');
  const dateFilter = outlet.querySelector('#ptw-match-filter-date');

  const apply = () => {
    const term = search instanceof HTMLInputElement ? search.value.trim().toLowerCase() : '';
    const tournamentId = tournamentFilter instanceof HTMLSelectElement ? tournamentFilter.value : '';
    const round = roundFilter instanceof HTMLSelectElement ? roundFilter.value : '';
    const status = statusFilter instanceof HTMLSelectElement ? statusFilter.value : '';
    const date = dateFilter instanceof HTMLInputElement ? dateFilter.value : '';

    outlet.querySelectorAll('[data-match-id]').forEach((row) => {
      if (!(row instanceof HTMLElement)) {
        return;
      }

      const match = matches.find((item) => item.id === row.dataset.matchId);
      let visible = true;

      if (match) {
        if (tournamentId && match.tournamentId !== tournamentId) visible = false;
        if (round && match.round !== round) visible = false;
        if (status && match.status !== status) visible = false;
        if (date) {
          const kickoff = match.kickoffUtc && typeof match.kickoffUtc === 'object' && 'toDate' in match.kickoffUtc
            ? match.kickoffUtc.toDate().toISOString().slice(0, 10)
            : '';
          if (kickoff !== date) visible = false;
        }
        if (term && !JSON.stringify(match).toLowerCase().includes(term)) visible = false;
      }

      row.hidden = !visible;
    });
  };

  [search, tournamentFilter, roundFilter, statusFilter, dateFilter].forEach((element) => {
    element?.addEventListener('input', apply);
    element?.addEventListener('change', apply);
  });

  void tournaments;
}
