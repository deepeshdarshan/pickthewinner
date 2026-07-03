/**
 * @fileoverview Predictions page — contestant prediction management.
 * @module pages/predictions.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { showSuccessToast, showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { getTournamentById } from '../tournament/tournament.service.js';
import { renderMatchCard } from '../match/match-card.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { renderPredictionForm, attachPredictionFormHandlers } from '../prediction/prediction-form.component.js';
import {
  submitPrediction,
  updatePrediction,
  getExistingPrediction,
} from '../prediction/prediction-submission.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { Logger } from '../utils/logger.util.js';

/** @type {import('../match/match.service.js').EnrichedMatch|null} */
let currentMatch = null;

/** @type {boolean} */
let isEditing = false;

/**
 * Renders the predictions page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initPredictionsPage(outlet);
}

/**
 * Initializes the predictions page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initPredictionsPage(outlet) {
  const params = new URLSearchParams(window.location.search);
  const action = params.get('action');
  const matchId = params.get('matchId');

  if (action === 'edit' && matchId) {
    await renderPredictionFormView(outlet, matchId, true);
    return;
  }

  if (action === 'create' && matchId) {
    await renderPredictionFormView(outlet, matchId, false);
    return;
  }

  await renderPredictionsListView(outlet);
}

/**
 * Renders predictions list view.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderPredictionsListView(outlet) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay('Loading predictions...');

  try {
    const user = getCurrentUser();

    if (!user) {
      outlet.innerHTML = renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view predictions.',
        icon: 'bi-lock',
      });
      return;
    }

    const matches = await listMatchesForContestant();

    if (matches.length === 0) {
      outlet.innerHTML = `
        <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
          ${renderContestantPageHeader({
            title: 'Predictions',
            subtitle: 'Submit your match predictions',
          })}
          ${renderEmptyState({
            title: 'No Matches Available',
            message: 'There are no published matches available for predictions at this time.',
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
        const prediction = await getPredictionForUser(match.id, user.uid);
        if (prediction) {
          predictionsMap.set(match.id, prediction);
        }
      }),
    );

    outlet.innerHTML = renderPredictionsPage(matches, predictionsMap);
    attachPredictionsPageHandlers(outlet);
    initializeCountdowns(outlet);
  } catch (error) {
    Logger.error('[PredictionsPage] Failed to load:', error);
    outlet.innerHTML = renderErrorState(error.message);
    showErrorToast('Failed to load predictions');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders prediction form view.
 * @param {HTMLElement} outlet
 * @param {string} matchId
 * @param {boolean} isEdit
 * @returns {Promise<void>}
 */
async function renderPredictionFormView(outlet, matchId, isEdit) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay(isEdit ? 'Loading prediction...' : 'Loading match...');

  try {
    const user = getCurrentUser();

    if (!user) {
      showErrorToast('Authentication required');
      window.history.back();
      return;
    }

    const matches = await listMatchesForContestant();

    // Filter matches to only show those from ongoing/published tournaments
    const allowedStatuses = ['live', 'published'];
    const tournamentCache = new Map();

    const filteredMatches = [];
    for (const match of matches) {
      if (!match.tournamentId) continue;

      // Check tournament status (with caching to avoid repeated queries)
      let tournament = tournamentCache.get(match.tournamentId);
      if (!tournament) {
        tournament = await getTournamentById(match.tournamentId);
        tournamentCache.set(match.tournamentId, tournament);
      }

      if (tournament && allowedStatuses.includes(tournament.status)) {
        filteredMatches.push(match);
      }
    }

    const match = filteredMatches.find((m) => m.id === matchId);

    if (!match) {
      showErrorToast('Match not found');
      window.history.back();
      return;
    }

    currentMatch = match;
    isEditing = isEdit;

    const existingPrediction = isEdit ? await getExistingPrediction(matchId, user.uid) : null;

    // Load tournament configuration
    await TournamentConfigurationService.load(match.tournamentId);
    const requireWinnerSelectionForDrawPrediction = TournamentConfigurationService.requireWinnerSelectionForDrawPrediction();

    outlet.innerHTML = `
      <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
        <button class="btn btn-outline-light mb-3" onclick="history.back()">
          <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Predictions
        </button>
        ${renderPredictionForm({ match, existingPrediction, isEdit, requireWinnerSelectionForDrawPrediction })}
      </div>
    `;

    attachFormHandlers(outlet);
  } catch (error) {
    Logger.error('[PredictionsPage] Failed to load form:', error);
    showErrorToast(error.message || 'Failed to load prediction form');
    window.history.back();
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the predictions page.
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {Map<string, Record<string, unknown>>} predictionsMap
 * @returns {string}
 */
function renderPredictionsPage(matches, predictionsMap) {
  // Group matches by round
  const grouped = matches.reduce((acc, match) => {
    const round = match.round || 'Other';
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  const rounds = ['Group Stage', 'Round of 16', 'Quarter Finals', 'Semi Finals', 'Final', 'Other'];
  const orderedGroups = rounds.filter((round) => grouped[round]);

  const totalMatches = matches.length;
  const submittedPredictions = Array.from(predictionsMap.values()).length;
  const pendingPredictions = totalMatches - submittedPredictions;

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'Predictions',
        subtitle: 'Submit and manage your match predictions',
      })}

      <!-- Stats -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-4">
          <div class="card ptw-card">
            <div class="card-body text-center">
              <div class="h2 mb-1 text-primary">${totalMatches}</div>
              <div class="ptw-text-muted">Total Matches</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card ptw-card">
            <div class="card-body text-center">
              <div class="h2 mb-1 text-success">${submittedPredictions}</div>
              <div class="ptw-text-muted">Submitted</div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-4">
          <div class="card ptw-card">
            <div class="card-body text-center">
              <div class="h2 mb-1 text-warning">${pendingPredictions}</div>
              <div class="ptw-text-muted">Pending</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Matches by Round -->
      ${orderedGroups.map((round) => `
        <div class="mb-4">
          <h3 class="h5 mb-3">${round}</h3>
          <div class="ptw-match-cards">
            ${grouped[round].map((match) => renderMatchCard({
            match,
            showPrediction: true,
            prediction: predictionsMap.get(match.id) || null,
            showResult: match.result?.published || false,
            showPoints: match.result?.published || false,
          })).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Attaches event handlers to predictions page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachPredictionsPageHandlers(outlet) {
  // Make prediction buttons
  outlet.querySelectorAll('[data-action="make-prediction"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const matchId = event.currentTarget.dataset.matchId;
      if (matchId) {
        window.history.pushState({}, '', `/predictions?action=create&matchId=${encodeURIComponent(matchId)}`);
        void render(outlet);
      }
    });
  });

  // Edit prediction buttons
  outlet.querySelectorAll('[data-action="edit-prediction"]').forEach((button) => {
    button.addEventListener('click', (event) => {
      const matchId = event.currentTarget.dataset.matchId;
      if (matchId) {
        window.history.pushState({}, '', `/predictions?action=edit&matchId=${encodeURIComponent(matchId)}`);
        void render(outlet);
      }
    });
  });
}

/**
 * Attaches form handlers.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachFormHandlers(outlet) {
  const form = outlet.querySelector('#prediction-form');

  if (!form || !currentMatch) {
    return;
  }

  const requireWinnerSelectionForDrawPrediction = TournamentConfigurationService.requireWinnerSelectionForDrawPrediction();

  attachPredictionFormHandlers(
    form,
    requireWinnerSelectionForDrawPrediction,
    async (payload) => {
      try {
        if (isEditing) {
          await updatePrediction(currentMatch.id, payload);
          showSuccessToast('Prediction updated successfully');
        } else {
          await submitPrediction(currentMatch.id, payload);
          showSuccessToast('Prediction submitted successfully');
        }

        // Navigate back
        window.history.pushState({}, '', '/predictions');
        void render(outlet);
      } catch (error) {
        Logger.error('[PredictionsPage] Submission failed:', error);
        throw error;
      }
    },
    () => {
      window.history.back();
    },
  );
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
        <div class="mt-3 ptw-text-muted">Loading predictions...</div>
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
        message: message || 'Failed to load predictions',
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}
