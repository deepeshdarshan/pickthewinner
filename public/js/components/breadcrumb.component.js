/**
 * @fileoverview Breadcrumb navigation component.
 * @module components/breadcrumb.component
 */

/**
 * @typedef {Object} BreadcrumbItem
 * @property {string} label
 * @property {string} [href]
 */

/**
 * Renders a breadcrumb trail.
 * @param {BreadcrumbItem[]} items
 * @returns {string}
 */
export function renderBreadcrumb(items) {
  if (!items.length) {
    return '';
  }

  const crumbs = items.map((item, index) => {
    const isLast = index === items.length - 1;

    if (isLast || !item.href) {
      return `
        <li class="breadcrumb-item active" aria-current="page">${item.label}</li>
      `;
    }

    return `
      <li class="breadcrumb-item">
        <a href="${item.href}" data-route>${item.label}</a>
      </li>
    `;
  }).join('');

  return `
    <nav aria-label="Breadcrumb">
      <ol class="breadcrumb ptw-breadcrumb mb-0">
        ${crumbs}
      </ol>
    </nav>
  `;
}

/**
 * Mounts breadcrumbs into a container element.
 * @param {HTMLElement} container
 * @param {BreadcrumbItem[]} items
 * @returns {void}
 */
export function mountBreadcrumb(container, items) {
  container.innerHTML = renderBreadcrumb(items);
}
