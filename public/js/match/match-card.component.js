/**
 * @fileoverview Match card component for contestant views.
 * @module match/match-card.component
 */

import { renderCountdown } from '../components/countdown.component.js';
import { renderStatusBadge } from '../components/status-badge.component.js';
import {
  renderTeamInlineHtml,
  renderTeamStackHtml,
  renderTeamsMatchupHtml,
} from '../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../utils/html.util.js';
import { formatDateTime } from '../utils/date.util.js';
import { PredictionDomain } from '../domain/prediction.domain.js';

/**
 * @typedef {Object} MatchCardOptions
 * @property {import('./match.service.js').EnrichedMatch} match
 * @property {boolean} [showPrediction]
 * @property {Record<string, unknown>|null} [prediction]
 * @property {boolean} [showResult]
 * @property {boolean} [showPoints]
 * @property {number} [pointsEarned] Fallback when prediction has no calculatedPoints
 */

/**
 * Renders a match card for contestants.
 * @param {MatchCardOptions} options
 * @returns {string}
 */
export function renderMatchCard(options) {
  const {
    match,
    showPrediction = false,
    prediction = null,
    showResult = false,
    showPoints = false,
    pointsEarned,
  } = options;

  const resolvedPointsEarned = Number(prediction?.calculatedPoints ?? pointsEarned ?? 0);

  const kickoff = match.kickoffUtc instanceof Date ? match.kickoffUtc : match.kickoffUtc?.toDate?.() ?? null;

  const predictionStatus = getPredictionStatus(match, prediction);
  const statusBadge = renderPredictionStatusBadge(predictionStatus);

  return `
    <div class="card ptw-card ptw-match-card mb-3">
      <div class="card-header d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-secondary me-2">${escapeHtml(match.round || 'TBD')}</span>
          ${statusBadge}
        </div>
        ${kickoff ? renderCountdown({ targetDate: kickoff.toISOString(), label: 'Time remaining' }) : ''}
      </div>
      <div class="card-body">
        <div class="row align-items-center g-3">
          <!-- Home Team -->
          <div class="col-5 text-center">
            ${renderTeamStackHtml(match.homeTeam, {
    fallback: 'TBD',
    extraHtml: showResult && match.result
      ? `<div class="h3 mb-0 mt-2 text-primary">${escapeHtml(String(match.result.homeScore ?? '-'))}</div>`
      : '',
  })}
          </div>
          
          <!-- VS -->
          <div class="col-2 text-center">
            <div class="ptw-text-muted">VS</div>
          </div>
          
          <!-- Away Team -->
          <div class="col-5 text-center">
            ${renderTeamStackHtml(match.awayTeam, {
    fallback: 'TBD',
    extraHtml: showResult && match.result
      ? `<div class="h3 mb-0 mt-2 text-primary">${escapeHtml(String(match.result.awayScore ?? '-'))}</div>`
      : '',
  })}
          </div>
        </div>
        
        <!-- Match Info -->
        <div class="mt-3 text-center">
          ${kickoff ? `<div class="ptw-text-muted mb-1"><i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(formatDateTime(kickoff))}</div>` : ''}
        </div>

        ${showResult && match.result?.published ? renderOfficialResultDisplay(match) : ''}
        
        <!-- Prediction Display -->
        ${showPrediction && prediction ? renderPredictionDisplay(prediction, match) : ''}
        
        <!-- Points Display -->
        ${showPoints && showResult ? renderPointsDisplay(resolvedPointsEarned, prediction, match) : ''}
        
        <!-- Action Buttons -->
        ${renderActionButtons(match, prediction, predictionStatus)}
      </div>
    </div>
  `;
}

/**
 * Gets prediction status for a match.
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @returns {string}
 */
function getPredictionStatus(match, prediction) {
  if (!prediction) {
    return match.predictionStatus === 'Open' ? 'pending' : 'locked';
  }

  if (prediction.locked) {
    return 'locked';
  }

  if (match.predictionStatus === 'Open') {
    return 'submitted';
  }

  return 'locked';
}

/**
 * Renders prediction status badge.
 * @param {string} status
 * @returns {string}
 */
function renderPredictionStatusBadge(status) {
  const statusConfig = {
    pending: { label: 'Prediction Pending', variant: 'warning', icon: 'bi-exclamation-circle' },
    submitted: { label: 'Prediction Submitted', variant: 'success', icon: 'bi-check-circle' },
    locked: { label: 'Prediction Locked', variant: 'secondary', icon: 'bi-lock' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return renderStatusBadge({
    label: config.label,
    variant: config.variant,
    icon: config.icon,
  });
}

/**
 * Renders prediction display.
 * @param {Record<string, unknown>} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderPredictionDisplay(prediction, match) {
  const homeScore = prediction.homeScore ?? '-';
  const awayScore = prediction.awayScore ?? '-';
  const predictedWinner = prediction.predictedWinner ?? prediction.penaltyWinner;
  const winnerTeam = predictedWinner === 'HOME'
    ? match.homeTeam
    : (predictedWinner === 'AWAY' ? match.awayTeam : null);

  return `
    <div class="mt-3 pt-3 border-top">
      <h6 class="mb-2">Your Prediction</h6>
      <div class="d-flex justify-content-center align-items-center gap-3">
        <div class="text-center">
          <div class="h4 mb-0 text-info">${escapeHtml(String(homeScore))}</div>
          <div class="d-flex justify-content-center mt-1">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}
          </div>
        </div>
        <div class="ptw-text-muted">-</div>
        <div class="text-center">
          <div class="h4 mb-0 text-info">${escapeHtml(String(awayScore))}</div>
          <div class="d-flex justify-content-center mt-1">
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}
          </div>
        </div>
      </div>
      ${winnerTeam ? `<div class="text-center mt-2"><small class="ptw-text-muted">Predicted Winner: <span class="text-warning">${renderTeamInlineHtml(winnerTeam, { fallback: 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm', strong: true })}</span></small></div>` : ''}
    </div>
  `;
}

/**
 * Renders points display.
 * @param {number} pointsEarned
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderOfficialResultDisplay(match) {
  const result = /** @type {Record<string, unknown>} */ (match.result);
  const homeScore = Number(result.homeScore ?? 0);
  const awayScore = Number(result.awayScore ?? 0);
  const winnerName = PredictionDomain.resolveResultWinnerName(result, match);

  if (homeScore !== awayScore || !winnerName) {
    return '';
  }

  const winnerSide = PredictionDomain.resolveResultWinnerSide(result, match);
  const winnerTeam = winnerSide === 'HOME'
    ? match.homeTeam
    : (winnerSide === 'AWAY' ? match.awayTeam : null);

  if (!winnerTeam) {
    return '';
  }

  return `
    <div class="mt-3 text-center">
      <small class="ptw-text-muted">Match Winner: <span class="text-warning">${renderTeamInlineHtml(winnerTeam, { fallback: winnerName ?? 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm', strong: true })}</span></small>
    </div>
  `;
}

/**
 * Renders points display.
 * @param {number} pointsEarned
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderPointsDisplay(pointsEarned, prediction, match) {
  if (!match.result?.published) {
    return '';
  }

  const result = /** @type {Record<string, unknown>} */ (match.result);
  const isCorrectWinner = PredictionDomain.isWinnerPredictionCorrect(prediction, result, match);
  const isExactScore = checkExactScore(prediction, match);
  const winnerName = PredictionDomain.resolveResultWinnerName(result, match);
  const isDrawResult = Number(result.homeScore ?? 0) === Number(result.awayScore ?? 0);
  const winnerSide = PredictionDomain.resolveResultWinnerSide(result, match);
  const winnerTeam = winnerSide === 'HOME'
    ? match.homeTeam
    : (winnerSide === 'AWAY' ? match.awayTeam : null);

  return `
    <div class="mt-3 pt-3 border-top">
      <h6 class="mb-2">Result</h6>
      <div class="d-flex justify-content-around text-center">
        <div>
          <div class="${isCorrectWinner ? 'text-success' : 'text-danger'}">
            <i class="bi ${isCorrectWinner ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i>
            Winner
          </div>
          ${isDrawResult && winnerTeam ? `<div class="d-flex justify-content-center mt-1">${renderTeamInlineHtml(winnerTeam, { fallback: winnerName ?? 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}</div>` : ''}
        </div>
        <div>
          <div class="${isExactScore ? 'text-success' : 'text-danger'}">
            <i class="bi ${isExactScore ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}" aria-hidden="true"></i>
            Exact Score
          </div>
        </div>
        <div>
          <div class="text-primary">
            <i class="bi bi-trophy-fill" aria-hidden="true"></i>
            ${pointsEarned} Points
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Checks if exact score prediction is correct.
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function checkExactScore(prediction, match) {
  if (!prediction || !match.result) {
    return false;
  }

  const predHome = Number(prediction.homeScore ?? 0);
  const predAway = Number(prediction.awayScore ?? 0);
  const actualHome = Number(match.result.homeScore ?? 0);
  const actualAway = Number(match.result.awayScore ?? 0);

  return predHome === actualHome && predAway === actualAway;
}

/**
 * Renders action buttons.
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {string} predictionStatus
 * @returns {string}
 */
function renderActionButtons(match, prediction, predictionStatus) {
  if (match.result?.published) {
    return `
      <div class="mt-3 pt-3 border-top">
        <a href="/matches?id=${encodeURIComponent(match.id)}" class="btn btn-outline-primary w-100" data-route>
          View Details
        </a>
      </div>
    `;
  }

  if (predictionStatus === 'locked') {
    return `
      <div class="mt-3 pt-3 border-top">
        <button class="btn btn-secondary w-100" disabled>
          <i class="bi bi-lock me-2" aria-hidden="true"></i>Prediction Locked
        </button>
      </div>
    `;
  }

  if (prediction && predictionStatus === 'submitted') {
    return `
      <div class="mt-3 pt-3 border-top">
        <button class="btn btn-primary w-100" data-action="edit-prediction" data-match-id="${escapeHtml(match.id)}">
          <i class="bi bi-pencil me-2" aria-hidden="true"></i>Edit Prediction
        </button>
      </div>
    `;
  }

  return `
    <div class="mt-3 pt-3 border-top">
      <button class="btn btn-ptw-primary w-100" data-action="make-prediction" data-match-id="${escapeHtml(match.id)}">
        <i class="bi bi-bullseye me-2" aria-hidden="true"></i>Make Prediction
      </button>
    </div>
  `;
}

/**
 * Renders a compact match card for lists.
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} [prediction]
 * @returns {string}
 */
export function renderCompactMatchCard(match, prediction = null) {
  const kickoff = match.kickoffUtc instanceof Date ? match.kickoffUtc : match.kickoffUtc?.toDate?.() ?? null;
  const predictionStatus = getPredictionStatus(match, prediction);

  return `
    <div class="card ptw-card mb-2">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              <span class="badge bg-secondary">${escapeHtml(match.round || 'TBD')}</span>
              ${renderPredictionStatusBadge(predictionStatus)}
            </div>
            <div class="mt-1">
              ${renderTeamsMatchupHtml(match.homeTeam, match.awayTeam, { homeFallback: 'TBD', awayFallback: 'TBD', strong: true })}
            </div>
            ${kickoff ? `<small class="ptw-text-muted">${escapeHtml(formatDateTime(kickoff))}</small>` : ''}
          </div>
          <div>
            <a href="/matches?id=${encodeURIComponent(match.id)}" class="btn btn-sm btn-outline-primary" data-route>
              View
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

