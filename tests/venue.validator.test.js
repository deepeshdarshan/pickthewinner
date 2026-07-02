import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateCreatePayload,
  validateName,
  validateCity,
  validateCapacity,
} from '../public/js/master-data/venues/venue.validator.js';

describe('VenueValidator', () => {
  it('requires venue name', () => {
    const result = validateName('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.name);
  });

  it('requires city', () => {
    const result = validateCity('');
    assert.equal(result.valid, false);
    assert.ok(result.errors.city);
  });

  it('rejects invalid capacity', () => {
    const result = validateCapacity(0);
    assert.equal(result.valid, false);
    assert.ok(result.errors.capacity);
  });

  it('validates complete create payload', () => {
    const result = validateCreatePayload({
      name: 'Lusail Stadium',
      city: 'Lusail',
      country: 'Qatar',
      capacity: 80000,
    });
    assert.equal(result.valid, true);
  });
});
