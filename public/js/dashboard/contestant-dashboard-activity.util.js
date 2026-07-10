/**
 * @fileoverview Recent activity feed builder for the contestant dashboard.
 * @module dashboard/contestant-dashboard-activity.util
 */

import { MATCH_COUNTDOWN_PHASE } from '../domain/match.domain.js';
import { formatDateTime, getCalendarDayDifference, toDate } from '../utils/date.util.js';

/** @type {number} */
const ACTIVITY_ITEM_LIMIT = 5;

/**
 * @typedef {Object} ContestantActivityItem
 * @property {string} id
 * @property {string} type
 * @property {string} message
 * @property {string} timestampLabel
 */

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function formatMatchTeamsLabel(match) {
  return `${match.homeTeam?.name ?? 'Home'} vs ${match.awayTeam?.name ?? 'Away'}`;
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function isPredictionWindowOpen(match) {
  return match.predictionStatus === 'Open'
    || match.matchCountdown?.phase === MATCH_COUNTDOWN_PHASE.OPEN;
}

/**
 * @param {Date|null} date
 * @param {Date} now
 * @param {string} [prefix]
 * @returns {string}
 */
function formatActivityTimestamp(date, now, prefix = '') {
  if (!date) {
    return prefix ? `${prefix} recently` : 'Recently';
  }

  const diffMs = now.getTime() - date.getTime();
  const withPrefix = (label) => (prefix ? `${prefix} ${label}` : label);

  if (diffMs < 60_000) {
    return withPrefix('just now');
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return withPrefix(`${diffMinutes}m ago`);
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return withPrefix(`${diffHours}h ago`);
  }

  const diffDays = getCalendarDayDifference(date, now);
  if (diffDays === 1) {
    return withPrefix('yesterday');
  }

  if (diffDays < 7) {
    return withPrefix(`${diffDays} days ago`);
  }

  const formatted = formatDateTime(date);
  return prefix ? `${prefix} ${formatted}` : formatted;
}

/**
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {string|null} userId
 * @param {Date} [now]
 * @returns {ContestantActivityItem[]}
 */
export function buildRecentActivity(matches, userId, now = new Date()) {
  if (!userId) {
    return [];
  }

  /** @type {Array<ContestantActivityItem & { sortAt: Date }>} */
  const items = [];

  for (const match of matches) {
    if (!match.result?.published) {
      continue;
    }

    const publishedAt = toDate(match.result.publishedAt) ?? now;
    items.push({
      id: `result-${match.id}`,
      type: 'result',
      message: `Result published for ${formatMatchTeamsLabel(match)}.`,
      timestampLabel: formatActivityTimestamp(publishedAt, now, 'Published'),
      sortAt: publishedAt,
    });
  }

  for (const match of matches) {
    if (match.result?.published || !isPredictionWindowOpen(match)) {
      continue;
    }

    const opensAt = toDate(match.matchCountdown?.opensAt);
    const openedAt = opensAt && opensAt <= now ? opensAt : now;

    items.push({
      id: `prediction-${match.id}`,
      type: 'prediction',
      message: `Prediction window open for ${formatMatchTeamsLabel(match)}.`,
      timestampLabel: formatActivityTimestamp(openedAt, now, 'Opened'),
      sortAt: openedAt,
    });
  }

  if (items.length === 0) {
    return [{
      id: 'welcome-activity',
      type: 'info',
      message: 'Submit predictions for upcoming matches to see activity here.',
      timestampLabel: 'Now',
    }];
  }

  return items
    .sort((a, b) => b.sortAt.getTime() - a.sortAt.getTime())
    .slice(0, ACTIVITY_ITEM_LIMIT)
    .map(({ sortAt, ...item }) => item);
}
