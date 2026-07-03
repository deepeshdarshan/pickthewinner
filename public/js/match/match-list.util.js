/**
 * @fileoverview Pure match list filtering, sorting, and pagination helpers.
 * @module match/match-list.util
 */

import { MATCH_LIST_PAGE_SIZE } from './renderers/list.renderer.js';

/**
 * @typedef {import('./match.service.js').EnrichedMatch} EnrichedMatch
 */

/**
 * @param {EnrichedMatch[]} matches
 * @param {boolean} [descending]
 * @returns {EnrichedMatch[]}
 */
export function sortMatchesByKickoff(matches, descending = true) {
  return [...matches].sort((left, right) => {
    const leftTime = toKickoffTime(left.kickoffUtc);
    const rightTime = toKickoffTime(right.kickoffUtc);
    return descending ? rightTime - leftTime : leftTime - rightTime;
  });
}

/**
 * Returns matches with a future kickoff that have not been completed.
 * @param {EnrichedMatch[]} matches
 * @param {Date} [now]
 * @returns {EnrichedMatch[]}
 */
export function filterUpcomingMatches(matches, now = new Date()) {
  return matches.filter((match) => {
    const kickoff = toKickoffDate(match.kickoffUtc);
    if (!kickoff || kickoff <= now) {
      return false;
    }

    if (match.result?.published) {
      return false;
    }

    return true;
  });
}

/**
 * @param {EnrichedMatch[]} matches
 * @param {{
 *   search?: string,
 *   tournamentId?: string,
 *   status?: string,
 *   date?: string,
 * }} filters
 * @returns {EnrichedMatch[]}
 */
export function filterMatches(matches, filters) {
  const term = filters.search?.trim().toLowerCase() ?? '';

  return matches.filter((match) => {
    if (filters.tournamentId && match.tournamentId !== filters.tournamentId) {
      return false;
    }

    if (filters.status && match.status !== filters.status) {
      return false;
    }

    if (filters.date) {
      const kickoffDate = formatKickoffDateForFilter(match.kickoffUtc);
      if (!kickoffDate || kickoffDate !== filters.date) {
        return false;
      }
    }

    if (term && !JSON.stringify(match).toLowerCase().includes(term)) {
      return false;
    }

    return true;
  });
}

/**
 * @param {EnrichedMatch[]} matches
 * @param {number} page
 * @param {number} [pageSize]
 * @returns {{ pageMatches: EnrichedMatch[], totalPages: number, currentPage: number }}
 */
export function paginateMatches(matches, page, pageSize = MATCH_LIST_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    pageMatches: matches.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toKickoffTime(value) {
  const date = toKickoffDate(value);
  return date ? date.getTime() : 0;
}

/** @type {Readonly<string>} */
const MATCH_DISPLAY_TIMEZONE = 'Asia/Kolkata';

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatKickoffDateForFilter(value) {
  const date = toKickoffDate(value);
  if (!date) {
    return '';
  }

  return date.toLocaleDateString('en-CA', { timeZone: MATCH_DISPLAY_TIMEZONE });
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
