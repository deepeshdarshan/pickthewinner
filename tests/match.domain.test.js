import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchDomain, MATCH_STATUS } from '../public/js/domain/match.domain.js';

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
});
