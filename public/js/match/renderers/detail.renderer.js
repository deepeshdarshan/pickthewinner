/**
 * @fileoverview Match detail renderer — admin view with lifecycle actions.
 * @module match/renderers/detail.renderer
 */

import { renderMatchFormPage } from './form.renderer.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../../components/admin-page-shell.component.js';
import { renderMatchStatusBadge } from './status-badge.renderer.js';
import { renderResultForm } from './result-form.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { renderTeamInlineHtml, renderTeamsMatchupHtml } from '../../master-data/teams/team-flag.util.js';
import { MATCH_LIFECYCLE_ACTIONS, MATCH_STATUS, getRoundLabel } from '../match.constants.js';
import { MatchDomain } from '../../domain/match.domain.js';
import { PredictionDomain } from '../../domain/prediction.domain.js';

/**
 * @typedef {import('../match.service.js').EnrichedMatch} EnrichedMatch
 * @typedef {import('../../tournament/tournament.service.js').Tournament} Tournament
 * @typedef {import('../../master-data/teams/team.service.js').Team} Team
 */

/**
 * @param {EnrichedMatch} match
 * @param {{
 *   tournaments: Tournament[],
 *   teams: Team[],
 *   inheritedConfig?: Record<string, unknown>|null,
 *   readOnly?: boolean,
 * }} options
 * @returns {string}
 */
export function renderMatchDetailPage(match, options) {
  const forceReadOnly = Boolean(options.readOnly);
  const formHtml = renderMatchFormPage({
    match,
    ...options,
    readOnly: forceReadOnly || !MatchDomain.canEditMatch(match.status),
    includePageWrapper: false,
  });

  const actionButtons = forceReadOnly
    ? `
      <button type="button" class="btn btn-danger" data-ptw-match-delete>
        Delete Permanently
      </button>
    `
    : renderLifecycleButtons(match);

  const overrideIndicator = renderOverrideIndicator(match);

  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${formHtml}
      ${overrideIndicator}
      <div class="ptw-match-detail-actions card ptw-card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <h2 class="h5 mb-0">Match Status</h2>
        ${renderMatchStatusBadge(match.status)}
      </div>
      <div class="card-body d-flex flex-wrap gap-2">
        ${actionButtons}
      </div>
    </div>
      ${!forceReadOnly && (MatchDomain.canEnterResult(match.status) || match.status === MATCH_STATUS.RESULT_PUBLISHED)
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
  const hasActiveOverride = match.predictionOverride?.isActive ?? false;

  if (match.status === MATCH_STATUS.DRAFT) {
    buttons.push(actionButton('Publish', MATCH_LIFECYCLE_ACTIONS.PUBLISH, 'btn-success'));
  }

  if (match.visible) {
    buttons.push(actionButton('Hide', MATCH_LIFECYCLE_ACTIONS.HIDE, 'btn-warning'));
  }

  // Only show OPEN_PREDICTIONS if in PUBLISHED or PREDICTION_LOCKED status
  // and not already manually opened
  if ([MATCH_STATUS.PUBLISHED, MATCH_STATUS.PREDICTION_LOCKED].includes(match.status)) {
    const hasActiveOpenOverride = hasActiveOverride &&
                                   match.predictionOverride?.status === MATCH_STATUS.PREDICTION_OPEN;
    if (!hasActiveOpenOverride) {
      buttons.push(actionButton('Open Predictions', MATCH_LIFECYCLE_ACTIONS.OPEN_PREDICTIONS, 'btn-outline-success'));
    }
  }

  // Only show CLOSE_PREDICTIONS if predictions are currently open
  if (match.status === MATCH_STATUS.PREDICTION_OPEN) {
    buttons.push(actionButton('Close Predictions', MATCH_LIFECYCLE_ACTIONS.CLOSE_PREDICTIONS, 'btn-outline-warning'));
  }

  // Show REOPEN_PREDICTIONS if in PREDICTION_LOCKED but remove if manually closed
  if (match.status === MATCH_STATUS.PREDICTION_LOCKED) {
    const hasActiveCloseOverride = hasActiveOverride &&
                                    match.predictionOverride?.status === MATCH_STATUS.PREDICTION_LOCKED;
    // Only allow reopening if not manually closed
    if (!hasActiveCloseOverride) {
      buttons.push(actionButton('Reopen Predictions', MATCH_LIFECYCLE_ACTIONS.REOPEN_PREDICTIONS, 'btn-outline-success'));
    }
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

  buttons.push(`
    <button type="button" class="btn btn-danger" data-ptw-match-delete>
      Delete Permanently
    </button>
  `);

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
function renderOverrideIndicator(match) {
  const override = match.predictionOverride;

  if (!override?.isActive) {
    return '';
  }

  const overrideStatusLabel = override.status === MATCH_STATUS.PREDICTION_OPEN
    ? 'Manually Opened'
    : 'Manually Closed';

  const timestamp = formatTimestamp(override.timestamp);

  return `
    <div class="alert alert-info mb-3" role="alert">
      <div class="d-flex align-items-center">
        <i class="bi bi-info-circle-fill me-2"></i>
        <div>
          <strong>Manual Override Active</strong>
          <p class="mb-0 small">
            Predictions ${overrideStatusLabel} by administrator ${timestamp ? `on ${timestamp}` : ''}. 
            Automatic scheduling is disabled for this match.
            ${override.reason ? `<br><em>${escapeHtml(override.reason)}</em>` : ''}
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatTimestamp(value) {
  if (!value) {
    return '';
  }

  const date = value instanceof Date
    ? value
    : (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : null);

  if (!date) {
    return '';
  }

  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
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
            <h2 class="h4 mb-1">${renderTeamsMatchupHtml(home, away)}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(match.tournamentName ?? '')} · ${escapeHtml(getRoundLabel(match.round))}</p>
          </div>
          ${renderMatchStatusBadge(match.status)}
        </div>
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
  const winnerName = PredictionDomain.resolveResultWinnerName(result, match);
  const winnerSide = PredictionDomain.resolveResultWinnerSide(result, match);
  const winnerTeam = winnerSide === 'HOME'
    ? home
    : (winnerSide === 'AWAY' ? away : null);

  return `
    <hr>
    <h3 class="h6">Official Result</h3>
    <p class="mb-1 d-flex align-items-center flex-wrap gap-2">
      ${renderTeamInlineHtml(home, { fallback: 'Home' })}
      <strong>${escapeHtml(String(result.homeScore ?? ''))}</strong>
      <span class="ptw-text-muted">–</span>
      <strong>${escapeHtml(String(result.awayScore ?? ''))}</strong>
      ${renderTeamInlineHtml(away, { fallback: 'Away' })}
    </p>
    <p class="mb-1 d-flex align-items-center gap-1 flex-wrap"><strong>Winner:</strong> ${winnerTeam ? renderTeamInlineHtml(winnerTeam, { fallback: winnerName ?? '—' }) : escapeHtml('—')}</p>
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
