import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildRecentActivity } from '../public/js/dashboard/contestant-dashboard-activity.util.js';
import { MATCH_COUNTDOWN_PHASE } from '../public/js/domain/match.domain.js';

const USER_ID = 'user-1';
const NOW = new Date('2026-07-10T12:00:00.000Z');

/**
 * @param {Partial<import('../public/js/match/match.service.js').EnrichedMatch>} overrides
 * @returns {import('../public/js/match/match.service.js').EnrichedMatch}
 */
function createMatch(overrides = {}) {
  return {
    id: 'match-1',
    homeTeam: { name: 'Team A' },
    awayTeam: { name: 'Team B' },
    predictionStatus: 'Closed',
    matchCountdown: null,
    result: null,
    ...overrides,
  };
}

describe('buildRecentActivity', () => {
  it('returns an empty list when no user is signed in', () => {
    assert.deepEqual(buildRecentActivity([createMatch()], null, NOW), []);
  });

  it('returns the welcome placeholder when there is no activity', () => {
    const items = buildRecentActivity([createMatch()], USER_ID, NOW);

    assert.equal(items.length, 1);
    assert.equal(items[0].type, 'info');
    assert.match(items[0].message, /Submit predictions/);
  });

  it('includes published results with relative published timestamps', () => {
    const publishedAt = new Date('2026-07-10T10:00:00.000Z');
    const items = buildRecentActivity([
      createMatch({
        id: 'match-result',
        result: { published: true, publishedAt },
      }),
    ], USER_ID, NOW);

    assert.equal(items.length, 1);
    assert.equal(items[0].type, 'result');
    assert.match(items[0].message, /Result published for Team A vs Team B/);
    assert.equal(items[0].timestampLabel, 'Published 2h ago');
  });

  it('includes open prediction windows with relative opened timestamps', () => {
    const opensAt = new Date('2026-07-10T09:00:00.000Z');
    const items = buildRecentActivity([
      createMatch({
        id: 'match-open',
        predictionStatus: 'Open',
        matchCountdown: {
          phase: MATCH_COUNTDOWN_PHASE.OPEN,
          opensAt: opensAt.toISOString(),
        },
      }),
    ], USER_ID, NOW);

    assert.equal(items.length, 1);
    assert.equal(items[0].type, 'prediction');
    assert.match(items[0].message, /Prediction window open for Team A vs Team B/);
    assert.equal(items[0].timestampLabel, 'Opened 3h ago');
  });

  it('merges published results and open prediction windows sorted by recency', () => {
    const items = buildRecentActivity([
      createMatch({
        id: 'match-result',
        result: {
          published: true,
          publishedAt: new Date('2026-07-10T08:00:00.000Z'),
        },
      }),
      createMatch({
        id: 'match-open',
        predictionStatus: 'Open',
        matchCountdown: {
          phase: MATCH_COUNTDOWN_PHASE.OPEN,
          opensAt: new Date('2026-07-10T11:00:00.000Z').toISOString(),
        },
      }),
    ], USER_ID, NOW);

    assert.equal(items.length, 2);
    assert.equal(items[0].id, 'prediction-match-open');
    assert.equal(items[1].id, 'result-match-result');
  });

  it('does not include pre-open matches', () => {
    const items = buildRecentActivity([
      createMatch({
        predictionStatus: 'Closed',
        matchCountdown: {
          phase: MATCH_COUNTDOWN_PHASE.PRE_OPEN,
          opensAt: new Date('2026-07-10T18:00:00.000Z').toISOString(),
        },
      }),
    ], USER_ID, NOW);

    assert.equal(items.length, 1);
    assert.equal(items[0].type, 'info');
  });
});
