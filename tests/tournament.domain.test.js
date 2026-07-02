import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TournamentDomain, TOURNAMENT_STATUS, TOURNAMENT_VISIBILITY } from '../public/js/domain/tournament.domain.js';
import { MATCH_STATUS } from '../public/js/domain/match.domain.js';

describe('TournamentDomain', () => {
  it('allows draft to published transition', () => {
    assert.equal(
      TournamentDomain.canTransitionTo(TOURNAMENT_STATUS.DRAFT, TOURNAMENT_STATUS.PUBLISHED),
      true,
    );
  });

  it('blocks archived to draft transition', () => {
    assert.equal(
      TournamentDomain.canTransitionTo(TOURNAMENT_STATUS.ARCHIVED, TOURNAMENT_STATUS.DRAFT),
      false,
    );
  });

  it('allows archived to completed restore transition', () => {
    assert.equal(
      TournamentDomain.canTransitionTo(TOURNAMENT_STATUS.ARCHIVED, TOURNAMENT_STATUS.COMPLETED),
      true,
    );
  });

  it('allows completed to archived transition', () => {
    assert.equal(
      TournamentDomain.canTransitionTo(TOURNAMENT_STATUS.COMPLETED, TOURNAMENT_STATUS.ARCHIVED),
      true,
    );
    assert.equal(TournamentDomain.canArchiveTournament(TOURNAMENT_STATUS.COMPLETED), true);
  });

  it('marks completed tournaments as read-only but not archived', () => {
    assert.equal(TournamentDomain.isTournamentReadOnly(TOURNAMENT_STATUS.COMPLETED), true);
    assert.equal(TournamentDomain.canArchiveTournament(TOURNAMENT_STATUS.COMPLETED), true);
    assert.equal(TournamentDomain.canRestoreTournament(TOURNAMENT_STATUS.COMPLETED), false);
  });

  it('marks only draft as editable', () => {
    assert.equal(TournamentDomain.canEditTournament(TOURNAMENT_STATUS.DRAFT), true);
    assert.equal(TournamentDomain.canEditTournament(TOURNAMENT_STATUS.PUBLISHED), false);
    assert.equal(TournamentDomain.canEditTournament(TOURNAMENT_STATUS.DRAFT, true), false);
  });

  it('shows published live and completed tournaments when visible', () => {
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.PUBLISHED, TOURNAMENT_VISIBILITY.VISIBLE),
      true,
    );
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.LIVE, TOURNAMENT_VISIBILITY.VISIBLE),
      true,
    );
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.DRAFT, TOURNAMENT_VISIBILITY.VISIBLE),
      false,
    );
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.PUBLISHED, TOURNAMENT_VISIBILITY.HIDDEN),
      false,
    );
  });

  it('hides archived tournaments from contestants', () => {
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.ARCHIVED, TOURNAMENT_VISIBILITY.VISIBLE),
      false,
    );
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.COMPLETED, TOURNAMENT_VISIBILITY.ARCHIVED),
      false,
    );
    assert.equal(
      TournamentDomain.isTournamentVisibleToContestants(TOURNAMENT_STATUS.COMPLETED, TOURNAMENT_VISIBILITY.VISIBLE, true),
      false,
    );
    assert.equal(
      TournamentDomain.isTournamentArchived({
        status: TOURNAMENT_STATUS.ARCHIVED,
        visibility: TOURNAMENT_VISIBILITY.VISIBLE,
        archived: true,
      }),
      true,
    );
  });

  it('resolves registration status from dates only', () => {
    const start = new Date('2026-01-01T00:00:00');
    const end = new Date('2026-12-31T23:59:59');
    const during = new Date('2026-06-01T12:00:00');

    assert.equal(
      TournamentDomain.resolveRegistrationStatus(start, end, during),
      'open',
    );
    assert.equal(
      TournamentDomain.resolveRegistrationStatus(null, null, during),
      'not_configured',
    );
  });

  it('can publish only from draft', () => {
    assert.equal(TournamentDomain.canPublishTournament(TOURNAMENT_STATUS.DRAFT), true);
    assert.equal(TournamentDomain.canPublishTournament(TOURNAMENT_STATUS.PUBLISHED), false);
  });

  it('blocks tournament completion when visible matches are unfinished', () => {
    const matches = [
      { visible: true, status: MATCH_STATUS.RESULT_PUBLISHED },
      { visible: true, status: MATCH_STATUS.LIVE },
      { visible: false, status: MATCH_STATUS.PREDICTION_OPEN },
    ];

    assert.equal(
      TournamentDomain.canCompleteTournamentWithMatches(TOURNAMENT_STATUS.LIVE, matches),
      false,
    );
    assert.equal(TournamentDomain.getIncompleteVisibleMatches(matches).length, 1);
  });

  it('allows tournament completion when all visible matches are finished', () => {
    const matches = [
      { visible: true, status: MATCH_STATUS.COMPLETED },
      { visible: true, status: MATCH_STATUS.RESULT_PUBLISHED },
      { visible: false, status: MATCH_STATUS.PREDICTION_OPEN },
      { visible: true, status: MATCH_STATUS.ARCHIVED },
    ];

    assert.equal(
      TournamentDomain.canCompleteTournamentWithMatches(TOURNAMENT_STATUS.LIVE, matches),
      true,
    );
    assert.equal(TournamentDomain.getIncompleteVisibleMatches(matches).length, 0);
  });

  it('controls manual active state for draft and published tournaments', () => {
    const draftInactive = { status: TOURNAMENT_STATUS.DRAFT, active: false, archived: false };
    const draftActive = { status: TOURNAMENT_STATUS.DRAFT, active: true, archived: false };
    const publishedActive = { status: TOURNAMENT_STATUS.PUBLISHED, active: true, archived: false };

    assert.equal(TournamentDomain.canSetActiveTournament(draftInactive), true);
    assert.equal(TournamentDomain.canSetActiveTournament(draftActive), false);
    assert.equal(TournamentDomain.isActiveStateLocked(draftActive), false);
    assert.equal(TournamentDomain.isActiveStateLocked(publishedActive), true);
  });
});
