/**
 * @fileoverview Timeline view renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-timeline.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, toDate } from '../../../utils/date.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { PredictionHistoryDomain } from '../../../domain/prediction-history.domain.js';
import { renderComparisonBadges } from './prediction-comparison.renderer.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction-history.constants.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem[]} items
 * @returns {string}
 */
export function renderHistoryTimeline(items) {
  if (items.length === 0) {
    return '';
  }

  const groups = PredictionHistoryDomain.groupByMonth(items);

  return `
    <div class="ptw-prediction-timeline">
      ${groups.map((group) => `
        <section class="ptw-prediction-timeline__group mb-4" aria-label="${escapeHtml(group.label)}">
          <h2 class="h6 text-uppercase mb-3 ptw-prediction-timeline__group-label">${escapeHtml(group.label)}</h2>
          <ol class="list-unstyled mb-0 ptw-prediction-timeline__list">
            ${group.items.map((item) => renderTimelineItem(item)).join('')}
          </ol>
        </section>
      `).join('')}
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderTimelineItem(item) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : '—';
  const kickoffDatetime = kickoffDate?.toISOString() ?? '';
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');
  const detailUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(String(item.id))}`;
  const hasResult = Boolean(result.published);
  const hasAnyCorrect = item.exactScoreCorrect === true || item.winnerPredictionCorrect === true;
  const hasAnyIncorrect = item.exactScoreCorrect === false || item.winnerPredictionCorrect === false;
  const isSuccess = hasResult && hasAnyCorrect;
  const iconClass = isSuccess
    ? 'bi-check-circle-fill text-success'
    : hasResult && hasAnyIncorrect && !hasAnyCorrect
      ? 'bi-x-circle-fill text-danger'
      : 'bi-circle text-muted';
  const points = Number(item.calculatedPoints ?? 0);

  return `
    <li class="ptw-prediction-timeline__item">
      <div class="ptw-prediction-timeline__marker" aria-hidden="true">
        <i class="bi ${iconClass}"></i>
      </div>
      <div class="ptw-prediction-timeline__content card ptw-card">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div>
              <time class="small fw-semibold d-block" datetime="${escapeHtml(kickoffDatetime)}">${escapeHtml(kickoffLabel)}</time>
              <p class="mb-0 small ptw-prediction-timeline__meta">${escapeHtml(tournamentName)}${stage ? ` · ${escapeHtml(stage)}` : ''}</p>
            </div>
            <span class="badge bg-primary">${points} pts</span>
          </div>

          <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home' })}
            <span class="fw-semibold">${escapeHtml(String(result.published ? result.homeScore : item.homeScore))} - ${escapeHtml(String(result.published ? result.awayScore : item.awayScore))}</span>
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away' })}
            <span class="badge bg-secondary">${result.published ? 'Completed' : 'Pending'}</span>
          </div>

          <p class="small mb-2">
            <strong>My Prediction:</strong>
            ${escapeHtml(String(item.homeScore))} - ${escapeHtml(String(item.awayScore))}
            ${item.predictedWinnerName ? ` (${escapeHtml(item.predictedWinnerName)})` : ''}
          </p>

          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            ${renderComparisonBadges(item)}
            <a
              href="${detailUrl}"
              class="btn btn-sm btn-outline-primary ptw-prediction-history-detail-btn"
              data-ph-detail="${escapeHtml(String(item.id))}"
              aria-label="View prediction details"
            >
              View Details <i class="bi bi-chevron-right ms-1" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </li>
  `;
}
