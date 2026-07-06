/**
 * @fileoverview Reusable page header component.
 * @module components/page-header.component
 */

import { escapeHtml } from '../utils/html.util.js';

/**
 * @typedef {Object} PageHeaderOptions
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [actionsHtml]
 */

/**
 * @typedef {PageHeaderOptions} ContestantPageHeaderOptions
 */

/**
 * Renders a contestant page header.
 * @param {ContestantPageHeaderOptions} options
 * @returns {string}
 */
export function renderContestantPageHeader(options) {
  const { title, subtitle = '', actionsHtml = '' } = options;

  return renderPageHeader({
    title,
    subtitle,
    actionsHtml: actionsHtml
      ? `<div class="d-flex flex-wrap align-items-center gap-2 justify-content-md-end">${actionsHtml}</div>`
      : '',
  });
}

/**
 * Renders a page header block.
 * @param {PageHeaderOptions} options
 * @returns {string}
 */
export function renderPageHeader(options) {
  const { title, subtitle = '', actionsHtml = '' } = options;

  return `
    <header class="ptw-page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
      <div>
        <h1 class="ptw-page-header__title">${escapeHtml(title)}</h1>
        ${subtitle ? `<p class="ptw-page-header__subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${actionsHtml ? `<div class="ptw-page-header__actions">${actionsHtml}</div>` : ''}
    </header>
  `;
}

/**
 * Mounts a page header into a container.
 * @param {HTMLElement} container
 * @param {PageHeaderOptions} options
 * @returns {void}
 */
export function mountPageHeader(container, options) {
  container.innerHTML = renderPageHeader(options);
}
