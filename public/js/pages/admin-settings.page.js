/**
 * @fileoverview Admin general settings page — platform-wide configuration.
 * @module pages/admin-settings.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { PlatformSettingsService } from '../settings/settings.service.js';
import { SETTINGS_MESSAGES } from '../settings/settings.constants.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders the admin general settings page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminSettingsPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminSettingsPage(outlet) {
  showLoadingOverlay(SETTINGS_MESSAGES.LOADING);

  try {
    const settings = await PlatformSettingsService.load();
    outlet.innerHTML = renderAdminSettingsMarkup(settings.leaderboardVisible);
    bindAdminSettingsEvents(outlet);
  } catch (error) {
    Logger.error('[AdminSettingsPage] Failed to load:', error);
    showErrorToast(SETTINGS_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {boolean} leaderboardVisible
 * @returns {string}
 */
function renderAdminSettingsMarkup(leaderboardVisible) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'General Settings',
        subtitle: 'Platform-wide configuration',
      })}

      <form id="ptw-admin-settings-form" class="ptw-admin-settings-form" novalidate>
        <section class="card ptw-card" aria-labelledby="ptw-admin-settings-visibility-heading">
          <div class="card-header">
            <h2 class="h5 mb-0" id="ptw-admin-settings-visibility-heading">Visibility Settings</h2>
          </div>
          <div class="card-body">
            <div class="form-check form-switch ptw-form-switch mb-2">
              <input
                class="form-check-input"
                type="checkbox"
                role="switch"
                id="ptw-admin-settings-leaderboardVisible"
                name="leaderboardVisible"
                ${leaderboardVisible ? 'checked' : ''}
              />
              <label class="form-check-label" for="ptw-admin-settings-leaderboardVisible">
                Make Leaderboard Visible to Contestants
              </label>
            </div>
            <p class="form-text ptw-text-muted mb-4">
              When enabled, contestants can view the tournament leaderboard. When disabled, only administrators can access the leaderboard.
            </p>
            <button type="submit" class="btn btn-ptw-primary">
              <i class="bi bi-save me-2" aria-hidden="true"></i>
              Save Settings
            </button>
          </div>
        </section>
      </form>
    </div>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function bindAdminSettingsEvents(outlet) {
  const form = outlet.querySelector('#ptw-admin-settings-form');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void handleSaveSettings(/** @type {HTMLFormElement} */ (form));
  });
}

/**
 * @param {HTMLFormElement} form
 * @returns {Promise<void>}
 */
async function handleSaveSettings(form) {
  const authUser = getCurrentUser();

  if (!authUser?.uid) {
    showErrorToast(SETTINGS_MESSAGES.PERMISSION_DENIED);
    return;
  }

  const toggle = form.querySelector('[name="leaderboardVisible"]');
  const leaderboardVisible = toggle instanceof HTMLInputElement ? toggle.checked : false;

  showLoadingOverlay(SETTINGS_MESSAGES.SAVING);

  try {
    await PlatformSettingsService.updateLeaderboardVisibility(leaderboardVisible, authUser.uid);
    showSuccessToast(SETTINGS_MESSAGES.SAVED);
  } catch (error) {
    Logger.error('[AdminSettingsPage] Save failed:', error);
    showErrorToast(SETTINGS_MESSAGES.ERROR_SAVING);
  } finally {
    hideLoadingOverlay();
  }
}
