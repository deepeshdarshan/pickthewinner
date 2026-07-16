import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MatchDomain } from '../public/js/domain/match.domain.js';
import { formatDateInput, parseAppDateTime } from '../public/js/utils/date.util.js';
import { formatTimeInput } from '../public/js/utils/time.util.js';
import { readMatchForm } from '../public/js/match/renderers/form.renderer.js';

describe('Match form datetime helpers', () => {
  it('formats early-morning IST kickoff without UTC off-by-one date', () => {
    const kickoff = new Date('2026-07-15T19:30:00.000Z');

    assert.equal(formatDateInput(kickoff), '2026-07-16');
    assert.equal(formatTimeInput(kickoff), '01:00');
  });

  it('round-trips date and time input values through parseAppDateTime', () => {
    const kickoff = new Date('2026-07-15T19:30:00.000Z');
    const date = formatDateInput(kickoff);
    const time = formatTimeInput(kickoff);
    const parsed = parseAppDateTime(date, time);

    assert.ok(parsed);
    assert.equal(parsed.getTime(), kickoff.getTime());
  });

  it('reads kickoffUtc from form values in IST', () => {
    const form = {
      elements: {
        namedItem(name) {
          const values = {
            tournamentId: { value: 't1' },
            homeTeamId: { value: 'team-a' },
            awayTeamId: { value: 'team-b' },
            kickoffDate: { value: '2026-07-16' },
            kickoffTime: { value: '01:00' },
            round: { value: 'group', selectedOptions: [{ textContent: 'Group Stage' }] },
            useCustomPoints: { checked: false },
          };

          return values[name] ?? null;
        },
      },
    };

    const payload = readMatchForm(form);
    const expected = new Date('2026-07-15T19:30:00.000Z');

    assert.ok(payload.kickoffUtc instanceof Date);
    assert.equal(payload.kickoffUtc.getTime(), expected.getTime());
  });

  it('treats same IST calendar day as duplicate even when UTC dates differ', () => {
    const existing = {
      tournamentId: 't1',
      homeTeamId: 'a',
      awayTeamId: 'b',
      kickoffUtc: new Date('2026-07-15T19:30:00.000Z'),
    };
    const candidate = {
      tournamentId: 't1',
      homeTeamId: 'b',
      awayTeamId: 'a',
      kickoffUtc: new Date('2026-07-16T10:00:00.000Z'),
    };

    assert.equal(MatchDomain.isDuplicateMatch(existing, candidate), true);
  });
});
