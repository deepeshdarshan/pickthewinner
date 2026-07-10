import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionManagementDomain, resolvePrimaryResultBadge, resolveResultBadges, shouldShowPenaltyWinnerForPublishedResult } from '../public/js/domain/prediction-management.domain.js';
import {
  PREDICTION_ADMIN_STATUS,
  PREDICTION_SORT_FIELD,
} from '../public/js/prediction/admin/prediction-management.constants.js';
import { MATCH_STATUS, WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

const samplePredictions = [
  {
    id: 'p1',
    userId: 'u1',
    matchId: 'm1',
    homeScore: 2,
    awayScore: 1,
    status: 'saved',
    submittedAt: new Date('2026-06-01T10:00:00Z'),
    updatedAt: new Date('2026-06-01T10:00:00Z'),
    contestant: { displayName: 'Alice', email: 'alice@example.com' },
    match: {
      id: 'm1',
      stage: 'Final',
      kickoffUtc: new Date('2026-06-10T18:00:00Z'),
      homeTeam: { name: 'Argentina' },
      awayTeam: { name: 'France' },
    },
  },
  {
    id: 'p2',
    userId: 'u2',
    matchId: 'm2',
    homeScore: 1,
    awayScore: 1,
    predictedWinner: 'AWAY',
    status: 'locked',
    locked: true,
    submittedAt: new Date('2026-06-02T10:00:00Z'),
    updatedAt: new Date('2026-06-03T10:00:00Z'),
    contestant: { displayName: 'Bob', email: 'bob@example.com' },
    match: {
      id: 'm2',
      round: 'Semi Final',
      kickoffUtc: new Date('2026-06-05T18:00:00Z'),
      homeTeam: { name: 'Brazil' },
      awayTeam: { name: 'Germany' },
    },
  },
];

describe('PredictionManagementDomain', () => {
  it('resolves display status for saved and locked predictions', () => {
    assert.equal(
      PredictionManagementDomain.resolveDisplayStatus({ status: 'saved' }),
      PREDICTION_ADMIN_STATUS.SUBMITTED,
    );
    assert.equal(
      PredictionManagementDomain.resolveDisplayStatus({ locked: true, status: 'saved' }),
      PREDICTION_ADMIN_STATUS.LOCKED,
    );
    assert.equal(
      PredictionManagementDomain.resolveDisplayStatus({ scored: true }),
      PREDICTION_ADMIN_STATUS.SCORED,
    );
  });

  it('filters predictions by match, contestant, stage, and status', () => {
    const enriched = samplePredictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
    }));

    const byMatch = PredictionManagementDomain.filterPredictions(enriched, { matchId: 'm1' });
    assert.equal(byMatch.length, 1);
    assert.equal(byMatch[0].id, 'p1');

    const byContestant = PredictionManagementDomain.filterPredictions(enriched, { contestantId: 'u2' });
    assert.equal(byContestant.length, 1);

    const byStage = PredictionManagementDomain.filterPredictions(enriched, { stage: 'Final' });
    assert.equal(byStage.length, 1);

    const byStatus = PredictionManagementDomain.filterPredictions(enriched, {
      status: PREDICTION_ADMIN_STATUS.LOCKED,
    });
    assert.equal(byStatus.length, 1);
    assert.equal(byStatus[0].id, 'p2');
  });

  it('searches predictions case-insensitively', () => {
    const enriched = samplePredictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
      predictedWinnerName: PredictionManagementDomain.resolvePredictedWinnerName(
        prediction,
        prediction.match,
      ),
    }));

    const results = PredictionManagementDomain.filterPredictions(enriched, { search: 'argentina' });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'p1');
  });

  it('sorts predictions by contestant name', () => {
    const enriched = samplePredictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
    }));

    const sorted = PredictionManagementDomain.sortPredictions(
      enriched,
      PREDICTION_SORT_FIELD.CONTESTANT,
      'asc',
    );

    assert.equal(sorted[0].contestant.displayName, 'Alice');
    assert.equal(sorted[1].contestant.displayName, 'Bob');
  });

  it('sorts predictions by submission time ascending', () => {
    const enriched = samplePredictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
    }));

    const sorted = PredictionManagementDomain.sortPredictions(
      enriched,
      PREDICTION_SORT_FIELD.SUBMITTED_AT,
      'asc',
    );

    assert.equal(sorted[0].id, 'p1');
    assert.equal(sorted[1].id, 'p2');
  });

  it('sorts predictions by points descending', () => {
    const enriched = [
      { ...samplePredictions[0], calculatedPoints: 3 },
      { ...samplePredictions[1], calculatedPoints: 10 },
    ];

    const sorted = PredictionManagementDomain.sortPredictions(
      enriched,
      PREDICTION_SORT_FIELD.POINTS,
      'desc',
    );

    assert.equal(sorted[0].calculatedPoints, 10);
    assert.equal(sorted[1].calculatedPoints, 3);
  });

  it('paginates predictions', () => {
    const page = PredictionManagementDomain.paginatePredictions(samplePredictions, 1, 1);
    assert.equal(page.pageItems.length, 1);
    assert.equal(page.totalPages, 2);
    assert.equal(page.totalRecords, 2);
  });

  it('enriches predictions with result evaluation when published', () => {
    const match = {
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeTeam: { name: 'Argentina' },
      awayTeam: { name: 'France' },
      result: { published: true, homeScore: 2, awayScore: 1 },
    };

    const enriched = PredictionManagementDomain.enrichPrediction({
      homeScore: 2,
      awayScore: 1,
      status: 'scored',
      scored: true,
    }, match);

    assert.equal(enriched.winnerPredictionCorrect, true);
    assert.equal(enriched.exactScoreCorrect, true);
  });

  it('does not mark winner correct when team is right but score is wrong', () => {
    const match = {
      homeTeamId: 'home',
      awayTeamId: 'away',
      homeTeam: { name: 'France' },
      awayTeam: { name: 'Morocco' },
      result: {
        published: true,
        homeScore: 2,
        awayScore: 1,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      },
    };

    const enriched = PredictionManagementDomain.enrichPrediction({
      homeScore: 2,
      awayScore: 0,
      status: 'scored',
      scored: true,
    }, match);

    assert.equal(enriched.winnerPredictionCorrect, false);
    assert.equal(enriched.exactScoreCorrect, false);
  });

  it('partitions tournaments for selector', () => {
    const { active, archived } = PredictionManagementDomain.partitionTournamentsForSelector([
      { id: '1', status: 'published' },
      { id: '2', status: 'archived', archived: true },
      { id: '3', status: 'draft' },
    ]);

    assert.equal(active.length, 1);
    assert.equal(archived.length, 1);
  });

  it('resolves result badges from published match resolution', () => {
    const penaltiesPrediction = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
      match: {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    };

    assert.deepEqual(resolveResultBadges(penaltiesPrediction), [
      { correct: true, label: 'Exact Score' },
      { correct: true, label: 'Penalty Winner' },
    ]);

    const penaltiesWrongScore = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    };

    assert.deepEqual(resolveResultBadges(penaltiesWrongScore), [
      { correct: false, label: 'Exact Score' },
      { correct: true, label: 'Penalty Winner' },
    ]);

    const scorePrediction = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    };

    assert.deepEqual(resolveResultBadges(scorePrediction), [
      { correct: false, label: 'Exact Score' },
    ]);
  });

  it('resolves primary result badge as first result badge', () => {
    const penaltiesPrediction = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    };

    assert.deepEqual(resolvePrimaryResultBadge(penaltiesPrediction), {
      correct: false,
      label: 'Exact Score',
    });

    const scorePrediction = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    };

    assert.deepEqual(resolvePrimaryResultBadge(scorePrediction), {
      correct: false,
      label: 'Exact Score',
    });
  });

  it('detects when penalty winner should be shown for published results', () => {
    assert.equal(
      shouldShowPenaltyWinnerForPublishedResult({
        published: true,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
      }),
      true,
    );
    assert.equal(
      shouldShowPenaltyWinnerForPublishedResult({
        published: true,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      }),
      false,
    );
    assert.equal(shouldShowPenaltyWinnerForPublishedResult({ published: false }), false);
  });
});
