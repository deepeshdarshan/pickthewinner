/**
 * @fileoverview Mobile bottom navigation component — auth-aware dynamic nav.
 * @module components/mobile-nav.component
 */

import { ROUTES } from '../config/routes.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * @typedef {Object} MobileNavOptions
 * @property {string} [activePath]
 */

/**
 * Renders the mobile bottom navigation bar.
 * @param {MobileNavOptions} [options]
 * @returns {string}
 */
export function renderMobileNav(options = {}) {
  const { activePath = '/' } = options;
  const authenticated = isAuthenticated();

  if (!authenticated && (activePath === '/' || activePath === AUTH_ROUTES.LOGIN)) {
    return '';
  }

  const routes = AuthorizationService.getAuthorizedMobileNavRoutes(ROUTES);

  if (routes.length === 0) {
    return '';
  }

  const items = routes.map((route) => {
    const isActive = activePath === route.path
      || (route.path !== '/' && activePath.startsWith(`${route.path}/`));
    const label = route.navLabel ?? route.title;
    const icon = route.icon ?? route.navIcon ?? 'bi-circle';

    return `
      <a
        class="ptw-mobile-nav__item${isActive ? ' ptw-mobile-nav__item--active' : ''}"
        href="${escapeHtml(route.path)}"
        data-route
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${escapeHtml(label)}"
      >
        <i class="bi ${escapeHtml(icon)}" aria-hidden="true"></i>
        <span class="ptw-mobile-nav__label">${escapeHtml(label)}</span>
      </a>
    `;
  }).join('');

  return `
    <nav class="ptw-mobile-nav d-lg-none" aria-label="Mobile navigation">
      ${items}
    </nav>
  `;
}

/**
 * Mounts the mobile navigation into a container element.
 * @param {HTMLElement} container
 * @param {MobileNavOptions} [options]
 * @returns {void}
 */
export function mountMobileNav(container, options = {}) {
  container.innerHTML = renderMobileNav(options);
}
