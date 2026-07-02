/**
 * @fileoverview Contestant matches page.
 * @module match/matches.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderMatchCard } from './match-card.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MATCH_MESSAGES, MATCH_ROUTES } from './match.constants.js';
import { getMatchById, getMatchErrorMessage, listMatchesForContestant } from './match.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
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
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const user = getCurrentUser();
    const matches = await listMatchesForContestant();
    const predictions = {};

    if (user) {
      await Promise.all(matches.map(async (match) => {
        predictions[match.id] = await getPredictionForUser(match.id, user.uid);
      }));
    }

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        ${renderContestantPageHeader({
    title: 'Upcoming Matches',
    subtitle: 'Published matches available for prediction',
  })}
        ${matches.length === 0
    ? renderEmptyState({
      title: 'No Matches',
      message: 'No published matches are available right now.',
      icon: 'bi-flag',
    })
    : `<div class="ptw-match-cards">${matches.map((match) => renderMatchCard({
      match,
      showPrediction: true,
      prediction: predictions[match.id] ?? null,
      showResult: Boolean(match.result?.published),
      showPoints: Boolean(match.result?.published),
    })).join('')}</div>`}
      </div>
    `;
    initializeCountdowns(outlet);
  } catch (error) {
    Logger.error('[MatchesPage] List failed:', error);
    outlet.innerHTML = renderErrorState(getMatchErrorMessage(error));
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
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(MATCH_MESSAGES.LOADING_MATCH);

  try {
    const match = await getMatchById(matchId);
    const user = getCurrentUser();

    if (!match) {
      outlet.innerHTML = renderErrorState(MATCH_MESSAGES.NOT_FOUND);
      return;
    }

    const prediction = user ? await getPredictionForUser(matchId, user.uid) : null;

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        <a class="btn btn-outline-light mb-3" href="${MATCH_ROUTES.CONTESTANT_LIST}" data-route>Back to Matches</a>
        ${renderContestantPageHeader({
    title: 'Match Details',
    subtitle: match.tournamentName ?? '',
  })}
        ${renderMatchCard({
    match,
    showPrediction: true,
    prediction,
    showResult: Boolean(match.result?.published),
    showPoints: Boolean(match.result?.published),
  })}
      </div>
    `;
    initializeCountdowns(outlet);
  } catch (error) {
    outlet.innerHTML = renderErrorState(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
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
      ${renderEmptyState({ title: 'Matches', message, icon: 'bi-flag' })}
    </div>
  `;
}
