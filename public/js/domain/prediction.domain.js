/**
 * @fileoverview Prediction domain — pure business rules for prediction workflows.
 * @module domain/prediction.domain
 */

import { WINNER_RESOLUTION } from './match.domain.js';

/** @enum {string} */
export const PENALTY_WINNER = Object.freeze({
  HOME: 'HOME',
  AWAY: 'AWAY',
});

/** @enum {string} */
export const PREDICTION_STATUS = Object.freeze({
  NOT_AVAILABLE: 'not_available',
  OPEN: 'open',
  SAVED: 'saved',
  UPDATED: 'updated',
  LOCKED: 'locked',
  SCORED: 'scored',
  ARCHIVED: 'archived',
});

export const PredictionDomain = {
  /**
   * @param {boolean} isLocked
   * @param {boolean} hasExistingPrediction
   * @returns {boolean}
   */
  canPredict(isLocked, hasExistingPrediction = false) {
    if (isLocked) {
      return false;
    }

    return !hasExistingPrediction;
  },

  /**
   * @param {boolean} isLocked
   * @returns {boolean}
   */
  canEditPrediction(isLocked) {
    return !isLocked;
  },

  /**
   * Determines if winner selection should be shown when scores are equal.
   * @param {number|null|undefined} homeScore
   * @param {number|null|undefined} awayScore
   * @param {boolean} requireWinnerSelectionForDrawPrediction - Tournament configuration flag
   * @returns {boolean}
   */
  shouldShowWinnerSelection(homeScore, awayScore, requireWinnerSelectionForDrawPrediction) {
    if (!requireWinnerSelectionForDrawPrediction) {
      return false;  // Draws are valid without winner selection
    }

    if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
      return false;
    }

    return homeScore === awayScore;
  },

  /**
   * Validates prediction scores including winner selection workflow.
   * Never accepts penalty goal scores — only winner selection when required.
   * @param {Object} params
   * @param {number|null|undefined} params.homeScore
   * @param {number|null|undefined} params.awayScore
   * @param {string|null|undefined} [params.predictedWinner]
   * @param {boolean} [params.requireWinnerSelectionForDrawPrediction] - Tournament configuration
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  validatePredictionScores({
    homeScore,
    awayScore,
    predictedWinner = null,
    requireWinnerSelectionForDrawPrediction = false,
  }) {
    const errors = {};

    if (!isValidScore(homeScore)) {
      errors.homeScore = 'Home score is required.';
    }

    if (!isValidScore(awayScore)) {
      errors.awayScore = 'Away score is required.';
    }

    if (Object.keys(errors).length > 0) {
      return { valid: false, errors };
    }

    const home = Number(homeScore);
    const away = Number(awayScore);

    if (home < 0 || away < 0) {
      errors.homeScore = errors.homeScore ?? 'Scores must be zero or greater.';
      return { valid: false, errors };
    }

    // If draws don't require winner selection, prediction is valid
    if (!requireWinnerSelectionForDrawPrediction) {
      // Winner selection should not be provided when draws are allowed
      if (predictedWinner && home !== away) {
        errors.predictedWinner = 'Winner selection is only valid when scores are equal.';
        return { valid: false, errors };
      }
      return { valid: true, errors: {} };
    }

    // If scores are not equal, prediction is valid (winner implied)
    if (home !== away) {
      // Winner selection should not be provided when scores differ
      if (predictedWinner) {
        errors.predictedWinner = 'Winner selection is only valid when scores are equal.';
        return { valid: false, errors };
      }
      return { valid: true, errors: {} };
    }

    // Scores are equal and winner required - check for winner selection
    if (!predictedWinner || !Object.values(PENALTY_WINNER).includes(predictedWinner)) {
      errors.predictedWinner = 'Winner selection is required when scores are equal.';
      return { valid: false, errors };
    }

    return { valid: true, errors: {} };
  },

  /**
   * Resolves the official winner side from a published match result.
   * @param {Record<string, unknown>} result
   * @param {{ homeTeamId?: string, awayTeamId?: string }} match
   * @returns {string|null} 'HOME', 'AWAY', or null for a true draw
   */
  resolveResultWinnerSide(result, match) {
    if (String(result.winnerResolution) === WINNER_RESOLUTION.PENALTIES) {
      const winnerId = String(result.winningTeamId ?? '');

      if (winnerId === String(match.homeTeamId ?? '')) {
        return PENALTY_WINNER.HOME;
      }

      if (winnerId === String(match.awayTeamId ?? '')) {
        return PENALTY_WINNER.AWAY;
      }

      return null;
    }

    const homeScore = Number(result.homeScore ?? 0);
    const awayScore = Number(result.awayScore ?? 0);

    if (homeScore > awayScore) {
      return PENALTY_WINNER.HOME;
    }

    if (awayScore > homeScore) {
      return PENALTY_WINNER.AWAY;
    }

    return null;
  },

  /**
   * Resolves the predicted winner side from scores and optional winner selection.
   * @param {Record<string, unknown>} prediction
   * @returns {string|null}
   */
  resolvePredictedWinnerSide(prediction) {
    const homeScore = Number(prediction.homeScore ?? 0);
    const awayScore = Number(prediction.awayScore ?? 0);
    const predictedWinner = prediction.predictedWinner ?? prediction.penaltyWinner ?? null;

    if (homeScore > awayScore) {
      return PENALTY_WINNER.HOME;
    }

    if (awayScore > homeScore) {
      return PENALTY_WINNER.AWAY;
    }

    return predictedWinner ? String(predictedWinner) : null;
  },

  /**
   * Returns whether the contestant correctly predicted the match winner.
   * @param {Record<string, unknown>|null} prediction
   * @param {Record<string, unknown>|null} result
   * @param {{ homeTeamId?: string, awayTeamId?: string }} match
   * @returns {boolean}
   */
  isWinnerPredictionCorrect(prediction, result, match) {
    if (!prediction || !result) {
      return false;
    }

    const actualSide = PredictionDomain.resolveResultWinnerSide(result, match);
    const predictedSide = PredictionDomain.resolvePredictedWinnerSide(prediction);

    if (!actualSide) {
      const homeScore = Number(prediction.homeScore ?? 0);
      const awayScore = Number(prediction.awayScore ?? 0);
      return homeScore === awayScore && !predictedSide;
    }

    return predictedSide === actualSide;
  },

  /**
   * Resolves the display name for the official match winner.
   * @param {Record<string, unknown>} result
   * @param {{ homeTeamId?: string, awayTeamId?: string, homeTeam?: { name?: string }, awayTeam?: { name?: string } }} match
   * @returns {string|null}
   */
  resolveResultWinnerName(result, match) {
    const side = PredictionDomain.resolveResultWinnerSide(result, match);

    if (side === PENALTY_WINNER.HOME) {
      return match.homeTeam?.name ?? 'Home';
    }

    if (side === PENALTY_WINNER.AWAY) {
      return match.awayTeam?.name ?? 'Away';
    }

    return null;
  },
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidScore(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}
