/**
 * @fileoverview Leaderboard domain tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LeaderboardDomain } from '../public/js/domain/leaderboard.domain.js';
import { RANK_MOVEMENT } from '../public/js/leaderboard/leaderboard.constants.js';
import { WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

describe('LeaderboardDomain', () => {
  describe('canContestantViewLeaderboard', () => {
    it('should allow admins regardless of visibility', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(true, false);
      assert.equal(result, true);
    });

    it('should allow contestants when leaderboard is visible', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(false, true);
      assert.equal(result, true);
    });

    it('should block contestants when leaderboard is not visible', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(false, false);
      assert.equal(result, false);
    });
  });

  describe('rankEntries', () => {
    it('should rank entries by points descending', () => {
      const entries = [
        { totalPoints: 50, displayName: 'Alice' },
        { totalPoints: 100, displayName: 'Bob' },
        { totalPoints: 75, displayName: 'Charlie' },
      ];

      const ranked = LeaderboardDomain.rankEntries(entries);

      assert.equal(ranked[0].rank, 1);
      assert.equal(ranked[0].displayName, 'Bob');
      assert.equal(ranked[1].rank, 2);
      assert.equal(ranked[1].displayName, 'Charlie');
      assert.equal(ranked[2].rank, 3);
      assert.equal(ranked[2].displayName, 'Alice');
    });

    it('should use alphabetical order as tie-breaker', () => {
      const entries = [
        { totalPoints: 100, displayName: 'Charlie' },
        { totalPoints: 100, displayName: 'Alice' },
        { totalPoints: 100, displayName: 'Bob' },
      ];

      const ranked = LeaderboardDomain.rankEntries(entries);

      assert.equal(ranked[0].displayName, 'Alice');
      assert.equal(ranked[1].displayName, 'Bob');
      assert.equal(ranked[2].displayName, 'Charlie');
    });
  });

  describe('rankEntriesWithTieBreakers', () => {
    it('should apply custom tie-breaker config', () => {
      const entries = [
        { totalPoints: 100, correctWinnerCount: 5, displayName: 'Alice' },
        { totalPoints: 100, correctWinnerCount: 7, displayName: 'Bob' },
        { totalPoints: 100, correctWinnerCount: 6, displayName: 'Charlie' },
      ];

      const tieBreakerConfig = {
        strategy: 'totalPoints',
        secondary: 'correctWinnerCount',
      };

      const ranked = LeaderboardDomain.rankEntriesWithTieBreakers(entries, tieBreakerConfig);

      assert.equal(ranked[0].displayName, 'Bob');
      assert.equal(ranked[1].displayName, 'Charlie');
      assert.equal(ranked[2].displayName, 'Alice');
    });
  });

  describe('calculateMovement', () => {
    it('should return UP when rank improves', () => {
      const movement = LeaderboardDomain.calculateMovement(5, 10);
      assert.equal(movement, RANK_MOVEMENT.UP);
    });

    it('should return DOWN when rank decreases', () => {
      const movement = LeaderboardDomain.calculateMovement(10, 5);
      assert.equal(movement, RANK_MOVEMENT.DOWN);
    });

    it('should return SAME when rank unchanged', () => {
      const movement = LeaderboardDomain.calculateMovement(5, 5);
      assert.equal(movement, RANK_MOVEMENT.SAME);
    });

    it('should return NEW when no previous rank', () => {
      const movement = LeaderboardDomain.calculateMovement(5, null);
      assert.equal(movement, RANK_MOVEMENT.NEW);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy percentage correctly', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(7, 10);
      assert.equal(accuracy, 70);
    });

    it('should round to nearest integer', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(2, 3);
      assert.equal(accuracy, 67);
    });

    it('should return 0 for zero predictions', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(0, 0);
      assert.equal(accuracy, 0);
    });
  });

  describe('calculateContestantStats', () => {
    const homeTeamId = 'home-team';
    const awayTeamId = 'away-team';

    const matchWinnerCorrectNotExact = {
      id: 'm1',
      homeTeamId,
      awayTeamId,
      result: {
        published: true,
        homeScore: 3,
        awayScore: 1,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      },
    };

    const matchExactScore = {
      id: 'm2',
      homeTeamId,
      awayTeamId,
      result: {
        published: true,
        homeScore: 2,
        awayScore: 0,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      },
    };

    const matchUnpublished = {
      id: 'm3',
      homeTeamId,
      awayTeamId,
      result: {
        published: false,
        homeScore: 1,
        awayScore: 0,
      },
    };

    it('should count winner correct but not exact', () => {
      const matchById = new Map([
        ['m1', matchWinnerCorrectNotExact],
      ]);
      const predictions = [
        { matchId: 'm1', homeScore: 2, awayScore: 1 },
      ];

      const stats = LeaderboardDomain.calculateContestantStats(predictions, matchById);

      assert.equal(stats.correctWinnerCount, 1);
      assert.equal(stats.exactScoreCount, 0);
      assert.equal(stats.accuracy, 100);
      assert.equal(stats.completedCount, 1);
    });

    it('should count exact score predictions', () => {
      const matchById = new Map([
        ['m2', matchExactScore],
      ]);
      const predictions = [
        { matchId: 'm2', homeScore: 2, awayScore: 0 },
      ];

      const stats = LeaderboardDomain.calculateContestantStats(predictions, matchById);

      assert.equal(stats.correctWinnerCount, 1);
      assert.equal(stats.exactScoreCount, 1);
      assert.equal(stats.accuracy, 100);
      assert.equal(stats.completedCount, 1);
    });

    it('should exclude unpublished match results from denominator', () => {
      const matchById = new Map([
        ['m1', matchWinnerCorrectNotExact],
        ['m3', matchUnpublished],
      ]);
      const predictions = [
        { matchId: 'm1', homeScore: 2, awayScore: 1 },
        { matchId: 'm3', homeScore: 1, awayScore: 0 },
      ];

      const stats = LeaderboardDomain.calculateContestantStats(predictions, matchById);

      assert.equal(stats.correctWinnerCount, 1);
      assert.equal(stats.exactScoreCount, 0);
      assert.equal(stats.accuracy, 100);
      assert.equal(stats.completedCount, 1);
    });

    it('should return zeros for empty predictions', () => {
      const stats = LeaderboardDomain.calculateContestantStats([], new Map());

      assert.equal(stats.correctWinnerCount, 0);
      assert.equal(stats.exactScoreCount, 0);
      assert.equal(stats.accuracy, 0);
      assert.equal(stats.completedCount, 0);
    });
  });

  describe('isTopRank', () => {
    it('should return true for top 3 ranks', () => {
      assert.equal(LeaderboardDomain.isTopRank(1, 10), true);
      assert.equal(LeaderboardDomain.isTopRank(2, 10), true);
      assert.equal(LeaderboardDomain.isTopRank(3, 10), true);
    });

    it('should return false for ranks beyond top 3', () => {
      assert.equal(LeaderboardDomain.isTopRank(4, 10), false);
      assert.equal(LeaderboardDomain.isTopRank(10, 10), false);
    });

    it('should handle small tournaments', () => {
      assert.equal(LeaderboardDomain.isTopRank(1, 2), true);
      assert.equal(LeaderboardDomain.isTopRank(2, 2), true);
      assert.equal(LeaderboardDomain.isTopRank(3, 2), false);
    });
  });

  describe('filterBySearch', () => {
    const entries = [
      { displayName: 'Alice Smith', country: 'USA' },
      { displayName: 'Bob Jones', country: 'UK' },
      { displayName: 'Charlie Brown', country: 'Canada' },
    ];

    it('should filter by display name', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, 'alice');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].displayName, 'Alice Smith');
    });

    it('should filter by country', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, 'uk');
      assert.equal(filtered.length, 1);
      assert.equal(filtered[0].displayName, 'Bob Jones');
    });

    it('should be case-insensitive', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, 'CHARLIE');
      assert.equal(filtered.length, 1);
    });

    it('should return all entries for empty search', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, '');
      assert.equal(filtered.length, 3);
    });
  });

  describe('filterByRankRange', () => {
    const entries = [
      { rank: 1, userId: 'user1' },
      { rank: 2, userId: 'user2' },
      { rank: 5, userId: 'user5' },
      { rank: 10, userId: 'user10' },
      { rank: 15, userId: 'user15' },
      { rank: 30, userId: 'user30' },
    ];

    it('should filter top 10', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'top10', null);
      assert.equal(filtered.length, 4);
    });

    it('should filter top 25', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'top25', null);
      assert.equal(filtered.length, 5);
    });

    it('should filter top 50', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'top50', null);
      assert.equal(filtered.length, 6);
    });

    it('should filter by user position', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'myPosition', 'user10');
      // Should include ranks 5-15 (within ±5 of rank 10)
      assert.equal(filtered.length, 3);
      assert.equal(filtered.some((e) => e.rank === 5), true);
      assert.equal(filtered.some((e) => e.rank === 10), true);
      assert.equal(filtered.some((e) => e.rank === 15), true);
    });

    it('should return all for default filter', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'all', null);
      assert.equal(filtered.length, 6);
    });
  });

  describe('canViewContestantDetails', () => {
    it('should allow admins to view any contestant', () => {
      const result = LeaderboardDomain.canViewContestantDetails(true, 'user1', 'user2');
      assert.equal(result, true);
    });

    it('should allow users to view their own details', () => {
      const result = LeaderboardDomain.canViewContestantDetails(false, 'user1', 'user1');
      assert.equal(result, true);
    });

    it('should block users from viewing others details', () => {
      const result = LeaderboardDomain.canViewContestantDetails(false, 'user1', 'user2');
      assert.equal(result, false);
    });
  });
});

