/**
 * @fileoverview Domain logic for admin contestant prediction history list.
 * @module domain/admin-prediction-history.domain
 */

import { ADMIN_PREDICTION_HISTORY_SORT_FIELD } from '../prediction/admin/admin-prediction-history.constants.js';

/**
 * @typedef {Object} AdminContestantHistoryRow
 * @property {string} uid
 * @property {string} name
 * @property {string} photoURL
 * @property {number} tournamentsJoined
 * @property {number} predictionsSubmitted
 * @property {number|null} currentPoints
 * @property {number|null} currentRank
 * @property {number} accuracy
 * @property {number} correctWinnerCount
 * @property {number} exactScoreCount
 */

/**
 * @typedef {Object} AdminContestantListQuery
 * @property {string} search
 * @property {string} sortField
 * @property {'asc'|'desc'} sortDirection
 * @property {number} page
 * @property {number} pageSize
 */

export const AdminPredictionHistoryDomain = {
  /**
   * @param {AdminContestantHistoryRow[]} rows
   * @param {string} search
   * @returns {AdminContestantHistoryRow[]}
   */
  filterRows(rows, search) {
    const term = String(search ?? '').trim().toLowerCase();

    if (!term) {
      return rows;
    }

    return rows.filter((row) => row.name.toLowerCase().includes(term));
  },

  /**
   * @param {AdminContestantHistoryRow[]} rows
   * @param {string} sortField
   * @param {'asc'|'desc'} sortDirection
   * @returns {AdminContestantHistoryRow[]}
   */
  sortRows(rows, sortField, sortDirection) {
    const direction = sortDirection === 'asc' ? 1 : -1;
    const sorted = [...rows];

    sorted.sort((left, right) => {
      switch (sortField) {
        case ADMIN_PREDICTION_HISTORY_SORT_FIELD.TOURNAMENTS:
          return (left.tournamentsJoined - right.tournamentsJoined) * direction;
        case ADMIN_PREDICTION_HISTORY_SORT_FIELD.PREDICTIONS:
          return (left.predictionsSubmitted - right.predictionsSubmitted) * direction;
        case ADMIN_PREDICTION_HISTORY_SORT_FIELD.POINTS:
          return (compareNullableNumbers(left.currentPoints, right.currentPoints)) * direction;
        case ADMIN_PREDICTION_HISTORY_SORT_FIELD.RANK:
          return (compareNullableNumbers(left.currentRank, right.currentRank)) * direction;
        case ADMIN_PREDICTION_HISTORY_SORT_FIELD.NAME:
        default:
          return left.name.localeCompare(right.name) * direction;
      }
    });

    return sorted;
  },

  /**
   * @param {AdminContestantHistoryRow[]} rows
   * @param {number} page
   * @param {number} pageSize
   * @returns {{ pageRows: AdminContestantHistoryRow[], totalPages: number, currentPage: number, totalRecords: number }}
   */
  paginateRows(rows, page, pageSize) {
    const totalRecords = rows.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const startIndex = (currentPage - 1) * pageSize;

    return {
      pageRows: rows.slice(startIndex, startIndex + pageSize),
      totalPages,
      currentPage,
      totalRecords,
    };
  },

  /**
   * @param {AdminContestantHistoryRow[]} rows
   * @param {AdminContestantListQuery} query
   * @returns {{ pageRows: AdminContestantHistoryRow[], totalPages: number, currentPage: number, totalRecords: number }}
   */
  applyListQuery(rows, query) {
    const filtered = AdminPredictionHistoryDomain.filterRows(rows, query.search);
    const sorted = AdminPredictionHistoryDomain.sortRows(
      filtered,
      query.sortField,
      query.sortDirection,
    );

    return AdminPredictionHistoryDomain.paginateRows(sorted, query.page, query.pageSize);
  },
};

/**
 * @param {number|null} left
 * @param {number|null} right
 * @returns {number}
 */
function compareNullableNumbers(left, right) {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  const diff = left - right;
  return diff;
}
