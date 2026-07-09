import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseHistoryQueryParams,
  validateUserAccess,
  validatePredictionOwnership,
  buildHistoryQueryString,
} from '../public/js/prediction/history/prediction-history.validator.js';
import {
  PREDICTION_HISTORY_VIEW,
  PREDICTION_HISTORY_DEFAULT_PAGE_SIZE,
  PREDICTION_HISTORY_MESSAGES,
  PREDICTION_HISTORY_SCOPE,
} from '../public/js/prediction/history/prediction-history.constants.js';

describe('prediction-history.validator', () => {
  it('parses query params with defaults', () => {
    const params = parseHistoryQueryParams(new URLSearchParams());
    assert.equal(params.view, PREDICTION_HISTORY_VIEW.TIMELINE);
    assert.equal(params.page, 1);
    assert.equal(params.pageSize, PREDICTION_HISTORY_DEFAULT_PAGE_SIZE);
    assert.equal(params.scope, PREDICTION_HISTORY_SCOPE.ACTIVE);
  });

  it('parses custom query params', () => {
    const params = parseHistoryQueryParams(new URLSearchParams(
      'view=card&tournament=t1&result=winner_correct&page=2&size=25&sort=points&id=p1&scope=archived',
    ));
    assert.equal(params.view, 'card');
    assert.equal(params.tournamentId, 't1');
    assert.equal(params.resultFilter, 'winner_correct');
    assert.equal(params.page, 2);
    assert.equal(params.pageSize, 25);
    assert.equal(params.predictionId, 'p1');
    assert.equal(params.scope, PREDICTION_HISTORY_SCOPE.ARCHIVED);
  });

  it('validates user access', () => {
    assert.equal(validateUserAccess(null, 'u1').valid, false);
    assert.equal(validateUserAccess('u1', 'u2').valid, false);
    assert.equal(validateUserAccess('u1', 'u1').valid, true);
  });

  it('validates prediction ownership without leaking existence', () => {
    assert.equal(validatePredictionOwnership(null, 'u1').valid, false);
    assert.equal(validatePredictionOwnership({ userId: 'u2' }, 'u1').valid, false);
    assert.equal(validatePredictionOwnership({ userId: 'u1' }, 'u1').valid, true);
  });

  it('builds query strings', () => {
    const query = buildHistoryQueryString({
      view: 'table',
      tournamentId: 't1',
      page: 3,
      pageSize: 50,
    });
    assert.match(query, /view=table/);
    assert.match(query, /tournament=t1/);
    assert.match(query, /page=3/);
    assert.match(query, /size=50/);
    assert.doesNotMatch(query, /scope=/);
  });

  it('builds query strings with archived scope', () => {
    const query = buildHistoryQueryString({
      scope: PREDICTION_HISTORY_SCOPE.ARCHIVED,
      page: 2,
    });
    assert.match(query, /scope=archived/);
    assert.match(query, /page=2/);
  });
});

describe('PredictionHistoryService error mapping contract', () => {
  it('documents expected user-facing error messages', () => {
    assert.equal(PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED, 'You do not have permission to view this prediction.');
    assert.equal(PREDICTION_HISTORY_MESSAGES.NOT_FOUND, 'Prediction not found.');
    assert.equal(PREDICTION_HISTORY_MESSAGES.NETWORK_ERROR, 'Network error. Check your connection and try again.');
  });

  it('rejects mismatched user access at validator layer', () => {
    const result = validateUserAccess('u2', 'u1');
    assert.equal(result.valid, false);
    assert.match(result.error ?? '', /Permission denied/i);
  });
});
