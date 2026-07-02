/**
 * @fileoverview Tournament validation — no DOM manipulation.
 * @module tournament/tournament.validator
 */

import { TournamentDomain, TOURNAMENT_STATUS, TOURNAMENT_VISIBILITY } from '../domain/tournament.domain.js';
import {
  DEFAULT_TOURNAMENT_TIMEZONE,
  LIFECYCLE_ACTIONS,
  PREDICTION_LOCK_MINUTES_MAX,
  PREDICTION_LOCK_MINUTES_MIN,
  PREDICTION_OPEN_HOURS_MAX,
  PREDICTION_OPEN_HOURS_MIN,
  SCORING_POINTS_MAX,
  SCORING_POINTS_MIN,
  SCORING_VALIDATION_MESSAGES,
  TOURNAMENT_VALIDATION_MESSAGES,
  TOURNAMENT_MESSAGES,
} from './tournament.constants.js';

/**
 * @typedef {Object} TournamentValidationResult
 * @property {boolean} valid
 * @property {Record<string, string>} errors
 */

/**
 * Merges multiple validation results into one.
 * @param {TournamentValidationResult[]} results
 * @returns {TournamentValidationResult}
 */
export function mergeValidationResults(results) {
  const errors = {};

  results.forEach((result) => {
    Object.assign(errors, result.errors);
  });

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * @param {unknown} value
 * @returns {TournamentValidationResult}
 */
export function validateName(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.name = TOURNAMENT_VALIDATION_MESSAGES.NAME_REQUIRED;
    return { valid: false, errors };
  }

  if (value.trim().length < 2) {
    errors.name = TOURNAMENT_VALIDATION_MESSAGES.NAME_TOO_SHORT;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {TournamentValidationResult}
 */
export function validateSeason(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.season = TOURNAMENT_VALIDATION_MESSAGES.SEASON_REQUIRED;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {TournamentValidationResult}
 */
export function validateTimezone(value) {
  const errors = {};

  if (typeof value !== 'string' || !value.trim()) {
    errors.timezone = TOURNAMENT_VALIDATION_MESSAGES.TIMEZONE_REQUIRED;
    return { valid: false, errors };
  }

  if (value !== DEFAULT_TOURNAMENT_TIMEZONE) {
    errors.timezone = TOURNAMENT_VALIDATION_MESSAGES.TIMEZONE_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} registrationStart
 * @param {unknown} registrationEnd
 * @returns {TournamentValidationResult}
 */
export function validateRegistrationDates(registrationStart, registrationEnd) {
  const errors = {};

  if (!registrationStart || !registrationEnd) {
    return { valid: true, errors };
  }

  const start = toDateValue(registrationStart);
  const end = toDateValue(registrationEnd);

  if (start && end && end.getTime() <= start.getTime()) {
    errors.registrationEnd = TOURNAMENT_VALIDATION_MESSAGES.REGISTRATION_END_BEFORE_START;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} visibility
 * @returns {TournamentValidationResult}
 */
export function validateVisibility(visibility) {
  const errors = {};
  const values = Object.values(TOURNAMENT_VISIBILITY);

  if (typeof visibility !== 'string' || !values.includes(visibility)) {
    errors.visibility = TOURNAMENT_VALIDATION_MESSAGES.VISIBILITY_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}


/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string} requiredMessage
 * @param {string} invalidMessage
 * @returns {TournamentValidationResult}
 */
function validateScoringPointsField(value, fieldName, requiredMessage, invalidMessage) {
  const errors = {};

  if (value === null || value === undefined || value === '') {
    errors[fieldName] = requiredMessage;
    return { valid: false, errors };
  }

  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < SCORING_POINTS_MIN || numeric > SCORING_POINTS_MAX) {
    errors[fieldName] = invalidMessage;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * Validates tournament scoring configuration.
 * @param {unknown} scoringConfiguration
 * @returns {TournamentValidationResult}
 */
export function validateScoringConfiguration(scoringConfiguration) {
  const config = /** @type {Record<string, unknown>} */ (
    scoringConfiguration && typeof scoringConfiguration === 'object' ? scoringConfiguration : {}
  );

  return mergeValidationResults([
    validateScoringPointsField(
      config.correctMatchScorePoints,
      'correctMatchScorePoints',
      SCORING_VALIDATION_MESSAGES.MATCH_SCORE_POINTS_REQUIRED,
      SCORING_VALIDATION_MESSAGES.MATCH_SCORE_POINTS_INVALID,
    ),
    validateScoringPointsField(
      config.correctPenaltyWinnerPoints,
      'correctPenaltyWinnerPoints',
      SCORING_VALIDATION_MESSAGES.PENALTY_WINNER_POINTS_REQUIRED,
      SCORING_VALIDATION_MESSAGES.PENALTY_WINNER_POINTS_INVALID,
    ),
  ]);
}

/**
 * @param {unknown} value
 * @returns {TournamentValidationResult}
 */
export function validatePredictionLockMinutes(value) {
  const errors = {};

  if (value === null || value === undefined || value === '') {
    errors.predictionLockMinutes = SCORING_VALIDATION_MESSAGES.PREDICTION_LOCK_MINUTES_REQUIRED;
    return { valid: false, errors };
  }

  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < PREDICTION_LOCK_MINUTES_MIN || numeric > PREDICTION_LOCK_MINUTES_MAX) {
    errors.predictionLockMinutes = SCORING_VALIDATION_MESSAGES.PREDICTION_LOCK_MINUTES_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} value
 * @returns {TournamentValidationResult}
 */
export function validatePredictionOpenHours(value) {
  const errors = {};

  if (value === null || value === undefined || value === '') {
    errors.predictionOpenHoursBeforeKickoff = SCORING_VALIDATION_MESSAGES.PREDICTION_OPEN_HOURS_REQUIRED;
    return { valid: false, errors };
  }

  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < PREDICTION_OPEN_HOURS_MIN || numeric > PREDICTION_OPEN_HOURS_MAX) {
    errors.predictionOpenHoursBeforeKickoff = SCORING_VALIDATION_MESSAGES.PREDICTION_OPEN_HOURS_INVALID;
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

/**
 * @param {unknown} configuration
 * @returns {TournamentValidationResult}
 */
export function validatePredictionConfiguration(configuration) {
  const config = /** @type {Record<string, unknown>} */ (
    configuration && typeof configuration === 'object' ? configuration : {}
  );

  return mergeValidationResults([
    validatePredictionLockMinutes(config.predictionLockMinutes),
    validatePredictionOpenHours(config.predictionOpenHoursBeforeKickoff),
  ]);
}

/**
 * Validates tournament create payload.
 * @param {Record<string, unknown>} data
 * @returns {TournamentValidationResult}
 */
export function validateCreatePayload(data) {
  const configuration = /** @type {Record<string, unknown>} */ (data.configuration ?? {});

  return mergeValidationResults([
    validateName(data.name),
    validateTimezone(configuration.timezone ?? DEFAULT_TOURNAMENT_TIMEZONE),
    validateScoringConfiguration(configuration.scoringConfiguration),
    validatePredictionConfiguration(configuration),
  ]);
}

/**
 * Validates tournament update payload.
 * @param {Record<string, unknown>} data
 * @param {{ status?: string, archived?: boolean }} [current]
 * @returns {TournamentValidationResult}
 */
export function validateUpdatePayload(data, current = {}) {
  if (!TournamentDomain.canEditTournament(
    current.status ?? TOURNAMENT_STATUS.DRAFT,
    Boolean(current.archived),
  )) {
    return {
      valid: false,
      errors: { form: TOURNAMENT_VALIDATION_MESSAGES.CANNOT_EDIT },
    };
  }

  return validateCreatePayload(data);
}

/**
 * Validates a lifecycle action against current tournament state.
 * @param {string} action
 * @param {{ status?: string, archived?: boolean }} tournament
 * @returns {TournamentValidationResult}
 */
export function validateLifecycleAction(action, tournament) {
  const status = tournament.status ?? TOURNAMENT_STATUS.DRAFT;
  const errors = {};

  switch (action) {
    case LIFECYCLE_ACTIONS.PUBLISH:
      if (!TournamentDomain.canPublishTournament(status)) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    case LIFECYCLE_ACTIONS.GO_LIVE:
      if (!TournamentDomain.canGoLive(status)) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    case LIFECYCLE_ACTIONS.COMPLETE:
      if (!TournamentDomain.canCompleteTournament(status)) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    case LIFECYCLE_ACTIONS.ARCHIVE:
      if (!TournamentDomain.canArchiveTournament(status)) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    case LIFECYCLE_ACTIONS.RESTORE:
      if (!(TournamentDomain.canRestoreTournament(status) || tournament.archived)) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    case LIFECYCLE_ACTIONS.SET_ACTIVE:
      if (status === TOURNAMENT_STATUS.ARCHIVED || tournament.archived) {
        errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
      }
      break;
    default:
      errors.lifecycle = TOURNAMENT_VALIDATION_MESSAGES.LIFECYCLE_INVALID;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Returns the most helpful user-facing message from a validation result.
 * @param {{ errors?: Record<string, string> }} [validation]
 * @returns {string}
 */
export function getTournamentValidationMessage(validation) {
  const errors = validation?.errors ?? {};
  const messages = Object.values(errors).filter((message) => typeof message === 'string' && message.trim());

  if (messages.length === 1) {
    return messages[0];
  }

  if (messages.length > 1) {
    return TOURNAMENT_MESSAGES.VALIDATION_SUMMARY;
  }

  return TOURNAMENT_MESSAGES.VALIDATION_SUMMARY;
}

/**
 * Applies validation errors to a tournament form.
 * @param {HTMLElement} form
 * @param {Record<string, string>} errors
 * @returns {void}
 */
export function applyFormErrors(form, errors) {
  form.querySelectorAll('.is-invalid').forEach((el) => {
    el.classList.remove('is-invalid');
  });

  form.querySelectorAll('.invalid-feedback').forEach((el) => {
    el.textContent = '';
    el.classList.remove('ptw-invalid-feedback--visible');
    el.style.display = '';
  });

  Object.entries(errors).forEach(([field, message]) => {
    const input = form.querySelector(`[name="${field}"]`)
      ?? form.querySelector(`#ptw-tournament-${field}`);
    const errorEl = form.querySelector(`#ptw-tournament-${field}-error`)
      ?? (input?.id ? form.querySelector(`#${input.id}-error`) : null);

    if (input instanceof HTMLElement) {
      input.classList.add('is-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    if (errorEl instanceof HTMLElement) {
      errorEl.textContent = message;
      errorEl.classList.add('ptw-invalid-feedback--visible');
    }
  });

  const firstInvalid = form.querySelector('.is-invalid');

  if (firstInvalid instanceof HTMLElement) {
    firstInvalid.focus();
  }
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDateValue(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' && value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return /** @type {import('firebase/firestore').Timestamp} */ (value).toDate();
  }

  return null;
}
