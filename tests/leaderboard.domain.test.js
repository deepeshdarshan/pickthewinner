/**
 * @fileoverview Leaderboard domain tests.
 */

import { describe, it, expect } from '../setup.js';
import { LeaderboardDomain } from '../public/js/domain/leaderboard.domain.js';
import { RANK_MOVEMENT } from '../public/js/leaderboard/leaderboard.constants.js';

describe('LeaderboardDomain', () => {
  describe('canContestantViewLeaderboard', () => {
    it('should allow admins regardless of visibility', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(true, false);
      expect(result).toBe(true);
    });

    it('should allow contestants when leaderboard is visible', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(false, true);
      expect(result).toBe(true);
    });

    it('should block contestants when leaderboard is not visible', () => {
      const result = LeaderboardDomain.canContestantViewLeaderboard(false, false);
      expect(result).toBe(false);
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

      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].displayName).toBe('Bob');
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].displayName).toBe('Charlie');
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].displayName).toBe('Alice');
    });

    it('should use alphabetical order as tie-breaker', () => {
      const entries = [
        { totalPoints: 100, displayName: 'Charlie' },
        { totalPoints: 100, displayName: 'Alice' },
        { totalPoints: 100, displayName: 'Bob' },
      ];

      const ranked = LeaderboardDomain.rankEntries(entries);

      expect(ranked[0].displayName).toBe('Alice');
      expect(ranked[1].displayName).toBe('Bob');
      expect(ranked[2].displayName).toBe('Charlie');
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

      expect(ranked[0].displayName).toBe('Bob');
      expect(ranked[1].displayName).toBe('Charlie');
      expect(ranked[2].displayName).toBe('Alice');
    });
  });

  describe('calculateMovement', () => {
    it('should return UP when rank improves', () => {
      const movement = LeaderboardDomain.calculateMovement(5, 10);
      expect(movement).toBe(RANK_MOVEMENT.UP);
    });

    it('should return DOWN when rank decreases', () => {
      const movement = LeaderboardDomain.calculateMovement(10, 5);
      expect(movement).toBe(RANK_MOVEMENT.DOWN);
    });

    it('should return SAME when rank unchanged', () => {
      const movement = LeaderboardDomain.calculateMovement(5, 5);
      expect(movement).toBe(RANK_MOVEMENT.SAME);
    });

    it('should return NEW when no previous rank', () => {
      const movement = LeaderboardDomain.calculateMovement(5, null);
      expect(movement).toBe(RANK_MOVEMENT.NEW);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy percentage correctly', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(7, 10);
      expect(accuracy).toBe(70);
    });

    it('should round to nearest integer', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(2, 3);
      expect(accuracy).toBe(67);
    });

    it('should return 0 for zero predictions', () => {
      const accuracy = LeaderboardDomain.calculateAccuracy(0, 0);
      expect(accuracy).toBe(0);
    });
  });

  describe('isTopRank', () => {
    it('should return true for top 3 ranks', () => {
      expect(LeaderboardDomain.isTopRank(1, 10)).toBe(true);
      expect(LeaderboardDomain.isTopRank(2, 10)).toBe(true);
      expect(LeaderboardDomain.isTopRank(3, 10)).toBe(true);
    });

    it('should return false for ranks beyond top 3', () => {
      expect(LeaderboardDomain.isTopRank(4, 10)).toBe(false);
      expect(LeaderboardDomain.isTopRank(10, 10)).toBe(false);
    });

    it('should handle small tournaments', () => {
      expect(LeaderboardDomain.isTopRank(1, 2)).toBe(true);
      expect(LeaderboardDomain.isTopRank(2, 2)).toBe(true);
      expect(LeaderboardDomain.isTopRank(3, 2)).toBe(false);
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
      expect(filtered.length).toBe(1);
      expect(filtered[0].displayName).toBe('Alice Smith');
    });

    it('should filter by country', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, 'uk');
      expect(filtered.length).toBe(1);
      expect(filtered[0].displayName).toBe('Bob Jones');
    });

    it('should be case-insensitive', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, 'CHARLIE');
      expect(filtered.length).toBe(1);
    });

    it('should return all entries for empty search', () => {
      const filtered = LeaderboardDomain.filterBySearch(entries, '');
      expect(filtered.length).toBe(3);
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
      expect(filtered.length).toBe(4);
    });

    it('should filter top 25', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'top25', null);
      expect(filtered.length).toBe(5);
    });

    it('should filter top 50', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'top50', null);
      expect(filtered.length).toBe(6);
    });

    it('should filter by user position', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'myPosition', 'user10');
      // Should include ranks 5-15 (within ±5 of rank 10)
      expect(filtered.length).toBe(3);
      expect(filtered.some(e => e.rank === 5)).toBe(true);
      expect(filtered.some(e => e.rank === 10)).toBe(true);
      expect(filtered.some(e => e.rank === 15)).toBe(true);
    });

    it('should return all for default filter', () => {
      const filtered = LeaderboardDomain.filterByRankRange(entries, 'all', null);
      expect(filtered.length).toBe(6);
    });
  });

  describe('canViewContestantDetails', () => {
    it('should allow admins to view any contestant', () => {
      const result = LeaderboardDomain.canViewContestantDetails(true, 'user1', 'user2');
      expect(result).toBe(true);
    });

    it('should allow users to view their own details', () => {
      const result = LeaderboardDomain.canViewContestantDetails(false, 'user1', 'user1');
      expect(result).toBe(true);
    });

    it('should block users from viewing others details', () => {
      const result = LeaderboardDomain.canViewContestantDetails(false, 'user1', 'user2');
      expect(result).toBe(false);
    });
  });
});

