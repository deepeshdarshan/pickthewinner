/**
 * @fileoverview Leaderboard domain tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LeaderboardDomain } from '../public/js/domain/leaderboard.domain.js';
import { RANK_MOVEMENT } from '../public/js/leaderboard/leaderboard.constants.js';
import { MATCH_STATUS, WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

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

  describe('resolveContestantLeaderboardLimit', () => {
    it('should default invalid values to 10', () => {
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(undefined), 10);
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit('invalid'), 10);
    });

    it('should clamp values to allowed options', () => {
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(0), 3);
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(15), 10);
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(5), 5);
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(20), 20);
      assert.equal(LeaderboardDomain.resolveContestantLeaderboardLimit(60), 50);
    });
  });

  describe('limitVisibleEntries', () => {
    it('should return only entries within the configured top-N limit', () => {
      const entries = [
        { rank: 1, displayName: 'Alice' },
        { rank: 2, displayName: 'Bob' },
        { rank: 6, displayName: 'Charlie' },
      ];

      const limited = LeaderboardDomain.limitVisibleEntries(entries, 5);

      assert.equal(limited.length, 2);
      assert.deepEqual(limited.map((entry) => entry.rank), [1, 2]);
    });
  });

  describe('isRankVisibleToContestant', () => {
    it('should allow ranks within the configured limit', () => {
      assert.equal(LeaderboardDomain.isRankVisibleToContestant(3, 5), true);
      assert.equal(LeaderboardDomain.isRankVisibleToContestant(5, 5), true);
    });

    it('should block ranks beyond the configured limit', () => {
      assert.equal(LeaderboardDomain.isRankVisibleToContestant(6, 5), false);
      assert.equal(LeaderboardDomain.isRankVisibleToContestant(0, 5), false);
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

  describe('calculatePredictionParticipation', () => {
    const eligibleMatches = [
      {
        id: 'm1',
        status: MATCH_STATUS.RESULT_PUBLISHED,
        result: { published: true },
      },
      {
        id: 'm2',
        status: MATCH_STATUS.RESULT_PUBLISHED,
        result: { published: true },
      },
    ];

    it('should count only predictions on eligible matches', () => {
      const participation = LeaderboardDomain.calculatePredictionParticipation(
        [
          { matchId: 'm1' },
          { matchId: 'm2' },
          { matchId: 'archived-match' },
        ],
        eligibleMatches,
      );

      assert.equal(participation.matchesPredicted, 2);
      assert.equal(participation.matchesRemaining, 0);
    });

    it('should return zero remaining when all eligible matches are predicted', () => {
      const participation = LeaderboardDomain.calculatePredictionParticipation(
        [
          { matchId: 'm1' },
          { matchId: 'm2' },
        ],
        eligibleMatches,
      );

      assert.equal(participation.matchesPredicted, 2);
      assert.equal(participation.matchesRemaining, 0);
    });

    it('should count missed eligible matches as remaining', () => {
      const participation = LeaderboardDomain.calculatePredictionParticipation(
        [{ matchId: 'm1' }],
        eligibleMatches,
      );

      assert.equal(participation.matchesPredicted, 1);
      assert.equal(participation.matchesRemaining, 1);
    });
  });

  describe('filterParticipationEligibleMatches', () => {
    it('should include result_published matches with published results', () => {
      const filtered = LeaderboardDomain.filterParticipationEligibleMatches([
        { id: 'm1', status: MATCH_STATUS.RESULT_PUBLISHED, result: { published: true } },
        { id: 'm2', status: MATCH_STATUS.PUBLISHED, visible: true },
        {
          id: 'm3',
          status: MATCH_STATUS.PREDICTION_OPEN,
          result: { published: true },
        },
      ]);

      assert.deepEqual(filtered.map((match) => match.id), ['m1', 'm3']);
    });

    it('should exclude upcoming published matches without published results', () => {
      const filtered = LeaderboardDomain.filterParticipationEligibleMatches([
        { id: 'm1', status: MATCH_STATUS.PUBLISHED, visible: true },
        { id: 'm2', status: MATCH_STATUS.PREDICTION_OPEN, visible: true },
      ]);

      assert.equal(filtered.length, 0);
    });

    it('should exclude finished matches where prediction window never opened', () => {
      const filtered = LeaderboardDomain.filterParticipationEligibleMatches([
        {
          id: 'm1',
          status: MATCH_STATUS.PUBLISHED,
          result: { published: true },
        },
      ]);

      assert.equal(filtered.length, 0);
    });
  });

  describe('filterActiveContestantMatches', () => {
    it('should exclude archived, draft, and hidden matches', () => {
      const filtered = LeaderboardDomain.filterActiveContestantMatches([
        { id: 'm1', status: MATCH_STATUS.PUBLISHED, visible: true },
        { id: 'm2', status: MATCH_STATUS.ARCHIVED, visible: true },
        { id: 'm3', status: MATCH_STATUS.DRAFT, visible: true },
        { id: 'm4', status: MATCH_STATUS.PREDICTION_OPEN, visible: false },
        { id: 'm5', status: MATCH_STATUS.RESULT_PUBLISHED, visible: true },
      ]);

      assert.deepEqual(filtered.map((match) => match.id), ['m1', 'm5']);
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

    it('should not count right team with wrong score as winner for normal time', () => {
      const matchById = new Map([
        ['m1', matchWinnerCorrectNotExact],
      ]);
      const predictions = [
        { matchId: 'm1', homeScore: 2, awayScore: 1 },
      ];

      const stats = LeaderboardDomain.calculateContestantStats(predictions, matchById);

      assert.equal(stats.correctWinnerCount, 0);
      assert.equal(stats.exactScoreCount, 0);
      assert.equal(stats.accuracy, 0);
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

      assert.equal(stats.correctWinnerCount, 0);
      assert.equal(stats.exactScoreCount, 0);
      assert.equal(stats.accuracy, 0);
      assert.equal(stats.completedCount, 1);
    });

    it('should count penalty winner correct without exact score', () => {
      const matchPenalties = {
        id: 'm4',
        homeTeamId,
        awayTeamId,
        result: {
          published: true,
          homeScore: 1,
          awayScore: 1,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
          winningTeamId: homeTeamId,
        },
      };
      const matchById = new Map([
        ['m4', matchPenalties],
      ]);
      const predictions = [
        { matchId: 'm4', homeScore: 2, awayScore: 2, predictedWinner: 'HOME' },
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

  describe('calculateBetterThanPercent', () => {
    it('should calculate percentage of contestants ranked below the user', () => {
      assert.equal(LeaderboardDomain.calculateBetterThanPercent(7, 142), 95);
    });

    it('should return 0 for last place', () => {
      assert.equal(LeaderboardDomain.calculateBetterThanPercent(142, 142), 0);
    });

    it('should return 0 for sole contestant', () => {
      assert.equal(LeaderboardDomain.calculateBetterThanPercent(1, 1), 0);
    });

    it('should return null for invalid rank', () => {
      assert.equal(LeaderboardDomain.calculateBetterThanPercent(null, 142), null);
      assert.equal(LeaderboardDomain.calculateBetterThanPercent(0, 142), null);
    });
  });

  describe('formatTopPercentLabel', () => {
    it('should return Top 5% when rank is within top 5%', () => {
      assert.equal(LeaderboardDomain.formatTopPercentLabel(7, 142), 'Top 5%');
    });

    it('should return Top 10% when rank is within top 10%', () => {
      assert.equal(LeaderboardDomain.formatTopPercentLabel(10, 142), 'Top 10%');
    });

    it('should return null when rank is outside top 50%', () => {
      assert.equal(LeaderboardDomain.formatTopPercentLabel(80, 142), null);
    });

    it('should return null for invalid rank', () => {
      assert.equal(LeaderboardDomain.formatTopPercentLabel(null, 142), null);
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

  describe('rankEntriesByStandings', () => {
    it('should rank by total points first', () => {
      const ranked = LeaderboardDomain.rankEntriesByStandings([
        { totalPoints: 20, accuracy: 100, averageResponseTimeMs: 1000, displayName: 'Arun' },
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 5000, displayName: 'Prasad' },
      ]);

      assert.equal(ranked[0].displayName, 'Prasad');
      assert.equal(ranked[1].displayName, 'Arun');
    });

    it('should use accuracy as second tie-breaker', () => {
      const ranked = LeaderboardDomain.rankEntriesByStandings([
        { totalPoints: 40, accuracy: 80, averageResponseTimeMs: 1000, displayName: 'Contestant B' },
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 5000, displayName: 'Contestant A' },
      ]);

      assert.equal(ranked[0].displayName, 'Contestant A');
      assert.equal(ranked[1].displayName, 'Contestant B');
    });

    it('should use lower average response time as third tie-breaker', () => {
      const ranked = LeaderboardDomain.rankEntriesByStandings([
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 40 * 60 * 1000, displayName: 'Slower' },
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 15 * 60 * 1000, displayName: 'Faster' },
      ]);

      assert.equal(ranked[0].displayName, 'Faster');
      assert.equal(ranked[1].displayName, 'Slower');
    });

    it('should use alphabetical order as final tie-breaker', () => {
      const ranked = LeaderboardDomain.rankEntriesByStandings([
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 1000, displayName: 'Charlie' },
        { totalPoints: 40, accuracy: 100, averageResponseTimeMs: 1000, displayName: 'Alice' },
      ]);

      assert.equal(ranked[0].displayName, 'Alice');
      assert.equal(ranked[1].displayName, 'Charlie');
    });
  });

  describe('calculateAverageResponseTime', () => {
    const openHours = 12;
    const kickoff = new Date('2026-07-10T20:00:00Z');
    const opensAt = new Date(kickoff.getTime() - openHours * 60 * 60 * 1000);

    it('should average response times across predictions', () => {
      const matchById = new Map([
        ['m1', { id: 'm1', kickoffUtc: kickoff }],
        ['m2', { id: 'm2', kickoffUtc: kickoff }],
      ]);

      const average = LeaderboardDomain.calculateAverageResponseTime(
        [
          { matchId: 'm1', submittedAt: new Date(opensAt.getTime() + 15 * 60 * 1000) },
          { matchId: 'm2', submittedAt: new Date(opensAt.getTime() + 40 * 60 * 1000) },
        ],
        matchById,
        openHours,
      );

      assert.equal(average, 27.5 * 60 * 1000);
    });

    it('should ignore predictions without submittedAt or kickoff', () => {
      const matchById = new Map([
        ['m1', { id: 'm1', kickoffUtc: kickoff }],
        ['m2', { id: 'm2', kickoffUtc: null }],
      ]);

      const average = LeaderboardDomain.calculateAverageResponseTime(
        [
          { matchId: 'm1', submittedAt: new Date(opensAt.getTime() + 20 * 60 * 1000) },
          { matchId: 'm2', submittedAt: new Date(opensAt.getTime() + 60 * 60 * 1000) },
        ],
        matchById,
        openHours,
      );

      assert.equal(average, 20 * 60 * 1000);
    });

    it('should return null when no valid response times exist', () => {
      const average = LeaderboardDomain.calculateAverageResponseTime([], new Map(), openHours);
      assert.equal(average, null);
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

