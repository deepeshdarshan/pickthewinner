/**
 * @fileoverview Legacy archived matches route — redirects to tabbed list.
 * @module match/match-archived.page
 */

import { navigateTo } from '../services/router.service.js';
import { setAdminTabFlag } from '../components/admin-list-tabs.component.js';
import { MATCH_ROUTES } from './match.constants.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void outlet;

  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('id');
  const target = matchId
    ? `${MATCH_ROUTES.ADMIN_LIST}?id=${encodeURIComponent(matchId)}`
    : MATCH_ROUTES.ADMIN_LIST;

  if (!matchId) {
    setAdminTabFlag('matches-archived');
  }

  void navigateTo(target);
}
