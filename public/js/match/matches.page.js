/**
 * @fileoverview Contestant matches page.
 * @module match/matches.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MATCH_MESSAGES, MATCH_ROUTES } from './match.constants.js';
import { getMatchById, getMatchErrorMessage, listMatchesForContestant } from './match.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import {
  mountMatchListLoading,
  renderMatchListPage,
  renderMatchNotFound,
  renderContestantMatchDetail,
  renderPredictionComparison,
} from './match.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initMatchesPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initMatchesPage(outlet) {
  const params = new URLSearchParams(window.location.search);
  const matchId = params.get('id');

  if (matchId) {
    await renderDetailView(outlet, matchId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const matches = await listMatchesForContestant();
    outlet.innerHTML = `
      <div class="container-fluid ptw-page-content">
        <h1 class="h3 mb-3">Matches</h1>
        <div class="ptw-match-cards">
          ${matches.length === 0
    ? '<p class="ptw-text-muted">No published matches are available right now.</p>'
    : matches.map((match) => `
              <a class="text-decoration-none" href="${MATCH_ROUTES.CONTESTANT_LIST}?id=${encodeURIComponent(match.id)}" data-route>
                ${renderContestantMatchDetail(match)}
              </a>
            `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    Logger.error('[MatchesPage] List failed:', error);
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} matchId
 * @returns {Promise<void>}
 */
async function renderDetailView(outlet, matchId) {
  mountMatchListLoading(outlet);
  showLoadingOverlay(MATCH_MESSAGES.LOADING_MATCH);

  try {
    const match = await getMatchById(matchId);
    const user = getCurrentUser();

    if (!match) {
      outlet.innerHTML = renderMatchNotFound();
      return;
    }

    const prediction = user ? await getPredictionForUser(matchId, user.uid) : null;

    outlet.innerHTML = `
      <div class="container ptw-page-content">
        <a class="btn btn-outline-light mb-3" href="${MATCH_ROUTES.CONTESTANT_LIST}" data-route>Back to Matches</a>
        ${renderContestantMatchDetail(match)}
        ${match.result?.published ? renderPredictionComparison({ match, prediction }) : ''}
      </div>
    `;
  } catch (error) {
    outlet.innerHTML = renderMatchNotFound(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
