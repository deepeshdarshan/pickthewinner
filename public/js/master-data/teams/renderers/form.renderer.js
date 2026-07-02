/**
 * @fileoverview Team form renderer.
 * @module master-data/teams/renderers/form.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { renderIconInputField } from '../../../shared/form/icon-input.component.js';
import { renderFlagSelect } from '../../shared/flag-select.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import {
  TEAM_ROUTES,
  createDefaultTeamFields,
} from '../team.constants.js';

/**
 * @typedef {import('../team.service.js').Team} Team
 */

/**
 * @param {Partial<Team>|null} [team]
 * @param {{ isCreate?: boolean }} [options]
 * @returns {string}
 */
export function renderTeamFormPage(team = null, options = {}) {
  const { isCreate = false } = options;
  const defaults = createDefaultTeamFields();
  const data = team ?? {};
  const title = isCreate ? 'Add Team' : 'Edit Team';

  return `
    <div class="ptw-team-form-page ptw-page-content">
      ${renderPageHeader({
    title,
    subtitle: isCreate ? 'Create a team for use in matches' : escapeHtml(data.name ?? ''),
    actionsHtml: `
          <a class="btn btn-outline-light w-100 w-md-auto" href="${TEAM_ROUTES.ADMIN_LIST}" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Teams
          </a>
        `,
  })}
      <form id="ptw-team-form" class="ptw-team-form" novalidate aria-label="${escapeHtml(title)}">
        <div class="card ptw-card">
          <div class="card-body ptw-team-form__grid">
            ${renderIconInputField({
    id: 'ptw-team-name',
    name: 'name',
    label: 'Team Name',
    icon: 'bi-people',
    value: data.name ?? '',
    required: true,
    errorId: 'ptw-team-name-error',
  })}
            ${renderIconInputField({
    id: 'ptw-team-shortName',
    name: 'shortName',
    label: 'Short Name',
    icon: 'bi-type',
    value: data.shortName ?? defaults.shortName,
    errorId: 'ptw-team-shortName-error',
  })}
            ${renderFlagSelect({
    id: 'ptw-team-flagUrl',
    name: 'flagUrl',
    label: 'Flag',
    value: data.flagUrl ?? defaults.flagUrl,
    errorId: 'ptw-team-flagUrl-error',
  })}
            <div class="ptw-team-form__field ptw-team-form__field--switch">
              <div class="form-check form-switch ptw-form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="ptw-team-active" name="active" ${data.active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="ptw-team-active">Active</label>
              </div>
            </div>
          </div>
        </div>
        <div class="ptw-team-form__actions d-flex flex-wrap gap-2 mt-3">
          <button type="submit" class="btn btn-ptw-primary">${isCreate ? 'Create Team' : 'Save Changes'}</button>
          ${isCreate ? '' : `<button type="button" class="btn btn-outline-danger" data-ptw-team-delete>Delete Team</button>`}
        </div>
      </form>
    </div>
  `;
}

/**
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readTeamForm(form) {
  const activeInput = form.querySelector('#ptw-team-active');

  return {
    name: form.elements.namedItem('name')?.value ?? '',
    shortName: form.elements.namedItem('shortName')?.value ?? '',
    flagUrl: form.elements.namedItem('flagUrl')?.value ?? '',
    active: activeInput instanceof HTMLInputElement ? activeInput.checked : true,
  };
}
