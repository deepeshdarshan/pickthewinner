import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ScoringDomain } from '../public/js/scoring/scoring.domain.js';
import { WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';
import { PENALTY_WINNER } from '../public/js/domain/prediction.domain.js';

describe('ScoringDomain', () => {
  it('awards match score points for exact score', () => {
    const evaluation = ScoringDomain.evaluatePrediction(
      { homeScore: 2, awayScore: 1 },
      { homeScore: 2, awayScore: 1, winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME },
      { correctMatchScorePoints: 10, correctPenaltyWinnerPoints: 5 },
    );

    assert.equal(evaluation.totalPoints, 10);
    assert.equal(evaluation.breakdown[0].correct, true);
  });

  it('awards penalty winner points when applicable', () => {
    const evaluation = ScoringDomain.evaluatePrediction(
      {
        homeScore: 2,
        awayScore: 2,
        penaltyWinner: PENALTY_WINNER.HOME,
      },
      {
        homeScore: 2,
        awayScore: 2,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
        winningTeamId: 'home-team',
        homeTeamId: 'home-team',
        awayTeamId: 'away-team',
      },
      { correctMatchScorePoints: 10, correctPenaltyWinnerPoints: 5 },
    );

    assert.equal(evaluation.totalPoints, 15);
  });

  it('awards penalty winner points using predictedWinner field', () => {
    const evaluation = ScoringDomain.evaluatePrediction(
      {
        homeScore: 2,
        awayScore: 2,
        predictedWinner: PENALTY_WINNER.HOME,
      },
      {
        homeScore: 2,
        awayScore: 2,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
        winningTeamId: 'home-team',
        homeTeamId: 'home-team',
        awayTeamId: 'away-team',
      },
      { correctMatchScorePoints: 10, correctPenaltyWinnerPoints: 5 },
    );

    assert.equal(evaluation.totalPoints, 15);
  });

  it('does not award penalty points for normal time resolution even with winningTeamId set', () => {
    const evaluation = ScoringDomain.evaluatePrediction(
      {
        homeScore: 2,
        awayScore: 3,
        predictedWinner: PENALTY_WINNER.HOME,
      },
      {
        homeScore: 2,
        awayScore: 3,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        winningTeamId: 'home-team',
        homeTeamId: 'home-team',
        awayTeamId: 'away-team',
      },
      { correctMatchScorePoints: 10, correctPenaltyWinnerPoints: 5 },
    );

    assert.equal(evaluation.totalPoints, 10);
    assert.equal(evaluation.breakdown.length, 1);
  });

  it('uses provided point configuration values for scoring', () => {
    const evaluation = ScoringDomain.evaluatePrediction(
      {
        homeScore: 1,
        awayScore: 1,
        predictedWinner: PENALTY_WINNER.AWAY,
      },
      {
        homeScore: 1,
        awayScore: 1,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
        winningTeamId: 'away-team',
        homeTeamId: 'home-team',
        awayTeamId: 'away-team',
      },
      { correctMatchScorePoints: 25, correctPenaltyWinnerPoints: 12 },
    );

    assert.equal(evaluation.totalPoints, 37);
    assert.deepEqual(
      evaluation.breakdown.map((item) => item.points),
      [25, 12],
    );
  });

  it('detects penalty winner scoring applicability from result resolution', () => {
    assert.equal(
      ScoringDomain.isPenaltyWinnerScoringApplicable({ winnerResolution: WINNER_RESOLUTION.PENALTIES }),
      true,
    );
    assert.equal(
      ScoringDomain.isPenaltyWinnerScoringApplicable({ winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME }),
      false,
    );
    assert.equal(ScoringDomain.isPenaltyWinnerScoringApplicable({}), false);
  });

  describe('resolveEffectiveScoringConfig', () => {
    const tournamentScoring = {
      correctMatchScorePoints: 10,
      correctPenaltyWinnerPoints: 5,
    };

    it('returns tournament defaults when match has no custom override', () => {
      const config = ScoringDomain.resolveEffectiveScoringConfig(
        { customScoringConfig: null },
        tournamentScoring,
        true,
      );

      assert.deepEqual(config, {
        correctMatchScorePoints: 10,
        correctPenaltyWinnerPoints: 5,
        source: 'tournament',
        showPenaltyWinnerPoints: true,
      });
    });

    it('returns match override when useCustomPoints is valid', () => {
      const config = ScoringDomain.resolveEffectiveScoringConfig(
        {
          customScoringConfig: {
            useCustomPoints: true,
            correctMatchScorePoints: 20,
            correctPenaltyWinnerPoints: 8,
          },
        },
        tournamentScoring,
        false,
      );

      assert.deepEqual(config, {
        correctMatchScorePoints: 20,
        correctPenaltyWinnerPoints: 8,
        source: 'match',
        showPenaltyWinnerPoints: false,
      });
    });

    it('falls back to tournament when custom override values are invalid', () => {
      const config = ScoringDomain.resolveEffectiveScoringConfig(
        {
          customScoringConfig: {
            useCustomPoints: true,
            correctMatchScorePoints: 101,
            correctPenaltyWinnerPoints: 5,
          },
        },
        tournamentScoring,
        true,
      );

      assert.deepEqual(config, {
        correctMatchScorePoints: 10,
        correctPenaltyWinnerPoints: 5,
        source: 'tournament',
        showPenaltyWinnerPoints: true,
      });
    });

    it('returns null when tournament scoring configuration is incomplete', () => {
      const config = ScoringDomain.resolveEffectiveScoringConfig(
        { customScoringConfig: null },
        { correctMatchScorePoints: 10 },
        true,
      );

      assert.equal(config, null);
    });

    it('hides penalty row flag when tournament does not require winner selection', () => {
      const config = ScoringDomain.resolveEffectiveScoringConfig(
        { customScoringConfig: null },
        tournamentScoring,
        false,
      );

      assert.equal(config?.showPenaltyWinnerPoints, false);
    });
  });
});
