/**
 * @fileoverview User profile renderer — DOM templates only, no Firestore access.
 * @module users/user.renderer
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderHtml } from '../renderers/base.renderer.js';
import { formatDateDisplay } from '../utils/date.util.js';
import { toTitleCase } from '../utils/formatting.util.js';
import {
  TIMEZONE_OPTIONS,
  USER_MESSAGES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_TIMEZONE,
} from './user.constants.js';

/**
 * @typedef {import('./user.service.js').UserProfile} UserProfile
 */

/**
 * Formats a Firestore timestamp or date value for display.
 * @param {import('firebase/firestore').Timestamp|Date|null|undefined} value
 * @returns {string}
 */
function formatTimestamp(value) {
  if (!value) {
    return '—';
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return formatDateDisplay(/** @type {import('firebase/firestore').Timestamp} */ (value).toDate(), {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return formatDateDisplay(value, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Renders timezone select options.
 * @param {string} [selected]
 * @returns {string}
 */
function renderTimezoneOptions(selected = DEFAULT_TIMEZONE) {
  return TIMEZONE_OPTIONS.map((option) => `
    <option value="${option.value}"${option.value === selected ? ' selected' : ''}>
      ${option.label}
    </option>
  `).join('');
}

/**
 * Renders a loading state for profile pages.
 * @returns {string}
 */
export function renderProfileLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${USER_MESSAGES.LOADING_PROFILE}">
            <span class="visually-hidden">${USER_MESSAGES.LOADING_PROFILE}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${USER_MESSAGES.LOADING_PROFILE}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders an empty/error state for the profile page.
 * @param {string} [message]
 * @returns {string}
 */
export function renderProfileEmpty(message = USER_MESSAGES.PROFILE_NOT_FOUND) {
  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({ title: 'Profile', subtitle: 'Your account details' })}
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card">
          <i class="bi bi-person-x" aria-hidden="true"></i>
          <h2 class="h4">Profile unavailable</h2>
          <p>${message}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the complete-profile loading state.
 * @returns {string}
 */
export function renderCompleteProfileLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${USER_MESSAGES.LOADING_PROFILE}">
            <span class="visually-hidden">${USER_MESSAGES.LOADING_PROFILE}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${USER_MESSAGES.LOADING_PROFILE}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns a human-readable provider label for the auth user.
 * @param {import('firebase/auth').User} authUser
 * @returns {string}
 */
function getProviderLabel(authUser) {
  const providerId = authUser.providerData?.[0]?.providerId;

  if (providerId === 'password') {
    return 'Email & Password';
  }

  if (providerId === 'google.com') {
    return 'Google';
  }

  return 'Account';
}

/**
 * Renders the complete-profile form for first-time users.
 * @param {import('firebase/auth').User} authUser
 * @returns {string}
 */
export function renderCompleteProfileForm(authUser) {
  const displayName = authUser.displayName || authUser.email?.split('@')[0] || 'User';
  const email = authUser.email || '';
  const photoURL = authUser.photoURL || '';
  const providerLabel = getProviderLabel(authUser);

  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: 'Complete Your Profile',
        subtitle: 'One quick step before you start predicting',
      })}

      <div class="row justify-content-center">
        <div class="col-12 col-lg-8">
          <div class="card ptw-card">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded ptw-profile-summary">
                ${photoURL
                  ? `<img src="${photoURL}" alt="" class="rounded-circle ptw-profile-avatar" width="64" height="64">`
                  : `<div class="ptw-profile-avatar ptw-profile-avatar--placeholder rounded-circle d-flex align-items-center justify-content-center" aria-hidden="true">
                      <i class="bi bi-person-fill"></i>
                    </div>`
                }
                <div>
                  <p class="mb-0 fw-semibold">${displayName}</p>
                  <p class="mb-0 ptw-text-muted small">${email}</p>
                  <p class="mb-0 ptw-text-muted small">${providerLabel}</p>
                </div>
              </div>

              <form id="ptw-complete-profile-form" novalidate>
                <div class="mb-3">
                  <label for="ptw-profile-phone" class="form-label">Phone Number <span class="text-danger">*</span></label>
                  <input
                    type="tel"
                    class="form-control"
                    id="ptw-profile-phone"
                    name="phone"
                    inputmode="tel"
                    autocomplete="tel"
                    required
                    aria-required="true"
                    placeholder="e.g. 9876543210"
                  >
                  <div class="invalid-feedback" id="ptw-profile-phone-error" role="alert"></div>
                </div>

                <div class="mb-3">
                  <label for="ptw-profile-country" class="form-label">Country <span class="ptw-text-muted">(optional)</span></label>
                  <input
                    type="text"
                    class="form-control"
                    id="ptw-profile-country"
                    name="country"
                    autocomplete="country-name"
                    placeholder="e.g. India"
                  >
                </div>

                <div class="mb-3">
                  <label for="ptw-profile-timezone" class="form-label">Timezone <span class="text-danger">*</span></label>
                  <select
                    class="form-select"
                    id="ptw-profile-timezone"
                    name="timezone"
                    required
                    aria-required="true"
                  >
                    ${renderTimezoneOptions()}
                  </select>
                  <div class="invalid-feedback" id="ptw-profile-timezone-error" role="alert"></div>
                </div>

                <fieldset class="mb-4">
                  <legend class="form-label fs-6 mb-2">Notification Preferences</legend>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="ptw-notify-email"
                      name="notifyEmail"
                      ${DEFAULT_NOTIFICATION_PREFERENCES.email ? 'checked' : ''}
                    >
                    <label class="form-check-label" for="ptw-notify-email">Email notifications</label>
                  </div>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="ptw-notify-browser"
                      name="notifyBrowser"
                      ${DEFAULT_NOTIFICATION_PREFERENCES.browser ? 'checked' : ''}
                    >
                    <label class="form-check-label" for="ptw-notify-browser">Browser notifications</label>
                  </div>
                </fieldset>

                <div class="d-grid">
                  <button type="submit" class="btn btn-ptw-primary btn-lg" id="ptw-complete-profile-submit">
                    <i class="bi bi-check-circle me-2" aria-hidden="true"></i>
                    Save and Continue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the profile page with read-only and editable sections.
 * @param {UserProfile} profile
 * @param {import('firebase/auth').User|null} authUser
 * @returns {string}
 */
export function renderProfilePage(profile, authUser) {
  const photoURL = authUser?.photoURL || profile.photoURL;
  const displayName = authUser?.displayName || profile.name;
  const email = authUser?.email || profile.email;
  const memberSince = formatTimestamp(profile.createdAt);
  const lastLogin = formatTimestamp(profile.lastLogin);

  return `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: 'Profile',
        subtitle: 'Manage your account details and preferences',
      })}

      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="card ptw-card h-100">
            <div class="card-body text-center">
              ${photoURL
                ? `<img src="${photoURL}" alt="" class="rounded-circle ptw-profile-avatar mb-3" width="96" height="96">`
                : `<div class="ptw-profile-avatar ptw-profile-avatar--placeholder ptw-profile-avatar--lg rounded-circle d-inline-flex align-items-center justify-content-center mb-3" aria-hidden="true">
                    <i class="bi bi-person-fill"></i>
                  </div>`
              }
              <h2 class="h5 mb-1">${displayName}</h2>
              <p class="ptw-text-muted mb-3">${email}</p>
              <span class="badge bg-secondary">${toTitleCase(profile.role)}</span>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <div class="card ptw-card mb-4">
            <div class="card-header">
              <h3 class="h6 mb-0">Account Information</h3>
            </div>
            <div class="card-body">
              <dl class="row mb-0">
                <dt class="col-sm-4 ptw-text-muted">UID</dt>
                <dd class="col-sm-8"><code class="small">${profile.uid}</code></dd>

                <dt class="col-sm-4 ptw-text-muted">Email</dt>
                <dd class="col-sm-8">${email}</dd>

                <dt class="col-sm-4 ptw-text-muted">Provider</dt>
                <dd class="col-sm-8">${toTitleCase(profile.provider.replace('_', ' '))}</dd>

                <dt class="col-sm-4 ptw-text-muted">Role</dt>
                <dd class="col-sm-8">${toTitleCase(profile.role)}</dd>

                <dt class="col-sm-4 ptw-text-muted">Member Since</dt>
                <dd class="col-sm-8">${memberSince}</dd>

                <dt class="col-sm-4 ptw-text-muted">Last Login</dt>
                <dd class="col-sm-8">${lastLogin}</dd>
              </dl>
            </div>
          </div>

          <div class="card ptw-card">
            <div class="card-header">
              <h3 class="h6 mb-0">Edit Profile</h3>
            </div>
            <div class="card-body">
              <form id="ptw-profile-form" novalidate>
                <div class="mb-3">
                  <label for="ptw-edit-phone" class="form-label">Phone Number</label>
                  <input
                    type="tel"
                    class="form-control"
                    id="ptw-edit-phone"
                    name="phone"
                    value="${profile.phone}"
                    inputmode="tel"
                    autocomplete="tel"
                    required
                    aria-required="true"
                  >
                  <div class="invalid-feedback" id="ptw-edit-phone-error" role="alert"></div>
                </div>

                <div class="mb-3">
                  <label for="ptw-edit-timezone" class="form-label">Timezone</label>
                  <select class="form-select" id="ptw-edit-timezone" name="timezone" required aria-required="true">
                    ${renderTimezoneOptions(profile.timezone)}
                  </select>
                  <div class="invalid-feedback" id="ptw-edit-timezone-error" role="alert"></div>
                </div>

                <fieldset class="mb-4">
                  <legend class="form-label fs-6 mb-2">Notification Preferences</legend>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="ptw-edit-notify-email"
                      name="notifyEmail"
                      ${profile.notificationPreferences.email ? 'checked' : ''}
                    >
                    <label class="form-check-label" for="ptw-edit-notify-email">Email notifications</label>
                  </div>
                  <div class="form-check form-switch">
                    <input
                      class="form-check-input"
                      type="checkbox"
                      id="ptw-edit-notify-browser"
                      name="notifyBrowser"
                      ${profile.notificationPreferences.browser ? 'checked' : ''}
                    >
                    <label class="form-check-label" for="ptw-edit-notify-browser">Browser notifications</label>
                  </div>
                </fieldset>

                <button type="submit" class="btn btn-ptw-primary" id="ptw-profile-save">
                  <i class="bi bi-save me-2" aria-hidden="true"></i>
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mounts profile loading state into a container.
 * @param {HTMLElement} container
 * @returns {void}
 */
export function mountProfileLoading(container) {
  renderHtml(container, renderProfileLoading());
}

/**
 * Mounts complete-profile loading state into a container.
 * @param {HTMLElement} container
 * @returns {void}
 */
export function mountCompleteProfileLoading(container) {
  renderHtml(container, renderCompleteProfileLoading());
}

/**
 * Applies field validation errors to a form.
 * @param {HTMLElement} form
 * @param {Record<string, string>} errors
 * @returns {void}
 */
export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => {
    el.classList.remove('is-invalid');
  });

  form.querySelectorAll('.invalid-feedback').forEach((el) => {
    el.textContent = '';
  });

  Object.entries(errors).forEach(([field, message]) => {
    const fieldName = field.includes('.') ? field.split('.')[0] : field;
    const input = form.querySelector(`[name="${fieldName}"]`)
      ?? form.querySelector(`#ptw-${fieldName === 'phone' ? 'profile-phone' : fieldName}`)
      ?? form.querySelector(`#ptw-edit-${fieldName}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      const errorId = `${input.id}-error`;
      const errorEl = form.querySelector(`#${errorId}`);

      if (errorEl) {
        errorEl.textContent = message;
      }
    }
  });
}

/**
 * Reads notification preferences from a form.
 * @param {HTMLFormElement} form
 * @returns {{ email: boolean, browser: boolean }}
 */
export function readNotificationPreferences(form) {
  const emailInput = form.querySelector('[name="notifyEmail"]');
  const browserInput = form.querySelector('[name="notifyBrowser"]');

  return {
    email: emailInput instanceof HTMLInputElement ? emailInput.checked : false,
    browser: browserInput instanceof HTMLInputElement ? browserInput.checked : true,
  };
}
