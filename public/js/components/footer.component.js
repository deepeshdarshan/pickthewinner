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
          </div>

          <div class="ptw-footer__meta">
            <p class="ptw-footer__version mb-0">v${appSettings.version}</p>
            <p class="ptw-footer__timezone mb-0">|</p>
            <p class="ptw-footer__tagline mb-0">${appSettings.appTagline}</p>
          </div>
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
