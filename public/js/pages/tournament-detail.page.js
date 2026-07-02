/**
 * @fileoverview Tournament detail page with match listing for contestants.
 * @module pages/tournament-detail.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderStatisticCard } from '../components/statistic-card.component.js';
import { renderMatchCard } from '../match/match-card.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getTournamentById } from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { escapeHtml } from '../utils/html.util.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders the tournament detail page.
 * @param {HTMLElement} outlet
 * @param {string} tournamentId
 * @returns {void}
 */
export function render(outlet, tournamentId) {
  void initTournamentDetailPage(outlet, tournamentId);
}

/**
 * Initializes the tournament detail page.
 * @param {HTMLElement} outlet
 * @param {string} tournamentId
 * @returns {Promise<void>}
 */
async function initTournamentDetailPage(outlet, tournamentId) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay('Loading tournament...');

  try {
    const user = getCurrentUser();

    if (!user) {
      outlet.innerHTML = renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view tournament details.',
        icon: 'bi-lock',
      });
      return;
    }

    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      outlet.innerHTML = renderErrorState('Tournament not found');
      showErrorToast('Tournament not found');
      return;
    }

    // Load all matches for contestant and filter by tournament
    const allMatches = await listMatchesForContestant();
    const matches = allMatches.filter((m) => m.tournamentId === tournamentId);

    if (matches.length === 0) {
      outlet.innerHTML = `
        <div class="container-fluid px-3 px-lg-4 ptw-page-content">
          <button class="btn btn-outline-light mb-3" onclick="history.back()">
            <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Tournaments
          </button>
          ${renderPageHeader({
            title: tournament.name,
            subtitle: tournament.season || 'No matches published yet',
          })}
          ${renderEmptyState({
            title: 'No Matches Available',
            message: 'The tournament administrator has not published any matches yet. Check back later!',
            icon: 'bi-calendar-x',
          })}
        </div>
      `;
      return;
    }

    // Fetch predictions for all matches
    const predictionsMap = new Map();
    await Promise.all(
      matches.map(async (match) => {
        try {
          const prediction = await getPredictionForUser(match.id, user.uid);
          if (prediction) {
            predictionsMap.set(match.id, prediction);
          }
        } catch (error) {
          Logger.error('[TournamentDetailPage] Failed to load prediction:', error);
        }
      }),
    );

    outlet.innerHTML = renderTournamentDetailPage(tournament, matches, predictionsMap);
    attachEventHandlers(outlet);
  } catch (error) {
    Logger.error('[TournamentDetailPage] Failed to load:', error);
    outlet.innerHTML = renderErrorState(error.message);
    showErrorToast('Failed to load tournament details');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the tournament detail page.
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {Map<string, Record<string, unknown>>} predictionsMap
 * @returns {string}
 */
function renderTournamentDetailPage(tournament, matches, predictionsMap) {
  // Group matches by round
  const grouped = matches.reduce((acc, match) => {
    const round = match.round || 'Other';
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  // Order rounds
  const rounds = ['Group Stage', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final', 'Other'];
  const orderedGroups = rounds.filter((round) => grouped[round]);

  // Calculate statistics
  const totalMatches = matches.length;
  const submittedPredictions = Array.from(predictionsMap.values()).length;
  const pendingPredictions = totalMatches - submittedPredictions;
  const completedMatches = matches.filter((m) => m.result?.published).length;

  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      <button class="btn btn-outline-light mb-3" onclick="history.back()">
        <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Tournaments
      </button>

      <!-- Tournament Header -->
      <div class="card ptw-card mb-4">
        ${tournament.banner ? `
          <div class="card-img-top" style="background-image: url('${escapeHtml(tournament.banner)}'); height: 200px; background-size: cover; background-position: center;"></div>
        ` : ''}
        <div class="card-body">
          <div class="d-flex align-items-start mb-3">
            ${tournament.logo ? `
              <img src="${escapeHtml(tournament.logo)}" alt="${escapeHtml(tournament.name)}" class="me-3" style="width: 64px; height: 64px; object-fit: contain;">
            ` : ''}
            <div class="flex-grow-1">
              <h1 class="h3 mb-1">${escapeHtml(tournament.name)}</h1>
              ${tournament.season ? `<p class="text-muted mb-0">${escapeHtml(tournament.season)}</p>` : ''}
            </div>
          </div>
          ${tournament.description ? `
            <p class="ptw-text-muted mb-0">${escapeHtml(tournament.description)}</p>
          ` : ''}
        </div>
      </div>

      <!-- Statistics -->
      <div class="row g-3 mb-4">
        ${renderStatisticCard({
          icon: 'bi-bullseye',
          title: 'Total Matches',
          value: totalMatches,
          variant: 'primary',
        })}
        ${renderStatisticCard({
          icon: 'bi-check-circle',
          title: 'Submitted',
          value: submittedPredictions,
          variant: 'success',
        })}
        ${renderStatisticCard({
          icon: 'bi-clock',
          title: 'Pending',
          value: pendingPredictions,
          variant: 'warning',
        })}
        ${renderStatisticCard({
          icon: 'bi-flag-fill',
          title: 'Completed',
          value: completedMatches,
          variant: 'info',
        })}
      </div>

      <!-- Matches by Round -->
      ${orderedGroups.map((round) => `
        <div class="mb-4">
          <h3 class="h5 mb-3">
            <i class="bi bi-trophy me-2" aria-hidden="true"></i>
            ${escapeHtml(round)}
          </h3>
          <div class="ptw-match-cards">
            ${grouped[round].map((match) => renderMatchCard({
              match,
              showPrediction: true,
              prediction: predictionsMap.get(match.id) || null,
              showResult: match.result?.published || false,
              showPoints: match.result?.published || false,
              pointsEarned: 0, // TODO: Calculate from scoring engine
            })).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Attaches event handlers.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachEventHandlers(outlet) {
  // Make prediction buttons
  outlet.querySelectorAll('[data-action="make-prediction"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const matchId = event.currentTarget.dataset.matchId;
      if (matchId) {
        window.history.pushState({}, '', `/predictions?action=create&matchId=${encodeURIComponent(matchId)}`);
        // Trigger router navigation
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  });

  // Edit prediction buttons
  outlet.querySelectorAll('[data-action="edit-prediction"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const matchId = event.currentTarget.dataset.matchId;
      if (matchId) {
        window.history.pushState({}, '', `/predictions?action=edit&matchId=${encodeURIComponent(matchId)}`);
        // Trigger router navigation
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  });
}

/**
 * Renders loading state.
 * @returns {string}
 */
function renderLoadingState() {
  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div class="mt-3 ptw-text-muted">Loading tournament...</div>
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
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderEmptyState({
        title: 'Error',
        message: message || 'Failed to load tournament details',
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}

