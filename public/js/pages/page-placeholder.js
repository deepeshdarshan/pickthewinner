/**
 * @fileoverview Shared placeholder page renderer for foundation pages.
 * @module pages/page-placeholder
 */

import { renderPageHeader, renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { MESSAGES } from '../config/application.constants.js';

/**
 * @typedef {Object} PlaceholderPageOptions
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} icon
 * @property {string} [description]
 * @property {boolean} [wrapContainer=true]
 * @property {'admin'|'contestant'} [shell='admin']
 */

/**
 * Renders a standard placeholder page layout.
 * @param {PlaceholderPageOptions} options
 * @returns {string}
 */
export function renderPlaceholderPage(options) {
  const {
    title,
    subtitle = 'Foundation placeholder',
    icon,
    description = MESSAGES.COMING_SOON,
    wrapContainer = true,
    shell = 'admin',
  } = options;

  const headerRenderer = shell === 'contestant' ? renderContestantPageHeader : renderPageHeader;
  const shellClasses = shell === 'contestant' ? CONTESTANT_PAGE_SHELL_CLASSES : ADMIN_PAGE_SHELL_CLASSES;

  const content = `
    ${headerRenderer({ title, subtitle })}
    <div class="card ptw-card">
      <div class="card-body ptw-placeholder-card">
        <i class="bi ${icon}" aria-hidden="true"></i>
        <h2 class="h4">${title}</h2>
        <p>${description}</p>
      </div>
    </div>
  `;

  if (!wrapContainer) {
    return content;
  }

  return `
    <div class="${shellClasses}">
      ${content}
    </div>
  `;
}

/**
 * Mounts a placeholder page into the outlet.
 * @param {HTMLElement} outlet
 * @param {PlaceholderPageOptions} options
 * @returns {void}
 */
export function mountPlaceholderPage(outlet, options) {
  outlet.innerHTML = renderPlaceholderPage(options);
}
