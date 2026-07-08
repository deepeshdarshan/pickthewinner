/**
 * @fileoverview Application sidebar — persistent left navigation for admin and contestant shells.
 * @module components/sidebar.component
 */

import { appSettings } from '../config/app.config.js';
import { AppContext } from '../app/app.context.js';
import { performLogout } from '../auth/actions/logout.action.js';
import { renderAppLogo } from '../shared/logo/logo.component.js';
import { renderAvatar } from '../shared/avatar/avatar.component.js';
import { PlatformSettingsService } from '../settings/settings.service.js';
import { escapeHtml } from '../utils/html.util.js';
import {
  ADMIN_ACCOUNT_LINKS,
  ADMIN_NAV_SECTIONS,
  CONTESTANT_ACCOUNT_LINKS,
  CONTESTANT_NAV_SECTIONS,
  collectNavPaths,
  isAdminShellPath,
  isContestantShellPath,
  isNavPathActive,
  normalizeShellPath,
} from './sidebar-nav.config.js';

/**
 * @typedef {'admin' | 'contestant'} SidebarVariant
 */

/**
 * @typedef {Object} SidebarOptions
 * @property {string} [activePath]
 * @property {SidebarVariant} [variant='admin']
 */

/**
 * Returns whether the current path should show the admin sidebar shell.
 * @param {string} path
 * @returns {boolean}
 */
export function isAdminPath(path) {
  return isAdminShellPath(path);
}

/**
 * Returns whether the current path should use a sidebar shell layout.
 * @param {string} path
 * @param {'admin' | 'contestant'|null} [role]
 * @returns {boolean}
 */
export function isSidebarShellPath(path, role = null) {
  if (role === 'admin') {
    return isAdminShellPath(path);
  }

  if (role === 'contestant') {
    return isContestantShellPath(path);
  }

  return isAdminShellPath(path) || isContestantShellPath(path);
}

/**
 * Resolves sidebar variant from path and role.
 * @param {string} path
 * @param {'admin' | 'contestant'|null} [role]
 * @returns {SidebarVariant}
 */
export function getSidebarVariant(path, role = null) {
  if (role === 'admin') {
    return 'admin';
  }

  if (role === 'contestant') {
    return 'contestant';
  }

  return isAdminShellPath(normalizeShellPath(path)) ? 'admin' : 'contestant';
}

/**
 * Renders the sidebar navigation panel.
 * @param {SidebarOptions} [options]
 * @returns {string}
 */
export function renderSidebar(options = {}) {
  const { activePath = '/admin', variant = 'admin' } = options;
  const isContestant = variant === 'contestant';
  const homePath = isContestant ? '/dashboard' : '/admin';
  const navLabel = isContestant ? 'Contestant navigation' : 'Admin navigation';
  const navSections = filterNavSections(
    isContestant ? CONTESTANT_NAV_SECTIONS : ADMIN_NAV_SECTIONS,
    isContestant,
  );
  const accountLinks = isContestant ? CONTESTANT_ACCOUNT_LINKS : ADMIN_ACCOUNT_LINKS;
  const navPaths = collectNavPaths(navSections, accountLinks);
  const navMarkup = navSections.map((section) => renderNavSection(section, activePath, homePath, navPaths)).join('');
  const accountMarkup = accountLinks.map((link) => renderAccountLink(link, activePath, navPaths)).join('');
  const displayName = resolveSidebarDisplayName(isContestant);
  const roleLabel = isContestant ? 'Contestant' : 'Administrator';
  const photoURL = AppContext.getPhotoURL();

  return `
    <aside class="ptw-sidebar" aria-label="${escapeHtml(navLabel)}">
      <div class="ptw-sidebar__brand">
        <a href="${homePath}" class="ptw-sidebar__brand-link" data-route aria-label="${escapeHtml(appSettings.appName)} home">
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
          ${renderAvatar({ photoURL, className: 'ptw-sidebar__user-avatar', size: 36 })}
          <div class="ptw-sidebar__user-meta">
            <span class="ptw-sidebar__user-name">${escapeHtml(displayName)}</span>
            <span class="ptw-sidebar__user-role">${escapeHtml(roleLabel)}</span>
          </div>
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
 * @param {ReadonlyArray<{ type: string, hideWhenLeaderboardHidden?: boolean }>} sections
 * @param {boolean} isContestant
 * @returns {ReadonlyArray<unknown>}
 */
function filterNavSections(sections, isContestant) {
  if (!isContestant) {
    return sections;
  }

  const leaderboardVisible = PlatformSettingsService.isLeaderboardVisible();

  return sections.filter((section) => {
    if (section.hideWhenLeaderboardHidden && !leaderboardVisible) {
      return false;
    }

    return true;
  });
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
 * @param {string} homePath
 * @param {ReadonlyArray<string>} navPaths
 * @returns {string}
 */
function renderNavSection(section, activePath, homePath, navPaths) {
  if (section.type === 'item') {
    const isActive = isNavPathActive(activePath, section.path, homePath, navPaths);

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

  const childActive = section.children.some((child) => isNavPathActive(activePath, child.path, homePath, navPaths));
  const childMarkup = section.children.map((child) => {
    const isActive = isNavPathActive(activePath, child.path, homePath, navPaths);

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
 * @param {ReadonlyArray<string>} navPaths
 * @returns {string}
 */
function renderAccountLink(link, activePath, navPaths) {
  const isActive = isNavPathActive(activePath, link.path, link.path, navPaths);

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
 * Renders a compact mobile menu bar for sidebar shell pages.
 * @param {SidebarVariant} [variant='admin']
 * @returns {string}
 */
function renderSidebarMobileBar(variant = 'admin') {
  const label = variant === 'contestant' ? 'Open navigation' : 'Open admin navigation';

  return `
    <div class="ptw-admin-mobile-bar d-lg-none">
      <button
        type="button"
        class="btn btn-link ptw-admin-mobile-bar__toggle"
        data-bs-toggle="offcanvas"
        data-bs-target="#ptwAdminSidebarOffcanvas"
        aria-controls="ptwAdminSidebarOffcanvas"
        aria-label="${escapeHtml(label)}"
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
  const variant = options.variant ?? 'admin';

  container.innerHTML = `
    ${renderSidebarMobileBar(variant)}
    <div class="ptw-sidebar-panel d-none d-lg-flex">
      ${renderSidebar(options)}
    </div>
    ${renderSidebarOffcanvas(options)}
  `;
  bindSidebarEvents(container);
}

/**
 * Resolves the label shown in the sidebar user section.
 * @param {boolean} isContestant
 * @returns {string}
 */
function resolveSidebarDisplayName(isContestant) {
  return AppContext.getDisplayName()
    || AppContext.getEmail()
    || (isContestant ? 'Contestant' : 'Administrator');
}

/**
 * Updates sidebar user name and avatar without remounting navigation.
 * @param {HTMLElement} container
 * @param {SidebarVariant} [variant='admin']
 * @returns {boolean}
 */
export function updateSidebarUserInfo(container, variant = 'admin') {
  const nameElements = container.querySelectorAll('.ptw-sidebar__user-name');

  if (nameElements.length === 0) {
    return false;
  }

  const displayName = resolveSidebarDisplayName(variant === 'contestant');
  const photoURL = AppContext.getPhotoURL();

  nameElements.forEach((element) => {
    element.textContent = displayName;
  });

  container.querySelectorAll('.ptw-sidebar__user-avatar').forEach((avatarMount) => {
    avatarMount.outerHTML = renderAvatar({
      photoURL,
      className: 'ptw-sidebar__user-avatar',
      size: 36,
    });
  });

  return true;
}

/**
 * Updates active navigation state without remounting the sidebar.
 * @param {HTMLElement} container
 * @param {string} activePath
 * @param {SidebarVariant} [variant='admin']
 * @returns {boolean}
 */
export function updateSidebarActiveState(container, activePath, variant = 'admin') {
  const sidebar = container.querySelector('.ptw-sidebar');

  if (!sidebar) {
    return false;
  }

  const homePath = variant === 'contestant' ? '/dashboard' : '/admin';
  const navSections = filterNavSections(
    variant === 'contestant' ? CONTESTANT_NAV_SECTIONS : ADMIN_NAV_SECTIONS,
    variant === 'contestant',
  );
  const accountLinks = variant === 'contestant' ? CONTESTANT_ACCOUNT_LINKS : ADMIN_ACCOUNT_LINKS;
  const navPaths = collectNavPaths(navSections, accountLinks);

  container.querySelectorAll('.ptw-sidebar__link, .ptw-sidebar__sublink, .ptw-sidebar__account-link').forEach((link) => {
    const href = link.getAttribute('href') ?? '';
    const isActive = isNavPathActive(activePath, href, homePath, navPaths);
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
