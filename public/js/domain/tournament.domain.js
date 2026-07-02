/**
 * @fileoverview Tournament domain — pure business rules for tournament lifecycle.
 * @module domain/tournament.domain
 */

/** @enum {string} */
export const TOURNAMENT_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  LIVE: 'live',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
});

/** @enum {string} */
export const TOURNAMENT_VISIBILITY = Object.freeze({
  VISIBLE: 'visible',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
});

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const ALLOWED_TRANSITIONS = Object.freeze({
  [TOURNAMENT_STATUS.DRAFT]: new Set([
    TOURNAMENT_STATUS.PUBLISHED,
    TOURNAMENT_STATUS.ARCHIVED,
  ]),
  [TOURNAMENT_STATUS.PUBLISHED]: new Set([
    TOURNAMENT_STATUS.LIVE,
    TOURNAMENT_STATUS.ARCHIVED,
    TOURNAMENT_STATUS.COMPLETED,
  ]),
  [TOURNAMENT_STATUS.LIVE]: new Set([
    TOURNAMENT_STATUS.COMPLETED,
    TOURNAMENT_STATUS.ARCHIVED,
  ]),
  [TOURNAMENT_STATUS.COMPLETED]: new Set([
    TOURNAMENT_STATUS.ARCHIVED,
  ]),
  [TOURNAMENT_STATUS.ARCHIVED]: new Set([
    TOURNAMENT_STATUS.COMPLETED,
  ]),
});

export const TournamentDomain = {
  /**
   * @param {string} fromStatus
   * @param {string} toStatus
   * @returns {boolean}
   */
  canTransitionTo(fromStatus, toStatus) {
    if (fromStatus === toStatus) {
      return true;
    }

    const allowed = ALLOWED_TRANSITIONS[fromStatus];
    return Boolean(allowed?.has(toStatus));
  },

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
  canGoLive(status) {
    return status === TOURNAMENT_STATUS.PUBLISHED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canCompleteTournament(status) {
    return status === TOURNAMENT_STATUS.LIVE || status === TOURNAMENT_STATUS.PUBLISHED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canArchiveTournament(status) {
    return status !== TOURNAMENT_STATUS.ARCHIVED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canRestoreTournament(status) {
    return status === TOURNAMENT_STATUS.ARCHIVED;
  },

  /**
   * @param {string} status
   * @param {boolean} [archived]
   * @returns {boolean}
   */
  canEditTournament(status, archived = false) {
    if (archived || status === TOURNAMENT_STATUS.ARCHIVED) {
      return false;
    }

    return status === TOURNAMENT_STATUS.DRAFT;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  isTournamentReadOnly(status) {
    return status === TOURNAMENT_STATUS.COMPLETED
      || status === TOURNAMENT_STATUS.ARCHIVED;
  },

  /**
   * @param {string} status
   * @param {string} [visibility]
   * @returns {boolean}
   */
  isTournamentVisibleToContestants(status, visibility = TOURNAMENT_VISIBILITY.VISIBLE) {
    if (visibility !== TOURNAMENT_VISIBILITY.VISIBLE) {
      return false;
    }

    return status === TOURNAMENT_STATUS.PUBLISHED
      || status === TOURNAMENT_STATUS.LIVE
      || status === TOURNAMENT_STATUS.COMPLETED;
  },

  /**
   * @param {Date|import('firebase/firestore').Timestamp|null|undefined} registrationStart
   * @param {Date|import('firebase/firestore').Timestamp|null|undefined} registrationEnd
   * @param {Date} [now]
   * @returns {boolean}
   */
  isRegistrationOpen(registrationStart, registrationEnd, now = new Date()) {
    const start = toDate(registrationStart);
    const end = toDate(registrationEnd);

    if (!start || !end) {
      return false;
    }

    const current = now.getTime();
    return current >= start.getTime() && current <= end.getTime();
  },

  /**
   * @param {Date|import('firebase/firestore').Timestamp|null|undefined} registrationStart
   * @param {Date|import('firebase/firestore').Timestamp|null|undefined} registrationEnd
   * @param {Date} [now]
   * @returns {'open'|'closed'|'scheduled'|'not_configured'}
   */
  resolveRegistrationStatus(registrationStart, registrationEnd, now = new Date()) {
    const start = toDate(registrationStart);
    const end = toDate(registrationEnd);

    if (!start || !end) {
      return 'not_configured';
    }

    const current = now.getTime();

    if (current < start.getTime()) {
      return 'scheduled';
    }

    if (current > end.getTime()) {
      return 'closed';
    }

    return 'open';
  },
};

/**
 * @param {Date|import('firebase/firestore').Timestamp|null|undefined} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return /** @type {import('firebase/firestore').Timestamp} */ (value).toDate();
  }

  return null;
}
