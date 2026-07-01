/**
 * @fileoverview Tournament configuration service — centralized tournament settings access.
 * @module tournament/configuration/TournamentConfigurationService
 */

import { appSettings } from '../../config/app.config.js';
import { ApplicationContext } from '../../app/application-context.js';
import { Logger } from '../../utils/logger.util.js';

/** @type {Record<string, unknown>|null} */
let cachedConfiguration = null;

/** @type {string|null} */
let cachedTournamentId = null;

const DEFAULT_SCORING = Object.freeze({
  exactScorePoints: 3,
  correctWinnerPoints: 1,
  penaltyWinnerBonus: 0,
});

const DEFAULT_TIE_BREAKER = Object.freeze({
  strategy: 'totalPoints',
  secondary: 'correctWinnerPredictions',
});

/**
 * Centralized tournament configuration access for all domain modules.
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

    if (cachedConfiguration && cachedTournamentId === tournamentId) {
      return cachedConfiguration;
    }

    const tournament = ApplicationContext.getTournament();

    if (tournament && typeof tournament === 'object' && 'configuration' in tournament) {
      cachedConfiguration = /** @type {Record<string, unknown>} */ (tournament).configuration ?? {};
      cachedTournamentId = tournamentId;
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
      predictionLockMinutes: appSettings.defaultPredictionLockMinutes,
      timezone: appSettings.timezone,
      scoring: { ...DEFAULT_SCORING },
      tieBreaker: { ...DEFAULT_TIE_BREAKER },
      requiresWinner: true,
      canEndInDraw: false,
      winnerResolution: 'regulation',
    };
  },

  /**
   * @returns {number}
   */
  getPredictionLockMinutes() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return Number(config.predictionLockMinutes ?? appSettings.defaultPredictionLockMinutes);
  },

  /**
   * @returns {typeof DEFAULT_SCORING}
   */
  getScoringConfiguration() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return {
      ...DEFAULT_SCORING,
      ...(/** @type {typeof DEFAULT_SCORING} */ (config.scoring ?? {})),
    };
  },

  /**
   * @returns {string}
   */
  getTimezone() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return String(config.timezone ?? appSettings.timezone);
  },

  /**
   * @returns {boolean}
   */
  requiresWinner() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return Boolean(config.requiresWinner ?? true);
  },

  /**
   * @returns {boolean}
   */
  canEndInDraw() {
    const config = cachedConfiguration ?? this.getDefaultConfiguration();
    return Boolean(config.canEndInDraw ?? false);
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
   * @returns {void}
   */
  clearCache() {
    cachedConfiguration = null;
    cachedTournamentId = null;
  },
};
