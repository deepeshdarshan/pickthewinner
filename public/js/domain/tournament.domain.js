/**
 * @fileoverview Tournament domain — pure business rules for tournament lifecycle.
 * @module domain/tournament.domain
 */

/** @enum {string} */
export const TOURNAMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

export const TournamentDomain = {
  /**
   * @param {string} status
   * @returns {boolean}
   */
  canPublishTournament(status) {
    return status === TOURNAMENT_STATUS.DRAFT;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canArchiveTournament(status) {
    return status === TOURNAMENT_STATUS.COMPLETED || status === TOURNAMENT_STATUS.PUBLISHED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  isTournamentEditable(status) {
    return status === TOURNAMENT_STATUS.DRAFT;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  isTournamentVisibleToContestants(status) {
    return status === TOURNAMENT_STATUS.PUBLISHED
      || status === TOURNAMENT_STATUS.ACTIVE
      || status === TOURNAMENT_STATUS.COMPLETED;
  },
};
