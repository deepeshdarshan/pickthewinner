import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { PredictionHistoryDomain } from '../public/js/domain/prediction-history.domain.js';
import { PredictionManagementDomain } from '../public/js/domain/prediction-management.domain.js';

/**
 * Repository integration tests require Firestore; this file validates
 * query result shaping and filter compatibility with repository output.
 */
describe('PredictionHistoryRepository query compatibility', () => {
  it('accepts repository-shaped prediction documents', () => {
    const repositoryDoc = {
      id: 'pred-1',
      userId: 'user-1',
      matchId: 'match-1',
      tournamentId: 'tournament-1',
      homeScore: 2,
      awayScore: 1,
      calculatedPoints: 8,
      scored: true,
      status: 'scored',
      submittedAt: { toDate: () => new Date('2026-06-01T12:00:00Z') },
      updatedAt: { toDate: () => new Date('2026-06-01T12:00:00Z') },
      scoringBreakdown: [
        { label: 'Winner', points: 3, correct: true },
        { label: 'Exact Score Bonus', points: 5, correct: true },
      ],
    };

    const match = {
      id: 'match-1',
      kickoffUtc: new Date('2026-06-10T18:00:00Z'),
      homeTeam: { name: 'Brazil' },
      awayTeam: { name: 'Colombia' },
      result: { published: true, homeScore: 2, awayScore: 1 },
    };

    const enriched = {
      ...PredictionManagementDomain.enrichPrediction(repositoryDoc, match),
      match,
      tournament: { id: 'tournament-1', name: 'World Cup' },
    };

    const filtered = PredictionHistoryDomain.filterHistoryItems([enriched], {
      resultFilter: 'winner_correct',
    });

    assert.equal(enriched.winnerPredictionCorrect, true);
    assert.equal(enriched.exactScoreCorrect, true);
    assert.equal(filtered.length, 1);
    assert.equal(PredictionHistoryDomain.calculateOverallStatistics([enriched]).totalPoints, 8);
  });

  // Firestore security: contestants may read only predictions where resource.data.userId == request.auth.uid
  // See firestore.rules match /predictions/{predictionId} allow read rule.
});
