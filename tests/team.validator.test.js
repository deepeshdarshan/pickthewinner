import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreatePayload,
  validateName,
  validateFlagUrl,
} from '../public/js/master-data/teams/team.validator.js';

describe('TeamValidator', () => {
  it('requires team name', () => {
    const result = validateName('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.name);
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
      flagUrl: 'fi:br',
    });
    assert.equal(result.valid, true);
  });
});
