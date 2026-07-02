/**
 * @fileoverview Contestant and administrator dashboard page.
 * @module pages/dashboard.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { renderEmptyState } from '../components/empty-state.component.js';
import { renderStatisticCard } from '../components/statistic-card.component.js';
import { renderCompactMatchCard } from '../match/match-card.component.js';
import { renderCompactTournamentCard } from '../components/tournament-card.component.js';
import { USER_ROLES } from '../users/user.constants.js';
import { AdminDashboardService } from '../dashboard/AdminDashboardService.js';
import { ContestantDashboardService } from '../dashboard/ContestantDashboardService.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * Renders the dashboard page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initDashboard(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initDashboard(outlet) {
  const adminData = await AdminDashboardService.getDashboardData();
  const isAdmin = adminData.role === USER_ROLES.ADMIN;

  if (isAdmin) {
    outlet.innerHTML = renderAdminDashboard(adminData);
    return;
  }

  const contestantData = await ContestantDashboardService.getDashboardData();
  outlet.innerHTML = renderContestantDashboard(contestantData);
}

/**
 * @param {import('../dashboard/ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderContestantDashboard(data) {
  if (!data.hasActiveTournaments) {
    return renderEmptyDashboard(data);
  }

  const leaderboardCard = data.leaderboardVisible
    ? renderLeaderboardSummaryCard(data)
    : renderLeaderboardPendingCard(data);

  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: data.welcomeMessage,
      })}

      <!-- Active Tournament Stats -->
      ${data.activeTournament ? `
        <div class="card ptw-card mb-4">
          <div class="card-header">
            <h2 class="h5 mb-0">
              <i class="bi bi-trophy me-2" aria-hidden="true"></i>
              ${escapeHtml(data.activeTournament.name)} ${escapeHtml(data.activeTournament.season)}
            </h2>
          </div>
          <div class="card-body">
            <div class="row g-3">
              ${renderStatisticCard({
                icon: 'bi-bullseye',
                title: 'Total Matches',
                value: data.predictionStats.total,
                variant: 'primary',
              })}
              ${renderStatisticCard({
                icon: 'bi-check-circle',
                title: 'Submitted',
                value: data.predictionStats.submitted,
                variant: 'success',
              })}
              ${renderStatisticCard({
                icon: 'bi-clock',
                title: 'Pending',
                value: data.predictionStats.pending,
                variant: 'warning',
              })}
              ${data.leaderboardVisible ? renderStatisticCard({
                icon: 'bi-trophy',
                title: 'Points',
                value: 0, // TODO: Get actual points
                variant: 'info',
              }) : ''}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="row g-3 mb-4">
        <div class="col-12 col-md-6">
          <div class="card ptw-card h-100">
            <div class="card-body text-center">
              <i class="bi bi-bullseye display-4 text-primary mb-3" aria-hidden="true"></i>
              <h3 class="h5 mb-2">Make Predictions</h3>
              <p class="ptw-text-muted mb-3">Submit your predictions for upcoming matches</p>
              <a href="/predictions" class="btn btn-ptw-primary" data-route>
                <i class="bi bi-arrow-right me-2" aria-hidden="true"></i>Go to Predictions
              </a>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="card ptw-card h-100">
            <div class="card-body text-center">
              <i class="bi bi-flag display-4 text-success mb-3" aria-hidden="true"></i>
              <h3 class="h5 mb-2">View Matches</h3>
              <p class="ptw-text-muted mb-3">See all published matches and results</p>
              <a href="/matches" class="btn btn-outline-primary" data-route>
                <i class="bi bi-arrow-right me-2" aria-hidden="true"></i>View Matches
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Matches -->
      ${data.upcomingMatches.length > 0 ? `
        <div class="card ptw-card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h2 class="h5 mb-0">
              <i class="bi bi-calendar-event me-2" aria-hidden="true"></i>
              Upcoming Matches
            </h2>
            <a href="/matches" class="btn btn-sm btn-outline-primary" data-route>View All</a>
          </div>
          <div class="card-body">
            ${data.upcomingMatches.slice(0, 3).map((match) => renderCompactMatchCard(match, null)).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Leaderboard -->
      <div class="row g-3">
        <div class="col-12 col-lg-6">
          ${leaderboardCard}
        </div>
        
        <!-- Tournaments -->
        <div class="col-12 col-lg-6">
          <div class="card ptw-card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h2 class="h5 mb-0">
                <i class="bi bi-trophy me-2" aria-hidden="true"></i>
                Tournaments
              </h2>
              <a href="/tournaments" class="btn btn-sm btn-outline-primary" data-route>View All</a>
            </div>
            <div class="card-body">
              ${data.tournaments.slice(0, 3).map((tournament) => renderCompactTournamentCard(tournament)).join('')}
              ${data.tournaments.length === 0 ? '<p class="ptw-text-muted mb-0">No tournaments available</p>' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders empty dashboard for contestants with no tournaments.
 * @param {import('../dashboard/ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderEmptyDashboard(data) {
  const leaderboardCard = data.leaderboardVisible
    ? renderLeaderboardSummaryCard(data)
    : renderLeaderboardPendingCard(data);

  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: 'Your predictions and upcoming matches',
      })}
      <div class="row g-3 mb-4">
        <div class="col-12 col-lg-6">
          ${leaderboardCard}
        </div>
      </div>
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">${data.welcomeMessage}</h2>
            <p class="ptw-text-muted mb-0">There are currently no active tournaments.</p>
          </div>
          ${renderEmptyState({
            title: data.emptyStateTitle,
            message: data.emptyStateMessage,
            icon: 'bi-calendar-event',
          })}
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import('../dashboard/ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderLeaderboardPendingCard(data) {
  return `
    <div class="card ptw-card h-100">
      <div class="card-header">
        <h2 class="h6 mb-0">Leaderboard</h2>
      </div>
      <div class="card-body">
        <p class="ptw-text-muted mb-0">${escapeHtml(data.leaderboardPendingMessage)}</p>
      </div>
    </div>
  `;
}

/**
 * @param {import('../dashboard/ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
function renderLeaderboardSummaryCard(data) {
  return `
    <div class="card ptw-card h-100">
      <div class="card-header d-flex justify-content-between align-items-center gap-2">
        <h2 class="h6 mb-0">Leaderboard</h2>
        <a class="btn btn-sm btn-outline-primary" href="${escapeHtml(data.leaderboardPath)}" data-route>
          View Full Leaderboard
        </a>
      </div>
      <div class="card-body">
        <p class="ptw-text-muted mb-0">Tournament rankings will appear here once scoring begins.</p>
      </div>
    </div>
  `;
}

/**
 * @param {import('../dashboard/AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
function renderAdminDashboard(data) {
  return `
    <div class="container-fluid px-3 px-lg-4 ptw-page-content">
      ${renderPageHeader({
        title: 'Dashboard',
        subtitle: 'Tournament administration overview',
      })}
      <div class="card ptw-card">
        <div class="card-body">
          <div class="ptw-dashboard-welcome mb-4">
            <h2 class="h4 mb-1">${escapeHtml(data.welcomeTitle)}</h2>
            <p class="ptw-text-muted mb-0">${escapeHtml(data.welcomeMessage)}</p>
          </div>
          ${renderEmptyState({
            title: data.emptyStateTitle,
            message: data.emptyStateMessage,
            icon: 'bi-calendar-plus',
            actionHtml: `<a class="btn btn-ptw-primary" href="${escapeHtml(data.adminConsolePath)}" data-route><i class="bi bi-plus-circle me-2" aria-hidden="true"></i>Go to Admin Console</a>`,
          })}
        </div>
      </div>
    </div>
  `;
}
