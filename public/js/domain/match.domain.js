/**
 * @fileoverview Match domain — pure business rules for match lifecycle and locks.
 * @module domain/match.domain
 */

const CUSTOM_SCORING_POINTS_MIN = 0;
const CUSTOM_SCORING_POINTS_MAX = 100;

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

/** @enum {string} */
export const MATCH_COUNTDOWN_PHASE = Object.freeze({
  PRE_OPEN: 'pre_open',
  OPEN: 'open',
  CLOSED: 'closed',
  HIDDEN: 'hidden',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_COUNTDOWN_LABELS = Object.freeze({
  PRE_OPEN: 'Time Remaining for Prediction Window Opens',
  OPEN: 'Time Remaining for Kickoff',
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
   * @param {unknown} value
   * @returns {boolean}
   */
  isValidCustomScoringPoints(value) {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isInteger(numeric)
      && numeric >= CUSTOM_SCORING_POINTS_MIN
      && numeric <= CUSTOM_SCORING_POINTS_MAX;
  },

  /**
   * @param {unknown} value
   * @returns {{ useCustomPoints: boolean, correctMatchScorePoints: number|null, correctPenaltyWinnerPoints: number|null }}
   */
  normalizeCustomScoringConfig(value) {
    if (!value || typeof value !== 'object') {
      return {
        useCustomPoints: false,
        correctMatchScorePoints: null,
        correctPenaltyWinnerPoints: null,
      };
    }

    const config = /** @type {Record<string, unknown>} */ (value);
    const useCustomPoints = Boolean(config.useCustomPoints);
    const matchScorePoints = this.isValidCustomScoringPoints(config.correctMatchScorePoints)
      ? Number(config.correctMatchScorePoints)
      : null;
    const penaltyWinnerPoints = this.isValidCustomScoringPoints(config.correctPenaltyWinnerPoints)
      ? Number(config.correctPenaltyWinnerPoints)
      : null;

    return {
      useCustomPoints,
      correctMatchScorePoints: matchScorePoints,
      correctPenaltyWinnerPoints: penaltyWinnerPoints,
    };
  },

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
   * Resolves the match countdown phase, target, and label for lifecycle-aware timers.
   * @param {{
   *   kickoffUtc: Date,
   *   openHours: number,
   *   lockMinutes: number,
   *   status?: string,
   *   predictionStatus?: string,
   *   result?: { published?: boolean },
   *   predictionOverride?: { isActive?: boolean, status?: string },
   *   now?: Date,
   * }} input
   * @returns {{
   *   phase: string,
   *   targetDate: Date|null,
   *   label: string|null,
   *   opensAt: Date,
   *   locksAt: Date,
   *   kickoffUtc: Date,
   * }}
   */
  resolveMatchCountdownPhase(input) {
    const {
      kickoffUtc,
      openHours,
      lockMinutes,
      status: rawStatus = '',
      predictionStatus = '',
      result,
      predictionOverride,
      now = new Date(),
    } = input;

    const { opensAt, locksAt } = this.calculatePredictionWindow(kickoffUtc, openHours, lockMinutes);
    const base = {
      opensAt,
      locksAt,
      kickoffUtc,
      targetDate: null,
      label: null,
    };

    if (result?.published) {
      return { ...base, phase: MATCH_COUNTDOWN_PHASE.HIDDEN };
    }

    const status = this.normalizeStatus(String(rawStatus));

    if (
      status === MATCH_STATUS.COMPLETED
      || status === MATCH_STATUS.RESULT_PUBLISHED
      || status === MATCH_STATUS.LIVE
      || status === MATCH_STATUS.ARCHIVED
    ) {
      return { ...base, phase: MATCH_COUNTDOWN_PHASE.HIDDEN };
    }

    if (now >= kickoffUtc) {
      return { ...base, phase: MATCH_COUNTDOWN_PHASE.HIDDEN };
    }

    const isManuallyLocked = predictionOverride?.isActive
      && predictionOverride?.status === MATCH_STATUS.PREDICTION_LOCKED;
    const isLockedStatus = status === MATCH_STATUS.PREDICTION_LOCKED
      || predictionStatus === 'Locked'
      || isManuallyLocked;

    if (isLockedStatus || now >= locksAt) {
      return { ...base, phase: MATCH_COUNTDOWN_PHASE.CLOSED };
    }

    const isManuallyOpen = predictionOverride?.isActive
      && predictionOverride?.status === MATCH_STATUS.PREDICTION_OPEN;
    const isOpenStatus = status === MATCH_STATUS.PREDICTION_OPEN
      || predictionStatus === 'Open'
      || isManuallyOpen;
    const isWithinOpenWindow = now >= opensAt && now < locksAt;

    if (isOpenStatus || isWithinOpenWindow) {
      return {
        ...base,
        phase: MATCH_COUNTDOWN_PHASE.OPEN,
        targetDate: kickoffUtc,
        label: MATCH_COUNTDOWN_LABELS.OPEN,
      };
    }

    if (now < opensAt) {
      return {
        ...base,
        phase: MATCH_COUNTDOWN_PHASE.PRE_OPEN,
        targetDate: opensAt,
        label: MATCH_COUNTDOWN_LABELS.PRE_OPEN,
      };
    }

    return { ...base, phase: MATCH_COUNTDOWN_PHASE.CLOSED };
  },

  /**
   * Whether a lifecycle countdown should appear on match cards.
   * @param {Record<string, unknown>} match
   * @param {Date|null} kickoffUtc
   * @param {number|Date} [openHoursOrNow=48]
   * @param {number} [lockMinutes=10]
   * @param {Date} [now]
   * @returns {boolean}
   */
  shouldShowKickoffCountdown(match, kickoffUtc, openHoursOrNow = 48, lockMinutes = 10, now) {
    if (!kickoffUtc) {
      return false;
    }

    const matchCountdown = /** @type {{ phase?: string }|undefined} */ (match.matchCountdown);
    if (matchCountdown?.phase) {
      return matchCountdown.phase === MATCH_COUNTDOWN_PHASE.PRE_OPEN
        || matchCountdown.phase === MATCH_COUNTDOWN_PHASE.OPEN;
    }

    let openHours = 48;
    let lockMins = 10;
    let currentNow = new Date();

    if (openHoursOrNow instanceof Date) {
      currentNow = openHoursOrNow;
    } else {
      openHours = Number(openHoursOrNow) || 48;
      lockMins = Number(lockMinutes) || 10;
      if (now instanceof Date) {
        currentNow = now;
      }
    }

    const phase = this.resolveMatchCountdownPhase({
      kickoffUtc,
      openHours,
      lockMinutes: lockMins,
      status: String(match.status ?? ''),
      predictionStatus: String(match.predictionStatus ?? ''),
      result: /** @type {{ published?: boolean }|undefined} */ (match.result),
      predictionOverride: /** @type {{ isActive?: boolean, status?: string }|undefined} */ (match.predictionOverride),
      now: currentNow,
    });

    return phase.phase === MATCH_COUNTDOWN_PHASE.PRE_OPEN
      || phase.phase === MATCH_COUNTDOWN_PHASE.OPEN;
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
