/**
 * @fileoverview Not found (404) page.
 * @module pages/not-found.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { appSettings } from '../config/app.config.js';
import { MESSAGES } from '../config/application.constants.js';

/**
 * Renders the not found page.
 * @param {HTMLElement} outlet
 * @param {string} [requestedPath]
 * @returns {void}
 */
export function render(outlet, requestedPath = '') {
  outlet.innerHTML = `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: MESSAGES.NOT_FOUND_TITLE,
        subtitle: '404',
      })}
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card text-center">
          <i class="bi bi-compass" aria-hidden="true"></i>
          <h2 class="h4">${MESSAGES.NOT_FOUND_TITLE}</h2>
          <p class="text-muted mb-1">${MESSAGES.NOT_FOUND}</p>
          ${requestedPath ? `<p class="small text-muted mb-4"><code>${requestedPath}</code></p>` : '<div class="mb-4"></div>'}
          <a class="btn btn-ptw-primary" href="/" data-route>
            <i class="bi bi-house me-1" aria-hidden="true"></i>
            ${MESSAGES.RETURN_HOME}
          </a>
        </div>
      </div>
    </div>
  `;

  document.title = `404 | ${appSettings.appName}`;
}
