/**
 * @fileoverview Prediction domain — pure business rules for prediction workflows.
 * @module domain/prediction.domain
 */

/** @enum {string} */
export const PENALTY_WINNER = Object.freeze({
  HOME: 'HOME',
  AWAY: 'AWAY',
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
   * @param {string} matchFormat
   * @returns {boolean}
   */
  requiresWinner(matchFormat) {
    return matchFormat === 'knockout' || matchFormat === 'group';
  },

  /**
   * @param {number|null|undefined} homeScore
   * @param {number|null|undefined} awayScore
   * @param {boolean} allowsDraw
   * @returns {boolean}
   */
  validatePenaltyWorkflow(homeScore, awayScore, allowsDraw) {
    const result = this.validatePredictionScores({
      homeScore,
      awayScore,
      isPenaltyShootout: false,
      penaltyWinner: null,
      canEndInDraw: allowsDraw,
    });

    return result.valid;
  },

  /**
   * Determines if winner selection should be shown when scores are equal.
   * @param {number|null|undefined} homeScore
   * @param {number|null|undefined} awayScore
   * @param {boolean} requireWinnerForDraw - Tournament configuration flag
   * @returns {boolean}
   */
  shouldShowWinnerSelection(homeScore, awayScore, requireWinnerForDraw) {
    if (!requireWinnerForDraw) {
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
   * @param {boolean} [params.isPenaltyShootout] - Legacy parameter
   * @param {string|null|undefined} [params.penaltyWinner]
   * @param {boolean} [params.requireWinnerForDraw] - Tournament configuration
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  validatePredictionScores({
    homeScore,
    awayScore,
    isPenaltyShootout = false,
    penaltyWinner = null,
    requireWinnerForDraw = false,
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
    if (!requireWinnerForDraw) {
      return { valid: true, errors: {} };
    }

    // If scores are not equal, prediction is valid (winner implied)
    if (home !== away) {
      return { valid: true, errors: {} };
    }

    // Scores are equal and winner required - check for winner selection
    if (!isPenaltyShootout) {
      errors.penalty = 'Equal scores require selecting a winner.';
      return { valid: false, errors };
    }

    if (!penaltyWinner || !Object.values(PENALTY_WINNER).includes(penaltyWinner)) {
      errors.penaltyWinner = 'Winner selection is required when scores are equal.';
      return { valid: false, errors };
    }

    return { valid: true, errors: {} };
  },
};

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidScore(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}
