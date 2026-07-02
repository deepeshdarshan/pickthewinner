/**
 * @fileoverview Profile page renderer — view and edit profile templates.
 * @module users/renderers/profile.renderer
 */

import { renderPageHeader, renderContestantPageHeader } from '../../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../../components/contestant-page-shell.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { USER_ROLES } from '../user.constants.js';
import { renderHtml } from '../../renderers/base.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateDisplay } from '../../utils/date.util.js';
import { toTitleCase } from '../../utils/formatting.util.js';
import { renderAvatar } from '../../shared/avatar/avatar.component.js';
import { renderIconInputField } from '../../shared/form/icon-input.component.js';
import { USER_MESSAGES, APP_TIMEZONE_LABEL } from '../user.constants.js';
import { renderAppTimezoneDisplay } from './shared-form.renderer.js';

/**
 * @typedef {import('../user.service.js').UserProfile} UserProfile
 */

/**
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
 * @param {'admin'|'contestant'} [shell='contestant']
 * @returns {string}
 */
function getShellClasses(shell = 'contestant') {
  return shell === 'admin' ? ADMIN_PAGE_SHELL_CLASSES : CONTESTANT_PAGE_SHELL_CLASSES;
}

/**
 * @param {{ title: string, subtitle?: string }} options
 * @param {'admin'|'contestant'} shell
 * @returns {string}
 */
function renderProfileHeader(options, shell) {
  return shell === 'admin'
    ? renderPageHeader(options)
    : renderContestantPageHeader(options);
}

/**
 * @returns {string}
 */
export function renderProfileLoading() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(USER_MESSAGES.LOADING_PROFILE)}">
            <span class="visually-hidden">${escapeHtml(USER_MESSAGES.LOADING_PROFILE)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(USER_MESSAGES.LOADING_PROFILE)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderProfileEmpty(message = USER_MESSAGES.PROFILE_NOT_FOUND, shell = 'contestant') {
  return `
    <div class="${getShellClasses(shell)}">
      ${renderProfileHeader({ title: 'Profile', subtitle: 'Your account details' }, shell)}
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card">
          <i class="bi bi-person-x" aria-hidden="true"></i>
          <h2 class="h4">Profile unavailable</h2>
          <p>${escapeHtml(message)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
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
  const shell = profile.role === USER_ROLES.ADMIN ? 'admin' : 'contestant';

  return `
    <div class="${getShellClasses(shell)}">
      ${renderProfileHeader({
        title: 'Profile',
        subtitle: 'Manage your account details',
      }, shell)}

      <div class="row g-4">
        <div class="col-12 col-lg-4">
          <div class="card ptw-card h-100">
            <div class="card-body text-center">
              ${renderAvatar({
                photoURL,
                className: 'ptw-profile-avatar mb-3 d-inline-flex',
                size: 96,
                placeholderClassName: 'ptw-profile-avatar--placeholder ptw-profile-avatar--lg',
              })}
              <h2 class="h5 mb-1">${escapeHtml(displayName)}</h2>
              <p class="ptw-text-muted mb-3">${escapeHtml(email)}</p>
              <span class="badge bg-secondary">${escapeHtml(toTitleCase(profile.role))}</span>
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
                <dt class="col-sm-4 ptw-text-muted">Email</dt>
                <dd class="col-sm-8">${escapeHtml(email)}</dd>
                <dt class="col-sm-4 ptw-text-muted">Provider</dt>
                <dd class="col-sm-8">${escapeHtml(toTitleCase(profile.provider.replace('_', ' ')))}</dd>
                <dt class="col-sm-4 ptw-text-muted">Role</dt>
                <dd class="col-sm-8">${escapeHtml(toTitleCase(profile.role))}</dd>
                <dt class="col-sm-4 ptw-text-muted">Timezone</dt>
                <dd class="col-sm-8">${escapeHtml(APP_TIMEZONE_LABEL)}</dd>
                <dt class="col-sm-4 ptw-text-muted">Member Since</dt>
                <dd class="col-sm-8">${escapeHtml(memberSince)}</dd>
                <dt class="col-sm-4 ptw-text-muted">Last Login</dt>
                <dd class="col-sm-8">${escapeHtml(lastLogin)}</dd>
              </dl>
            </div>
          </div>

          <div class="card ptw-card">
            <div class="card-header">
              <h3 class="h6 mb-0">Edit Profile</h3>
            </div>
            <div class="card-body">
              <form id="ptw-profile-form" novalidate>
                ${renderIconInputField({
                  id: 'ptw-edit-phone',
                  name: 'phone',
                  label: 'Phone Number',
                  icon: 'bi-telephone',
                  type: 'tel',
                  value: profile.phone,
                  placeholder: 'e.g. 9876543210',
                  inputMode: 'tel',
                  autocomplete: 'tel',
                  required: true,
                  errorId: 'ptw-edit-phone-error',
                })}

                ${renderAppTimezoneDisplay()}

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
 * @param {HTMLElement} container
 * @returns {void}
 */
export function mountProfileLoading(container) {
  renderHtml(container, renderProfileLoading());
}
