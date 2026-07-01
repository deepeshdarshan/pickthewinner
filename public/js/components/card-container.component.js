/**
 * @fileoverview Reusable card container component.
 * @module components/card-container.component
 */

/**
 * @typedef {Object} CardContainerOptions
 * @property {string} [title]
 * @property {string} [subtitle]
 * @property {string} bodyHtml
 * @property {string} [footerHtml]
 * @property {string} [headerActionsHtml]
 * @property {string} [className]
 */

/**
 * Renders a card container with optional header and footer.
 * @param {CardContainerOptions} options
 * @returns {string}
 */
export function renderCardContainer(options) {
  const {
    title = '',
    subtitle = '',
    bodyHtml,
    footerHtml = '',
    headerActionsHtml = '',
    className = '',
  } = options;

  const hasHeader = title || subtitle || headerActionsHtml;

  return `
    <div class="card ptw-card ${className}">
      ${hasHeader ? `
        <div class="card-header ptw-card__header d-flex justify-content-between align-items-center">
          <div>
            ${title ? `<h3 class="ptw-card__title mb-0">${title}</h3>` : ''}
            ${subtitle ? `<p class="ptw-card__subtitle mb-0">${subtitle}</p>` : ''}
          </div>
          ${headerActionsHtml}
        </div>
      ` : ''}
      <div class="card-body">${bodyHtml}</div>
      ${footerHtml ? `<div class="card-footer ptw-card__footer">${footerHtml}</div>` : ''}
    </div>
  `;
}

/**
 * Mounts a card container into a container element.
 * @param {HTMLElement} container
 * @param {CardContainerOptions} options
 * @returns {void}
 */
export function mountCardContainer(container, options) {
  container.innerHTML = renderCardContainer(options);
}
