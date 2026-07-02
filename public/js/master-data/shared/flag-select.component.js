/**
 * @fileoverview Flag country select — searchable dropdown with flag-icons.
 * @module master-data/shared/flag-select.component
 */

import { escapeHtml } from '../../utils/html.util.js';
import { FLAG_COUNTRIES } from '../teams/flag-countries.constants.js';
import {
  buildFlagIconValue,
  getFlagDisplayLabel,
  parseFlagIconCode,
} from '../teams/team-flag.util.js';

/**
 * @typedef {Object} FlagSelectOptions
 * @property {string} id
 * @property {string} name
 * @property {string} label
 * @property {string} [icon]
 * @property {string} [placeholder]
 * @property {string} [value]
 * @property {boolean} [optional]
 * @property {boolean} [disabled]
 * @property {string} [errorId]
 */

/**
 * @param {FlagSelectOptions} config
 * @returns {string}
 */
export function renderFlagSelect(config) {
  const {
    id,
    name,
    label,
    icon = 'bi-flag',
    placeholder = 'Search country…',
    value = '',
    optional = true,
    disabled = false,
    errorId = `${id}-error`,
  } = config;

  const listId = `${id}-listbox`;
  const selectedLabel = getFlagDisplayLabel(value);
  const selectedCode = parseFlagIconCode(value);

  return `
    <div class="ptw-flag-select" data-ptw-flag-select>
      <label class="form-label" for="${escapeHtml(id)}-input">
        ${escapeHtml(label)}${optional ? ' <span class="text-muted fw-normal">(optional)</span>' : ' <span class="text-danger" aria-hidden="true">*</span>'}
      </label>
      <div class="input-group ptw-icon-input ptw-flag-select__input-group">
        <span class="input-group-text ptw-icon-input__icon ptw-flag-select__preview" aria-hidden="true">
          ${selectedCode
    ? `<span class="fi fi-${escapeHtml(selectedCode)}"></span>`
    : `<i class="bi ${escapeHtml(icon)}"></i>`}
        </span>
        <input
          type="text"
          class="form-control ptw-flag-select__input"
          id="${escapeHtml(id)}-input"
          placeholder="${escapeHtml(placeholder)}"
          value="${escapeHtml(selectedLabel)}"
          autocomplete="off"
          role="combobox"
          aria-expanded="false"
          aria-controls="${escapeHtml(listId)}"
          aria-autocomplete="list"
          ${disabled ? 'disabled' : ''}
          aria-describedby="${escapeHtml(errorId)}"
        >
        <input type="hidden" id="${escapeHtml(id)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}">
      </div>
      <div class="ptw-flag-select__dropdown list-group" id="${escapeHtml(listId)}" role="listbox" hidden>
        ${FLAG_COUNTRIES.map((country) => renderOption(id, country)).join('')}
      </div>
      <div class="invalid-feedback" id="${escapeHtml(errorId)}"></div>
    </div>
  `;
}

/**
 * @param {string} selectId
 * @param {{ code: string, name: string }} country
 * @returns {string}
 */
function renderOption(selectId, country) {
  const value = buildFlagIconValue(country.code);
  const searchText = `${country.name} ${country.code}`.toLowerCase();

  return `
    <button
      type="button"
      class="list-group-item list-group-item-action ptw-flag-select__option"
      role="option"
      data-value="${escapeHtml(value)}"
      data-label="${escapeHtml(country.name)}"
      data-country="${escapeHtml(country.name)}"
      data-code="${escapeHtml(country.code)}"
      data-search="${escapeHtml(searchText)}"
    >
      <span class="d-flex align-items-center gap-2">
        <span class="fi fi-${escapeHtml(country.code)} ptw-flag-select__option-flag" aria-hidden="true"></span>
        <span>${escapeHtml(country.name)}</span>
      </span>
    </button>
  `;
}

/**
 * @typedef {Object} FlagSelectBindOptions
 * @property {(countryName: string) => void} [onCountrySelect]
 */

/**
 * @param {HTMLElement} root
 * @param {FlagSelectBindOptions} [options]
 * @returns {void}
 */
export function bindFlagSelects(root, options = {}) {
  root.querySelectorAll('[data-ptw-flag-select]').forEach((container) => {
    if (!(container instanceof HTMLElement) || container.dataset.ptwFlagSelectBound === 'true') {
      return;
    }

    container.dataset.ptwFlagSelectBound = 'true';

    const input = container.querySelector('.ptw-flag-select__input');
    const hidden = container.querySelector('input[type="hidden"]');
    const dropdown = container.querySelector('.ptw-flag-select__dropdown');
    const preview = container.querySelector('.ptw-flag-select__preview');
    const optionButtons = container.querySelectorAll('.ptw-flag-select__option');

    if (!(input instanceof HTMLInputElement) || !(hidden instanceof HTMLInputElement) || !(dropdown instanceof HTMLElement)) {
      return;
    }

    const updatePreview = (code) => {
      if (!(preview instanceof HTMLElement)) {
        return;
      }

      preview.innerHTML = code
        ? `<span class="fi fi-${escapeHtml(code)}"></span>`
        : '<i class="bi bi-flag"></i>';
    };

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
      optionButtons.forEach((option) => {
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
      updatePreview('');
      filterOptions();
      showDropdown();
    });

    optionButtons.forEach((option) => {
      if (!(option instanceof HTMLElement)) {
        return;
      }

      option.addEventListener('click', () => {
        hidden.value = option.dataset.value ?? '';
        input.value = option.dataset.label ?? '';
        updatePreview(option.dataset.code ?? '');
        hideDropdown();
        hidden.dispatchEvent(new Event('change', { bubbles: true }));

        if (typeof options.onCountrySelect === 'function' && option.dataset.country) {
          options.onCountrySelect(option.dataset.country);
        }
      });
    });

    document.addEventListener('click', (event) => {
      if (!container.contains(/** @type {Node} */ (event.target))) {
        hideDropdown();
      }
    });
  });
}
