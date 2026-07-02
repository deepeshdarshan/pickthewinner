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
   * @param {number|null|undefined} homeScore
   * @param {number|null|undefined} awayScore
   * @param {boolean} canEndInDraw
   * @returns {boolean}
   */
  shouldShowPenaltySection(homeScore, awayScore, canEndInDraw) {
    if (canEndInDraw) {
      return false;
    }

    if (!isValidScore(homeScore) || !isValidScore(awayScore)) {
      return false;
    }

    return homeScore === awayScore;
  },

  /**
   * Validates prediction scores including penalty shootout workflow.
   * Never accepts penalty goal scores — only penalty winner selection.
   * @param {Object} params
   * @param {number|null|undefined} params.homeScore
   * @param {number|null|undefined} params.awayScore
   * @param {boolean} [params.isPenaltyShootout]
   * @param {string|null|undefined} [params.penaltyWinner]
   * @param {boolean} [params.canEndInDraw]
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  validatePredictionScores({
    homeScore,
    awayScore,
    isPenaltyShootout = false,
    penaltyWinner = null,
    canEndInDraw = false,
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

    if (canEndInDraw) {
      return { valid: true, errors: {} };
    }

    if (home !== away) {
      return { valid: true, errors: {} };
    }

    if (!isPenaltyShootout) {
      errors.penalty = 'Equal scores require selecting penalty shootout.';
      return { valid: false, errors };
    }

    if (!penaltyWinner || !Object.values(PENALTY_WINNER).includes(penaltyWinner)) {
      errors.penaltyWinner = 'Penalty winner is required when scores are equal.';
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
