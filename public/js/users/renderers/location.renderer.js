/**
 * @fileoverview District and Pradeshika Sabha form field renderers.
 * @module users/renderers/location.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { renderIconSelectField } from '../../shared/form/icon-input.component.js';
import { DISTRICTS, DISTRICT_WISE_PS_MAP } from '../location.constants.js';

/**
 * Renders district select options.
 * @param {string} [selected]
 * @returns {string}
 */
export function renderDistrictOptions(selected = '') {
  const placeholder = '<option value="">Select District</option>';

  return placeholder + DISTRICTS.map((district) => `
    <option value="${escapeHtml(district)}"${district === selected ? ' selected' : ''}>
      ${escapeHtml(district)}
    </option>
  `).join('');
}

/**
 * Renders Pradeshika Sabha select options for a district.
 * @param {string} district
 * @param {string} [selected]
 * @returns {string}
 */
export function renderPradeshikaSabhaOptions(district = '', selected = '') {
  if (!district) {
    return '<option value="">Select district first</option>';
  }

  const psList = DISTRICT_WISE_PS_MAP[district] ?? [];
  const placeholder = '<option value="">Select Pradeshika Sabha</option>';

  return placeholder + psList.map((ps) => `
    <option value="${escapeHtml(ps)}"${ps === selected ? ' selected' : ''}>
      ${escapeHtml(ps)}
    </option>
  `).join('');
}

/**
 * Renders district and Pradeshika Sabha field group for complete-profile.
 * @returns {string}
 */
export function renderLocationFields() {
  return `
    ${renderIconSelectField({
      id: 'ptw-profile-district',
      name: 'district',
      label: 'District',
      icon: 'bi-geo-alt',
      optionsHtml: renderDistrictOptions(),
      required: true,
      requiredMarker: true,
      errorId: 'ptw-profile-district-error',
    })}
    ${renderIconSelectField({
      id: 'ptw-profile-pradeshika-sabha',
      name: 'pradeshikaSabha',
      label: 'Pradeshika Sabha',
      icon: 'bi-building',
      optionsHtml: renderPradeshikaSabhaOptions(),
      required: true,
      requiredMarker: true,
      disabled: true,
      errorId: 'ptw-profile-pradeshika-sabha-error',
    })}
  `;
}

/**
 * Wires district → Pradeshika Sabha cascading select behaviour.
 * @param {HTMLFormElement} form
 * @returns {void}
 */
export function bindDistrictPsCascade(form) {
  const districtSelect = form.querySelector('#ptw-profile-district');
  const psSelect = form.querySelector('#ptw-profile-pradeshika-sabha');

  if (!(districtSelect instanceof HTMLSelectElement)
    || !(psSelect instanceof HTMLSelectElement)) {
    return;
  }

  const syncPsOptions = () => {
    const district = districtSelect.value;
    const previousValue = psSelect.value;

    psSelect.innerHTML = renderPradeshikaSabhaOptions(district, previousValue);
    psSelect.disabled = !district;
    psSelect.setAttribute('aria-disabled', district ? 'false' : 'true');

    if (district && previousValue) {
      const validPs = DISTRICT_WISE_PS_MAP[district] ?? [];
      psSelect.value = validPs.includes(previousValue) ? previousValue : '';
    }
  };

  districtSelect.addEventListener('change', syncPsOptions);
}
