/**
 * @fileoverview Generic namespace-scoped event bus factory.
 * @module shared/events/event-bus
 */

import { Logger } from '../../utils/logger.util.js';

/**
 * @typedef {Object} EventBus
 * @property {(event: string, handler: (detail?: unknown) => void) => () => void} subscribe
 * @property {(event: string, handler: (detail?: unknown) => void) => () => void} unsubscribe
 * @property {(event: string, detail?: unknown) => void} publish
 * @property {(event: string, handler: (detail?: unknown) => void) => () => void} once
 * @property {() => void} clear
 */

/**
 * Creates an isolated event bus for a module namespace.
 * @param {string} namespace
 * @returns {EventBus}
 */
export function createEventBus(namespace) {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  /**
   * @param {string} event
   * @param {(detail?: unknown) => void} handler
   * @returns {() => void}
   */
  function subscribe(event, handler) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }

    listeners.get(event).add(handler);

    return () => {
      listeners.get(event)?.delete(handler);
    };
  }

  /**
   * @param {string} event
   * @param {(detail?: unknown) => void} handler
   * @returns {() => void}
   */
  function unsubscribe(event, handler) {
    listeners.get(event)?.delete(handler);
    return () => {};
  }

  /**
   * @param {string} event
   * @param {unknown} [detail]
   * @returns {void}
   */
  function publish(event, detail) {
    const handlers = listeners.get(event);

    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(detail);
      } catch (error) {
        Logger.error(`[${namespace}] Handler error for`, event, error);
      }
    });
  }

  /**
   * @param {string} event
   * @param {(detail?: unknown) => void} handler
   * @returns {() => void}
   */
  function once(event, handler) {
    const unsubscribeOnce = subscribe(event, (detail) => {
      unsubscribeOnce();
      handler(detail);
    });

    return unsubscribeOnce;
  }

  /**
   * @returns {void}
   */
  function clear() {
    listeners.clear();
  }

  return Object.freeze({
    subscribe,
    unsubscribe,
    publish,
    once,
    clear,
  });
}
