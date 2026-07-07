/**
 * @fileoverview Score page — contestant prediction history and results.
 * @module pages/score.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderStatisticCard } from '../components/statistic-card.component.js';
import { renderAdminListTabs } from '../components/admin-list-tabs.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getActiveTournament } from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { renderMatchCard } from '../match/match-card.component.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { PredictionDomain } from '../domain/prediction.domain.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction/history/prediction-history.constants.js';
import { Logger } from '../utils/logger.util.js';
import { isResultPublished } from '../domain/contestant-match-view.domain.js';

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

    // Filter completed/pending matches to only those the contestant predicted
    const completedMatches = matches.filter(
      (match) => isResultPublished(match) && predictionsMap.has(match.id),
    );
    const pendingMatches = matches.filter(
      (match) => !isResultPublished(match) && predictionsMap.has(match.id),
    );

    // Calculate statistics
    const totalPredictions = predictionsMap.size;
    const totalCompleted = completedMatches.length;
    let correctWinners = 0;
    let exactScores = 0;
    let totalPoints = 0;

    completedMatches.forEach((match) => {
      const prediction = predictionsMap.get(match.id);
      if (prediction) {
        const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
        if (PredictionDomain.isWinnerPredictionCorrect(prediction, result, match)) {
          correctWinners++;
        }
        if (checkExactScore(prediction, match)) {
          exactScores++;
        }
        totalPoints += Number(prediction.calculatedPoints ?? 0);
      }
    });

    const scoredPredictions = completedMatches.filter((match) => predictionsMap.has(match.id)).length;

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
        accuracy: scoredPredictions > 0 ? Math.round((correctWinners / scoredPredictions) * 100) : 0,
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

      <div class="d-flex justify-content-end mb-3">
        <a href="${PREDICTION_HISTORY_ROUTES.LIST}" class="btn btn-sm btn-outline-primary">
          <i class="bi bi-clock-history me-1" aria-hidden="true"></i>View Full History
        </a>
      </div>

      <!-- Statistics -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          ${renderStatisticCard({
            icon: 'bi-trophy',
            label: 'Total Points',
            value: stats.totalPoints,
          })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({
            icon: 'bi-check-circle',
            label: 'Correct Winners',
            value: stats.correctWinners,
            trend: `${stats.accuracy}% accuracy`,
            trendDirection: 'neutral',
          })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({
            icon: 'bi-bullseye',
            label: 'Exact Scores',
            value: stats.exactScores,
          })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({
            icon: 'bi-graph-up',
            label: 'Predictions',
            value: stats.totalPredictions,
            trend: `${stats.totalCompleted} completed`,
            trendDirection: 'neutral',
          })}
        </div>
      </div>

      ${renderAdminListTabs({
        groupId: 'ptw-score-tabs',
        activeTabId: 'completed',
        tabs: [
          {
            id: 'completed',
            label: 'Completed',
            count: completedMatches.length,
            contentHtml: renderScoreMatchTab(completedMatches, predictionsMap, {
              emptyTitle: 'No Completed Matches',
              emptyMessage: 'Results will appear here once matches are completed.',
              emptyIcon: 'bi-calendar-check',
              showResult: true,
              showPoints: true,
            }),
          },
          {
            id: 'pending',
            label: 'Pending',
            count: pendingMatches.length,
            contentHtml: renderScoreMatchTab(pendingMatches, predictionsMap, {
              emptyTitle: 'No Pending Matches',
              emptyMessage: 'All matches have been completed.',
              emptyIcon: 'bi-check-circle',
              showResult: false,
              showPoints: false,
            }),
          },
        ],
      })}
    </div>
  `;
}

/**
 * Renders match cards or empty state for a score page tab.
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {Map<string, Record<string, unknown>>} predictionsMap
 * @param {Object} options
 * @returns {string}
 */
function renderScoreMatchTab(matches, predictionsMap, options) {
  const {
    emptyTitle,
    emptyMessage,
    emptyIcon,
    showResult,
    showPoints,
  } = options;

  if (matches.length === 0) {
    return `
      <div class="card ptw-card">
        <div class="card-body">
          ${renderEmptyState({
            title: emptyTitle,
            message: emptyMessage,
            icon: emptyIcon,
          })}
        </div>
      </div>
    `;
  }

  return `
    <div class="ptw-match-cards">
      ${matches.map((match) => renderMatchCard({
        match,
        showPrediction: true,
        prediction: predictionsMap.get(match.id) || null,
        showResult,
        showPoints,
      })).join('')}
    </div>
  `;
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
