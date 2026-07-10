import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderActualWinnerHtml,
  renderPredictedWinnerHtml,
} from '../public/js/prediction/admin/renderers/prediction-display.renderer.js';
import { WINNER_RESOLUTION } from '../public/js/domain/match.domain.js';
import { PENALTY_WINNER } from '../public/js/domain/prediction.domain.js';

describe('prediction-display.renderer published result visibility', () => {
  const match = {
    homeTeam: { name: 'Brazil' },
    awayTeam: { name: 'France' },
    homeTeamId: 'home',
    awayTeamId: 'away',
  };

  it('shows actual winner for normal time published results', () => {
    const html = renderActualWinnerHtml(match, {
      published: true,
      winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
      homeScore: 2,
      awayScore: 1,
      winningTeamId: 'home',
      homeTeamId: 'home',
      awayTeamId: 'away',
    });

    assert.match(html, /Brazil/);
  });

  it('shows actual winner for penalty published results', () => {
    const html = renderActualWinnerHtml(match, {
      published: true,
      winnerResolution: WINNER_RESOLUTION.PENALTIES,
      homeScore: 2,
      awayScore: 2,
      winningTeamId: 'home',
      homeTeamId: 'home',
      awayTeamId: 'away',
    });

    assert.match(html, /Brazil/);
  });

  it('shows predicted winner from scores when published result is not penalties', () => {
    const html = renderPredictedWinnerHtml(
      match,
      { homeScore: 2, awayScore: 1 },
      {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.NORMAL_TIME_EXTRA_TIME,
        },
      },
    );

    assert.match(html, /Brazil/);
  });

  it('shows predicted winner when published result is penalties', () => {
    const html = renderPredictedWinnerHtml(
      match,
      { predictedWinner: PENALTY_WINNER.HOME },
      {
        result: {
          published: true,
          winnerResolution: WINNER_RESOLUTION.PENALTIES,
        },
      },
    );

    assert.match(html, /Brazil/);
  });
});
