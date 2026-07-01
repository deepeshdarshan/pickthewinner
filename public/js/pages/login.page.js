/**
 * @fileoverview Login page — Google SSO for contestants and email/password for admins.
 * @module pages/login.page
 */

import { appSettings } from '../config/app.config.js';
import {
  signInWithGoogle,
  signInWithAdminCredentials,
  getAuthErrorMessage,
} from '../auth/auth.service.js';
import { AUTH_MESSAGES } from '../auth/authentication.constants.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { navigateTo } from '../services/router.service.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { getPostLoginDestination } from '../users/user.navigation.js';
import { USER_ROUTES } from '../users/user.constants.js';
import { Logger } from '../utils/logger.util.js';

/** @type {'contestant'|'admin'} */
let activeMode = 'contestant';

/**
 * Renders the login page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const params = new URLSearchParams(window.location.search);
  activeMode = params.get('mode') === 'admin' ? 'admin' : 'contestant';

  outlet.innerHTML = renderLoginMarkup();
  bindLoginEvents(outlet);
}

/**
 * @returns {string}
 */
function renderLoginMarkup() {
  const isAdmin = activeMode === 'admin';

  return `
    <div class="ptw-login-page">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-12 col-md-8 col-lg-5">
            <div class="text-center mb-4">
              <i class="bi bi-trophy-fill ptw-login__logo" aria-hidden="true"></i>
              <h1 class="h3 mt-3 mb-1">${appSettings.appName}</h1>
              <p class="ptw-text-muted mb-0">Predict matches with your friends.</p>
            </div>

            <div class="card ptw-card">
              <div class="card-body p-4">
                ${isAdmin ? renderAdminForm() : renderContestantForm()}
              </div>
            </div>

            <p class="text-center ptw-text-muted small mt-4 mb-0">
              ${isAdmin
                ? `<a href="/login" data-route class="ptw-link">← Back to Contestant Login</a>`
                : `<a href="/login?mode=admin" data-route class="ptw-link">Admin Login</a>`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @returns {string}
 */
function renderContestantForm() {
  return `
    <div class="d-grid gap-3">
      <button type="button" class="btn btn-ptw-google btn-lg" id="ptw-google-login">
        <i class="bi bi-google me-2" aria-hidden="true"></i>
        Continue with Google
      </button>
      <p class="text-center ptw-text-muted small mb-0">
        Sign in with your Google account to start predicting tournament outcomes.
      </p>
    </div>
  `;
}

/**
 * @returns {string}
 */
function renderAdminForm() {
  return `
    <form id="ptw-admin-login-form" novalidate>
      <h2 class="h5 mb-3">Administrator Sign In</h2>
      <div class="mb-3">
        <label for="ptw-admin-email" class="form-label">Email</label>
        <input
          type="email"
          class="form-control"
          id="ptw-admin-email"
          name="email"
          autocomplete="username"
          required
          aria-required="true"
        >
      </div>
      <div class="mb-4">
        <label for="ptw-admin-password" class="form-label">Password</label>
        <input
          type="password"
          class="form-control"
          id="ptw-admin-password"
          name="password"
          autocomplete="current-password"
          required
          aria-required="true"
        >
      </div>
      <button type="submit" class="btn btn-ptw-primary w-100 btn-lg" id="ptw-admin-login-submit">
        <i class="bi bi-shield-lock me-2" aria-hidden="true"></i>
        Login
      </button>
    </form>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function bindLoginEvents(outlet) {
  const googleBtn = outlet.querySelector('#ptw-google-login');
  const adminForm = outlet.querySelector('#ptw-admin-login-form');

  googleBtn?.addEventListener('click', () => {
    void handleGoogleLogin();
  });

  adminForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleAdminLogin(/** @type {HTMLFormElement} */ (adminForm));
  });
}

/**
 * @returns {Promise<void>}
 */
async function handleGoogleLogin() {
  showLoadingOverlay(AUTH_MESSAGES.SIGNING_IN);

  try {
    const user = await signInWithGoogle();
    showSuccessToast(AUTH_MESSAGES.LOGIN_SUCCESS);

    let destination = USER_ROUTES.COMPLETE_PROFILE;

    try {
      destination = await getPostLoginDestination(user, 'google');
    } catch (error) {
      Logger.warn('[Login] Profile lookup failed after Google sign-in; using complete-profile route.', error);
    }

    await navigateTo(destination, true);
  } catch (error) {
    Logger.error('[Login] Google sign-in failed:', error);
    showErrorToast(getAuthErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLFormElement} form
 * @returns {Promise<void>}
 */
async function handleAdminLogin(form) {
  const emailInput = form.querySelector('#ptw-admin-email');
  const passwordInput = form.querySelector('#ptw-admin-password');

  const email = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : '';
  const password = passwordInput instanceof HTMLInputElement ? passwordInput.value : '';

  if (!email) {
    showErrorToast(AUTH_MESSAGES.EMAIL_REQUIRED);
    return;
  }

  if (!password) {
    showErrorToast(AUTH_MESSAGES.PASSWORD_REQUIRED);
    return;
  }

  showLoadingOverlay(AUTH_MESSAGES.SIGNING_IN);

  try {
    const user = await signInWithAdminCredentials(email, password);
    showSuccessToast(AUTH_MESSAGES.LOGIN_SUCCESS);

    let destination = USER_ROUTES.COMPLETE_PROFILE;

    try {
      destination = await getPostLoginDestination(user, 'email_password');
    } catch (error) {
      Logger.warn('[Login] Profile lookup failed after admin sign-in; using complete-profile route.', error);
    }

    await navigateTo(destination, true);
  } catch (error) {
    Logger.error('[Login] Admin sign-in failed:', error);
    showErrorToast(getAuthErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
