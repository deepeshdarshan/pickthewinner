/**
 * @fileoverview Contestant-facing prediction UI status helpers for match cards.
 * @module match/match-prediction-ui.util
 */

import { renderStatusBadge } from '../components/status-badge.component.js';
import { MATCH_COUNTDOWN_PHASE } from '../domain/match.domain.js';
import { escapeHtml } from '../utils/html.util.js';

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
 * @typedef {Object} ContestantPredictionActionButtonsOptions
 * @property {string} matchId
 * @property {string} predictionStatus
 * @property {boolean} [resultPublished=false]
 * @property {boolean} [predictionExists=false]
 * @property {boolean} [predictionLocked=false]
 * @property {string} [disabledButtonClass='btn btn-secondary w-100']
 * @property {string} [enabledButtonClass='btn btn-ptw-primary w-100']
 * @property {string} [editButtonClass]
 * @property {string} [viewDetailsButtonClass]
 * @property {string} [predictLabel='Make Prediction']
 * @property {string} [wrapperClass='']
 * @property {boolean} [showEditButton=true]
 */

/**
 * @param {string} phase
 * @param {{ predictionExists?: boolean, predictionLocked?: boolean }} context
 * @returns {string}
 */
export function resolvePredictionUiStatusFromCountdownPhase(phase, context = {}) {
  const { predictionExists = false, predictionLocked = false } = context;

  if (predictionLocked) {
    return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

  if (phase === MATCH_COUNTDOWN_PHASE.PRE_OPEN) {
    return CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON;
  }

  if (phase === MATCH_COUNTDOWN_PHASE.OPEN) {
    return predictionExists
      ? CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED
      : CONTESTANT_PREDICTION_UI_STATUS.PENDING;
  }

  if (
    phase === MATCH_COUNTDOWN_PHASE.CLOSED
    || phase === MATCH_COUNTDOWN_PHASE.HIDDEN
  ) {
    return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

  return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
}

/**
 * @param {string} status
 * @param {{ syncable?: boolean }} [options]
 * @returns {string}
 */
export function renderContestantPredictionStatusBadge(status, options = {}) {
  const config = BADGE_CONFIG[status] ?? BADGE_CONFIG[CONTESTANT_PREDICTION_UI_STATUS.PENDING];
  const badgeHtml = renderStatusBadge({
    label: config.label,
    variant: config.variant,
    icon: config.icon,
  });

  if (!options.syncable) {
    return badgeHtml;
  }

  return `<span data-ptw-prediction-status-badge>${badgeHtml}</span>`;
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

/**
 * @param {ContestantPredictionActionButtonsOptions} options
 * @returns {string}
 */
function renderContestantPredictionActionButtonsInner(options) {
  const {
    matchId,
    predictionStatus,
    resultPublished = false,
    disabledButtonClass = 'btn btn-secondary w-100',
    enabledButtonClass = 'btn btn-ptw-primary w-100',
    editButtonClass = enabledButtonClass,
    viewDetailsButtonClass = enabledButtonClass,
    predictLabel = 'Make Prediction',
    showEditButton = true,
  } = options;

  if (resultPublished) {
    return `
      <a href="/matches?id=${encodeURIComponent(matchId)}" class="${viewDetailsButtonClass}" data-route>
        View Details
      </a>
    `;
  }

  if (
    predictionStatus === CONTESTANT_PREDICTION_UI_STATUS.LOCKED
    || predictionStatus === CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON
  ) {
    return renderContestantPredictionDisabledButton(predictionStatus, disabledButtonClass);
  }

  if (predictionStatus === CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED) {
    if (!showEditButton) {
      return '';
    }

    return `
      <a href="/predictions?action=edit&matchId=${encodeURIComponent(matchId)}" class="${editButtonClass}" data-route>
        <i class="bi bi-pencil me-2" aria-hidden="true"></i>Edit Prediction
      </a>
    `;
  }

  return `
    <a href="/predictions?action=create&matchId=${encodeURIComponent(matchId)}" class="${enabledButtonClass}" data-route>
      <i class="bi bi-bullseye me-2" aria-hidden="true"></i>${escapeHtml(predictLabel)}
    </a>
  `;
}

/**
 * Renders contestant prediction action buttons inside a syncable container.
 * @param {ContestantPredictionActionButtonsOptions} options
 * @returns {string}
 */
export function renderContestantPredictionActionButtons(options) {
  const {
    matchId,
    predictionStatus,
    resultPublished = false,
    predictionExists = false,
    predictionLocked = false,
    disabledButtonClass = 'btn btn-secondary w-100',
    enabledButtonClass = 'btn btn-ptw-primary w-100',
    editButtonClass = enabledButtonClass,
    viewDetailsButtonClass = enabledButtonClass,
    predictLabel = 'Make Prediction',
    wrapperClass = '',
    showEditButton = true,
  } = options;

  const innerHtml = renderContestantPredictionActionButtonsInner({
    matchId,
    predictionStatus,
    resultPublished,
    disabledButtonClass,
    enabledButtonClass,
    editButtonClass,
    viewDetailsButtonClass,
    predictLabel,
    showEditButton,
  });

  if (!innerHtml) {
    return '';
  }

  const wrapperClassAttr = wrapperClass ? ` class="${escapeHtml(wrapperClass)}"` : '';

  return `
    <div${wrapperClassAttr}
      data-ptw-prediction-actions
      data-match-id="${escapeHtml(matchId)}"
      data-prediction-exists="${predictionExists ? 'true' : 'false'}"
      data-prediction-locked="${predictionLocked ? 'true' : 'false'}"
      data-result-published="${resultPublished ? 'true' : 'false'}"
      data-disabled-button-class="${escapeHtml(disabledButtonClass)}"
      data-enabled-button-class="${escapeHtml(enabledButtonClass)}"
      data-edit-button-class="${escapeHtml(editButtonClass)}"
      data-view-details-button-class="${escapeHtml(viewDetailsButtonClass)}"
      data-predict-label="${escapeHtml(predictLabel)}"
      data-show-edit-button="${showEditButton ? 'true' : 'false'}"
    >
      ${innerHtml}
    </div>
  `;
}

/**
 * Re-syncs prediction action buttons and status badge when a lifecycle countdown phase changes.
 * @param {HTMLElement} countdownContainer
 * @param {string} phase
 * @returns {void}
 */
export function syncContestantPredictionUiFromCountdownPhase(countdownContainer, phase) {
  const card = countdownContainer.closest('.ptw-match-card, .ptw-featured-match');
  if (!card) {
    return;
  }

  const actionsEl = card.querySelector('[data-ptw-prediction-actions]');
  if (!actionsEl) {
    return;
  }

  const resultPublished = actionsEl.dataset.resultPublished === 'true';
  if (resultPublished) {
    return;
  }

  const predictionStatus = resolvePredictionUiStatusFromCountdownPhase(phase, {
    predictionExists: actionsEl.dataset.predictionExists === 'true',
    predictionLocked: actionsEl.dataset.predictionLocked === 'true',
  });

  actionsEl.innerHTML = renderContestantPredictionActionButtonsInner({
    matchId: actionsEl.dataset.matchId ?? '',
    predictionStatus,
    resultPublished,
    disabledButtonClass: actionsEl.dataset.disabledButtonClass ?? 'btn btn-secondary w-100',
    enabledButtonClass: actionsEl.dataset.enabledButtonClass ?? 'btn btn-ptw-primary w-100',
    editButtonClass: actionsEl.dataset.editButtonClass ?? actionsEl.dataset.enabledButtonClass ?? 'btn btn-primary w-100',
    viewDetailsButtonClass: actionsEl.dataset.viewDetailsButtonClass ?? actionsEl.dataset.enabledButtonClass ?? 'btn btn-ptw-primary w-100',
    predictLabel: actionsEl.dataset.predictLabel ?? 'Make Prediction',
    showEditButton: actionsEl.dataset.showEditButton !== 'false',
  });

  const badgeEl = card.querySelector('[data-ptw-prediction-status-badge]');
  if (badgeEl) {
    badgeEl.innerHTML = renderContestantPredictionStatusBadge(predictionStatus).trim();
  }
}
