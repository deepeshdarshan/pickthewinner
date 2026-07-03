/**
 * @fileoverview Prediction statistics service — aggregates completion and accuracy metrics.
 * @module prediction/admin/PredictionStatisticsService
 */

import { MATCH_STATUS } from '../../domain/match.domain.js';
import { PredictionManagementDomain } from '../../domain/prediction-management.domain.js';
import { PREDICTION_ADMIN_STATUS } from './prediction-management.constants.js';

/**
 * @typedef {Object} TournamentStatistics
 * @property {number} totalMatches
 * @property {number} publishedMatches
 * @property {number} completedMatches
 * @property {number} predictionsSubmitted
 * @property {number} contestantsParticipating
 * @property {number} expectedPredictions
 * @property {number} pendingPredictions
 * @property {number} lockedPredictions
 * @property {number} averagePredictionsPerMatch
 * @property {number} completionPercent
 */

/**
 * @typedef {Object} MatchStatistics
 * @property {number} totalPredictions
 * @property {number} missingPredictions
 * @property {number} completionPercent
 * @property {string|null} mostPredictedTeam
 * @property {number} mostPredictedTeamPercent
 * @property {string|null} mostPredictedScore
 * @property {number} mostPredictedScorePercent
 * @property {number} exactScoreAccuracyPercent
 */

/**
 * @typedef {Object} ContestantStatistics
 * @property {number} predictionsSubmitted
 * @property {number} predictionsPending
 * @property {number} currentPoints
 * @property {number} accuracyPercent
 * @property {number} correctWinners
 * @property {number} exactScores
 * @property {number} scoredPredictions
 */

export const PredictionStatisticsService = {
  /**
   * @param {Array<Record<string, unknown>>} predictions
   * @param {Array<Record<string, unknown>>} matches
   * @param {number} contestantCount
   * @returns {TournamentStatistics}
   */
  calculateTournamentStatistics(predictions, matches, contestantCount) {
    const publishedMatches = matches.filter((match) => match.status !== MATCH_STATUS.DRAFT
      && match.status !== MATCH_STATUS.ARCHIVED);
    const completedMatches = matches.filter((match) => [
      MATCH_STATUS.COMPLETED,
      MATCH_STATUS.RESULT_PUBLISHED,
    ].includes(String(match.status)));

    const expectedPredictions = publishedMatches.length * contestantCount;
    const lockedPredictions = predictions.filter((item) => {
      const status = PredictionManagementDomain.resolveDisplayStatus(item);
      return status === PREDICTION_ADMIN_STATUS.LOCKED;
    }).length;

    const uniqueContestants = new Set(predictions.map((item) => item.userId)).size;
    const completionPercent = expectedPredictions > 0
      ? roundPercent((predictions.length / expectedPredictions) * 100)
      : 0;

    const averagePredictionsPerMatch = publishedMatches.length > 0
      ? roundOneDecimal(predictions.length / publishedMatches.length)
      : 0;

    return {
      totalMatches: matches.length,
      publishedMatches: publishedMatches.length,
      completedMatches: completedMatches.length,
      predictionsSubmitted: predictions.length,
      contestantsParticipating: uniqueContestants,
      expectedPredictions,
      pendingPredictions: Math.max(0, expectedPredictions - predictions.length),
      lockedPredictions,
      averagePredictionsPerMatch,
      completionPercent,
    };
  },

  /**
   * @param {Array<Record<string, unknown>>} predictions
   * @param {Record<string, unknown>} match
   * @param {number} contestantCount
   * @returns {MatchStatistics}
   */
  calculateMatchStatistics(predictions, match, contestantCount) {
    const totalPredictions = predictions.length;
    const missingPredictions = Math.max(0, contestantCount - totalPredictions);
    const completionPercent = contestantCount > 0
      ? roundPercent((totalPredictions / contestantCount) * 100)
      : 0;

    const teamCounts = new Map();
    const scoreCounts = new Map();
    let exactScoreCorrect = 0;
    let scoredCount = 0;
    const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
    const hasResult = Boolean(result.published);

    for (const prediction of predictions) {
      const winnerName = PredictionManagementDomain.resolvePredictedWinnerName(prediction, match);
      if (winnerName) {
        teamCounts.set(winnerName, (teamCounts.get(winnerName) ?? 0) + 1);
      }

      const scoreKey = `${prediction.homeScore}-${prediction.awayScore}`;
      scoreCounts.set(scoreKey, (scoreCounts.get(scoreKey) ?? 0) + 1);

      if (hasResult) {
        scoredCount += 1;
        if (Number(prediction.homeScore) === Number(result.homeScore)
          && Number(prediction.awayScore) === Number(result.awayScore)) {
          exactScoreCorrect += 1;
        }
      }
    }

    const mostPredictedTeam = getTopEntry(teamCounts);
    const mostPredictedScore = getTopEntry(scoreCounts);

    return {
      totalPredictions,
      missingPredictions,
      completionPercent,
      mostPredictedTeam: mostPredictedTeam?.key ?? null,
      mostPredictedTeamPercent: mostPredictedTeam
        ? roundPercent((mostPredictedTeam.count / totalPredictions) * 100)
        : 0,
      mostPredictedScore: mostPredictedScore?.key ?? null,
      mostPredictedScorePercent: mostPredictedScore
        ? roundPercent((mostPredictedScore.count / totalPredictions) * 100)
        : 0,
      exactScoreAccuracyPercent: scoredCount > 0
        ? roundPercent((exactScoreCorrect / scoredCount) * 100)
        : 0,
    };
  },

  /**
   * @param {Array<Record<string, unknown>>} predictions
   * @param {Array<Record<string, unknown>>} matches
   * @returns {ContestantStatistics}
   */
  calculateContestantStatistics(predictions, matches) {
    const matchMap = new Map(matches.map((match) => [match.id, match]));
    const publishedMatchCount = matches.filter((match) => match.status !== MATCH_STATUS.DRAFT
      && match.status !== MATCH_STATUS.ARCHIVED).length;

    let currentPoints = 0;
    let correctWinners = 0;
    let exactScores = 0;
    let scoredPredictions = 0;

    for (const prediction of predictions) {
      currentPoints += Number(prediction.calculatedPoints ?? 0);
      const match = matchMap.get(prediction.matchId) ?? {};
      const result = /** @type {Record<string, unknown>} */ (match.result ?? {});

      if (!result.published) {
        continue;
      }

      scoredPredictions += 1;

      if (prediction.winnerPredictionCorrect) {
        correctWinners += 1;
      }

      if (prediction.exactScoreCorrect) {
        exactScores += 1;
      }
    }

    const accuracyPercent = scoredPredictions > 0
      ? roundPercent((correctWinners / scoredPredictions) * 100)
      : 0;

    return {
      predictionsSubmitted: predictions.length,
      predictionsPending: Math.max(0, publishedMatchCount - predictions.length),
      currentPoints,
      accuracyPercent,
      correctWinners,
      exactScores,
      scoredPredictions,
    };
  },
};

/**
 * @param {Map<string, number>} counts
 * @returns {{ key: string, count: number }|null}
 */
function getTopEntry(counts) {
  let top = null;

  for (const [key, count] of counts.entries()) {
    if (!top || count > top.count) {
      top = { key, count };
    }
  }

  return top;
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundPercent(value) {
  return Math.round(value * 10) / 10;
}

/**
 * @param {number} value
 * @returns {number}
 */
function roundOneDecimal(value) {
  return Math.round(value * 10) / 10;
}
