import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildFallbackMatchStages, DEFAULT_MATCH_STAGES } from '../public/js/master-data/match-stages/match-stage.constants.js';

describe('MatchStageService', () => {
  it('buildFallbackMatchStages mirrors DEFAULT_MATCH_STAGES with synthetic ids', () => {
    const stages = buildFallbackMatchStages();

    assert.equal(stages.length, DEFAULT_MATCH_STAGES.length);
    assert.equal(stages[0].id, `default_${DEFAULT_MATCH_STAGES[0].value}`);
    assert.equal(stages[0].label, DEFAULT_MATCH_STAGES[0].label);
    assert.equal(stages[0].value, DEFAULT_MATCH_STAGES[0].value);
    assert.equal(stages[0].active, true);
  });
});
