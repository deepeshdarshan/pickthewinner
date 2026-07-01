/**
 * @fileoverview Settings page — theme, timezone, notifications, and logout.
 * @module pages/settings.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { AppContext } from '../app/app.context.js';
import { appSettings } from '../config/app.config.js';
import { performLogout } from '../auth/actions/logout.action.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { loadCurrentUser, updateUser, getUserErrorMessage } from '../users/user.service.js';
import { USER_MESSAGES } from '../users/user.constants.js';
import { getLocalItem, setLocalItem } from '../utils/storage.util.js';
import { STORAGE_KEYS } from '../config/application.constants.js';
import { Logger } from '../utils/logger.util.js';
import { renderTimezoneOptions } from '../users/renderers/shared-form.renderer.js';
import { renderNotificationPreferences } from '../users/renderers/preferences.renderer.js';
import { escapeHtml } from '../utils/html.util.js';

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
  const preferences = profile?.notificationPreferences ?? {
    email: false,
    browser: true,
  };

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
                    ${renderTimezoneOptions(timezone)}
                  </select>
                </div>

                ${renderNotificationPreferences(preferences, {
                  emailId: 'ptw-settings-notify-email',
                  browserId: 'ptw-settings-notify-browser',
                })}

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
                <dd class="col-sm-8">${escapeHtml(appSettings.appName)}</dd>
                <dt class="col-sm-4 ptw-text-muted">Version</dt>
                <dd class="col-sm-8">${escapeHtml(appSettings.version)}</dd>
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
    void performLogout();
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
