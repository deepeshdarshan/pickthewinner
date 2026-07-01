/**
 * @fileoverview Environment configuration — runtime environment flags.
 * @module config/environment
 */

/**
 * Application environment settings.
 * @type {Readonly<{
 *   isDevelopment: boolean,
 *   isProduction: boolean,
 *   logLevel: 'debug' | 'info' | 'warn' | 'error',
 *   enableDebugLogging: boolean
 * }>}
 */
export const environment = Object.freeze({
  isDevelopment: window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1',
  isProduction: !window.location.hostname.includes('localhost')
    && window.location.hostname !== '127.0.0.1',
  logLevel: window.location.hostname === 'localhost' ? 'debug' : 'warn',
  enableDebugLogging: window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1',
});
