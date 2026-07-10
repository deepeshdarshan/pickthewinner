/**
 * @fileoverview Tournaments listing page for contestants.
 * @module pages/tournaments.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderTournamentCard } from '../components/tournament-card.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { listTournamentsForContestant } from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { filterUpcomingMatches } from '../match/match-list.util.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { Logger } from '../utils/logger.util.js';

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

    const tournaments = await listTournamentsForContestant();

    if (tournaments.length === 0) {
      outlet.innerHTML = `
        <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
          ${renderContestantPageHeader({
            title: 'Tournaments',
            subtitle: 'Browse active prediction tournaments',
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

    const matches = await listMatchesForContestant();

    // Load match counts and prediction progress for each tournament
    const tournamentData = await Promise.all(
      tournaments.map(async (tournament) => {
        try {
          const tournamentMatches = matches.filter((m) => m.tournamentId === tournament.id);
          const upcomingMatchCount = filterUpcomingMatches(tournamentMatches).length;

          // Count submitted predictions
          let submittedCount = 0;
          for (const match of tournamentMatches) {
            const prediction = await getPredictionForUser(match.id, user.uid);
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

    outlet.innerHTML = renderTournamentsPage(tournamentData);
  } catch (error) {
    Logger.error('[TournamentsPage] Failed to load:', error);
    outlet.innerHTML = renderErrorState(error.message);
    showErrorToast('Failed to load tournaments');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the tournaments page.
 * @param {Array<{tournament: import('../tournament/tournament.service.js').Tournament, totalMatches: number, submittedPredictions: number, upcomingMatchCount: number}>} tournamentData
 * @returns {string}
 */
function renderTournamentsPage(tournamentData) {
  // Group by status
  const live = tournamentData.filter((t) => t.tournament.status === 'live');
  const upcoming = tournamentData.filter((t) => t.tournament.status === 'published');
  const completed = tournamentData.filter((t) => t.tournament.status === 'completed');

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Tournaments',
        subtitle: 'Browse and participate in prediction tournaments',
      })}

      ${live.length > 0 ? `
        <div class="mb-4">
          <h3 class="h5 mb-3">
            <i class="bi bi-broadcast text-success me-2" aria-hidden="true"></i>
            Live Tournaments
          </h3>
          <div class="row g-3">
            ${live.map((data) => `
              <div class="col-12">
                ${renderTournamentCard({
                  tournament: data.tournament,
                  totalMatches: data.totalMatches,
                  submittedPredictions: data.submittedPredictions,
                  showProgress: true,
                  upcomingMatchCount: data.upcomingMatchCount,
                })}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${upcoming.length > 0 ? `
        <div class="mb-4">
          <h3 class="h5 mb-3">
            <i class="bi bi-calendar-event text-warning me-2" aria-hidden="true"></i>
            Upcoming Tournaments
          </h3>
          <div class="row g-3">
            ${upcoming.map((data) => `
              <div class="col-12">
                ${renderTournamentCard({
                  tournament: data.tournament,
                  totalMatches: data.totalMatches,
                  submittedPredictions: data.submittedPredictions,
                  showProgress: true,
                  upcomingMatchCount: data.upcomingMatchCount,
                })}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${completed.length > 0 ? `
        <div class="mb-4">
          <h3 class="h5 mb-3">
            <i class="bi bi-check-circle text-secondary me-2" aria-hidden="true"></i>
            Completed Tournaments
          </h3>
          <div class="row g-3">
            ${completed.map((data) => `
              <div class="col-12">
                ${renderTournamentCard({
                  tournament: data.tournament,
                  totalMatches: data.totalMatches,
                  submittedPredictions: data.submittedPredictions,
                  showProgress: false,
                  upcomingMatchCount: data.upcomingMatchCount,
                })}
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
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

