/**
 * @fileoverview Contestant matches page.
 * @module match/matches.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import {
  activateAdminListTab,
  consumeAdminTabFlag,
  renderAdminListTabs,
} from '../components/admin-list-tabs.component.js';
import { renderMatchCard } from './match-card.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { MATCH_MESSAGES, MATCH_ROUTES } from './match.constants.js';
import {
  getMatchById,
  getMatchErrorMessage,
  listArchivedMatchesForContestant,
  listMatchesForContestant,
} from './match.service.js';
import {
  getContestantMatchCardsGridClass,
  partitionContestantBrowseMatches,
  sortMatchesByKickoff,
} from './match-list.util.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { Logger } from '../utils/logger.util.js';

/** @type {Readonly<string>} */
const CONTESTANT_MATCH_TABS_ID = 'ptw-contestant-match-list-tabs';

/** @typedef {'completed' | 'upcoming' | 'archived'} ContestantMatchTabId */

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

  await renderListView(outlet, params.get('tab'));
}

/**
 * @param {HTMLElement} outlet
 * @param {string|null} tabFromQuery
 * @returns {Promise<void>}
 */
async function renderListView(outlet, tabFromQuery) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(MATCH_MESSAGES.LOADING);

  try {
    const user = getCurrentUser();
    const [activeMatches, archivedMatches] = await Promise.all([
      listMatchesForContestant(),
      listArchivedMatchesForContestant(),
    ]);
    const { upcoming, completed, archived } = partitionContestantBrowseMatches(
      activeMatches,
      archivedMatches,
    );
    const sortedUpcoming = sortMatchesByKickoff(upcoming, false);
    const sortedCompleted = sortMatchesByKickoff(completed, true);
    const sortedArchived = sortMatchesByKickoff(archived, true);
    const allMatches = [...sortedUpcoming, ...sortedCompleted, ...sortedArchived];
    const predictions = {};

    if (user) {
      await Promise.all(allMatches.map(async (match) => {
        predictions[match.id] = await getPredictionForUser(match.id, user.uid);
      }));
    }

    if (allMatches.length === 0) {
      outlet.innerHTML = `
        <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
          ${renderContestantPageHeader({
            title: 'Matches',
            subtitle: 'Browse upcoming, completed, and archived matches',
          })}
          <div class="card ptw-card">
            <div class="card-body">
              ${renderEmptyState({
                title: 'No Matches Available',
                message: 'There are no matches to display right now.',
                icon: 'bi-flag',
              })}
            </div>
          </div>
        </div>
      `;
      return;
    }

    const activeTabId = resolveInitialMatchTab(tabFromQuery, {
      upcoming: sortedUpcoming.length,
      completed: sortedCompleted.length,
      archived: sortedArchived.length,
    });

    outlet.innerHTML = renderMatchesPageWithTabs({
      upcoming: sortedUpcoming,
      completed: sortedCompleted,
      archived: sortedArchived,
      predictions,
      activeTabId,
    });
    initializeCountdowns(outlet);
    activateAdminListTab(outlet, activeTabId, CONTESTANT_MATCH_TABS_ID);
  } catch (error) {
    Logger.error('[MatchesPage] List failed:', error);
    outlet.innerHTML = renderErrorState(getMatchErrorMessage(error));
    showErrorToast(getMatchErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {string|null} tabFromQuery
 * @param {{ upcoming: number, completed: number, archived: number }} counts
 * @returns {ContestantMatchTabId}
 */
function resolveInitialMatchTab(tabFromQuery, counts) {
  const normalizedTab = String(tabFromQuery ?? '').trim().toLowerCase();

  if (normalizedTab === 'archived' || consumeAdminTabFlag('contestant-matches-archived')) {
    return 'archived';
  }

  if (normalizedTab === 'completed' || consumeAdminTabFlag('contestant-matches-completed')) {
    return 'completed';
  }

  if (normalizedTab === 'upcoming' || consumeAdminTabFlag('contestant-matches-upcoming')) {
    return 'upcoming';
  }

  if (counts.upcoming > 0) {
    return 'upcoming';
  }

  if (counts.completed > 0) {
    return 'completed';
  }

  return 'archived';
}

/**
 * @param {{
 *   upcoming: import('./match.service.js').EnrichedMatch[],
 *   completed: import('./match.service.js').EnrichedMatch[],
 *   archived: import('./match.service.js').EnrichedMatch[],
 *   predictions: Record<string, Record<string, unknown>|null>,
 *   activeTabId: ContestantMatchTabId,
 * }} options
 * @returns {string}
 */
function renderMatchesPageWithTabs(options) {
  const { upcoming, completed, archived, predictions, activeTabId } = options;

  const tabs = renderAdminListTabs({
    groupId: CONTESTANT_MATCH_TABS_ID,
    activeTabId,
    tabs: [
      {
        id: 'completed',
        label: 'Completed',
        count: completed.length,
        contentHtml: renderMatchTabContent(
          completed,
          renderMatchTabBody(completed, predictions, {
            emptyTitle: 'No Completed Matches',
            emptyMessage: 'Completed matches will appear here after kickoff.',
            emptyIcon: 'bi-check-circle',
          }),
        ),
      },
      {
        id: 'upcoming',
        label: 'Upcoming',
        count: upcoming.length,
        contentHtml: renderMatchTabContent(
          upcoming,
          renderMatchTabBody(upcoming, predictions, {
            emptyTitle: 'No Upcoming Matches',
            emptyMessage: 'No upcoming matches are scheduled right now.',
            emptyIcon: 'bi-calendar-event',
          }),
        ),
      },
      {
        id: 'archived',
        label: 'Archived',
        count: archived.length,
        contentHtml: renderMatchTabContent(
          archived,
          renderMatchTabBody(archived, predictions, {
            emptyTitle: 'No Archived Matches',
            emptyMessage: MATCH_MESSAGES.NO_ARCHIVED_MATCHES,
            emptyIcon: 'bi-archive',
          }),
        ),
      },
    ],
  });

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Matches',
        subtitle: 'Browse upcoming, completed, and archived matches',
      })}
      ${tabs}
    </div>
  `;
}

/**
 * @param {import('./match.service.js').EnrichedMatch[]} matches
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderMatchTabContent(matches, bodyHtml) {
  if (matches.length === 0) {
    return bodyHtml;
  }

  return `
    <div class="card ptw-card">
      <div class="card-body">
        ${bodyHtml}
      </div>
    </div>
  `;
}

/**
 * @param {import('./match.service.js').EnrichedMatch[]} matches
 * @param {Record<string, Record<string, unknown>|null>} predictions
 * @param {{ emptyTitle: string, emptyMessage: string, emptyIcon: string }} emptyState
 * @returns {string}
 */
function renderMatchTabBody(matches, predictions, emptyState) {
  if (matches.length === 0) {
    return renderEmptyState({
      title: emptyState.emptyTitle,
      message: emptyState.emptyMessage,
      icon: emptyState.emptyIcon,
    });
  }

  return `
    <div class="${getContestantMatchCardsGridClass(matches.length)}">
      ${matches.map((match) => renderMatchCard({
        match,
        showPrediction: true,
        prediction: predictions[match.id] ?? null,
        showResult: Boolean(match.result?.published),
        showPoints: Boolean(match.result?.published),
      })).join('')}
    </div>
  `;
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
        title: 'Matches',
        subtitle: 'Browse upcoming, completed, and archived matches',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({ title: 'Matches', message, icon: 'bi-flag' })}
        </div>
      </div>
    </div>
  `;
}
