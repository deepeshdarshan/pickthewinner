/**
 * @fileoverview Shared notification preference field renderer.
 * @module users/renderers/preferences.renderer
 */

import { DEFAULT_NOTIFICATION_PREFERENCES } from '../user.constants.js';

/**
 * @typedef {Object} NotificationPreferences
 * @property {boolean} email
 * @property {boolean} browser
 */

/**
 * Renders notification preference switches.
 * @param {NotificationPreferences} [preferences]
 * @param {Object} [options]
 * @param {string} [options.emailId='ptw-notify-email']
 * @param {string} [options.browserId='ptw-notify-browser']
 * @returns {string}
 */
export function renderNotificationPreferences(
  preferences = DEFAULT_NOTIFICATION_PREFERENCES,
  options = {},
) {
  const emailId = options.emailId ?? 'ptw-notify-email';
  const browserId = options.browserId ?? 'ptw-notify-browser';

  return `
    <fieldset class="mb-4">
      <legend class="form-label fs-6 mb-2">Notification Preferences</legend>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id="${emailId}"
          name="notifyEmail"
          ${preferences.email ? 'checked' : ''}
        >
        <label class="form-check-label" for="${emailId}">Email notifications</label>
      </div>
      <div class="form-check form-switch">
        <input
          class="form-check-input"
          type="checkbox"
          id="${browserId}"
          name="notifyBrowser"
          ${preferences.browser ? 'checked' : ''}
        >
        <label class="form-check-label" for="${browserId}">Browser notifications</label>
      </div>
    </fieldset>
  `;
}

/**
 * Renders a timezone field group with label and error container.
 * @param {Object} options
 * @param {string} options.selectHtml
 * @param {string} [options.label='Timezone']
 * @param {string} [options.errorId]
 * @param {boolean} [options.required=true]
 * @returns {string}
 */
export function renderPreferencesSection({ selectHtml, label = 'Timezone', errorId, required = true }) {
  return `
    <div class="mb-3">
      <label class="form-label" for="${errorId?.replace('-error', '') ?? 'ptw-profile-timezone'}">
        ${label}${required ? ' <span class="text-danger">*</span>' : ''}
      </label>
      ${selectHtml}
      ${errorId ? `<div class="invalid-feedback" id="${errorId}" role="alert"></div>` : ''}
    </div>
    ${renderNotificationPreferences()}
  `;
}
