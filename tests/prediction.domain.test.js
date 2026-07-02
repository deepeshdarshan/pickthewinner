import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionDomain, PENALTY_WINNER } from '../public/js/domain/prediction.domain.js';

describe('PredictionDomain penalty workflow', () => {
  it('hides penalty section when draw is allowed', () => {
    assert.equal(PredictionDomain.shouldShowPenaltySection(1, 1, true), false);
  });

  it('shows penalty section for equal knockout scores', () => {
    assert.equal(PredictionDomain.shouldShowPenaltySection(2, 2, false), true);
    assert.equal(PredictionDomain.shouldShowPenaltySection(2, 1, false), false);
  });

  it('rejects equal knockout scores without penalty selection', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      isPenaltyShootout: false,
      penaltyWinner: null,
      canEndInDraw: false,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.penalty);
  });

  it('accepts equal knockout scores with penalty winner', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      isPenaltyShootout: true,
      penaltyWinner: PENALTY_WINNER.HOME,
      canEndInDraw: false,
    });

    assert.equal(result.valid, true);
  });

  it('accepts different knockout scores without penalty data', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 2,
      awayScore: 1,
      isPenaltyShootout: false,
      penaltyWinner: null,
      canEndInDraw: false,
    });

    assert.equal(result.valid, true);
  });
});
