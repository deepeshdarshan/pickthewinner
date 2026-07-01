/**
 * @fileoverview Settings page — theme, timezone, notifications, and logout.
 * @module pages/settings.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { AppContext } from '../app/app.context.js';
import { appSettings } from '../config/app.config.js';
import { AUTH_MESSAGES } from '../auth/authentication.constants.js';
import { signOut } from '../auth/auth.service.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { navigateTo } from '../services/router.service.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { getAuthErrorMessage } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { loadCurrentUser, updateUser } from '../users/user.service.js';
import { USER_MESSAGES } from '../users/user.constants.js';
import { getUserErrorMessage } from '../users/user.service.js';
import { TIMEZONE_OPTIONS } from '../users/user.constants.js';
import { getLocalItem, setLocalItem } from '../utils/storage.util.js';
import { STORAGE_KEYS } from '../config/application.constants.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders the settings page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initSettingsPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initSettingsPage(outlet) {
  showLoadingOverlay(USER_MESSAGES.LOADING_PROFILE);

  try {
    const profile = await loadCurrentUser(true);
    const theme = getLocalItem(STORAGE_KEYS.THEME, appSettings.theme);

    outlet.innerHTML = renderSettingsMarkup(profile, theme);
    bindSettingsEvents(outlet, profile?.uid);
  } catch (error) {
    Logger.error('[Settings] Failed to load:', error);
    showErrorToast(getUserErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {import('../users/user.service.js').UserProfile|null} profile
 * @param {string} theme
 * @returns {string}
 */
function renderSettingsMarkup(profile, theme) {
  const timezone = profile?.timezone ?? AppContext.getTimezone();
  const notifyEmail = profile?.notificationPreferences?.email ?? false;
  const notifyBrowser = profile?.notificationPreferences?.browser ?? true;

  const timezoneOptions = TIMEZONE_OPTIONS.map((option) => `
    <option value="${option.value}"${option.value === timezone ? ' selected' : ''}>
      ${option.label}
    </option>
  `).join('');

  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: 'Settings',
        subtitle: 'Application preferences',
      })}

      <div class="row g-4">
        <div class="col-12 col-lg-8">
          <div class="card ptw-card mb-4">
            <div class="card-header">
              <h2 class="h6 mb-0">Appearance</h2>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label for="ptw-settings-theme" class="form-label">Theme</label>
                <select class="form-select" id="ptw-settings-theme" name="theme" aria-label="Theme preference">
                  <option value="dark"${theme === 'dark' ? ' selected' : ''}>Dark</option>
                  <option value="light"${theme === 'light' ? ' selected' : ''}>Light</option>
                </select>
                <p class="form-text ptw-text-muted mb-0">Theme switching will be fully applied in a future update.</p>
              </div>
            </div>
          </div>

          <div class="card ptw-card mb-4">
            <div class="card-header">
              <h2 class="h6 mb-0">Preferences</h2>
            </div>
            <div class="card-body">
              <form id="ptw-settings-form" novalidate>
                <div class="mb-3">
                  <label for="ptw-settings-timezone" class="form-label">Timezone</label>
                  <select class="form-select" id="ptw-settings-timezone" name="timezone" required aria-required="true">
                    ${timezoneOptions}
                  </select>
                </div>

                <fieldset class="mb-4">
                  <legend class="form-label fs-6 mb-2">Notification Preferences</legend>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="ptw-settings-notify-email" name="notifyEmail"${notifyEmail ? ' checked' : ''}>
                    <label class="form-check-label" for="ptw-settings-notify-email">Email notifications</label>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="ptw-settings-notify-browser" name="notifyBrowser"${notifyBrowser ? ' checked' : ''}>
                    <label class="form-check-label" for="ptw-settings-notify-browser">Browser notifications</label>
                  </div>
                </fieldset>

                <button type="submit" class="btn btn-ptw-primary">
                  <i class="bi bi-save me-2" aria-hidden="true"></i>
                  Save Preferences
                </button>
              </form>
            </div>
          </div>

          <div class="card ptw-card mb-4">
            <div class="card-header">
              <h2 class="h6 mb-0">About</h2>
            </div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4 ptw-text-muted">Application</dt>
                <dd class="col-sm-8">${appSettings.appName}</dd>
                <dt class="col-sm-4 ptw-text-muted">Version</dt>
                <dd class="col-sm-8">${appSettings.version}</dd>
              </dl>
            </div>
          </div>

          <div class="card ptw-card border-danger">
            <div class="card-body">
              <h2 class="h6 mb-2">Session</h2>
              <p class="ptw-text-muted small mb-3">Sign out of your account on this device.</p>
              <button type="button" class="btn btn-outline-danger" id="ptw-settings-logout">
                <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @param {string|undefined} uid
 * @returns {void}
 */
function bindSettingsEvents(outlet, uid) {
  const form = outlet.querySelector('#ptw-settings-form');
  const themeSelect = outlet.querySelector('#ptw-settings-theme');
  const logoutBtn = outlet.querySelector('#ptw-settings-logout');

  themeSelect?.addEventListener('change', () => {
    if (themeSelect instanceof HTMLSelectElement) {
      setLocalItem(STORAGE_KEYS.THEME, themeSelect.value);
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (uid) {
      void handleSavePreferences(/** @type {HTMLFormElement} */ (form), uid);
    }
  });

  logoutBtn?.addEventListener('click', () => {
    void handleLogout();
  });
}

/**
 * @param {HTMLFormElement} form
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function handleSavePreferences(form, uid) {
  const timezoneInput = form.querySelector('#ptw-settings-timezone');
  const emailNotify = form.querySelector('#ptw-settings-notify-email');
  const browserNotify = form.querySelector('#ptw-settings-notify-browser');

  showLoadingOverlay(USER_MESSAGES.UPDATING_PROFILE);

  try {
    await updateUser(uid, {
      timezone: timezoneInput instanceof HTMLSelectElement ? timezoneInput.value : undefined,
      notificationPreferences: {
        email: emailNotify instanceof HTMLInputElement ? emailNotify.checked : false,
        browser: browserNotify instanceof HTMLInputElement ? browserNotify.checked : true,
      },
    });

    showSuccessToast(USER_MESSAGES.PROFILE_UPDATED);
  } catch (error) {
    Logger.error('[Settings] Save failed:', error);
    showErrorToast(getUserErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @returns {Promise<void>}
 */
async function handleLogout() {
  showLoadingOverlay(AUTH_MESSAGES.SIGNING_OUT);

  try {
    await signOut();
    showSuccessToast(AUTH_MESSAGES.LOGOUT_SUCCESS);
    await navigateTo(AUTH_ROUTES.LOGIN, true);
  } catch (error) {
    Logger.error('[Settings] Logout failed:', error);
    showErrorToast(getAuthErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
