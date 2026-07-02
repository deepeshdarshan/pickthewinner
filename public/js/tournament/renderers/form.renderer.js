/**
 * @fileoverview Tournament form renderer for create and edit views.
 * @module tournament/renderers/form.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import {
  renderIconInputField,
  renderIconSelectField,
  renderIconTextareaField,
} from '../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import {
  SPORT_OPTIONS,
  TOURNAMENT_TYPE_OPTIONS,
  TOURNAMENT_TIMEZONE_LABEL,
  TOURNAMENT_ROUTES,
  SCORING_POINTS_MIN,
  SCORING_POINTS_MAX,
  createDefaultConfiguration,
  createDefaultTournamentFields,
} from '../tournament.constants.js';

/**
 * @typedef {import('../tournament.service.js').Tournament} Tournament
 */

/** @type {Readonly<Record<string, string>>} */
const TOURNAMENT_FIELD_ICONS = Object.freeze({
  name: 'bi-trophy',
  sport: 'bi-dribbble',
  tournamentType: 'bi-diagram-3',
  description: 'bi-card-text',
  logo: 'bi-image',
  correctMatchScorePoints: 'bi-hash',
  correctPenaltyWinnerPoints: 'bi-bullseye',
  timezone: 'bi-clock',
});

/**
 * @param {Partial<Tournament>|null} [tournament]
 * @param {{ readOnly?: boolean, isCreate?: boolean }} [options]
 * @returns {string}
 */
export function renderTournamentFormPage(tournament = null, options = {}) {
  const { readOnly = false, isCreate = false } = options;
  const defaults = createDefaultTournamentFields();
  const defaultConfig = createDefaultConfiguration();
  const data = tournament ?? {};
  const config = { ...defaultConfig, ...(data.configuration ?? {}) };
  const scoringConfig = /** @type {Record<string, unknown>} */ (
    config.scoringConfiguration ?? defaultConfig.scoringConfiguration ?? {}
  );

  const title = isCreate ? 'Create Tournament' : (readOnly ? 'Tournament Details' : 'Edit Tournament');
  const subtitle = isCreate
    ? 'Save as draft, then publish when ready for contestants to see it'
    : escapeHtml(data.name ?? '');

  const backUrl = TOURNAMENT_ROUTES.ADMIN_LIST;

  return `
    <div class="ptw-tournament-form-page ptw-page-content">
      ${renderPageHeader({
    title,
    subtitle,
    actionsHtml: `
          <a class="btn btn-outline-light w-100 w-md-auto" href="${backUrl}" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Tournaments
          </a>
        `,
  })}
      <form id="ptw-tournament-form" class="ptw-tournament-form" novalidate aria-label="${escapeHtml(title)}">
        <div class="ptw-tournament-form__sections">
          ${renderIdentitySection(data, defaults, readOnly)}
          ${renderBrandingSection(data, readOnly)}
          ${renderScoringConfigurationSection(scoringConfig, readOnly)}
          ${renderVisibilitySettingsSection(config, readOnly)}
          ${renderConfigurationSection(config, readOnly)}
        </div>
        ${readOnly ? '' : renderFormActions(isCreate)}
      </form>
    </div>
  `;
}

/**
 * @param {Partial<Tournament>} data
 * @param {Record<string, unknown>} defaults
 * @param {boolean} readOnly
 * @returns {string}
 */
function renderIdentitySection(data, defaults, readOnly) {
  return `
    <section class="card ptw-card ptw-tournament-form__section" aria-labelledby="ptw-tournament-identity-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-tournament-identity-heading">Tournament Identity</h2>
      </div>
      <div class="card-body ptw-tournament-form__grid">
        ${renderTextField('name', 'Tournament Name', data.name ?? '', { required: true, readOnly, fullWidth: true })}
        ${renderSelectField('sport', 'Sport', data.sport ?? defaults.sport, SPORT_OPTIONS, { readOnly, halfWidth: true })}
        ${renderSelectField('tournamentType', 'Tournament Type', data.tournamentType ?? defaults.tournamentType, TOURNAMENT_TYPE_OPTIONS, { readOnly, halfWidth: true })}
        ${renderTextareaField('description', 'Description', data.description ?? defaults.description, { readOnly })}
      </div>
    </section>
  `;
}

/**
 * @param {Partial<Tournament>} data
 * @param {boolean} readOnly
 * @returns {string}
 */
function renderBrandingSection(data, readOnly) {
  return `
    <section class="card ptw-card ptw-tournament-form__section" aria-labelledby="ptw-tournament-branding-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-tournament-branding-heading">Branding</h2>
      </div>
      <div class="card-body ptw-tournament-form__grid">
        ${renderTextField('logo', 'Logo URL', data.logo ?? '', {
    readOnly,
    type: 'url',
    fullWidth: true,
    optional: true,
    helpText: 'Optional. Provide a direct image URL for the tournament logo.',
  })}
      </div>
    </section>
  `;
}

/**
 * @param {Record<string, unknown>} scoringConfig
 * @param {boolean} readOnly
 * @returns {string}
 */
function renderScoringConfigurationSection(scoringConfig, readOnly) {
  return `
    <section class="card ptw-card ptw-tournament-form__section" aria-labelledby="ptw-tournament-scoring-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-tournament-scoring-heading">Scoring Configuration</h2>
      </div>
      <div class="card-body ptw-tournament-form__grid">
        <p class="ptw-tournament-form__field ptw-tournament-form__field--full form-text mb-0">
          Configure how many points contestants receive for correct predictions.
        </p>
        ${renderTextField(
    'correctMatchScorePoints',
    'Points for Correct Match Score (Normal Time + Extra Time)',
    scoringConfig.correctMatchScorePoints ?? '',
    {
      required: true,
      readOnly,
      type: 'number',
      fullWidth: true,
      min: SCORING_POINTS_MIN,
      max: SCORING_POINTS_MAX,
      step: 1,
      helpText: 'Award these points when the contestant correctly predicts the final match score after normal time and extra time. Penalty shootout goals are not included in this score.',
    },
  )}
        ${renderTextField(
    'correctPenaltyWinnerPoints',
    'Points for Correct Penalty Shootout Winner',
    scoringConfig.correctPenaltyWinnerPoints ?? '',
    {
      required: true,
      readOnly,
      type: 'number',
      fullWidth: true,
      min: SCORING_POINTS_MIN,
      max: SCORING_POINTS_MAX,
      step: 1,
      helpText: 'Award these points when the contestant correctly predicts the winner of the penalty shootout. This field only applies to knockout matches that proceed to penalties.',
    },
  )}
      </div>
    </section>
  `;
}

/**
 * @param {Record<string, unknown>} config
 * @param {boolean} readOnly
 * @returns {string}
 */
function renderVisibilitySettingsSection(config, readOnly) {
  const leaderboardVisible = Boolean(config.leaderboardVisible);

  return `
    <section class="card ptw-card ptw-tournament-form__section" aria-labelledby="ptw-tournament-visibility-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-tournament-visibility-heading">Visibility Settings</h2>
      </div>
      <div class="card-body ptw-tournament-form__grid">
        <div class="ptw-tournament-form__field ptw-tournament-form__field--full ptw-tournament-form__field--switch">
          ${renderSwitchField({
    id: 'ptw-tournament-leaderboardVisible',
    name: 'leaderboardVisible',
    label: 'Make Leaderboard Visible to Contestants',
    checked: leaderboardVisible,
    readOnly,
  })}
          <p class="form-text mb-0">
            When enabled, contestants can view the tournament leaderboard. When disabled, only administrators can access the leaderboard.
          </p>
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {Record<string, unknown>} config
 * @param {boolean} readOnly
 * @returns {string}
 */
function renderConfigurationSection(config, readOnly) {
  const canEndInDraw = Boolean(config.canEndInDraw);
  const requiresWinner = Boolean(config.requiresWinner ?? true);

  return `
    <section class="card ptw-card ptw-tournament-form__section" aria-labelledby="ptw-tournament-match-heading">
      <div class="card-header">
        <h2 class="h5 mb-0" id="ptw-tournament-match-heading">Match Behaviour</h2>
      </div>
      <div class="card-body ptw-tournament-form__grid">
        <div class="ptw-tournament-form__field ptw-tournament-form__field--full">
          ${renderIconInputField({
    id: 'ptw-tournament-timezone-display',
    name: 'timezone-display',
    label: 'Timezone',
    icon: TOURNAMENT_FIELD_ICONS.timezone,
    value: TOURNAMENT_TIMEZONE_LABEL,
    readOnly: true,
    wrapperClass: 'mb-0',
  })}
          <input type="hidden" name="timezone" value="Asia/Kolkata" />
        </div>
        <div class="ptw-tournament-form__field ptw-tournament-form__field--full ptw-tournament-form__field--switch">
          ${renderSwitchField({
    id: 'ptw-tournament-canEndInDraw',
    name: 'canEndInDraw',
    label: 'Matches can end in a draw (league)',
    checked: canEndInDraw,
    readOnly,
  })}
        </div>
        <div class="ptw-tournament-form__field ptw-tournament-form__field--full ptw-tournament-form__field--switch">
          ${renderSwitchField({
    id: 'ptw-tournament-requiresWinner',
    name: 'requiresWinner',
    label: 'Knockout matches require a winner',
    checked: requiresWinner,
    readOnly,
  })}
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {{ id: string, name: string, label: string, checked?: boolean, readOnly?: boolean }} options
 * @returns {string}
 */
function renderSwitchField(options) {
  const { id, name, label, checked = false, readOnly = false } = options;

  return `
    <div class="form-check form-switch ptw-form-switch">
      <input
        class="form-check-input"
        type="checkbox"
        id="${escapeHtml(id)}"
        name="${escapeHtml(name)}"
        ${checked ? 'checked' : ''}
        ${readOnly ? 'disabled' : ''}
      />
      <label class="form-check-label" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
    </div>
  `;
}

/**
 * @param {boolean} isCreate
 * @returns {string}
 */
function renderFormActions(isCreate) {
  return `
    <div class="ptw-tournament-form__actions">
      <button type="submit" class="btn btn-ptw-primary btn-lg w-100">
        ${isCreate ? 'Create Draft' : 'Save Changes'}
      </button>
    </div>
  `;
}

/**
 * @param {string} name
 * @returns {string}
 */
function fieldId(name) {
  return `ptw-tournament-${name}`;
}

/**
 * @param {string} name
 * @returns {string}
 */
function fieldErrorId(name) {
  return `${fieldId(name)}-error`;
}

/**
 * @param {string} name
 * @param {string} label
 * @param {unknown} value
 * @param {{ required?: boolean, readOnly?: boolean, type?: string, fullWidth?: boolean, halfWidth?: boolean, optional?: boolean, helpText?: string, min?: number, max?: number, step?: number, icon?: string }} [options]
 * @returns {string}
 */
function renderTextField(name, label, value, options = {}) {
  const {
    required = false,
    readOnly = false,
    type = 'text',
    fullWidth = false,
    halfWidth = false,
    optional = false,
    helpText = '',
    min,
    max,
    step,
    icon = TOURNAMENT_FIELD_ICONS[name] ?? 'bi-input-cursor-text',
  } = options;

  return renderIconInputField({
    id: fieldId(name),
    name,
    label,
    icon,
    type,
    value: String(value ?? ''),
    required,
    optional,
    readOnly,
    disabled: readOnly,
    min,
    max,
    step,
    helpText,
    helpId: helpText ? `${fieldId(name)}-help` : undefined,
    errorId: fieldErrorId(name),
    wrapperClass: resolveFieldClass({ fullWidth, halfWidth }),
  });
}

/**
 * @param {string} name
 * @param {string} label
 * @param {unknown} value
 * @param {{ readOnly?: boolean }} [options]
 * @returns {string}
 */
function renderTextareaField(name, label, value, options = {}) {
  const { readOnly = false } = options;

  return renderIconTextareaField({
    id: fieldId(name),
    name,
    label,
    icon: TOURNAMENT_FIELD_ICONS[name] ?? 'bi-card-text',
    value: String(value ?? ''),
    readOnly,
    disabled: readOnly,
    errorId: fieldErrorId(name),
    wrapperClass: 'ptw-tournament-form__field ptw-tournament-form__field--full',
  });
}

/**
 * @param {string} name
 * @param {string} label
 * @param {unknown} value
 * @param {readonly string[]} options
 * @param {{ readOnly?: boolean, halfWidth?: boolean }} [config]
 * @returns {string}
 */
function renderSelectField(name, label, value, options, config = {}) {
  const { readOnly = false, halfWidth = false } = config;
  const items = options.map((option) => {
    const selected = option === value ? ' selected' : '';
    return `<option value="${escapeHtml(option)}"${selected}>${escapeHtml(option)}</option>`;
  }).join('');

  return renderIconSelectField({
    id: fieldId(name),
    name,
    label,
    icon: TOURNAMENT_FIELD_ICONS[name] ?? 'bi-list-ul',
    optionsHtml: items,
    disabled: readOnly,
    errorId: fieldErrorId(name),
    wrapperClass: resolveFieldClass({ halfWidth }),
  });
}

/**
 * @param {{ fullWidth?: boolean, halfWidth?: boolean }} options
 * @returns {string}
 */
function resolveFieldClass(options) {
  if (options.fullWidth) {
    return 'ptw-tournament-form__field ptw-tournament-form__field--full';
  }

  if (options.halfWidth) {
    return 'ptw-tournament-form__field ptw-tournament-form__field--half';
  }

  return 'ptw-tournament-form__field';
}

/**
 * Reads tournament form values into a payload object.
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readTournamentForm(form) {
  const formData = new FormData(form);
  const matchScoreRaw = formData.get('correctMatchScorePoints');
  const penaltyWinnerRaw = formData.get('correctPenaltyWinnerPoints');

  return {
    name: formData.get('name'),
    description: formData.get('description'),
    sport: formData.get('sport'),
    tournamentType: formData.get('tournamentType'),
    logo: formData.get('logo'),
    configuration: {
      timezone: formData.get('timezone') || 'Asia/Kolkata',
      canEndInDraw: form.querySelector('[name="canEndInDraw"]') instanceof HTMLInputElement
        ? /** @type {HTMLInputElement} */ (form.querySelector('[name="canEndInDraw"]')).checked
        : false,
      requiresWinner: form.querySelector('[name="requiresWinner"]') instanceof HTMLInputElement
        ? /** @type {HTMLInputElement} */ (form.querySelector('[name="requiresWinner"]')).checked
        : true,
      leaderboardVisible: form.querySelector('[name="leaderboardVisible"]') instanceof HTMLInputElement
        ? /** @type {HTMLInputElement} */ (form.querySelector('[name="leaderboardVisible"]')).checked
        : false,
      winnerResolution: 'regulation',
      scoringConfiguration: {
        correctMatchScorePoints: matchScoreRaw === '' || matchScoreRaw === null
          ? null
          : Number(matchScoreRaw),
        correctPenaltyWinnerPoints: penaltyWinnerRaw === '' || penaltyWinnerRaw === null
          ? null
          : Number(penaltyWinnerRaw),
      },
    },
  };
}
