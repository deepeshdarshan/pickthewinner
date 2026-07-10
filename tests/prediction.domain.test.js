import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionDomain, PENALTY_WINNER } from '../public/js/domain/prediction.domain.js';
import { WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

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
      predictedWinner: null,
      requireWinnerSelectionForDrawPrediction: true,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.predictedWinner);
  });

  it('accepts equal scores with winner when required', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      predictedWinner: PENALTY_WINNER.HOME,
      requireWinnerSelectionForDrawPrediction: true,
    });

    assert.equal(result.valid, true);
  });

  it('accepts different scores without winner data', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 2,
      awayScore: 1,
      predictedWinner: null,
      requireWinnerSelectionForDrawPrediction: true,
    });

    assert.equal(result.valid, true);
  });

  it('rejects different scores with winner selection', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 2,
      awayScore: 1,
      predictedWinner: PENALTY_WINNER.HOME,
      requireWinnerSelectionForDrawPrediction: true,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.predictedWinner);
  });

  it('accepts equal scores without winner when draws allowed', () => {
    const result = PredictionDomain.validatePredictionScores({
      homeScore: 1,
      awayScore: 1,
      predictedWinner: null,
      requireWinnerSelectionForDrawPrediction: false,
    });

    assert.equal(result.valid, true);
  });
});

describe('PredictionDomain winner result evaluation', () => {
  const match = {
    homeTeamId: 'home-team',
    awayTeamId: 'away-team',
    homeTeam: { name: 'Argentina' },
    awayTeam: { name: 'France' },
  };

  it('marks draw winner correct when predicted winner matches official winner', () => {
    const prediction = { homeScore: 3, awayScore: 3, predictedWinner: PENALTY_WINNER.HOME };
    const result = {
      homeScore: 3,
      awayScore: 3,
      winnerResolution: WINNER_RESOLUTION.PENALTIES,
      winningTeamId: 'home-team',
    };

    assert.equal(PredictionDomain.isWinnerPredictionCorrect(prediction, result, match), true);
    assert.equal(PredictionDomain.resolveResultWinnerName(result, match), 'Argentina');
  });

  it('marks draw winner incorrect when predicted winner differs', () => {
    const prediction = { homeScore: 3, awayScore: 3, predictedWinner: PENALTY_WINNER.AWAY };
    const result = {
      homeScore: 3,
      awayScore: 3,
      winnerResolution: WINNER_RESOLUTION.PENALTIES,
      winningTeamId: 'home-team',
    };

    assert.equal(PredictionDomain.isWinnerPredictionCorrect(prediction, result, match), false);
  });

  it('marks league-style draw predictions correct without winner selection', () => {
    const prediction = { homeScore: 1, awayScore: 1 };
    const result = { homeScore: 1, awayScore: 1 };

    assert.equal(PredictionDomain.isWinnerPredictionCorrect(prediction, result, match), true);
    assert.equal(PredictionDomain.resolveResultWinnerName(result, match), null);
  });

  it('compares non-draw winners from score direction', () => {
    const prediction = { homeScore: 2, awayScore: 1 };
    const result = { homeScore: 2, awayScore: 0, winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME };

    assert.equal(PredictionDomain.isWinnerPredictionCorrect(prediction, result, match), true);
  });

  it('ignores winningTeamId for normal time plus extra time resolution', () => {
    const prediction = { homeScore: 2, awayScore: 3 };
    const result = {
      homeScore: 2,
      awayScore: 3,
      winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      winningTeamId: 'home-team',
    };

    assert.equal(PredictionDomain.resolveResultWinnerSide(result, match), PENALTY_WINNER.AWAY);
    assert.equal(PredictionDomain.isWinnerPredictionCorrect(prediction, result, match), true);
    assert.equal(PredictionDomain.resolveResultWinnerName(result, match), 'France');
  });
});

describe('PredictionDomain.isWinnerStatCorrect', () => {
  const match = {
    homeTeamId: 'home-team',
    awayTeamId: 'away-team',
    homeTeam: { name: 'France' },
    awayTeam: { name: 'Morocco' },
  };

  it('requires exact score for normal time results', () => {
    const exactPrediction = { homeScore: 2, awayScore: 1 };
    const wrongScorePrediction = { homeScore: 2, awayScore: 0 };
    const result = {
      homeScore: 2,
      awayScore: 1,
      winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
    };

    assert.equal(PredictionDomain.isWinnerStatCorrect(exactPrediction, result, match), true);
    assert.equal(PredictionDomain.isWinnerStatCorrect(wrongScorePrediction, result, match), false);
  });

  it('uses penalty winner comparison for penalty results', () => {
    const correctPenaltyWinner = { homeScore: 1, awayScore: 1, predictedWinner: PENALTY_WINNER.HOME };
    const wrongPenaltyWinner = { homeScore: 1, awayScore: 1, predictedWinner: PENALTY_WINNER.AWAY };
    const result = {
      homeScore: 1,
      awayScore: 1,
      winnerResolution: WINNER_RESOLUTION.PENALTIES,
      winningTeamId: 'home-team',
    };

    assert.equal(PredictionDomain.isWinnerStatCorrect(correctPenaltyWinner, result, match), true);
    assert.equal(PredictionDomain.isWinnerStatCorrect(wrongPenaltyWinner, result, match), false);
  });

  it('does not count penalty winner correct when exact score wrong and penalty pick wrong', () => {
    const prediction = { homeScore: 2, awayScore: 2, predictedWinner: PENALTY_WINNER.AWAY };
    const result = {
      homeScore: 1,
      awayScore: 1,
      winnerResolution: WINNER_RESOLUTION.PENALTIES,
      winningTeamId: 'home-team',
    };

    assert.equal(PredictionDomain.isWinnerStatCorrect(prediction, result, match), false);
  });
});
