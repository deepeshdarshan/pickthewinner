/**
 * @fileoverview Prediction form component for entering and editing predictions.
 * @module prediction/prediction-form.component
 */

import { appSettings } from '../config/app.config.js';
import { escapeHtml } from '../utils/html.util.js';
import {
  getTeamFlagUrl,
  parseFlagIconCode,
  renderTeamFlagHtml,
  renderTeamInlineHtml,
} from '../master-data/teams/team-flag.util.js';
import { renderCustomScoringSourceBadge } from '../match/renderers/match-scoring-points.renderer.js';
import { getRoundLabel } from '../match/match.constants.js';
import { formatDateTime, toDate } from '../utils/date.util.js';
import { startCountdown } from '../utils/countdown.util.js';

/**
 * @typedef {Object} PredictionFormOptions
 * @property {import('../match/match.service.js').EnrichedMatch} match
 * @property {Record<string, unknown>|null} [existingPrediction]
 * @property {boolean} [isEdit]
 * @property {boolean} [requireWinnerSelectionForDrawPrediction] - Tournament configuration
 * @property {string|null} [predictionLocksAt] - ISO date when the prediction window closes
 * @property {string|null} [tournamentBannerUrl] - Optional hero background image
 */

/**
 * @param {{ name?: string, shortName?: string, flagUrl?: string, flag?: string }|null|undefined} team
 * @param {string} fallback
 * @returns {string}
 */
function getTeamCode(team, fallback) {
  const shortName = team?.shortName?.trim();
  if (shortName) {
    return shortName.toUpperCase();
  }

  const flagCode = parseFlagIconCode(getTeamFlagUrl(team));
  if (flagCode) {
    return flagCode.replace(/^gb-/, '').toUpperCase().slice(0, 3);
  }

  return (team?.name?.trim() || fallback).slice(0, 3).toUpperCase();
}

/**
 * @param {import('../scoring/scoring.domain.js').EffectiveScoringConfig|null|undefined} effectiveScoringConfig
 * @returns {string}
 */
function renderPredictionFormPointsHtml(effectiveScoringConfig) {
  if (!effectiveScoringConfig) {
    return '';
  }

  const matchScorePoints = effectiveScoringConfig.correctMatchScorePoints;
  const penaltyPoints = effectiveScoringConfig.correctPenaltyWinnerPoints;
  const showPenalty = effectiveScoringConfig.showPenaltyWinnerPoints;

  const penaltyCard = showPenalty
    ? `
      <div class="ptw-prediction-form__points-card">
        <div class="ptw-prediction-form__points-card-icon" aria-hidden="true">
          <i class="bi bi-bullseye"></i>
        </div>
        <div class="ptw-prediction-form__points-card-body">
          <span class="ptw-prediction-form__points-card-label">Penalty Winner (if applicable)</span>
          <span class="ptw-prediction-form__points-badge">${escapeHtml(String(penaltyPoints))} pts</span>
        </div>
      </div>
    `
    : '';

  return `
    <section class="ptw-prediction-form__points" aria-labelledby="ptw-prediction-form-points-heading">
      <h2 class="ptw-prediction-form__points-heading" id="ptw-prediction-form-points-heading">Points at Stake</h2>
      <div class="ptw-prediction-form__points-grid">
        <div class="ptw-prediction-form__points-card">
          <div class="ptw-prediction-form__points-card-icon" aria-hidden="true">
            <i class="bi bi-dribbble"></i>
          </div>
          <div class="ptw-prediction-form__points-card-body">
            <span class="ptw-prediction-form__points-card-label">Exact Score (90' + ET)</span>
            <span class="ptw-prediction-form__points-badge">${escapeHtml(String(matchScorePoints))} pts</span>
          </div>
        </div>
        ${penaltyCard}
      </div>
      <p class="ptw-prediction-form__points-note">
        <i class="bi bi-info-circle" aria-hidden="true"></i>
        Points may vary for each match as per the tournament configuration.
      </p>
    </section>
  `;
}

/**
 * @param {{ name?: string, shortName?: string, flagUrl?: string, flag?: string }|null|undefined} team
 * @param {string} fallback
 * @returns {string}
 */
function renderPredictionFormTeamHtml(team, fallback) {
  const name = team?.name?.trim() || fallback;
  const code = getTeamCode(team, fallback);
  const flagHtml = renderTeamFlagHtml(getTeamFlagUrl(team), {
    className: 'ptw-team-flag ptw-team-flag--lg ptw-prediction-form__team-flag',
    marginClass: '',
  });

  return `
    <div class="ptw-prediction-form__team">
      ${flagHtml}
      <div class="ptw-prediction-form__team-name">${escapeHtml(name)}</div>
      <span class="ptw-prediction-form__team-code">${escapeHtml(code)}</span>
    </div>
  `;
}

/**
 * @param {string|null|undefined} locksAt
 * @returns {string}
 */
function renderPredictionFormCountdownHtml(locksAt) {
  if (!locksAt) {
    return '';
  }

  return `
    <div
      class="ptw-countdown ptw-prediction-form__countdown"
      data-target="${escapeHtml(locksAt)}"
      data-ptw-countdown-format="prediction-window"
      role="timer"
      aria-live="polite"
    >
      <span class="ptw-prediction-form__countdown-label">
        <i class="bi bi-clock" aria-hidden="true"></i>
        Prediction window closes in
      </span>
      <span class="ptw-prediction-form__countdown-value" data-ptw-countdown-value>--h --m --s</span>
    </div>
  `;
}

/**
 * Formats countdown parts for the prediction window display.
 * @param {import('../utils/countdown.util.js').CountdownParts} parts
 * @returns {string}
 */
function formatPredictionWindowCountdown(parts) {
  const pad = (value) => String(value).padStart(2, '0');

  if (parts.expired) {
    return 'Closed';
  }

  if (parts.days > 0) {
    return `${parts.days}d ${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s`;
  }

  return `${pad(parts.hours)}h ${pad(parts.minutes)}m ${pad(parts.seconds)}s`;
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @param {string|null|undefined} tournamentBannerUrl
 * @returns {string}
 */
function renderPredictionFormMatchHeroHtml(match, tournamentBannerUrl) {
  const kickoff = toDate(match.kickoffUtc);
  const stageLabel = String(match.stage ?? '') || getRoundLabel(String(match.round ?? ''));
  const venue = String(match.venue ?? match.stadium ?? '').trim();
  const bannerStyle = tournamentBannerUrl
    ? `--ptw-prediction-form-hero-banner: url('${escapeHtml(tournamentBannerUrl)}');`
    : '';
  const heroClass = tournamentBannerUrl
    ? 'ptw-prediction-form__match-hero ptw-prediction-form__match-hero--has-banner'
    : 'ptw-prediction-form__match-hero';

  return `
    <section class="${heroClass}" style="${bannerStyle}" aria-label="Match details">
      <div class="ptw-prediction-form__match-hero-overlay">
        <div class="ptw-prediction-form__match-hero-grid">
          ${renderPredictionFormTeamHtml(match.homeTeam, 'Home')}
          <div class="ptw-prediction-form__match-center">
            ${stageLabel ? `<span class="ptw-prediction-form__stage-badge">${escapeHtml(stageLabel)}</span>` : ''}
            <div class="ptw-prediction-form__vs">VS</div>
            ${kickoff ? `
              <div class="ptw-prediction-form__match-meta">
                <i class="bi bi-calendar3" aria-hidden="true"></i>
                ${escapeHtml(formatDateTime(kickoff))}
              </div>
            ` : ''}
            ${venue ? `
              <div class="ptw-prediction-form__match-meta">
                <i class="bi bi-geo-alt" aria-hidden="true"></i>
                ${escapeHtml(venue)}
              </div>
            ` : ''}
          </div>
          ${renderPredictionFormTeamHtml(match.awayTeam, 'Away')}
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {{ team: import('../master-data/teams/team.service.js').Team|null|undefined, fallback: string, inputId: string, inputName: string, value: string|number }} options
 * @returns {string}
 */
function renderScoreStepperHtml(options) {
  const { team, fallback, inputId, inputName, value } = options;
  const teamName = team?.name?.trim() || fallback;

  return `
    <div class="ptw-prediction-form__score-field">
      <label for="${inputId}" class="ptw-prediction-form__score-label">
        ${renderTeamInlineHtml(team, { fallback })}
        <span>Score</span>
      </label>
      <div class="ptw-prediction-form__score-stepper">
        <button
          type="button"
          class="ptw-prediction-form__score-stepper-btn"
          data-action="decrement-score"
          data-target="${inputId}"
          aria-label="Decrease ${escapeHtml(teamName)} score"
        >
          <i class="bi bi-dash-lg" aria-hidden="true"></i>
        </button>
        <input
          type="number"
          class="ptw-prediction-form__score-input"
          id="${inputId}"
          name="${inputName}"
          min="0"
          max="20"
          value="${escapeHtml(String(value))}"
          required
          inputmode="numeric"
          aria-label="${escapeHtml(teamName)} score"
        >
        <button
          type="button"
          class="ptw-prediction-form__score-stepper-btn"
          data-action="increment-score"
          data-target="${inputId}"
          aria-label="Increase ${escapeHtml(teamName)} score"
        >
          <i class="bi bi-plus-lg" aria-hidden="true"></i>
        </button>
      </div>
      <div class="invalid-feedback">Please enter a valid score (0-20)</div>
    </div>
  `;
}

/**
 * Renders prediction form.
 * @param {PredictionFormOptions} options
 * @returns {string}
 */
export function renderPredictionForm(options) {
  const {
    match,
    existingPrediction = null,
    isEdit = false,
    requireWinnerSelectionForDrawPrediction = false,
    predictionLocksAt = null,
    tournamentBannerUrl = null,
  } = options;

  const homeTeam = match.homeTeam?.name || 'Home';
  const awayTeam = match.awayTeam?.name || 'Away';
  const homeScore = existingPrediction?.homeScore ?? '';
  const awayScore = existingPrediction?.awayScore ?? '';
  const predictedWinner = existingPrediction?.predictedWinner || '';
  const customPointsBadge = renderCustomScoringSourceBadge(match.effectiveScoringConfig);
  const timezoneShort = appSettings.timezoneLabel.split(' ')[0] || 'IST';

  return `
    <div class="ptw-prediction-form">
      <header class="ptw-prediction-form__header">
        <div class="ptw-prediction-form__header-copy">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <h1 class="ptw-prediction-form__title">${isEdit ? 'Edit' : 'Make'} Prediction</h1>
            ${customPointsBadge}
          </div>
          <p class="ptw-prediction-form__subtitle">Make your prediction before the window closes</p>
        </div>
        <div class="ptw-prediction-form__header-meta">
          ${renderPredictionFormCountdownHtml(predictionLocksAt)}
          <div class="ptw-prediction-form__timezone" title="${escapeHtml(appSettings.timezoneLabel)}">
            <span class="ptw-prediction-form__timezone-badge">
              <i class="bi bi-globe2" aria-hidden="true"></i>
              ${escapeHtml(timezoneShort)}
            </span>
            <span class="ptw-prediction-form__timezone-label">Indian Standard Time</span>
          </div>
        </div>
      </header>

      ${renderPredictionFormMatchHeroHtml(match, tournamentBannerUrl)}
      ${renderPredictionFormPointsHtml(match.effectiveScoringConfig)}

      ${requireWinnerSelectionForDrawPrediction ? `
        <div class="ptw-prediction-form__draw-notice" role="note">
          <i class="bi bi-exclamation-triangle-fill ptw-prediction-form__draw-notice-icon" aria-hidden="true"></i>
          <div class="ptw-prediction-form__draw-notice-content">
            <p class="ptw-prediction-form__draw-notice-title">Important: equal-score predictions</p>
            <p class="mb-2">
              If you predict <strong>equal scores</strong>, you must select which team will win after
              <strong>normal time and extra time</strong>.
            </p>
            <p class="ptw-prediction-form__draw-notice-highlight mb-0">
              <i class="bi bi-slash-circle" aria-hidden="true"></i>
              Do not enter penalty shootout scores.
            </p>
          </div>
          <i class="bi bi-dribbble ptw-prediction-form__draw-notice-watermark" aria-hidden="true"></i>
        </div>
      ` : ''}

      <form id="prediction-form" class="ptw-prediction-form__form" data-match-id="${escapeHtml(match.id)}">
        <div class="ptw-prediction-form__scores">
          ${renderScoreStepperHtml({
    team: match.homeTeam,
    fallback: 'Home',
    inputId: 'home-score',
    inputName: 'homeScore',
    value: homeScore,
  })}
          ${renderScoreStepperHtml({
    team: match.awayTeam,
    fallback: 'Away',
    inputId: 'away-score',
    inputName: 'awayScore',
    value: awayScore,
  })}
        </div>

        ${requireWinnerSelectionForDrawPrediction ? `
          <div id="winner-selection-section" class="ptw-prediction-form__penalty" hidden>
            <div class="ptw-prediction-form__penalty-copy">
              <div class="ptw-prediction-form__penalty-icon" aria-hidden="true">
                <i class="bi bi-trophy"></i>
              </div>
              <p class="mb-0">
                If the score is tied after normal time and extra time, select the winner after penalty shootout.
                This field is required only if you predict equal scores.
              </p>
            </div>
            <div class="ptw-prediction-form__penalty-control">
              <label for="predicted-winner" class="form-label">Penalty Shootout Winner (if applicable)</label>
              <select class="form-select ptw-prediction-form__penalty-select" id="predicted-winner" name="predictedWinner">
                <option value="">Select team</option>
                <option value="HOME" ${predictedWinner === 'HOME' ? 'selected' : ''}>${escapeHtml(homeTeam)}</option>
                <option value="AWAY" ${predictedWinner === 'AWAY' ? 'selected' : ''}>${escapeHtml(awayTeam)}</option>
              </select>
              <div class="invalid-feedback">Please select a winner for draw predictions</div>
            </div>
          </div>
        ` : ''}

        <div id="prediction-form-errors" class="alert alert-danger d-none" role="alert"></div>

        <div class="ptw-prediction-form__actions">
          <button type="submit" class="btn btn-ptw-primary ptw-prediction-form__submit">
            <i class="bi ${isEdit ? 'bi-save' : 'bi-send'}" aria-hidden="true"></i>
            ${isEdit ? 'Update' : 'Submit'} Prediction
          </button>
          <button type="button" class="btn btn-outline-light ptw-prediction-form__cancel" data-action="cancel-prediction">
            Cancel
          </button>
        </div>

        <p class="ptw-prediction-form__footer-note">
          <i class="bi bi-clock-history" aria-hidden="true"></i>
          Remember: You can edit your prediction until the window closes. Once closed, predictions cannot be changed.
        </p>
      </form>

      ${!requireWinnerSelectionForDrawPrediction ? `
        <p class="ptw-prediction-form__footer-note ptw-prediction-form__footer-note--standalone">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          Enter the final score you predict for this match. Draws are valid predictions.
        </p>
      ` : ''}
    </div>
  `;
}

/**
 * Initializes countdown timers inside the prediction form.
 * @param {HTMLElement} root
 * @returns {Array<() => void>}
 */
export function initializePredictionFormCountdowns(root) {
  const countdowns = root.querySelectorAll('.ptw-prediction-form__countdown[data-target]');
  const cleanupFunctions = [];

  countdowns.forEach((countdownContainer) => {
    const targetDate = countdownContainer.getAttribute('data-target');
    const valueElement = countdownContainer.querySelector('[data-ptw-countdown-value]');

    if (!targetDate || !valueElement) {
      return;
    }

    const cleanup = startCountdown(targetDate, (parts) => {
      valueElement.textContent = formatPredictionWindowCountdown(parts);

      if (parts.expired) {
        valueElement.classList.add('is-expired');
      } else {
        valueElement.classList.remove('is-expired');
      }
    });

    cleanupFunctions.push(cleanup);
  });

  return cleanupFunctions;
}

/**
 * Attaches score stepper controls to the prediction form.
 * @param {HTMLFormElement} form
 * @returns {void}
 */
function attachScoreStepperHandlers(form) {
  form.querySelectorAll('[data-action="increment-score"], [data-action="decrement-score"]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = targetId ? form.querySelector(`#${targetId}`) : null;

      if (!(input instanceof HTMLInputElement)) {
        return;
      }

      const currentValue = Number.parseInt(input.value, 10);
      const safeValue = Number.isNaN(currentValue) ? 0 : currentValue;
      const min = Number.parseInt(input.min, 10) || 0;
      const max = Number.parseInt(input.max, 10) || 20;
      const delta = button.getAttribute('data-action') === 'increment-score' ? 1 : -1;
      const nextValue = Math.min(max, Math.max(min, safeValue + delta));

      input.value = String(nextValue);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });
}

/**
 * Attaches event handlers to prediction form.
 * @param {HTMLFormElement} form
 * @param {boolean} requireWinnerSelectionForDrawPrediction - Tournament configuration
 * @param {(payload: Record<string, unknown>) => Promise<void>} onSubmit
 * @param {() => void} onCancel
 * @param {boolean} [isEdit=false]
 * @returns {void}
 */
export function attachPredictionFormHandlers(
  form,
  requireWinnerSelectionForDrawPrediction,
  onSubmit,
  onCancel,
  isEdit = false,
) {
  const homeScoreInput = form.querySelector('#home-score');
  const awayScoreInput = form.querySelector('#away-score');
  const winnerSelectionSection = form.querySelector('#winner-selection-section');
  const predictedWinnerSelect = form.querySelector('#predicted-winner');
  const errorsDiv = form.querySelector('#prediction-form-errors');

  attachScoreStepperHandlers(form);

  // Show/hide winner selection section based on scores
  if (requireWinnerSelectionForDrawPrediction && homeScoreInput && awayScoreInput && winnerSelectionSection) {
    const checkScores = () => {
      const homeScore = parseInt(homeScoreInput.value, 10);
      const awayScore = parseInt(awayScoreInput.value, 10);

      if (!isNaN(homeScore) && !isNaN(awayScore) && homeScore === awayScore) {
        winnerSelectionSection.hidden = false;
        if (predictedWinnerSelect) {
          predictedWinnerSelect.required = true;
        }
      } else {
        winnerSelectionSection.hidden = true;
        if (predictedWinnerSelect) {
          predictedWinnerSelect.required = false;
          predictedWinnerSelect.value = '';
        }
      }
    };

    homeScoreInput.addEventListener('input', checkScores);
    awayScoreInput.addEventListener('input', checkScores);

    checkScores();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    form.classList.remove('was-validated');
    if (errorsDiv) {
      errorsDiv.classList.add('d-none');
      errorsDiv.textContent = '';
    }

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const formData = new FormData(form);
    const homeScore = parseInt(formData.get('homeScore'), 10);
    const awayScore = parseInt(formData.get('awayScore'), 10);
    const predictedWinner = formData.get('predictedWinner') || null;

    if (isNaN(homeScore) || isNaN(awayScore)) {
      if (errorsDiv) {
        errorsDiv.textContent = 'Please enter valid scores';
        errorsDiv.classList.remove('d-none');
      }
      return;
    }

    if (requireWinnerSelectionForDrawPrediction && homeScore === awayScore && !predictedWinner) {
      if (errorsDiv) {
        errorsDiv.textContent = 'Please select a winner when predicting equal scores';
        errorsDiv.classList.remove('d-none');
      }
      return;
    }

    const payload = {
      homeScore,
      awayScore,
      predictedWinner,
    };

    const submitLabel = isEdit ? 'Update Prediction' : 'Submit Prediction';
    const submitIcon = isEdit ? 'bi-save' : 'bi-send';

    try {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
      }

      await onSubmit(payload);
    } catch (error) {
      if (errorsDiv) {
        errorsDiv.textContent = error.message || 'Failed to save prediction';
        errorsDiv.classList.remove('d-none');
      }

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="bi ${submitIcon} me-2" aria-hidden="true"></i>${submitLabel}`;
      }
    }
  });

  const cancelButton = form.querySelector('[data-action="cancel-prediction"]');
  if (cancelButton) {
    cancelButton.addEventListener('click', onCancel);
  }
}
