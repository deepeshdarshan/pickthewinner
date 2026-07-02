/**
 * @fileoverview Score page — contestant prediction history and results.
 * @module pages/score.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderStatisticCard } from '../components/statistic-card.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getActiveTournament } from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { renderMatchCard } from '../match/match-card.component.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { Logger } from '../utils/logger.util.js';

/**
 * Renders the score page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initScorePage(outlet);
}

/**
 * Initializes the score page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initScorePage(outlet) {
  outlet.innerHTML = renderLoadingState();
  showLoadingOverlay('Loading results...');

  try {
    const user = getCurrentUser();

    if (!user) {
      outlet.innerHTML = renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view your prediction results.',
        icon: 'bi-lock',
      });
      return;
    }

    const tournament = await getActiveTournament();

    if (!tournament) {
      outlet.innerHTML = `
        <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
          ${renderContestantPageHeader({
            title: 'My Score',
            subtitle: 'Your prediction results and points',
          })}
          ${renderEmptyState({
            title: 'No Active Tournament',
            message: 'There is no active tournament at this time.',
            icon: 'bi-calendar-x',
          })}
        </div>
      `;
      return;
    }

    const matches = await listMatchesForContestant({ tournamentId: tournament.id });

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

    // Filter completed matches
    const completedMatches = matches.filter((match) => match.result?.published);
    const pendingMatches = matches.filter((match) => !match.result?.published);

    // Calculate statistics
    const totalPredictions = predictionsMap.size;
    const totalCompleted = completedMatches.length;
    let correctWinners = 0;
    let exactScores = 0;
    let totalPoints = 0;

    completedMatches.forEach((match) => {
      const prediction = predictionsMap.get(match.id);
      if (prediction) {
        if (checkCorrectWinner(prediction, match)) {
          correctWinners++;
        }
        if (checkExactScore(prediction, match)) {
          exactScores++;
        }
        // TODO: Get actual points from scoring calculation
      }
    });

    outlet.innerHTML = renderScorePage({
      tournament,
      completedMatches,
      pendingMatches,
      predictionsMap,
      stats: {
        totalPredictions,
        totalCompleted,
        correctWinners,
        exactScores,
        totalPoints,
        accuracy: totalCompleted > 0 ? Math.round((correctWinners / totalCompleted) * 100) : 0,
      },
    });
    initializeCountdowns(outlet);
  } catch (error) {
    Logger.error('[ScorePage] Failed to load:', error);
    outlet.innerHTML = renderErrorState(error.message);
    showErrorToast('Failed to load results');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * Renders the score page.
 * @param {Object} options
 * @returns {string}
 */
function renderScorePage(options) {
  const { tournament, completedMatches, pendingMatches, predictionsMap, stats } = options;

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      ${renderContestantPageHeader({
        title: 'My Score',
        subtitle: `${tournament.name} ${tournament.season}`,
      })}

      <!-- Statistics -->
      <div class="row g-3 mb-4">
        ${renderStatisticCard({
          icon: 'bi-trophy',
          title: 'Total Points',
          value: stats.totalPoints,
          variant: 'primary',
        })}
        ${renderStatisticCard({
          icon: 'bi-check-circle',
          title: 'Correct Winners',
          value: stats.correctWinners,
          subtitle: `${stats.accuracy}% accuracy`,
          variant: 'success',
        })}
        ${renderStatisticCard({
          icon: 'bi-bullseye',
          title: 'Exact Scores',
          value: stats.exactScores,
          variant: 'info',
        })}
        ${renderStatisticCard({
          icon: 'bi-graph-up',
          title: 'Predictions',
          value: stats.totalPredictions,
          subtitle: `${stats.totalCompleted} completed`,
          variant: 'secondary',
        })}
      </div>

      <!-- Tabs -->
      <ul class="nav nav-tabs mb-3" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="completed-tab" data-bs-toggle="tab" data-bs-target="#completed" type="button" role="tab" aria-controls="completed" aria-selected="true">
            Completed (${completedMatches.length})
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="pending-tab" data-bs-toggle="tab" data-bs-target="#pending" type="button" role="tab" aria-controls="pending" aria-selected="false">
            Pending (${pendingMatches.length})
          </button>
        </li>
      </ul>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Completed Tab -->
        <div class="tab-pane fade show active" id="completed" role="tabpanel" aria-labelledby="completed-tab">
          ${completedMatches.length > 0 ? `
            ${completedMatches.map((match) => renderMatchCard({
              match,
              showPrediction: true,
              prediction: predictionsMap.get(match.id) || null,
              showResult: true,
              showPoints: true,
              pointsEarned: 0, // TODO: Get from scoring calculation
            })).join('')}
          ` : `
            <div class="card ptw-card">
              <div class="card-body">
                ${renderEmptyState({
                  title: 'No Completed Matches',
                  message: 'Results will appear here once matches are completed.',
                  icon: 'bi-calendar-check',
                })}
              </div>
            </div>
          `}
        </div>

        <!-- Pending Tab -->
        <div class="tab-pane fade" id="pending" role="tabpanel" aria-labelledby="pending-tab">
          ${pendingMatches.length > 0 ? `
            ${pendingMatches.map((match) => renderMatchCard({
              match,
              showPrediction: true,
              prediction: predictionsMap.get(match.id) || null,
              showResult: false,
              showPoints: false,
            })).join('')}
          ` : `
            <div class="card ptw-card">
              <div class="card-body">
                ${renderEmptyState({
                  title: 'No Pending Matches',
                  message: 'All matches have been completed.',
                  icon: 'bi-check-circle',
                })}
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Checks if winner prediction is correct.
 * @param {Record<string, unknown>} prediction
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function checkCorrectWinner(prediction, match) {
  if (!prediction || !match.result) {
    return false;
  }

  const predHome = Number(prediction.homeScore ?? 0);
  const predAway = Number(prediction.awayScore ?? 0);
  const actualHome = Number(match.result.homeScore ?? 0);
  const actualAway = Number(match.result.awayScore ?? 0);

  if (predHome > predAway && actualHome > actualAway) {
    return true;
  }

  if (predHome < predAway && actualHome < actualAway) {
    return true;
  }

  if (predHome === predAway && actualHome === actualAway) {
    return true;
  }

  return false;
}

/**
 * Checks if exact score prediction is correct.
 * @param {Record<string, unknown>} prediction
 * @param {import('../match/match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function checkExactScore(prediction, match) {
  if (!prediction || !match.result) {
    return false;
  }

  const predHome = Number(prediction.homeScore ?? 0);
  const predAway = Number(prediction.awayScore ?? 0);
  const actualHome = Number(match.result.homeScore ?? 0);
  const actualAway = Number(match.result.awayScore ?? 0);

  return predHome === actualHome && predAway === actualAway;
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
        <div class="mt-3 ptw-text-muted">Loading results...</div>
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
        message: message || 'Failed to load results',
        icon: 'bi-exclamation-triangle',
      })}
    </div>
  `;
}
