/**
 * @fileoverview Legacy contestant match tab routes — redirect to tabbed list.
 * @module match/match-contestant-tab-redirect.page
 */

import { navigateTo } from '../services/router.service.js';
import { setAdminTabFlag } from '../components/admin-list-tabs.component.js';
import { MATCH_ROUTES } from './match.constants.js';

/** @type {Readonly<Record<string, string>>} */
const TAB_FLAGS = Object.freeze({
  upcoming: 'contestant-matches-upcoming',
  completed: 'contestant-matches-completed',
  archived: 'contestant-matches-archived',
});

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void outlet;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const tab = segments[segments.length - 1] ?? '';
  const flag = TAB_FLAGS[tab];

  if (flag) {
    setAdminTabFlag(flag);
  }

  void navigateTo(MATCH_ROUTES.CONTESTANT_LIST);
}
