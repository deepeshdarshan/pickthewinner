/**
 * @fileoverview Validation for prediction history query params and access.
 * @module prediction/history/prediction-history.validator
 */

import {
  PREDICTION_HISTORY_VIEW,
  PREDICTION_HISTORY_SORT_FIELD,
  PREDICTION_HISTORY_RESULT_FILTER,
  PREDICTION_HISTORY_DATE_RANGE,
  PREDICTION_HISTORY_MATCH_STATUS,
  PREDICTION_HISTORY_SCOPE,
  PREDICTION_HISTORY_DEFAULT_PAGE_SIZE,
  PREDICTION_HISTORY_PAGE_SIZE_OPTIONS,
} from './prediction-history.constants.js';

/**
 * @typedef {Object} PredictionHistoryQueryParams
 * @property {string} view
 * @property {string} tournamentId
 * @property {string} stage
 * @property {string} matchStatus
 * @property {string} resultFilter
 * @property {string} dateRange
 * @property {string} search
 * @property {string} sortField
 * @property {'asc'|'desc'} sortDirection
 * @property {number} page
 * @property {number} pageSize
 * @property {string} predictionId
 * @property {string} scope
 */

/**
 * @param {URLSearchParams} params
 * @returns {PredictionHistoryQueryParams}
 */
export function parseHistoryQueryParams(params) {
  const view = Object.values(PREDICTION_HISTORY_VIEW).includes(/** @type {string} */ (params.get('view')))
    ? String(params.get('view'))
    : PREDICTION_HISTORY_VIEW.TIMELINE;

  const sortField = Object.values(PREDICTION_HISTORY_SORT_FIELD).includes(/** @type {string} */ (params.get('sort')))
    ? String(params.get('sort'))
    : PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE;

  const sortDirection = params.get('dir') === 'asc' ? 'asc' : 'desc';

  const rawPageSize = Number(params.get('size'));
  const pageSize = PREDICTION_HISTORY_PAGE_SIZE_OPTIONS.includes(rawPageSize)
    ? rawPageSize
    : PREDICTION_HISTORY_DEFAULT_PAGE_SIZE;

  const rawPage = Number(params.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;

  const resultFilter = Object.values(PREDICTION_HISTORY_RESULT_FILTER).includes(/** @type {string} */ (params.get('result')))
    ? String(params.get('result'))
    : PREDICTION_HISTORY_RESULT_FILTER.ALL;

  const dateRange = Object.values(PREDICTION_HISTORY_DATE_RANGE).includes(/** @type {string} */ (params.get('date')))
    ? String(params.get('date'))
    : PREDICTION_HISTORY_DATE_RANGE.ALL;

  const matchStatus = Object.values(PREDICTION_HISTORY_MATCH_STATUS).includes(/** @type {string} */ (params.get('status')))
    ? String(params.get('status'))
    : PREDICTION_HISTORY_MATCH_STATUS.ALL;

  const search = String(params.get('search') ?? '').trim().slice(0, 200);

  const scope = Object.values(PREDICTION_HISTORY_SCOPE).includes(/** @type {string} */ (params.get('scope')))
    ? String(params.get('scope'))
    : PREDICTION_HISTORY_SCOPE.ACTIVE;

  return {
    view,
    tournamentId: String(params.get('tournament') ?? '').trim(),
    stage: String(params.get('stage') ?? '').trim(),
    matchStatus,
    resultFilter,
    dateRange,
    search,
    sortField,
    sortDirection,
    page,
    pageSize,
    predictionId: String(params.get('id') ?? '').trim(),
    scope,
  };
}

/**
 * @param {PredictionHistoryQueryParams} queryParams
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateHistoryQueryParams(queryParams) {
  const errors = {};

  if (queryParams.search.length > 200) {
    errors.search = 'Search term is too long.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Ensures the authenticated user matches the requested userId.
 * @param {string|null|undefined} authUserId
 * @param {string} requestedUserId
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateUserAccess(authUserId, requestedUserId) {
  if (!authUserId) {
    return { valid: false, error: 'Authentication required.' };
  }

  if (authUserId !== requestedUserId) {
    return { valid: false, error: 'Permission denied.' };
  }

  return { valid: true };
}

/**
 * @param {Record<string, unknown>|null} prediction
 * @param {string} userId
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePredictionOwnership(prediction, userId) {
  if (!prediction) {
    return { valid: false, error: 'Prediction not found.' };
  }

  if (String(prediction.userId) !== userId) {
    return { valid: false, error: 'Permission denied.' };
  }

  return { valid: true };
}

/**
 * Builds a query string from history params.
 * @param {Partial<PredictionHistoryQueryParams>} params
 * @returns {string}
 */
export function buildHistoryQueryString(params) {
  const searchParams = new URLSearchParams();

  if (params.predictionId) {
    searchParams.set('id', params.predictionId);
    return `?${searchParams.toString()}`;
  }

  if (params.view && params.view !== PREDICTION_HISTORY_VIEW.TIMELINE) {
    searchParams.set('view', params.view);
  }

  if (params.scope && params.scope !== PREDICTION_HISTORY_SCOPE.ACTIVE) {
    searchParams.set('scope', params.scope);
  }

  if (params.tournamentId) {
    searchParams.set('tournament', params.tournamentId);
  }

  if (params.stage) {
    searchParams.set('stage', params.stage);
  }

  if (params.matchStatus && params.matchStatus !== PREDICTION_HISTORY_MATCH_STATUS.ALL) {
    searchParams.set('status', params.matchStatus);
  }

  if (params.resultFilter && params.resultFilter !== PREDICTION_HISTORY_RESULT_FILTER.ALL) {
    searchParams.set('result', params.resultFilter);
  }

  if (params.dateRange && params.dateRange !== PREDICTION_HISTORY_DATE_RANGE.ALL) {
    searchParams.set('date', params.dateRange);
  }

  if (params.search) {
    searchParams.set('search', params.search);
  }

  if (params.sortField && params.sortField !== PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE) {
    searchParams.set('sort', params.sortField);
  }

  if (params.sortDirection === 'asc') {
    searchParams.set('dir', 'asc');
  }

  if (params.page && params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  if (params.pageSize && params.pageSize !== PREDICTION_HISTORY_DEFAULT_PAGE_SIZE) {
    searchParams.set('size', String(params.pageSize));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
