/**
 * @fileoverview Base renderer utilities — DOM rendering helpers without business logic.
 * @module renderers/base.renderer
 */

/**
 * Clears and sets HTML content on a container element.
 * @param {HTMLElement} container
 * @param {string} html
 * @returns {void}
 */
export function renderHtml(container, html) {
  container.innerHTML = html;
}

/**
 * Creates an element from an HTML string.
 * @param {string} html
 * @returns {HTMLElement}
 */
export function createElementFromHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return /** @type {HTMLElement} */ (template.content.firstElementChild);
}
