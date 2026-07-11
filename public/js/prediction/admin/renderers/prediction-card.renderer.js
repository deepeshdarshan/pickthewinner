/**
 * @fileoverview Admin prediction card renderer — matches prediction history card design.
 * @module prediction/admin/renderers/prediction-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, formatDateTime, toDate } from '../../../utils/date.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderTeamsMatchupHtml } from '../../../master-data/teams/team-flag.util.js';
import { PredictionDomain } from '../../../domain/prediction.domain.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';
import {
  resolveContestantDisplayName,
} from './prediction-display.renderer.js';

/** @type {string} */
export const ADMIN_PREDICTION_CARD_CLASS = 'ptw-admin-pred-mgmt-card';

/**
 * @typedef {'pending'|'correct'|'exact'|'incorrect'} OutcomeTone
 */

/**
 * @typedef {Object} OutcomeBadge
 * @property {OutcomeTone} tone
 * @property {string} label
 * @property {string} icon
 * @property {string} pointsLabel
 */

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictionCard(prediction) {
  const contestant = prediction.contestant ?? {};
  const match = prediction.match ?? {};
  const tournament = prediction.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const hasResult = Boolean(result.published);
  const contestantName = resolveContestantDisplayName(contestant);
  const outcome = resolveOutcomeBadge(prediction, hasResult);
  const kickoffHeader = formatKickoffHeader(match.kickoffUtc);
  const contextLabel = formatContextLabel(tournament, match);
  const predictedWinnerName = PredictionManagementDomain.resolvePredictedWinnerName(prediction, match) ?? '—';
  const winnerTone = resolveWinnerTone(prediction, hasResult);
  const exactScoreLabel = resolveExactScoreLabel(prediction, hasResult);
  const exactScoreTone = resolveExactScoreTone(prediction, hasResult);

  return `
    <article
      class="${ADMIN_PREDICTION_CARD_CLASS}${hasResult ? ` ${ADMIN_PREDICTION_CARD_CLASS}--scored` : ''}"
      data-prediction-id="${escapeHtml(prediction.id)}"
      tabindex="0"
      role="button"
      aria-label="View prediction by ${escapeHtml(contestantName)}"
    >
      <header class="${ADMIN_PREDICTION_CARD_CLASS}__header">
        <div class="${ADMIN_PREDICTION_CARD_CLASS}__meta">
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__date-icon" aria-hidden="true">
            <i class="bi bi-calendar3"></i>
          </div>
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__meta-text min-w-0">
            <p class="${ADMIN_PREDICTION_CARD_CLASS}__date mb-0">${escapeHtml(kickoffHeader)}</p>
            <p class="${ADMIN_PREDICTION_CARD_CLASS}__context mb-0">${escapeHtml(contextLabel)}</p>
          </div>
        </div>
      </header>

      <div class="${ADMIN_PREDICTION_CARD_CLASS}__body">
        <div class="${ADMIN_PREDICTION_CARD_CLASS}__contestant-row">
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__contestant min-w-0">
            ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 24 })}
            <span class="text-truncate">${escapeHtml(contestantName)}</span>
          </div>
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__status">
            <span class="${ADMIN_PREDICTION_CARD_CLASS}__badge ${ADMIN_PREDICTION_CARD_CLASS}__badge--${outcome.tone}">
              <i class="bi ${outcome.icon}" aria-hidden="true"></i>
              ${escapeHtml(outcome.label)}
            </span>
            <span class="${ADMIN_PREDICTION_CARD_CLASS}__points ${ADMIN_PREDICTION_CARD_CLASS}__points--${outcome.tone}">
              ${escapeHtml(outcome.pointsLabel)}
            </span>
          </div>
        </div>

        <div class="${ADMIN_PREDICTION_CARD_CLASS}__matchup-title">
          ${renderTeamsMatchupHtml(match.homeTeam, match.awayTeam, { strong: true })}
        </div>

        <div class="${ADMIN_PREDICTION_CARD_CLASS}__scores">
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__score-block">
            <p class="${ADMIN_PREDICTION_CARD_CLASS}__scores-label">Your Prediction</p>
            ${renderScorePill(
    Number(prediction.homeScore),
    Number(prediction.awayScore),
    resolvePredictedWinningSide(prediction),
  )}
          </div>
          <div class="${ADMIN_PREDICTION_CARD_CLASS}__score-block">
            <p class="${ADMIN_PREDICTION_CARD_CLASS}__scores-label">Actual Result</p>
            ${hasResult
    ? renderScorePill(
      Number(result.homeScore),
      Number(result.awayScore),
      'result',
    )
    : `<div class="${ADMIN_PREDICTION_CARD_CLASS}__score-pill ${ADMIN_PREDICTION_CARD_CLASS}__score-pill--pending">Pending</div>`}
          </div>
        </div>
      </div>

      <footer class="${ADMIN_PREDICTION_CARD_CLASS}__footer">
        <div class="${ADMIN_PREDICTION_CARD_CLASS}__footer-col">
          <i class="bi bi-trophy ${ADMIN_PREDICTION_CARD_CLASS}__footer-icon ${ADMIN_PREDICTION_CARD_CLASS}__footer-icon--gold" aria-hidden="true"></i>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-label">Winner</span>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-value ${ADMIN_PREDICTION_CARD_CLASS}__footer-value--${winnerTone}">
            ${escapeHtml(predictedWinnerName)}
          </span>
        </div>
        <div class="${ADMIN_PREDICTION_CARD_CLASS}__footer-col">
          <i class="bi bi-bullseye ${ADMIN_PREDICTION_CARD_CLASS}__footer-icon ${ADMIN_PREDICTION_CARD_CLASS}__footer-icon--${exactScoreTone}" aria-hidden="true"></i>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-label">Exact Score</span>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-value ${ADMIN_PREDICTION_CARD_CLASS}__footer-value--${exactScoreTone}">
            ${escapeHtml(exactScoreLabel)}
          </span>
        </div>
        <div class="${ADMIN_PREDICTION_CARD_CLASS}__footer-col">
          <i class="bi bi-clock ${ADMIN_PREDICTION_CARD_CLASS}__footer-icon" aria-hidden="true"></i>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-label">Submitted</span>
          <span class="${ADMIN_PREDICTION_CARD_CLASS}__footer-value">
            ${escapeHtml(formatSubmittedLabel(prediction.submittedAt))}
          </span>
        </div>
      </footer>
    </article>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @returns {string}
 */
export function renderPredictionCardList(predictions) {
  if (predictions.length === 0) {
    return '';
  }

  return `
    <div class="ptw-admin-pred-mgmt-card-list" aria-label="Prediction cards">
      ${predictions.map((prediction) => renderPredictionCard(prediction)).join('')}
    </div>
  `;
}

/**
 * @param {unknown} kickoffUtc
 * @returns {string}
 */
function formatKickoffHeader(kickoffUtc) {
  const kickoffDate = toDate(kickoffUtc);
  if (!kickoffDate) {
    return '—';
  }

  const dateLabel = formatDateDisplay(kickoffDate, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeLabel = formatDateTime(kickoffUtc)?.split(', ').slice(1).join(', ') ?? '';

  return timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel;
}

/**
 * @param {Record<string, unknown>} tournament
 * @param {Record<string, unknown>} match
 * @returns {string}
 */
function formatContextLabel(tournament, match) {
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');

  return stage ? `${tournamentName} • ${stage}` : tournamentName;
}

/**
 * @param {unknown} submittedAt
 * @returns {string}
 */
function formatSubmittedLabel(submittedAt) {
  const submittedDate = toDate(submittedAt);
  if (!submittedDate) {
    return '—';
  }

  const dateLabel = formatDateDisplay(submittedDate, {
    day: 'numeric',
    month: 'short',
  });
  const timeLabel = formatDateTime(submittedAt)?.split(', ').slice(1).join(', ') ?? '';

  return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {boolean} hasResult
 * @returns {OutcomeBadge}
 */
function resolveOutcomeBadge(prediction, hasResult) {
  const points = Number(prediction.calculatedPoints ?? 0);

  if (!hasResult) {
    return {
      tone: 'pending',
      label: 'Submitted',
      icon: 'bi-clock',
      pointsLabel: 'Pending',
    };
  }

  if (prediction.exactScoreCorrect) {
    return {
      tone: 'exact',
      label: 'Exact Score',
      icon: 'bi-bullseye',
      pointsLabel: points > 0 ? `+${points} pts` : '0 pts',
    };
  }

  if (prediction.winnerPredictionCorrect) {
    return {
      tone: 'correct',
      label: 'Correct',
      icon: 'bi-check-lg',
      pointsLabel: points > 0 ? `+${points} pts` : '0 pts',
    };
  }

  return {
    tone: 'incorrect',
    label: 'Incorrect',
    icon: 'bi-x-lg',
    pointsLabel: '0 pts',
  };
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {'home'|'away'|'draw'|null}
 */
function resolvePredictedWinningSide(prediction) {
  const homeScore = Number(prediction.homeScore);
  const awayScore = Number(prediction.awayScore);

  if (homeScore > awayScore) {
    return 'home';
  }

  if (awayScore > homeScore) {
    return 'away';
  }

  const penaltySide = PredictionDomain.resolvePredictedWinnerSide(prediction);
  if (penaltySide === 'home') {
    return 'home';
  }

  if (penaltySide === 'away') {
    return 'away';
  }

  return homeScore === awayScore ? 'draw' : null;
}

/**
 * @param {number} homeScore
 * @param {number} awayScore
 * @param {'home'|'away'|'draw'|'result'|null} winningSide
 * @returns {string}
 */
function renderScorePill(homeScore, awayScore, winningSide) {
  const homeClass = winningSide === 'home' || winningSide === 'result'
    ? `${ADMIN_PREDICTION_CARD_CLASS}__score-num--win`
    : winningSide === 'away'
      ? `${ADMIN_PREDICTION_CARD_CLASS}__score-num--lose`
      : '';
  const awayClass = winningSide === 'away' || winningSide === 'result'
    ? `${ADMIN_PREDICTION_CARD_CLASS}__score-num--win`
    : winningSide === 'home'
      ? `${ADMIN_PREDICTION_CARD_CLASS}__score-num--lose`
      : '';

  return `
    <div class="${ADMIN_PREDICTION_CARD_CLASS}__score-pill">
      <span class="${ADMIN_PREDICTION_CARD_CLASS}__score-num ${homeClass}">${escapeHtml(String(homeScore))}</span>
      <span class="${ADMIN_PREDICTION_CARD_CLASS}__score-sep" aria-hidden="true">-</span>
      <span class="${ADMIN_PREDICTION_CARD_CLASS}__score-num ${awayClass}">${escapeHtml(String(awayScore))}</span>
    </div>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {boolean} hasResult
 * @returns {'success'|'danger'|'default'}
 */
function resolveWinnerTone(prediction, hasResult) {
  if (!hasResult) {
    return 'default';
  }

  if (prediction.winnerPredictionCorrect === true) {
    return 'success';
  }

  if (prediction.winnerPredictionCorrect === false) {
    return 'danger';
  }

  return 'default';
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {boolean} hasResult
 * @returns {string}
 */
function resolveExactScoreLabel(prediction, hasResult) {
  if (!hasResult) {
    return 'Pending';
  }

  if (prediction.exactScoreCorrect === true) {
    return 'Yes';
  }

  if (prediction.exactScoreCorrect === false) {
    return 'No';
  }

  return '—';
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {boolean} hasResult
 * @returns {'success'|'danger'|'default'}
 */
function resolveExactScoreTone(prediction, hasResult) {
  if (!hasResult) {
    return 'default';
  }

  if (prediction.exactScoreCorrect === true) {
    return 'success';
  }

  if (prediction.exactScoreCorrect === false) {
    return 'danger';
  }

  return 'default';
}
