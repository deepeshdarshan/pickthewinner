/**
 * @fileoverview Complete profile page — first-time user onboarding.
 * @module users/complete-profile.page
 */

import { getCurrentUser, isAdminAuthUser } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { navigateTo } from '../services/router.service.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { USER_MESSAGES } from './user.constants.js';
import { UserDomain } from '../domain/user.domain.js';
import {
  completeUserProfile,
  ensureAdminProfile,
  getUserErrorMessage,
  loadCurrentUser,
} from './user.service.js';
import { getDashboardRouteForProfile } from './user.navigation.js';
import { validateCompleteProfileForm } from './user.validator.js';
import {
  applyFormErrors,
  mountCompleteProfileLoading,
  renderCompleteProfileForm,
} from './user.renderer.js';
import { bindDistrictPsCascade } from './renderers/location.renderer.js';
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

  if (isAdminAuthUser(authUser)) {
    try {
      const profile = await ensureAdminProfile(authUser);
      await AuthorizationService.resolve(true);
      await navigateTo(getDashboardRouteForProfile(profile), true);
      return;
    } catch (error) {
      Logger.warn('[CompleteProfile] Admin profile setup failed; redirecting to admin dashboard.', error);
      await navigateTo(AUTH_ROUTES.ADMIN, true);
      return;
    }
  }

  try {
    const profile = await loadCurrentUser(true);

    if (profile && UserDomain.isProfileComplete(profile)) {
      AuthorizationService.applyProfile(profile);
      await navigateTo(getDashboardRouteForProfile(profile), true);
      return;
    }
  } catch (error) {
    Logger.warn('[CompleteProfile] Profile lookup failed; showing onboarding form.', error);
  }

  outlet.innerHTML = renderCompleteProfileForm(authUser);
  bindCompleteProfileForm(outlet, authUser.uid);
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

  bindDistrictPsCascade(form);
}

/**
 * @param {HTMLFormElement} form
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function handleCompleteProfileSubmit(form, uid) {
  const phoneInput = form.querySelector('#ptw-profile-phone');
  const districtInput = form.querySelector('#ptw-profile-district');
  const psInput = form.querySelector('#ptw-profile-pradeshika-sabha');

  const payload = {
    phone: phoneInput instanceof HTMLInputElement ? phoneInput.value : '',
    district: districtInput instanceof HTMLSelectElement ? districtInput.value : '',
    pradeshikaSabha: psInput instanceof HTMLSelectElement ? psInput.value : '',
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

    const profile = await completeUserProfile(uid, {
      phone: payload.phone.replace(/\D/g, ''),
      district: payload.district,
      pradeshikaSabha: payload.pradeshikaSabha,
      name: authUser?.displayName ?? authUser?.email?.split('@')[0] ?? '',
      email: authUser?.email ?? '',
      photoURL: authUser?.photoURL ?? '',
      authProvider,
    });

    showSuccessToast(USER_MESSAGES.PROFILE_CREATED);
    AuthorizationService.applyProfile(profile);
    await navigateTo(getDashboardRouteForProfile(profile), true);
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
