/**
 * @fileoverview Admin leaderboard page with management controls.
 * @module pages/admin-leaderboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderLeaderboardTable } from '../leaderboard/renderers/leaderboard-table.renderer.js';
import { renderLeaderboardCards } from '../leaderboard/renderers/leaderboard-card.renderer.js';
import { renderTournamentStats } from '../leaderboard/renderers/tournament-stats.renderer.js';
import { renderLeaderboardFilters, initializeFilters } from '../leaderboard/components/leaderboard-filters.component.js';
import { leaderboardService } from '../leaderboard/leaderboard.service.js';
import { PlatformSettingsService } from '../settings/settings.service.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { listTournaments } from '../tournament/tournament.service.js';
import { showErrorToast, showSuccessToast } from '../utils/toast.util.js';
import { LEADERBOARD_MESSAGES } from '../leaderboard/leaderboard.constants.js';
import { Logger } from '../utils/logger.util.js';
import { escapeHtml } from '../utils/html.util.js';

let currentSearchTerm = '';
let currentFilter = 'all';
let allEntries = [];
let currentTournamentId = null;

/**
 * Renders the admin leaderboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initAdminLeaderboardPage(outlet);
}

/**
 * Initializes the admin leaderboard page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initAdminLeaderboardPage(outlet) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(LEADERBOARD_MESSAGES.LOADING);

  try {
    // Get all tournaments
    const tournaments = await listTournaments();
    const activeTournaments = tournaments.filter((t) => !t.archived);

    if (activeTournaments.length === 0) {
      outlet.innerHTML = renderNoTournamentState();
      return;
    }

    // Default to first active tournament
    currentTournamentId = activeTournaments[0].id;

    outlet.innerHTML = renderAdminLeaderboardView(activeTournaments);

    // Load leaderboard for default tournament
    await loadLeaderboard(outlet, currentTournamentId);

    initializeEventHandlers(outlet);
  } catch (error) {
    Logger.error('[AdminLeaderboardPage] Failed to load:', error);
    outlet.innerHTML = renderErrorState();
    showErrorToast(LEADERBOARD_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the admin leaderboard view.
 * @param {Array} tournaments
 * @returns {string}
 */
function renderAdminLeaderboardView(tournaments) {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Leaderboard Management',
        subtitle: 'View and manage tournament leaderboards',
      })}

      <div class="row mb-3">
        <div class="col-12 col-md-6">
          <label class="form-label">Select Tournament</label>
          <select class="form-select bg-dark border-secondary text-white" id="tournamentSelector">
            ${tournaments.map((t) => `
              <option value="${escapeHtml(t.id)}">${escapeHtml(t.name)}</option>
            `).join('')}
          </select>
        </div>
        <div class="col-12 col-md-6 d-flex align-items-end">
          <button class="btn btn-primary me-2" id="refreshLeaderboard">
            <i class="bi bi-arrow-clockwise me-1"></i>
            Refresh Leaderboard
          </button>
          <button class="btn btn-outline-secondary" id="toggleLeaderboardVisibility">
            <i class="bi bi-eye me-1"></i>
            Toggle Visibility
          </button>
        </div>
      </div>

      <div id="tournamentStatsContainer"></div>

      <div class="mt-3" id="leaderboardFiltersContainer"></div>

      <div class="card ptw-card mt-3">
        <div class="card-header">
          <h5 class="mb-0">
            <i class="bi bi-trophy me-2"></i>
            Tournament Rankings
          </h5>
        </div>
        <div class="card-body p-0">
          <div id="leaderboardContent">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Loads leaderboard for a specific tournament.
 * @param {HTMLElement} outlet
 * @param {string} tournamentId
 * @returns {Promise<void>}
 */
async function loadLeaderboard(outlet, tournamentId) {
  try {
    showLoadingOverlay(LEADERBOARD_MESSAGES.LOADING);

    await PlatformSettingsService.load();

    // Fetch leaderboard
    const entries = await leaderboardService.getTournamentLeaderboard(
      tournamentId,
      null, // No current user for admin view
    );

    allEntries = entries;

    // Get tournament for stats
    const tournaments = await listTournaments();
    const tournament = tournaments.find((t) => t.id === tournamentId);

    if (tournament) {
      const tournamentStats = await leaderboardService.getTournamentStatistics(
        tournamentId,
        tournament.name,
      );

      // Update stats
      const statsContainer = outlet.querySelector('#tournamentStatsContainer');
      if (statsContainer) {
        statsContainer.innerHTML = renderTournamentStats(tournamentStats);
      }
    }

    // Update filters
    const filtersContainer = outlet.querySelector('#leaderboardFiltersContainer');
    if (filtersContainer) {
      filtersContainer.innerHTML = renderLeaderboardFilters({
        currentFilter,
        searchTerm: currentSearchTerm,
        showMyPosition: false,
      });
    }

    // Update leaderboard content
    updateLeaderboardContent(outlet, entries);

    // Re-initialize filters
    initializeFilters(
      outlet,
      (filterValue) => handleFilterChange(filterValue, outlet),
      (searchValue) => handleSearchChange(searchValue, outlet),
    );
  } catch (error) {
    Logger.error('[AdminLeaderboardPage] Failed to load leaderboard:', error);
    showErrorToast(LEADERBOARD_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Initializes event handlers.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function initializeEventHandlers(outlet) {
  // Tournament selector
  const tournamentSelector = outlet.querySelector('#tournamentSelector');
  if (tournamentSelector) {
    tournamentSelector.addEventListener('change', (e) => {
      currentTournamentId = e.target.value;
      void loadLeaderboard(outlet, currentTournamentId);
    });
  }

  // Refresh button
  const refreshBtn = outlet.querySelector('#refreshLeaderboard');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => void handleRefresh(outlet));
  }

  // Toggle visibility button
  const toggleBtn = outlet.querySelector('#toggleLeaderboardVisibility');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => void handleToggleVisibility(outlet));
  }
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
    const entries = await leaderboardService.refreshLeaderboard(currentTournamentId, null);
    allEntries = entries;
    updateLeaderboardContent(outlet, entries);
    showSuccessToast(LEADERBOARD_MESSAGES.REFRESH_SUCCESS);
  } catch (error) {
    Logger.error('[AdminLeaderboardPage] Refresh failed:', error);
    showErrorToast(LEADERBOARD_MESSAGES.ERROR_LOADING);
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Handles toggle visibility button click.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function handleToggleVisibility(outlet) {
  const authUser = getCurrentUser();

  if (!authUser?.uid) {
    showErrorToast('Failed to toggle leaderboard visibility');
    return;
  }

  try {
    await PlatformSettingsService.load();
    const isVisible = PlatformSettingsService.isLeaderboardVisible();
    await PlatformSettingsService.updateLeaderboardVisibility(!isVisible, authUser.uid);
    showSuccessToast(`Leaderboard visibility: ${!isVisible ? 'Enabled' : 'Disabled'}`);
  } catch (error) {
    Logger.error('[AdminLeaderboardPage] Toggle visibility failed:', error);
    showErrorToast('Failed to toggle leaderboard visibility');
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
    null,
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
    null,
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

  if (entries.length === 0) {
    contentContainer.innerHTML = `
      <div class="py-5">
        ${renderEmptyState({
          title: LEADERBOARD_MESSAGES.NO_DATA,
          message: LEADERBOARD_MESSAGES.NO_DATA_MESSAGE,
          icon: 'bi-trophy',
        })}
      </div>
    `;
    return;
  }

  contentContainer.innerHTML = `
    <div class="d-none d-lg-block">
      ${renderLeaderboardTable(entries, { linkProfiles: true, showViewHistory: true })}
    </div>
    <div class="d-lg-none">
      ${renderLeaderboardCards(entries, { linkProfiles: true, showViewHistory: true })}
    </div>
  `;
}

/**
 * Renders loading state.
 * @returns {string}
 */
function renderLoadingState() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
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
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Leaderboard Management',
        subtitle: 'View and manage tournament leaderboards',
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
 * Renders error state.
 * @returns {string}
 */
function renderErrorState() {
  return `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'Leaderboard Management',
        subtitle: 'View and manage tournament leaderboards',
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

