import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ContestantMatchViewDomain,
  filterHistoryItems,
  filterMyPredictionMatches,
  isEligibleForMyPredictions,
  isEligibleForPredictionHistory,
  shouldShowOnTournamentDetail,
} from '../public/js/domain/contestant-match-view.domain.js';
import { MATCH_STATUS } from '../public/js/domain/match.domain.js';

const futureKickoff = new Date(Date.now() + 24 * 60 * 60 * 1000);
const pastKickoff = new Date(Date.now() - 60 * 60 * 1000);

/** @type {Record<string, unknown>} */
const prediction = { id: 'pred-1', homeScore: 1, awayScore: 0 };

function createMatch(overrides = {}) {
  return {
    id: 'match-1',
    status: MATCH_STATUS.PREDICTION_OPEN,
    kickoffUtc: futureKickoff,
    result: { published: false },
    ...overrides,
  };
}

describe('ContestantMatchViewDomain', () => {
  it('includes predicted future matches in My Predictions', () => {
    const match = createMatch();
    assert.equal(isEligibleForMyPredictions(match, prediction), true);
    assert.equal(isEligibleForPredictionHistory(match, prediction), false);
    assert.equal(shouldShowOnTournamentDetail(match, prediction), true);
  });

  it('moves predicted result-published matches to history only', () => {
    const match = createMatch({
      status: MATCH_STATUS.RESULT_PUBLISHED,
      result: { published: true, homeScore: 2, awayScore: 1 },
    });

    assert.equal(isEligibleForMyPredictions(match, prediction), false);
    assert.equal(isEligibleForPredictionHistory(match, prediction), true);
    assert.equal(shouldShowOnTournamentDetail(match, prediction), false);
  });

  it('hides unpredicted result-published matches from tournament detail', () => {
    const match = createMatch({
      status: MATCH_STATUS.RESULT_PUBLISHED,
      result: { published: true, homeScore: 2, awayScore: 1 },
    });

    assert.equal(isEligibleForMyPredictions(match, null), false);
    assert.equal(isEligibleForPredictionHistory(match, null), false);
    assert.equal(shouldShowOnTournamentDetail(match, null), false);
  });

  it('keeps unpredicted upcoming matches visible on tournament detail', () => {
    const match = createMatch();

    assert.equal(isEligibleForMyPredictions(match, null), false);
    assert.equal(shouldShowOnTournamentDetail(match, null), true);
  });

  it('includes predicted live matches in My Predictions', () => {
    const match = createMatch({
      status: MATCH_STATUS.LIVE,
      kickoffUtc: pastKickoff,
    });

    assert.equal(isEligibleForMyPredictions(match, prediction), true);
    assert.equal(isEligibleForPredictionHistory(match, prediction), false);
    assert.equal(shouldShowOnTournamentDetail(match, prediction), true);
  });

  it('hides completed unpredicted matches from tournament detail', () => {
    const match = createMatch({
      status: MATCH_STATUS.COMPLETED,
      kickoffUtc: pastKickoff,
      result: { published: false },
    });

    assert.equal(shouldShowOnTournamentDetail(match, null), false);
    assert.equal(isEligibleForMyPredictions(match, prediction), true);
  });

  it('filters My Predictions matches from a predictions map', () => {
    const upcomingPredicted = createMatch({ id: 'm1' });
    const upcomingUnpredicted = createMatch({ id: 'm2' });
    const publishedPredicted = createMatch({
      id: 'm3',
      result: { published: true },
    });

    const predictionsMap = new Map([
      ['m1', prediction],
      ['m3', prediction],
    ]);

    const filtered = filterMyPredictionMatches(
      [upcomingPredicted, upcomingUnpredicted, publishedPredicted],
      predictionsMap,
    );

    assert.deepEqual(filtered.map((match) => match.id), ['m1']);
  });

  it('filters history items to published results only', () => {
    const items = [
      {
        id: 'p1',
        match: createMatch({ id: 'm1', result: { published: false } }),
      },
      {
        id: 'p2',
        match: createMatch({ id: 'm2', result: { published: true } }),
      },
    ];

    const filtered = filterHistoryItems(items);
    assert.deepEqual(filtered.map((item) => item.id), ['p2']);
  });

  it('exports domain helpers from ContestantMatchViewDomain', () => {
    assert.equal(typeof ContestantMatchViewDomain.filterMyPredictionMatches, 'function');
    assert.equal(typeof ContestantMatchViewDomain.filterHistoryItems, 'function');
  });

  it('treats only explicit published=true as result published', () => {
    const { isResultPublished, isEligibleForMyPredictions } = ContestantMatchViewDomain;

    assert.equal(isResultPublished({ result: { published: false } }), false);
    assert.equal(isResultPublished({ result: { published: 'false' } }), false);
    assert.equal(isResultPublished({ result: { published: true } }), true);
    assert.equal(isEligibleForMyPredictions({ result: { published: 'false' } }, prediction), true);
  });
});
