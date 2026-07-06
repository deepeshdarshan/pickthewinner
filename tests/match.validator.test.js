import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCreatePayload } from '../public/js/match/match.validator.js';

describe('MatchValidator', () => {
  it('requires tournament, teams, and kickoff', () => {
    const result = validateCreatePayload({});
    assert.equal(result.valid, false);
    assert.ok(result.errors.tournamentId);
    assert.ok(result.errors.homeTeamId);
    assert.ok(result.errors.awayTeamId);
    assert.ok(result.errors.round);
    assert.ok(result.errors.kickoffUtc);
  });

  it('rejects identical home and away teams', () => {
    const result = validateCreatePayload({
      tournamentId: 't1',
      homeTeamId: 'team-a',
      awayTeamId: 'team-a',
      round: 'quarter_final',
      kickoffUtc: new Date(),
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.homeTeamId);
    assert.ok(result.errors.awayTeamId);
  });

  it('accepts valid create payload', () => {
    const result = validateCreatePayload({
      tournamentId: 't1',
      homeTeamId: 'team-a',
      awayTeamId: 'team-b',
      round: 'quarter_final',
      kickoffUtc: new Date('2026-07-10T18:00:00+05:30'),
    });

    assert.equal(result.valid, true);
  });

  it('requires custom points when override is enabled', () => {
    const result = validateCreatePayload({
      tournamentId: 't1',
      homeTeamId: 'team-a',
      awayTeamId: 'team-b',
      round: 'quarter_final',
      kickoffUtc: new Date('2026-07-10T18:00:00+05:30'),
      customScoringConfig: {
        useCustomPoints: true,
      },
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.correctMatchScorePoints);
    assert.ok(result.errors.correctPenaltyWinnerPoints);
  });

  it('rejects invalid custom points range', () => {
    const result = validateCreatePayload({
      tournamentId: 't1',
      homeTeamId: 'team-a',
      awayTeamId: 'team-b',
      round: 'quarter_final',
      kickoffUtc: new Date('2026-07-10T18:00:00+05:30'),
      customScoringConfig: {
        useCustomPoints: true,
        correctMatchScorePoints: 101,
        correctPenaltyWinnerPoints: -1,
      },
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.correctMatchScorePoints);
    assert.ok(result.errors.correctPenaltyWinnerPoints);
  });

  it('accepts valid custom points override', () => {
    const result = validateCreatePayload({
      tournamentId: 't1',
      homeTeamId: 'team-a',
      awayTeamId: 'team-b',
      round: 'quarter_final',
      kickoffUtc: new Date('2026-07-10T18:00:00+05:30'),
      customScoringConfig: {
        useCustomPoints: true,
        correctMatchScorePoints: 15,
        correctPenaltyWinnerPoints: 5,
      },
    });

    assert.equal(result.valid, true);
  });
});
