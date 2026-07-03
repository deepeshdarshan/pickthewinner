/**
 * @fileoverview Mobile prediction card renderer for admin views.
 * @module prediction/admin/renderers/prediction-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { renderPredictionStatusBadge, renderResultBadge } from './prediction-status-badge.renderer.js';

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @param {boolean} [showResults]
 * @returns {string}
 */
export function renderPredictionCard(prediction, showResults = false) {
  const contestant = prediction.contestant ?? {};
  const match = prediction.match ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const hasResult = Boolean(result.published);
  const contestantName = String(contestant.displayName ?? contestant.fullName ?? contestant.email ?? 'Unknown');
  const score = `${prediction.homeScore} - ${prediction.awayScore}`;

  return `
    <article class="card ptw-card ptw-prediction-card mb-3" data-prediction-id="${escapeHtml(prediction.id)}" tabindex="0" role="button" aria-label="View prediction by ${escapeHtml(contestantName)}">
      <div class="card-body">
        <div class="d-flex align-items-center gap-2 mb-2">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 36 })}
          <div class="flex-grow-1 min-w-0">
            <h3 class="h6 mb-0 text-truncate">${escapeHtml(contestantName)}</h3>
            <p class="small text-muted mb-0 text-truncate">${escapeHtml(String(contestant.email ?? ''))}</p>
          </div>
          ${renderPredictionStatusBadge(prediction.displayStatus ?? prediction.status)}
        </div>

        <div class="mb-2">
          <p class="small text-muted mb-1">Match</p>
          <p class="mb-0 d-flex flex-wrap align-items-center gap-1">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
            <span class="text-muted">vs</span>
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
          </p>
        </div>

        <div class="row g-2">
          <div class="col-6">
            <p class="small text-muted mb-1">Predicted Score</p>
            <p class="mb-0 fw-semibold">${escapeHtml(score)}</p>
          </div>
          <div class="col-6">
            <p class="small text-muted mb-1">Predicted Winner</p>
            <p class="mb-0">${escapeHtml(prediction.predictedWinnerName ?? '—')}</p>
          </div>
        </div>

        <p class="small text-muted mt-2 mb-0">
          Submitted ${escapeHtml(formatDateTime(prediction.submittedAt) || '—')}
        </p>

        ${showResults && hasResult ? `
          <hr class="border-secondary">
          <div class="row g-2">
            <div class="col-6">
              <p class="small text-muted mb-1">Actual Score</p>
              <p class="mb-0">${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</p>
            </div>
            <div class="col-6">
              <p class="small text-muted mb-1">Points</p>
              <p class="mb-0 fw-semibold">${escapeHtml(String(prediction.calculatedPoints ?? 0))}</p>
            </div>
            <div class="col-6">
              <p class="small text-muted mb-1">Winner</p>
              ${renderResultBadge(prediction.winnerPredictionCorrect)}
            </div>
            <div class="col-6">
              <p class="small text-muted mb-1">Exact Score</p>
              ${renderResultBadge(prediction.exactScoreCorrect)}
            </div>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction[]} predictions
 * @param {boolean} [showResults]
 * @returns {string}
 */
export function renderPredictionCardList(predictions, showResults = false) {
  return predictions.map((prediction) => renderPredictionCard(prediction, showResults)).join('');
}
