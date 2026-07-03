/**
 * @fileoverview Prediction management domain — pure filter, search, sort, and validation rules.
 * @module domain/prediction-management.domain
 */

import { PREDICTION_STATUS, PredictionDomain, PENALTY_WINNER } from './prediction.domain.js';
import { TOURNAMENT_STATUS } from './tournament.domain.js';
import {
  PREDICTION_ADMIN_STATUS,
  PREDICTION_SORT_FIELD,
  PREDICTION_LIST_PAGE_SIZE,
} from '../prediction/admin/prediction-management.constants.js';

/**
 * @typedef {Object} EnrichedPrediction
 * @property {string} id
 * @property {string} userId
 * @property {string} matchId
 * @property {string} tournamentId
 * @property {number} homeScore
 * @property {number} awayScore
 * @property {string|null} [predictedWinner]
 * @property {string} status
 * @property {boolean} [locked]
 * @property {boolean} [scored]
 * @property {unknown} [submittedAt]
 * @property {unknown} [updatedAt]
 * @property {number} [calculatedPoints]
 * @property {Record<string, unknown>} [contestant]
 * @property {Record<string, unknown>} [match]
 * @property {Record<string, unknown>} [tournament]
 * @property {string} [displayStatus]
 * @property {string|null} [predictedWinnerName]
 * @property {boolean|null} [winnerPredictionCorrect]
 * @property {boolean|null} [exactScoreCorrect]
 */

/**
 * @typedef {Object} PredictionFilterState
 * @property {string} [search]
 * @property {string} [matchId]
 * @property {string} [stage]
 * @property {string} [contestantId]
 * @property {string} [status]
 */

export const PredictionManagementDomain = {
  /**
   * Filters tournaments for the admin selector (published, live, completed; archived separate).
   * @param {Array<Record<string, unknown>>} tournaments
   * @returns {{ active: Array<Record<string, unknown>>, archived: Array<Record<string, unknown>> }}
   */
  partitionTournamentsForSelector(tournaments) {
    const active = [];
    const archived = [];

    for (const tournament of tournaments) {
      if (tournament.status === TOURNAMENT_STATUS.ARCHIVED || tournament.archived) {
        archived.push(tournament);
        continue;
      }

      if ([
        TOURNAMENT_STATUS.PUBLISHED,
        TOURNAMENT_STATUS.LIVE,
        TOURNAMENT_STATUS.COMPLETED,
      ].includes(String(tournament.status))) {
        active.push(tournament);
      }
    }

    return { active, archived };
  },

  /**
   * Maps stored prediction status to admin display status.
   * @param {Record<string, unknown>} prediction
   * @returns {string}
   */
  resolveDisplayStatus(prediction) {
    if (prediction.scored || prediction.status === PREDICTION_STATUS.SCORED) {
      return PREDICTION_ADMIN_STATUS.SCORED;
    }

    if (prediction.locked || prediction.status === PREDICTION_STATUS.LOCKED) {
      return PREDICTION_ADMIN_STATUS.LOCKED;
    }

    if (prediction.status === PREDICTION_STATUS.UPDATED) {
      return PREDICTION_ADMIN_STATUS.UPDATED;
    }

    if ([PREDICTION_STATUS.SAVED, 'saved', 'submitted'].includes(String(prediction.status))) {
      return PREDICTION_ADMIN_STATUS.SUBMITTED;
    }

    return PREDICTION_ADMIN_STATUS.SUBMITTED;
  },

  /**
   * Resolves predicted winner display name from match teams.
   * @param {Record<string, unknown>} prediction
   * @param {Record<string, unknown>} [match]
   * @returns {string|null}
   */
  resolvePredictedWinnerName(prediction, match = {}) {
    const side = PredictionDomain.resolvePredictedWinnerSide(prediction);

    if (side === PENALTY_WINNER.HOME) {
      return String(match.homeTeam?.name ?? match.homeTeamName ?? 'Home');
    }

    if (side === PENALTY_WINNER.AWAY) {
      return String(match.awayTeam?.name ?? match.awayTeamName ?? 'Away');
    }

    return null;
  },

  /**
   * Enriches a prediction with computed display fields.
   * @param {Record<string, unknown>} prediction
   * @param {Record<string, unknown>} [match]
   * @returns {EnrichedPrediction}
   */
  enrichPrediction(prediction, match = {}) {
    const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
    const hasResult = Boolean(result.published);

    let winnerPredictionCorrect = null;
    let exactScoreCorrect = null;

    if (hasResult) {
      winnerPredictionCorrect = PredictionDomain.isWinnerPredictionCorrect(prediction, result, match);
      exactScoreCorrect = Number(prediction.homeScore) === Number(result.homeScore)
        && Number(prediction.awayScore) === Number(result.awayScore);
    }

    return {
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
      predictedWinnerName: PredictionManagementDomain.resolvePredictedWinnerName(prediction, match),
      winnerPredictionCorrect,
      exactScoreCorrect,
    };
  },

  /**
   * @param {EnrichedPrediction[]} predictions
   * @param {PredictionFilterState} filters
   * @returns {EnrichedPrediction[]}
   */
  filterPredictions(predictions, filters) {
    const term = filters.search?.trim().toLowerCase() ?? '';

    return predictions.filter((prediction) => {
      if (filters.matchId && prediction.matchId !== filters.matchId) {
        return false;
      }

      if (filters.contestantId && prediction.userId !== filters.contestantId) {
        return false;
      }

      if (filters.stage) {
        const stage = String(prediction.match?.stage ?? prediction.match?.round ?? '');
        if (stage !== filters.stage) {
          return false;
        }
      }

      if (filters.status) {
        const displayStatus = prediction.displayStatus
          ?? PredictionManagementDomain.resolveDisplayStatus(prediction);
        if (displayStatus !== filters.status) {
          return false;
        }
      }

      if (term && !matchesSearchTerm(prediction, term)) {
        return false;
      }

      return true;
    });
  },

  /**
   * @param {EnrichedPrediction[]} predictions
   * @param {string} field
   * @param {'asc'|'desc'} [direction]
   * @returns {EnrichedPrediction[]}
   */
  sortPredictions(predictions, field, direction = 'desc') {
    const sorted = [...predictions].sort((left, right) => {
      let comparison = 0;

      switch (field) {
        case PREDICTION_SORT_FIELD.MATCH_DATE:
          comparison = toTime(left.match?.kickoffUtc) - toTime(right.match?.kickoffUtc);
          break;
        case PREDICTION_SORT_FIELD.CONTESTANT:
          comparison = getContestantName(left).localeCompare(getContestantName(right));
          break;
        case PREDICTION_SORT_FIELD.SUBMITTED_AT:
          comparison = toTime(left.submittedAt) - toTime(right.submittedAt);
          break;
        case PREDICTION_SORT_FIELD.UPDATED_AT:
          comparison = toTime(left.updatedAt) - toTime(right.updatedAt);
          break;
        case PREDICTION_SORT_FIELD.STATUS:
          comparison = String(left.displayStatus).localeCompare(String(right.displayStatus));
          break;
        default:
          comparison = toTime(left.submittedAt) - toTime(right.submittedAt);
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  },

  /**
   * @param {EnrichedPrediction[]} predictions
   * @param {number} page
   * @param {number} [pageSize]
   * @returns {{ pageItems: EnrichedPrediction[], totalPages: number, currentPage: number, totalRecords: number }}
   */
  paginatePredictions(predictions, page, pageSize = PREDICTION_LIST_PAGE_SIZE) {
    const totalRecords = predictions.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
      pageItems: predictions.slice(start, start + pageSize),
      totalPages,
      currentPage,
      totalRecords,
    };
  },

  /**
   * Validates filter state for admin queries.
   * @param {PredictionFilterState} filters
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  validateFilters(filters) {
    const errors = {};

    if (filters.search && filters.search.length > 200) {
      errors.search = 'Search term is too long.';
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  },
};

/**
 * @param {EnrichedPrediction} prediction
 * @param {string} term
 * @returns {boolean}
 */
function matchesSearchTerm(prediction, term) {
  const contestant = prediction.contestant ?? {};
  const match = prediction.match ?? {};
  const haystack = [
    contestant.displayName,
    contestant.fullName,
    contestant.email,
    match.homeTeam?.name,
    match.awayTeam?.name,
    match.stage,
    match.round,
    prediction.predictedWinnerName,
    `${prediction.homeScore}-${prediction.awayScore}`,
  ].filter(Boolean).join(' ').toLowerCase();

  return haystack.includes(term);
}

/**
 * @param {EnrichedPrediction} prediction
 * @returns {string}
 */
function getContestantName(prediction) {
  const contestant = prediction.contestant ?? {};
  return String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? '');
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toTime(value) {
  if (!value) {
    return 0;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}
