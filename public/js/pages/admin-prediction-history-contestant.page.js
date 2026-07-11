/**
 * @fileoverview Admin view of a contestant's prediction history.
 * @module pages/admin-prediction-history-contestant.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Permissions } from '../authorization/permission.constants.js';
import { UserAdminService } from '../users/user-admin.service.js';
import { resolveContestantDisplayName } from '../prediction/admin/renderers/prediction-display.renderer.js';
import { initPredictionHistoryPage } from '../prediction/history/prediction-history.controller.js';
import {
  PREDICTION_HISTORY_ROUTES,
  adminPredictionHistoryContestantRoute,
} from '../prediction/history/prediction-history.constants.js';
import {
  ADMIN_PREDICTION_HISTORY_MESSAGES,
} from '../prediction/admin/admin-prediction-history.constants.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const uid = segments[segments.length - 1];

  if (!uid || uid === 'prediction-history') {
    showErrorToast(ADMIN_PREDICTION_HISTORY_MESSAGES.CONTESTANT_NOT_FOUND);
    window.location.href = PREDICTION_HISTORY_ROUTES.ADMIN_LIST;
    return;
  }

  void initAdminPredictionHistoryContestantPage(outlet, uid);
}

/**
 * @param {HTMLElement} outlet
 * @param {string} targetUserId
 * @returns {Promise<void>}
 */
async function initAdminPredictionHistoryContestantPage(outlet, targetUserId) {
  showLoadingOverlay(ADMIN_PREDICTION_HISTORY_MESSAGES.LOADING);

  await AuthorizationService.resolve();

  if (!AuthorizationService.hasPermission(Permissions.VIEW_ALL_PREDICTIONS)) {
    outlet.innerHTML = renderPermissionDeniedState();
    hideLoadingOverlay();
    return;
  }

  try {
    const profile = await UserAdminService.getUserProfile(targetUserId);

    if (!profile) {
      outlet.innerHTML = renderNotFoundState();
      hideLoadingOverlay();
      return;
    }

    const authUser = getCurrentUser();
    const contestantName = resolveContestantDisplayName(profile);
    const baseRoute = adminPredictionHistoryContestantRoute(targetUserId);

    outlet.innerHTML = `
      <div class="${ADMIN_PAGE_SHELL_CLASSES}">
        ${renderPageHeader({
          title: `${contestantName}'s Prediction History`,
          subtitle: 'Read-only view of contestant predictions, statistics, and performance',
          actionsHtml: `
            <a href="${PREDICTION_HISTORY_ROUTES.ADMIN_LIST}" class="btn btn-sm btn-outline-secondary" data-route>
              <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Contestants
            </a>
          `,
        })}
        <div id="aph-history-root"></div>
      </div>
    `;

    const historyRoot = outlet.querySelector('#aph-history-root');
    if (!(historyRoot instanceof HTMLElement)) {
      throw new Error('History root element not found.');
    }

    hideLoadingOverlay();

    await initPredictionHistoryPage(historyRoot, {
      targetUserId,
      authUserId: authUser?.uid ?? '',
      baseRoute,
      isAdmin: true,
      pageContext: {
        shellClasses: '',
        listTitle: 'Prediction History',
        listSubtitle: `Viewing ${contestantName}'s predictions and performance`,
        detailTitle: 'Prediction Details',
        detailSubtitle: `Read-only view of ${contestantName}'s prediction and scoring breakdown`,
        backHref: baseRoute,
        backLabel: 'Back to History',
      },
    });
  } catch (error) {
    Logger.error('[admin-prediction-history-contestant.page] init failed:', error);
    outlet.innerHTML = renderNotFoundState();
    showErrorToast(ADMIN_PREDICTION_HISTORY_MESSAGES.LOAD_FAILED);
    hideLoadingOverlay();
  }
}

/**
 * @returns {string}
 */
function renderPermissionDeniedState() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Prediction History',
        subtitle: 'Read-only contestant prediction history',
        actionsHtml: '',
      })}
      ${renderEmptyState({
        title: 'Access Denied',
        message: ADMIN_PREDICTION_HISTORY_MESSAGES.PERMISSION_DENIED,
        icon: 'bi-shield-lock',
      })}
    </div>
  `;
}

/**
 * @returns {string}
 */
function renderNotFoundState() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Prediction History',
        subtitle: 'Read-only contestant prediction history',
        actionsHtml: `
          <a href="${PREDICTION_HISTORY_ROUTES.ADMIN_LIST}" class="btn btn-sm btn-outline-secondary" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Contestants
          </a>
        `,
      })}
      ${renderEmptyState({
        title: 'Contestant Not Found',
        message: ADMIN_PREDICTION_HISTORY_MESSAGES.CONTESTANT_NOT_FOUND,
        icon: 'bi-person-x',
      })}
    </div>
  `;
}
