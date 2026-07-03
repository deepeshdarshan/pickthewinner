import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchDomain, MATCH_STATUS, WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

describe('MatchDomain', () => {
  it('allows draft to published transition', () => {
    assert.equal(MatchDomain.canTransitionTo(MATCH_STATUS.DRAFT, MATCH_STATUS.PUBLISHED), true);
  });

  it('normalizes legacy scheduled status to draft', () => {
    assert.equal(MatchDomain.normalizeStatus('scheduled'), MATCH_STATUS.DRAFT);
  });

  it('blocks archived transitions', () => {
    assert.equal(MatchDomain.canTransitionTo(MATCH_STATUS.ARCHIVED, MATCH_STATUS.DRAFT), false);
  });

  it('shows published visible matches to contestants', () => {
    assert.equal(MatchDomain.isVisibleToContestants(MATCH_STATUS.PUBLISHED, true), true);
    assert.equal(MatchDomain.isVisibleToContestants(MATCH_STATUS.DRAFT, true), false);
    assert.equal(MatchDomain.isVisibleToContestants(MATCH_STATUS.PUBLISHED, false), false);
  });

  it('calculates prediction window', () => {
    const kickoff = new Date('2026-07-10T18:00:00+05:30');
    const window = MatchDomain.calculatePredictionWindow(kickoff, 48, 10);
    assert.equal(window.locksAt.getTime(), kickoff.getTime() - 10 * 60 * 1000);
    assert.equal(window.opensAt.getTime(), kickoff.getTime() - 48 * 60 * 60 * 1000);
  });

  it('detects duplicate matches', () => {
    const kickoff = new Date('2026-07-10T18:00:00+05:30');
    const existing = {
      tournamentId: 't1',
      homeTeamId: 'a',
      awayTeamId: 'b',
      kickoffUtc: kickoff,
    };
    const candidate = {
      tournamentId: 't1',
      homeTeamId: 'b',
      awayTeamId: 'a',
      kickoffUtc: kickoff,
    };

    assert.equal(MatchDomain.isDuplicateMatch(existing, candidate), true);
  });

  it('allows result publication only when completed', () => {
    assert.equal(MatchDomain.canPublishResult(MATCH_STATUS.COMPLETED), true);
    assert.equal(MatchDomain.canPublishResult(MATCH_STATUS.LIVE), false);
  });

  describe('shouldShowKickoffCountdown', () => {
    const now = new Date('2026-07-01T12:00:00Z');
    const futureKickoff = new Date('2026-07-10T18:00:00Z');
    const pastKickoff = new Date('2026-06-01T10:00:00Z');

    it('shows countdown for open prediction with future kickoff', () => {
      const match = {
        status: MATCH_STATUS.PREDICTION_OPEN,
        predictionStatus: 'Open',
      };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), true);
    });

    it('hides countdown when result is published', () => {
      const match = {
        status: MATCH_STATUS.RESULT_PUBLISHED,
        result: { published: true },
      };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), false);
    });

    it('hides countdown when match is completed', () => {
      const match = { status: MATCH_STATUS.COMPLETED };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), false);
    });

    it('hides countdown when match is result_published', () => {
      const match = { status: MATCH_STATUS.RESULT_PUBLISHED };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), false);
    });

    it('hides countdown when match is live', () => {
      const match = { status: MATCH_STATUS.LIVE };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), false);
    });

    it('hides countdown when kickoff is in the past', () => {
      const match = {
        status: MATCH_STATUS.PUBLISHED,
        predictionStatus: 'Open',
      };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, pastKickoff, now), false);
    });

    it('hides countdown when prediction is locked', () => {
      const match = {
        status: MATCH_STATUS.PREDICTION_LOCKED,
        predictionStatus: 'Locked',
      };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, futureKickoff, now), false);
    });

    it('hides countdown when kickoff is missing', () => {
      const match = { status: MATCH_STATUS.PREDICTION_OPEN };

      assert.equal(MatchDomain.shouldShowKickoffCountdown(match, null, now), false);
    });
  });

  it('requires winning team only for penalty resolution', () => {
    const homeTeamId = 'home-team';
    const awayTeamId = 'away-team';
    const tournamentConfig = { requiresWinner: true };

    const normalTimeResult = MatchDomain.validateResult(
      {
        homeScore: 2,
        awayScore: 3,
        winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        winningTeamId: '',
      },
      tournamentConfig,
      homeTeamId,
      awayTeamId,
    );

    assert.equal(normalTimeResult.valid, true);

    const penaltiesMissingWinner = MatchDomain.validateResult(
      {
        homeScore: 2,
        awayScore: 2,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
        winningTeamId: '',
      },
      tournamentConfig,
      homeTeamId,
      awayTeamId,
    );

    assert.equal(penaltiesMissingWinner.valid, false);
    assert.ok(penaltiesMissingWinner.errors.winningTeamId);

    const penaltiesWithWinner = MatchDomain.validateResult(
      {
        homeScore: 2,
        awayScore: 2,
        winnerResolution: WINNER_RESOLUTION.PENALTIES,
        winningTeamId: homeTeamId,
      },
      tournamentConfig,
      homeTeamId,
      awayTeamId,
    );

    assert.equal(penaltiesWithWinner.valid, true);
  });
});
