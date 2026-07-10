/**
 * @fileoverview Contact action buttons — Call and WhatsApp.
 * @module components/contact-action-buttons.component
 */

import { escapeHtml } from '../utils/html.util.js';
import {
  formatPhoneForTel,
  formatPhoneForWhatsApp,
  hasCallablePhone,
} from '../utils/phone.util.js';

/**
 * @typedef {Object} ContactActionButtonsOptions
 * @property {string} [phone]
 * @property {string} [emptyMessage]
 * @property {boolean} [whatsappFirst]
 */

/**
 * Renders Call and WhatsApp action buttons for a phone number.
 * @param {ContactActionButtonsOptions} options
 * @returns {string}
 */
export function renderContactActionButtons(options = {}) {
  const { phone = '', emptyMessage = 'No phone number on file', whatsappFirst = false } = options;

  if (!hasCallablePhone(phone)) {
    return `
      <p class="ptw-text-muted small mb-0">
        <i class="bi bi-telephone-x me-1" aria-hidden="true"></i>${escapeHtml(emptyMessage)}
      </p>
    `;
  }

  const telHref = formatPhoneForTel(phone);
  const whatsappHref = formatPhoneForWhatsApp(phone);

  const callButton = `
    <a
      href="${escapeHtml(telHref ?? '')}"
      class="btn btn-ptw-primary flex-fill"
    >
      <i class="bi bi-telephone-fill me-2" aria-hidden="true"></i>Call
    </a>
  `;

  const whatsappButton = `
    <a
      href="${escapeHtml(whatsappHref ?? '')}"
      class="btn btn-success flex-fill"
      target="_blank"
      rel="noopener noreferrer"
    >
      <i class="bi bi-whatsapp me-2" aria-hidden="true"></i>WhatsApp
    </a>
  `;

  return `
    <div class="d-flex flex-row gap-2 ptw-contact-actions" role="group" aria-label="Contact actions">
      ${whatsappFirst ? `${whatsappButton}${callButton}` : `${callButton}${whatsappButton}`}
    </div>
  `;
}
