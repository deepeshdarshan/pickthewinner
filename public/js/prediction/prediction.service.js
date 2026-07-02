/**
 * @fileoverview Prediction service — read and score update operations.
 * @module prediction/prediction.service
 */

import {
  getPredictionForUser as getPredictionForUserRepo,
  listPredictionsByMatch,
} from './prediction.repository.js';

/**
 * @param {string} matchId
 * @param {string} userId
 * @returns {Promise<Record<string, unknown>|null>}
 */
export async function getPredictionForUser(matchId, userId) {
  return getPredictionForUserRepo(matchId, userId);
}

/**
 * @param {string} matchId
 * @returns {Promise<Record<string, unknown>[]>}
 */
export async function listByMatch(matchId) {
  return listPredictionsByMatch(matchId);
}
