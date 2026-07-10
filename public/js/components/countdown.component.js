/**
 * @fileoverview Countdown component — lifecycle-aware match countdown display.
 * @module components/countdown.component
 */

import { escapeHtml } from '../utils/html.util.js';
import {
  MatchDomain,
  MATCH_COUNTDOWN_PHASE,
} from '../domain/match.domain.js';
import {
  startCountdown,
  formatCountdown,
  formatCountdownVerbose,
  formatPredictionWindowCountdown,
} from '../utils/countdown.util.js';
import { msUntil } from '../utils/time.util.js';
import { syncContestantPredictionUiFromCountdownPhase } from '../match/match-prediction-ui.util.js';

/**
 * @typedef {Object} CountdownOptions
 * @property {string} targetDate - ISO date string for the countdown target.
 * @property {string} [label]
 * @property {string} [id]
 */

/**
 * @typedef {Object} PredictionWindowCountdownOptions
 * @property {string} targetDate
 * @property {string} [id]
 * @property {string} [label]
 */

/**
 * @typedef {Object} MatchLifecycleCountdownOptions
 * @property {string} opensAt
 * @property {string} locksAt
 * @property {string} kickoffUtc
 * @property {string} [label]
 * @property {string} [targetDate]
 * @property {string} [phase]
 * @property {string} [status]
 * @property {string} [predictionStatus]
 * @property {boolean} [predictionOverrideActive]
 * @property {string} [predictionOverrideStatus]
 * @property {string} [id]
 * @property {boolean} [verbose]
 * @property {'default'|'dashboard'} [variant]
 */

/**
 * Renders a countdown placeholder block.
 * @param {CountdownOptions} options
 * @returns {string}
 */
export function renderCountdown(options) {
  const { targetDate, label = 'Time remaining', id = `ptw-countdown-${Date.now()}` } = options;

  return `
    <div class="ptw-countdown" id="${escapeHtml(id)}" data-target="${escapeHtml(targetDate)}" role="timer" aria-live="polite">
      <span class="ptw-countdown__label">${escapeHtml(label)}</span>
      <div class="ptw-countdown__display">
        <span class="ptw-countdown__value" data-ptw-countdown-value>--:--:--</span>
      </div>
    </div>
  `;
}

/**
 * Renders a lifecycle-aware match countdown with automatic phase transitions.
 * @param {MatchLifecycleCountdownOptions} options
 * @returns {string}
 */
export function renderMatchLifecycleCountdown(options) {
  const {
    opensAt,
    locksAt,
    kickoffUtc,
    label = '',
    targetDate = opensAt,
    phase = MATCH_COUNTDOWN_PHASE.PRE_OPEN,
    status = '',
    predictionStatus = '',
    predictionOverrideActive = false,
    predictionOverrideStatus = '',
    id = `ptw-countdown-${Date.now()}`,
    verbose = false,
    variant = 'default',
  } = options;

  const openHours = deriveOpenHours(kickoffUtc, opensAt);
  const lockMinutes = deriveLockMinutes(kickoffUtc, locksAt);
  const verboseClass = verbose ? ' ptw-countdown--verbose' : '';
  const isDashboard = variant === 'dashboard';
  const dashboardClasses = isDashboard ? ' ptw-prediction-form__countdown' : '';
  const labelHtml = isDashboard
    ? `<span class="ptw-prediction-form__countdown-label ptw-countdown__label">
        <i class="bi bi-clock" aria-hidden="true"></i>
        ${escapeHtml(label)}
      </span>`
    : `<span class="ptw-countdown__label">${escapeHtml(label)}</span>`;
  const valueClasses = isDashboard
    ? 'ptw-prediction-form__countdown-value ptw-countdown__value'
    : 'ptw-countdown__value';
  const valueMarkup = isDashboard
    ? `<span class="${valueClasses}" data-ptw-countdown-value>--h --m --s</span>`
    : `<div class="ptw-countdown__display">
        <span class="${valueClasses}" data-ptw-countdown-value>--:--:--</span>
      </div>`;

  return `
    <div
      class="ptw-countdown${verboseClass}${dashboardClasses}"
      id="${escapeHtml(id)}"
      data-target="${escapeHtml(targetDate)}"
      data-ptw-countdown-mode="match-lifecycle"
      data-ptw-countdown-variant="${escapeHtml(variant)}"
      data-opens-at="${escapeHtml(opensAt)}"
      data-locks-at="${escapeHtml(locksAt)}"
      data-kickoff-at="${escapeHtml(kickoffUtc)}"
      data-open-hours="${escapeHtml(String(openHours))}"
      data-lock-minutes="${escapeHtml(String(lockMinutes))}"
      data-status="${escapeHtml(status)}"
      data-prediction-status="${escapeHtml(predictionStatus)}"
      data-prediction-override-active="${predictionOverrideActive ? 'true' : 'false'}"
      data-prediction-override-status="${escapeHtml(predictionOverrideStatus)}"
      data-phase="${escapeHtml(phase)}"
      role="timer"
      aria-live="polite"
    >
      ${labelHtml}
      ${valueMarkup}
    </div>
  `;
}

/**
 * Renders lifecycle countdown from enriched match countdown DTO.
 * @param {import('../match/match-countdown.service.js').MatchCountdownDto} matchCountdown
 * @param {{ id?: string, status?: string, predictionStatus?: string, predictionOverride?: { isActive?: boolean, status?: string }, verbose?: boolean, variant?: 'default'|'dashboard' }} [meta]
 * @returns {string}
 */
export function renderMatchCountdownFromDto(matchCountdown, meta = {}) {
  if (!matchCountdown?.targetDate) {
    return '';
  }

  return renderMatchLifecycleCountdown({
    opensAt: matchCountdown.opensAt,
    locksAt: matchCountdown.locksAt,
    kickoffUtc: matchCountdown.kickoffUtc,
    targetDate: matchCountdown.targetDate,
    label: matchCountdown.label ?? '',
    phase: matchCountdown.phase,
    status: meta.status ?? '',
    predictionStatus: meta.predictionStatus ?? '',
    predictionOverrideActive: Boolean(meta.predictionOverride?.isActive),
    predictionOverrideStatus: String(meta.predictionOverride?.status ?? ''),
    id: meta.id,
    verbose: meta.verbose,
    variant: meta.variant ?? 'default',
  });
}

/**
 * Renders the shared prediction-window countdown used on the prediction form and dashboard.
 * @param {PredictionWindowCountdownOptions} options
 * @returns {string}
 */
export function renderPredictionWindowCountdown(options) {
  const {
    targetDate,
    id = `ptw-countdown-${Date.now()}`,
    label = 'Prediction window closes in',
  } = options;

  return `
    <div
      class="ptw-countdown ptw-prediction-form__countdown"
      id="${id}"
      data-target="${escapeHtml(targetDate)}"
      data-ptw-countdown-format="prediction-window"
      role="timer"
      aria-live="polite"
    >
      <span class="ptw-prediction-form__countdown-label ptw-countdown__label">
        <i class="bi bi-clock" aria-hidden="true"></i>
        ${escapeHtml(label)}
      </span>
      <span class="ptw-prediction-form__countdown-value ptw-countdown__value" data-ptw-countdown-value>--h --m --s</span>
    </div>
  `;
}

/**
 * Mounts a countdown into a container element.
 * @param {HTMLElement} container
 * @param {CountdownOptions} options
 * @returns {HTMLElement}
 */
export function mountCountdown(container, options) {
  container.innerHTML = renderCountdown(options);
  return container.querySelector('.ptw-countdown');
}

/**
 * @param {HTMLElement} countdownContainer
 * @returns {'prediction-window'|'verbose'|'default'|'match-lifecycle'}
 */
function getCountdownFormat(countdownContainer) {
  const mode = countdownContainer.getAttribute('data-ptw-countdown-mode');
  if (mode === 'match-lifecycle') {
    return 'match-lifecycle';
  }

  const format = countdownContainer.getAttribute('data-ptw-countdown-format');
  if (format === 'prediction-window' || countdownContainer.classList.contains('ptw-prediction-form__countdown')) {
    return 'prediction-window';
  }

  if (countdownContainer.classList.contains('ptw-countdown--verbose')) {
    return 'verbose';
  }

  return 'default';
}

/**
 * @param {HTMLElement} countdownContainer
 * @returns {{ phase: string, targetDate: Date|null, label: string|null }}
 */
function resolveLifecyclePhaseFromElement(countdownContainer) {
  const kickoffUtc = parseIsoDate(countdownContainer.getAttribute('data-kickoff-at'));
  if (!kickoffUtc) {
    return { phase: MATCH_COUNTDOWN_PHASE.HIDDEN, targetDate: null, label: null };
  }

  const openHours = Number(countdownContainer.getAttribute('data-open-hours')) || deriveOpenHours(
    countdownContainer.getAttribute('data-kickoff-at') ?? '',
    countdownContainer.getAttribute('data-opens-at') ?? '',
  );
  const lockMinutes = Number(countdownContainer.getAttribute('data-lock-minutes')) || deriveLockMinutes(
    countdownContainer.getAttribute('data-kickoff-at') ?? '',
    countdownContainer.getAttribute('data-locks-at') ?? '',
  );

  const overrideActive = countdownContainer.getAttribute('data-prediction-override-active') === 'true';
  const overrideStatus = countdownContainer.getAttribute('data-prediction-override-status') ?? '';

  const resolved = MatchDomain.resolveMatchCountdownPhase({
    kickoffUtc,
    openHours,
    lockMinutes,
    status: countdownContainer.getAttribute('data-status') ?? '',
    predictionStatus: countdownContainer.getAttribute('data-prediction-status') ?? '',
    predictionOverride: overrideActive
      ? { isActive: true, status: overrideStatus }
      : undefined,
    now: new Date(),
  });

  return {
    phase: resolved.phase,
    targetDate: resolved.targetDate,
    label: resolved.label,
  };
}

/**
 * @param {HTMLElement} countdownContainer
 * @param {{ phase: string, targetDate: Date|null, label: string|null }} state
 * @returns {void}
 */
function applyLifecycleCountdownState(countdownContainer, state) {
  const labelElement = countdownContainer.querySelector('.ptw-countdown__label');
  const valueElement = countdownContainer.querySelector('[data-ptw-countdown-value]');

  if (
    state.phase === MATCH_COUNTDOWN_PHASE.CLOSED
    || state.phase === MATCH_COUNTDOWN_PHASE.HIDDEN
    || !state.targetDate
  ) {
    countdownContainer.classList.add('is-hidden');
    countdownContainer.setAttribute('hidden', 'hidden');
    return;
  }

  countdownContainer.classList.remove('is-hidden');
  countdownContainer.removeAttribute('hidden');
  countdownContainer.setAttribute('data-phase', state.phase);
  countdownContainer.setAttribute('data-target', state.targetDate.toISOString());

  if (labelElement && state.label) {
    if (countdownContainer.getAttribute('data-ptw-countdown-variant') === 'dashboard') {
      labelElement.innerHTML = '';
      const icon = document.createElement('i');
      icon.className = 'bi bi-clock';
      icon.setAttribute('aria-hidden', 'true');
      labelElement.appendChild(icon);
      labelElement.appendChild(document.createTextNode(` ${state.label}`));
    } else {
      labelElement.textContent = state.label;
    }
  }

  if (valueElement && msUntil(state.targetDate) <= 0) {
    valueElement.textContent = 'Expired';
    valueElement.classList.add('text-danger');
  }
}

/**
 * Initializes all countdown timers on the page.
 * @param {HTMLElement} [container=document.body] - Container to search for countdowns
 * @returns {Array<() => void>} Array of cleanup functions to stop countdowns
 */
export function initializeCountdowns(container = document.body) {
  const countdowns = container.querySelectorAll('[data-ptw-countdown-value]');
  const cleanupFunctions = [];

  countdowns.forEach((element) => {
    const countdownContainer = element.closest('.ptw-countdown');
    if (!countdownContainer) {
      return;
    }

    const format = getCountdownFormat(countdownContainer);

    if (format === 'match-lifecycle') {
      const lifecycleCleanup = startLifecycleCountdown(countdownContainer, element);
      cleanupFunctions.push(lifecycleCleanup);
      return;
    }

    const targetDate = countdownContainer.getAttribute('data-target');
    if (!targetDate) {
      return;
    }

    const cleanup = startCountdown(targetDate, (parts) => {
      if (format === 'prediction-window') {
        element.textContent = formatPredictionWindowCountdown(parts);

        if (parts.expired) {
          element.classList.add('is-expired');
        } else {
          element.classList.remove('is-expired');
        }

        return;
      }

      const formatter = format === 'verbose' ? formatCountdownVerbose : formatCountdown;

      if (parts.expired) {
        element.textContent = 'Expired';
        element.classList.add('text-danger');
      } else {
        element.textContent = formatter(parts);
        element.classList.remove('text-danger');
      }
    });

    cleanupFunctions.push(cleanup);
  });

  return cleanupFunctions;
}

/**
 * @param {HTMLElement} countdownContainer
 * @param {HTMLElement} valueElement
 * @returns {() => void}
 */
function startLifecycleCountdown(countdownContainer, valueElement) {
  /** @type {number|undefined} */
  let timerId;
  const verbose = countdownContainer.classList.contains('ptw-countdown--verbose');
  const isDashboard = countdownContainer.getAttribute('data-ptw-countdown-variant') === 'dashboard';

  const stop = () => {
    if (timerId !== undefined) {
      window.clearInterval(timerId);
      timerId = undefined;
    }
  };

  const tick = () => {
    const previousPhase = countdownContainer.getAttribute('data-phase');
    const state = resolveLifecyclePhaseFromElement(countdownContainer);
    applyLifecycleCountdownState(countdownContainer, state);

    if (state.phase !== previousPhase) {
      syncContestantPredictionUiFromCountdownPhase(countdownContainer, state.phase);
    }

    if (
      state.phase === MATCH_COUNTDOWN_PHASE.CLOSED
      || state.phase === MATCH_COUNTDOWN_PHASE.HIDDEN
      || !state.targetDate
    ) {
      stop();
      return;
    }

    const parts = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalMs: Math.max(0, msUntil(state.targetDate)),
      expired: msUntil(state.targetDate) <= 0,
    };

    const totalSeconds = Math.floor(parts.totalMs / 1000);
    parts.days = Math.floor(totalSeconds / 86400);
    parts.hours = Math.floor((totalSeconds % 86400) / 3600);
    parts.minutes = Math.floor((totalSeconds % 3600) / 60);
    parts.seconds = totalSeconds % 60;
    parts.expired = parts.totalMs <= 0;

    const formatter = isDashboard
      ? formatPredictionWindowCountdown
      : (verbose ? formatCountdownVerbose : formatCountdown);
    if (parts.expired) {
      valueElement.textContent = isDashboard ? 'Closed' : 'Expired';
      valueElement.classList.add(isDashboard ? 'is-expired' : 'text-danger');
      stop();
      return;
    }

    valueElement.textContent = formatter(parts);
    valueElement.classList.remove('text-danger', 'is-expired');
  };

  tick();
  timerId = window.setInterval(tick, 1000);

  return stop;
}

/**
 * @param {string} kickoffUtc
 * @param {string} opensAt
 * @returns {number}
 */
function deriveOpenHours(kickoffUtc, opensAt) {
  const kickoff = parseIsoDate(kickoffUtc);
  const opens = parseIsoDate(opensAt);
  if (!kickoff || !opens) {
    return 48;
  }

  return Math.max(0, (kickoff.getTime() - opens.getTime()) / (60 * 60 * 1000));
}

/**
 * @param {string} kickoffUtc
 * @param {string} locksAt
 * @returns {number}
 */
function deriveLockMinutes(kickoffUtc, locksAt) {
  const kickoff = parseIsoDate(kickoffUtc);
  const locks = parseIsoDate(locksAt);
  if (!kickoff || !locks) {
    return 10;
  }

  return Math.max(0, (kickoff.getTime() - locks.getTime()) / (60 * 1000));
}

/**
 * @param {string|null|undefined} value
 * @returns {Date|null}
 */
function parseIsoDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
