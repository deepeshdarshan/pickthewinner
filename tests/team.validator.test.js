import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreatePayload,
  validateName,
  validateCountry,
  validateFlagUrl,
} from '../public/js/master-data/teams/team.validator.js';

describe('TeamValidator', () => {
  it('requires team name', () => {
    const result = validateName('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.name);
  });

  it('requires country', () => {
    const result = validateCountry('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.country);
  });

  it('accepts valid flag URL', () => {
    const result = validateFlagUrl('https://example.com/flag.png');
    assert.equal(result.valid, true);
  });

  it('rejects invalid flag URL', () => {
    const result = validateFlagUrl('not-a-url');
    assert.equal(result.valid, false);
    assert.ok(result.errors.flagUrl);
  });

  it('validates complete create payload', () => {
    const result = validateCreatePayload({
      name: 'Brazil',
      country: 'Brazil',
      flagUrl: 'https://example.com/br.png',
    });
    assert.equal(result.valid, true);
  });
});
