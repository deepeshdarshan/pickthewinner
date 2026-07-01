/**
 * @fileoverview Error dialog component using Bootstrap Modal.
 * @module components/error-dialog.component
 */

import { MESSAGES } from '../config/application.constants.js';

/** @type {import('bootstrap').Modal|null} */
let modalInstance = null;

/**
 * @typedef {Object} ErrorDialogOptions
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [closeLabel]
 */

/**
 * Ensures the error dialog markup exists.
 * @returns {HTMLElement}
 */
export function ensureErrorDialog() {
  let modal = document.getElementById('ptw-error-dialog');

  if (modal) {
    return modal;
  }

  modal = document.createElement('div');
  modal.id = 'ptw-error-dialog';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'ptw-error-dialog-title');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header border-0 pb-0">
          <h2 class="modal-title fs-5 text-danger" id="ptw-error-dialog-title">
            <i class="bi bi-exclamation-circle me-2" aria-hidden="true"></i>
            <span id="ptw-error-dialog-title-text"></span>
          </h2>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="ptw-error-dialog-body"></div>
        <div class="modal-footer border-0 pt-0">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="ptw-error-dialog-close"></button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

/**
 * Opens an error dialog.
 * @param {ErrorDialogOptions} [options]
 * @returns {Promise<void>}
 */
export function showErrorDialog(options = {}) {
  const modalElement = ensureErrorDialog();
  const titleEl = modalElement.querySelector('#ptw-error-dialog-title-text');
  const bodyEl = modalElement.querySelector('#ptw-error-dialog-body');
  const closeBtn = modalElement.querySelector('#ptw-error-dialog-close');

  if (!titleEl || !bodyEl || !closeBtn) {
    return Promise.resolve();
  }

  titleEl.textContent = options.title ?? 'Error';
  bodyEl.textContent = options.message ?? MESSAGES.GENERIC_ERROR;
  closeBtn.textContent = options.closeLabel ?? 'Close';

  if (!modalInstance) {
    modalInstance = new window.bootstrap.Modal(modalElement);
  }

  return new Promise((resolve) => {
    modalElement.addEventListener('hidden.bs.modal', () => resolve(), { once: true });
    modalInstance.show();
  });
}
