/**
 * @fileoverview Scoring domain — pure prediction evaluation rules.
 * @module scoring/scoring.domain
 */

import { WINNER_RESOLUTION } from '../domain/match.domain.js';
import { PENALTY_WINNER } from '../domain/prediction.domain.js';

/**
 * @typedef {Object} ScoringBreakdownItem
 * @property {string} label
 * @property {number} points
 * @property {boolean} correct
 */

/**
 * @typedef {Object} ScoringEvaluation
 * @property {number} totalPoints
 * @property {ScoringBreakdownItem[]} breakdown
 */

export const ScoringDomain = {
  /**
   * @param {Record<string, unknown>} prediction
   * @param {Record<string, unknown>} result
   * @param {{ correctMatchScorePoints: number, correctPenaltyWinnerPoints: number }} config
   * @returns {ScoringEvaluation}
   */
  evaluatePrediction(prediction, result, config) {
    const breakdown = [];
    let totalPoints = 0;

    const homeScoreMatch = Number(prediction.homeScore) === Number(result.homeScore);
    const awayScoreMatch = Number(prediction.awayScore) === Number(result.awayScore);
    const scorePoints = homeScoreMatch && awayScoreMatch ? config.correctMatchScorePoints : 0;

    breakdown.push({
      label: 'Correct Match Score',
      points: scorePoints,
      correct: scorePoints > 0,
    });
    totalPoints += scorePoints;

    if (String(result.winnerResolution) === WINNER_RESOLUTION.PENALTIES) {
      const predictedWinner = String(prediction.penaltyWinner ?? '');
      const actualWinner = resolvePenaltyWinner(result);
      const penaltyPoints = predictedWinner && predictedWinner === actualWinner
        ? config.correctPenaltyWinnerPoints
        : 0;

      breakdown.push({
        label: 'Correct Penalty Winner',
        points: penaltyPoints,
        correct: penaltyPoints > 0,
      });
      totalPoints += penaltyPoints;
    }

    return { totalPoints, breakdown };
  },
};

/**
 * @param {Record<string, unknown>} result
 * @returns {string}
 */
function resolvePenaltyWinner(result) {
  const winningTeamId = String(result.winningTeamId ?? '');

  if (!winningTeamId) {
    return '';
  }

  if (winningTeamId === String(result.homeTeamId ?? '')) {
    return PENALTY_WINNER.HOME;
  }

  if (winningTeamId === String(result.awayTeamId ?? '')) {
    return PENALTY_WINNER.AWAY;
  }

  return '';
}
