/**
 * @fileoverview Loading spinner component.
 * @module components/spinner.component
 */

/**
 * @typedef {Object} SpinnerOptions
 * @property {'sm'|'md'|'lg'} [size]
 * @property {string} [label]
 */

/**
 * Renders a loading spinner.
 * @param {SpinnerOptions} [options]
 * @returns {string}
 */
export function renderSpinner(options = {}) {
  const { size = 'md', label = 'Loading' } = options;

  return `
    <div class="ptw-spinner ptw-spinner--${size}" role="status" aria-label="${label}">
      <span class="ptw-spinner__ring" aria-hidden="true"></span>
      <span class="visually-hidden">${label}</span>
    </div>
  `;
}

/**
 * Mounts a spinner into a container element.
 * @param {HTMLElement} container
 * @param {SpinnerOptions} [options]
 * @returns {void}
 */
export function mountSpinner(container, options = {}) {
  container.innerHTML = renderSpinner(options);
}
