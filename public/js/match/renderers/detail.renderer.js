/**
 * @fileoverview Match detail renderer — admin view with lifecycle actions.
 * @module match/renderers/detail.renderer
 */

import { renderMatchFormPage } from './form.renderer.js';
import { renderMatchStatusBadge } from './status-badge.renderer.js';
import { renderResultForm } from './result-form.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { MATCH_LIFECYCLE_ACTIONS, MATCH_STATUS, getRoundLabel } from '../match.constants.js';
import { MatchDomain } from '../../domain/match.domain.js';

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 * @typedef {import('../../tournament/tournament.service.js').Tournament} Tournament
 * @typedef {import('../../master-data/teams/team.service.js').Team} Team
 * @typedef {import('../../master-data/venues/venue.service.js').Venue} Venue
 */

/**
 * @param {EnrichedMatch} match
 * @param {{
 *   tournaments: Tournament[],
 *   teams: Team[],
 *   venues: Venue[],
 *   inheritedConfig?: Record<string, unknown>|null,
 * }} options
 * @returns {string}
 */
export function renderMatchDetailPage(match, options) {
  const formHtml = renderMatchFormPage({
    match,
    ...options,
    readOnly: !MatchDomain.canEditMatch(match.status),
    includePageWrapper: false,
  });

  return `
    <div class="container-fluid px-3 px-lg-4 ptw-match-form-page ptw-page-content">
      ${formHtml}
      <div class="ptw-match-detail-actions card ptw-card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="h5 mb-0">Match Status</h2>
        ${renderMatchStatusBadge(match.status)}
      </div>
      <div class="card-body d-flex flex-wrap gap-2">
        ${renderLifecycleButtons(match)}
      </div>
    </div>
      ${MatchDomain.canEnterResult(match.status) || match.status === MATCH_STATUS.RESULT_PUBLISHED
    ? renderResultForm(match, options.inheritedConfig ?? null)
    : ''}
    </div>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
function renderLifecycleButtons(match) {
  const buttons = [];

  if (match.status === MATCH_STATUS.DRAFT) {
    buttons.push(actionButton('Schedule', MATCH_LIFECYCLE_ACTIONS.SCHEDULE, 'btn-outline-light'));
  }

  if (match.status === MATCH_STATUS.SCHEDULED || match.status === MATCH_STATUS.DRAFT) {
    buttons.push(actionButton('Publish', MATCH_LIFECYCLE_ACTIONS.PUBLISH, 'btn-success'));
  }

  if (match.visible) {
    buttons.push(actionButton('Hide', MATCH_LIFECYCLE_ACTIONS.HIDE, 'btn-warning'));
  }

  if ([MATCH_STATUS.PUBLISHED, MATCH_STATUS.PREDICTION_LOCKED].includes(match.status)) {
    buttons.push(actionButton('Open Predictions', MATCH_LIFECYCLE_ACTIONS.OPEN_PREDICTIONS, 'btn-outline-success'));
  }

  if (match.status === MATCH_STATUS.PREDICTION_OPEN) {
    buttons.push(actionButton('Close Predictions', MATCH_LIFECYCLE_ACTIONS.CLOSE_PREDICTIONS, 'btn-outline-warning'));
    buttons.push(actionButton('Reopen Predictions', MATCH_LIFECYCLE_ACTIONS.REOPEN_PREDICTIONS, 'btn-outline-success'));
  }

  if ([MATCH_STATUS.PREDICTION_LOCKED, MATCH_STATUS.PREDICTION_OPEN, MATCH_STATUS.PUBLISHED].includes(match.status)) {
    buttons.push(actionButton('Go Live', MATCH_LIFECYCLE_ACTIONS.GO_LIVE, 'btn-danger'));
  }

  if (match.status === MATCH_STATUS.LIVE) {
    buttons.push(actionButton('Mark Completed', MATCH_LIFECYCLE_ACTIONS.COMPLETE, 'btn-primary'));
  }

  if (match.status !== MATCH_STATUS.ARCHIVED) {
    buttons.push(actionButton('Archive', MATCH_LIFECYCLE_ACTIONS.ARCHIVE, 'btn-outline-danger'));
  }

  return buttons.join('');
}

/**
 * @param {string} label
 * @param {string} action
 * @param {string} className
 * @returns {string}
 */
function actionButton(label, action, className) {
  return `<button type="button" class="btn ${className}" data-ptw-lifecycle="${escapeHtml(action)}">${escapeHtml(label)}</button>`;
}

/**
 * @param {EnrichedMatch} match
 * @returns {string}
 */
export function renderContestantMatchDetail(match) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const result = /** @type {Record<string, unknown>|null} */ (match.result);

  return `
    <div class="card ptw-card mb-3">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h2 class="h4 mb-1">${escapeHtml(home?.name ?? 'Home')} vs ${escapeHtml(away?.name ?? 'Away')}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(match.tournamentName ?? '')} · ${escapeHtml(getRoundLabel(match.round))}</p>
          </div>
          ${renderMatchStatusBadge(match.status)}
        </div>
        <p class="mb-1"><strong>Venue:</strong> ${escapeHtml(match.venue?.name ?? '—')}</p>
        <p class="mb-1"><strong>Kickoff:</strong> ${escapeHtml(formatKickoff(match.kickoffUtc))}</p>
        <p class="mb-0"><strong>Prediction:</strong> ${escapeHtml(match.predictionStatus ?? '—')}</p>
        ${result?.published ? renderPublishedResult(match, result) : ''}
      </div>
    </div>
  `;
}

/**
 * @param {EnrichedMatch} match
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
function renderPublishedResult(match, result) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const winnerId = String(result.winningTeamId ?? '');
  const winnerName = winnerId === match.homeTeamId
    ? home?.name
    : (winnerId === match.awayTeamId ? away?.name : '—');

  return `
    <hr>
    <h3 class="h6">Official Result</h3>
    <p class="mb-1">${escapeHtml(home?.name ?? 'Home')} ${escapeHtml(String(result.homeScore ?? ''))} – ${escapeHtml(String(result.awayScore ?? ''))} ${escapeHtml(away?.name ?? 'Away')}</p>
    <p class="mb-1"><strong>Winner:</strong> ${escapeHtml(winnerName ?? '—')}</p>
    <p class="mb-0"><strong>Resolution:</strong> ${escapeHtml(String(result.winnerResolution ?? '—'))}</p>
  `;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatKickoff(value) {
  if (!value) {
    return '—';
  }

  const date = value instanceof Date
    ? value
    : (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null);

  if (!date) {
    return '—';
  }

  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
}
