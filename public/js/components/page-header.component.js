/**
 * @fileoverview Reusable page header component.
 * @module components/page-header.component
 */

import { AppContext } from '../app/app.context.js';
import { renderAvatar } from '../shared/avatar/avatar.component.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * @typedef {Object} PageHeaderOptions
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [actionsHtml]
 */

/**
 * @typedef {PageHeaderOptions & { showGlobalActions?: boolean }} ContestantPageHeaderOptions
 */

/**
 * Renders global action buttons for contestant page headers.
 * @returns {string}
 */
export function renderContestantGlobalActions() {
  const photoURL = AppContext.getPhotoURL();

  return `
    <div class="ptw-page-header__global-actions d-flex align-items-center gap-2">
      <button
        type="button"
        class="btn btn-link ptw-page-header__icon-btn position-relative"
        aria-label="Notifications"
        title="Notifications (coming soon)"
        disabled
      >
        <i class="bi bi-bell" aria-hidden="true"></i>
        <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger ptw-page-header__badge">
          3
        </span>
      </button>
      <button
        type="button"
        class="btn btn-link ptw-page-header__icon-btn d-none d-md-inline-flex"
        aria-label="Theme"
        title="Theme (coming soon)"
        disabled
      >
        <i class="bi bi-moon" aria-hidden="true"></i>
      </button>
      <a
        href="/profile"
        class="btn btn-link ptw-page-header__icon-btn ptw-page-header__profile-btn"
        data-route
        aria-label="Profile"
      >
        ${renderAvatar({ photoURL, className: 'ptw-page-header__avatar', size: 32 })}
      </a>
    </div>
  `;
}

/**
 * Renders a contestant page header with optional global actions.
 * @param {ContestantPageHeaderOptions} options
 * @returns {string}
 */
export function renderContestantPageHeader(options) {
  const { title, subtitle = '', actionsHtml = '', showGlobalActions = true } = options;
  const globalActions = showGlobalActions ? renderContestantGlobalActions() : '';
  const combinedActions = [actionsHtml, globalActions].filter(Boolean).join('');

  return renderPageHeader({
    title,
    subtitle,
    actionsHtml: combinedActions
      ? `<div class="d-flex flex-wrap align-items-center gap-2 justify-content-md-end">${combinedActions}</div>`
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
