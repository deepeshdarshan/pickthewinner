/**
 * @fileoverview Terms & Conditions modal for the landing page.
 * @module components/terms-and-conditions-modal.component
 */

import { appSettings } from '../config/app.config.js';
import { TERMS_INTRO, TERMS_SECTIONS } from '../legal/terms-and-conditions.constants.js';
import { showModal } from './modal-wrapper.component.js';
import { escapeHtml } from '../utils/html.util.js';

/** @type {string} */
const MODAL_ID = 'ptw-terms-modal';

/**
 * Renders the terms modal body HTML.
 * @returns {string}
 */
function renderTermsBodyHtml() {
  const sectionsHtml = TERMS_SECTIONS.map((section) => {
    const paragraphsHtml = (section.paragraphs ?? [])
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('');

    const bulletsHtml = section.bullets?.length
      ? `<ul class="ptw-terms-modal__list">${section.bullets
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : '';

    const closingHtml = section.closingParagraph
      ? `<p>${escapeHtml(section.closingParagraph)}</p>`
      : '';

    const contactHtml =
      section.number === 14
        ? `<p class="ptw-terms-modal__contact">
            <i class="bi bi-telephone me-2" aria-hidden="true"></i>
            <span>Contact: <a href="tel:${escapeHtml(appSettings.supportContactPhone.replace(/\s/g, ''))}" class="ptw-link">${escapeHtml(appSettings.supportContactPhone)}</a></span>
          </p>`
        : '';

    return `
      <section class="ptw-terms-modal__section" aria-labelledby="ptw-terms-section-${section.number}">
        <h3 class="ptw-terms-modal__section-title" id="ptw-terms-section-${section.number}">
          ${section.number}. ${escapeHtml(section.title)}
        </h3>
        ${paragraphsHtml}
        ${bulletsHtml}
        ${closingHtml}
        ${contactHtml}
      </section>
    `;
  }).join('');

  return `
    <div class="ptw-terms-modal__body">
      <p class="ptw-terms-modal__intro">${escapeHtml(TERMS_INTRO)}</p>
      ${sectionsHtml}
    </div>
  `;
}

/**
 * Opens the Terms & Conditions modal.
 * @returns {import('bootstrap').Modal}
 */
export function showTermsAndConditionsModal() {
  return showModal({
    id: MODAL_ID,
    title: 'PickTheWinner – Terms & Conditions',
    bodyHtml: renderTermsBodyHtml(),
    footerHtml: '<button type="button" class="btn btn-ptw-primary" data-bs-dismiss="modal">Close</button>',
    sizeClass: 'modal-dialog-scrollable modal-fullscreen-sm-down modal-lg modal-dialog-centered',
  });
}
