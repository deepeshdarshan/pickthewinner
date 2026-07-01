/**
 * @fileoverview Icon-adorned form field renderer — label, Bootstrap Icon, and control.
 * @module shared/form/icon-input.component
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {Object} IconFieldBaseOptions
 * @property {string} id
 * @property {string} name
 * @property {string} label
 * @property {string} icon Bootstrap icon class, e.g. `bi-person`
 * @property {boolean} [required=false]
 * @property {boolean} [requiredMarker=false]
 * @property {string} [errorId]
 * @property {string} [wrapperClass='mb-3']
 */

/**
 * @typedef {IconFieldBaseOptions & {
 *   type?: string,
 *   value?: string,
 *   placeholder?: string,
 *   autocomplete?: string,
 *   inputMode?: string,
 * }} IconInputFieldOptions
 */

/**
 * @typedef {IconFieldBaseOptions & {
 *   optionsHtml: string,
 *   disabled?: boolean,
 * }} IconSelectFieldOptions
 */

/**
 * @param {string} icon
 * @param {string} controlHtml
 * @returns {string}
 */
function renderIconInputShell(icon, controlHtml) {
  return `
    <div class="ptw-icon-input">
      <span class="ptw-icon-input__icon" aria-hidden="true">
        <i class="bi ${escapeHtml(icon)}" aria-hidden="true"></i>
      </span>
      <span class="ptw-icon-input__divider" aria-hidden="true"></span>
      ${controlHtml}
    </div>
  `;
}

/**
 * @param {IconFieldBaseOptions} options
 * @param {string} controlHtml
 * @returns {string}
 */
function renderIconFieldGroup(options, controlHtml) {
  const {
    id,
    label,
    required = false,
    requiredMarker = false,
    errorId,
    wrapperClass = 'mb-3',
  } = options;

  const requiredAttr = required ? 'required aria-required="true"' : '';
  const marker = requiredMarker
    ? ' <span class="text-danger">*</span>'
    : '';

  return `
    <div class="${escapeHtml(wrapperClass)}">
      <label for="${escapeHtml(id)}" class="form-label">${escapeHtml(label)}${marker}</label>
      ${controlHtml}
      ${errorId ? `<div class="invalid-feedback" id="${escapeHtml(errorId)}" role="alert"></div>` : ''}
    </div>
  `;
}

/**
 * Renders a text-like input with a leading Bootstrap Icon.
 * @param {IconInputFieldOptions} options
 * @returns {string}
 */
export function renderIconInputField(options) {
  const {
    id,
    name,
    icon,
    type = 'text',
    value = '',
    placeholder = '',
    autocomplete,
    inputMode,
    required = false,
    ...groupOptions
  } = options;

  const controlHtml = renderIconInputShell(icon, `
    <input
      type="${escapeHtml(type)}"
      class="form-control ptw-icon-input__control"
      id="${escapeHtml(id)}"
      name="${escapeHtml(name)}"
      value="${escapeHtml(value)}"
      placeholder="${escapeHtml(placeholder)}"
      ${required ? 'required aria-required="true"' : ''}
      ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ''}
      ${inputMode ? `inputmode="${escapeHtml(inputMode)}"` : ''}
    >
  `);

  return renderIconFieldGroup({ id, required, ...groupOptions }, controlHtml);
}

/**
 * Renders a select with a leading Bootstrap Icon.
 * @param {IconSelectFieldOptions} options
 * @returns {string}
 */
export function renderIconSelectField(options) {
  const {
    id,
    name,
    icon,
    optionsHtml,
    required = false,
    disabled = false,
    ...groupOptions
  } = options;

  const controlHtml = renderIconInputShell(icon, `
    <select
      class="form-select ptw-icon-input__control"
      id="${escapeHtml(id)}"
      name="${escapeHtml(name)}"
      ${required ? 'required aria-required="true"' : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
    >
      ${optionsHtml}
    </select>
  `);

  return renderIconFieldGroup({ id, required, ...groupOptions }, controlHtml);
}
