/**
 * @fileoverview Admin sidebar — persistent left navigation panel for admin pages.
 * @module components/sidebar.component
 */

import { appSettings } from '../config/app.config.js';
import { AppContext } from '../app/app.context.js';
import { performLogout } from '../auth/actions/logout.action.js';
import { renderAppLogo } from '../shared/logo/logo.component.js';
import { escapeHtml } from '../utils/html.util.js';

/** @type {ReadonlySet<string>} */
const ADMIN_SHELL_EXACT_PATHS = new Set(['/admin', '/settings', '/leaderboard', '/profile']);

/** @type {ReadonlyArray<{ type: 'item', path: string, label: string, icon: string } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }> }>} */
const ADMIN_NAV_SECTIONS = Object.freeze([
  { type: 'item', path: '/admin', label: 'Overview', icon: 'bi-house' },
  {
    type: 'group',
    label: 'Tournament Management',
    icon: 'bi-calendar-event',
    children: [
      { path: '/admin/tournaments', label: 'All Tournaments' },
    ],
  },
  {
    type: 'group',
    label: 'Master Data',
    icon: 'bi-database',
    children: [
      { path: '/admin/teams', label: 'Teams' },
      { path: '/admin/venues', label: 'Venues' },
    ],
  },
  {
    type: 'group',
    label: 'Match Management',
    icon: 'bi-flag',
    children: [
      { path: '/admin/matches', label: 'Matches' },
      { path: '/admin/results', label: 'Results' },
    ],
  },
  { type: 'item', path: '/leaderboard', label: 'Leaderboard', icon: 'bi-bar-chart' },
  {
    type: 'group',
    label: 'Administration',
    icon: 'bi-shield-lock',
    children: [
      { path: '/admin/users', label: 'User Management' },
    ],
  },
]);

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
const ADMIN_ACCOUNT_LINKS = Object.freeze([
  { path: '/profile', label: 'Profile', icon: 'bi-person' },
  { path: '/settings', label: 'Settings', icon: 'bi-gear' },
]);

/**
 * @typedef {Object} SidebarOptions
 * @property {string} [activePath]
 */

/**
 * Renders the admin sidebar navigation panel.
 * @param {SidebarOptions} [options]
 * @returns {string}
 */
export function renderSidebar(options = {}) {
  const { activePath = '/admin' } = options;
  const email = AppContext.getEmail() || 'Administrator';
  const navMarkup = ADMIN_NAV_SECTIONS.map((section) => renderNavSection(section, activePath)).join('');
  const accountMarkup = ADMIN_ACCOUNT_LINKS.map((link) => renderAccountLink(link, activePath)).join('');

  return `
    <aside class="ptw-sidebar" aria-label="Admin navigation">
      <div class="ptw-sidebar__brand">
        <a href="/admin" class="ptw-sidebar__brand-link" data-route aria-label="${escapeHtml(appSettings.appName)} home">
          ${renderAppLogo({ variant: 'navbar', className: 'ptw-sidebar__brand-logo', alt: '' })}
          <span class="ptw-sidebar__brand-text">${escapeHtml(appSettings.appName)}</span>
        </a>
      </div>

      <nav class="ptw-sidebar__nav" id="ptwSidebarNav">
        <ul class="ptw-sidebar__menu list-unstyled mb-0">
          ${navMarkup}
        </ul>
      </nav>

      <div class="ptw-sidebar__footer">
        <div class="ptw-sidebar__account-links">
          ${accountMarkup}
        </div>
        <div class="ptw-sidebar__divider" role="presentation"></div>
        <div class="ptw-sidebar__user">
          <i class="bi bi-person-circle" aria-hidden="true"></i>
          <span class="ptw-sidebar__user-email">${escapeHtml(email)}</span>
        </div>
        <button type="button" class="ptw-sidebar__logout-btn" data-ptw-sidebar-logout>
          <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  `;
}

/**
 * Renders mobile offcanvas duplicate of the sidebar for small screens.
 * @param {SidebarOptions} [options]
 * @returns {string}
 */
export function renderSidebarOffcanvas(options = {}) {
  const { activePath = '/admin' } = options;

  return `
    <div
      class="offcanvas offcanvas-start ptw-sidebar-offcanvas d-lg-none"
      tabindex="-1"
      id="ptwAdminSidebarOffcanvas"
      aria-labelledby="ptwAdminSidebarOffcanvasLabel"
    >
      <div class="offcanvas-header ptw-sidebar-offcanvas__header">
        <h2 class="offcanvas-title ptw-sidebar-offcanvas__title" id="ptwAdminSidebarOffcanvasLabel">
          ${escapeHtml(appSettings.appName)}
        </h2>
        <button
          type="button"
          class="btn-close btn-close-white"
          data-bs-dismiss="offcanvas"
          aria-label="Close navigation"
        ></button>
      </div>
      <div class="offcanvas-body p-0">
        ${renderSidebar(options)}
      </div>
    </div>
  `;
}

/**
 * @param {{ type: 'item', path: string, label: string, icon: string } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }> }} section
 * @param {string} activePath
 * @returns {string}
 */
function renderNavSection(section, activePath) {
  if (section.type === 'item') {
    const isActive = isSidebarPathActive(activePath, section.path);

    return `
      <li class="ptw-sidebar__item">
        <a
          class="ptw-sidebar__link${isActive ? ' active' : ''}"
          href="${escapeHtml(section.path)}"
          data-route
          aria-current="${isActive ? 'page' : 'false'}"
        >
          <i class="bi ${escapeHtml(section.icon)}" aria-hidden="true"></i>
          <span>${escapeHtml(section.label)}</span>
        </a>
      </li>
    `;
  }

  const childActive = section.children.some((child) => isSidebarPathActive(activePath, child.path));
  const childMarkup = section.children.map((child) => {
    const isActive = isSidebarPathActive(activePath, child.path);

    return `
      <li class="ptw-sidebar__subitem">
        <a
          class="ptw-sidebar__sublink${isActive ? ' active' : ''}"
          href="${escapeHtml(child.path)}"
          data-route
          aria-current="${isActive ? 'page' : 'false'}"
        >
          ${escapeHtml(child.label)}
        </a>
      </li>
    `;
  }).join('');

  return `
    <li class="ptw-sidebar__group${childActive ? ' ptw-sidebar__group--active' : ''}">
      <div class="ptw-sidebar__group-label">
        <i class="bi ${escapeHtml(section.icon)}" aria-hidden="true"></i>
        <span>${escapeHtml(section.label)}</span>
      </div>
      <ul class="ptw-sidebar__submenu list-unstyled mb-0">
        ${childMarkup}
      </ul>
    </li>
  `;
}

/**
 * @param {{ path: string, label: string, icon: string }} link
 * @param {string} activePath
 * @returns {string}
 */
function renderAccountLink(link, activePath) {
  const isActive = isSidebarPathActive(activePath, link.path);

  return `
    <a
      class="ptw-sidebar__account-link${isActive ? ' active' : ''}"
      href="${escapeHtml(link.path)}"
      data-route
      aria-current="${isActive ? 'page' : 'false'}"
    >
      <i class="bi ${escapeHtml(link.icon)}" aria-hidden="true"></i>
      <span>${escapeHtml(link.label)}</span>
    </a>
  `;
}

/**
 * Renders a compact mobile menu bar for admin pages (no global header).
 * @returns {string}
 */
function renderAdminMobileBar() {
  return `
    <div class="ptw-admin-mobile-bar d-lg-none">
      <button
        type="button"
        class="btn btn-link ptw-admin-mobile-bar__toggle"
        data-bs-toggle="offcanvas"
        data-bs-target="#ptwAdminSidebarOffcanvas"
        aria-controls="ptwAdminSidebarOffcanvas"
        aria-label="Open admin navigation"
      >
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
      <span class="ptw-admin-mobile-bar__title">${escapeHtml(appSettings.appName)}</span>
    </div>
  `;
}

/**
 * Mounts the sidebar into a container element.
 * @param {HTMLElement} container
 * @param {SidebarOptions} [options]
 * @returns {void}
 */
export function mountSidebar(container, options = {}) {
  container.innerHTML = `
    ${renderAdminMobileBar()}
    <div class="ptw-sidebar-panel d-none d-lg-flex">
      ${renderSidebar(options)}
    </div>
    ${renderSidebarOffcanvas(options)}
  `;
  bindSidebarEvents(container);
}

/**
 * Updates active navigation state without remounting the sidebar.
 * @param {HTMLElement} container
 * @param {string} activePath
 * @returns {boolean}
 */
export function updateSidebarActiveState(container, activePath) {
  const sidebar = container.querySelector('.ptw-sidebar');

  if (!sidebar) {
    return false;
  }

  container.querySelectorAll('.ptw-sidebar__link, .ptw-sidebar__sublink, .ptw-sidebar__account-link').forEach((link) => {
    const href = link.getAttribute('href') ?? '';
    const isActive = isSidebarPathActive(activePath, href);
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });

  container.querySelectorAll('.ptw-sidebar__group').forEach((group) => {
    const hasActiveChild = Boolean(group.querySelector('.ptw-sidebar__sublink.active'));
    group.classList.toggle('ptw-sidebar__group--active', hasActiveChild);
  });

  return true;
}

/**
 * Returns whether the current path should show the admin shell (sidebar + static header/footer).
 * @param {string} path
 * @returns {boolean}
 */
export function isAdminPath(path) {
  const normalized = normalizeShellPath(path);

  if (ADMIN_SHELL_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return normalized.startsWith('/admin/');
}

/**
 * @param {string} activePath
 * @param {string} itemPath
 * @returns {boolean}
 */
function isSidebarPathActive(activePath, itemPath) {
  const normalizedActive = normalizeShellPath(activePath);
  const normalizedItem = normalizeShellPath(itemPath);

  return normalizedActive === normalizedItem
    || (normalizedItem !== '/admin' && normalizedActive.startsWith(`${normalizedItem}/`));
}

/**
 * @param {string} path
 * @returns {string}
 */
function normalizeShellPath(path) {
  const trimmed = path.split('?')[0].replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * @param {HTMLElement} container
 * @returns {void}
 */
function bindSidebarEvents(container) {
  container.querySelectorAll('[data-ptw-sidebar-logout]').forEach((button) => {
    button.addEventListener('click', () => {
      void performLogout();
    });
  });

  container.querySelectorAll('[data-route]').forEach((link) => {
    link.addEventListener('click', () => {
      const offcanvas = document.getElementById('ptwAdminSidebarOffcanvas');

      if (offcanvas && typeof window.bootstrap !== 'undefined') {
        const instance = window.bootstrap.Offcanvas.getInstance(offcanvas);
        instance?.hide();
      }
    });
  });
}
