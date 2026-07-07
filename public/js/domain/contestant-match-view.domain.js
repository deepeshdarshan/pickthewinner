/**
 * @fileoverview Contestant match visibility rules for predictions, history, and browse views.
 * @module domain/contestant-match-view.domain
 */

import { MATCH_STATUS } from './match.domain.js';

/** @type {ReadonlySet<string>} */
const COMPLETED_MATCH_STATUSES = new Set([
  MATCH_STATUS.COMPLETED,
  MATCH_STATUS.RESULT_PUBLISHED,
  MATCH_STATUS.ARCHIVED,
]);

/**
 * @param {Record<string, unknown>|null|undefined} match
 * @returns {boolean}
 */
export function isResultPublished(match) {
  return match?.result?.published === true;
}

/**
 * @param {Record<string, unknown>|null|undefined} match
 * @returns {boolean}
 */
export function isMatchCompletedForContestant(match) {
  if (!match) {
    return false;
  }

  if (isResultPublished(match)) {
    return true;
  }

  const status = String(match.status ?? '');
  return COMPLETED_MATCH_STATUSES.has(status);
}

/**
 * @param {unknown} prediction
 * @returns {boolean}
 */
export function hasUserPrediction(prediction) {
  return prediction !== null && prediction !== undefined;
}

/**
 * @param {Record<string, unknown>} match
 * @param {unknown} prediction
 * @returns {boolean}
 */
export function isEligibleForMyPredictions(match, prediction) {
  return hasUserPrediction(prediction) && !isResultPublished(match);
}

/**
 * @param {Record<string, unknown>} match
 * @param {unknown} prediction
 * @returns {boolean}
 */
export function isEligibleForPredictionHistory(match, prediction) {
  return hasUserPrediction(prediction) && isResultPublished(match);
}

/**
 * @param {Record<string, unknown>} match
 * @param {unknown} prediction
 * @returns {boolean}
 */
export function shouldShowOnTournamentDetail(match, prediction) {
  if (isResultPublished(match)) {
    return false;
  }

  if (isMatchCompletedForContestant(match) && !hasUserPrediction(prediction)) {
    return false;
  }

  return true;
}

/**
 * @param {Array<Record<string, unknown>>} matches
 * @param {Map<string, unknown>|Record<string, unknown>} predictionsMap
 * @returns {Array<Record<string, unknown>>}
 */
export function filterMyPredictionMatches(matches, predictionsMap) {
  return matches.filter((match) => {
    const prediction = resolvePrediction(predictionsMap, match.id);
    return isEligibleForMyPredictions(match, prediction);
  });
}

/**
 * @param {Array<Record<string, unknown>>} items
 * @returns {Array<Record<string, unknown>>}
 */
export function filterHistoryItems(items) {
  return items.filter((item) => {
    const match = /** @type {Record<string, unknown>} */ (item.match ?? {});
    return isEligibleForPredictionHistory(match, item);
  });
}

/**
 * @param {Map<string, unknown>|Record<string, unknown>} predictionsMap
 * @param {string} matchId
 * @returns {unknown}
 */
function resolvePrediction(predictionsMap, matchId) {
  const normalizedMatchId = String(matchId ?? '');

  if (predictionsMap instanceof Map) {
    return predictionsMap.get(normalizedMatchId) ?? null;
  }

  return predictionsMap[normalizedMatchId] ?? null;
}

export const ContestantMatchViewDomain = {
  isResultPublished,
  isMatchCompletedForContestant,
  hasUserPrediction,
  isEligibleForMyPredictions,
  isEligibleForPredictionHistory,
  shouldShowOnTournamentDetail,
  filterMyPredictionMatches,
  filterHistoryItems,
};
