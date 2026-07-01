/**
 * @fileoverview Centralized logging utility — no console.log outside this module.
 * @module utils/logger.util
 */

import { environment } from '../config/environment.js';

/** @enum {number} */
const LOG_LEVELS = Object.freeze({
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
});

/** @type {number} */
const currentLevel = LOG_LEVELS[environment.logLevel] ?? LOG_LEVELS.warn;

/**
 * @param {'debug'|'info'|'warn'|'error'} level
 * @param {unknown[]} args
 * @returns {void}
 */
function log(level, args) {
  if (LOG_LEVELS[level] < currentLevel) {
    return;
  }

  const prefix = `[PickTheWinner:${level.toUpperCase()}]`;
  const method = level === 'debug' ? 'log' : level;
  console[method](prefix, ...args);
}

/**
 * Logs debug-level messages (development only by default).
 * @param {...unknown} args
 * @returns {void}
 */
export function debug(...args) {
  if (environment.enableDebugLogging) {
    log('debug', args);
  }
}

/**
 * Logs informational messages.
 * @param {...unknown} args
 * @returns {void}
 */
export function info(...args) {
  log('info', args);
}

/**
 * Logs warning messages.
 * @param {...unknown} args
 * @returns {void}
 */
export function warn(...args) {
  log('warn', args);
}

/**
 * Logs error messages.
 * @param {...unknown} args
 * @returns {void}
 */
export function error(...args) {
  log('error', args);
}

/** @type {typeof debug} */
export const Logger = Object.freeze({
  debug,
  info,
  warn,
  error,
});
