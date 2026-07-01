/**
 * @fileoverview Landing page — welcome screen with SSO and app instructions.
 * @module pages/landing.page
 */

import { appSettings } from '../config/app.config.js';
import { isAuthenticated, signInWithGoogle, getAuthErrorMessage } from '../auth/auth.service.js';
import { AUTH_MESSAGES } from '../auth/authentication.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { navigateTo } from '../services/router.service.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { getPostLoginDestination } from '../users/user.navigation.js';
import { USER_ROUTES } from '../users/user.constants.js';
import { renderAppLogo } from '../shared/logo/logo.component.js';
import { Logger } from '../utils/logger.util.js';
import { escapeHtml } from '../utils/html.util.js';

/** @type {ReadonlyArray<{ icon: string, label: string }>} */
const FEATURE_BADGES = Object.freeze([
  { icon: 'bi-clock', label: 'Takes only a minute' },
  { icon: 'bi-shield-check', label: 'Secure Google sign-in' },
  { icon: 'bi-pencil-square', label: 'Edit picks until lock time' },
]);

/** @type {ReadonlyArray<{ icon: string, title: string, description: string }>} */
const APP_STEPS = Object.freeze([
  {
    icon: 'bi-google',
    title: 'Sign in with Google',
    description: 'Connect your Google account in one click to join the tournament predictions.',
  },
  {
    icon: 'bi-person-check',
    title: 'Complete your profile',
    description: 'A one-time setup after your first sign-in. Add your name, phone, and location so your picks are credited to you.',
  },
  {
    icon: 'bi-telephone',
    title: 'Update your phone anytime',
    description: 'You can change your phone number whenever required from your Profile page in the future.',
  },
  {
    icon: 'bi-bullseye',
    title: 'Make your predictions',
    description: 'Choose winners for upcoming matches before the prediction window closes.',
  },
  {
    icon: 'bi-trophy',
    title: 'Track your score',
    description: 'Check the leaderboard to see how you compare with other contestants.',
  },
]);

/**
 * Renders the landing page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initLandingPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initLandingPage(outlet) {
  if (isAuthenticated()) {
    await AuthorizationService.resolve();
    await navigateTo(AuthorizationService.getDefaultRouteForRole(), true);
    return;
  }

  outlet.innerHTML = renderLandingMarkup();
  bindLandingEvents(outlet);
}

/**
 * @returns {string}
 */
function renderLandingMarkup() {
  return `
    <div class="ptw-landing-page">
      <div class="ptw-landing-page__inner">
        <div class="ptw-landing-card card ptw-card">
          <div class="ptw-landing-card__layout">
            <section class="ptw-landing-card__hero" aria-labelledby="ptw-landing-heading">
              <div class="ptw-landing-hero__brand">
                ${renderAppLogo({ variant: 'hero' })}
                <p class="ptw-landing-hero__tagline">${escapeHtml(appSettings.appTagline)}</p>
              </div>

              <h1 id="ptw-landing-heading" class="ptw-landing-hero__heading">
                Welcome to ${escapeHtml(appSettings.appName)}
              </h1>
              <p class="ptw-landing-hero__lead">
                Predict match outcomes with your friends and compete for the top spot on the leaderboard.
              </p>

              <ul class="ptw-landing-hero__badges" aria-label="Key features">
                ${FEATURE_BADGES.map((badge) => `
                  <li class="ptw-landing-badge">
                    <i class="bi ${escapeHtml(badge.icon)}" aria-hidden="true"></i>
                    <span>${escapeHtml(badge.label)}</span>
                  </li>
                `).join('')}
              </ul>

              <div class="ptw-landing-hero__actions">
                <button type="button" class="btn btn-ptw-google btn-lg ptw-landing-hero__cta" id="ptw-landing-google-login">
                  <i class="bi bi-google me-2" aria-hidden="true"></i>
                  Continue with Google
                </button>
                <p class="ptw-landing-hero__secondary-links">
                  <a href="#" class="ptw-link" aria-disabled="true">Terms of Service</a>
                  <span class="ptw-landing-hero__link-sep" aria-hidden="true">·</span>
                  <a href="/login?mode=admin" data-route class="ptw-link">Administrator sign in</a>
                </p>
              </div>
            </section>

            <aside class="ptw-landing-card__guide" aria-labelledby="ptw-landing-guide-heading">
              <div class="ptw-landing-guide">
                <h2 id="ptw-landing-guide-heading" class="ptw-landing-guide__heading">
                  <i class="bi bi-journal-text" aria-hidden="true"></i>
                  How to Use This App
                </h2>

                <ol class="ptw-landing-steps">
                  ${APP_STEPS.map((step, index) => `
                    <li class="ptw-landing-step">
                      <div class="ptw-landing-step__marker" aria-hidden="true">
                        <span class="ptw-landing-step__number">${index + 1}</span>
                      </div>
                      <div class="ptw-landing-step__icon" aria-hidden="true">
                        <i class="bi ${escapeHtml(step.icon)}"></i>
                      </div>
                      <div class="ptw-landing-step__content">
                        <p class="ptw-landing-step__title">${escapeHtml(step.title)}</p>
                        <p class="ptw-landing-step__description">${escapeHtml(step.description)}</p>
                      </div>
                      <i class="bi bi-chevron-right ptw-landing-step__chevron" aria-hidden="true"></i>
                    </li>
                  `).join('')}
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function bindLandingEvents(outlet) {
  const googleBtn = outlet.querySelector('#ptw-landing-google-login');

  googleBtn?.addEventListener('click', () => {
    void handleGoogleLogin();
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
      Logger.warn('[Landing] Profile lookup failed after Google sign-in; using complete-profile route.', error);
    }

    hideLoadingOverlay();
    await navigateTo(destination, true);
  } catch (error) {
    Logger.error('[Landing] Google sign-in failed:', error);
    showErrorToast(getAuthErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
