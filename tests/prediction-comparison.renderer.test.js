import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderComparisonBadges } from '../public/js/prediction/history/renderers/prediction-comparison.renderer.js';
import { WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';

describe('renderComparisonBadges', () => {
  it('shows only Exact Score badge for normal time resolution', () => {
    const html = renderComparisonBadges({
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 1,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    });

    assert.match(html, /Exact Score/);
    assert.doesNotMatch(html, /Penalty Winner/);
    assert.doesNotMatch(html, />Winner</);
  });

  it('shows both Exact Score and Penalty Winner badges for penalties resolution', () => {
    const html = renderComparisonBadges({
      winnerPredictionCorrect: true,
      exactScoreCorrect: true,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 2,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    });

    assert.match(html, /Exact Score/);
    assert.match(html, /Penalty Winner/);
  });

  it('shows both badges with mixed correctness for penalties resolution', () => {
    const html = renderComparisonBadges({
      winnerPredictionCorrect: false,
      exactScoreCorrect: true,
      match: {
        result: {
          published: true,
          homeScore: 2,
          awayScore: 2,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    });

    assert.match(html, /Exact Score/);
    assert.match(html, /Penalty Winner/);
  });

  it('shows awaiting result when result is unpublished', () => {
    const html = renderComparisonBadges({
      winnerPredictionCorrect: null,
      exactScoreCorrect: null,
      match: { result: { published: false } },
    });

    assert.match(html, /Awaiting result/);
    assert.doesNotMatch(html, /Exact Score/);
    assert.doesNotMatch(html, /Penalty Winner/);
  });
});
