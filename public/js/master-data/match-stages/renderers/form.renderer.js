/**
 * @fileoverview Match stage form renderer.
 * @module master-data/match-stages/renderers/form.renderer
 */

import { renderPageHeader } from '../../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../../components/admin-page-shell.component.js';
import { renderIconInputField } from '../../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../../utils/html.util.js';
import { MATCH_STAGE_ROUTES, createDefaultMatchStageFields } from '../match-stage.constants.js';

/**
 * @typedef {import('../match-stage.service.js').MatchStage} MatchStage
 */

/**
 * @param {Partial<MatchStage>|null} [stage]
 * @param {{ isCreate?: boolean }} [options]
 * @returns {string}
 */
export function renderMatchStageFormPage(stage = null, options = {}) {
  const { isCreate = false } = options;
  const defaults = createDefaultMatchStageFields();
  const data = stage ?? {};
  const title = isCreate ? 'Add Match Stage' : 'Edit Match Stage';

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
    title,
    subtitle: isCreate ? 'Add a new stage option for match creation' : escapeHtml(data.label ?? ''),
    actionsHtml: `
          <a class="btn btn-outline-light" href="${MATCH_STAGE_ROUTES.ADMIN_LIST}" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Match Stages
          </a>
        `,
  })}
      <form id="ptw-stage-form" class="ptw-stage-form" novalidate aria-label="${escapeHtml(title)}">
        <div class="card ptw-card mb-3">
          <div class="card-body">
            ${renderIconInputField({
    id: 'ptw-stage-label',
    name: 'label',
    label: 'Stage Label',
    icon: 'bi-tag',
    value: data.label ?? '',
    required: true,
    helpText: 'Displayed to admins and contestants. Example: Quarter Final',
    errorId: 'ptw-stage-label-error',
  })}
            ${renderIconInputField({
    id: 'ptw-stage-value',
    name: 'value',
    label: 'Stage Key',
    icon: 'bi-key',
    value: data.value ?? '',
    required: true,
    helpText: 'Lowercase letters, numbers, underscores only. Example: quarter_final',
    errorId: 'ptw-stage-value-error',
    ...(isCreate ? {} : { readOnly: true }),
  })}
            ${renderIconInputField({
    id: 'ptw-stage-sortOrder',
    name: 'sortOrder',
    label: 'Sort Order',
    icon: 'bi-sort-numeric-up',
    type: 'number',
    min: 0,
    step: 1,
    value: String(data.sortOrder ?? defaults.sortOrder),
    helpText: 'Lower numbers appear first in the dropdown.',
    errorId: 'ptw-stage-sortOrder-error',
  })}
            <div class="mb-0">
              <div class="form-check form-switch ptw-form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="ptw-stage-active" name="active" ${data.active !== false ? 'checked' : ''}>
                <label class="form-check-label" for="ptw-stage-active">Active (visible in match stage dropdown)</label>
              </div>
            </div>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2 mt-1">
          <button type="submit" class="btn btn-ptw-primary">${isCreate ? 'Create Stage' : 'Save Changes'}</button>
          ${isCreate ? '' : '<button type="button" class="btn btn-outline-danger" data-ptw-stage-delete>Delete Stage</button>'}
        </div>
      </form>
    </div>
  `;
}

/**
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readMatchStageForm(form) {
  const activeInput = form.querySelector('#ptw-stage-active');

  return {
    label: form.elements.namedItem('label')?.value ?? '',
    value: form.elements.namedItem('value')?.value ?? '',
    sortOrder: form.elements.namedItem('sortOrder')?.value ?? '10',
    active: activeInput instanceof HTMLInputElement ? activeInput.checked : true,
  };
}

