/**
 * @fileoverview Empty state component for lists and pages with no data.
 * @module components/empty-state.component
 */

/**
 * @typedef {Object} EmptyStateOptions
 * @property {string} title
 * @property {string} [message]
 * @property {string} [icon]
 * @property {string} [actionHtml]
 */

/**
 * Renders an empty state block.
 * @param {EmptyStateOptions} options
 * @returns {string}
 */
export function renderEmptyState(options) {
  const {
    title,
    message = 'No data available yet.',
    icon = 'bi-inbox',
    actionHtml = '',
  } = options;

  return `
    <div class="ptw-empty-state text-center" role="status">
      <i class="bi ${icon} ptw-empty-state__icon" aria-hidden="true"></i>
      <h3 class="ptw-empty-state__title">${title}</h3>
      <p class="ptw-empty-state__message">${message}</p>
      ${actionHtml ? `<div class="ptw-empty-state__action">${actionHtml}</div>` : ''}
    </div>
  `;
}

/**
 * Mounts an empty state into a container element.
 * @param {HTMLElement} container
 * @param {EmptyStateOptions} options
 * @returns {void}
 */
export function mountEmptyState(container, options) {
  container.innerHTML = renderEmptyState(options);
}
