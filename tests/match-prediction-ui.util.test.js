import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CONTESTANT_PREDICTION_UI_STATUS,
  getContestantPredictionUiStatus,
  isPredictionNotYetOpen,
  renderContestantPredictionActionButtons,
  resolveContestantViewDetailsHref,
  resolvePredictionUiStatusFromCountdownPhase,
} from '../public/js/match/match-prediction-ui.util.js';
import { MATCH_STATUS } from '../public/js/domain/match.domain.js';
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

  it('does not treat Closed prediction status as pre-open without PRE_OPEN countdown phase', () => {
    const match = {
      predictionStatus: 'Closed',
      status: MATCH_STATUS.COMPLETED,
      matchCountdown: null,
      result: { published: true },
    };

    assert.equal(isPredictionNotYetOpen(match), false);
    assert.equal(
      getContestantPredictionUiStatus(match, { locked: false }),
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

describe('resolvePredictionUiStatusFromCountdownPhase', () => {
  it('maps PRE_OPEN to OPENS_SOON when no prediction exists', () => {
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.PRE_OPEN, {
        predictionExists: false,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON,
    );
  });

  it('maps OPEN to PENDING when no prediction exists', () => {
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.OPEN, {
        predictionExists: false,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.PENDING,
    );
  });

  it('maps OPEN to SUBMITTED when a prediction exists', () => {
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.OPEN, {
        predictionExists: true,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED,
    );
  });

  it('maps CLOSED and HIDDEN to LOCKED', () => {
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.CLOSED, {
        predictionExists: false,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.LOCKED,
    );
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.HIDDEN, {
        predictionExists: true,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.LOCKED,
    );
  });

  it('returns LOCKED when prediction is locked regardless of phase', () => {
    assert.equal(
      resolvePredictionUiStatusFromCountdownPhase(MATCH_COUNTDOWN_PHASE.OPEN, {
        predictionExists: true,
        predictionLocked: true,
      }),
      CONTESTANT_PREDICTION_UI_STATUS.LOCKED,
    );
  });
});

describe('resolveContestantViewDetailsHref', () => {
  it('links to prediction history detail when prediction id is available', () => {
    assert.equal(
      resolveContestantViewDetailsHref('match-1', 'pred-abc'),
      '/predictions/history?id=pred-abc',
    );
  });

  it('falls back to match detail when prediction id is missing', () => {
    assert.equal(
      resolveContestantViewDetailsHref('match-1'),
      '/matches?id=match-1',
    );
  });
});

describe('renderContestantPredictionActionButtons', () => {
  it('renders View Details linking to prediction history for published results', () => {
    const html = renderContestantPredictionActionButtons({
      matchId: 'match-1',
      predictionId: 'pred-abc',
      predictionStatus: CONTESTANT_PREDICTION_UI_STATUS.LOCKED,
      resultPublished: true,
    });

    assert.match(html, /href="\/predictions\/history\?id=pred-abc"/);
    assert.match(html, /View Details/);
  });
});
