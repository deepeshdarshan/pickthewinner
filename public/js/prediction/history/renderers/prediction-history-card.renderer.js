/**
 * @fileoverview Card view renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-card.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, formatDateTime, toDate } from '../../../utils/date.util.js';
import { renderTeamStackHtml } from '../../../master-data/teams/team-flag.util.js';
import { PredictionManagementDomain } from '../../../domain/prediction-management.domain.js';
import { PREDICTION_HISTORY_ROUTES } from '../prediction-history.constants.js';
import {
  renderPerformanceCardFooter,
  renderPerformanceCardHeader,
  renderPerformanceCardStats,
} from '../../../shared/cards/performance-card.component.js';

/** @type {string} */
export const PREDICTION_HISTORY_CARD_CLASS = 'ptw-prediction-history-card';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem} item
 * @param {{ asTimelineContent?: boolean }} [options]
 * @returns {string}
 */
export function renderHistoryCard(item, options = {}) {
  const { asTimelineContent = false } = options;
  const sections = buildHistoryCardSections(item, { asTimelineContent });
  const cardClass = [
    'card',
    'ptw-card',
    'ptw-performance-card',
    PREDICTION_HISTORY_CARD_CLASS,
    sections.themeClass,
    asTimelineContent ? 'ptw-prediction-timeline__content' : 'mb-3',
  ].filter(Boolean).join(' ');

  return `
    <article class="${cardClass}" data-prediction-id="${escapeHtml(String(item.id))}">
      <div class="card-body">
        ${sections.header}
        ${sections.matchup}
        ${sections.stats}
        ${sections.footer}
      </div>
    </article>
  `;
}

/**
 * @param {HistoryItem} item
 * @param {{ asTimelineContent?: boolean }} [options]
 * @returns {{ header: string, matchup: string, stats: string, footer: string, themeClass: string }}
 */
export function buildHistoryCardSections(item, options = {}) {
  const { asTimelineContent = false } = options;
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const kickoffTimeLabel = kickoffDate
    ? formatDateTime(match.kickoffUtc)?.split(', ').slice(1).join(', ') ?? ''
    : '';
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');
  const detailUrl = `${PREDICTION_HISTORY_ROUTES.LIST}?id=${encodeURIComponent(String(item.id))}`;
  const hasResult = Boolean(result.published);
  const points = Number(item.calculatedPoints ?? 0);
  const predictedScore = `${item.homeScore} - ${item.awayScore}`;
  const officialScore = hasResult
    ? `${result.homeScore} - ${result.awayScore}`
    : 'Pending';
  const winnerStat = resolveWinnerStatLabel(item, hasResult);
  const exactStat = resolveExactStatLabel(item, hasResult);
  const pointsTone = hasResult && points > 0 ? 'gold' : hasResult ? 'default' : 'primary';
  const themeClass = hasResult && points > 0
    ? 'ptw-performance-card--success'
    : 'ptw-performance-card--pending';

  return {
    themeClass,
    header: renderPerformanceCardHeader({
      indicatorHtml: asTimelineContent ? '' : renderDateIndicator(kickoffLabel),
      title: escapeHtml(tournamentName),
      subtitle: stage ? escapeHtml(stage) : '',
      badgeHtml: hasResult && points > 0
        ? '<span class="ptw-performance-card__badge"><i class="bi bi-check-circle-fill" aria-hidden="true"></i> Points Awarded</span>'
        : '',
      pointsValue: hasResult ? String(points) : '—',
      pointsLabel: hasResult ? 'Points' : 'Pending',
      pointsTone,
    }),
    matchup: renderMatchup(match, item, result, hasResult),
    stats: renderPerformanceCardStats([
      {
        icon: 'bi-bullseye',
        value: escapeHtml(predictedScore),
        label: 'My Prediction',
        tone: 'primary',
      },
      {
        icon: 'bi-flag-fill',
        value: escapeHtml(String(officialScore)),
        label: 'Official Result',
        tone: hasResult ? 'default' : 'warning',
      },
      {
        icon: 'bi-trophy',
        value: escapeHtml(winnerStat),
        label: 'Winner',
        tone: item.winnerPredictionCorrect === true ? 'success' : item.winnerPredictionCorrect === false ? 'danger' : 'default',
      },
    ]),
    footer: renderPerformanceCardFooter({
      leftIcon: 'bi-clock',
      leftValue: asTimelineContent
        ? (kickoffTimeLabel ? escapeHtml(kickoffTimeLabel) : '—')
        : (kickoffTimeLabel
          ? `${escapeHtml(kickoffLabel)} · ${escapeHtml(kickoffTimeLabel)}`
          : escapeHtml(kickoffLabel)),
      leftLabel: asTimelineContent ? 'Kickoff' : 'Match Date',
      rightHtml: `
        <div>${escapeHtml(exactStat)}</div>
        <a
          href="${detailUrl}"
          class="btn btn-sm btn-outline-primary ptw-prediction-history-detail-btn mt-2"
          data-ph-detail="${escapeHtml(String(item.id))}"
          aria-label="View prediction details"
        >
          View Details <i class="bi bi-chevron-right ms-1" aria-hidden="true"></i>
        </a>
      `,
    }),
  };
}

/**
 * @param {HistoryItem} item
 * @param {boolean} hasResult
 * @returns {string}
 */
function resolveWinnerStatLabel(item, hasResult) {
  if (!hasResult) {
    return '—';
  }

  if (item.winnerPredictionCorrect === true) {
    return 'Correct';
  }

  if (item.winnerPredictionCorrect === false) {
    return 'Incorrect';
  }

  return '—';
}

/**
 * @param {HistoryItem} item
 * @param {boolean} hasResult
 * @returns {string}
 */
function resolveExactStatLabel(item, hasResult) {
  if (!hasResult) {
    return 'Exact Score: Pending';
  }

  if (item.exactScoreCorrect === true) {
    return 'Exact Score: Correct';
  }

  if (item.exactScoreCorrect === false) {
    return 'Exact Score: Incorrect';
  }

  return 'Exact Score: —';
}

/**
 * @param {string} kickoffLabel
 * @returns {string}
 */
function renderDateIndicator(kickoffLabel) {
  return `
    <div class="ptw-rank-badge ptw-rank-badge--default ptw-rank-badge--featured" aria-hidden="true">
      <span class="ptw-rank-badge__label">Date</span>
      <span class="ptw-rank-badge__value" style="font-size:0.7rem;">${escapeHtml(kickoffLabel)}</span>
    </div>
  `;
}

/**
 * @param {Record<string, unknown>} match
 * @param {HistoryItem} item
 * @param {Record<string, unknown>} result
 * @param {boolean} hasResult
 * @returns {string}
 */
function renderMatchup(match, item, result, hasResult) {
  const showPenaltyWinner = hasResult
    && PredictionManagementDomain.shouldShowPenaltyWinnerForPublishedResult(result);

  return `
    <div class="ptw-performance-card__matchup">
      <div class="ptw-performance-card__matchup-team">
        ${renderTeamStackHtml(match.homeTeam, { fallback: 'Home' })}
      </div>
      <div class="ptw-performance-card__matchup-vs">
        <span>VS</span>
      </div>
      <div class="ptw-performance-card__matchup-team">
        ${renderTeamStackHtml(match.awayTeam, { fallback: 'Away' })}
      </div>
    </div>
    ${showPenaltyWinner ? `<p class="small text-center ptw-text-muted mb-3">Penalty winner included in result</p>` : ''}
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

  return `
    <div class="ptw-performance-card-list">
      ${items.map((item) => renderHistoryCard(item)).join('')}
    </div>
  `;
}

/**
 * @deprecated Use buildHistoryCardSections or renderHistoryCard directly.
 * @returns {string}
 */
export function renderPredictionHistoryCardDecorations() {
  return '';
}
