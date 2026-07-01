/**
 * @fileoverview Confirmation modal component using Bootstrap Modal.
 * @module components/confirmation-modal.component
 */

import { MESSAGES } from '../config/application.constants.js';

/** @type {import('bootstrap').Modal|null} */
let modalInstance = null;

/**
 * @typedef {Object} ConfirmOptions
 * @property {string} [title]
 * @property {string} [message]
 * @property {string} [confirmLabel]
 * @property {string} [cancelLabel]
 * @property {string} [confirmClass]
 */

/**
 * Ensures the confirmation modal markup exists.
 * @returns {HTMLElement}
 */
export function ensureConfirmationModal() {
  let modal = document.getElementById('ptw-confirm-modal');

  if (modal) {
    return modal;
  }

  modal = document.createElement('div');
  modal.id = 'ptw-confirm-modal';
  modal.className = 'modal fade';
  modal.tabIndex = -1;
  modal.setAttribute('aria-labelledby', 'ptw-confirm-modal-title');
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <div class="modal-header">
          <h2 class="modal-title fs-5" id="ptw-confirm-modal-title"></h2>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" id="ptw-confirm-modal-body"></div>
        <div class="modal-footer">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" id="ptw-confirm-cancel"></button>
          <button type="button" class="btn btn-ptw-primary" id="ptw-confirm-accept"></button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  return modal;
}

/**
 * Opens a confirmation modal and resolves when the user chooses.
 * @param {ConfirmOptions} [options]
 * @returns {Promise<boolean>}
 */
export function showConfirmationModal(options = {}) {
  const modalElement = ensureConfirmationModal();
  const titleEl = modalElement.querySelector('#ptw-confirm-modal-title');
  const bodyEl = modalElement.querySelector('#ptw-confirm-modal-body');
  const cancelBtn = modalElement.querySelector('#ptw-confirm-cancel');
  const acceptBtn = modalElement.querySelector('#ptw-confirm-accept');

  if (!titleEl || !bodyEl || !cancelBtn || !acceptBtn) {
    return Promise.resolve(false);
  }

  titleEl.textContent = options.title ?? MESSAGES.CONFIRM_DEFAULT_TITLE;
  bodyEl.textContent = options.message ?? MESSAGES.CONFIRM_DEFAULT_MESSAGE;
  cancelBtn.textContent = options.cancelLabel ?? MESSAGES.CONFIRM_DEFAULT_CANCEL;
  acceptBtn.textContent = options.confirmLabel ?? MESSAGES.CONFIRM_DEFAULT_CONFIRM;
  acceptBtn.className = `btn ${options.confirmClass ?? 'btn-ptw-primary'}`;

  if (!modalInstance) {
    modalInstance = new window.bootstrap.Modal(modalElement);
  }

  return new Promise((resolve) => {
    /**
     * @param {boolean} confirmed
     * @returns {void}
     */
    const finish = (confirmed) => {
      acceptBtn.removeEventListener('click', onAccept);
      modalElement.removeEventListener('hidden.bs.modal', onDismiss);
      resolve(confirmed);
    };

    /** @returns {void} */
    const onAccept = () => {
      modalInstance?.hide();
      finish(true);
    };

    /** @returns {void} */
    const onDismiss = () => {
      finish(false);
    };

    acceptBtn.addEventListener('click', onAccept, { once: true });
    modalElement.addEventListener('hidden.bs.modal', onDismiss, { once: true });
    modalInstance.show();
  });
}
