/**
 * @fileoverview Summary statistics renderers for prediction history.
 * @module prediction/history/renderers/prediction-history-statistics.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { renderStatisticCardGrid } from '../../../components/statistic-card.component.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').OverallStatistics} OverallStatistics
 * @typedef {import('../../../domain/prediction-history.domain.js').TournamentSummary} TournamentSummary
 * @typedef {import('../../../domain/prediction-history.domain.js').StageStatistics} StageStatistics
 */

/**
 * @param {OverallStatistics} stats
 * @returns {string}
 */
export function renderSummaryCards(stats) {
  return renderStatisticCardGrid([
    {
      label: 'Total Predictions',
      value: stats.predictionsSubmitted,
      icon: 'bi-bullseye text-primary',
      trend: stats.predictionsCompleted > 0 ? `${stats.predictionsCompleted} completed` : '',
      trendDirection: 'neutral',
    },
    {
      label: 'Correct Winners',
      value: stats.correctWinners,
      icon: 'bi-check-circle text-success',
      trend: stats.predictionsCompleted > 0 ? `${stats.accuracy}%` : '',
      trendDirection: 'up',
    },
    {
      label: 'Exact Scores',
      value: stats.exactScores,
      icon: 'bi-bullseye text-info',
      trend: stats.predictionsCompleted > 0
        ? `${Math.round((stats.exactScores / stats.predictionsCompleted) * 100)}%`
        : '',
      trendDirection: 'neutral',
    },
    {
      label: 'Bonus Points',
      value: stats.bonusPoints,
      icon: 'bi-star text-warning',
      trend: 'Total earned',
      trendDirection: 'neutral',
    },
    {
      label: 'Total Points',
      value: stats.totalPoints,
      icon: 'bi-trophy text-primary',
    },
    {
      label: 'Overall Accuracy',
      value: `${stats.accuracy}%`,
      icon: 'bi-graph-up text-success',
    },
  ]);
}

/**
 * @param {OverallStatistics} stats
 * @returns {string}
 */
export function renderAccuracyDonut(stats) {
  const completed = stats.predictionsCompleted;
  const correctWinners = stats.correctWinners;
  const exactScores = stats.exactScores;
  const incorrect = Math.max(0, completed - correctWinners);

  const winnerOnly = Math.max(0, correctWinners - exactScores);
  const winnerPct = completed > 0 ? (winnerOnly / completed) * 100 : 0;
  const exactPct = completed > 0 ? (exactScores / completed) * 100 : 0;
  const incorrectPct = completed > 0 ? (incorrect / completed) * 100 : 0;

  const gradient = completed > 0
    ? `conic-gradient(
        var(--ptw-color-success) 0% ${winnerPct + exactPct}%,
        var(--ptw-color-primary-blue) ${winnerPct + exactPct}% ${winnerPct + exactPct + exactPct}%,
        var(--ptw-color-danger) ${winnerPct + exactPct}% 100%
      )`
    : 'conic-gradient(var(--ptw-color-border) 0% 100%)';

  return `
    <section class="card ptw-card mb-3" aria-labelledby="ptw-accuracy-donut-heading">
      <div class="card-header">
        <h2 class="h6 mb-0" id="ptw-accuracy-donut-heading">Performance Overview</h2>
      </div>
      <div class="card-body text-center">
        <div class="ptw-accuracy-donut mx-auto mb-3" style="background: ${gradient}" role="img" aria-label="Accuracy breakdown chart">
          <div class="ptw-accuracy-donut__inner">
            <span class="fw-bold">${stats.accuracy}%</span>
            <small class="d-block text-muted">Overall</small>
          </div>
        </div>
        <ul class="list-unstyled small text-start mb-0">
          <li class="d-flex justify-content-between py-1"><span><span class="ptw-legend-dot bg-success"></span> Correct Winners</span><span>${correctWinners}</span></li>
          <li class="d-flex justify-content-between py-1"><span><span class="ptw-legend-dot bg-primary"></span> Exact Scores</span><span>${exactScores}</span></li>
          <li class="d-flex justify-content-between py-1"><span><span class="ptw-legend-dot bg-danger"></span> Incorrect</span><span>${incorrect}</span></li>
        </ul>
        <a href="/statistics" class="btn btn-sm btn-link mt-2">View Detailed Statistics</a>
      </div>
    </section>
  `;
}

/**
 * @param {TournamentSummary[]} summaries
 * @returns {string}
 */
export function renderTournamentPerformanceList(summaries) {
  if (summaries.length === 0) {
    return '<p class="text-muted mb-0">No tournament data yet.</p>';
  }

  const items = summaries.slice(0, 5).map((summary) => `
    <li class="ptw-tournament-performance__item py-2">
      <div class="d-flex justify-content-between align-items-start gap-2">
        <div class="min-w-0">
          <p class="fw-semibold mb-0 text-truncate">${escapeHtml(summary.tournamentName)}</p>
          <small class="text-muted">${escapeHtml(summary.status || 'Tournament')}</small>
        </div>
        ${summary.rank ? `<span class="badge bg-secondary">#${summary.rank}</span>` : ''}
      </div>
      <div class="d-flex flex-wrap gap-3 small text-muted mt-1">
        <span>${summary.matchesPredicted} predictions</span>
        <span>${summary.accuracy}% accuracy</span>
        <span>${summary.pointsEarned} pts</span>
      </div>
    </li>
  `).join('');

  return `
    <section class="card ptw-card mb-3" aria-labelledby="ptw-tournament-performance-heading">
      <div class="card-header">
        <h2 class="h6 mb-0" id="ptw-tournament-performance-heading">Tournament Performance</h2>
      </div>
      <div class="card-body">
        <ul class="list-unstyled mb-0 ptw-tournament-performance__list">${items}</ul>
      </div>
    </section>
  `;
}

/**
 * @param {StageStatistics[]} stageStats
 * @returns {string}
 */
export function renderStageStatistics(stageStats) {
  if (stageStats.length === 0) {
    return '';
  }

  const rows = stageStats.map((stage) => `
    <tr>
      <th scope="row">${escapeHtml(stage.stage)}</th>
      <td>${stage.predictions}</td>
      <td>${stage.correctWinners}</td>
      <td>${stage.exactScores}</td>
      <td>${stage.accuracy}%</td>
    </tr>
  `).join('');

  return `
    <section class="card ptw-card mb-3" aria-labelledby="ptw-stage-stats-heading">
      <div class="card-header">
        <h2 class="h6 mb-0" id="ptw-stage-stats-heading">Stage Statistics</h2>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-sm mb-0 ptw-table ptw-table--compact">
            <thead>
              <tr>
                <th scope="col">Stage</th>
                <th scope="col">Predictions</th>
                <th scope="col">Winners</th>
                <th scope="col">Exact</th>
                <th scope="col">Accuracy</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

/**
 * @param {OverallStatistics} overallStats
 * @param {TournamentSummary[]} tournamentSummaries
 * @param {StageStatistics[]} stageStats
 * @returns {string}
 */
export function renderHistorySidebar(overallStats, tournamentSummaries, stageStats) {
  return `
    <aside class="ptw-prediction-history__sidebar" aria-label="Prediction analytics">
      ${renderAccuracyDonut(overallStats)}
      ${renderTournamentPerformanceList(tournamentSummaries)}
      ${renderStageStatistics(stageStats)}
      <section class="card ptw-card ptw-cta-card">
        <div class="card-body">
          <h2 class="h6">Improve Your Accuracy</h2>
          <p class="small text-muted mb-2">Keep predicting to climb the leaderboard.</p>
          <a href="/leaderboard" class="btn btn-sm btn-outline-primary">View Leaderboard</a>
        </div>
      </section>
    </aside>
  `;
}
