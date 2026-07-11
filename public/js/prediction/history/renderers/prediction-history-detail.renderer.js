/**
 * @fileoverview Detail view renderer for a single prediction.
 * @module prediction/history/renderers/prediction-history-detail.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, formatDateTime, toDate } from '../../../utils/date.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { renderPredictionStatusBadge } from '../../admin/renderers/prediction-status-badge.renderer.js';
import { renderPredictionComparisonPanel } from './prediction-comparison.renderer.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction-history.constants.js';
import { resolveLockMinutes, resolvePredictionLockState } from '../../../domain/prediction-history.domain.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 * @typedef {import('../../../domain/prediction-history.domain.js').LifecycleStep} LifecycleStep
 */

/**
 * @param {HistoryItem} item
 * @param {LifecycleStep[]} lifecycle
 * @param {{ backHref?: string, backLabel?: string }} [context]
 * @returns {string}
 */
export function renderPredictionDetail(item, lifecycle, context = {}) {
  const backHref = context.backHref ?? PREDICTION_HISTORY_ROUTES.LIST;
  const backLabel = context.backLabel ?? 'Back to History';
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');

  return `
    <div class="ptw-prediction-detail">
      <div class="mb-3">
        <a href="${escapeHtml(backHref)}" class="btn btn-sm btn-link ps-0" data-ph-back>
          <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>${escapeHtml(backLabel)}
        </a>
      </div>

      <div class="card ptw-card mb-3">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h1 class="h4 mb-1">${escapeHtml(tournamentName)}</h1>
              <p class="text-muted mb-1">${escapeHtml(stage)} · ${escapeHtml(kickoffLabel)}</p>
              <div class="d-flex flex-wrap align-items-center gap-2">
                ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
                <span class="text-muted">vs</span>
                ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
              </div>
            </div>
            <div>${renderPredictionStatusBadge(item.displayStatus ?? item.status)}</div>
          </div>
        </div>
      </div>

      <div class="card ptw-card mb-3">
        <div class="card-header"><h2 class="h5 mb-0">Prediction vs Result</h2></div>
        <div class="card-body">${renderPredictionComparisonPanel(item)}</div>
      </div>

      <div class="row g-3">
        <div class="col-lg-6">
          <div class="card ptw-card h-100">
            <div class="card-header"><h2 class="h6 mb-0">Match Timeline</h2></div>
            <div class="card-body">${renderLifecycleTimeline(lifecycle)}</div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card ptw-card h-100">
            <div class="card-header"><h2 class="h6 mb-0">Prediction Metadata</h2></div>
            <div class="card-body">${renderMetadata(item)}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {LifecycleStep[]} lifecycle
 * @returns {string}
 */
function renderLifecycleTimeline(lifecycle) {
  return `
    <ol class="list-unstyled mb-0 ptw-lifecycle-timeline">
      ${lifecycle.map((step, index) => `
        <li class="ptw-lifecycle-timeline__step ${step.completed ? 'is-complete' : ''} ${step.current ? 'is-current' : ''}">
          <div class="ptw-lifecycle-timeline__marker" aria-hidden="true">
            <i class="bi ${step.completed ? 'bi-check-circle-fill' : 'bi-circle'}"></i>
          </div>
          <div class="ptw-lifecycle-timeline__content">
            <p class="mb-0 fw-semibold">${escapeHtml(step.label)}</p>
            <p class="mb-0 ptw-lifecycle-timeline__timestamp">${escapeHtml(formatLifecycleTimestamp(step))}</p>
          </div>
          ${index < lifecycle.length - 1 ? '<div class="ptw-lifecycle-timeline__connector" aria-hidden="true"></div>' : ''}
        </li>
      `).join('')}
    </ol>
  `;
}

/**
 * @param {LifecycleStep} step
 * @returns {string}
 */
function formatLifecycleTimestamp(step) {
  if (!step.completed || !step.timestamp) {
    return '—';
  }

  return formatDateTime(step.timestamp) || '—';
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderMetadata(item) {
  const match = item.match ?? {};
  const lockMinutes = resolveLockMinutes(item.tournament);
  const lockState = resolvePredictionLockState(item, match, new Date(), { lockMinutes });

  return `
    <dl class="row mb-0 small">
      <dt class="col-sm-5">Submitted</dt>
      <dd class="col-sm-7">${escapeHtml(formatDateTime(item.submittedAt) || '—')}</dd>
      <dt class="col-sm-5">Last Updated</dt>
      <dd class="col-sm-7">${escapeHtml(formatDateTime(item.updatedAt) || '—')}</dd>
      <dt class="col-sm-5">Locked</dt>
      <dd class="col-sm-7">${lockState.locked ? 'Yes' : 'No'}</dd>
      <dt class="col-sm-5">Scored</dt>
      <dd class="col-sm-7">${item.scored ? 'Yes' : 'No'}</dd>
      <dt class="col-sm-5">Match ID</dt>
      <dd class="col-sm-7"><code>${escapeHtml(String(item.matchId ?? ''))}</code></dd>
      <dt class="col-sm-5">Prediction ID</dt>
      <dd class="col-sm-7"><code>${escapeHtml(String(item.id ?? ''))}</code></dd>
    </dl>
  `;
}
