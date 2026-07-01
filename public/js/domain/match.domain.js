/**
 * @fileoverview Match domain — pure business rules for match lifecycle and locks.
 * @module domain/match.domain
 */

/** @enum {string} */
export const MATCH_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  LOCKED: 'locked',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const MatchDomain = {
  /**
   * @param {string} status
   * @param {Date} [kickoffAt]
   * @param {number} [lockMinutes]
   * @param {Date} [now]
   * @returns {boolean}
   */
  isPredictionOpen(status, kickoffAt, lockMinutes = 15, now = new Date()) {
    if (status !== MATCH_STATUS.PUBLISHED && status !== MATCH_STATUS.SCHEDULED) {
      return false;
    }

    if (!kickoffAt) {
      return true;
    }

    const lockAt = new Date(kickoffAt.getTime() - lockMinutes * 60 * 1000);
    return now < lockAt;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canPublishResult(status) {
    return status === MATCH_STATUS.IN_PROGRESS || status === MATCH_STATUS.LOCKED;
  },

  /**
   * @param {Date} kickoffAt
   * @param {number} lockMinutes
   * @returns {Date}
   */
  calculatePredictionLock(kickoffAt, lockMinutes) {
    return new Date(kickoffAt.getTime() - lockMinutes * 60 * 1000);
  },
};
