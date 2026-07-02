/**
 * @fileoverview Match form renderer.
 * @module match/renderers/form.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderIconInputField, renderIconSelectField } from '../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { MATCH_ROUTES } from '../match.constants.js';

/**
 * @param {string} placeholder
 * @param {Array<{ value: string, label: string }>} options
 * @param {string} [selectedValue]
 * @returns {string}
 */
function renderSelectOptionsHtml(placeholder, options, selectedValue = '') {
  const placeholderOption = `<option value="" disabled${selectedValue ? '' : ' selected'}>${escapeHtml(placeholder)}</option>`;
  const items = options.map((option) => {
    const selected = option.value === selectedValue ? ' selected' : '';
    return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
  }).join('');

  return `${placeholderOption}${items}`;
}

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 * @typedef {import('../../master-data/teams/team.service.js').Team} Team
 * @typedef {import('../../tournament/tournament.service.js').Tournament} Tournament
 */

/**
 * @param {{
 *   match?: Partial<EnrichedMatch>|null,
 *   tournaments: Tournament[],
 *   teams: Team[],
 *   inheritedConfig?: Record<string, unknown>|null,
 *   isCreate?: boolean,
 *   readOnly?: boolean,
 *   includePageWrapper?: boolean,
 * }} options
 * @returns {string}
 */
export function renderMatchFormPage(options) {
  const {
    match = null,
    tournaments,
    teams,
    inheritedConfig = null,
    isCreate = false,
    readOnly = false,
    includePageWrapper = true,
  } = options;

  const data = match ?? {};
  const title = isCreate ? 'Create Match' : (readOnly ? 'Match Details' : 'Edit Match');
  const kickoff = toDate(data.kickoffUtc);
  const kickoffDate = kickoff ? kickoff.toISOString().slice(0, 10) : '';
  const kickoffTime = kickoff ? kickoff.toTimeString().slice(0, 5) : '';

  const tournamentOptions = tournaments.map((tournament) => ({
    value: tournament.id,
    label: `${tournament.name} (${tournament.season})`,
  }));
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: `${team.name} (${team.country})`,
  }));

  const content = `
      ${renderPageHeader({
    title,
    subtitle: isCreate ? 'Matches inherit tournament configuration automatically' : escapeHtml(tournaments.find((item) => item.id === data.tournamentId)?.name ?? ''),
    actionsHtml: `
          <a class="btn btn-outline-light w-100 w-md-auto" href="${MATCH_ROUTES.ADMIN_LIST}" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Matches
          </a>
        `,
  })}
      <form id="ptw-match-form" class="ptw-match-form" novalidate aria-label="${escapeHtml(title)}">
        <div class="card ptw-card mb-3">
          <div class="card-header"><h2 class="h5 mb-0">Match Details</h2></div>
          <div class="card-body ptw-match-form__grid">
            ${renderIconSelectField({
    id: 'ptw-match-tournamentId',
    name: 'tournamentId',
    label: 'Tournament',
    icon: 'bi-trophy',
    required: true,
    disabled: readOnly,
    optionsHtml: renderSelectOptionsHtml('Select tournament…', tournamentOptions, data.tournamentId ?? ''),
    errorId: 'ptw-match-tournamentId-error',
  })}
            ${isCreate ? '' : renderIconInputField({
    id: 'ptw-match-matchNumber',
    name: 'matchNumber',
    label: 'Match Number',
    icon: 'bi-hash',
    value: data.matchNumber ? String(data.matchNumber) : '',
    readOnly: true,
    helpText: 'Assigned automatically when the match is created.',
  })}
            ${renderIconSelectField({
    id: 'ptw-match-homeTeamId',
    name: 'homeTeamId',
    label: 'Team 1',
    icon: 'bi-1-circle',
    required: true,
    disabled: readOnly,
    optionsHtml: renderSelectOptionsHtml('Select team 1…', teamOptions, data.homeTeamId ?? ''),
    errorId: 'ptw-match-homeTeamId-error',
  })}
            ${renderIconSelectField({
    id: 'ptw-match-awayTeamId',
    name: 'awayTeamId',
    label: 'Team 2',
    icon: 'bi-2-circle',
    required: true,
    disabled: readOnly,
    optionsHtml: renderSelectOptionsHtml('Select team 2…', teamOptions, data.awayTeamId ?? ''),
    errorId: 'ptw-match-awayTeamId-error',
  })}
            ${renderIconInputField({
    id: 'ptw-match-kickoffDate',
    name: 'kickoffDate',
    label: 'Match Date',
    icon: 'bi-calendar-event',
    type: 'date',
    value: kickoffDate,
    required: true,
    readOnly,
    errorId: 'ptw-match-kickoffUtc-error',
  })}
            ${renderIconInputField({
    id: 'ptw-match-kickoffTime',
    name: 'kickoffTime',
    label: 'Kickoff Time',
    icon: 'bi-clock',
    type: 'time',
    value: kickoffTime,
    required: true,
    readOnly,
  })}
          </div>
        </div>
        ${renderInheritedConfigPanel(inheritedConfig)}
        ${readOnly ? '' : `
          <div class="ptw-match-form__actions">
            <button type="submit" class="btn btn-ptw-primary btn-lg w-100">${isCreate ? 'Create Match' : 'Save Changes'}</button>
          </div>
        `}
      </form>
  `;

  if (!includePageWrapper) {
    return content;
  }

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${content}
    </div>
  `;
}

/**
 * @param {Record<string, unknown>|null} config
 * @returns {string}
 */
export function renderInheritedConfigPanel(config) {
  if (!config) {
    return `
      <div class="card ptw-card mb-3" id="ptw-match-inherited-config">
        <div class="card-header"><h2 class="h5 mb-0">Inherited Tournament Configuration</h2></div>
        <div class="card-body ptw-text-muted">Select a tournament to preview inherited settings.</div>
      </div>
    `;
  }

  const scoring = /** @type {Record<string, unknown>} */ (config.scoringConfiguration ?? {});

  return `
    <div class="card ptw-card mb-3" id="ptw-match-inherited-config">
      <div class="card-header"><h2 class="h5 mb-0">Inherited Tournament Configuration</h2></div>
      <div class="card-body">
        <dl class="row mb-0">
          <dt class="col-sm-4">Timezone</dt><dd class="col-sm-8">${escapeHtml(String(config.timezone ?? 'Asia/Kolkata'))}</dd>
          <dt class="col-sm-4">Prediction Lock</dt><dd class="col-sm-8">${escapeHtml(String(config.predictionLockMinutes ?? '—'))} minutes before kickoff</dd>
          <dt class="col-sm-4">Prediction Opens</dt><dd class="col-sm-8">${escapeHtml(String(config.predictionOpenHoursBeforeKickoff ?? '—'))} hours before kickoff</dd>
          <dt class="col-sm-4">Can End In Draw</dt><dd class="col-sm-8">${config.canEndInDraw ? 'Yes' : 'No'}</dd>
          <dt class="col-sm-4">Requires Winner</dt><dd class="col-sm-8">${config.requiresWinner ? 'Yes' : 'No'}</dd>
          <dt class="col-sm-4">Match Score Points</dt><dd class="col-sm-8">${escapeHtml(String(scoring.correctMatchScorePoints ?? '—'))}</dd>
          <dt class="col-sm-4">Penalty Winner Points</dt><dd class="col-sm-8">${escapeHtml(String(scoring.correctPenaltyWinnerPoints ?? '—'))}</dd>
        </dl>
      </div>
    </div>
  `;
}

/**
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readMatchForm(form) {
  const date = form.elements.namedItem('kickoffDate')?.value ?? '';
  const time = form.elements.namedItem('kickoffTime')?.value ?? '';
  let kickoffUtc = null;

  if (date && time) {
    kickoffUtc = new Date(`${date}T${time}:00+05:30`);
  }

  return {
    tournamentId: form.elements.namedItem('tournamentId')?.value ?? '',
    homeTeamId: form.elements.namedItem('homeTeamId')?.value ?? '',
    awayTeamId: form.elements.namedItem('awayTeamId')?.value ?? '',
    kickoffUtc,
  };
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
