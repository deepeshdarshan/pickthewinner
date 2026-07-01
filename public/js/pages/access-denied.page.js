/**
 * @fileoverview Access denied (403) page.
 * @module pages/access-denied.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { appSettings } from '../config/app.config.js';
import {
  AUTHORIZATION_MESSAGES,
  AUTHORIZATION_ROUTES,
} from '../authorization/permission.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { isAuthenticated } from '../auth/auth.service.js';

/**
 * Renders the access denied page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const authenticated = isAuthenticated();
  const homeRoute = authenticated ? AuthorizationService.getDefaultRouteForRole() : '/';

  outlet.innerHTML = `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: AUTHORIZATION_MESSAGES.ACCESS_DENIED_TITLE,
        subtitle: 'Forbidden',
      })}
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card text-center">
          <i class="bi bi-shield-x" aria-hidden="true"></i>
          <h2 class="h4">${AUTHORIZATION_MESSAGES.ACCESS_DENIED_TITLE}</h2>
          <p class="text-muted mb-4">${AUTHORIZATION_MESSAGES.ACCESS_DENIED}</p>
          <div class="d-flex flex-wrap justify-content-center gap-2">
            <a class="btn btn-primary" href="${homeRoute}" data-route>
              <i class="bi bi-house me-1" aria-hidden="true"></i>
              ${authenticated ? AUTHORIZATION_MESSAGES.RETURN_DASHBOARD : AUTHORIZATION_MESSAGES.RETURN_HOME}
            </a>
            ${!authenticated ? `
              <a class="btn btn-outline-light" href="/login" data-route>
                <i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
                ${AUTHORIZATION_MESSAGES.SIGN_IN}
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  document.title = `403 | ${appSettings.appName}`;
}

/**
 * @returns {string}
 */
export function getPath() {
  return AUTHORIZATION_ROUTES.ACCESS_DENIED;
}
