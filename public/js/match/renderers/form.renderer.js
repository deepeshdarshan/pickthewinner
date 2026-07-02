/**
 * @fileoverview Match form renderer.
 * @module match/renderers/form.renderer
 */

import { renderPageHeader } from '../../components/page-header.component.js';
import { renderIconInputField, renderIconSelectField } from '../../shared/form/icon-input.component.js';
import { renderSearchableSelect } from '../../master-data/shared/searchable-select.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { MATCH_ROUTES, MATCH_ROUNDS } from '../match.constants.js';

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 * @typedef {import('../../master-data/teams/team.service.js').Team} Team
 * @typedef {import('../../master-data/venues/venue.service.js').Venue} Venue
 * @typedef {import('../../tournament/tournament.service.js').Tournament} Tournament
 */

/**
 * @param {{
 *   match?: Partial<EnrichedMatch>|null,
 *   tournaments: Tournament[],
 *   teams: Team[],
 *   venues: Venue[],
 *   inheritedConfig?: Record<string, unknown>|null,
 *   isCreate?: boolean,
 *   readOnly?: boolean,
 * }} options
 * @returns {string}
 */
export function renderMatchFormPage(options) {
  const {
    match = null,
    tournaments,
    teams,
    venues,
    inheritedConfig = null,
    isCreate = false,
    readOnly = false,
  } = options;

  const data = match ?? {};
  const title = isCreate ? 'Create Match' : (readOnly ? 'Match Details' : 'Edit Match');
  const kickoff = toDate(data.kickoffUtc);
  const kickoffDate = kickoff ? kickoff.toISOString().slice(0, 10) : '';
  const kickoffTime = kickoff ? kickoff.toTimeString().slice(0, 5) : '';

  const selectedTournament = tournaments.find((item) => item.id === data.tournamentId);
  const selectedHome = teams.find((item) => item.id === data.homeTeamId);
  const selectedAway = teams.find((item) => item.id === data.awayTeamId);
  const selectedVenue = venues.find((item) => item.id === data.venueId);

  return `
    <div class="ptw-match-form-page ptw-page-content">
      ${renderPageHeader({
    title,
    subtitle: isCreate ? 'Matches inherit tournament configuration automatically' : escapeHtml(selectedTournament?.name ?? ''),
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
            ${renderSearchableSelect({
    id: 'ptw-match-tournamentId',
    name: 'tournamentId',
    label: 'Tournament',
    icon: 'bi-trophy',
    required: true,
    readOnly,
    value: data.tournamentId ?? '',
    selectedLabel: selectedTournament?.name ?? '',
    options: tournaments.map((tournament) => ({
      value: tournament.id,
      label: tournament.name,
      sublabel: tournament.season,
      searchText: `${tournament.name} ${tournament.season}`,
    })),
  })}
            ${renderIconSelectField({
    id: 'ptw-match-round',
    name: 'round',
    label: 'Round',
    icon: 'bi-diagram-3',
    required: true,
    disabled: readOnly,
    optionsHtml: MATCH_ROUNDS.map((round) => {
      const selected = round.value === data.round ? ' selected' : '';
      return `<option value="${escapeHtml(round.value)}"${selected}>${escapeHtml(round.label)}</option>`;
    }).join(''),
    errorId: 'ptw-match-round-error',
  })}
            ${renderIconInputField({
    id: 'ptw-match-matchNumber',
    name: 'matchNumber',
    label: 'Match Number',
    icon: 'bi-hash',
    value: data.matchNumber ? String(data.matchNumber) : 'Auto',
    readOnly: true,
  })}
            ${renderSearchableSelect({
    id: 'ptw-match-homeTeamId',
    name: 'homeTeamId',
    label: 'Home Team',
    icon: 'bi-house',
    required: true,
    readOnly,
    value: data.homeTeamId ?? '',
    selectedLabel: selectedHome ? `${selectedHome.name} (${selectedHome.country})` : '',
    options: teams.map((team) => ({
      value: team.id,
      label: team.name,
      sublabel: team.country,
      imageUrl: team.flagUrl,
      searchText: `${team.name} ${team.country}`,
    })),
  })}
            ${renderSearchableSelect({
    id: 'ptw-match-awayTeamId',
    name: 'awayTeamId',
    label: 'Away Team',
    icon: 'bi-airplane',
    required: true,
    readOnly,
    value: data.awayTeamId ?? '',
    selectedLabel: selectedAway ? `${selectedAway.name} (${selectedAway.country})` : '',
    options: teams.map((team) => ({
      value: team.id,
      label: team.name,
      sublabel: team.country,
      imageUrl: team.flagUrl,
      searchText: `${team.name} ${team.country}`,
    })),
  })}
            ${renderSearchableSelect({
    id: 'ptw-match-venueId',
    name: 'venueId',
    label: 'Venue',
    icon: 'bi-geo-alt',
    required: true,
    readOnly,
    value: data.venueId ?? '',
    selectedLabel: selectedVenue ? `${selectedVenue.name}, ${selectedVenue.city}` : '',
    options: venues.map((venue) => ({
      value: venue.id,
      label: venue.name,
      sublabel: `${venue.city}, ${venue.country}`,
      searchText: `${venue.name} ${venue.city} ${venue.country}`,
    })),
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
    round: form.elements.namedItem('round')?.value ?? '',
    homeTeamId: form.elements.namedItem('homeTeamId')?.value ?? '',
    awayTeamId: form.elements.namedItem('awayTeamId')?.value ?? '',
    venueId: form.elements.namedItem('venueId')?.value ?? '',
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
