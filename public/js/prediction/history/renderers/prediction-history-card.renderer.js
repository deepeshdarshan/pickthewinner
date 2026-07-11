/**
 * @fileoverview Card view renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, toDate } from '../../../utils/date.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import {
  renderPredictedScoreHtml,
  renderActualScoreHtml,
  renderPredictedWinnerHtml,
  renderActualWinnerHtml,
  renderPointsHtml,
} from '../../admin/renderers/prediction-display.renderer.js';
import { renderComparisonBadges } from './prediction-comparison.renderer.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';
import { renderMatchScoringPointsHtml } from '../../../match/renderers/match-scoring-points.renderer.js';
import { renderMatchCardBgIcons } from '../../../components/match-card-bg-icons.component.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction-history.constants.js';

/** @type {string} */
export const PREDICTION_HISTORY_CARD_CLASS = 'ptw-prediction-history-card';

/**
 * @returns {string}
 */
export function renderPredictionHistoryCardDecorations() {
  return renderMatchCardBgIcons('history');
}

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
export function renderHistoryCard(item) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const kickoffDatetime = kickoffDate?.toISOString() ?? '';
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');
  const detailUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(String(item.id))}`;
  const showPenaltyWinner = Boolean(result.published)
    && PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result);

  return `
    <article class="card ptw-card ${PREDICTION_HISTORY_CARD_CLASS} mb-3" data-prediction-id="${escapeHtml(String(item.id))}">
      ${renderPredictionHistoryCardDecorations()}
      <div class="ptw-prediction-history-card__banner" style="${tournament.bannerUrl ? `background-image:url('${escapeHtml(String(tournament.bannerUrl))}')` : ''}">
        <div class="ptw-prediction-history-card__banner-overlay">
          <p class="mb-0 small">${escapeHtml(tournamentName)}</p>
          ${stage ? `<p class="mb-0 small opacity-75">${escapeHtml(stage)}</p>` : ''}
        </div>
      </div>
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start gap-2 mb-3">
          <time class="small ptw-text-muted" datetime="${escapeHtml(kickoffDatetime)}">${escapeHtml(kickoffLabel)}</time>
          <div>${renderPointsHtml(item, result)}</div>
        </div>

        <div class="row g-3 mb-3">
          <div class="col-6 text-center">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
            <p class="mb-0 small fw-semibold mt-1">${escapeHtml(String(match.homeTeam?.name ?? 'Home'))}</p>
          </div>
          <div class="col-6 text-center">
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
            <p class="mb-0 small fw-semibold mt-1">${escapeHtml(String(match.awayTeam?.name ?? 'Away'))}</p>
          </div>
        </div>

        ${renderMatchScoringPointsHtml(match.effectiveScoringConfig)}

        <div class="row g-3">
          <div class="col-md-6">
            <h3 class="h6 text-uppercase text-muted">My Prediction</h3>
            ${renderPredictedScoreHtml(match, item)}
            ${showPenaltyWinner ? `<p class="mb-0 small mt-2"><span class="text-muted">Predicted Winner:</span> ${renderPredictedWinnerHtml(match, item, { result })}</p>` : ''}
          </div>
          <div class="col-md-6">
            <h3 class="h6 text-uppercase text-muted">Official Result</h3>
            ${result.published ? renderActualScoreHtml(match, result) : '<p class="text-muted mb-0 small">Pending</p>'}
            ${showPenaltyWinner ? `<p class="mb-0 small mt-2"><span class="text-muted">Penalty Winner:</span> ${renderActualWinnerHtml(match, result)}</p>` : ''}
          </div>
        </div>

        <div class="mt-3">${renderComparisonBadges(item)}</div>

        <div class="mt-3">
          <a
            href="${detailUrl}"
            class="btn btn-outline-primary w-100 ptw-prediction-history-detail-btn"
            data-ph-detail="${escapeHtml(String(item.id))}"
            aria-label="View prediction details"
          >
            View Details <i class="bi bi-chevron-right ms-1" aria-hidden="true"></i>
          </a>
        </div>
      </div>
    </article>
  `;
}

/**
 * @param {HistoryItem[]} items
 * @returns {string}
 */
export function renderHistoryCardList(items) {
  if (items.length === 0) {
    return '';
  }

  return items.map((item) => renderHistoryCard(item)).join('');
}
