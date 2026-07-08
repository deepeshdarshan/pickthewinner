import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionHistoryDomain, resolvePrimaryResultBadge, resolveResultBadges } from '../public/js/domain/prediction-history.domain.js';
import {
  PREDICTION_HISTORY_RESULT_FILTER,
  PREDICTION_HISTORY_DATE_RANGE,
  PREDICTION_HISTORY_MATCH_STATUS,
  PREDICTION_HISTORY_SORT_FIELD,
  PREDICTION_LIFECYCLE_STEP,
} from '../public/js/prediction/history/prediction-history.constants.js';
import { MATCH_STATUS, WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

const sampleItems = [
  {
    id: 'p1',
    userId: 'u1',
    matchId: 'm1',
    tournamentId: 't1',
    homeScore: 2,
    awayScore: 1,
    calculatedPoints: 8,
    winnerPredictionCorrect: true,
    exactScoreCorrect: true,
    scoringBreakdown: [
      { label: 'Winner', points: 3, correct: true },
      { label: 'Exact Score Bonus', points: 5, correct: true },
    ],
    match: {
      id: 'm1',
      kickoffUtc: new Date('2026-06-28T18:00:00Z'),
      stage: 'Round of 16',
      matchNumber: 12,
      status: MATCH_STATUS.RESULT_PUBLISHED,
      homeTeam: { name: 'Brazil' },
      awayTeam: { name: 'Colombia' },
      result: { published: true, homeScore: 2, awayScore: 1 },
    },
    tournament: { id: 't1', name: 'FIFA World Cup 2026', status: 'LIVE' },
  },
  {
    id: 'p2',
    userId: 'u1',
    matchId: 'm2',
    tournamentId: 't2',
    homeScore: 1,
    awayScore: 1,
    calculatedPoints: 0,
    winnerPredictionCorrect: false,
    exactScoreCorrect: false,
    match: {
      id: 'm2',
      kickoffUtc: new Date('2026-05-10T18:00:00Z'),
      round: 'Quarter Finals',
      matchNumber: 4,
      status: MATCH_STATUS.PUBLISHED,
      homeTeam: { name: 'France' },
      awayTeam: { name: 'Germany' },
      result: { published: false },
    },
    tournament: { id: 't2', name: 'UEFA Champions League', status: 'COMPLETED' },
  },
  {
    id: 'p3',
    userId: 'u1',
    matchId: 'm3',
    tournamentId: 't1',
    homeScore: 0,
    awayScore: 2,
    calculatedPoints: 3,
    winnerPredictionCorrect: true,
    exactScoreCorrect: false,
    locked: true,
    match: {
      id: 'm3',
      kickoffUtc: new Date('2026-06-02T18:00:00Z'),
      stage: 'Group Stage',
      homeTeam: { name: 'Argentina' },
      awayTeam: { name: 'Mexico' },
      result: { published: true, homeScore: 0, awayScore: 2 },
    },
    tournament: { id: 't1', name: 'FIFA World Cup 2026', status: 'LIVE' },
  },
];

describe('PredictionHistoryDomain', () => {
  it('filters by tournament, stage, match status, and result', () => {
    const byTournament = PredictionHistoryDomain.filterHistoryItems(sampleItems, { tournamentId: 't1' });
    assert.equal(byTournament.length, 2);

    const byStage = PredictionHistoryDomain.filterHistoryItems(sampleItems, { stage: 'Round of 16' });
    assert.equal(byStage.length, 1);
    assert.equal(byStage[0].id, 'p1');

    const completed = PredictionHistoryDomain.filterHistoryItems(sampleItems, {
      matchStatus: PREDICTION_HISTORY_MATCH_STATUS.COMPLETED,
    });
    assert.equal(completed.length, 2);

    const winnerCorrect = PredictionHistoryDomain.filterHistoryItems(sampleItems, {
      resultFilter: PREDICTION_HISTORY_RESULT_FILTER.WINNER_CORRECT,
    });
    assert.equal(winnerCorrect.length, 2);
  });

  it('searches case-insensitively across tournament and team names', () => {
    const results = PredictionHistoryDomain.searchHistoryItems(sampleItems, 'brazil');
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 'p1');

    const byNumber = PredictionHistoryDomain.searchHistoryItems(sampleItems, '12');
    assert.equal(byNumber.length, 1);
  });

  it('sorts by match date, points, and tournament', () => {
    const byDate = PredictionHistoryDomain.sortHistoryItems(
      sampleItems,
      PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE,
      'asc',
    );
    assert.equal(byDate[0].id, 'p2');

    const byPoints = PredictionHistoryDomain.sortHistoryItems(
      sampleItems,
      PREDICTION_HISTORY_SORT_FIELD.POINTS,
      'desc',
    );
    assert.equal(byPoints[0].id, 'p1');

    const byTournament = PredictionHistoryDomain.sortHistoryItems(
      sampleItems,
      PREDICTION_HISTORY_SORT_FIELD.TOURNAMENT,
      'asc',
    );
    assert.equal(byTournament[0].tournamentId, 't1');
  });

  it('groups by month and paginates', () => {
    const groups = PredictionHistoryDomain.groupByMonth(sampleItems);
    assert.ok(groups.length >= 2);

    const pagination = PredictionHistoryDomain.paginateHistoryItems(sampleItems, 1, 2);
    assert.equal(pagination.pageItems.length, 2);
    assert.equal(pagination.totalPages, 2);
    assert.equal(pagination.totalRecords, 3);
  });

  it('calculates overall and stage statistics', () => {
    const overall = PredictionHistoryDomain.calculateOverallStatistics(sampleItems);
    assert.equal(overall.predictionsSubmitted, 3);
    assert.equal(overall.predictionsCompleted, 2);
    assert.equal(overall.correctWinners, 2);
    assert.equal(overall.exactScores, 1);
    assert.equal(overall.totalPoints, 11);
    assert.equal(overall.bonusPoints, 5);
    assert.equal(overall.accuracy, 100);

    const stageStats = PredictionHistoryDomain.calculateStageStatistics(sampleItems);
    assert.ok(stageStats.some((item) => item.stage === 'Round of 16'));
  });

  it('builds prediction lifecycle steps', () => {
    const lifecycle = PredictionHistoryDomain.buildPredictionLifecycle(sampleItems[0], sampleItems[0].match);
    assert.equal(lifecycle[0].key, PREDICTION_LIFECYCLE_STEP.SUBMITTED);
    assert.equal(lifecycle.at(-1).completed, true);
  });

  it('filters by date range', () => {
    const thisYear = PredictionHistoryDomain.filterHistoryItems(sampleItems, {
      dateRange: PREDICTION_HISTORY_DATE_RANGE.THIS_YEAR,
    });
    assert.equal(thisYear.length, 3);
  });

  it('resolves result badges based on match resolution', () => {
    const unpublished = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
      match: { result: { published: false } },
    };
    assert.deepEqual(resolveResultBadges(unpublished), []);

    const penalties = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 2,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    };
    assert.deepEqual(resolveResultBadges(penalties), [
      { correct: true, label: 'Exact Score' },
      { correct: true, label: 'Penalty Winner' },
    ]);

    const normalTime = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 1,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    };
    assert.deepEqual(resolveResultBadges(normalTime), [
      { correct: false, label: 'Exact Score' },
    ]);
  });

  it('resolves primary result badge as first result badge', () => {
    const penalties = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 2,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    };
    assert.deepEqual(resolvePrimaryResultBadge(penalties), {
      correct: false,
      label: 'Exact Score',
    });

    const normalTime = {
      winnerPredictionCorrect: true,
      exactScoreCorrect: false,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 1,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    };
    assert.deepEqual(resolvePrimaryResultBadge(normalTime), {
      correct: false,
      label: 'Exact Score',
    });
  });
});
