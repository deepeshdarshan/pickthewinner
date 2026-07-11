import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AdminPredictionHistoryDomain } from '../public/js/domain/admin-prediction-history.domain.js';
import {
  ADMIN_PREDICTION_HISTORY_SORT_FIELD,
} from '../public/js/prediction/admin/admin-prediction-history.constants.js';

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
  },
  {
    uid: 'u2',
    name: 'Bob',
    photoURL: '',
    tournamentsJoined: 1,
    predictionsSubmitted: 5,
    currentPoints: null,
    currentRank: null,
  },
  {
    uid: 'u3',
    name: 'Charlie',
    photoURL: '',
    tournamentsJoined: 3,
    predictionsSubmitted: 15,
    currentPoints: 18,
    currentRank: 3,
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
