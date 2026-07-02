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
 * @property {boolean} [optional=false]
 * @property {string} [errorId]
 * @property {string} [helpText]
 * @property {string} [helpId]
 * @property {string} [wrapperClass='mb-3']
 */

/**
 * @typedef {IconFieldBaseOptions & {
 *   type?: string,
 *   value?: string,
 *   placeholder?: string,
 *   autocomplete?: string,
 *   inputMode?: string,
 *   readOnly?: boolean,
 *   disabled?: boolean,
 *   min?: number,
 *   max?: number,
 *   step?: number,
 * }} IconInputFieldOptions
 */

/**
 * @typedef {IconFieldBaseOptions & {
 *   value?: string,
 *   rows?: number,
 *   readOnly?: boolean,
 *   disabled?: boolean,
 * }} IconTextareaFieldOptions
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
 * @param {{ multiline?: boolean }} [options]
 * @returns {string}
 */
function renderIconInputShell(icon, controlHtml, options = {}) {
  const shellClass = options.multiline ? 'ptw-icon-input ptw-icon-input--multiline' : 'ptw-icon-input';

  return `
    <div class="${shellClass}">
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
    optional = false,
    errorId,
    helpText = '',
    helpId,
    wrapperClass = 'mb-3',
  } = options;

  const marker = requiredMarker
    ? ' <span class="text-danger">*</span>'
    : '';
  const optionalSuffix = optional
    ? ' <span class="text-muted fw-normal">(optional)</span>'
    : '';
  const describedBy = [
    errorId,
    helpId || (helpText ? `${id}-help` : ''),
  ].filter(Boolean).join(' ');

  return `
    <div class="${escapeHtml(wrapperClass)}">
      <label for="${escapeHtml(id)}" class="form-label">${escapeHtml(label)}${marker}${optionalSuffix}</label>
      ${controlHtml}
      ${helpText ? `<div class="form-text" id="${escapeHtml(helpId ?? `${id}-help`)}">${escapeHtml(helpText)}</div>` : ''}
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
    readOnly = false,
    disabled = false,
    min,
    max,
    step,
    helpText,
    helpId,
    ...groupOptions
  } = options;

  const describedBy = [
    groupOptions.errorId,
    helpId || (helpText ? `${id}-help` : ''),
  ].filter(Boolean).join(' ');

  const controlHtml = renderIconInputShell(icon, `
    <input
      type="${escapeHtml(type)}"
      class="form-control ptw-icon-input__control"
      id="${escapeHtml(id)}"
      name="${escapeHtml(name)}"
      value="${escapeHtml(String(value))}"
      placeholder="${escapeHtml(placeholder)}"
      ${required ? 'required aria-required="true"' : ''}
      ${readOnly ? 'readonly aria-readonly="true"' : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
      ${autocomplete ? `autocomplete="${escapeHtml(autocomplete)}"` : ''}
      ${inputMode ? `inputmode="${escapeHtml(inputMode)}"` : ''}
      ${min !== undefined ? `min="${min}"` : ''}
      ${max !== undefined ? `max="${max}"` : ''}
      ${step !== undefined ? `step="${step}"` : ''}
      ${describedBy ? `aria-describedby="${escapeHtml(describedBy)}"` : ''}
    >
  `);

  return renderIconFieldGroup({
    id,
    required,
    helpText,
    helpId,
    ...groupOptions,
  }, controlHtml);
}

/**
 * Renders a textarea with a leading Bootstrap Icon.
 * @param {IconTextareaFieldOptions} options
 * @returns {string}
 */
export function renderIconTextareaField(options) {
  const {
    id,
    name,
    icon,
    value = '',
    rows = 3,
    required = false,
    readOnly = false,
    disabled = false,
    helpText,
    helpId,
    ...groupOptions
  } = options;

  const describedBy = [
    groupOptions.errorId,
    helpId || (helpText ? `${id}-help` : ''),
  ].filter(Boolean).join(' ');

  const controlHtml = renderIconInputShell(icon, `
    <textarea
      class="form-control ptw-icon-input__control"
      id="${escapeHtml(id)}"
      name="${escapeHtml(name)}"
      rows="${rows}"
      ${required ? 'required aria-required="true"' : ''}
      ${readOnly ? 'readonly aria-readonly="true"' : ''}
      ${disabled ? 'disabled aria-disabled="true"' : ''}
      ${describedBy ? `aria-describedby="${escapeHtml(describedBy)}"` : ''}
    >${escapeHtml(String(value))}</textarea>
  `, { multiline: true });

  return renderIconFieldGroup({
    id,
    required,
    helpText,
    helpId,
    ...groupOptions,
  }, controlHtml);
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
