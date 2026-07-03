/**
 * @fileoverview Reusable filter bar wrapper for list pages.
 * @module components/filter-bar.component
 */

/**
 * @typedef {Object} FilterBarOptions
 * @property {string} fieldsHtml - Inner HTML for filter fields
 * @property {string} [extraClass] - Additional CSS classes on the outer card
 */

/**
 * Renders a sticky filter bar card with flex layout fields.
 * @param {FilterBarOptions} options
 * @returns {string}
 */
export function renderFilterBar(options) {
  const { fieldsHtml, extraClass = '' } = options;
  const classes = ['card', 'ptw-card', 'mb-3', 'ptw-filter-bar', extraClass].filter(Boolean).join(' ');

  return `
    <div class="${classes}">
      <div class="card-body">
        <div class="ptw-filter-bar__fields">
          ${fieldsHtml}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a single filter field wrapper.
 * @param {Object} options
 * @param {string} options.label
 * @param {string} options.html - Input/select markup
 * @param {string} [options.id] - For attribute on label
 * @param {'default'|'wide'|'search'} [options.width]
 * @returns {string}
 */
export function renderFilterField(options) {
  const { label, html, id = '', width = 'default' } = options;
  const widthClass = width === 'search'
    ? 'ptw-filter-bar__field--search'
    : width === 'wide'
      ? 'ptw-filter-bar__field--wide'
      : '';

  const forAttr = id ? ` for="${id}"` : '';

  return `
    <div class="ptw-filter-bar__field ${widthClass}">
      <label class="form-label"${forAttr}>${label}</label>
      ${html}
    </div>
  `;
}
