/**
 * @fileoverview Match details page — contestant view for a single match.
 * @module pages/match-details.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import { initMatchDetailsPage } from '../match/match-details.controller.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const user = getCurrentUser();
  void initMatchDetailsPage(outlet, user?.uid ?? '');
}
