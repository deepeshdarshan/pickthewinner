/**
 * @fileoverview Complete profile page — first-time user onboarding.
 * @module users/complete-profile.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { navigateTo } from '../services/router.service.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { USER_MESSAGES, USER_ROLES } from './user.constants.js';
import {
  createUser,
  getUserErrorMessage,
  loadCurrentUser,
} from './user.service.js';
import { validateCompleteProfileForm } from './user.validator.js';
import {
  applyFormErrors,
  mountCompleteProfileLoading,
  readNotificationPreferences,
  renderCompleteProfileForm,
} from './user.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders and initializes the complete-profile page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initCompleteProfilePage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initCompleteProfilePage(outlet) {
  mountCompleteProfileLoading(outlet);

  let authUser = getCurrentUser();

  if (!authUser) {
    await new Promise((resolve) => { window.setTimeout(resolve, 400); });
    authUser = getCurrentUser();
  }

  if (!authUser) {
    await navigateTo(AUTH_ROUTES.LOGIN, true);
    return;
  }

  outlet.innerHTML = renderCompleteProfileForm(authUser);
  bindCompleteProfileForm(outlet, authUser.uid);

  // Background check — redirect returning users without blocking the form.
  void redirectIfProfileExists();
}

/**
 * Redirects to the dashboard when a Firestore profile already exists.
 * @returns {Promise<void>}
 */
async function redirectIfProfileExists() {
  try {
    const existingProfile = await loadCurrentUser();

    if (!existingProfile) {
      return;
    }

    const destination = existingProfile.role === USER_ROLES.ADMIN
      ? AUTH_ROUTES.ADMIN
      : AUTH_ROUTES.DASHBOARD;
    await navigateTo(destination, true);
  } catch (error) {
    Logger.warn('[CompleteProfile] Could not verify existing profile:', error);
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} uid
 * @returns {void}
 */
function bindCompleteProfileForm(outlet, uid) {
  const form = outlet.querySelector('#ptw-complete-profile-form');

  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleCompleteProfileSubmit(form, uid);
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function handleCompleteProfileSubmit(form, uid) {
  const phoneInput = form.querySelector('#ptw-profile-phone');
  const timezoneInput = form.querySelector('#ptw-profile-timezone');

  const payload = {
    phone: phoneInput instanceof HTMLInputElement ? phoneInput.value : '',
    timezone: timezoneInput instanceof HTMLSelectElement ? timezoneInput.value : '',
    notificationPreferences: readNotificationPreferences(form),
  };

  const validation = validateCompleteProfileForm(payload);

  if (!validation.valid) {
    applyFormErrors(form, validation.errors);
    return;
  }

  applyFormErrors(form, {});
  showLoadingOverlay(USER_MESSAGES.CREATING_PROFILE);

  try {
    const authUser = getCurrentUser();
    const authProvider = resolveAuthProvider(authUser);

    const profile = await createUser(uid, {
      phone: payload.phone.replace(/\D/g, ''),
      timezone: payload.timezone,
      notificationPreferences: payload.notificationPreferences,
      name: authUser?.displayName ?? authUser?.email?.split('@')[0] ?? '',
      email: authUser?.email ?? '',
      photoURL: authUser?.photoURL ?? '',
      authProvider,
    });

    showSuccessToast(USER_MESSAGES.PROFILE_CREATED);
    await AuthorizationService.resolve(true);
    const destination = profile.role === USER_ROLES.ADMIN
      ? AUTH_ROUTES.ADMIN
      : AUTH_ROUTES.DASHBOARD;
    await navigateTo(destination, true);
  } catch (error) {
    Logger.error('[CompleteProfile] Create failed:', error);
    showErrorToast(getUserErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Derives the auth provider key from a Firebase user.
 * @param {import('firebase/auth').User|null} authUser
 * @returns {string}
 */
function resolveAuthProvider(authUser) {
  const providerId = authUser?.providerData?.[0]?.providerId;

  if (providerId === 'password') {
    return 'email_password';
  }

  return 'google';
}
