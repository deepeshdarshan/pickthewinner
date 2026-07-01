/**
 * @fileoverview Layout service — mounts shared shell components.
 * @module services/layout.service
 */

import { mountNavbar } from '../components/navbar.component.js';
import { mountFooter } from '../components/footer.component.js';
import { mountSidebar, isAdminPath } from '../components/sidebar.component.js';
import { mountMobileNav } from '../components/mobile-nav.component.js';
import { ensureLoadingOverlay } from '../components/loading-overlay.component.js';
import { ensureToastContainer } from '../components/toast.component.js';
import { ensureConfirmationModal } from '../components/confirmation-modal.component.js';
import { ensureErrorDialog } from '../components/error-dialog.component.js';

/**
 * @typedef {Object} LayoutOptions
 * @property {string} [activePath='/']
 */

/**
 * Mounts the shared application shell (navbar, footer, overlays).
 * @param {LayoutOptions} [options]
 * @returns {void}
 */
export function mountAppShell(options = {}) {
  const { activePath = '/' } = options;

  const navbarMount = document.getElementById('ptw-navbar-mount');
  const footerMount = document.getElementById('ptw-footer-mount');
  const sidebarMount = document.getElementById('ptw-sidebar-mount');
  const mobileNavMount = document.getElementById('ptw-mobile-nav-mount');
  const bodyWrapper = document.getElementById('ptw-body-wrapper');

  if (navbarMount) {
    mountNavbar(navbarMount, { activePath });
  }

  if (footerMount) {
    mountFooter(footerMount);
  }

  if (mobileNavMount) {
    mountMobileNav(mobileNavMount, { activePath });
  }

  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);

  ensureLoadingOverlay();
  ensureToastContainer();
  ensureConfirmationModal();
  ensureErrorDialog();
}

/**
 * Updates shell components for the current route.
 * @param {string} activePath
 * @returns {void}
 */
export function updateAppShell(activePath) {
  const navbarMount = document.getElementById('ptw-navbar-mount');
  const sidebarMount = document.getElementById('ptw-sidebar-mount');
  const mobileNavMount = document.getElementById('ptw-mobile-nav-mount');
  const bodyWrapper = document.getElementById('ptw-body-wrapper');

  if (navbarMount) {
    mountNavbar(navbarMount, { activePath });
  }

  if (mobileNavMount) {
    mountMobileNav(mobileNavMount, { activePath });
  }

  updateSidebarVisibility(activePath, sidebarMount, bodyWrapper);
}

/**
 * Shows or hides the admin sidebar based on the current path.
 * @param {string} activePath
 * @param {HTMLElement|null} sidebarMount
 * @param {HTMLElement|null} bodyWrapper
 * @returns {void}
 */
function updateSidebarVisibility(activePath, sidebarMount, bodyWrapper) {
  const showSidebar = isAdminPath(activePath);

  if (bodyWrapper) {
    bodyWrapper.classList.toggle('ptw-body-wrapper--with-sidebar', showSidebar);
  }

  if (!sidebarMount) {
    return;
  }

  if (showSidebar) {
    sidebarMount.className = 'd-none d-lg-block';
    mountSidebar(sidebarMount, { activePath });
  } else {
    sidebarMount.innerHTML = '';
    sidebarMount.className = 'd-none';
  }
}
