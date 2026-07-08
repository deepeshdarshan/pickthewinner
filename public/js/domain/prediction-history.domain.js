/**
 * @fileoverview Prediction history domain — pure filter, search, sort, grouping, and stats rules.
 * @module domain/prediction-history.domain
 */

import { MATCH_STATUS } from './match.domain.js';
import {
  resolvePrimaryResultBadge as resolveManagementPrimaryResultBadge,
  resolveResultBadges as resolveManagementResultBadges,
} from './prediction-management.domain.js';
import { toDate } from '../utils/date.util.js';
import {
  PREDICTION_HISTORY_RESULT_FILTER,
  PREDICTION_HISTORY_DATE_RANGE,
  PREDICTION_HISTORY_MATCH_STATUS,
  PREDICTION_HISTORY_SORT_FIELD,
  PREDICTION_HISTORY_DEFAULT_PAGE_SIZE,
  PREDICTION_HISTORY_HIGH_POINTS_THRESHOLD,
  PREDICTION_LIFECYCLE_STEP,
  PREDICTION_LIFECYCLE_LABELS,
} from '../prediction/history/prediction-history.constants.js';

/**
 * @typedef {import('./prediction-management.domain.js').EnrichedPrediction & {
 *   tournament?: Record<string, unknown>
 * }} HistoryItem
 */

/**
 * @typedef {Object} HistoryFilterState
 * @property {string} [tournamentId]
 * @property {string} [stage]
 * @property {string} [matchStatus]
 * @property {string} [resultFilter]
 * @property {string} [dateRange]
 * @property {string} [search]
 */

/**
 * @typedef {Object} OverallStatistics
 * @property {number} predictionsSubmitted
 * @property {number} predictionsCompleted
 * @property {number} correctWinners
 * @property {number} exactScores
 * @property {number} bonusPoints
 * @property {number} totalPoints
 * @property {number} accuracy
 */

/**
 * @typedef {Object} TournamentSummary
 * @property {string} tournamentId
 * @property {string} tournamentName
 * @property {string} status
 * @property {number} matchesPredicted
 * @property {number} pointsEarned
 * @property {number} accuracy
 * @property {number} completionPercentage
 * @property {number|null} rank
 */

/**
 * @typedef {Object} StageStatistics
 * @property {string} stage
 * @property {number} predictions
 * @property {number} correctWinners
 * @property {number} exactScores
 * @property {number} accuracy
 */

/**
 * @typedef {Object} LifecycleStep
 * @property {string} key
 * @property {string} label
 * @property {boolean} completed
 * @property {boolean} current
 */

/**
 * @typedef {import('./prediction-management.domain.js').PrimaryResultBadge} PrimaryResultBadge
 */

export const PredictionHistoryDomain = {
  /**
   * @param {HistoryItem[]} items
   * @param {HistoryFilterState} filters
   * @returns {HistoryItem[]}
   */
  filterHistoryItems(items, filters) {
    let filtered = [...items];

    if (filters.tournamentId) {
      filtered = filtered.filter((item) => item.tournamentId === filters.tournamentId);
    }

    if (filters.stage) {
      filtered = filtered.filter((item) => {
        const stage = String(item.match?.stage ?? item.match?.round ?? '');
        return stage === filters.stage;
      });
    }

    if (filters.matchStatus && filters.matchStatus !== PREDICTION_HISTORY_MATCH_STATUS.ALL) {
      filtered = filtered.filter((item) => matchesMatchStatus(item, filters.matchStatus));
    }

    if (filters.resultFilter && filters.resultFilter !== PREDICTION_HISTORY_RESULT_FILTER.ALL) {
      filtered = filtered.filter((item) => matchesResultFilter(item, filters.resultFilter));
    }

    if (filters.dateRange && filters.dateRange !== PREDICTION_HISTORY_DATE_RANGE.ALL) {
      filtered = filtered.filter((item) => matchesDateRange(item, filters.dateRange));
    }

    if (filters.search) {
      filtered = PredictionHistoryDomain.searchHistoryItems(filtered, filters.search);
    }

    return filtered;
  },

  /**
   * @param {HistoryItem[]} items
   * @param {string} term
   * @returns {HistoryItem[]}
   */
  searchHistoryItems(items, term) {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      return items;
    }

    return items.filter((item) => matchesSearchTerm(item, normalized));
  },

  /**
   * @param {HistoryItem[]} items
   * @param {string} field
   * @param {'asc'|'desc'} [direction]
   * @returns {HistoryItem[]}
   */
  sortHistoryItems(items, field, direction = 'desc') {
    const sorted = [...items].sort((left, right) => {
      let comparison = 0;

      switch (field) {
        case PREDICTION_HISTORY_SORT_FIELD.POINTS:
          comparison = Number(left.calculatedPoints ?? 0) - Number(right.calculatedPoints ?? 0);
          break;
        case PREDICTION_HISTORY_SORT_FIELD.TOURNAMENT:
          comparison = getTournamentName(left).localeCompare(getTournamentName(right));
          break;
        case PREDICTION_HISTORY_SORT_FIELD.ACCURACY:
          comparison = getAccuracyScore(left) - getAccuracyScore(right);
          break;
        case PREDICTION_HISTORY_SORT_FIELD.MATCH_DATE:
        default:
          comparison = toTime(left.match?.kickoffUtc) - toTime(right.match?.kickoffUtc);
      }

      return direction === 'asc' ? comparison : -comparison;
    });

    return sorted;
  },

  /**
   * @param {HistoryItem[]} items
   * @returns {Array<{ label: string, items: HistoryItem[] }>}
   */
  groupByMonth(items) {
    const groups = new Map();

    for (const item of items) {
      const kickoff = toDate(item.match?.kickoffUtc);
      const label = kickoff
        ? new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(kickoff)
        : 'Unknown Date';

      if (!groups.has(label)) {
        groups.set(label, []);
      }

      groups.get(label).push(item);
    }

    return Array.from(groups.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  },

  /**
   * @param {HistoryItem[]} items
   * @returns {TournamentSummary[]}
   */
  groupByTournament(items) {
    const groups = new Map();

    for (const item of items) {
      const tournamentId = String(item.tournamentId ?? '');
      if (!groups.has(tournamentId)) {
        groups.set(tournamentId, []);
      }
      groups.get(tournamentId).push(item);
    }

    return Array.from(groups.entries()).map(([tournamentId, groupItems]) => {
      const tournament = groupItems[0]?.tournament ?? {};
      const completed = groupItems.filter((item) => Boolean(item.match?.result?.published));
      const correctWinners = completed.filter((item) => item.winnerPredictionCorrect).length;
      const totalMatches = Number(tournament.totalMatches ?? groupItems.length);
      const pointsEarned = groupItems.reduce((sum, item) => sum + Number(item.calculatedPoints ?? 0), 0);

      return {
        tournamentId,
        tournamentName: getTournamentName(groupItems[0]),
        status: String(tournament.status ?? ''),
        matchesPredicted: groupItems.length,
        pointsEarned,
        accuracy: completed.length > 0 ? Math.round((correctWinners / completed.length) * 100) : 0,
        completionPercentage: totalMatches > 0
          ? Math.round((groupItems.length / totalMatches) * 100)
          : 100,
        rank: null,
      };
    });
  },

  /**
   * @param {HistoryItem[]} items
   * @param {number} page
   * @param {number} [pageSize]
   * @returns {{ pageItems: HistoryItem[], totalPages: number, currentPage: number, totalRecords: number }}
   */
  paginateHistoryItems(items, page, pageSize = PREDICTION_HISTORY_DEFAULT_PAGE_SIZE) {
    const totalRecords = items.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const start = (currentPage - 1) * pageSize;

    return {
      pageItems: items.slice(start, start + pageSize),
      totalPages,
      currentPage,
      totalRecords,
    };
  },

  /**
   * @param {HistoryItem[]} items
   * @returns {OverallStatistics}
   */
  calculateOverallStatistics(items) {
    const completed = items.filter((item) => Boolean(item.match?.result?.published));
    const correctWinners = completed.filter((item) => item.winnerPredictionCorrect).length;
    const exactScores = completed.filter((item) => item.exactScoreCorrect).length;
    const totalPoints = items.reduce((sum, item) => sum + Number(item.calculatedPoints ?? 0), 0);
    const bonusPoints = items.reduce((sum, item) => sum + resolveBonusPoints(item.scoringBreakdown), 0);

    return {
      predictionsSubmitted: items.length,
      predictionsCompleted: completed.length,
      correctWinners,
      exactScores,
      bonusPoints,
      totalPoints,
      accuracy: completed.length > 0 ? Math.round((correctWinners / completed.length) * 100) : 0,
    };
  },

  /**
   * @param {HistoryItem[]} items
   * @returns {StageStatistics[]}
   */
  calculateStageStatistics(items) {
    const stageMap = new Map();

    for (const item of items) {
      const stage = String(item.match?.stage ?? item.match?.round ?? 'Other');
      if (!stageMap.has(stage)) {
        stageMap.set(stage, []);
      }
      stageMap.get(stage).push(item);
    }

    return Array.from(stageMap.entries()).map(([stage, stageItems]) => {
      const completed = stageItems.filter((entry) => Boolean(entry.match?.result?.published));
      const correctWinners = completed.filter((entry) => entry.winnerPredictionCorrect).length;
      const exactScores = completed.filter((entry) => entry.exactScoreCorrect).length;

      return {
        stage,
        predictions: stageItems.length,
        correctWinners,
        exactScores,
        accuracy: completed.length > 0 ? Math.round((correctWinners / completed.length) * 100) : 0,
      };
    });
  },

  /**
   * @param {HistoryItem} prediction
   * @param {Record<string, unknown>} match
   * @returns {LifecycleStep[]}
   */
  buildPredictionLifecycle(prediction, match) {
    const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
    const hasSubmitted = Boolean(prediction.submittedAt || prediction.status);
    const isLocked = Boolean(prediction.locked);
    const matchStatus = String(match.status ?? '');
    const isLive = matchStatus === MATCH_STATUS.LIVE;
    const isCompleted = [MATCH_STATUS.COMPLETED, MATCH_STATUS.RESULT_PUBLISHED].includes(matchStatus);
    const hasResult = Boolean(result.published);
    const hasPoints = Boolean(prediction.scored || Number(prediction.calculatedPoints ?? 0) > 0);

    const steps = [
      { key: PREDICTION_LIFECYCLE_STEP.SUBMITTED, completed: hasSubmitted },
      { key: PREDICTION_LIFECYCLE_STEP.LOCKED, completed: isLocked },
      { key: PREDICTION_LIFECYCLE_STEP.MATCH_STARTED, completed: isLive || isCompleted || hasResult },
      { key: PREDICTION_LIFECYCLE_STEP.MATCH_COMPLETED, completed: isCompleted || hasResult },
      { key: PREDICTION_LIFECYCLE_STEP.RESULTS_PUBLISHED, completed: hasResult },
      { key: PREDICTION_LIFECYCLE_STEP.POINTS_AWARDED, completed: hasPoints },
    ];

    let foundCurrent = false;

    return steps.map((step) => {
      const lifecycleStep = {
        key: step.key,
        label: PREDICTION_LIFECYCLE_LABELS[step.key] ?? step.key,
        completed: step.completed,
        current: false,
      };

      if (!foundCurrent && !step.completed) {
        lifecycleStep.current = true;
        foundCurrent = true;
      }

      return lifecycleStep;
    });
  },

  /**
   * @param {unknown} breakdown
   * @returns {number}
   */
  resolveBonusPoints(breakdown) {
    return resolveBonusPoints(breakdown);
  },

  /**
   * Resolves scoring-relevant result badges for history display.
   * @param {HistoryItem} item
   * @returns {PrimaryResultBadge[]}
   */
  resolveResultBadges(item) {
    return resolveResultBadges(item);
  },

  /**
   * Resolves the single scoring-relevant result badge for history display.
   * @param {HistoryItem} item
   * @returns {PrimaryResultBadge|null}
   */
  resolvePrimaryResultBadge(item) {
    return resolvePrimaryResultBadge(item);
  },
};

/**
 * @param {HistoryItem} item
 * @returns {PrimaryResultBadge[]}
 */
export function resolveResultBadges(item) {
  return resolveManagementResultBadges(item);
}

/**
 * @param {HistoryItem} item
 * @returns {PrimaryResultBadge|null}
 */
export function resolvePrimaryResultBadge(item) {
  return resolveManagementPrimaryResultBadge(item);
}

/**
 * @param {unknown} breakdown
 * @returns {number}
 */
export function resolveBonusPoints(breakdown) {
  if (!Array.isArray(breakdown)) {
    return 0;
  }

  return breakdown.reduce((sum, item) => {
    const label = String(item?.label ?? '').toLowerCase();
    if (label.includes('bonus')) {
      return sum + Number(item?.points ?? 0);
    }
    return sum;
  }, 0);
}

/**
 * @param {HistoryItem} item
 * @param {string} matchStatus
 * @returns {boolean}
 */
function matchesMatchStatus(item, matchStatus) {
  const result = item.match?.result ?? {};
  const published = Boolean(result.published);

  switch (matchStatus) {
    case PREDICTION_HISTORY_MATCH_STATUS.COMPLETED:
      return published;
    case PREDICTION_HISTORY_MATCH_STATUS.PENDING:
      return !published;
    case PREDICTION_HISTORY_MATCH_STATUS.LOCKED:
      return Boolean(item.locked);
    default:
      return true;
  }
}

/**
 * @param {HistoryItem} item
 * @param {string} resultFilter
 * @returns {boolean}
 */
function matchesResultFilter(item, resultFilter) {
  const hasResult = Boolean(item.match?.result?.published);

  switch (resultFilter) {
    case PREDICTION_HISTORY_RESULT_FILTER.WINNER_CORRECT:
      return hasResult && item.winnerPredictionCorrect === true;
    case PREDICTION_HISTORY_RESULT_FILTER.WINNER_INCORRECT:
      return hasResult && item.winnerPredictionCorrect === false;
    case PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_CORRECT:
      return hasResult && item.exactScoreCorrect === true;
    case PREDICTION_HISTORY_RESULT_FILTER.EXACT_SCORE_INCORRECT:
      return hasResult && item.exactScoreCorrect === false;
    case PREDICTION_HISTORY_RESULT_FILTER.HIGH_POINTS:
      return Number(item.calculatedPoints ?? 0) >= PREDICTION_HISTORY_HIGH_POINTS_THRESHOLD;
    default:
      return true;
  }
}

/**
 * @param {HistoryItem} item
 * @param {string} dateRange
 * @returns {boolean}
 */
function matchesDateRange(item, dateRange) {
  const kickoff = toDate(item.match?.kickoffUtc);
  if (!kickoff) {
    return dateRange === PREDICTION_HISTORY_DATE_RANGE.ALL;
  }

  const now = new Date();
  const diffMs = now.getTime() - kickoff.getTime();

  switch (dateRange) {
    case PREDICTION_HISTORY_DATE_RANGE.LAST_30:
      return diffMs <= 30 * 24 * 60 * 60 * 1000;
    case PREDICTION_HISTORY_DATE_RANGE.LAST_90:
      return diffMs <= 90 * 24 * 60 * 60 * 1000;
    case PREDICTION_HISTORY_DATE_RANGE.THIS_YEAR:
      return kickoff.getFullYear() === now.getFullYear();
    default:
      return true;
  }
}

/**
 * @param {HistoryItem} item
 * @param {string} term
 * @returns {boolean}
 */
function matchesSearchTerm(item, term) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const haystack = [
    tournament.name,
    tournament.title,
    match.homeTeam?.name,
    match.awayTeam?.name,
    match.stage,
    match.round,
    match.matchNumber,
    item.predictedWinnerName,
    `${item.homeScore}-${item.awayScore}`,
  ].filter(Boolean).join(' ').toLowerCase();

  return haystack.includes(term);
}

/**
 * @param {HistoryItem} [item]
 * @returns {string}
 */
function getTournamentName(item) {
  const tournament = item?.tournament ?? {};
  return String(tournament.name ?? tournament.title ?? 'Tournament');
}

/**
 * @param {HistoryItem} item
 * @returns {number}
 */
function getAccuracyScore(item) {
  if (!item.match?.result?.published) {
    return -1;
  }

  let score = 0;
  if (item.winnerPredictionCorrect) {
    score += 1;
  }
  if (item.exactScoreCorrect) {
    score += 1;
  }
  return score;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function toTime(value) {
  const date = toDate(value);
  return date ? date.getTime() : 0;
}
