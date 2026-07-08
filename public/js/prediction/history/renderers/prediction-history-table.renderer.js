/**
 * @fileoverview Table view renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-table.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, toDate } from '../../../utils/date.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { renderResultBadge } from '../../admin/renderers/prediction-status-badge.renderer.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction-history.constants.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem[]} items
 * @returns {string}
 */
export function renderHistoryTable(items) {
  if (items.length === 0) {
    return '';
  }

  const rows = items.map((item, index) => renderHistoryTableRow(item, index)).join('');

  return `
    <div class="table-responsive">
      <table class="table table-hover ptw-table ptw-prediction-history-table mb-0" aria-label="Prediction history">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Tournament</th>
            <th scope="col">Match</th>
            <th scope="col">Prediction</th>
            <th scope="col">Result</th>
            <th scope="col">Winner</th>
            <th scope="col">Exact</th>
            <th scope="col">Points</th>
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @param {number} index
 * @returns {string}
 */
function renderHistoryTableRow(item, index) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const detailUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(String(item.id))}`;
  const collapseId = `ph-table-detail-${index}`;
  const showPenaltyWinner = Boolean(result.published)
    && PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result);
  const winnerCell = showPenaltyWinner
    ? renderResultBadge(item.winnerPredictionCorrect, '')
    : '<span class="text-muted">—</span>';
  const exactCell = result.published
    ? renderResultBadge(item.exactScoreCorrect, '')
    : '<span class="text-muted">—</span>';

  return `
    <tr class="ptw-prediction-history-table__row" data-prediction-id="${escapeHtml(String(item.id))}" tabindex="0" data-ph-detail-row="${escapeHtml(String(item.id))}">
      <td>${escapeHtml(kickoffLabel)}</td>
      <td>${escapeHtml(tournamentName)}</td>
      <td>
        <div class="d-flex flex-wrap align-items-center gap-1">
          ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
          <span class="text-muted">vs</span>
          ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
        </div>
      </td>
      <td>${escapeHtml(String(item.homeScore))} - ${escapeHtml(String(item.awayScore))}</td>
      <td>${result.published ? `${escapeHtml(String(result.homeScore))} - ${escapeHtml(String(result.awayScore))}` : '—'}</td>
      <td>${winnerCell}</td>
      <td>${exactCell}</td>
      <td class="fw-semibold">${Number(item.calculatedPoints ?? 0)}</td>
      <td>
        <a href="${detailUrl}" class="btn btn-sm btn-link" data-ph-detail="${escapeHtml(String(item.id))}" aria-label="View details">
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </a>
        <button
          type="button"
          class="btn btn-sm btn-link d-md-none"
          data-bs-toggle="collapse"
          data-bs-target="#${collapseId}"
          aria-expanded="false"
          aria-controls="${collapseId}"
        >
          <i class="bi bi-three-dots" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
    <tr class="d-md-none">
      <td colspan="9" class="p-0 border-0">
        <div class="collapse" id="${collapseId}">
          <div class="p-3 bg-dark-subtle">
            <p class="small mb-1"><strong>Stage:</strong> ${escapeHtml(String(match.stage ?? match.round ?? '—'))}</p>
            <p class="small mb-0"><strong>Match #:</strong> ${escapeHtml(String(match.matchNumber ?? '—'))}</p>
          </div>
        </div>
      </td>
    </tr>
  `;
}
