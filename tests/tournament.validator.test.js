import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateName,
  validateSeason,
  validateRegistrationDates,
  validateCreatePayload,
  validateScoringConfiguration,
  getTournamentValidationMessage,
} from '../public/js/tournament/tournament.validator.js';
import { createDefaultConfiguration, TOURNAMENT_MESSAGES } from '../public/js/tournament/tournament.constants.js';

/** @returns {Record<string, unknown>} */
function validConfiguration() {
  return {
    ...createDefaultConfiguration(),
    scoringConfiguration: {
      correctMatchScorePoints: 10,
      correctPenaltyWinnerPoints: 5,
    },
  };
}

describe('TournamentValidator', () => {
  it('requires tournament name', () => {
    const result = validateCreatePayload({
      name: '',
      configuration: createDefaultConfiguration(),
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.name);
  });

  it('accepts valid create payload without season or registration', () => {
    const result = validateCreatePayload({
      name: 'FIFA World Cup',
      configuration: validConfiguration(),
    });

    assert.equal(result.valid, true);
  });

  it('rejects missing scoring configuration', () => {
    const result = validateScoringConfiguration({});

    assert.equal(result.valid, false);
    assert.ok(result.errors.correctMatchScorePoints);
    assert.ok(result.errors.correctPenaltyWinnerPoints);
  });

  it('rejects non-integer scoring points', () => {
    const result = validateScoringConfiguration({
      correctMatchScorePoints: 10.5,
      correctPenaltyWinnerPoints: 5,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.correctMatchScorePoints);
  });

  it('rejects out-of-range scoring points', () => {
    const result = validateScoringConfiguration({
      correctMatchScorePoints: 101,
      correctPenaltyWinnerPoints: -1,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.correctMatchScorePoints);
    assert.ok(result.errors.correctPenaltyWinnerPoints);
  });

  it('accepts valid scoring configuration', () => {
    const result = validateScoringConfiguration({
      correctMatchScorePoints: 10,
      correctPenaltyWinnerPoints: 5,
    });

    assert.equal(result.valid, true);
  });

  it('rejects registration end before start', () => {
    const result = validateRegistrationDates(
      '2026-12-01T00:00',
      '2026-01-01T00:00',
    );

    assert.equal(result.valid, false);
    assert.ok(result.errors.registrationEnd);
  });

  it('validates individual name field', () => {
    assert.equal(validateName('WC').valid, true);
    assert.equal(validateName('A').valid, false);
    assert.equal(validateSeason('2026').valid, true);
  });

  it('returns a specific validation message for a single field error', () => {
    const message = getTournamentValidationMessage({
      errors: { correctMatchScorePoints: 'Points for correct match score are required.' },
    });

    assert.equal(message, 'Points for correct match score are required.');
  });

  it('returns a summary message for multiple field errors', () => {
    const message = getTournamentValidationMessage({
      errors: {
        name: 'Tournament name is required.',
        correctMatchScorePoints: 'Points for correct match score are required.',
      },
    });

    assert.equal(message, TOURNAMENT_MESSAGES.VALIDATION_SUMMARY);
  });
});
