/**
 * @fileoverview Match domain — pure business rules for match lifecycle and locks.
 * @module domain/match.domain
 */

/** @enum {string} */
export const MATCH_STATUS = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  PREDICTION_OPEN: 'prediction_open',
  PREDICTION_LOCKED: 'prediction_locked',
  LIVE: 'live',
  COMPLETED: 'completed',
  RESULT_PUBLISHED: 'result_published',
  ARCHIVED: 'archived',
});

/** @enum {string} */
export const WINNER_RESOLUTION = Object.freeze({
  NORMAL_TIME_EXTRA_TIME: 'normal_time_extra_time',
  PENALTIES: 'penalties',
});

/** @type {Readonly<Record<string, ReadonlySet<string>>>} */
const ALLOWED_TRANSITIONS = Object.freeze({
  [MATCH_STATUS.DRAFT]: new Set([MATCH_STATUS.PUBLISHED, MATCH_STATUS.ARCHIVED]),
  [MATCH_STATUS.PUBLISHED]: new Set([
    MATCH_STATUS.PREDICTION_OPEN,
    MATCH_STATUS.ARCHIVED,
  ]),
  [MATCH_STATUS.PREDICTION_OPEN]: new Set([
    MATCH_STATUS.PREDICTION_LOCKED,
    MATCH_STATUS.PUBLISHED,
    MATCH_STATUS.LIVE,
    MATCH_STATUS.ARCHIVED,
  ]),
  [MATCH_STATUS.PREDICTION_LOCKED]: new Set([
    MATCH_STATUS.PREDICTION_OPEN,
    MATCH_STATUS.LIVE,
    MATCH_STATUS.ARCHIVED,
  ]),
  [MATCH_STATUS.LIVE]: new Set([MATCH_STATUS.COMPLETED, MATCH_STATUS.ARCHIVED]),
  [MATCH_STATUS.COMPLETED]: new Set([MATCH_STATUS.RESULT_PUBLISHED, MATCH_STATUS.LIVE]),
  [MATCH_STATUS.RESULT_PUBLISHED]: new Set([MATCH_STATUS.ARCHIVED]),
  [MATCH_STATUS.ARCHIVED]: new Set(),
});

/** @type {ReadonlySet<string>} */
const CONTESTANT_VISIBLE_STATUSES = new Set([
  MATCH_STATUS.PUBLISHED,
  MATCH_STATUS.PREDICTION_OPEN,
  MATCH_STATUS.PREDICTION_LOCKED,
  MATCH_STATUS.LIVE,
  MATCH_STATUS.COMPLETED,
  MATCH_STATUS.RESULT_PUBLISHED,
]);

export const MatchDomain = {
  /**
   * Normalizes legacy stored statuses for backward compatibility.
   * @param {string} status
   * @returns {string}
   */
  normalizeStatus(status) {
    return status === 'scheduled' ? MATCH_STATUS.DRAFT : status;
  },

  /**
   * @param {string} from
   * @param {string} to
   * @returns {boolean}
   */
  canTransitionTo(from, to) {
    return ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
  },

  /**
   * @param {string} status
   * @param {boolean} visible
   * @returns {boolean}
   */
  isVisibleToContestants(status, visible) {
    return Boolean(visible) && CONTESTANT_VISIBLE_STATUSES.has(status);
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canEditMatch(status) {
    return status !== MATCH_STATUS.RESULT_PUBLISHED && status !== MATCH_STATUS.ARCHIVED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canEnterResult(status) {
    return status === MATCH_STATUS.COMPLETED;
  },

  /**
   * @param {string} status
   * @returns {boolean}
   */
  canPublishResult(status) {
    return status === MATCH_STATUS.COMPLETED;
  },

  /**
   * Whether a kickoff countdown should appear on contestant match cards.
   * @param {Record<string, unknown>} match
   * @param {Date|null} kickoffUtc
   * @param {Date} [now]
   * @returns {boolean}
   */
  shouldShowKickoffCountdown(match, kickoffUtc, now = new Date()) {
    if (!kickoffUtc) {
      return false;
    }

    if (match.result?.published) {
      return false;
    }

    const status = this.normalizeStatus(String(match.status ?? ''));
    if (
      status === MATCH_STATUS.COMPLETED
      || status === MATCH_STATUS.RESULT_PUBLISHED
      || status === MATCH_STATUS.LIVE
      || status === MATCH_STATUS.ARCHIVED
    ) {
      return false;
    }

    if (match.predictionStatus === 'Locked') {
      return false;
    }

    if (now >= kickoffUtc) {
      return false;
    }

    return true;
  },

  /**
   * @param {Date} kickoffUtc
   * @param {number} openHours
   * @param {number} lockMinutes
   * @returns {{ opensAt: Date, locksAt: Date }}
   */
  calculatePredictionWindow(kickoffUtc, openHours, lockMinutes) {
    const opensAt = new Date(kickoffUtc.getTime() - openHours * 60 * 60 * 1000);
    const locksAt = new Date(kickoffUtc.getTime() - lockMinutes * 60 * 1000);
    return { opensAt, locksAt };
  },

  /**
   * @param {string} status
   * @param {Date} kickoffUtc
   * @param {number} openHours
   * @param {number} lockMinutes
   * @param {Date} [now]
   * @param {{ predictionOverride?: { isActive?: boolean, status?: string } }} [match]
   * @returns {string}
   */
  resolveEffectiveStatus(status, kickoffUtc, openHours, lockMinutes, now = new Date(), match = {}) {
    // Priority 1: Check for manual override
    if (match.predictionOverride?.isActive && match.predictionOverride?.status) {
      // Return override status if it's a valid prediction-related status
      const overrideStatus = match.predictionOverride.status;
      if (overrideStatus === MATCH_STATUS.PREDICTION_OPEN || overrideStatus === MATCH_STATUS.PREDICTION_LOCKED) {
        return overrideStatus;
      }
    }

    // Priority 2: Automatic scheduling based on timestamps
    if (!CONTESTANT_VISIBLE_STATUSES.has(status) || status === MATCH_STATUS.COMPLETED || status === MATCH_STATUS.RESULT_PUBLISHED) {
      return status;
    }

    if (status === MATCH_STATUS.LIVE || now >= kickoffUtc) {
      return MATCH_STATUS.LIVE;
    }

    const { opensAt, locksAt } = this.calculatePredictionWindow(kickoffUtc, openHours, lockMinutes);

    if (now < opensAt) {
      return status === MATCH_STATUS.PREDICTION_OPEN || status === MATCH_STATUS.PREDICTION_LOCKED
        ? MATCH_STATUS.PUBLISHED
        : status;
    }

    if (now >= locksAt) {
      return MATCH_STATUS.PREDICTION_LOCKED;
    }

    return MATCH_STATUS.PREDICTION_OPEN;
  },

  /**
   * @param {string} status
   * @param {Date} kickoffUtc
   * @param {number} lockMinutes
   * @param {Date} [now]
   * @returns {boolean}
   */
  isPredictionOpen(status, kickoffUtc, lockMinutes = 10, now = new Date()) {
    if (status !== MATCH_STATUS.PREDICTION_OPEN) {
      return false;
    }

    const locksAt = this.calculatePredictionLock(kickoffUtc, lockMinutes);
    return now < locksAt;
  },

  /**
   * @param {Date} kickoffUtc
   * @param {number} lockMinutes
   * @returns {Date}
   */
  calculatePredictionLock(kickoffUtc, lockMinutes) {
    return new Date(kickoffUtc.getTime() - lockMinutes * 60 * 1000);
  },

  /**
   * @param {{ tournamentId?: string, homeTeamId?: string, awayTeamId?: string, kickoffUtc?: Date|string|null }} existing
   * @param {{ tournamentId: string, homeTeamId: string, awayTeamId: string, kickoffUtc: Date }} candidate
   * @returns {boolean}
   */
  isDuplicateMatch(existing, candidate) {
    if (!existing.tournamentId || !existing.homeTeamId || !existing.awayTeamId || !existing.kickoffUtc) {
      return false;
    }

    if (existing.tournamentId !== candidate.tournamentId) {
      return false;
    }

    const existingDate = toDateKey(existing.kickoffUtc);
    const candidateDate = toDateKey(candidate.kickoffUtc);

    if (existingDate !== candidateDate) {
      return false;
    }

    const teamsA = [existing.homeTeamId, existing.awayTeamId].sort().join(':');
    const teamsB = [candidate.homeTeamId, candidate.awayTeamId].sort().join(':');
    return teamsA === teamsB;
  },

  /**
   * @param {Record<string, unknown>} result
   * @param {{ requiresWinner?: boolean }} tournamentConfig
   * @param {string} homeTeamId
   * @param {string} awayTeamId
   * @returns {{ valid: boolean, errors: Record<string, string> }}
   */
  validateResult(result, tournamentConfig, homeTeamId, awayTeamId) {
    const errors = {};
    const homeScore = Number(result.homeScore);
    const awayScore = Number(result.awayScore);

    if (!Number.isInteger(homeScore) || homeScore < 0) {
      errors.homeScore = 'Enter a valid home score.';
    }

    if (!Number.isInteger(awayScore) || awayScore < 0) {
      errors.awayScore = 'Enter a valid away score.';
    }

    const resolution = String(result.winnerResolution ?? '');

    if (!Object.values(WINNER_RESOLUTION).includes(resolution)) {
      errors.winnerResolution = 'Select a valid winner resolution.';
    }

    if (resolution === WINNER_RESOLUTION.PENALTIES) {
      const winningTeamId = String(result.winningTeamId ?? '');

      if (!winningTeamId) {
        errors.winningTeamId = 'Select the winning team.';
      } else if (winningTeamId !== homeTeamId && winningTeamId !== awayTeamId) {
        errors.winningTeamId = 'Winning team must be home or away team.';
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  },
};

/**
 * @param {Date|string|import('firebase/firestore').Timestamp|null|undefined} value
 * @returns {string}
 */
function toDateKey(value) {
  const date = toDate(value);
  if (!date) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

/**
 * @param {Date|string|{ toDate?: () => Date }|null|undefined} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
