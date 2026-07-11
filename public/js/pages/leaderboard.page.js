/**
 * @fileoverview Leaderboard page — displays tournament rankings.
 * @module pages/leaderboard.page
 */

import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderLeaderboardTable } from '../leaderboard/renderers/leaderboard-table.renderer.js';
import { renderLeaderboardCards } from '../leaderboard/renderers/leaderboard-card.renderer.js';
import { renderContestantStats } from '../leaderboard/renderers/contestant-stats.renderer.js';
import { renderTournamentStats } from '../leaderboard/renderers/tournament-stats.renderer.js';
import { renderLeaderboardFilters, initializeFilters } from '../leaderboard/components/leaderboard-filters.component.js';
import { leaderboardService } from '../leaderboard/leaderboard.service.js';
import { PlatformSettingsService } from '../settings/settings.service.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { getActiveTournament } from '../tournament/tournament.service.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { Roles } from '../authorization/permission.constants.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { LEADERBOARD_MESSAGES } from '../leaderboard/leaderboard.constants.js';
import { Logger } from '../utils/logger.util.js';

let currentSearchTerm = '';
let currentFilter = 'all';
let allEntries = [];
let currentTournamentId = null;
let currentUserId = null;
let canLinkContestantProfiles = false;
let showLeaderboardFilters = false;
/** @type {number|null} */
let maxVisibleRank = null;

/**
 * Renders the leaderboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initLeaderboardPage(outlet);
}

/**
 * Initializes the leaderboard page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initLeaderboardPage(outlet) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(LEADERBOARD_MESSAGES.LOADING);

  try {
    const user = getCurrentUser();
    currentUserId = user?.uid || null;

    // Get active tournament
    const tournament = await getActiveTournament();

    if (!tournament) {
      outlet.innerHTML = renderNoTournamentState();
      return;
    }

    currentTournamentId = tournament.id;

    // Load tournament configuration
    await TournamentConfigurationService.load(tournament.id);

    await AuthorizationService.resolve();
    const isAdmin = AuthorizationService.hasRole(Roles.ADMIN);
    await PlatformSettingsService.load();
    maxVisibleRank = isAdmin ? null : PlatformSettingsService.getContestantLeaderboardLimit();
    canLinkContestantProfiles = isAdmin;
    showLeaderboardFilters = isAdmin;

    const leaderboardOptions = maxVisibleRank === null ? {} : { maxVisibleRank };

    // Fetch leaderboard data
    const entries = await leaderboardService.getTournamentLeaderboard(
      tournament.id,
      currentUserId,
      true,
      leaderboardOptions,
    );

    if (entries.length === 0) {
      outlet.innerHTML = renderNoDataState();
      return;
    }

    allEntries = entries;

    // Fetch statistics
    const tournamentStats = await leaderboardService.getTournamentStatistics(
      tournament.id,
      tournament.name,
    );

    let contestantStats = null;
    if (currentUserId && !isAdmin) {
      contestantStats = await leaderboardService.getContestantStatistics(
        tournament.id,
        currentUserId,
        leaderboardOptions,
      );
    }

    outlet.innerHTML = renderLeaderboardView(entries, tournamentStats, contestantStats);
    initializeEventHandlers(outlet);
  } catch (error) {
    Logger.error('[LeaderboardPage] Failed to load leaderboard:', error);
    outlet.innerHTML = renderErrorState();
    showErrorToast(LEADERBOARD_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the main leaderboard view.
 * @param {Array} entries
 * @param {Object} tournamentStats
 * @param {Object|null} contestantStats
 * @returns {string}
 */
function renderLeaderboardView(entries, tournamentStats, contestantStats) {
  const isMobile = window.innerWidth < 768;
  const linkOptions = { linkProfiles: canLinkContestantProfiles };
  const showMyPosition = !!currentUserId
    && (maxVisibleRank === null || entries.some((entry) => entry.userId === currentUserId));

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}

      ${contestantStats ? renderContestantStats(contestantStats) : ''}

      <div class="mt-3">
        ${renderTournamentStats(tournamentStats)}
      </div>

      ${showLeaderboardFilters ? `
        <div class="mt-3">
          ${renderLeaderboardFilters({
            currentFilter,
            searchTerm: currentSearchTerm,
            showMyPosition,
            maxVisibleRank,
          })}
        </div>
      ` : ''}

      <div class="card ptw-card${showLeaderboardFilters ? '' : ' mt-3'}">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            <i class="bi bi-trophy me-2"></i>
            Rankings
          </h5>
          <button class="btn btn-sm btn-outline-primary" id="refreshLeaderboard">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>
        <div class="card-body p-0">
          <div id="leaderboardContent">
            ${isMobile ? renderLeaderboardCards(entries, linkOptions) : renderLeaderboardTable(entries, linkOptions)}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes event handlers.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function initializeEventHandlers(outlet) {
  // Refresh button
  const refreshBtn = outlet.querySelector('#refreshLeaderboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => void handleRefresh(outlet));
  }

  // Filters (admin only)
  if (showLeaderboardFilters) {
    initializeFilters(
      outlet,
      (filterValue) => void handleFilterChange(filterValue, outlet),
      (searchValue) => void handleSearchChange(searchValue, outlet),
    );
  }

  // Responsive view switching
  window.addEventListener('resize', () => void handleResize(outlet));
}

/**
 * Handles refresh button click.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function handleRefresh(outlet) {
  if (!currentTournamentId) return;

  try {
    showLoadingOverlay(LEADERBOARD_MESSAGES.LOADING);
    const leaderboardOptions = maxVisibleRank === null ? {} : { maxVisibleRank };
    const entries = await leaderboardService.refreshLeaderboard(
      currentTournamentId,
      currentUserId,
      leaderboardOptions,
    );
    allEntries = entries;
    updateLeaderboardContent(outlet, entries);
    showSuccessToast(LEADERBOARD_MESSAGES.REFRESH_SUCCESS);
  } catch (error) {
    Logger.error('[LeaderboardPage] Refresh failed:', error);
    showErrorToast(LEADERBOARD_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Handles filter change.
 * @param {string} filterValue
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function handleFilterChange(filterValue, outlet) {
  currentFilter = filterValue;
  const filtered = leaderboardService.filterAndSort(
    allEntries,
    currentSearchTerm,
    currentFilter,
    currentUserId,
  );
  updateLeaderboardContent(outlet, filtered);
}

/**
 * Handles search change.
 * @param {string} searchValue
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function handleSearchChange(searchValue, outlet) {
  currentSearchTerm = searchValue;
  const filtered = leaderboardService.filterAndSort(
    allEntries,
    currentSearchTerm,
    currentFilter,
    currentUserId,
  );
  updateLeaderboardContent(outlet, filtered);
}

/**
 * Handles window resize.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function handleResize(outlet) {
  const filtered = leaderboardService.filterAndSort(
    allEntries,
    currentSearchTerm,
    currentFilter,
    currentUserId,
  );
  updateLeaderboardContent(outlet, filtered);
}

/**
 * Updates leaderboard content only.
 * @param {HTMLElement} outlet
 * @param {Array} entries
 * @returns {void}
 */
function updateLeaderboardContent(outlet, entries) {
  const contentContainer = outlet.querySelector('#leaderboardContent');
  if (!contentContainer) return;

  const isMobile = window.innerWidth < 768;
  const linkOptions = { linkProfiles: canLinkContestantProfiles };
  contentContainer.innerHTML = isMobile
    ? renderLeaderboardCards(entries, linkOptions)
    : renderLeaderboardTable(entries, linkOptions);
}

/**
 * Renders loading state.
 * @returns {string}
 */
function renderLoadingState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders no tournament state.
 * @returns {string}
 */
function renderNoTournamentState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: LEADERBOARD_MESSAGES.NO_TOURNAMENT,
            message: LEADERBOARD_MESSAGES.NO_TOURNAMENT_MESSAGE,
            icon: 'bi-trophy',
          })}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders no data state.
 * @returns {string}
 */
function renderNoDataState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: LEADERBOARD_MESSAGES.NO_DATA,
            message: LEADERBOARD_MESSAGES.NO_DATA_MESSAGE,
            icon: 'bi-trophy',
          })}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders error state.
 * @returns {string}
 */
function renderErrorState() {
  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Leaderboard',
        subtitle: 'Tournament standings and rankings',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: LEADERBOARD_MESSAGES.ERROR_LOADING,
            message: LEADERBOARD_MESSAGES.ERROR_LOADING_MESSAGE,
            icon: 'bi-exclamation-triangle',
          })}
        </div>
      </div>
    </div>
  `;
}

