import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdminPredictionHistoryDomain } from '../public/js/domain/admin-prediction-history.domain.js';
import {
  ADMIN_PREDICTION_HISTORY_SORT_FIELD,
} from '../public/js/prediction/admin/admin-prediction-history.constants.js';
import { renderContestantCards } from '../public/js/prediction/admin/renderers/admin-prediction-history-list.renderer.js';

/** @type {import('../public/js/domain/admin-prediction-history.domain.js').AdminContestantHistoryRow[]} */
const SAMPLE_ROWS = [
  {
    uid: 'u1',
    name: 'Alice',
    photoURL: '',
    tournamentsJoined: 2,
    predictionsSubmitted: 10,
    currentPoints: 25,
    currentRank: 1,
    accuracy: 100,
    correctWinnerCount: 2,
    exactScoreCount: 2,
  },
  {
    uid: 'u2',
    name: 'Bob',
    photoURL: '',
    tournamentsJoined: 1,
    predictionsSubmitted: 5,
    currentPoints: null,
    currentRank: null,
    accuracy: 0,
    correctWinnerCount: 0,
    exactScoreCount: 0,
  },
  {
    uid: 'u3',
    name: 'Charlie',
    photoURL: '',
    tournamentsJoined: 3,
    predictionsSubmitted: 15,
    currentPoints: 18,
    currentRank: 3,
    accuracy: 67,
    correctWinnerCount: 1,
    exactScoreCount: 1,
  },
];

describe('admin-prediction-history.domain', () => {
  it('filters rows by contestant name', () => {
    const filtered = AdminPredictionHistoryDomain.filterRows(SAMPLE_ROWS, 'ali');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].uid, 'u1');
  });

  it('sorts rows by predictions submitted descending', () => {
    const sorted = AdminPredictionHistoryDomain.sortRows(
      SAMPLE_ROWS,
      ADMIN_PREDICTION_HISTORY_SORT_FIELD.PREDICTIONS,
      'desc',
    );
    assert.deepEqual(sorted.map((row) => row.uid), ['u3', 'u1', 'u2']);
  });

  it('sorts rows by rank ascending with nulls last', () => {
    const sorted = AdminPredictionHistoryDomain.sortRows(
      SAMPLE_ROWS,
      ADMIN_PREDICTION_HISTORY_SORT_FIELD.RANK,
      'asc',
    );
    assert.equal(sorted[0].uid, 'u1');
    assert.equal(sorted[sorted.length - 1].uid, 'u2');
  });

  it('paginates rows', () => {
    const result = AdminPredictionHistoryDomain.paginateRows(SAMPLE_ROWS, 2, 2);
    assert.equal(result.totalRecords, 3);
    assert.equal(result.totalPages, 2);
    assert.equal(result.currentPage, 2);
    assert.equal(result.pageRows.length, 1);
    assert.equal(result.pageRows[0].uid, 'u3');
  });

  it('applies search, sort, and pagination together', () => {
    const result = AdminPredictionHistoryDomain.applyListQuery(SAMPLE_ROWS, {
      search: '',
      sortField: ADMIN_PREDICTION_HISTORY_SORT_FIELD.NAME,
      sortDirection: 'asc',
      page: 1,
      pageSize: 2,
    });

    assert.equal(result.totalRecords, 3);
    assert.equal(result.pageRows.length, 2);
    assert.equal(result.pageRows[0].name, 'Alice');
    assert.equal(result.pageRows[1].name, 'Bob');
  });
});

describe('admin-prediction-history-list.renderer mobile cards', () => {
  it('renders leaderboard-style cards for contestants', () => {
    const html = renderContestantCards(SAMPLE_ROWS);

    assert.match(html, /ptw-performance-card-list/);
    assert.match(html, /ptw-performance-card/);
    assert.match(html, /View History/);
    assert.match(html, /data-aph-row="u1"/);
    assert.match(html, /ptw-rank-badge--gold/);
    assert.match(html, />Rank</);
    assert.match(html, /Accuracy/);
    assert.match(html, /Winners/);
    assert.match(html, /Exact Scores/);
    assert.doesNotMatch(html, /Current tournament rank/);
    assert.doesNotMatch(html, /Current Rank/);
  });
});
