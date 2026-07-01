/**
 * @fileoverview Complete-profile page renderer — first-time onboarding templates.
 * @module users/renderers/complete-profile.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { renderHtml } from '../../renderers/base.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderAvatar } from '../../shared/avatar/avatar.component.js';
import { USER_MESSAGES } from '../user.constants.js';
import { renderLocationFields } from './location.renderer.js';

/**
 * @returns {string}
 */
export function renderCompleteProfileLoading() {
  return `
    <div class="container ptw-page-content">
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
        <div class="col-12 col-md-8 col-lg-5">
          <div class="card ptw-card">
            <div class="card-body">
              <div class="d-flex align-items-center gap-3 mb-4 p-3 rounded ptw-profile-summary">
                ${renderAvatar({
                  photoURL,
                  className: 'ptw-profile-avatar',
                  size: 64,
                })}
                <div>
                  <p class="mb-0 fw-semibold">${escapeHtml(displayName)}</p>
                  <p class="mb-0 ptw-text-muted small">${escapeHtml(email)}</p>
                  <p class="mb-0 ptw-text-muted small">${escapeHtml(providerLabel)}</p>
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

                ${renderLocationFields()}

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
 * @param {HTMLElement} container
 * @returns {void}
 */
export function mountCompleteProfileLoading(container) {
  renderHtml(container, renderCompleteProfileLoading());
}
