/**
 * @fileoverview Admin tournament management page — list, create, edit, and lifecycle actions.
 * @module tournament/tournament-admin.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showConfirmationModal } from '../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { navigateTo } from '../services/router.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { TournamentDomain } from '../domain/tournament.domain.js';
import { TournamentConfigurationService } from './configuration/TournamentConfigurationService.js';
import { matchRepository } from '../match/match.repository.js';
import { TOURNAMENT_MESSAGES, TOURNAMENT_ROUTES } from './tournament.constants.js';
import {
  archiveTournament,
  completeTournament,
  createTournament,
  deleteTournament,
  getTournamentById,
  getTournamentErrorMessage,
  goLive,
  listTournamentsForAdmin,
  publishTournament,
  restoreTournament,
  setActiveTournament,
  deactivateTournament,
  updateTournament,
} from './tournament.service.js';
import {
  activateAdminListTab,
  consumeAdminTabFlag,
  setAdminTabFlag,
} from '../components/admin-list-tabs.component.js';
import {
  applyFormErrors,
  mountTournamentListLoading,
  readTournamentForm,
  renderTournamentDetailPage,
  renderTournamentFormPage,
  renderTournamentListPageWithTabs,
  renderTournamentNotFound,
  bindTournamentMatchBehaviourPreview,
} from './tournament.renderer.js';
import { renderArchivedDeleteActions } from './renderers/detail.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @typedef {import('./tournament.service.js').Tournament} Tournament
 */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initTournamentAdminPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initTournamentAdminPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.CREATE_TOURNAMENT)) {
    outlet.innerHTML = renderTournamentNotFound(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const tournamentId = params.get('id');

  if (action === 'create') {
    outlet.innerHTML = renderTournamentFormPage(null, { isCreate: true });
    bindTournamentForm(outlet, null);
    return;
  }

  if (tournamentId) {
    await renderEditView(outlet, tournamentId, params.get('mode') === 'view');
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet, options = {}) {
  const { activeTabId = consumeAdminTabFlag('tournaments-archived') ? 'archived' : 'active' } = options;

  mountTournamentListLoading(outlet);
  showLoadingOverlay(TOURNAMENT_MESSAGES.LOADING);

  try {
    const [activeTournaments, archivedTournaments] = await Promise.all([
      listTournamentsForAdmin(),
      listTournamentsForAdmin({ archivedOnly: true }),
    ]);

    outlet.innerHTML = renderTournamentListPageWithTabs(activeTournaments, archivedTournaments, { activeTabId });
    bindArchivedActions(outlet, () => renderListView(outlet, { activeTabId: 'archived' }));

    if (activeTabId === 'archived') {
      activateAdminListTab(outlet, 'archived', 'ptw-tournament-list-tabs');
    }
  } catch (error) {
    Logger.error('[TournamentAdmin] List failed:', error);
    outlet.innerHTML = renderTournamentNotFound(getTournamentErrorMessage(error));
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} tournamentId
 * @param {boolean} [forceReadOnly]
 * @param {{ refresh?: boolean }} [options]
 * @returns {Promise<void>}
 */
async function renderEditView(outlet, tournamentId, forceReadOnly = false, options = {}) {
  const { refresh = false } = options;

  if (!refresh) {
    mountTournamentListLoading(outlet);
    showLoadingOverlay(TOURNAMENT_MESSAGES.LOADING_TOURNAMENT);
  }

  try {
    const [tournament, matches] = await Promise.all([
      getTournamentById(tournamentId, { forceRefresh: true }),
      matchRepository.listByTournament(tournamentId),
    ]);

    if (!tournament) {
      outlet.innerHTML = renderTournamentNotFound();
      return;
    }

    const incompleteVisibleMatchCount = TournamentDomain.getIncompleteVisibleMatches(matches).length;

    const readOnly = forceReadOnly || TournamentDomain.isTournamentReadOnly(tournament.status) || tournament.archived;

    if (readOnly && forceReadOnly) {
      outlet.innerHTML = renderTournamentFormPage(tournament, { readOnly: true, isCreate: false });

      if (TournamentDomain.isTournamentArchived(tournament)) {
        outlet.insertAdjacentHTML('beforeend', renderArchivedDeleteActions(tournament));
        bindDeleteAction(outlet, tournament);
      }

      return;
    }

    outlet.innerHTML = renderTournamentDetailPage(tournament, { incompleteVisibleMatchCount });
    bindTournamentForm(outlet, tournament);
    bindTournamentMatchBehaviourPreview(outlet);
    bindLifecycleActions(outlet, tournament);
    bindDeleteAction(outlet, tournament);
    void TournamentConfigurationService.load(tournament.id);
  } catch (error) {
    Logger.error('[TournamentAdmin] Load failed:', error);
    outlet.innerHTML = renderTournamentNotFound(getTournamentErrorMessage(error));
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    if (!refresh) {
      hideLoadingOverlay();
    }
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {Tournament|null} tournament
 * @returns {void}
 */
function bindTournamentForm(outlet, tournament) {
  const form = outlet.querySelector('#ptw-tournament-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleTournamentSubmit(form, tournament?.id ?? null);
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {string|null} tournamentId
 * @returns {Promise<void>}
 */
async function handleTournamentSubmit(form, tournamentId) {
  const authUser = getCurrentUser();

  if (!authUser) {
    showErrorToast(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const payload = readTournamentForm(form);

  showLoadingOverlay(tournamentId ? TOURNAMENT_MESSAGES.UPDATING : TOURNAMENT_MESSAGES.CREATING);

  try {
    if (tournamentId) {
      const updated = await updateTournament(tournamentId, payload, authUser.uid);
      showSuccessToast(TOURNAMENT_MESSAGES.UPDATED);
      await navigateTo(`${TOURNAMENT_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(tournamentId)}`);
      return;
    }

    const created = await createTournament(payload, authUser.uid);
    showSuccessToast(TOURNAMENT_MESSAGES.CREATED);
    await navigateTo(`${TOURNAMENT_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(created.id)}`);
  } catch (error) {
    Logger.error('[TournamentAdmin] Save failed:', error);

    if (typeof error === 'object' && error !== null && 'validation' in error) {
      applyFormErrors(form, /** @type {{ validation: { errors: Record<string, string> } }} */ (error).validation.errors);
    }

    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {Tournament} tournament
 * @returns {void}
 */
function bindLifecycleActions(outlet, tournament) {
  outlet.querySelectorAll('[data-ptw-lifecycle]').forEach((button) => {
    button.addEventListener('click', () => {
      const action = button.getAttribute('data-ptw-lifecycle');

      if (action) {
        void handleLifecycleAction(action, tournament.id, outlet);
      }
    });
  });
}

/**
 * @param {string} action
 * @param {string} tournamentId
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function handleLifecycleAction(action, tournamentId, outlet) {
  const authUser = getCurrentUser();

  if (!authUser) {
    showErrorToast(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const confirmed = await confirmLifecycleAction(action);

  if (!confirmed) {
    return;
  }

  showLoadingOverlay(TOURNAMENT_MESSAGES.UPDATING);

  try {
    switch (action) {
      case 'publish': {
        await publishTournament(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.PUBLISHED_AND_ACTIVATED);
        break;
      }
      case 'go-live':
        await goLive(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.WENT_LIVE);
        break;
      case 'complete':
        await completeTournament(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.COMPLETED);
        break;
      case 'archive':
        await archiveTournament(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.ARCHIVED);
        setAdminTabFlag('tournaments-archived');
        await navigateTo(TOURNAMENT_ROUTES.ADMIN_LIST);
        return;
      case 'set-active':
        await setActiveTournament(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.ACTIVE_SET);
        break;
      case 'set-inactive':
        await deactivateTournament(tournamentId, authUser.uid);
        showSuccessToast(TOURNAMENT_MESSAGES.INACTIVE_SET);
        break;
      default:
        showErrorToast(TOURNAMENT_MESSAGES.GENERIC_ERROR);
        return;
    }

    await renderEditView(outlet, tournamentId, false, { refresh: true });
  } catch (error) {
    Logger.error('[TournamentAdmin] Lifecycle action failed:', error);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {string} action
 * @returns {Promise<boolean>}
 */
async function confirmLifecycleAction(action) {
  switch (action) {
    case 'publish':
      return showConfirmationModal({
        title: 'Publish Tournament',
        message: TOURNAMENT_MESSAGES.CONFIRM_PUBLISH,
        confirmLabel: 'Publish',
      });
    case 'go-live':
      return showConfirmationModal({
        title: 'Go Live',
        message: TOURNAMENT_MESSAGES.CONFIRM_GO_LIVE,
        confirmLabel: 'Go Live',
        confirmClass: 'btn-success',
      });
    case 'complete':
      return showConfirmationModal({
        title: 'Complete Tournament',
        message: TOURNAMENT_MESSAGES.CONFIRM_COMPLETE,
        confirmLabel: 'Complete',
        confirmClass: 'btn-warning',
      });
    case 'archive':
      return showConfirmationModal({
        title: 'Archive Tournament',
        message: TOURNAMENT_MESSAGES.CONFIRM_ARCHIVE,
        confirmLabel: 'Archive',
        confirmClass: 'btn-danger',
      });
    case 'set-active':
      return showConfirmationModal({
        title: 'Set Active Tournament',
        message: TOURNAMENT_MESSAGES.CONFIRM_SET_ACTIVE,
        confirmLabel: 'Set Active',
        confirmClass: 'btn-success',
      });
    case 'set-inactive':
      return showConfirmationModal({
        title: 'Mark Tournament Inactive',
        message: TOURNAMENT_MESSAGES.CONFIRM_SET_INACTIVE,
        confirmLabel: 'Inactive',
        confirmClass: 'btn-secondary',
      });
    default:
      return true;
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {Tournament} tournament
 * @returns {void}
 */
function bindDeleteAction(outlet, tournament) {
  const deleteButton = outlet.querySelector('[data-ptw-tournament-delete]');

  if (!(deleteButton instanceof HTMLButtonElement)) {
    return;
  }

  deleteButton.addEventListener('click', () => {
    void handleDeleteTournament(tournament.id, TOURNAMENT_ROUTES.ADMIN_LIST);
  });
}

/**
 * @param {HTMLElement} outlet
 * @param {() => Promise<void>} onRefresh
 * @returns {void}
 */
function bindArchivedActions(outlet, onRefresh) {
  outlet.querySelectorAll('[data-ptw-tournament-tab="archived"] [data-ptw-tournament-restore]').forEach((button) => {
    button.addEventListener('click', () => {
      const tournamentId = button.getAttribute('data-tournament-id');

      if (tournamentId) {
        void handleRestore(tournamentId, onRefresh);
      }
    });
  });

  outlet.querySelectorAll('[data-ptw-tournament-tab="archived"] [data-ptw-tournament-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const tournamentId = button.getAttribute('data-tournament-id');

      if (tournamentId) {
        void handleDeleteTournament(tournamentId, onRefresh);
      }
    });
  });
}

/**
 * @param {string} tournamentId
 * @param {() => Promise<void>} onSuccess
 * @returns {Promise<void>}
 */
async function handleRestore(tournamentId, onSuccess) {
  const authUser = getCurrentUser();

  if (!authUser) {
    showErrorToast(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const confirmed = await showConfirmationModal({
    title: 'Restore Tournament',
    message: TOURNAMENT_MESSAGES.CONFIRM_RESTORE,
    confirmLabel: 'Restore',
    confirmClass: 'btn-success',
  });

  if (!confirmed) {
    return;
  }

  showLoadingOverlay(TOURNAMENT_MESSAGES.UPDATING);

  try {
    await restoreTournament(tournamentId, authUser.uid);
    showSuccessToast(TOURNAMENT_MESSAGES.RESTORED);
    await onSuccess();
  } catch (error) {
    Logger.error('[TournamentAdmin] Restore failed:', error);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {string} tournamentId
 * @param {string | (() => Promise<void>)} redirectToOrCallback
 * @returns {Promise<void>}
 */
async function handleDeleteTournament(tournamentId, redirectToOrCallback) {
  const authUser = getCurrentUser();

  if (!authUser) {
    showErrorToast(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const confirmed = await showConfirmationModal({
    title: 'Delete Tournament',
    message: TOURNAMENT_MESSAGES.CONFIRM_DELETE,
    confirmLabel: 'Delete Permanently',
    confirmClass: 'btn-danger',
  });

  if (!confirmed) {
    return;
  }

  showLoadingOverlay(TOURNAMENT_MESSAGES.DELETING);

  try {
    await deleteTournament(tournamentId, authUser.uid);
    showSuccessToast(TOURNAMENT_MESSAGES.DELETED);

    if (typeof redirectToOrCallback === 'function') {
      await redirectToOrCallback();
    } else {
      await navigateTo(redirectToOrCallback);
    }
  } catch (error) {
    Logger.error('[TournamentAdmin] Delete failed:', error);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
