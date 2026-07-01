/**
 * @fileoverview Error page for application-level failures.
 * @module pages/error.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderErrorState } from '../components/error-state.component.js';
import { MESSAGES } from '../config/application.constants.js';

/**
 * Renders the error page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  outlet.innerHTML = `
    <div class="container ptw-page-content">
      ${renderPageHeader({
        title: 'Something Went Wrong',
        subtitle: 'Application Error',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderErrorState({
            title: 'Unexpected Error',
            message: MESSAGES.GENERIC_ERROR,
            actionHtml: `
              <a class="btn btn-ptw-primary mt-3" href="/" data-route>
                <i class="bi bi-house me-1" aria-hidden="true"></i>
                ${MESSAGES.RETURN_HOME}
              </a>
            `,
          })}
        </div>
      </div>
    </div>
  `;
}
