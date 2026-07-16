/**
 * @fileoverview Match form renderer.
 * @module match/renderers/form.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderIconInputField, renderIconSelectField } from '../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateInput, parseAppDateTime, toDate } from '../../utils/date.util.js';
import { formatTimeInput } from '../../utils/time.util.js';
import { MATCH_ROUTES } from '../match.constants.js';
import { getMatchStageLabel } from '../../master-data/match-stages/match-stage.labels.js';
import { MATCH_STAGE_ROUTES } from '../../master-data/match-stages/match-stage.constants.js';
import { SCORING_POINTS_MAX, SCORING_POINTS_MIN } from '../../tournament/tournament.constants.js';

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
 *   stages?: Array<{ value: string, label: string }>,
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
    stages,
    inheritedConfig = null,
    isCreate = false,
    readOnly = false,
    includePageWrapper = true,
  } = options;

  const data = match ?? {};
  const title = isCreate ? 'Create Match' : (readOnly ? 'Match Details' : 'Edit Match');
  const kickoff = toDate(data.kickoffUtc);
  const kickoffDate = kickoff ? formatDateInput(kickoff) : '';
  const kickoffTime = kickoff ? formatTimeInput(kickoff) : '';

  const tournamentOptions = tournaments.map((tournament) => ({
    value: tournament.id,
    label: tournament.name,
  }));
  const teamOptions = teams.map((team) => ({
    value: team.id,
    label: team.name,
  }));
  const roundOptions = buildRoundOptions(stages ?? [], data);
  const customScoringConfig = /** @type {{ useCustomPoints?: boolean, correctMatchScorePoints?: number, correctPenaltyWinnerPoints?: number }|null} */ (
    data.customScoringConfig ?? null
  );

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
            ${roundOptions.length > 0 || readOnly
    ? renderIconSelectField({
      id: 'ptw-match-round',
      name: 'round',
      label: 'Match Stage',
      icon: 'bi-diagram-3',
      required: true,
      disabled: readOnly,
      optionsHtml: renderSelectOptionsHtml('Select match stage…', roundOptions, data.round ?? ''),
      errorId: 'ptw-match-round-error',
    })
    : renderMatchStageEmptyNotice()}
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
        ${renderMatchScoringConfigPanel({
    customScoringConfig,
    inheritedConfig,
    readOnly,
  })}
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
 * @param {Array<{ value: string, label: string }>} stages
 * @param {Partial<EnrichedMatch>} data
 * @returns {Array<{ value: string, label: string }>}
 */
function buildRoundOptions(stages, data) {
  const options = stages.map((stage) => ({
    value: stage.value,
    label: stage.label,
  }));

  if (data.round && !options.some((option) => option.value === data.round)) {
    options.push({
      value: data.round,
      label: data.stage || getMatchStageLabel(data.round),
    });
  }

  return options;
}

/**
 * @returns {string}
 */
function renderMatchStageEmptyNotice() {
  return `
    <div class="ptw-match-form__field ptw-match-form__field--full">
      <div class="alert alert-warning mb-0" role="status">
        <i class="bi bi-diagram-3 me-2" aria-hidden="true"></i>
        No match stages are configured yet.
        <a href="${MATCH_STAGE_ROUTES.ADMIN_LIST}" data-route class="alert-link">Add match stages</a>
        before creating a match.
      </div>
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
          <dt class="col-sm-4">Winner Selection for Draws</dt><dd class="col-sm-8">${config.requireWinnerSelectionForDrawPrediction ? 'Required' : 'Not required'}</dd>
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
    kickoffUtc = parseAppDateTime(date, time);
  }

  const roundField = form.elements.namedItem('round');
  const selectedRoundLabel = roundField && 'selectedOptions' in roundField
    ? (roundField.selectedOptions[0]?.textContent?.trim() ?? '')
    : '';

  const useCustomPoints = readCheckboxValue(form, 'useCustomPoints');
  const correctMatchScorePointsRaw = readFieldValue(form, 'correctMatchScorePoints');
  const correctPenaltyWinnerPointsRaw = readFieldValue(form, 'correctPenaltyWinnerPoints');

  return {
    tournamentId: form.elements.namedItem('tournamentId')?.value ?? '',
    round: form.elements.namedItem('round')?.value ?? '',
    stage: selectedRoundLabel,
    homeTeamId: form.elements.namedItem('homeTeamId')?.value ?? '',
    awayTeamId: form.elements.namedItem('awayTeamId')?.value ?? '',
    kickoffUtc,
    customScoringConfig: useCustomPoints
      ? {
        useCustomPoints: true,
        correctMatchScorePoints: correctMatchScorePointsRaw === '' ? '' : Number(correctMatchScorePointsRaw),
        correctPenaltyWinnerPoints: correctPenaltyWinnerPointsRaw === '' ? '' : Number(correctPenaltyWinnerPointsRaw),
      }
      : null,
  };
}

/**
 * @param {HTMLFormElement} form
 * @param {string} name
 * @returns {boolean}
 */
function readCheckboxValue(form, name) {
  const toggle = form.querySelector?.(`[name="${name}"]`) ?? form.elements.namedItem(name);

  if (typeof HTMLInputElement !== 'undefined' && toggle instanceof HTMLInputElement) {
    return toggle.checked;
  }

  if (toggle && typeof toggle === 'object' && 'checked' in toggle) {
    return Boolean(/** @type {{ checked?: boolean }} */ (toggle).checked);
  }

  return false;
}

/**
 * @param {HTMLFormElement} form
 * @param {string} name
 * @returns {string}
 */
function readFieldValue(form, name) {
  const field = form.querySelector?.(`[name="${name}"]`) ?? form.elements.namedItem(name);

  if (typeof HTMLInputElement !== 'undefined'
    && (field instanceof HTMLInputElement
      || field instanceof HTMLSelectElement
      || field instanceof HTMLTextAreaElement)) {
    return field.value;
  }

  if (field && typeof field === 'object' && 'value' in field) {
    return String(/** @type {{ value?: string }} */ (field).value ?? '');
  }

  return '';
}

/**
 * @param {{
 *   customScoringConfig: { useCustomPoints?: boolean, correctMatchScorePoints?: number, correctPenaltyWinnerPoints?: number }|null,
 *   inheritedConfig: Record<string, unknown>|null,
 *   readOnly: boolean,
 * }} options
 * @returns {string}
 */
function renderMatchScoringConfigPanel(options) {
  const { customScoringConfig, inheritedConfig, readOnly } = options;
  const useCustomPoints = Boolean(customScoringConfig?.useCustomPoints);
  const inheritedScoring = /** @type {Record<string, unknown>} */ (inheritedConfig?.scoringConfiguration ?? {});
  const matchScoreValue = customScoringConfig?.correctMatchScorePoints;
  const penaltyValue = customScoringConfig?.correctPenaltyWinnerPoints;

  return `
    <div class="card ptw-card mb-3" id="ptw-match-custom-scoring">
      <div class="card-header"><h2 class="h5 mb-0">Match Scoring Configuration</h2></div>
      <div class="card-body">
        <div class="form-check form-switch ptw-form-switch mb-3">
          <input
            class="form-check-input"
            type="checkbox"
            role="switch"
            id="ptw-match-useCustomPoints"
            name="useCustomPoints"
            data-ptw-custom-points-toggle
            ${useCustomPoints ? 'checked' : ''}
            ${readOnly ? 'disabled' : ''}
          >
          <label class="form-check-label" for="ptw-match-useCustomPoints">Use Custom Points for this Match</label>
        </div>

        <div class="small ptw-text-muted mb-3" data-ptw-custom-points-helper>
          ${useCustomPoints
    ? 'Custom points are enabled for this match and will override tournament defaults during scoring.'
    : `This match will use the tournament's default scoring configuration (${escapeHtml(String(inheritedScoring.correctMatchScorePoints ?? '—'))} match score points, ${escapeHtml(String(inheritedScoring.correctPenaltyWinnerPoints ?? '—'))} penalty winner points).`}
        </div>

        <div data-ptw-custom-points-fields ${useCustomPoints ? '' : 'hidden'}>
          ${renderIconInputField({
    id: 'ptw-match-correctMatchScorePoints',
    name: 'correctMatchScorePoints',
    label: 'Points for Correct Match Score (Normal Time + Extra Time)',
    icon: 'bi-bullseye',
    type: 'number',
    min: SCORING_POINTS_MIN,
    max: SCORING_POINTS_MAX,
    step: 1,
    value: typeof matchScoreValue === 'number' ? String(matchScoreValue) : '',
    required: useCustomPoints,
    disabled: readOnly || !useCustomPoints,
    errorId: 'ptw-match-correctMatchScorePoints-error',
  })}
          ${renderIconInputField({
    id: 'ptw-match-correctPenaltyWinnerPoints',
    name: 'correctPenaltyWinnerPoints',
    label: 'Points for Correct Penalty Shootout Winner',
    icon: 'bi-shield-check',
    type: 'number',
    min: SCORING_POINTS_MIN,
    max: SCORING_POINTS_MAX,
    step: 1,
    value: typeof penaltyValue === 'number' ? String(penaltyValue) : '',
    required: useCustomPoints,
    disabled: readOnly || !useCustomPoints,
    errorId: 'ptw-match-correctPenaltyWinnerPoints-error',
  })}
        </div>
      </div>
    </div>
  `;
}
