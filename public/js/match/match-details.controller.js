/**
 * @fileoverview Controller for the contestant match details page.
 * @module match/match-details.controller
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { renderPredictionStatusBadge } from '../prediction/admin/renderers/prediction-status-badge.renderer.js';
import { predictionHistoryService } from '../prediction/history/PredictionHistoryService.js';
import { renderPredictionDetail } from '../prediction/history/renderers/prediction-history-detail.renderer.js';
import { navigateTo } from '../services/router.service.js';
import { MATCH_MESSAGES, MATCH_ROUTES } from './match.constants.js';
import { Logger } from '../utils/logger.util.js';

/** @type {Readonly<string>} */
const MATCH_DETAILS_BACK_HREF = `${MATCH_ROUTES.CONTESTANT_LIST}?tab=completed`;

/**
 * @param {HTMLElement} outlet
 * @param {string} authUserId
 * @returns {Promise<void>}
 */
export async function initMatchDetailsPage(outlet, authUserId) {
  const matchId = new URLSearchParams(window.location.search).get('id') ?? '';

  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(MATCH_MESSAGES.LOADING_MATCH);

  try {
    if (!authUserId) {
      outlet.innerHTML = renderAuthRequiredState();
      return;
    }

    if (!matchId) {
      outlet.innerHTML = renderErrorState(MATCH_MESSAGES.NOT_FOUND);
      return;
    }

    const detail = await predictionHistoryService.getMatchDetailForContestant(
      authUserId,
      authUserId,
      matchId,
    );

    const hasPrediction = Boolean(detail.item.id);
    const headerHtml = renderContestantPageHeader({
      title: 'Match Details',
      subtitle: 'Review match results and your prediction',
      actionsHtml: hasPrediction
        ? renderPredictionStatusBadge(detail.item.displayStatus ?? detail.item.status)
        : '',
    });

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        ${renderPredictionDetail(detail.item, detail.lifecycle, {
          backHref: MATCH_DETAILS_BACK_HREF,
          backLabel: 'Back to Matches',
          headerHtml,
        })}
      </div>
    `;

    attachDetailHandlers(outlet);
  } catch (error) {
    Logger.error('[match-details.controller] init failed:', error);
    const message = predictionHistoryService.mapErrorMessage(error);
    outlet.innerHTML = renderErrorState(message);
    showErrorToast(message);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachDetailHandlers(outlet) {
  outlet.querySelectorAll('[data-ph-back]').forEach((backLink) => {
    backLink.addEventListener('click', (event) => {
      event.preventDefault();
      void navigateTo(MATCH_DETAILS_BACK_HREF);
    });
  });

  outlet.querySelectorAll('[data-ph-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.getAttribute('data-ph-copy');
      if (!value) {
        return;
      }

      try {
        await navigator.clipboard.writeText(value);
        showSuccessToast('Copied to clipboard');
      } catch (error) {
        Logger.error('[match-details.controller] copy failed:', error);
        showErrorToast('Unable to copy to clipboard');
      }
    });
  });
}

/**
 * @returns {string}
 */
function renderLoadingState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {string} message
 * @returns {string}
 */
function renderErrorState(message) {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Match Details',
        subtitle: 'Review match results and your prediction',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({ title: 'Match Details', message, icon: 'bi-flag' })}
        </div>
      </div>
    </div>
  `;
}

/**
 * @returns {string}
 */
function renderAuthRequiredState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Match Details',
        subtitle: 'Review match results and your prediction',
      })}
      ${renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view match details.',
        icon: 'bi-lock',
      })}
    </div>
  `;
}
