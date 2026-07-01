/**
 * @fileoverview Application footer component.
 * @module components/footer.component
 */

import { appSettings } from '../config/app.config.js';

/**
 * Renders the site footer.
 * @returns {string}
 */
export function renderFooter() {
  const year = new Date().getFullYear();

  return `
    <footer class="ptw-footer" role="contentinfo">
      <div class="container-fluid px-3 px-lg-4">
        <div class="ptw-footer__inner">
          <div class="ptw-footer__brand">
            <p class="ptw-footer__copyright mb-0">
              &copy; ${year} ${appSettings.appName}. All rights reserved.
            </p>
            <p class="ptw-footer__version mb-0">v${appSettings.version}</p>
          </div>

          <nav class="ptw-footer__links" aria-label="Footer links">
            <a href="#" class="ptw-footer__link" aria-disabled="true">Privacy</a>
            <a href="#" class="ptw-footer__link" aria-disabled="true">Terms</a>
            <a href="#" class="ptw-footer__link" aria-disabled="true" title="GitHub (placeholder)">
              <i class="bi bi-github me-1" aria-hidden="true"></i>GitHub
            </a>
          </nav>

          <p class="ptw-footer__tagline mb-0">${appSettings.appTagline}</p>
        </div>
      </div>
    </footer>
  `;
}

/**
 * Mounts the footer into a container element.
 * @param {HTMLElement} container
 * @returns {void}
 */
export function mountFooter(container) {
  container.innerHTML = renderFooter();
}
