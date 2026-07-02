/**
 * @fileoverview Venue form renderer.
 * @module master-data/venues/renderers/form.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { renderIconInputField } from '../../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { VENUE_ROUTES, createDefaultVenueFields } from '../venue.constants.js';

/**
 * @typedef {import('../venue.service.js').Venue} Venue
 */

/**
 * @param {Partial<Venue>|null} [venue]
 * @param {{ isCreate?: boolean }} [options]
 * @returns {string}
 */
export function renderVenueFormPage(venue = null, options = {}) {
  const { isCreate = false } = options;
  const defaults = createDefaultVenueFields();
  const data = venue ?? {};
  const title = isCreate ? 'Add Venue' : 'Edit Venue';

  return `
    <div class="ptw-venue-form-page ptw-page-content">
      ${renderPageHeader({
    title,
    subtitle: isCreate ? 'Create a venue for use in matches' : escapeHtml(data.name ?? ''),
    actionsHtml: `
          <a class="btn btn-outline-light w-100 w-md-auto" href="${VENUE_ROUTES.ADMIN_LIST}" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Venues
          </a>
        `,
  })}
      <form id="ptw-venue-form" class="ptw-venue-form" novalidate aria-label="${escapeHtml(title)}">
        <div class="card ptw-card">
          <div class="card-body ptw-venue-form__grid">
            ${renderIconInputField({
    id: 'ptw-venue-name',
    name: 'name',
    label: 'Venue Name',
    icon: 'bi-geo-alt',
    value: data.name ?? '',
    required: true,
    errorId: 'ptw-venue-name-error',
  })}
            ${renderIconInputField({
    id: 'ptw-venue-city',
    name: 'city',
    label: 'City',
    icon: 'bi-building',
    value: data.city ?? defaults.city,
    required: true,
    errorId: 'ptw-venue-city-error',
  })}
            ${renderIconInputField({
    id: 'ptw-venue-country',
    name: 'country',
    label: 'Country',
    icon: 'bi-globe',
    value: data.country ?? defaults.country,
    required: true,
    errorId: 'ptw-venue-country-error',
  })}
            ${renderIconInputField({
    id: 'ptw-venue-capacity',
    name: 'capacity',
    label: 'Capacity',
    icon: 'bi-people',
    type: 'number',
    min: 1,
    value: data.capacity ?? '',
    errorId: 'ptw-venue-capacity-error',
  })}
            <div class="ptw-venue-form__field ptw-venue-form__field--switch">
              <div class="form-check form-switch ptw-form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="ptw-venue-active" name="active" ${data.active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="ptw-venue-active">Active</label>
              </div>
            </div>
          </div>
        </div>
        <div class="ptw-venue-form__actions d-flex flex-wrap gap-2 mt-3">
          <button type="submit" class="btn btn-ptw-primary">${isCreate ? 'Create Venue' : 'Save Changes'}</button>
          ${isCreate ? '' : `<button type="button" class="btn btn-outline-danger" data-ptw-venue-delete>Delete Venue</button>`}
        </div>
      </form>
    </div>
  `;
}

/**
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readVenueForm(form) {
  const activeInput = form.querySelector('#ptw-venue-active');

  return {
    name: form.elements.namedItem('name')?.value ?? '',
    city: form.elements.namedItem('city')?.value ?? '',
    country: form.elements.namedItem('country')?.value ?? '',
    capacity: form.elements.namedItem('capacity')?.value ?? '',
    active: activeInput instanceof HTMLInputElement ? activeInput.checked : true,
  };
}
