/**
 * @fileoverview Decorative Bootstrap icon backgrounds for match cards.
 * @module components/match-card-bg-icons.component
 */

import { MATCH_STATUS } from '../domain/match.domain.js';

/** @type {ReadonlySet<string>} */
const TERMINAL_MATCH_STATUSES = new Set([
  MATCH_STATUS.COMPLETED,
  MATCH_STATUS.RESULT_PUBLISHED,
  MATCH_STATUS.ARCHIVED,
]);

/** @type {Readonly<Record<string, ReadonlyArray<{ icon: string, modifier: string }>>>} */
const MATCH_CARD_BG_ICONS = Object.freeze({
  live: [
    { icon: 'bi-broadcast-pin', modifier: '--primary' },
    { icon: 'bi-stopwatch', modifier: '--secondary' },
    { icon: 'bi-flag-fill', modifier: '--tertiary' },
  ],
  upcoming: [
    { icon: 'bi-dribbble', modifier: '--primary' },
    { icon: 'bi-bullseye', modifier: '--secondary' },
    { icon: 'bi-trophy', modifier: '--tertiary' },
  ],
  history: [
    { icon: 'bi-dribbble', modifier: '--primary' },
    { icon: 'bi-bullseye', modifier: '--secondary' },
    { icon: 'bi-trophy', modifier: '--tertiary' },
  ],
  empty: [
    { icon: 'bi-dribbble', modifier: '--primary' },
    { icon: 'bi-clock', modifier: '--secondary' },
    { icon: 'bi-bullseye', modifier: '--tertiary' },
  ],
});

/**
 * @param {'live'|'upcoming'|'history'|'empty'} variant
 * @returns {string}
 */
export function renderMatchCardBgIcons(variant) {
  const icons = MATCH_CARD_BG_ICONS[variant] ?? MATCH_CARD_BG_ICONS.upcoming;

  return `
    <div class="ptw-decorated-card__bg-icons" aria-hidden="true">
      ${icons.map(({ icon, modifier }) => `
        <i class="bi ${icon} ptw-decorated-card__bg-icon ptw-decorated-card__bg-icon${modifier}"></i>
      `).join('')}
    </div>
  `;
}

/** @deprecated Use renderMatchCardBgIcons — kept for existing dashboard imports. */
export const renderFeaturedMatchBgIcons = renderMatchCardBgIcons;

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @param {Date} [now]
 * @returns {'live'|'upcoming'}
 */
export function resolveMatchCardBgIconVariant(match, now = new Date()) {
  return isLiveMatch(match, now) ? 'live' : 'upcoming';
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @param {Date} [now]
 * @returns {string}
 */
export function resolveMatchCardThemeClass(match, now = new Date()) {
  return isLiveMatch(match, now) ? 'ptw-match-card--live' : 'ptw-match-card--upcoming';
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @param {Date} [now]
 * @returns {boolean}
 */
function isLiveMatch(match, now) {
  if (match.result?.published) {
    return false;
  }

  if (TERMINAL_MATCH_STATUSES.has(String(match.status ?? ''))) {
    return false;
  }

  if (match.status === MATCH_STATUS.LIVE) {
    return true;
  }

  const kickoff = toKickoffDate(match.kickoffUtc);
  return kickoff !== null && kickoff <= now;
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toKickoffDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
