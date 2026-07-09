import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTESTANT_PREDICTION_UI_STATUS,
  getContestantPredictionUiStatus,
  isPredictionNotYetOpen,
} from '../public/js/match/match-prediction-ui.util.js';
import { MATCH_COUNTDOWN_PHASE } from '../public/js/domain/match.domain.js';

describe('match-prediction-ui.util', () => {
  it('detects pre-open matches from Closed prediction status', () => {
    const match = {
      predictionStatus: 'Closed',
      matchCountdown: { phase: MATCH_COUNTDOWN_PHASE.PRE_OPEN },
    };

    assert.equal(isPredictionNotYetOpen(match), true);
    assert.equal(
      getContestantPredictionUiStatus(match, null),
      CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON,
    );
  });

  it('detects locked matches after prediction window closes', () => {
    const match = {
      predictionStatus: 'Locked',
      matchCountdown: null,
    };

    assert.equal(isPredictionNotYetOpen(match), false);
    assert.equal(
      getContestantPredictionUiStatus(match, null),
      CONTESTANT_PREDICTION_UI_STATUS.LOCKED,
    );
  });

  it('returns pending when window is open without a prediction', () => {
    const match = { predictionStatus: 'Open' };

    assert.equal(
      getContestantPredictionUiStatus(match, null),
      CONTESTANT_PREDICTION_UI_STATUS.PENDING,
    );
  });
});
