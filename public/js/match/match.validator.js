/**
 * @fileoverview Match validation — no DOM manipulation.
 * @module match/match.validator
 */

import { MatchDomain, MATCH_STATUS } from '../domain/match.domain.js';
import {
  MATCH_LIFECYCLE_ACTIONS,
  MATCH_VALIDATION_MESSAGES,
  MATCH_MESSAGES,
} from './match.constants.js';

/**
 * @typedef {Object} MatchValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * @param {MatchValidationResult[]} results
 * @returns {MatchValidationResult}
 */
export function mergeValidationResults(results) {
  const errors = {};
  results.forEach((result) => Object.assign(errors, result.errors));
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {Record<string, unknown>} payload
 * @returns {MatchValidationResult}
 */
export function validateCreatePayload(payload) {
  const errors = {};

  if (!payload.tournamentId) {
    errors.tournamentId = MATCH_VALIDATION_MESSAGES.TOURNAMENT_REQUIRED;
  }

  if (!payload.homeTeamId) {
    errors.homeTeamId = MATCH_VALIDATION_MESSAGES.HOME_TEAM_REQUIRED;
  }

  if (!payload.awayTeamId) {
    errors.awayTeamId = MATCH_VALIDATION_MESSAGES.AWAY_TEAM_REQUIRED;
  }

  if (payload.homeTeamId && payload.awayTeamId && payload.homeTeamId === payload.awayTeamId) {
    errors.homeTeamId = MATCH_VALIDATION_MESSAGES.TEAMS_MUST_DIFFER;
    errors.awayTeamId = MATCH_VALIDATION_MESSAGES.TEAMS_MUST_DIFFER;
  }

  if (!payload.kickoffUtc) {
    errors.kickoffUtc = MATCH_VALIDATION_MESSAGES.KICKOFF_REQUIRED;
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * @param {Record<string, unknown>} payload
 * @param {{ status?: string }} [current]
 * @returns {MatchValidationResult}
 */
export function validateUpdatePayload(payload, current = {}) {
  if (!MatchDomain.canEditMatch(current.status ?? MATCH_STATUS.DRAFT)) {
    return { valid: false, errors: { form: MATCH_VALIDATION_MESSAGES.CANNOT_EDIT } };
  }

  return validateCreatePayload(payload);
}

/**
 * @param {string} action
 * @param {{ status?: string, visible?: boolean, kickoffUtc?: Date|null, homeTeamId?: string, awayTeamId?: string, tournamentId?: string }} match
 * @returns {MatchValidationResult}
 */
export function validateLifecycleAction(action, match) {
  const status = match.status ?? MATCH_STATUS.DRAFT;
  const errors = {};

  const transitions = {
    [MATCH_LIFECYCLE_ACTIONS.SCHEDULE]: MATCH_STATUS.SCHEDULED,
    [MATCH_LIFECYCLE_ACTIONS.PUBLISH]: MATCH_STATUS.PUBLISHED,
    [MATCH_LIFECYCLE_ACTIONS.OPEN_PREDICTIONS]: MATCH_STATUS.PREDICTION_OPEN,
    [MATCH_LIFECYCLE_ACTIONS.CLOSE_PREDICTIONS]: MATCH_STATUS.PREDICTION_LOCKED,
    [MATCH_LIFECYCLE_ACTIONS.REOPEN_PREDICTIONS]: MATCH_STATUS.PREDICTION_OPEN,
    [MATCH_LIFECYCLE_ACTIONS.GO_LIVE]: MATCH_STATUS.LIVE,
    [MATCH_LIFECYCLE_ACTIONS.COMPLETE]: MATCH_STATUS.COMPLETED,
    [MATCH_LIFECYCLE_ACTIONS.ARCHIVE]: MATCH_STATUS.ARCHIVED,
  };

  const target = transitions[action];

  if (target && !MatchDomain.canTransitionTo(status, target)) {
    errors.lifecycle = MATCH_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
    return { valid: false, errors };
  }

  // Special validation for OPEN_PREDICTIONS
  if (action === MATCH_LIFECYCLE_ACTIONS.OPEN_PREDICTIONS) {
    // OPEN_PREDICTIONS is only available from PUBLISHED or PREDICTION_LOCKED
    if (status !== MATCH_STATUS.PUBLISHED && status !== MATCH_STATUS.PREDICTION_LOCKED) {
      errors.lifecycle = 'Predictions can only be opened from Published or Prediction Locked status.';
      return { valid: false, errors };
    }

    // If already manually opened, don't allow opening again
    const hasActiveOpenOverride = match.predictionOverride?.isActive &&
                                   match.predictionOverride?.status === MATCH_STATUS.PREDICTION_OPEN;
    if (hasActiveOpenOverride) {
      errors.lifecycle = 'Predictions are already manually opened.';
      return { valid: false, errors };
    }
  }

  // Special validation for CLOSE_PREDICTIONS
  if (action === MATCH_LIFECYCLE_ACTIONS.CLOSE_PREDICTIONS) {
    // Can only close if currently in PREDICTION_OPEN status
    if (status !== MATCH_STATUS.PREDICTION_OPEN) {
      errors.lifecycle = 'Predictions can only be closed when they are currently open.';
      return { valid: false, errors };
    }
  }

  if (action === MATCH_LIFECYCLE_ACTIONS.PUBLISH) {
    if (!match.tournamentId || !match.homeTeamId || !match.awayTeamId || !match.kickoffUtc) {
      errors.lifecycle = 'Cannot publish without tournament, teams, and kickoff time.';
      return { valid: false, errors };
    }
  }

  return { valid: true, errors };
}

/**
 * @param {Record<string, unknown>} result
 * @param {{ requiresWinner?: boolean }} tournamentConfig
 * @param {string} homeTeamId
 * @param {string} awayTeamId
 * @returns {MatchValidationResult}
 */
export function validateResultPayload(result, tournamentConfig, homeTeamId, awayTeamId) {
  return MatchDomain.validateResult(result, tournamentConfig, homeTeamId, awayTeamId);
}

/**
 * @param {MatchValidationResult} result
 * @returns {string}
 */
export function getMatchValidationMessage(result) {
  if (result.valid) {
    return '';
  }

  return Object.values(result.errors)[0] ?? MATCH_MESSAGES.VALIDATION_SUMMARY;
}

/**
 * @param {HTMLFormElement} form
 * @param {Record<string, string>} errors
 * @returns {void}
 */
export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  form.querySelectorAll('.ptw-invalid-feedback--visible').forEach((el) => {
    el.textContent = '';
    el.classList.remove('ptw-invalid-feedback--visible');
  });

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`) ?? form.querySelector(`#ptw-match-${field}`);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    const errorEl = form.querySelector(`#ptw-match-${field}-error`);

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });
}
