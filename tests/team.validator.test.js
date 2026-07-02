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

  it('allows empty country', () => {
    const result = validateCountry('');
    assert.equal(result.valid, true);
  });

  it('accepts flag-icons value', () => {
    const result = validateFlagUrl('fi:br');
    assert.equal(result.valid, true);
  });

  it('accepts valid legacy flag URL', () => {
    const result = validateFlagUrl('https://example.com/flag.png');
    assert.equal(result.valid, true);
  });

  it('rejects invalid flag value', () => {
    const result = validateFlagUrl('not-a-url');
    assert.equal(result.valid, false);
    assert.ok(result.errors.flagUrl);
  });

  it('validates complete create payload', () => {
    const result = validateCreatePayload({
      name: 'Brazil',
      country: 'Brazil',
      flagUrl: 'fi:br',
    });
    assert.equal(result.valid, true);
  });
});
