/**
 * @fileoverview Search box component.
 * @module components/search-box.component
 */

/**
 * @typedef {Object} SearchBoxOptions
 * @property {string} [placeholder]
 * @property {string} [value]
 * @property {string} [id]
 * @property {string} [name]
 * @property {string} [ariaLabel]
 */

/**
 * Renders a search input with icon.
 * @param {SearchBoxOptions} [options]
 * @returns {string}
 */
export function renderSearchBox(options = {}) {
  const {
    placeholder = 'Search…',
    value = '',
    id = 'ptw-search',
    name = 'search',
    ariaLabel = 'Search',
  } = options;

  return `
    <div class="ptw-search-box">
      <i class="bi bi-search ptw-search-box__icon" aria-hidden="true"></i>
      <input
        type="search"
        class="form-control ptw-search-box__input"
        id="${id}"
        name="${name}"
        placeholder="${placeholder}"
        value="${value}"
        aria-label="${ariaLabel}"
        autocomplete="off"
      >
    </div>
  `;
}

/**
 * Mounts a search box into a container element.
 * @param {HTMLElement} container
 * @param {SearchBoxOptions} [options]
 * @returns {HTMLInputElement|null}
 */
export function mountSearchBox(container, options = {}) {
  container.innerHTML = renderSearchBox(options);
  return container.querySelector('input');
}
