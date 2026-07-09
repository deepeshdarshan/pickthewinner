/**
 * @fileoverview Terms & Conditions modal for the landing page.
 * @module components/terms-and-conditions-modal.component
 */

import { appSettings } from '../config/app.config.js';
import {
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_SUMMARY_HEADING,
  TERMS_SUMMARY_POINTS,
} from '../legal/terms-and-conditions.constants.js';
import { showModal } from './modal-wrapper.component.js';
import { escapeHtml } from '../utils/html.util.js';

/** @type {string} */
const MODAL_ID = 'ptw-terms-modal';

/**
 * Renders the terms summary view HTML.
 * @returns {string}
 */
function renderTermsSummaryHtml() {
  const bulletsHtml = TERMS_SUMMARY_POINTS.map((item) => `<li>${escapeHtml(item)}</li>`).join('');

  return `
    <div class="ptw-terms-modal__body">
      <h3 class="ptw-terms-modal__summary-heading">${escapeHtml(TERMS_SUMMARY_HEADING)}</h3>
      <ul class="ptw-terms-modal__summary-list">${bulletsHtml}</ul>
      <a href="#" class="ptw-terms-link" data-ptw-action="show-full-terms" role="button">Read Full Terms &amp; Conditions</a>
    </div>
  `;
}

/**
 * Renders the full terms modal body HTML.
 * @returns {string}
 */
function renderFullTermsHtml() {
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
    <a href="#" class="ptw-terms-link ptw-terms-modal__nav-link" data-ptw-action="show-terms-summary" role="button">← Back to summary</a>
    <div class="ptw-terms-modal__body">
      <p class="ptw-terms-modal__intro">${escapeHtml(TERMS_INTRO)}</p>
      ${sectionsHtml}
    </div>
  `;
}

/**
 * @param {HTMLElement} modalEl
 * @param {string} html
 * @returns {void}
 */
function setModalBodyHtml(modalEl, html) {
  const bodyEl = modalEl.querySelector('.modal-body');

  if (!bodyEl) {
    return;
  }

  bodyEl.innerHTML = html;
  bodyEl.scrollTop = 0;
}

/**
 * @param {HTMLElement} modalEl
 * @returns {void}
 */
function bindTermsModalEvents(modalEl) {
  if (modalEl.dataset.ptwTermsBound === 'true') {
    return;
  }

  modalEl.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const showFullTrigger = target.closest('[data-ptw-action="show-full-terms"]');

    if (showFullTrigger) {
      event.preventDefault();
      setModalBodyHtml(modalEl, renderFullTermsHtml());
      return;
    }

    const showSummaryTrigger = target.closest('[data-ptw-action="show-terms-summary"]');

    if (showSummaryTrigger) {
      event.preventDefault();
      setModalBodyHtml(modalEl, renderTermsSummaryHtml());
    }
  });

  modalEl.dataset.ptwTermsBound = 'true';
}

/**
 * Opens the Terms & Conditions modal.
 * @returns {import('bootstrap').Modal}
 */
export function showTermsAndConditionsModal() {
  const modal = showModal({
    id: MODAL_ID,
    title: 'PickTheWinner – Terms & Conditions',
    bodyHtml: renderTermsSummaryHtml(),
    footerHtml: '<button type="button" class="btn btn-ptw-primary" data-bs-dismiss="modal">Close</button>',
    sizeClass: 'modal-dialog-scrollable modal-fullscreen-sm-down modal-lg modal-dialog-centered',
  });

  const modalEl = document.getElementById(MODAL_ID);

  if (modalEl) {
    setModalBodyHtml(modalEl, renderTermsSummaryHtml());
    bindTermsModalEvents(modalEl);
  }

  return modal;
}
