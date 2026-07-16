import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateUserAccess } from '../public/js/prediction/history/prediction-history.validator.js';
import { MATCH_ROUTES, MATCH_MESSAGES } from '../public/js/match/match.constants.js';
import { renderHistoryPredictionStatsRows } from '../public/js/prediction/history/renderers/prediction-history-stats.renderer.js';

describe('match details routing constants', () => {
  it('exposes a dedicated match details route', () => {
    assert.equal(MATCH_ROUTES.DETAILS, '/matches/details');
  });
});

describe('match details access validation', () => {
  it('rejects unauthenticated access', () => {
    const result = validateUserAccess(null, 'u1');
    assert.equal(result.valid, false);
    assert.match(result.error ?? '', /authentication required/i);
  });

  it('rejects mismatched user access', () => {
    const result = validateUserAccess('u2', 'u1');
    assert.equal(result.valid, false);
    assert.match(result.error ?? '', /permission/i);
  });

  it('documents match not found message for empty match id handling', () => {
    assert.equal(MATCH_MESSAGES.NOT_FOUND, 'Match not found.');
  });
});

describe('match details prediction stats rendering', () => {
  it('shows dashes when no prediction was submitted', () => {
    const html = renderHistoryPredictionStatsRows({
      id: '',
      homeScore: null,
      awayScore: null,
      match: {
        result: { published: true, homeScore: 2, awayScore: 1 },
      },
    }, { variant: 'detail' });

    assert.match(html, /—/);
    assert.doesNotMatch(html, /null/);
  });
});
