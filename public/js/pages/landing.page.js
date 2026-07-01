/**
 * @fileoverview Landing page — redirects guests to login and authenticated users to dashboard.
 * @module pages/landing.page
 */

import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { navigateTo } from '../services/router.service.js';

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

  await navigateTo(AUTH_ROUTES.LOGIN, true);
}
