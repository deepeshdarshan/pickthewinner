/**
 * @fileoverview Legacy archived tournaments route — redirects to tabbed list.
 * @module tournament/tournament-archived.page
 */

import { navigateTo } from '../services/router.service.js';
import { setAdminTabFlag } from '../components/admin-list-tabs.component.js';
import { TOURNAMENT_ROUTES } from './tournament.constants.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void outlet;
  setAdminTabFlag('tournaments-archived');
  void navigateTo(TOURNAMENT_ROUTES.ADMIN_LIST);
}
