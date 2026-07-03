/**
 * @fileoverview Match-wise prediction view renderer.
 * @module prediction/admin/renderers/match-view.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';
import { renderTeamsMatchupHtml } from '../../../master-data/teams/team-flag.util.js';
import { renderMatchStatusBadge } from '../../../match/renderers/status-badge.renderer.js';
import { renderPredictionTable } from './list.renderer.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';

/**
 * @param {Record<string, unknown>} match
 * @returns {string}
 */
export function renderMatchHeader(match) {
  const stage = String(match.stage ?? match.round ?? '');
  const venue = String(match.venue ?? match.stadium ?? '');

  return `
    <div class="card ptw-card mb-3">
      <div class="card-body">
        <div class="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
              ${stage ? `<span class="badge bg-primary">${escapeHtml(stage)}</span>` : ''}
              ${renderMatchStatusBadge(match.status)}
            </div>
            <h2 class="h4 mb-2">${renderTeamsMatchupHtml(match.homeTeam, match.awayTeam)}</h2>
            <p class="text-muted mb-1">
              <i class="bi bi-calendar3 me-1" aria-hidden="true"></i>
              ${escapeHtml(formatDateTime(match.kickoffUtc) || '—')}
            </p>
            ${venue ? `<p class="text-muted mb-0"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${escapeHtml(venue)}</p>` : ''}
          </div>
          <div class="text-lg-end">
            <p class="small text-muted mb-1">Match #${escapeHtml(String(match.matchNumber ?? '—'))}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {import('../PredictionStatisticsService.js').MatchStatistics} stats
 * @returns {string}
 */
export function renderMatchStatisticsPanel(match, stats) {
  return `
    <div class="row g-3 mb-3">
      <div class="col-md-3">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <p class="small text-muted mb-1">Total Predictions</p>
            <p class="h4 mb-0">${escapeHtml(String(stats.totalPredictions))}</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <p class="small text-muted mb-1">Completion</p>
            <p class="h4 mb-0">${escapeHtml(String(stats.completionPercent))}%</p>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <p class="small text-muted mb-1">Most Predicted Winner</p>
            <p class="h6 mb-0">${escapeHtml(stats.mostPredictedTeam ?? '—')}</p>
            ${stats.mostPredictedTeam ? `<p class="small text-muted mb-0">${escapeHtml(String(stats.mostPredictedTeamPercent))}%</p>` : ''}
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card ptw-card h-100">
          <div class="card-body">
            <p class="small text-muted mb-1">Most Predicted Score</p>
            <p class="h6 mb-0">${escapeHtml(stats.mostPredictedScore ?? '—')}</p>
            ${stats.mostPredictedScore ? `<p class="small text-muted mb-0">${escapeHtml(String(stats.mostPredictedScorePercent))}%</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @param {Object} tableOptions
 * @param {import('../PredictionStatisticsService.js').MatchStatistics} [stats]
 * @returns {string}
 */
export function renderMatchWiseView(match, predictions, tableOptions = {}, stats = null) {
  return `
    <section aria-label="Match-wise predictions">
      ${renderMatchHeader(match)}
      ${stats ? renderMatchStatisticsPanel(match, stats) : ''}
      <div class="card ptw-card">
        <div class="card-header">
          <h3 class="h5 mb-0">Contestant Predictions</h3>
        </div>
        <div class="card-body p-0">
          ${renderPredictionTable(predictions, tableOptions)}
        </div>
      </div>
    </section>
  `;
}

/**
 * Compact list for match-wise mobile summary.
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @returns {string}
 */
export function renderMatchWiseCompactList(predictions) {
  return predictions.map((prediction) => {
    const contestant = prediction.contestant ?? {};
    const name = String(contestant.displayName ?? contestant.fullName ?? 'Unknown');

    return `
      <div class="border-bottom border-secondary py-3">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 28 })}
          <strong>${escapeHtml(name)}</strong>
        </div>
        <p class="mb-1"><span class="text-muted">Prediction:</span> ${escapeHtml(`${prediction.homeScore} - ${prediction.awayScore}`)}</p>
        ${prediction.predictedWinnerName ? `<p class="mb-1"><span class="text-muted">Winner:</span> ${escapeHtml(prediction.predictedWinnerName)}</p>` : ''}
        <p class="small text-muted mb-0">Submitted ${escapeHtml(formatDateTime(prediction.submittedAt) || '—')}</p>
      </div>
    `;
  }).join('');
}
