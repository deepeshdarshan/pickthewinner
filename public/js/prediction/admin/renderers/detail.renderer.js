/**
 * @fileoverview Prediction detail panel/modal renderer.
 * @module prediction/admin/renderers/detail.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateTime } from '../../../utils/date.util.js';
import { renderAvatar } from '../../../shared/avatar/avatar.component.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { PredictionDomain } from '../../../domain/prediction.domain.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';
import { renderPredictionStatusBadge, renderResultBadges } from './prediction-status-badge.renderer.js';
import { renderModal } from '../../../components/modal-wrapper.component.js';
import {
  resolveContestantDisplayName,
  renderPredictedWinnerHtml,
} from './prediction-display.renderer.js';

const DETAIL_MODAL_ID = 'predictionDetailModal';

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictionDetailBody(prediction) {
  const contestant = prediction.contestant ?? {};
  const match = prediction.match ?? {};
  const tournament = prediction.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const hasResult = Boolean(result.published);
  const contestantName = resolveContestantDisplayName(contestant);
  const breakdown = /** @type {Array<{ label: string, points: number, correct: boolean }>} */ (
    prediction.scoringBreakdown ?? []
  );

  const winnerName = hasResult
    ? PredictionDomain.resolveResultWinnerName(result, match)
    : null;
  const resultBadges = hasResult
    ? PredictionManagementDomain.resolveResultBadges(prediction)
    : [];

  return `
    <div class="row g-4">
      <div class="col-md-6">
        <h3 class="h6 text-muted text-uppercase">Contestant</h3>
        <div class="d-flex align-items-center gap-3 mb-3">
          ${renderAvatar({ photoURL: String(contestant.photoURL ?? ''), size: 48 })}
          <div>
            <p class="mb-0">${escapeHtml(contestantName)}</p>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <h3 class="h6 text-muted text-uppercase">Match Information</h3>
        <dl class="row mb-0 small">
          <dt class="col-5 fw-normal">Tournament</dt>
          <dd class="col-7">${escapeHtml(String(tournament.name ?? ''))}</dd>
          <dt class="col-5 fw-normal">Match #</dt>
          <dd class="col-7">${escapeHtml(String(match.matchNumber ?? '—'))}</dd>
          <dt class="col-5 fw-normal">Kickoff</dt>
          <dd class="col-7">${escapeHtml(formatDateTime(match.kickoffUtc) || '—')}</dd>
        </dl>
      </div>

      <div class="col-12"><hr class="border-secondary"></div>

      <div class="col-md-6">
        <h3 class="h6 text-muted text-uppercase">Prediction</h3>
        <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">
          ${renderTeamInlineHtml(match.homeTeam, { fallback: 'TBD' })}
          ${escapeHtml(String(prediction.homeScore ?? ''))}
        </p>
        <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">
          ${renderTeamInlineHtml(match.awayTeam, { fallback: 'TBD' })}
          ${escapeHtml(String(prediction.awayScore ?? ''))}
        </p>
        <p class="mb-1 d-flex align-items-center gap-2 flex-wrap">
          Predicted Winner: ${renderPredictedWinnerHtml(match, prediction, { result })}
        </p>
        <p class="mb-0">${renderPredictionStatusBadge(prediction.displayStatus ?? prediction.status)}</p>
      </div>

      ${hasResult ? `
        <div class="col-md-6">
          <h3 class="h6 text-muted text-uppercase">Result</h3>
          <p class="mb-1">Actual Score: ${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</p>
          ${PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result) ? `<p class="mb-1">Penalty Winner: ${escapeHtml(winnerName ?? '—')}</p>` : ''}
          ${resultBadges.length ? `<div class="d-flex flex-wrap gap-2 mb-2">${renderResultBadges(resultBadges)}</div>` : ''}
          <p class="mb-2">Points Awarded: ${escapeHtml(String(prediction.calculatedPoints ?? 0))}</p>
          ${breakdown.length ? `
            <ul class="list-unstyled small mb-0">
              ${breakdown.map((item) => `
                <li class="d-flex justify-content-between">
                  <span>${item.correct ? '✔' : '✖'} ${escapeHtml(item.label)}</span>
                  <span>${item.points} pts</span>
                </li>
              `).join('')}
            </ul>
          ` : ''}
        </div>
      ` : `
        <div class="col-md-6">
          <div class="alert alert-secondary mb-0">Results have not been published for this match yet.</div>
        </div>
      `}
    </div>
  `;
}

/**
 * @param {import('../../../domain/prediction-management.domain.js').EnrichedPrediction} prediction
 * @returns {string}
 */
export function renderPredictionDetailModal(prediction) {
  const contestant = prediction.contestant ?? {};
  const name = resolveContestantDisplayName(contestant);

  return renderModal({
    id: DETAIL_MODAL_ID,
    title: `Prediction — ${name}`,
    bodyHtml: renderPredictionDetailBody(prediction),
    sizeClass: 'modal-lg',
    footerHtml: `
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    `,
  });
}

export { DETAIL_MODAL_ID };
