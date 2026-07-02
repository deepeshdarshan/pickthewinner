/**
 * @fileoverview Match list delete handler for admin pages.
 * @module match/match-list.controller
 */

import { showConfirmationModal } from '../components/confirmation-modal.component.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { MATCH_MESSAGES } from './match.constants.js';
import { deleteMatch, getMatchErrorMessage } from './match.service.js';
import { Logger } from '../utils/logger.util.js';

export {
  sortMatchesByKickoff,
  filterMatches,
  paginateMatches,
} from './match-list.util.js';

/**
 * @param {HTMLElement} outlet
 * @param {string} matchId
 * @param {() => Promise<void>} onSuccess
 * @returns {Promise<void>}
 */
export async function handleDeleteMatch(outlet, matchId, onSuccess) {
  const confirmed = await showConfirmationModal({
    title: 'Delete Match',
    message: MATCH_MESSAGES.CONFIRM_DELETE,
    confirmLabel: 'Delete Permanently',
    confirmClass: 'btn-danger',
  });

  if (!confirmed) {
    return;
  }

  showLoadingOverlay(MATCH_MESSAGES.DELETING);

  try {
    await deleteMatch(matchId);
    showSuccessToast(MATCH_MESSAGES.DELETED);
    await onSuccess();
  } catch (error) {
    Logger.error('[MatchList] Delete failed:', error);
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }

  void outlet;
}
