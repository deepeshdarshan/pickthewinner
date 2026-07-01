/**
 * @fileoverview Shared form field renderers used across profile and settings pages.
 * @module users/renderers/shared-form.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { TIMEZONE_OPTIONS, DEFAULT_TIMEZONE } from '../user.constants.js';

/**
 * Renders timezone select options.
 * @param {string} [selected]
 * @returns {string}
 */
export function renderTimezoneOptions(selected = DEFAULT_TIMEZONE) {
  return TIMEZONE_OPTIONS.map((option) => `
    <option value="${escapeHtml(option.value)}"${option.value === selected ? ' selected' : ''}>
      ${escapeHtml(option.label)}
    </option>
  `).join('');
}

/**
 * Renders a timezone select field.
 * @param {Object} options
 * @param {string} options.id
 * @param {string} [options.name='timezone']
 * @param {string} [options.selected]
 * @param {boolean} [options.required=true]
 * @returns {string}
 */
export function renderTimezoneField({ id, name = 'timezone', selected, required = true }) {
  return `
    <select
      class="form-select"
      id="${escapeHtml(id)}"
      name="${escapeHtml(name)}"
      ${required ? 'required aria-required="true"' : ''}
    >
      ${renderTimezoneOptions(selected)}
    </select>
  `;
}

/**
 * Applies field validation errors to a form.
 * @param {HTMLElement} form
 * @param {Record<string, string>} errors
 * @returns {void}
 */
export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => {
    el.classList.remove('is-invalid');
  });

  form.querySelectorAll('.invalid-feedback').forEach((el) => {
    el.textContent = '';
  });

  Object.entries(errors).forEach(([field, message]) => {
    const fieldName = field.includes('.') ? field.split('.')[0] : field;
    const input = form.querySelector(`[name="${fieldName}"]`)
      ?? form.querySelector(`#ptw-${fieldName === 'phone' ? 'profile-phone' : fieldName}`)
      ?? form.querySelector(`#ptw-edit-${fieldName}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      const errorId = `${input.id}-error`;
      const errorEl = form.querySelector(`#${errorId}`);

      if (errorEl) {
        errorEl.textContent = message;
      }
    }
  });
}

/**
 * Reads notification preferences from a form.
 * @param {HTMLFormElement} form
 * @returns {{ email: boolean, browser: boolean }}
 */
export function readNotificationPreferences(form) {
  const emailInput = form.querySelector('[name="notifyEmail"]');
  const browserInput = form.querySelector('[name="notifyBrowser"]');

  return {
    email: emailInput instanceof HTMLInputElement ? emailInput.checked : false,
    browser: browserInput instanceof HTMLInputElement ? browserInput.checked : true,
  };
}
