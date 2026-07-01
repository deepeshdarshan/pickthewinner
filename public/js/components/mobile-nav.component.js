/**
 * @fileoverview Mobile bottom navigation component — auth-aware dynamic nav.
 * @module components/mobile-nav.component
 */

import { ROUTES } from '../config/routes.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';

/** @type {ReadonlySet<string>} */
const MOBILE_NAV_PATHS = new Set([
  AUTH_ROUTES.DASHBOARD,
  '/leaderboard',
  '/profile',
]);

/**
 * @typedef {Object} MobileNavOptions
 * @property {string} [activePath]
 */

/**
 * Returns authorized routes for the mobile bottom navigation.
 * @returns {import('../config/routes.js').RouteDefinition[]}
 */
function getMobileNavRoutes() {
  return AuthorizationService.getAuthorizedNavRoutes(ROUTES)
    .filter((route) => MOBILE_NAV_PATHS.has(route.path));
}

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

  const routes = getMobileNavRoutes();

  if (routes.length === 0) {
    return '';
  }

  const items = routes.map((route) => {
    const isActive = activePath === route.path
      || (route.path !== '/' && activePath.startsWith(`${route.path}/`));
    const label = route.navLabel ?? route.title;
    const icon = route.navIcon ?? 'bi-circle';

    return `
      <a
        class="ptw-mobile-nav__item${isActive ? ' ptw-mobile-nav__item--active' : ''}"
        href="${route.path}"
        data-route
        aria-current="${isActive ? 'page' : 'false'}"
        aria-label="${label}"
      >
        <i class="bi ${icon}" aria-hidden="true"></i>
        <span class="ptw-mobile-nav__label">${label}</span>
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
