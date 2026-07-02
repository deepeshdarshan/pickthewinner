/**
 * @fileoverview Admin venues management page.
 * @module master-data/venues/venues-admin.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../../components/loading-overlay.component.js';
import { showConfirmationModal } from '../../components/confirmation-modal.component.js';
import { showSuccessToast, showErrorToast } from '../../utils/toast.util.js';
import { AuthorizationService } from '../../authorization/authorization.service.js';
import { Permissions } from '../../authorization/permission.constants.js';
import { VENUE_MESSAGES } from './venue.constants.js';
import {
  createVenue,
  deleteVenue,
  getVenueById,
  getVenueErrorMessage,
  listVenues,
  updateVenue,
} from './venue.service.js';
import {
  applyFormErrors,
  mountVenueListLoading,
  readVenueForm,
  renderVenueFormPage,
  renderVenueListPage,
  renderVenueNotFound,
} from './venue.renderer.js';
import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {import('./venue.service.js').Venue} Venue
 */

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initVenuesAdminPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initVenuesAdminPage(outlet) {
  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.MANAGE_VENUES)) {
    outlet.innerHTML = renderVenueNotFound(VENUE_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const venueId = params.get('id');

  if (action === 'create') {
    outlet.innerHTML = renderVenueFormPage(null, { isCreate: true });
    bindVenueForm(outlet, null);
    return;
  }

  if (venueId) {
    await renderEditView(outlet, venueId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  mountVenueListLoading(outlet);
  showLoadingOverlay(VENUE_MESSAGES.LOADING);

  try {
    const venues = await listVenues();
    outlet.innerHTML = renderVenueListPage(venues);
  } catch (error) {
    Logger.error('[VenuesAdmin] List failed:', error);
    outlet.innerHTML = renderVenueNotFound(getVenueErrorMessage(error));
    showErrorToast(getVenueErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} venueId
 * @returns {Promise<void>}
 */
async function renderEditView(outlet, venueId) {
  mountVenueListLoading(outlet);
  showLoadingOverlay(VENUE_MESSAGES.LOADING_VENUE);

  try {
    const venue = await getVenueById(venueId, { forceRefresh: true });

    if (!venue) {
      outlet.innerHTML = renderVenueNotFound();
      return;
    }

    outlet.innerHTML = renderVenueFormPage(venue, { isCreate: false });
    bindVenueForm(outlet, venue);
  } catch (error) {
    Logger.error('[VenuesAdmin] Load failed:', error);
    outlet.innerHTML = renderVenueNotFound(getVenueErrorMessage(error));
    showErrorToast(getVenueErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {Venue|null} venue
 * @returns {void}
 */
function bindVenueForm(outlet, venue) {
  const form = outlet.querySelector('#ptw-venue-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = readVenueForm(form);
    showLoadingOverlay(venue ? VENUE_MESSAGES.UPDATING : VENUE_MESSAGES.CREATING);

    try {
      if (venue) {
        await updateVenue(venue.id, payload);
        showSuccessToast(VENUE_MESSAGES.UPDATED);
      } else {
        await createVenue(payload);
        showSuccessToast(VENUE_MESSAGES.CREATED);
      }

      window.history.pushState({}, '', '/admin/venues');
      await renderListView(outlet);
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'validation' in error) {
        applyFormErrors(form, /** @type {{ validation: { errors: Record<string, string> } }} */ (error).validation.errors);
      }

      showErrorToast(getVenueErrorMessage(error));
    } finally {
      hideLoadingOverlay();
    }
  });

  const deleteButton = outlet.querySelector('[data-ptw-venue-delete]');

  if (deleteButton instanceof HTMLButtonElement && venue) {
    deleteButton.addEventListener('click', () => {
      showConfirmationModal({
        title: 'Delete Venue',
        message: VENUE_MESSAGES.CONFIRM_DELETE,
        confirmLabel: 'Delete',
        confirmVariant: 'danger',
        onConfirm: async () => {
          showLoadingOverlay(VENUE_MESSAGES.DELETING);

          try {
            await deleteVenue(venue.id);
            showSuccessToast(VENUE_MESSAGES.DELETED);
            window.history.pushState({}, '', '/admin/venues');
            await renderListView(outlet);
          } catch (error) {
            showErrorToast(getVenueErrorMessage(error));
          } finally {
            hideLoadingOverlay();
          }
        },
      });
    });
  }
}
