import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TournamentDomain, TOURNAMENT_STATUS } from '../public/js/domain/tournament.domain.js';
import {
  chunkDocumentRefsForDelete,
  TOURNAMENT_DELETE_BATCH_SIZE,
} from '../public/js/tournament/tournament-delete.util.js';
import { TOURNAMENT_MESSAGES } from '../public/js/tournament/tournament.constants.js';
import { validateLifecycleAction } from '../public/js/tournament/tournament.validator.js';
import { LIFECYCLE_ACTIONS } from '../public/js/tournament/tournament.constants.js';

describe('Tournament permanent delete rules', () => {
  it('rejects delete lifecycle action for non-archived tournaments', () => {
    const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.DELETE, {
      status: TOURNAMENT_STATUS.COMPLETED,
      archived: false,
      active: false,
    });

    assert.equal(validation.valid, false);
    assert.equal(validation.errors.lifecycle, TOURNAMENT_MESSAGES.CANNOT_DELETE_NOT_ARCHIVED);
  });

  it('rejects delete lifecycle action for active archived tournaments', () => {
    const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.DELETE, {
      status: TOURNAMENT_STATUS.ARCHIVED,
      archived: true,
      active: true,
    });

    assert.equal(validation.valid, false);
    assert.equal(validation.errors.lifecycle, TOURNAMENT_MESSAGES.CANNOT_DELETE_ACTIVE);
  });

  it('allows delete lifecycle action for archived non-active tournaments', () => {
    const validation = validateLifecycleAction(LIFECYCLE_ACTIONS.DELETE, {
      status: TOURNAMENT_STATUS.ARCHIVED,
      archived: true,
      active: false,
    });

    assert.equal(validation.valid, true);
    assert.equal(TournamentDomain.canPermanentlyDeleteTournament({
      status: TOURNAMENT_STATUS.ARCHIVED,
      archived: true,
      active: false,
    }), true);
  });
});

describe('chunkDocumentRefsForDelete', () => {
  it('returns a single chunk when refs fit within the batch limit', () => {
    const refs = Array.from({ length: 10 }, (_, index) => ({ id: `ref-${index}` }));
    const chunks = chunkDocumentRefsForDelete(refs);

    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].length, 10);
  });

  it('splits refs into multiple chunks when exceeding the batch limit', () => {
    const refs = Array.from({ length: 600 }, (_, index) => ({ id: `ref-${index}` }));
    const chunks = chunkDocumentRefsForDelete(refs, TOURNAMENT_DELETE_BATCH_SIZE);

    assert.equal(chunks.length, 2);
    assert.equal(chunks[0].length, TOURNAMENT_DELETE_BATCH_SIZE);
    assert.equal(chunks[1].length, 100);
  });

  it('plans tournament delete batches for predictions, matches, cache, and tournament docs', () => {
    const predictionCount = 250;
    const matchCount = 40;
    const deleteCount = predictionCount + matchCount + 2;
    const refs = Array.from({ length: deleteCount }, (_, index) => ({ id: `ref-${index}` }));
    const chunks = chunkDocumentRefsForDelete(refs);

    assert.equal(chunks.length, 1);
    assert.equal(deleteCount, 292);
  });
});
