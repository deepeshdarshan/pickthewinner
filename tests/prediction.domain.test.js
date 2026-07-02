import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionDomain, PENALTY_WINNER } from '../public/js/domain/prediction.domain.js';

describe('PredictionDomain winner selection workflow', () => {
  it('hides winner selection when draws do not require winner', () => {
    assert.equal(PredictionDomain.shouldShowWinnerSelection(1, 1, false), false);
  });

  it('shows winner selection for equal scores when required', () => {
    assert.equal(PredictionDomain.shouldShowWinnerSelection(2, 2, true), true);
    assert.equal(PredictionDomain.shouldShowWinnerSelection(2, 1, true), false);
  });

  it('rejects equal scores without winner selection when required', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      isPenaltyShootout: false,
      penaltyWinner: null,
      requireWinnerForDraw: true,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.penalty);
  });

  it('accepts equal scores with winner when required', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      isPenaltyShootout: true,
      penaltyWinner: PENALTY_WINNER.HOME,
      requireWinnerForDraw: true,
    });

    assert.equal(result.valid, true);
  });

  it('accepts different scores without winner data', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 2,
      awayScore: 1,
      isPenaltyShootout: false,
      penaltyWinner: null,
      requireWinnerForDraw: true,
    });

    assert.equal(result.valid, true);
  });

  it('accepts equal scores without winner when draws allowed', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      isPenaltyShootout: false,
      penaltyWinner: null,
      requireWinnerForDraw: false,
    });

    assert.equal(result.valid, true);
  });
});
