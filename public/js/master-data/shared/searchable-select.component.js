/**
 * @fileoverview Searchable select component — Bootstrap combobox for master data pickers.
 * @module master-data/shared/searchable-select.component
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {Object} SearchableSelectOption
 * @property {string} value
 * @property {string} label
 * @property {string} [sublabel]
 * @property {string} [imageUrl]
 * @property {string} [searchText]
 */

/**
 * @typedef {Object} SearchableSelectOptions
 * @property {string} id
 * @property {string} name
 * @property {string} label
 * @property {string} [icon]
 * @property {string} [placeholder]
 * @property {string} [value]
 * @property {string} [selectedLabel]
 * @property {boolean} [required]
 * @property {boolean} [disabled]
 * @property {boolean} [readOnly]
 * @property {string} [errorId]
 * @property {SearchableSelectOption[]} options
 */

/**
 * @param {SearchableSelectOptions} config
 * @returns {string}
 */
export function renderSearchableSelect(config) {
  const {
    id,
    name,
    label,
    icon = 'bi-search',
    placeholder = 'Search…',
    value = '',
    selectedLabel = '',
    required = false,
    disabled = false,
    readOnly = false,
    errorId = `${id}-error`,
    options,
  } = config;

  const listId = `${id}-listbox`;
  const hiddenValue = value ? escapeHtml(value) : '';
  const displayValue = selectedLabel ? escapeHtml(selectedLabel) : '';

  return `
    <div class="ptw-searchable-select" data-ptw-searchable-select>
      <label class="form-label" for="${escapeHtml(id)}-input">${escapeHtml(label)}${required ? ' <span class="text-danger" aria-hidden="true">*</span>' : ''}</label>
      <div class="input-group ptw-icon-input">
        <span class="input-group-text ptw-icon-input__icon" aria-hidden="true"><i class="bi ${escapeHtml(icon)}"></i></span>
        <input
          type="text"
          class="form-control ptw-searchable-select__input"
          id="${escapeHtml(id)}-input"
          placeholder="${escapeHtml(placeholder)}"
          value="${displayValue}"
          autocomplete="off"
          role="combobox"
          aria-expanded="false"
          aria-controls="${escapeHtml(listId)}"
          aria-autocomplete="list"
          ${required ? 'aria-required="true"' : ''}
          ${disabled || readOnly ? 'disabled' : ''}
          aria-describedby="${escapeHtml(errorId)}"
        >
        <input type="hidden" id="${escapeHtml(id)}" name="${escapeHtml(name)}" value="${hiddenValue}">
      </div>
      <div class="ptw-searchable-select__dropdown list-group" id="${escapeHtml(listId)}" role="listbox" hidden>
        ${options.map((option) => renderOption(id, option)).join('')}
      </div>
      <div class="invalid-feedback" id="${escapeHtml(errorId)}"></div>
    </div>
  `;
}

/**
 * @param {string} selectId
 * @param {SearchableSelectOption} option
 * @returns {string}
 */
function renderOption(selectId, option) {
  const searchText = option.searchText ?? `${option.label} ${option.sublabel ?? ''}`.trim();
  const image = option.imageUrl
    ? `<img src="${escapeHtml(option.imageUrl)}" alt="" class="ptw-searchable-select__thumb me-2" width="24" height="18" loading="lazy">`
    : '';

  return `
    <button
      type="button"
      class="list-group-item list-group-item-action ptw-searchable-select__option"
      role="option"
      data-value="${escapeHtml(option.value)}"
      data-label="${escapeHtml(option.label)}"
      data-search="${escapeHtml(searchText.toLowerCase())}"
    >
      <span class="d-flex align-items-center">
        ${image}
        <span>
          <span class="d-block">${escapeHtml(option.label)}</span>
          ${option.sublabel ? `<small class="ptw-text-muted">${escapeHtml(option.sublabel)}</small>` : ''}
        </span>
      </span>
    </button>
  `;
}

/**
 * @param {HTMLElement} root
 * @returns {void}
 */
export function bindSearchableSelects(root) {
  root.querySelectorAll('[data-ptw-searchable-select]').forEach((container) => {
    if (!(container instanceof HTMLElement) || container.dataset.ptwSearchableBound === 'true') {
      return;
    }

    container.dataset.ptwSearchableBound = 'true';

    const input = container.querySelector('.ptw-searchable-select__input');
    const hidden = container.querySelector('input[type="hidden"]');
    const dropdown = container.querySelector('.ptw-searchable-select__dropdown');
    const options = container.querySelectorAll('.ptw-searchable-select__option');

    if (!(input instanceof HTMLInputElement) || !(hidden instanceof HTMLInputElement) || !(dropdown instanceof HTMLElement)) {
      return;
    }

    const showDropdown = () => {
      dropdown.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    };

    const hideDropdown = () => {
      dropdown.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    };

    const filterOptions = () => {
      const query = input.value.trim().toLowerCase();
      options.forEach((option) => {
        if (!(option instanceof HTMLElement)) {
          return;
        }

        const search = option.dataset.search ?? '';
        option.hidden = query.length > 0 && !search.includes(query);
      });
    };

    input.addEventListener('focus', () => {
      filterOptions();
      showDropdown();
    });

    input.addEventListener('input', () => {
      hidden.value = '';
      filterOptions();
      showDropdown();
    });

    options.forEach((option) => {
      if (!(option instanceof HTMLElement)) {
        return;
      }

      option.addEventListener('click', () => {
        hidden.value = option.dataset.value ?? '';
        input.value = option.dataset.label ?? '';
        hideDropdown();
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    document.addEventListener('click', (event) => {
      if (!container.contains(/** @type {Node} */ (event.target))) {
        hideDropdown();
      }
    });
  });
}

/**
 * @param {HTMLElement} root
 * @param {string} hiddenInputId
 * @param {string} label
 * @returns {void}
 */
export function setSearchableSelectValue(root, hiddenInputId, label) {
  const hidden = root.querySelector(`#${hiddenInputId}`);
  const input = root.querySelector(`#${hiddenInputId}-input`);

  if (hidden instanceof HTMLInputElement && input instanceof HTMLInputElement) {
    input.value = label;
  }
}
