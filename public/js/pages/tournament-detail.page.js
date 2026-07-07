/**
 * @fileoverview Tournament detail page with match listing for contestants.
 * @module pages/tournament-detail.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { renderContestantPageHeader } from '../components/page-header.component.js';
import { CONTESTANT_PAGE_SHELL_CLASSES } from '../components/contestant-page-shell.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderStatisticCard } from '../components/statistic-card.component.js';
import { renderMatchCard } from '../match/match-card.component.js';
import { initializeCountdowns } from '../components/countdown.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getTournamentById } from '../tournament/tournament.service.js';
import { listMatchesForContestant } from '../match/match.service.js';
import { getPredictionForUser } from '../prediction/prediction.service.js';
import { escapeHtml } from '../utils/html.util.js';
import { Logger } from '../utils/logger.util.js';
import { getRoundLabel } from '../match/match.constants.js';
import { shouldShowOnTournamentDetail } from '../domain/contestant-match-view.domain.js';

/** @type {ReadonlyArray<string>} */
const ROUND_ORDER = Object.freeze([
  'Group Stage',
  'Round of 16',
  'Quarter Finals',
  'Semi Finals',
  'Final',
  'Other',
]);

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
      outlet.innerHTML = renderShellWrapper(renderEmptyState({
        title: 'Authentication Required',
        message: 'Please sign in to view tournament details.',
        icon: 'bi-lock',
      }));
      return;
    }

    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      outlet.innerHTML = renderShellWrapper(renderErrorState('Tournament not found'));
      showErrorToast('Tournament not found');
      return;
    }

    const allMatches = await listMatchesForContestant();
    const matches = allMatches.filter((m) => m.tournamentId === tournamentId);

    if (matches.length === 0) {
      outlet.innerHTML = renderTournamentDetailPage(tournament, matches, new Map());
      return;
    }

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

    const visibleMatches = matches.filter((match) => shouldShowOnTournamentDetail(
      match,
      predictionsMap.get(match.id) ?? null,
    ));

    outlet.innerHTML = renderTournamentDetailPage(tournament, visibleMatches, predictionsMap);
    attachEventHandlers(outlet);
    initializeCountdowns(outlet);
  } catch (error) {
    Logger.error('[TournamentDetailPage] Failed to load:', error);
    outlet.innerHTML = renderShellWrapper(renderErrorState(error.message));
    showErrorToast('Failed to load tournament details');
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @param {import('../match/match.service.js').EnrichedMatch[]} matches
 * @param {Map<string, Record<string, unknown>>} predictionsMap
 * @returns {string}
 */
function renderTournamentDetailPage(tournament, matches, predictionsMap) {
  const grouped = matches.reduce((acc, match) => {
    const round = match.round ? getRoundLabel(match.round) : 'Other';
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(match);
    return acc;
  }, {});

  const availableRounds = ROUND_ORDER.filter((round) => grouped[round]);
  const totalMatches = matches.length;
  const submittedPredictions = matches.filter((match) => predictionsMap.has(match.id)).length;
  const pendingPredictions = Math.max(totalMatches - submittedPredictions, 0);
  const completedMatches = matches.filter((m) => m.result?.published).length;
  const completionPercentage = totalMatches > 0 ? Math.round((submittedPredictions / totalMatches) * 100) : 0;

  const filterChips = availableRounds.length > 1 ? `
    <div class="ptw-round-filters d-flex flex-wrap gap-2 mb-4" role="toolbar" aria-label="Filter matches by round">
      <button type="button" class="btn btn-sm btn-ptw-primary ptw-round-filter active" data-round-filter="all">All</button>
      ${availableRounds.map((round) => `
        <button type="button" class="btn btn-sm btn-outline-light ptw-round-filter" data-round-filter="${escapeHtml(round)}">
          ${escapeHtml(round)}
        </button>
      `).join('')}
    </div>
  ` : '';

  const matchSections = availableRounds.map((round) => `
    <section class="mb-4 ptw-round-section" data-round-section="${escapeHtml(round)}">
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
  })).join('')}
      </div>
    </section>
  `).join('');

  const matchesBody = matches.length === 0
    ? renderEmptyState({
      title: 'No Matches Available',
      message: 'The tournament administrator has not published any matches yet. Check back later!',
      icon: 'bi-calendar-x',
    })
    : `${filterChips}${matchSections}`;

  return `
    <div class="${CONTESTANT_PAGE_SHELL_CLASSES}">
      <a class="btn btn-outline-light mb-3" href="/tournaments" data-route>
        <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>Back to Tournaments
      </a>

      ${renderContestantPageHeader({
    title: tournament.name,
    subtitle: tournament.season || 'Tournament details and matches',
  })}

      <div class="card ptw-card mb-4 overflow-hidden">
        ${tournament.banner ? `
          <div class="ptw-tournament-detail-banner" style="background-image: url('${escapeHtml(tournament.banner)}');"></div>
        ` : ''}
        <div class="card-body">
          <div class="d-flex align-items-start mb-3 gap-3">
            ${tournament.logo ? `
              <img src="${escapeHtml(tournament.logo)}" alt="" class="ptw-tournament-detail-logo">
            ` : ''}
            <div class="flex-grow-1">
              <p class="ptw-text-muted mb-0">${escapeHtml(tournament.description ?? '')}</p>
            </div>
          </div>
          ${totalMatches > 0 ? `
            <div class="mt-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="ptw-text-muted">Prediction Progress</small>
                <small class="text-primary fw-bold">${submittedPredictions} / ${totalMatches}</small>
              </div>
              <div class="progress" style="height: 8px;">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${completionPercentage}%;" aria-valuenow="${completionPercentage}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          ${renderStatisticCard({ label: 'Total Matches', value: totalMatches, icon: 'bi-bullseye' })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({ label: 'Submitted', value: submittedPredictions, icon: 'bi-check-circle' })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({ label: 'Pending', value: pendingPredictions, icon: 'bi-clock' })}
        </div>
        <div class="col-6 col-md-3">
          ${renderStatisticCard({ label: 'Completed', value: completedMatches, icon: 'bi-flag-fill' })}
        </div>
      </div>

      ${matchesBody}
    </div>
  `;
}

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function attachEventHandlers(outlet) {
  outlet.querySelectorAll('.ptw-round-filter').forEach((button) => {
    button.addEventListener('click', () => {
      const selectedRound = button.getAttribute('data-round-filter');
      outlet.querySelectorAll('.ptw-round-filter').forEach((chip) => {
        chip.classList.toggle('active', chip === button);
        chip.classList.toggle('btn-ptw-primary', chip === button);
        chip.classList.toggle('btn-outline-light', chip !== button);
      });

      outlet.querySelectorAll('.ptw-round-section').forEach((section) => {
        const round = section.getAttribute('data-round-section');
        const show = selectedRound === 'all' || round === selectedRound;
        section.classList.toggle('d-none', !show);
      });
    });
  });
}

/**
 * @param {string} innerHtml
 * @returns {string}
 */
function renderShellWrapper(innerHtml) {
  return `<div class="${CONTESTANT_PAGE_SHELL_CLASSES}">${innerHtml}</div>`;
}

/**
 * @returns {string}
 */
function renderLoadingState() {
  return renderShellWrapper(`
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="mt-3 ptw-text-muted">Loading tournament...</div>
    </div>
  `);
}

/**
 * @param {string} message
 * @returns {string}
 */
function renderErrorState(message) {
  return renderEmptyState({
    title: 'Error',
    message: message || 'Failed to load tournament details',
    icon: 'bi-exclamation-triangle',
  });
}
