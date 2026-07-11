import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRankLabel,
  getRankBadgeModifier,
  getRankRowHighlightClass,
  renderRankBadge,
} from '../public/js/shared/badges/rank-badge.component.js';

describe('rank-badge.component', () => {
  it('maps top ranks to medal modifiers', () => {
    assert.equal(getRankBadgeModifier(1), 'gold');
    assert.equal(getRankBadgeModifier(2), 'silver');
    assert.equal(getRankBadgeModifier(3), 'bronze');
    assert.equal(getRankBadgeModifier(4), 'default');
    assert.equal(getRankBadgeModifier(null), 'default');
  });

  it('formats null ranks as an em dash', () => {
    assert.equal(formatRankLabel(null), '—');
    assert.equal(formatRankLabel(5), '5');
  });

  it('renders featured badges with labels and trophy icons for top ranks', () => {
    const html = renderRankBadge(1, { variant: 'featured', showLabel: true });

    assert.match(html, /ptw-rank-badge--featured/);
    assert.match(html, /ptw-rank-badge--gold/);
    assert.match(html, /bi-trophy-fill/);
    assert.match(html, /ptw-rank-badge__label/);
    assert.match(html, />Rank</);
    assert.match(html, />1</);
  });

  it('adds row highlight classes for podium ranks only', () => {
    assert.equal(getRankRowHighlightClass(1).trim(), 'ptw-rank-row--gold');
    assert.equal(getRankRowHighlightClass(8), '');
  });
});
