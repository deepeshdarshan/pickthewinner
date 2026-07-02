/**
 * @fileoverview Archived tournaments admin page.
 * @module tournament/tournament-archived.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showConfirmationModal } from '../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { TOURNAMENT_MESSAGES } from './tournament.constants.js';
import {
  deleteTournament,
  getTournamentErrorMessage,
  listTournamentsForAdmin,
  restoreTournament,
} from './tournament.service.js';
import {
  mountTournamentListLoading,
  renderTournamentNotFound,
} from './tournament.renderer.js';
import { renderArchivedTournamentListPage } from './renderers/archived-list.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initArchivedTournamentsPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initArchivedTournamentsPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.CREATE_TOURNAMENT)) {
    outlet.innerHTML = renderTournamentNotFound(TOURNAMENT_MESSAGES.PERMISSION_DENIED);
    return;
  }

  mountTournamentListLoading(outlet);
  showLoadingOverlay(TOURNAMENT_MESSAGES.LOADING);

  try {
    const tournaments = await listTournamentsForAdmin({ archivedOnly: true });
    outlet.innerHTML = renderArchivedTournamentListPage(tournaments);
    bindArchivedActions(outlet);
  } catch (error) {
    Logger.error('[TournamentArchived] List failed:', error);
    outlet.innerHTML = renderTournamentNotFound(getTournamentErrorMessage(error));
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function bindArchivedActions(outlet) {
  outlet.querySelectorAll('[data-ptw-tournament-restore]').forEach((button) => {
    button.addEventListener('click', () => {
      const tournamentId = button.getAttribute('data-tournament-id');

      if (tournamentId) {
        void handleRestore(tournamentId, outlet);
      }
    });
  });

  outlet.querySelectorAll('[data-ptw-tournament-delete]').forEach((button) => {
    button.addEventListener('click', () => {
      const tournamentId = button.getAttribute('data-tournament-id');

      if (tournamentId) {
        void handleDelete(tournamentId, outlet);
      }
    });
  });
}

/**
 * @param {string} tournamentId
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function handleRestore(tournamentId, outlet) {
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
    const tournaments = await listTournamentsForAdmin({ archivedOnly: true });
    outlet.innerHTML = renderArchivedTournamentListPage(tournaments);
    bindArchivedActions(outlet);
  } catch (error) {
    Logger.error('[TournamentArchived] Restore failed:', error);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {string} tournamentId
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function handleDelete(tournamentId, outlet) {
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
    const tournaments = await listTournamentsForAdmin({ archivedOnly: true });
    outlet.innerHTML = renderArchivedTournamentListPage(tournaments);
    bindArchivedActions(outlet);
  } catch (error) {
    Logger.error('[TournamentArchived] Delete failed:', error);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
