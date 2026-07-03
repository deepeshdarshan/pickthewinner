import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionManagementDomain } from '../public/js/domain/prediction-management.domain.js';

/**
 * Repository integration tests require Firestore; this file validates
 * query result shaping and filter compatibility with repository output.
 */
describe('PredictionManagementRepository query compatibility', () => {
  it('accepts repository-shaped prediction documents', () => {
    const repositoryDoc = {
      id: 'pred-1',
      userId: 'user-1',
      matchId: 'match-1',
      tournamentId: 'tournament-1',
      homeScore: 1,
      awayScore: 0,
      status: 'saved',
      submittedAt: { toDate: () => new Date('2026-06-01T12:00:00Z') },
      updatedAt: { toDate: () => new Date('2026-06-01T12:00:00Z') },
    };

    const enriched = PredictionManagementDomain.enrichPrediction(repositoryDoc, {
      homeTeam: { name: 'Team A' },
      awayTeam: { name: 'Team B' },
    });

    assert.equal(enriched.displayStatus, 'submitted');
    assert.equal(enriched.predictedWinnerName, 'Team A');
  });

  it('validates filter constraints', () => {
    const result = PredictionManagementDomain.validateFilters({ search: 'a'.repeat(201) });
    assert.equal(result.valid, false);
    assert.ok(result.errors.search);
  });
});
