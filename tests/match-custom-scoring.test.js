import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchDomain } from '../public/js/domain/match.domain.js';
import { readMatchForm } from '../public/js/match/renderers/form.renderer.js';

describe('Match custom scoring', () => {
  it('normalizes disabled custom scoring config as non-override', () => {
    const normalized = MatchDomain.normalizeCustomScoringConfig({
      useCustomPoints: false,
      correctMatchScorePoints: 15,
      correctPenaltyWinnerPoints: 5,
    });

    assert.equal(normalized.useCustomPoints, false);
    assert.equal(normalized.correctMatchScorePoints, 15);
    assert.equal(normalized.correctPenaltyWinnerPoints, 5);
  });

  it('normalizes invalid points to null for guardrails', () => {
    const normalized = MatchDomain.normalizeCustomScoringConfig({
      useCustomPoints: true,
      correctMatchScorePoints: 101,
      correctPenaltyWinnerPoints: -1,
    });

    assert.equal(normalized.useCustomPoints, true);
    assert.equal(normalized.correctMatchScorePoints, null);
    assert.equal(normalized.correctPenaltyWinnerPoints, null);
  });

  it('reads custom scoring config from form when toggle is enabled', () => {
    const form = {
      elements: {
        namedItem(name) {
          const values = {
            tournamentId: { value: 't1' },
            homeTeamId: { value: 'team-a' },
            awayTeamId: { value: 'team-b' },
            kickoffDate: { value: '2026-07-12' },
            kickoffTime: { value: '18:30' },
            useCustomPoints: { checked: true },
            correctMatchScorePoints: { value: '15' },
            correctPenaltyWinnerPoints: { value: '5' },
          };

          return values[name] ?? null;
        },
      },
    };

    const payload = readMatchForm(form);

    assert.equal(payload.tournamentId, 't1');
    assert.equal(payload.homeTeamId, 'team-a');
    assert.equal(payload.awayTeamId, 'team-b');
    assert.equal(payload.customScoringConfig?.useCustomPoints, true);
    assert.equal(payload.customScoringConfig?.correctMatchScorePoints, 15);
    assert.equal(payload.customScoringConfig?.correctPenaltyWinnerPoints, 5);
  });

  it('returns null custom scoring config when toggle is disabled', () => {
    const form = {
      elements: {
        namedItem(name) {
          const values = {
            tournamentId: { value: 't1' },
            homeTeamId: { value: 'team-a' },
            awayTeamId: { value: 'team-b' },
            kickoffDate: { value: '2026-07-12' },
            kickoffTime: { value: '18:30' },
            useCustomPoints: { checked: false },
            correctMatchScorePoints: { value: '99' },
            correctPenaltyWinnerPoints: { value: '99' },
          };

          return values[name] ?? null;
        },
      },
    };

    const payload = readMatchForm(form);

    assert.equal(payload.customScoringConfig, null);
  });
});

