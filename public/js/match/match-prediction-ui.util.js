/**
 * @fileoverview Contestant-facing prediction UI status helpers for match cards.
 * @module match/match-prediction-ui.util
 */

import { renderStatusBadge } from '../components/status-badge.component.js';
import { MATCH_COUNTDOWN_PHASE, MATCH_STATUS } from '../domain/match.domain.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction/history/prediction-history.constants.js';
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
  return match.matchCountdown?.phase === MATCH_COUNTDOWN_PHASE.PRE_OPEN;
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
export function isMatchResultPublished(match) {
  return Boolean(match.result?.published);
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
export function shouldShowContestantPredictionStatusBadge(match) {
  if (isMatchResultPublished(match)) {
    return false;
  }

  const status = String(match.status ?? '');
  return status !== MATCH_STATUS.COMPLETED && status !== MATCH_STATUS.RESULT_PUBLISHED;
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @returns {string}
 */
export function getContestantPredictionUiStatus(match, prediction) {
  if (isMatchResultPublished(match)) {
    return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

  const status = String(match.status ?? '');
  if (status === MATCH_STATUS.COMPLETED || status === MATCH_STATUS.RESULT_PUBLISHED) {
    return CONTESTANT_PREDICTION_UI_STATUS.LOCKED;
  }

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
 * @property {string} [predictionId]
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
 * @property {boolean} [syncable=false]
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
 * @param {string} matchId
 * @param {{ buttonClass?: string, compact?: boolean }} [options]
 * @returns {string}
 */
export function renderContestantPredictionEditLink(matchId, options = {}) {
  const {
    buttonClass = 'btn btn-ptw-primary',
    compact = false,
  } = options;
  const label = compact ? 'Edit' : 'Edit Prediction';
  const iconMargin = compact ? 'me-1' : 'me-2';

  return `
    <a href="/predictions?action=edit&matchId=${encodeURIComponent(matchId)}" class="${buttonClass}" data-route>
      <i class="bi bi-pencil ${iconMargin}" aria-hidden="true"></i>${label}
    </a>
  `;
}

/**
 * @param {string} matchId
 * @param {{ buttonClass?: string, visible?: boolean }} [options]
 * @returns {string}
 */
export function renderContestantPredictionEditInline(matchId, options = {}) {
  const {
    buttonClass = 'btn btn-link btn-sm ptw-prediction-edit-inline-btn p-0 align-baseline',
    visible = true,
  } = options;

  return `
    <span class="ptw-performance-card__stat-label-action"
      data-ptw-prediction-edit-inline
      data-match-id="${escapeHtml(matchId)}"
      data-edit-button-class="${escapeHtml(buttonClass)}"
    >${visible ? renderContestantPredictionEditLink(matchId, { buttonClass, compact: true }) : ''}</span>
  `;
}

/**
 * @param {string} matchId
 * @param {string} [predictionId]
 * @returns {string}
 */
export function resolveContestantViewDetailsHref(matchId, predictionId) {
  if (predictionId) {
    return `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(predictionId)}`;
  }

  return `/matches?id=${encodeURIComponent(matchId)}`;
}

/**
 * @param {ContestantPredictionActionButtonsOptions} options
 * @returns {string}
 */
function renderContestantPredictionActionButtonsInner(options) {
  const {
    matchId,
    predictionId,
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
      <a href="${resolveContestantViewDetailsHref(matchId, predictionId)}" class="${viewDetailsButtonClass}" data-route>
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

    return renderContestantPredictionEditLink(matchId, { buttonClass: editButtonClass });
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
    predictionId,
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
    syncable = false,
  } = options;

  const innerHtml = renderContestantPredictionActionButtonsInner({
    matchId,
    predictionId,
    predictionStatus,
    resultPublished,
    disabledButtonClass,
    enabledButtonClass,
    editButtonClass,
    viewDetailsButtonClass,
    predictLabel,
    showEditButton,
  });

  if (!innerHtml && !syncable) {
    return '';
  }

  const wrapperClassAttr = wrapperClass ? ` class="${escapeHtml(wrapperClass)}"` : '';
  const hiddenClass = !innerHtml && syncable ? ' visually-hidden' : '';

  return `
    <div${wrapperClassAttr}${hiddenClass}
      data-ptw-prediction-actions
      data-syncable="${syncable ? 'true' : 'false'}"
      data-match-id="${escapeHtml(matchId)}"
      data-prediction-id="${escapeHtml(predictionId ?? '')}"
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
    predictionId: actionsEl.dataset.predictionId || undefined,
    predictionStatus,
    resultPublished,
    disabledButtonClass: actionsEl.dataset.disabledButtonClass ?? 'btn btn-secondary w-100',
    enabledButtonClass: actionsEl.dataset.enabledButtonClass ?? 'btn btn-ptw-primary w-100',
    editButtonClass: actionsEl.dataset.editButtonClass ?? actionsEl.dataset.enabledButtonClass ?? 'btn btn-primary w-100',
    viewDetailsButtonClass: actionsEl.dataset.viewDetailsButtonClass ?? actionsEl.dataset.enabledButtonClass ?? 'btn btn-ptw-primary w-100',
    predictLabel: actionsEl.dataset.predictLabel ?? 'Make Prediction',
    showEditButton: actionsEl.dataset.showEditButton !== 'false',
  });

  if (actionsEl.dataset.syncable === 'true') {
    actionsEl.classList.toggle('visually-hidden', actionsEl.innerHTML.trim() === '');
  }

  const actionsFooterEl = card.querySelector('[data-ptw-prediction-actions-footer]');
  if (actionsFooterEl) {
    actionsFooterEl.classList.toggle(
      'mt-auto',
      predictionStatus !== CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED,
    );
    actionsFooterEl.classList.toggle(
      'pt-3',
      predictionStatus !== CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED,
    );
  }

  const editInlineEl = card.querySelector('[data-ptw-prediction-edit-inline]');
  if (editInlineEl) {
    const showEditInline = predictionStatus === CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED
      && actionsEl.dataset.showEditButton === 'false';
    const matchId = editInlineEl.dataset.matchId ?? actionsEl.dataset.matchId ?? '';
    const editButtonClass = editInlineEl.dataset.editButtonClass
      ?? actionsEl.dataset.editButtonClass
      ?? 'btn btn-link btn-sm ptw-prediction-edit-inline-btn p-0 align-baseline';

    editInlineEl.innerHTML = showEditInline
      ? renderContestantPredictionEditLink(matchId, { buttonClass: editButtonClass, compact: true })
      : '';
  }

  const badgeEl = card.querySelector('[data-ptw-prediction-status-badge]');
  if (badgeEl) {
    badgeEl.innerHTML = renderContestantPredictionStatusBadge(predictionStatus).trim();
  }
}
