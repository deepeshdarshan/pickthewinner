/**
 * @fileoverview Placeholder service — base pattern for Firestore-backed services.
 * @module services/base.service
 */

/**
 * Base service placeholder. Future services extend this pattern.
 * Services must not manipulate the DOM.
 */
export class BaseService {
  /**
   * @param {string} name
   */
  constructor(name) {
    this.name = name;
  }
}
