/**
 * @fileoverview Profile page — view and edit user profile.
 * @module users/profile.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { USER_MESSAGES } from './user.constants.js';
import {
  getUserErrorMessage,
  loadCurrentUser,
  updateUser,
} from './user.service.js';
import { validateProfileUpdate } from './user.validator.js';
import {
  applyFormErrors,
  mountProfileLoading,
  readNotificationPreferences,
  renderProfileEmpty,
  renderProfilePage,
} from './user.renderer.js';

/**
 * Renders and initializes the profile page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initProfilePage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initProfilePage(outlet) {
  mountProfileLoading(outlet);
  showLoadingOverlay(USER_MESSAGES.LOADING_PROFILE);

  try {
    const authUser = getCurrentUser();
    const profile = await loadCurrentUser(true);

    if (!profile) {
      outlet.innerHTML = renderProfileEmpty();
      return;
    }

    outlet.innerHTML = renderProfilePage(profile, authUser);
    bindProfileForm(outlet, profile.uid);
  } catch (error) {
    console.error('[Profile] Failed to load:', error);
    outlet.innerHTML = renderProfileEmpty(getUserErrorMessage(error));
    showErrorToast(getUserErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} uid
 * @returns {void}
 */
function bindProfileForm(outlet, uid) {
  const form = outlet.querySelector('#ptw-profile-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleProfileUpdate(form, uid);
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function handleProfileUpdate(form, uid) {
  const phoneInput = form.querySelector('#ptw-edit-phone');
  const timezoneInput = form.querySelector('#ptw-edit-timezone');

  const payload = {
    phone: phoneInput instanceof HTMLInputElement ? phoneInput.value : '',
    timezone: timezoneInput instanceof HTMLSelectElement ? timezoneInput.value : '',
    notificationPreferences: readNotificationPreferences(form),
  };

  const validation = validateProfileUpdate(payload);

  if (!validation.valid) {
    applyFormErrors(form, validation.errors);
    return;
  }

  applyFormErrors(form, {});
  showLoadingOverlay(USER_MESSAGES.UPDATING_PROFILE);

  try {
    await updateUser(uid, {
      phone: payload.phone.replace(/\D/g, ''),
      timezone: payload.timezone,
      notificationPreferences: payload.notificationPreferences,
    });

    showSuccessToast(USER_MESSAGES.PROFILE_UPDATED);
  } catch (error) {
    console.error('[Profile] Update failed:', error);
    showErrorToast(getUserErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
