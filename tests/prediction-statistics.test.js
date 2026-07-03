import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionStatisticsService } from '../public/js/prediction/admin/PredictionStatisticsService.js';
import { MATCH_STATUS } from '../public/js/domain/match.domain.js';

describe('PredictionStatisticsService', () => {
  const matches = [
    { id: 'm1', status: MATCH_STATUS.PUBLISHED, tournamentId: 't1' },
    { id: 'm2', status: MATCH_STATUS.RESULT_PUBLISHED, tournamentId: 't1', result: { published: true, homeScore: 2, awayScore: 1 } },
    { id: 'm3', status: MATCH_STATUS.DRAFT, tournamentId: 't1' },
  ];

  const predictions = [
    {
      id: 'p1',
      userId: 'u1',
      matchId: 'm1',
      homeScore: 2,
      awayScore: 1,
      status: 'saved',
      locked: false,
    },
    {
      id: 'p2',
      userId: 'u2',
      matchId: 'm1',
      homeScore: 1,
      awayScore: 1,
      predictedWinner: 'HOME',
      status: 'locked',
      locked: true,
    },
    {
      id: 'p3',
      userId: 'u1',
      matchId: 'm2',
      homeScore: 2,
      awayScore: 1,
      status: 'scored',
      scored: true,
      calculatedPoints: 5,
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
    },
  ];

  it('calculates tournament statistics', () => {
    const stats = PredictionStatisticsService.calculateTournamentStatistics(
      predictions,
      matches,
      3,
    );

    assert.equal(stats.totalMatches, 3);
    assert.equal(stats.publishedMatches, 2);
    assert.equal(stats.completedMatches, 1);
    assert.equal(stats.predictionsSubmitted, 3);
    assert.equal(stats.contestantsParticipating, 2);
    assert.equal(stats.expectedPredictions, 6);
    assert.equal(stats.pendingPredictions, 3);
    assert.equal(stats.lockedPredictions, 1);
  });

  it('calculates match statistics', () => {
    const match = {
      id: 'm1',
      homeTeam: { name: 'Argentina' },
      awayTeam: { name: 'France' },
    };

    const matchPredictions = predictions.filter((item) => item.matchId === 'm1');
    const stats = PredictionStatisticsService.calculateMatchStatistics(matchPredictions, match, 3);

    assert.equal(stats.totalPredictions, 2);
    assert.equal(stats.missingPredictions, 1);
    assert.ok(stats.completionPercent > 0);
    assert.equal(stats.mostPredictedScore, '2-1');
  });

  it('calculates contestant statistics', () => {
    const contestantPredictions = predictions.filter((item) => item.userId === 'u1');
    const stats = PredictionStatisticsService.calculateContestantStatistics(
      contestantPredictions,
      matches,
    );

    assert.equal(stats.predictionsSubmitted, 2);
    assert.equal(stats.currentPoints, 5);
    assert.equal(stats.correctWinners, 1);
    assert.equal(stats.exactScores, 1);
  });
});
