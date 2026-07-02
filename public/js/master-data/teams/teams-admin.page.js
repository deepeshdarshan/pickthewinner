/**
 * @fileoverview Admin teams management page.
 * @module master-data/teams/teams-admin.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../../components/loading-overlay.component.js';
import { showConfirmationModal } from '../../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../../utils/toast.util.js';
import { AuthorizationService } from '../../authorization/authorization.service.js';
import { Permissions } from '../../authorization/permission.constants.js';
import { TEAM_MESSAGES } from './team.constants.js';
import {
  createTeam,
  deleteTeam,
  getTeamById,
  getTeamErrorMessage,
  listTeams,
  updateTeam,
} from './team.service.js';
import {
  applyFormErrors,
  mountTeamListLoading,
  readTeamForm,
  renderTeamFormPage,
  renderTeamListPage,
  renderTeamNotFound,
} from './team.renderer.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {import('./team.service.js').Team} Team
 */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initTeamsAdminPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initTeamsAdminPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.MANAGE_TEAMS)) {
    outlet.innerHTML = renderTeamNotFound(TEAM_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const teamId = params.get('id');

  if (action === 'create') {
    outlet.innerHTML = renderTeamFormPage(null, { isCreate: true });
    bindTeamForm(outlet, null);
    return;
  }

  if (teamId) {
    await renderEditView(outlet, teamId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  mountTeamListLoading(outlet);
  showLoadingOverlay(TEAM_MESSAGES.LOADING);

  try {
    const teams = await listTeams();
    outlet.innerHTML = renderTeamListPage(teams);
  } catch (error) {
    Logger.error('[TeamsAdmin] List failed:', error);
    outlet.innerHTML = renderTeamNotFound(getTeamErrorMessage(error));
    showErrorToast(getTeamErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} teamId
 * @returns {Promise<void>}
 */
async function renderEditView(outlet, teamId) {
  mountTeamListLoading(outlet);
  showLoadingOverlay(TEAM_MESSAGES.LOADING_TEAM);

  try {
    const team = await getTeamById(teamId, { forceRefresh: true });

    if (!team) {
      outlet.innerHTML = renderTeamNotFound();
      return;
    }

    outlet.innerHTML = renderTeamFormPage(team, { isCreate: false });
    bindTeamForm(outlet, team);
  } catch (error) {
    Logger.error('[TeamsAdmin] Load failed:', error);
    outlet.innerHTML = renderTeamNotFound(getTeamErrorMessage(error));
    showErrorToast(getTeamErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {Team|null} team
 * @returns {void}
 */
function bindTeamForm(outlet, team) {
  const form = outlet.querySelector('#ptw-team-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readTeamForm(form);
    showLoadingOverlay(team ? TEAM_MESSAGES.UPDATING : TEAM_MESSAGES.CREATING);

    try {
      if (team) {
        await updateTeam(team.id, payload);
        showSuccessToast(TEAM_MESSAGES.UPDATED);
      } else {
        await createTeam(payload);
        showSuccessToast(TEAM_MESSAGES.CREATED);
      }

      window.history.pushState({}, '', '/admin/teams');
      await renderListView(outlet);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'validation' in error) {
        applyFormErrors(form, /** @type {{ validation: { errors: Record<string, string> } }} */ (error).validation.errors);
      }

      showErrorToast(getTeamErrorMessage(error));
    } finally {
      hideLoadingOverlay();
    }
  });

  const deleteButton = outlet.querySelector('[data-ptw-team-delete]');

  if (deleteButton instanceof HTMLButtonElement && team) {
    deleteButton.addEventListener('click', () => {
      showConfirmationModal({
        title: 'Delete Team',
        message: TEAM_MESSAGES.CONFIRM_DELETE,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        onConfirm: async () => {
          showLoadingOverlay(TEAM_MESSAGES.DELETING);

          try {
            await deleteTeam(team.id);
            showSuccessToast(TEAM_MESSAGES.DELETED);
            window.history.pushState({}, '', '/admin/teams');
            await renderListView(outlet);
          } catch (error) {
            showErrorToast(getTeamErrorMessage(error));
          } finally {
            hideLoadingOverlay();
          }
        },
      });
    });
  }
}
