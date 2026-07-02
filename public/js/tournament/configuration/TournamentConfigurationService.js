/**
 * @fileoverview Tournament configuration service — centralized tournament settings access.
 * @module tournament/configuration/TournamentConfigurationService
 */

import { appSettings } from '../../config/app.config.js';
import { ApplicationContext } from '../../app/application-context.js';
import { getTournamentById } from '../tournament.service.js';
import {
  SCORING_POINTS_MAX,
  SCORING_POINTS_MIN,
} from '../tournament.constants.js';
import { Logger } from '../../utils/logger.util.js';

/** @type {Record<string, unknown>|null} */
let cachedConfiguration = null;

/** @type {string|null} */
let cachedTournamentId = null;

const DEFAULT_TIE_BREAKER = Object.freeze({
  strategy: 'totalPoints',
  secondary: 'correctWinnerPredictions',
});

/**
 * @param {unknown} value
 * @returns {number}
 */
function resolveScoringPoints(value) {
  const numeric = typeof value === 'number' ? value : Number(value);

  if (!Number.isInteger(numeric) || numeric < SCORING_POINTS_MIN || numeric > SCORING_POINTS_MAX) {
    throw new Error('Scoring configuration is incomplete');
  }

  return numeric;
}

/**
 * Centralized tournament configuration access for all domain modules.
 * Scoring point values are configured per tournament and read via this service.
 */
export const TournamentConfigurationService = {
  /**
   * Loads and caches configuration for a tournament.
   * @param {string|null} [tournamentId]
   * @param {Record<string, unknown>} [configuration]
   * @returns {Promise<Record<string, unknown>>}
   */
  async load(tournamentId = null, configuration = null) {
    if (configuration) {
      cachedConfiguration = configuration;
      cachedTournamentId = tournamentId;
      return cachedConfiguration;
    }

    if (cachedConfiguration && cachedTournamentId === tournamentId && tournamentId) {
      return cachedConfiguration;
    }

    if (tournamentId) {
      try {
        const tournament = await getTournamentById(tournamentId);

        if (tournament?.configuration) {
          cachedConfiguration = /** @type {Record<string, unknown>} */ (tournament.configuration);
          cachedTournamentId = tournamentId;
          return cachedConfiguration;
        }
      } catch (error) {
        Logger.warn('[TournamentConfigurationService] Failed to load tournament configuration:', error);
      }
    }

    const tournament = ApplicationContext.getTournament();

    if (tournament && typeof tournament === 'object' && 'configuration' in tournament) {
      cachedConfiguration = /** @type {Record<string, unknown>} */ (tournament).configuration ?? {};
      cachedTournamentId = tournamentId ?? /** @type {{ id?: string }} */ (tournament).id ?? null;
      return cachedConfiguration;
    }

    cachedConfiguration = this.getDefaultConfiguration();
    cachedTournamentId = tournamentId;
    Logger.debug('[TournamentConfigurationService] Using default configuration');
    return cachedConfiguration;
  },

  /**
   * @returns {Record<string, unknown>}
   */
  getDefaultConfiguration() {
    return {
      timezone: appSettings.timezone,
      tieBreaker: { ...DEFAULT_TIE_BREAKER },
      requireWinnerSelectionForDrawPrediction: false,
      winnerResolution: 'regulation',
      leaderboardVisible: false,
      predictionLockMinutes: 10,
      predictionOpenHoursBeforeKickoff: 48,
      scoringConfiguration: {},
    };
  },

  /**
   * @returns {boolean}
   */
  isLeaderboardVisible() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return Boolean(config.leaderboardVisible);
  },

  /**
   * @param {unknown} value
   * @returns {void}
   */
  setLeaderboardVisibility(value) {
    const base = cachedConfiguration ?? this.getDefaultConfiguration();
    cachedConfiguration = { ...base, leaderboardVisible: Boolean(value) };
  },

  /**
   * @returns {string}
   */
  getTimezone() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return String(config.timezone ?? appSettings.timezone);
  },

  /**
   * Returns whether the tournament requires winner selection when a draw is predicted.
   *
   * When FALSE (default):
   * - Matches are treated as league-style
   * - Draws are valid predictions without additional winner selection
   *
   * When TRUE:
   * - Draws require selecting which team wins after normal+extra time
   * - Only the winner is stored, never penalty shootout scores
   *
   * @returns {boolean}
   */
  requireWinnerSelectionForDrawPrediction() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();

    // Check new field name first
    if (config.requireWinnerSelectionForDrawPrediction !== undefined) {
      return Boolean(config.requireWinnerSelectionForDrawPrediction);
    }

    // Handle legacy configurations for backward compatibility
    if (config.requireWinnerForDraw !== undefined) {
      return Boolean(config.requireWinnerForDraw);
    }

    // Legacy fallback: if canEndInDraw was true, winner not required (return false)
    // if requiresWinner was true and canEndInDraw was false, winner required (return true)
    if (config.canEndInDraw !== undefined) {
      return !Boolean(config.canEndInDraw);
    }

    if (config.requiresWinner !== undefined) {
      return Boolean(config.requiresWinner);
    }

    return false; // Default: league-style, draws allowed
  },

  /**
   * @deprecated Use requireWinnerSelectionForDrawPrediction() instead
   * @returns {boolean}
   */
  requireWinnerForDraw() {
    return this.requireWinnerSelectionForDrawPrediction();
  },

  /**
   * Returns whether match results require a winner (for knockout tournaments).
   * This is used for match result validation, not prediction validation.
   *
   * When TRUE: Matches must have a winner (knockout style)
   * When FALSE: Draws are valid results (league style)
   *
   * @returns {boolean}
   */
  requiresWinner() {
    // For match results, this aligns with whether predictions require winner selection
    // If predictions require winner selection for draws, the match type is knockout-style
    return this.requireWinnerSelectionForDrawPrediction();
  },

  /**
   * @returns {string}
   */
  getWinnerResolution() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return String(config.winnerResolution ?? 'regulation');
  },

  /**
   * @returns {typeof DEFAULT_TIE_BREAKER}
   */
  getTieBreakerConfiguration() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return {
      ...DEFAULT_TIE_BREAKER,
      ...(/** @type {typeof DEFAULT_TIE_BREAKER} */ (config.tieBreaker ?? {})),
    };
  },

  /**
   * @returns {Record<string, unknown>}
   */
  getScoringConfiguration() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return /** @type {Record<string, unknown>} */ (config.scoringConfiguration ?? {});
  },

  /**
   * @returns {number}
   */
  getCorrectMatchScorePoints() {
    const scoring = this.getScoringConfiguration();
    return resolveScoringPoints(scoring.correctMatchScorePoints);
  },

  /**
   * @returns {number}
   */
  getCorrectPenaltyWinnerPoints() {
    const scoring = this.getScoringConfiguration();
    return resolveScoringPoints(scoring.correctPenaltyWinnerPoints);
  },

  /**
   * @returns {number}
   */
  getPredictionLockMinutes() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    const value = Number(config.predictionLockMinutes ?? 10);

    if (!Number.isInteger(value) || value < 1 || value > 60) {
      throw new Error('Prediction lock configuration is incomplete');
    }

    return value;
  },

  /**
   * @returns {number}
   */
  getPredictionOpenHoursBeforeKickoff() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    const value = Number(config.predictionOpenHoursBeforeKickoff ?? 48);

    if (!Number.isInteger(value) || value < 1 || value > 168) {
      throw new Error('Prediction open hours configuration is incomplete');
    }

    return value;
  },

  /**
   * @returns {void}
   */
  clearCache() {
    cachedConfiguration = null;
    cachedTournamentId = null;
  },
};
