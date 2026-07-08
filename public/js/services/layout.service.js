/**
 * @fileoverview Layout service — mounts shared shell components.
 * @module services/layout.service
 */

import { mountNavbar } from '../components/navbar.component.js';
import { mountFooter } from '../components/footer.component.js';
import {
  mountSidebar,
  updateSidebarActiveState,
  updateSidebarUserInfo,
  isSidebarShellPath,
  getSidebarVariant,
  contestantLeaderboardNavMatchesSettings,
} from '../components/sidebar.component.js';
import { mountMobileNav } from '../components/mobile-nav.component.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { USER_ROLES } from '../users/user.constants.js';
import { ensureLoadingOverlay } from '../components/loading-overlay.component.js';
import { ensureToastContainer } from '../components/toast.component.js';
import { ensureConfirmationModal } from '../components/confirmation-modal.component.js';
import { ensureErrorDialog } from '../components/error-dialog.component.js';

/**
 * @typedef {Object} LayoutOptions
 * @property {string} [activePath='/']
 */

/** @type {'guest'|'sidebar'|'standard'|null} */
let activeShellMode = null;

/** @type {'admin'|'contestant'|null} */
let activeSidebarVariant = null;

/**
 * Mounts the shared application shell (navbar, footer, overlays).
 * @param {LayoutOptions} [options]
 * @returns {void}
 */
export function mountAppShell(options = {}) {
  const { activePath = '/' } = options;

  const appShell = document.querySelector('.ptw-app-shell');
  const navbarMount = document.getElementById('ptw-navbar-mount');
  const footerMount = document.getElementById('ptw-footer-mount');
  const sidebarMount = document.getElementById('ptw-sidebar-mount');
  const mobileNavMount = document.getElementById('ptw-mobile-nav-mount');
  const bodyWrapper = document.getElementById('ptw-body-wrapper');

  activeShellMode = resolveShellMode(activePath);
  activeSidebarVariant = activeShellMode === 'sidebar' ? getSidebarVariant(activePath, getCurrentUserRole()) : null;
  appShell?.classList.toggle('ptw-app-shell--admin', activeShellMode === 'sidebar');
  applySidebarChrome(activeShellMode, activePath, { navbarMount, footerMount, mobileNavMount });

  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);

  ensureLoadingOverlay();
  ensureToastContainer();
  ensureConfirmationModal();
  ensureErrorDialog();
}

/**
 * Updates shell components for the current route.
 * Sidebar pages use sidebar only — no global header, footer, or bottom nav.
 * @param {string} activePath
 * @returns {void}
 */
export function updateAppShell(activePath) {
  const appShell = document.querySelector('.ptw-app-shell');
  const navbarMount = document.getElementById('ptw-navbar-mount');
  const footerMount = document.getElementById('ptw-footer-mount');
  const sidebarMount = document.getElementById('ptw-sidebar-mount');
  const mobileNavMount = document.getElementById('ptw-mobile-nav-mount');
  const bodyWrapper = document.getElementById('ptw-body-wrapper');
  const nextShellMode = resolveShellMode(activePath);
  const nextSidebarVariant = nextShellMode === 'sidebar' ? getSidebarVariant(activePath, getCurrentUserRole()) : null;
  const preserveSidebarShell = activeShellMode === 'sidebar'
    && nextShellMode === 'sidebar'
    && activeSidebarVariant === nextSidebarVariant;

  activeShellMode = nextShellMode;
  activeSidebarVariant = nextSidebarVariant;
  appShell?.classList.toggle('ptw-app-shell--admin', nextShellMode === 'sidebar');

  if (preserveSidebarShell) {
    updateSidebarVisibility(activePath, sidebarMount, bodyWrapper, { preserveSidebar: true });
    return;
  }

  applySidebarChrome(nextShellMode, activePath, { navbarMount, footerMount, mobileNavMount });
  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);
}

/**
 * Shows or hides the global navbar and footer based on shell mode.
 * @param {'guest'|'sidebar'|'standard'} shellMode
 * @param {string} activePath
 * @param {{ navbarMount: HTMLElement|null, footerMount: HTMLElement|null, mobileNavMount: HTMLElement|null }} mounts
 * @returns {void}
 */
function applySidebarChrome(shellMode, activePath, mounts) {
  const { navbarMount, footerMount, mobileNavMount } = mounts;

  if (shellMode === 'sidebar') {
    if (navbarMount) {
      navbarMount.innerHTML = '';
      navbarMount.className = 'd-none';
    }

    if (footerMount) {
      footerMount.innerHTML = '';
      footerMount.className = 'd-none';
    }

    if (mobileNavMount) {
      mobileNavMount.innerHTML = '';
      mobileNavMount.className = 'd-none';
    }

    return;
  }

  if (navbarMount) {
    navbarMount.className = '';
    mountNavbar(navbarMount, { activePath });
  }

  if (footerMount) {
    footerMount.className = '';
    ensureFooterMounted(footerMount);
  }

  if (mobileNavMount) {
    mobileNavMount.className = '';
    mountMobileNav(mobileNavMount, { activePath });
  }
}

/**
 * @param {string} activePath
 * @returns {'guest'|'sidebar'|'standard'}
 */
function resolveShellMode(activePath) {
  if (!isAuthenticated()) {
    const normalized = normalizeLayoutPath(activePath);
    if (normalized === '/' || normalized === AUTH_ROUTES.LOGIN) {
      return 'guest';
    }
  }

  const role = getCurrentUserRole();

  if (isSidebarShellPath(activePath, role)) {
    return 'sidebar';
  }

  return 'standard';
}

/**
 * @returns {'admin'|'contestant'|null}
 */
function getCurrentUserRole() {
  const role = AuthorizationService.getCurrentRole();
  if (role === USER_ROLES.ADMIN) {
    return 'admin';
  }

  if (role === USER_ROLES.CONTESTANT) {
    return 'contestant';
  }

  return null;
}

/**
 * @param {string} path
 * @returns {string}
 */
function normalizeLayoutPath(path) {
  const trimmed = path.split('?')[0].replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * @param {HTMLElement|null} footerMount
 * @returns {void}
 */
function ensureFooterMounted(footerMount) {
  if (!footerMount || footerMount.querySelector('.ptw-footer')) {
    return;
  }

  mountFooter(footerMount);
}

/**
 * Shows or hides the sidebar based on the current path.
 * @param {string} activePath
 * @param {HTMLElement|null} sidebarMount
 * @param {HTMLElement|null} bodyWrapper
 * @param {{ preserveSidebar?: boolean }} [options]
 * @returns {void}
 */
function updateSidebarVisibility(activePath, sidebarMount, bodyWrapper, options = {}) {
  const role = getCurrentUserRole();
  const showSidebar = isSidebarShellPath(activePath, role);
  const variant = showSidebar ? getSidebarVariant(activePath, role) : null;

  if (bodyWrapper) {
    bodyWrapper.classList.toggle('ptw-body-wrapper--with-sidebar', showSidebar);
  }

  if (!sidebarMount) {
    return;
  }

  if (showSidebar && variant) {
    sidebarMount.className = 'ptw-sidebar-mount';

    if (options.preserveSidebar && updateSidebarActiveState(sidebarMount, activePath, variant)) {
      const leaderboardNavMatches = variant !== 'contestant'
        || contestantLeaderboardNavMatchesSettings(sidebarMount);

      if (leaderboardNavMatches) {
        updateSidebarUserInfo(sidebarMount, variant);
        return;
      }
    }

    mountSidebar(sidebarMount, { activePath, variant });
    return;
  }

  sidebarMount.innerHTML = '';
  sidebarMount.className = 'd-none';
}
