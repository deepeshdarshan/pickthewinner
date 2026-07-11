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
import {
  filterUpcomingMatches,
  getContestantMatchCardsGridClass,
  groupMatchesByRoundLabel,
  sortMatchesByKickoff,
} from './match-list.util.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { escapeHtml } from '../utils/html.util.js';
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
    const allMatches = await listMatchesForContestant();
    const matches = sortMatchesByKickoff(filterUpcomingMatches(allMatches), false);
    const predictions = {};

    if (user) {
      await Promise.all(matches.map(async (match) => {
        predictions[match.id] = await getPredictionForUser(match.id, user.uid);
      }));
    }

    const matchSections = matches.length > 0
      ? renderUpcomingMatchSections(matches, predictions)
      : '';

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        ${renderContestantPageHeader({
    title: 'Upcoming Matches',
    subtitle: 'Published matches available for prediction',
  })}
        ${matches.length === 0
    ? `
        <div class="card ptw-card">
          <div class="card-body">
            ${renderEmptyState({
      title: 'No Upcoming Matches',
      message: 'No upcoming matches are scheduled right now.',
      icon: 'bi-flag',
    })}
          </div>
        </div>
      `
    : matchSections}
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
 * @param {import('./match.service.js').EnrichedMatch[]} matches
 * @param {Record<string, Record<string, unknown>|null>} predictions
 * @returns {string}
 */
function renderUpcomingMatchSections(matches, predictions) {
  const { grouped, orderedRounds } = groupMatchesByRoundLabel(matches);

  return orderedRounds.map((round) => {
    const roundMatches = grouped[round];

    return `
    <div class="mb-4">
      <h3 class="h5 mb-3">${escapeHtml(round)}</h3>
      <div class="${getContestantMatchCardsGridClass(roundMatches.length)}">
        ${roundMatches.map((match) => renderMatchCard({
    match,
    showPrediction: true,
    prediction: predictions[match.id] ?? null,
    showResult: Boolean(match.result?.published),
    showPoints: Boolean(match.result?.published),
  })).join('')}
      </div>
    </div>
  `;
  }).join('');
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
      ${renderContestantPageHeader({
    title: 'Upcoming Matches',
    subtitle: 'Published matches available for prediction',
  })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({ title: 'Matches', message, icon: 'bi-flag' })}
        </div>
      </div>
    </div>
  `;
}
