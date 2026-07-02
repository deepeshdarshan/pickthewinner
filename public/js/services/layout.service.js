/**
 * @fileoverview Layout service — mounts shared shell components.
 * @module services/layout.service
 */

import { mountNavbar } from '../components/navbar.component.js';
import { mountFooter } from '../components/footer.component.js';
import {
  mountSidebar,
  updateSidebarActiveState,
  isAdminPath,
} from '../components/sidebar.component.js';
import { mountMobileNav } from '../components/mobile-nav.component.js';
import { isAuthenticated } from '../auth/auth.service.js';
import { AUTH_ROUTES } from '../auth/authentication.constants.js';
import { ensureLoadingOverlay } from '../components/loading-overlay.component.js';
import { ensureToastContainer } from '../components/toast.component.js';
import { ensureConfirmationModal } from '../components/confirmation-modal.component.js';
import { ensureErrorDialog } from '../components/error-dialog.component.js';

/**
 * @typedef {Object} LayoutOptions
 * @property {string} [activePath='/']
 */

/** @type {'guest'|'admin'|'standard'|null} */
let activeShellMode = null;

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
  appShell?.classList.toggle('ptw-app-shell--admin', activeShellMode === 'admin');
  applyAdminChrome(activeShellMode, activePath, { navbarMount, footerMount, mobileNavMount });

  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);

  ensureLoadingOverlay();
  ensureToastContainer();
  ensureConfirmationModal();
  ensureErrorDialog();
}

/**
 * Updates shell components for the current route.
 * Admin pages use sidebar only — no global header or footer.
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
  const preserveAdminShell = activeShellMode === 'admin' && nextShellMode === 'admin';

  activeShellMode = nextShellMode;
  appShell?.classList.toggle('ptw-app-shell--admin', nextShellMode === 'admin');

  if (preserveAdminShell) {
    updateSidebarVisibility(activePath, sidebarMount, bodyWrapper, { preserveSidebar: true });
    return;
  }

  applyAdminChrome(nextShellMode, activePath, { navbarMount, footerMount, mobileNavMount });
  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);
}

/**
 * Shows or hides the global navbar and footer based on shell mode.
 * @param {'guest'|'admin'|'standard'} shellMode
 * @param {string} activePath
 * @param {{ navbarMount: HTMLElement|null, footerMount: HTMLElement|null, mobileNavMount: HTMLElement|null }} mounts
 * @returns {void}
 */
function applyAdminChrome(shellMode, activePath, mounts) {
  const { navbarMount, footerMount, mobileNavMount } = mounts;

  if (shellMode === 'admin') {
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
 * @returns {'guest'|'admin'|'standard'}
 */
function resolveShellMode(activePath) {
  if (!isAuthenticated()) {
    const normalized = normalizeLayoutPath(activePath);
    if (normalized === '/' || normalized === AUTH_ROUTES.LOGIN) {
      return 'guest';
    }
  }

  if (isAdminPath(activePath)) {
    return 'admin';
  }

  return 'standard';
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
 * Shows or hides the admin sidebar based on the current path.
 * @param {string} activePath
 * @param {HTMLElement|null} sidebarMount
 * @param {HTMLElement|null} bodyWrapper
 * @param {{ preserveSidebar?: boolean }} [options]
 * @returns {void}
 */
function updateSidebarVisibility(activePath, sidebarMount, bodyWrapper, options = {}) {
  const showSidebar = isAdminPath(activePath);

  if (bodyWrapper) {
    bodyWrapper.classList.toggle('ptw-body-wrapper--with-sidebar', showSidebar);
  }

  if (!sidebarMount) {
    return;
  }

  if (showSidebar) {
    sidebarMount.className = 'ptw-sidebar-mount';

    if (options.preserveSidebar && updateSidebarActiveState(sidebarMount, activePath)) {
      return;
    }

    mountSidebar(sidebarMount, { activePath });
    return;
  }

  sidebarMount.innerHTML = '';
  sidebarMount.className = 'd-none';
}
