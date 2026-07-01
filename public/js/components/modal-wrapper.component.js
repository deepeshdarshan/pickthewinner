/**
 * @fileoverview Generic modal wrapper using Bootstrap Modal.
 * @module components/modal-wrapper.component
 */

/** @type {Map<string, import('bootstrap').Modal>} */
const modalInstances = new Map();

/**
 * @typedef {Object} ModalOptions
 * @property {string} id
 * @property {string} title
 * @property {string} bodyHtml
 * @property {string} [footerHtml]
 * @property {string} [sizeClass]
 */

/**
 * Renders modal markup.
 * @param {ModalOptions} options
 * @returns {string}
 */
export function renderModal(options) {
  const { id, title, bodyHtml, footerHtml = '', sizeClass = '' } = options;

  return `
    <div class="modal fade" id="${id}" tabindex="-1" aria-labelledby="${id}-title" aria-hidden="true">
      <div class="modal-dialog ${sizeClass}">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title fs-5" id="${id}-title">${title}</h2>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">${bodyHtml}</div>
          ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Shows a modal by id, creating it if necessary.
 * @param {ModalOptions} options
 * @returns {import('bootstrap').Modal}
 */
export function showModal(options) {
  let modalEl = document.getElementById(options.id);

  if (!modalEl) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderModal(options);
    modalEl = wrapper.firstElementChild;

    if (modalEl) {
      document.body.appendChild(modalEl);
    }
  }

  if (!modalEl) {
    throw new Error(`Failed to create modal: ${options.id}`);
  }

  let instance = modalInstances.get(options.id);

  if (!instance) {
    instance = new window.bootstrap.Modal(modalEl);
    modalInstances.set(options.id, instance);
  }

  instance.show();
  return instance;
}

/**
 * Hides a modal by id.
 * @param {string} id
 * @returns {void}
 */
export function hideModal(id) {
  const instance = modalInstances.get(id);
  instance?.hide();
}
