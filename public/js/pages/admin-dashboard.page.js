/**
 * @fileoverview Admin dashboard page.
 * @module pages/admin-dashboard.page
 */

import { AdminDashboardService } from '../dashboard/AdminDashboardService.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import {
  renderAdminDashboard,
  renderAdminDashboardLoading,
} from '../dashboard/renderers/admin-dashboard.renderer.js';

/**
 * Renders the admin dashboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminDashboard(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminDashboard(outlet) {
  outlet.innerHTML = renderAdminDashboardLoading();

  const data = await AdminDashboardService.getDashboardData();
  outlet.innerHTML = renderAdminDashboard(data);
  initializeCountdowns(outlet);
}
