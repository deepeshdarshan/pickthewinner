/**
 * @fileoverview Shared logout action — single sign-out workflow for the application.
 * @module auth/actions/logout.action
 */

import { signOut } from '../auth.service.js';
import { clearProfileCache } from '../../users/user.service.js';
import { AuthorizationService } from '../../authorization/authorization.service.js';
import { ApplicationContext } from '../../app/application-context.js';
import { AppContext } from '../../app/app.context.js';
import { AUTH_MESSAGES, AUTH_ROUTES } from '../authentication.constants.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../../components/loading-overlay.component.js';
import { showSuccessToast, showErrorToast } from '../../utils/toast.util.js';
import { getAuthErrorMessage } from '../auth.service.js';
import { navigateTo } from '../../services/router.service.js';
import { updateAppShell } from '../../services/layout.service.js';
import { Logger } from '../../utils/logger.util.js';
import { TournamentConfigurationService } from '../../tournament/configuration/TournamentConfigurationService.js';

/**
 * Signs out the current user, clears caches, and navigates to login.
 * @returns {Promise<void>}
 */
export async function performLogout() {
  showLoadingOverlay(AUTH_MESSAGES.SIGNING_OUT);

  try {
    await signOut();
    clearProfileCache();
    AuthorizationService.clearCache();
    TournamentConfigurationService.clearCache();
    ApplicationContext.clear();
    AppContext.reset();
    showSuccessToast(AUTH_MESSAGES.LOGOUT_SUCCESS);
    await navigateTo(AUTH_ROUTES.LOGIN, true);
    updateAppShell(AUTH_ROUTES.LOGIN);
  } catch (error) {
    Logger.error('[LogoutAction] Logout failed:', error);
    showErrorToast(getAuthErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
