import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionManagementDomain } from '../public/js/domain/prediction-management.domain.js';
import { PREDICTION_SORT_FIELD } from '../public/js/prediction/admin/prediction-management.constants.js';

/**
 * Service-layer logic tests (pure functions used by PredictionManagementService).
 */
describe('PredictionManagementService data shaping', () => {
  const predictions = [
    {
      id: 'p1',
      userId: 'u1',
      matchId: 'm1',
      homeScore: 2,
      awayScore: 1,
      status: 'saved',
      submittedAt: new Date('2026-06-02T10:00:00Z'),
      contestant: { uid: 'u1', displayName: 'Zara' },
      match: { id: 'm1', kickoffUtc: new Date('2026-06-10T18:00:00Z') },
    },
    {
      id: 'p2',
      userId: 'u2',
      matchId: 'm2',
      homeScore: 0,
      awayScore: 0,
      status: 'saved',
      submittedAt: new Date('2026-06-01T10:00:00Z'),
      contestant: { uid: 'u2', displayName: 'Aaron' },
      match: { id: 'm2', kickoffUtc: new Date('2026-06-05T18:00:00Z') },
    },
  ];

  it('retrieves and sorts predictions by submission time descending', () => {
    const enriched = predictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
    }));

    const sorted = PredictionManagementDomain.sortPredictions(
      enriched,
      PREDICTION_SORT_FIELD.SUBMITTED_AT,
      'desc',
    );

    assert.equal(sorted[0].id, 'p1');
    assert.equal(sorted[1].id, 'p2');
  });

  it('filters predictions for match-wise retrieval', () => {
    const enriched = predictions.map((prediction) => ({
      ...prediction,
      displayStatus: PredictionManagementDomain.resolveDisplayStatus(prediction),
    }));

    const filtered = PredictionManagementDomain.filterPredictions(enriched, { matchId: 'm2' });
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].matchId, 'm2');
  });

  it('paginates large result sets', () => {
    const many = Array.from({ length: 45 }, (_, index) => ({
      id: `p-${index}`,
      userId: `u-${index}`,
      matchId: 'm1',
      homeScore: 1,
      awayScore: 0,
      status: 'saved',
      submittedAt: new Date(),
    }));

    const page = PredictionManagementDomain.paginatePredictions(many, 2, 20);
    assert.equal(page.currentPage, 2);
    assert.equal(page.pageItems.length, 20);
    assert.equal(page.totalPages, 3);
  });
});
