/**
 * @fileoverview Tournaments listing page for contestants.
 * @module pages/tournaments.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderTournamentCard } from '../components/tournament-card.component.js';
import {
  activateAdminListTab,
  consumeAdminTabFlag,
  renderAdminListTabs,
} from '../components/admin-list-tabs.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import {
  listArchivedTournamentsForContestant,
  listTournamentsForContestant,
} from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { filterUpcomingMatches } from '../match/match-list.util.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { Logger } from '../utils/logger.util.js';

/** @type {Readonly<string>} */
const CONTESTANT_TOURNAMENT_TABS_ID = 'ptw-contestant-tournament-list-tabs';

/**
 * @typedef {Object} ContestantTournamentListItem
 * @property {import('../tournament/tournament.service.js').Tournament} tournament
 * @property {number} totalMatches
 * @property {number} submittedPredictions
 * @property {number} upcomingMatchCount
 */

/**
 * Renders the tournaments page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initTournamentsPage(outlet);
}

/**
 * Initializes the tournaments page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initTournamentsPage(outlet) {
  const params = new URLSearchParams(window.location.search);
  const tournamentId = params.get('id');

  if (tournamentId) {
    // Import and delegate to tournament detail page
    const { render: renderDetail } = await import('./tournament-detail.page.js');
    renderDetail(outlet, tournamentId);
    return;
  }

  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay('Loading tournaments...');

  try {
    const user = getCurrentUser();

    if (!user) {
      outlet.innerHTML = renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view tournaments.',
        icon: 'bi-lock',
      });
      return;
    }

    const [activeTournaments, archivedTournaments, matches] = await Promise.all([
      listTournamentsForContestant(),
      listArchivedTournamentsForContestant(),
      listMatchesForContestant(),
    ]);

    if (activeTournaments.length === 0 && archivedTournaments.length === 0) {
      outlet.innerHTML = `
        <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
          ${renderContestantPageHeader({
            title: 'Tournaments',
            subtitle: 'Browse active and archived prediction tournaments',
          })}
          ${renderEmptyState({
            title: 'No Tournaments Available',
            message: 'There are no published tournaments at this time. Check back later!',
            icon: 'bi-calendar-x',
          })}
        </div>
      `;
      return;
    }

    const [activeTournamentData, archivedTournamentData] = await Promise.all([
      loadTournamentListData(activeTournaments, matches, user.uid),
      loadTournamentListData(archivedTournaments, matches, user.uid),
    ]);

    const activeTabId = resolveInitialTournamentTab(activeTournaments.length, archivedTournaments.length);

    outlet.innerHTML = renderTournamentsPageWithTabs(activeTournamentData, archivedTournamentData, activeTabId);
    activateAdminListTab(outlet, activeTabId, CONTESTANT_TOURNAMENT_TABS_ID);
  } catch (error) {
    Logger.error('[TournamentsPage] Failed to load:', error);
    outlet.innerHTML = renderErrorState(error.message);
    showErrorToast('Failed to load tournaments');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {import('../tournament/tournament.service.js').Tournament[]} tournaments
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {string} userId
 * @returns {Promise<ContestantTournamentListItem[]>}
 */
async function loadTournamentListData(tournaments, matches, userId) {
  return Promise.all(
    tournaments.map(async (tournament) => {
      try {
        const tournamentMatches = matches.filter((match) => match.tournamentId === tournament.id);
        const upcomingMatchCount = filterUpcomingMatches(tournamentMatches).length;

        let submittedCount = 0;
        for (const match of tournamentMatches) {
          const prediction = await getPredictionForUser(match.id, userId);
          if (prediction) {
            submittedCount++;
          }
        }

        return {
          tournament,
          totalMatches: tournamentMatches.length,
          submittedPredictions: submittedCount,
          upcomingMatchCount,
        };
      } catch (error) {
        Logger.error('[TournamentsPage] Failed to load tournament data:', error);
        return {
          tournament,
          totalMatches: 0,
          submittedPredictions: 0,
          upcomingMatchCount: 0,
        };
      }
    }),
  );
}

/**
 * @param {number} activeCount
 * @param {number} archivedCount
 * @returns {'active' | 'archived'}
 */
function resolveInitialTournamentTab(activeCount, archivedCount) {
  if (consumeAdminTabFlag('contestant-tournaments-archived')) {
    return 'archived';
  }

  if (activeCount === 0 && archivedCount > 0) {
    return 'archived';
  }

  return 'active';
}

/**
 * @param {ContestantTournamentListItem[]} activeTournamentData
 * @param {ContestantTournamentListItem[]} archivedTournamentData
 * @param {'active' | 'archived'} activeTabId
 * @returns {string}
 */
function renderTournamentsPageWithTabs(activeTournamentData, archivedTournamentData, activeTabId) {
  const tabs = renderAdminListTabs({
    groupId: CONTESTANT_TOURNAMENT_TABS_ID,
    activeTabId,
    tabs: [
      {
        id: 'active',
        label: 'My Tournaments',
        count: activeTournamentData.length,
        contentHtml: renderTournamentTabContent(
          activeTournamentData,
          renderActiveTournamentsContent(activeTournamentData),
        ),
      },
      {
        id: 'archived',
        label: 'Archived',
        count: archivedTournamentData.length,
        contentHtml: renderTournamentTabContent(
          archivedTournamentData,
          renderArchivedTournamentsContent(archivedTournamentData),
        ),
      },
    ],
  });

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Tournaments',
        subtitle: 'Browse active and archived prediction tournaments',
      })}
      ${tabs}
    </div>
  `;
}

/**
 * @param {ContestantTournamentListItem[]} tournamentData
 * @param {string} bodyHtml
 * @returns {string}
 */
function renderTournamentTabContent(tournamentData, bodyHtml) {
  if (tournamentData.length === 0) {
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
 * @param {ContestantTournamentListItem[]} tournamentData
 * @returns {string}
 */
function renderActiveTournamentsContent(tournamentData) {
  if (tournamentData.length === 0) {
    return renderEmptyState({
      title: 'No Active Tournaments',
      message: 'There are no active tournaments right now.',
      icon: 'bi-calendar-event',
    });
  }

  const live = tournamentData.filter((item) => item.tournament.status === 'live');
  const upcoming = tournamentData.filter((item) => item.tournament.status === 'published');
  const completed = tournamentData.filter((item) => item.tournament.status === 'completed');

  return `
    ${live.length > 0 ? renderTournamentStatusSection('Live Tournaments', 'bi-broadcast text-success', live, true) : ''}
    ${upcoming.length > 0 ? renderTournamentStatusSection('Upcoming Tournaments', 'bi-calendar-event text-warning', upcoming, true) : ''}
    ${completed.length > 0 ? renderTournamentStatusSection('Completed Tournaments', 'bi-check-circle text-secondary', completed, false) : ''}
  `;
}

/**
 * @param {ContestantTournamentListItem[]} tournamentData
 * @returns {string}
 */
function renderArchivedTournamentsContent(tournamentData) {
  if (tournamentData.length === 0) {
    return renderEmptyState({
      title: 'No Archived Tournaments',
      message: 'Archived tournaments will appear here after they are closed.',
      icon: 'bi-archive',
    });
  }

  return `
    <div class="row g-3">
      ${tournamentData.map((data) => `
        <div class="col-12">
          ${renderTournamentCard({
            tournament: data.tournament,
            totalMatches: data.totalMatches,
            submittedPredictions: data.submittedPredictions,
            showProgress: data.totalMatches > 0,
            upcomingMatchCount: data.upcomingMatchCount,
            actionLabel: 'View Tournament',
          })}
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * @param {string} title
 * @param {string} iconClass
 * @param {ContestantTournamentListItem[]} tournamentData
 * @param {boolean} showProgress
 * @returns {string}
 */
function renderTournamentStatusSection(title, iconClass, tournamentData, showProgress) {
  return `
    <div class="mb-4">
      <h3 class="h5 mb-3">
        <i class="bi ${iconClass} me-2" aria-hidden="true"></i>
        ${title}
      </h3>
      <div class="row g-3">
        ${tournamentData.map((data) => `
          <div class="col-12">
            ${renderTournamentCard({
              tournament: data.tournament,
              totalMatches: data.totalMatches,
              submittedPredictions: data.submittedPredictions,
              showProgress,
              upcomingMatchCount: data.upcomingMatchCount,
            })}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Renders loading state.
 * @returns {string}
 */
function renderLoadingState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div class="mt-3 ptw-text-muted">Loading tournaments...</div>
      </div>
    </div>
  `;
}

/**
 * Renders error state.
 * @param {string} message
 * @returns {string}
 */
function renderErrorState(message) {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderEmptyState({
        title: 'Error',
        message: message || 'Failed to load tournaments',
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}
