/**
 * @fileoverview Application navbar component — auth-aware navigation and user menu.
 * @module components/navbar.component
 */

import { ROUTES } from '../config/routes.js';
import { appSettings } from '../config/app.config.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Roles } from '../authorization/permission.constants.js';
import { AppContext } from '../app/app.context.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { performLogout } from '../auth/actions/logout.action.js';
import { renderAvatar } from '../shared/avatar/avatar.component.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * @typedef {Object} NavbarOptions
 * @property {string} [activePath]
 */

/**
 * @param {string} activePath
 * @returns {boolean}
 */
function shouldShowMinimalNavbar(activePath) {
  if (isAuthenticated()) {
    return false;
  }

  return activePath === '/' || activePath === AUTH_ROUTES.LOGIN;
}

/**
 * @param {import('../config/routes.js').RouteDefinition[]} routes
 * @param {string} activePath
 * @returns {string}
 */
function renderNavItems(routes, activePath) {
  return routes
    .map((route) => {
      const isActive = activePath === route.path
        || (route.path !== '/' && activePath.startsWith(`${route.path}/`));
      const icon = route.icon ?? route.navIcon ?? 'bi-circle';

      return `
        <li class="nav-item d-none d-lg-block">
          <a
            class="nav-link${isActive ? ' active' : ''}"
            href="${escapeHtml(route.path)}"
            data-route
            aria-current="${isActive ? 'page' : 'false'}"
          >
            <i class="bi ${escapeHtml(icon)} me-1" aria-hidden="true"></i>
            ${escapeHtml(route.navLabel ?? route.title)}
          </a>
        </li>
      `;
    })
    .join('');
}

/**
 * Renders a brand-only navbar for unauthenticated landing and login pages.
 * @returns {string}
 */
function renderMinimalNavbar() {
  return `
    <nav class="navbar navbar-expand-lg navbar-dark ptw-navbar sticky-top" aria-label="Main navigation">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand" href="/" data-route>
          <i class="bi bi-trophy-fill" aria-hidden="true"></i>
          <span class="ptw-navbar__brand-text">${escapeHtml(appSettings.appName)}</span>
        </a>
      </div>
    </nav>
  `;
}

/**
 * Renders the authenticated or guest navigation bar.
 * @param {NavbarOptions} options
 * @returns {string}
 */
function renderAuthenticatedNavbar(options) {
  const { activePath = '/' } = options;
  const authenticated = isAuthenticated();
  const navRoutes = AuthorizationService.getAuthorizedNavRoutes(ROUTES);
  const navItems = renderNavItems(navRoutes, activePath);

  const displayName = AppContext.getDisplayName();
  const email = AppContext.getEmail();
  const photoURL = AppContext.getPhotoURL();
  const isAdmin = AuthorizationService.hasRole(Roles.ADMIN);
  const avatarMarkup = renderAvatar({
    photoURL,
    className: 'ptw-navbar__avatar',
    size: 32,
  });

  const mobileActions = authenticated
    ? `
      <div class="d-flex align-items-center gap-2 d-lg-none">
        <button
          type="button"
          class="btn btn-link ptw-navbar__icon-btn"
          aria-label="Notifications"
          disabled
        >
          <i class="bi bi-bell" aria-hidden="true"></i>
        </button>
        <a
          class="ptw-navbar__avatar-link"
          href="/profile"
          data-route
          aria-label="Profile"
        >
          ${renderAvatar({ photoURL, className: 'ptw-navbar__avatar', size: 32 })}
        </a>
      </div>
    `
    : '';

  const desktopActions = authenticated
    ? `
      <div class="ptw-navbar__actions d-none d-lg-flex align-items-center gap-2 ms-lg-3">
        <button
          type="button"
          class="btn btn-link ptw-navbar__icon-btn"
          aria-label="Notifications"
          title="Notifications (coming soon)"
          disabled
        >
          <i class="bi bi-bell" aria-hidden="true"></i>
        </button>

        <button
          type="button"
          class="btn btn-link ptw-navbar__icon-btn"
          aria-label="Toggle theme"
          title="Theme toggle (coming soon)"
          disabled
        >
          <i class="bi bi-moon-stars" aria-hidden="true"></i>
        </button>

        <div class="dropdown">
          <button
            class="btn btn-link ptw-navbar__profile-btn dropdown-toggle"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            aria-label="Profile menu"
          >
            ${avatarMarkup}
            <span class="ptw-navbar__profile-label">${escapeHtml(displayName)}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li>
              <div class="dropdown-header">
                <div class="d-flex align-items-center gap-2">
                  ${avatarMarkup}
                  <div class="min-w-0">
                    <div class="fw-semibold text-truncate">${escapeHtml(displayName)}</div>
                    <div class="small text-muted text-truncate">${escapeHtml(email)}</div>
                  </div>
                </div>
              </div>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <a class="dropdown-item" href="/profile" data-route>
                <i class="bi bi-person me-2" aria-hidden="true"></i>Profile
              </a>
            </li>
            ${isAdmin ? `
            <li>
              <a class="dropdown-item" href="/settings" data-route>
                <i class="bi bi-gear me-2" aria-hidden="true"></i>Settings
              </a>
            </li>
            ` : ''}
            <li><hr class="dropdown-divider"></li>
            <li>
              <button type="button" class="dropdown-item" id="ptw-navbar-logout">
                <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign Out
              </button>
            </li>
          </ul>
        </div>
      </div>
    `
    : '';

  return `
    <nav class="navbar navbar-expand-lg navbar-dark ptw-navbar sticky-top" aria-label="Main navigation">
      <div class="container-fluid px-3 px-lg-4">
        <a class="navbar-brand" href="/" data-route>
          <i class="bi bi-trophy-fill" aria-hidden="true"></i>
          <span class="ptw-navbar__brand-text">${escapeHtml(appSettings.appName)}</span>
        </a>

        ${mobileActions}

        <button
          class="navbar-toggler d-none"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ptwNavbar"
          aria-controls="ptwNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="ptwNavbar">
          <ul class="navbar-nav ms-auto align-items-lg-center gap-lg-1">
            ${navItems}
          </ul>

          ${desktopActions}
        </div>
      </div>
    </nav>
  `;
}

/**
 * Renders the main navigation bar.
 * @param {NavbarOptions} [options]
 * @returns {string}
 */
export function renderNavbar(options = {}) {
  const { activePath = '/' } = options;

  if (shouldShowMinimalNavbar(activePath)) {
    return renderMinimalNavbar();
  }

  return renderAuthenticatedNavbar({ activePath });
}

/**
 * Binds navbar event listeners.
 * @param {HTMLElement} container
 * @returns {void}
 */
export function bindNavbarEvents(container) {
  const logoutBtn = container.querySelector('#ptw-navbar-logout');

  logoutBtn?.addEventListener('click', () => {
    void performLogout();
  });
}

/**
 * Mounts the navbar into a container element.
 * @param {HTMLElement} container
 * @param {NavbarOptions} [options]
 * @returns {void}
 */
export function mountNavbar(container, options = {}) {
  container.innerHTML = renderNavbar(options);
  bindNavbarEvents(container);
}
