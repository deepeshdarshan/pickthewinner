/**
 * @fileoverview Match document normalization — shared between service layers.
 * @module match/match.normalize
 */

import { MatchDomain } from '../domain/match.domain.js';
import { createDefaultMatchFields } from './match.constants.js';

/**
 * @typedef {Object} CustomScoringConfig
 * @property {boolean} useCustomPoints
 * @property {number} correctMatchScorePoints
 * @property {number} correctPenaltyWinnerPoints
 */

/**
 * @typedef {Object} PredictionOverride
 * @property {boolean} isActive
 * @property {string} status
 * @property {import('firebase/firestore').Timestamp|Date} timestamp
 * @property {string} performedBy
 * @property {string} [reason]
 */

/**
 * @param {unknown} value
 * @returns {PredictionOverride|null}
 */
export function normalizePredictionOverride(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const override = /** @type {Record<string, unknown>} */ (value);

  if (!override.isActive) {
    return null;
  }

  return {
    isActive: Boolean(override.isActive),
    status: String(override.status ?? ''),
    timestamp: override.timestamp ?? null,
    performedBy: String(override.performedBy ?? ''),
    reason: override.reason ? String(override.reason) : undefined,
  };
}

/**
 * @param {Record<string, unknown>} data
 * @returns {CustomScoringConfig|null}
 */
export function normalizeCustomScoringConfig(data) {
  const directConfig = data.customScoringConfig;
  const legacyUseCustomPoints = Boolean(data.useCustomPoints);
  const legacyCustomPoints = data.customPoints;

  /** @type {Record<string, unknown>|null} */
  let source = null;

  if (directConfig && typeof directConfig === 'object') {
    source = /** @type {Record<string, unknown>} */ (directConfig);
  } else if (legacyUseCustomPoints || (legacyCustomPoints && typeof legacyCustomPoints === 'object')) {
    source = {
      useCustomPoints: legacyUseCustomPoints,
      ...(legacyCustomPoints && typeof legacyCustomPoints === 'object' ? /** @type {Record<string, unknown>} */ (legacyCustomPoints) : {}),
    };
  }

  if (!source) {
    return null;
  }

  const normalized = MatchDomain.normalizeCustomScoringConfig(source);

  if (!normalized.useCustomPoints) {
    return null;
  }

  if (normalized.correctMatchScorePoints === null || normalized.correctPenaltyWinnerPoints === null) {
    return null;
  }

  return {
    useCustomPoints: true,
    correctMatchScorePoints: normalized.correctMatchScorePoints,
    correctPenaltyWinnerPoints: normalized.correctPenaltyWinnerPoints,
  };
}

/**
 * @param {string} id
 * @param {Record<string, unknown>} data
 * @returns {import('./match.service.js').Match}
 */
export function normalizeMatchDocument(id, data) {
  const defaults = createDefaultMatchFields();

  return {
    id,
    tournamentId: String(data.tournamentId ?? ''),
    matchNumber: Number(data.matchNumber ?? 0),
    round: String(data.round ?? ''),
    stage: String(data.stage ?? ''),
    homeTeamId: String(data.homeTeamId ?? ''),
    awayTeamId: String(data.awayTeamId ?? ''),
    kickoffUtc: data.kickoffUtc ?? null,
    status: MatchDomain.normalizeStatus(String(data.status ?? defaults.status)),
    visible: Boolean(data.visible),
    result: /** @type {Record<string, unknown>|null} */ (data.result ?? null),
    scoringStatus: data.scoringStatus ? String(data.scoringStatus) : null,
    customScoringConfig: normalizeCustomScoringConfig(data),
    predictionOverride: normalizePredictionOverride(data.predictionOverride),
    createdBy: String(data.createdBy ?? ''),
    updatedBy: String(data.updatedBy ?? ''),
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}
