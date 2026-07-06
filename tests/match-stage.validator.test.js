import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateCreatePayload } from '../public/js/master-data/match-stages/match-stage.validator.js';

describe('MatchStageValidator', () => {
  it('requires label and value', () => {
    const result = validateCreatePayload({});

    assert.equal(result.valid, false);
    assert.ok(result.errors.label);
    assert.ok(result.errors.value);
  });

  it('rejects invalid value key format', () => {
    const result = validateCreatePayload({
      label: 'Quarter Final',
      value: 'Quarter-Final',
      sortOrder: 10,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.value);
  });

  it('rejects negative sort order', () => {
    const result = validateCreatePayload({
      label: 'Quarter Final',
      value: 'quarter_final',
      sortOrder: -1,
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.sortOrder);
  });

  it('accepts valid payload', () => {
    const result = validateCreatePayload({
      label: 'Semi Final',
      value: 'semi_final',
      sortOrder: 50,
      active: true,
    });

    assert.equal(result.valid, true);
  });
});

