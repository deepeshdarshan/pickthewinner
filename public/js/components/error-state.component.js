/**
 * @fileoverview Error state component for inline error display.
 * @module components/error-state.component
 */

/**
 * @typedef {Object} ErrorStateOptions
 * @property {string} title
 * @property {string} [message]
 * @property {string} [icon]
 * @property {string} [actionHtml]
 */

/**
 * Renders an error state block.
 * @param {ErrorStateOptions} options
 * @returns {string}
 */
export function renderErrorState(options) {
  const {
    title,
    message = 'Something went wrong. Please try again.',
    icon = 'bi-exclamation-triangle',
    actionHtml = '',
  } = options;

  return `
    <div class="ptw-error-state text-center" role="alert">
      <i class="bi ${icon} ptw-error-state__icon" aria-hidden="true"></i>
      <h3 class="ptw-error-state__title">${title}</h3>
      <p class="ptw-error-state__message">${message}</p>
      ${actionHtml ? `<div class="ptw-error-state__action">${actionHtml}</div>` : ''}
    </div>
  `;
}

/**
 * Mounts an error state into a container element.
 * @param {HTMLElement} container
 * @param {ErrorStateOptions} options
 * @returns {void}
 */
export function mountErrorState(container, options) {
  container.innerHTML = renderErrorState(options);
}
