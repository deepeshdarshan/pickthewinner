/**
 * @fileoverview Contestant-facing prediction UI status helpers for match cards.
 * @module match/match-prediction-ui.util
 */

import { renderStatusBadge } from '../components/status-badge.component.js';
import { MATCH_COUNTDOWN_PHASE } from '../domain/match.domain.js';

/** @enum {string} */
export const CONTESTANT_PREDICTION_UI_STATUS = Object.freeze({
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  OPENS_SOON: 'opens_soon',
  LOCKED: 'locked',
});

/** @type {Readonly<Record<string, { label: string, variant: string, icon: string }>>} */
const BADGE_CONFIG = Object.freeze({
  [CONTESTANT_PREDICTION_UI_STATUS.PENDING]: {
    label: 'Prediction Pending',
    variant: 'warning',
    icon: 'bi-exclamation-circle',
  },
  [CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED]: {
    label: 'Prediction Submitted',
    variant: 'success',
    icon: 'bi-check-circle',
  },
  [CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON]: {
    label: 'Opens Soon',
    variant: 'info',
    icon: 'bi-clock',
  },
  [CONTESTANT_PREDICTION_UI_STATUS.LOCKED]: {
    label: 'Prediction Locked',
    variant: 'secondary',
    icon: 'bi-lock',
  },
});

/** @type {Readonly<Record<string, { label: string, icon: string }>>} */
const DISABLED_BUTTON_CONFIG = Object.freeze({
  [CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON]: {
    label: 'Predictions Open Soon',
    icon: 'bi-clock',
  },
  [CONTESTANT_PREDICTION_UI_STATUS.LOCKED]: {
    label: 'Prediction Locked',
    icon: 'bi-lock',
  },
});

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
export function isPredictionNotYetOpen(match) {
  return match.predictionStatus === 'Closed'
    || match.matchCountdown?.phase === MATCH_COUNTDOWN_PHASE.PRE_OPEN;
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @returns {string}
 */
export function getContestantPredictionUiStatus(match, prediction) {
  if (!prediction) {
    if (match.predictionStatus === 'Open') {
      return CONTESTANT_PREDICTION_UI_STATUS.PENDING;
    }

    return isPredictionNotYetOpen(match)
      ? CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON
      : CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

  if (prediction.locked) {
    return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

  if (match.predictionStatus === 'Open') {
    return CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED;
  }

  return isPredictionNotYetOpen(match)
    ? CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON
    : CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
}

/**
 * @param {string} status
 * @returns {string}
 */
export function renderContestantPredictionStatusBadge(status) {
  const config = BADGE_CONFIG[status] ?? BADGE_CONFIG[CONTESTANT_PREDICTION_UI_STATUS.PENDING];

  return renderStatusBadge({
    label: config.label,
    variant: config.variant,
    icon: config.icon,
  });
}

/**
 * @param {string} status
 * @param {string} [buttonClass]
 * @returns {string}
 */
export function renderContestantPredictionDisabledButton(status, buttonClass = 'btn btn-secondary w-100') {
  const config = DISABLED_BUTTON_CONFIG[status];

  if (!config) {
    return '';
  }

  return `
    <button type="button" class="${buttonClass}" disabled>
      <i class="bi ${config.icon} me-2" aria-hidden="true"></i>${config.label}
    </button>
  `;
}
