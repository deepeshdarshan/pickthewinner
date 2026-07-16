import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  filterMatches,
  filterContestantCompletedMatches,
  filterContestantUpcomingMatches,
  getContestantMatchCardsGridClass,
  paginateMatches,
  partitionContestantBrowseMatches,
  sortMatchesByKickoff,
} from '../public/js/match/match-list.util.js';
import { MATCH_STATUS } from '../public/js/domain/match.domain.js';

describe('match-list.util', () => {
  const sampleMatches = [
    {
      id: '1',
      tournamentId: 't1',
      status: MATCH_STATUS.PUBLISHED,
      kickoffUtc: new Date('2026-06-02T10:00:00Z'),
    },
    {
      id: '2',
      tournamentId: 't2',
      status: MATCH_STATUS.ARCHIVED,
      kickoffUtc: new Date('2026-06-01T10:00:00Z'),
    },
    {
      id: '3',
      tournamentId: 't1',
      status: MATCH_STATUS.DRAFT,
      kickoffUtc: new Date('2026-06-03T10:00:00Z'),
    },
  ];

  it('sorts matches by kickoff descending', () => {
    const sorted = sortMatchesByKickoff(sampleMatches);
    assert.equal(sorted[0].id, '3');
    assert.equal(sorted[2].id, '2');
  });

  it('filters matches by tournament and status', () => {
    const filtered = filterMatches(sampleMatches, {
      tournamentId: 't1',
      status: MATCH_STATUS.PUBLISHED,
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '1');
  });

  it('filters matches by kickoff date in display timezone', () => {
    const filtered = filterMatches(sampleMatches, {
      date: '2026-06-02',
    });

    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '1');
  });

  it('paginates match lists', () => {
    const page = paginateMatches(sampleMatches, 1, 2);
    assert.equal(page.pageMatches.length, 2);
    assert.equal(page.totalPages, 2);
    assert.equal(page.currentPage, 1);
  });

  it('partitions contestant browse matches into upcoming, completed, and archived tabs', () => {
    const activeMatches = [
      {
        id: 'upcoming',
        status: MATCH_STATUS.PREDICTION_OPEN,
        kickoffUtc: new Date('2026-06-02T10:00:00Z'),
        result: { published: false },
      },
      {
        id: 'completed',
        status: MATCH_STATUS.RESULT_PUBLISHED,
        kickoffUtc: new Date('2026-06-01T10:00:00Z'),
        result: { published: true },
      },
    ];
    const archivedMatches = [
      {
        id: 'archived',
        status: MATCH_STATUS.ARCHIVED,
        kickoffUtc: new Date('2026-05-01T10:00:00Z'),
        result: { published: true },
      },
    ];

    const partitioned = partitionContestantBrowseMatches(activeMatches, archivedMatches);

    assert.deepEqual(partitioned.upcoming.map((match) => match.id), ['upcoming']);
    assert.deepEqual(partitioned.completed.map((match) => match.id), ['completed']);
    assert.deepEqual(partitioned.archived.map((match) => match.id), ['archived']);
  });

  it('builds contestant browse grid classes for single and multiple matches', () => {
    assert.equal(
      getContestantMatchCardsGridClass(1),
      'ptw-match-cards ptw-match-cards--contestant-browse ptw-match-cards--single',
    );
    assert.equal(
      getContestantMatchCardsGridClass(3),
      'ptw-match-cards ptw-match-cards--contestant-browse',
    );
  });
});
