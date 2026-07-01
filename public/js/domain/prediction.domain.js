/**
 * @fileoverview Prediction domain — pure business rules for prediction workflows.
 * @module domain/prediction.domain
 */

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
    if (homeScore === null || homeScore === undefined || awayScore === null || awayScore === undefined) {
      return false;
    }

    if (allowsDraw) {
      return true;
    }

    return homeScore !== awayScore;
  },
};
