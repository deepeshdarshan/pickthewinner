/**
 * @fileoverview Venue list renderer.
 * @module master-data/venues/renderers/list.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { renderEmptyState } from '../../../components/empty-state.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { VENUE_MESSAGES, VENUE_ROUTES } from '../venue.constants.js';

/**
 * @typedef {import('../venue.service.js').Venue} Venue
 */

/**
 * @returns {string}
 */
export function renderVenueListLoading() {
  return `
    <div class="container ptw-page-content">
      <div class="card ptw-card">
        <div class="card-body ptw-placeholder-card" role="status" aria-live="polite">
          <div class="spinner-border text-primary" role="status" aria-label="${escapeHtml(VENUE_MESSAGES.LOADING)}">
            <span class="visually-hidden">${escapeHtml(VENUE_MESSAGES.LOADING)}</span>
          </div>
          <p class="mt-3 mb-0 ptw-text-muted">${escapeHtml(VENUE_MESSAGES.LOADING)}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Venue[]} venues
 * @returns {string}
 */
export function renderVenueListPage(venues) {
  const createButton = `
    <a class="btn btn-ptw-primary" href="${VENUE_ROUTES.ADMIN_LIST}?action=create" data-route>
      <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>Add Venue
    </a>
  `;

  const body = venues.length === 0
    ? renderEmptyState({
      title: 'No Venues',
      message: VENUE_MESSAGES.NO_VENUES,
      icon: 'bi-geo-alt',
      actionHtml: createButton,
    })
    : `
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0 ptw-table" aria-label="Venues">
          <thead>
            <tr>
              <th scope="col">Venue</th>
              <th scope="col">City</th>
              <th scope="col">Country</th>
              <th scope="col">Capacity</th>
              <th scope="col">Status</th>
              <th scope="col" class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${venues.map((venue) => renderVenueRow(venue)).join('')}
          </tbody>
        </table>
      </div>
    `;

  return `
    <div class="container-fluid ptw-page-content">
      ${renderPageHeader({
    title: 'Venues',
    subtitle: 'Manage venue master data for matches',
    actionsHtml: venues.length > 0 ? createButton : '',
  })}
      <div class="card ptw-card">
        <div class="card-body">${body}</div>
      </div>
    </div>
  `;
}

/**
 * @param {Venue} venue
 * @returns {string}
 */
function renderVenueRow(venue) {
  const editUrl = `${VENUE_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(venue.id)}`;

  return `
    <tr>
      <td class="fw-semibold">${escapeHtml(venue.name)}</td>
      <td>${escapeHtml(venue.city)}</td>
      <td>${escapeHtml(venue.country)}</td>
      <td>${venue.capacity ? escapeHtml(String(venue.capacity)) : '—'}</td>
      <td>
        <span class="badge ${venue.active ? 'bg-success' : 'bg-secondary'}">${venue.active ? 'Active' : 'Inactive'}</span>
      </td>
      <td class="text-end">
        <a class="btn btn-sm btn-outline-light" href="${editUrl}" data-route>Edit</a>
      </td>
    </tr>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function mountVenueListLoading(outlet) {
  outlet.innerHTML = renderVenueListLoading();
}

/**
 * @param {string} [message]
 * @returns {string}
 */
export function renderVenueNotFound(message = VENUE_MESSAGES.NOT_FOUND) {
  return `
    <div class="container ptw-page-content">
      ${renderEmptyState({ title: 'Venue', message, icon: 'bi-geo-alt' })}
    </div>
  `;
}
