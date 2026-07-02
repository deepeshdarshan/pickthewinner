/**
 * @fileoverview Match result form renderer.
 * @module match/renderers/result-form.renderer
 */

import { renderIconInputField, renderIconSelectField, renderIconTextareaField } from '../../shared/form/icon-input.component.js';
import { escapeHtml } from '../../utils/html.util.js';
import { WINNER_RESOLUTION } from '../../domain/match.domain.js';
import { MATCH_STATUS } from '../match.constants.js';

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 */

/**
 * @param {EnrichedMatch} match
 * @param {Record<string, unknown>|null} tournamentConfig
 * @returns {string}
 */
export function renderResultForm(match, tournamentConfig) {
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const requiresWinner = Boolean(tournamentConfig?.requiresWinner ?? true);
  const isRecalculate = match.scoringStatus === 'completed';
  const readOnly = match.status === MATCH_STATUS.RESULT_PUBLISHED && !isRecalculate;

  return `
    <div class="card ptw-card mb-3" id="ptw-match-result-panel">
      <div class="card-header"><h2 class="h5 mb-0">Official Match Result</h2></div>
      <div class="card-body">
        <form id="ptw-match-result-form" novalidate>
          <div class="row g-3">
            ${renderIconInputField({
    id: 'ptw-match-result-homeScore',
    name: 'homeScore',
    label: `${match.homeTeam?.name ?? 'Home'} Score`,
    icon: 'bi-hash',
    type: 'number',
    min: 0,
    value: result.homeScore ?? '',
    required: true,
    readOnly,
  })}
            ${renderIconInputField({
    id: 'ptw-match-result-awayScore',
    name: 'awayScore',
    label: `${match.awayTeam?.name ?? 'Away'} Score`,
    icon: 'bi-hash',
    type: 'number',
    min: 0,
    value: result.awayScore ?? '',
    required: true,
    readOnly,
  })}
            ${renderIconSelectField({
    id: 'ptw-match-result-winnerResolution',
    name: 'winnerResolution',
    label: 'Winner Resolution',
    icon: 'bi-trophy',
    required: true,
    disabled: readOnly,
    optionsHtml: [
      { value: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME, label: 'Normal Time + Extra Time' },
      { value: WINNER_RESOLUTION.PENALTIES, label: 'Penalties' },
    ].map((option) => {
      const selected = option.value === String(result.winnerResolution ?? WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME) ? ' selected' : '';
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join(''),
  })}
            ${requiresWinner ? renderIconSelectField({
    id: 'ptw-match-result-winningTeamId',
    name: 'winningTeamId',
    label: 'Winning Team',
    icon: 'bi-award',
    required: true,
    disabled: readOnly,
    optionsHtml: [
      { value: match.homeTeamId, label: match.homeTeam?.name ?? 'Home Team' },
      { value: match.awayTeamId, label: match.awayTeam?.name ?? 'Away Team' },
    ].map((option) => {
      const selected = option.value === String(result.winningTeamId ?? '') ? ' selected' : '';
      return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join(''),
  }) : ''}
            ${renderIconTextareaField({
    id: 'ptw-match-result-notes',
    name: 'notes',
    label: 'Result Notes',
    icon: 'bi-card-text',
    value: String(result.notes ?? ''),
    readOnly,
  })}
          </div>
          ${readOnly ? '' : `
            <div class="mt-3">
              <button type="submit" class="btn btn-ptw-primary" data-ptw-result-action="${isRecalculate ? 'recalculate' : 'publish'}">
                ${isRecalculate ? 'Recalculate Scores' : 'Publish Result'}
              </button>
            </div>
          `}
        </form>
        ${result.published ? `<p class="small ptw-text-muted mt-3 mb-0">Result published. Penalty shootout goals are never stored.</p>` : ''}
      </div>
    </div>
  `;
}

/**
 * @param {HTMLFormElement} form
 * @returns {Record<string, unknown>}
 */
export function readResultForm(form) {
  return {
    homeScore: Number(form.elements.namedItem('homeScore')?.value ?? 0),
    awayScore: Number(form.elements.namedItem('awayScore')?.value ?? 0),
    winnerResolution: form.elements.namedItem('winnerResolution')?.value ?? '',
    winningTeamId: form.elements.namedItem('winningTeamId')?.value ?? '',
    notes: form.elements.namedItem('notes')?.value ?? '',
  };
}
