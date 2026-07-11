/**
 * @fileoverview Detail view renderer for a single prediction.
 * @module prediction/history/renderers/prediction-history-detail.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { formatDateDisplay, formatDateTime, toDate } from '../../../utils/date.util.js';
import { renderTeamInlineHtml } from '../../../master-data/teams/team-flag.util.js';
import { renderMatchStatusBadge } from '../../../match/renderers/status-badge.renderer.js';
import { renderMatchCardBgIcons } from '../../../components/match-card-bg-icons.component.js';
import { renderPredictionComparisonPanel } from './prediction-comparison.renderer.js';
import { PREDICTION_HISTORY_ROUTES, PREDICTION_LIFECYCLE_STEP } from '../prediction-history.constants.js';
import { resolveLockMinutes, resolvePredictionLockState } from '../../../domain/prediction-history.domain.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 * @typedef {import('../../../domain/prediction-history.domain.js').LifecycleStep} LifecycleStep
 */

/** @type {Readonly<Record<string, { icon: string, modifier: string }>>} */
const LIFECYCLE_STEP_STYLES = Object.freeze({
  [PREDICTION_LIFECYCLE_STEP.SUBMITTED]: { icon: 'bi-check-circle-fill', modifier: 'submitted' },
  [PREDICTION_LIFECYCLE_STEP.LOCKED]: { icon: 'bi-lock-fill', modifier: 'locked' },
  [PREDICTION_LIFECYCLE_STEP.MATCH_STARTED]: { icon: 'bi-play-fill', modifier: 'started' },
  [PREDICTION_LIFECYCLE_STEP.MATCH_COMPLETED]: { icon: 'bi-flag-fill', modifier: 'completed' },
  [PREDICTION_LIFECYCLE_STEP.RESULTS_PUBLISHED]: { icon: 'bi-file-earmark-text-fill', modifier: 'published' },
  [PREDICTION_LIFECYCLE_STEP.POINTS_AWARDED]: { icon: 'bi-trophy-fill', modifier: 'awarded' },
});

/**
 * @param {HistoryItem} item
 * @param {LifecycleStep[]} lifecycle
 * @param {{ backHref?: string, backLabel?: string, headerHtml?: string }} [context]
 * @returns {string}
 */
export function renderPredictionDetail(item, lifecycle, context = {}) {
  const backHref = context.backHref ?? PREDICTION_HISTORY_ROUTES.LIST;
  const backLabel = context.backLabel ?? 'Back to History';

  return `
    <div class="ptw-prediction-detail">
      <a href="${escapeHtml(backHref)}" class="ptw-prediction-detail__back-link" data-ph-back>
        <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>${escapeHtml(backLabel)}
      </a>

      ${context.headerHtml ?? ''}

      ${renderMatchSummaryCard(item)}

      <div class="card ptw-card ptw-prediction-detail__section mb-3">
        <div class="card-header"><h2 class="h5 mb-0">Prediction vs Result</h2></div>
        <div class="card-body">${renderPredictionComparisonPanel(item)}</div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-lg-6">
          <div class="card ptw-card ptw-prediction-detail__section h-100">
            <div class="card-header"><h2 class="h6 mb-0">Match Timeline</h2></div>
            <div class="card-body">${renderLifecycleTimeline(lifecycle)}</div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card ptw-card ptw-prediction-detail__section h-100">
            <div class="card-header"><h2 class="h6 mb-0">Prediction Metadata</h2></div>
            <div class="card-body">${renderMetadataPanel(item)}</div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card ptw-card ptw-prediction-detail__section h-100">
            <div class="card-header"><h2 class="h6 mb-0">Scoring Rules</h2></div>
            <div class="card-body">${renderScoringRulesPanel(item)}</div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card ptw-card ptw-prediction-detail__section h-100">
            <div class="card-header"><h2 class="h6 mb-0">Match Information</h2></div>
            <div class="card-body">${renderMatchInfoPanel(item)}</div>
          </div>
        </div>
      </div>

      <div class="ptw-prediction-detail__footer">
        <a href="${escapeHtml(backHref)}" class="btn btn-outline-primary ptw-prediction-detail__footer-action" data-ph-back>
          <i class="bi bi-box-arrow-up-right me-2" aria-hidden="true"></i>${escapeHtml(backLabel)}
        </a>
      </div>
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderMatchSummaryCard(item) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const kickoffDate = toDate(match.kickoffUtc);
  const kickoffDateLabel = kickoffDate
    ? formatDateDisplay(kickoffDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '—';
  const kickoffTimeLabel = kickoffDate
    ? formatDateTime(match.kickoffUtc)?.split(', ').slice(1).join(', ') ?? ''
    : '';
  const kickoffLabel = kickoffTimeLabel ? `${kickoffDateLabel} · ${kickoffTimeLabel}` : kickoffDateLabel;
  const tournamentName = String(tournament.name ?? tournament.title ?? 'Tournament');
  const stage = String(match.stage ?? match.round ?? '');
  const homeTeam = match.homeTeam ?? {};
  const awayTeam = match.awayTeam ?? {};
  const iconUrl = String(tournament.iconUrl ?? '').trim();
  const tournamentIcon = iconUrl
    ? `<img src="${escapeHtml(iconUrl)}" alt="" class="ptw-prediction-detail__tournament-icon" width="32" height="32">`
    : '<i class="bi bi-trophy-fill ptw-prediction-detail__tournament-icon-fallback" aria-hidden="true"></i>';
  const hasResult = Boolean(result.published);
  const scoreHtml = hasResult
    ? `<span class="ptw-prediction-detail__result-score">${escapeHtml(String(result.homeScore ?? ''))} - ${escapeHtml(String(result.awayScore ?? ''))}</span>`
    : '<span class="ptw-text-muted small">Pending</span>';

  return `
    <div class="card ptw-card ptw-prediction-detail__section ptw-prediction-detail__match-summary mb-3">
      ${renderMatchCardBgIcons('history')}
      <div class="card-body">
        <div class="ptw-prediction-detail__match-summary-grid">
          <div class="ptw-prediction-detail__match-summary-tournament">
            ${tournamentIcon}
            <div>
              <p class="ptw-prediction-detail__tournament-name mb-0">${escapeHtml(tournamentName)}</p>
              ${stage ? `<p class="ptw-prediction-detail__stage mb-0">${escapeHtml(stage)}</p>` : ''}
              <p class="ptw-prediction-detail__kickoff mb-0">${escapeHtml(kickoffLabel)}</p>
            </div>
          </div>

          <div class="ptw-prediction-detail__matchup">
            <div class="ptw-prediction-detail__matchup-team">
              ${renderTeamInlineHtml(homeTeam, { fallback: 'Home' })}
              <span class="ptw-prediction-detail__matchup-name">${escapeHtml(String(homeTeam.name ?? 'Home'))}</span>
            </div>
            <span class="ptw-prediction-detail__vs" aria-hidden="true">VS</span>
            <div class="ptw-prediction-detail__matchup-team">
              <span class="ptw-prediction-detail__matchup-name">${escapeHtml(String(awayTeam.name ?? 'Away'))}</span>
              ${renderTeamInlineHtml(awayTeam, { fallback: 'Away' })}
            </div>
          </div>

          <div class="ptw-prediction-detail__match-status">
            <div class="mb-2">${renderMatchStatusBadge(String(match.status ?? ''))}</div>
            <p class="ptw-prediction-detail__result-label mb-1">Official Result</p>
            ${scoreHtml}
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
    <ol class="list-unstyled mb-0 ptw-lifecycle-timeline ptw-lifecycle-timeline--detail">
      ${lifecycle.map((step, index) => {
    const style = LIFECYCLE_STEP_STYLES[step.key] ?? { icon: 'bi-circle-fill', modifier: 'default' };

    return `
        <li class="ptw-lifecycle-timeline__step ptw-lifecycle-timeline__step--${style.modifier} ${step.completed ? 'is-complete' : ''} ${step.current ? 'is-current' : ''}">
          <div class="ptw-lifecycle-timeline__marker" aria-hidden="true">
            <i class="bi ${style.icon}"></i>
          </div>
          <div class="ptw-lifecycle-timeline__content">
            <p class="mb-0 fw-semibold">${escapeHtml(step.label)}</p>
            <p class="mb-0 ptw-lifecycle-timeline__timestamp">${escapeHtml(formatLifecycleTimestamp(step))}</p>
          </div>
          ${index < lifecycle.length - 1 ? '<div class="ptw-lifecycle-timeline__connector" aria-hidden="true"></div>' : ''}
        </li>
      `;
  }).join('')}
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
function renderMetadataPanel(item) {
  const match = item.match ?? {};
  const lockMinutes = resolveLockMinutes(item.tournament);
  const lockState = resolvePredictionLockState(item, match, new Date(), { lockMinutes });
  const matchId = String(item.matchId ?? '');
  const predictionId = String(item.id ?? '');

  return `
    <div class="ptw-prediction-detail__info-list">
      ${renderInfoRow('bi-clock', 'Submitted', formatDateTime(item.submittedAt) || '—')}
      ${renderInfoRow('bi-clock-history', 'Last Updated', formatDateTime(item.updatedAt) || '—')}
      ${renderInfoRow('bi-lock', 'Locked', renderYesNoBadge(lockState.locked))}
      ${renderInfoRow('bi-check2-square', 'Scored', renderYesNoBadge(Boolean(item.scored)))}
      ${renderInfoRow('bi-hash', 'Match ID', renderCopyableId(matchId), { valueClass: 'ptw-prediction-detail__info-value--id' })}
      ${renderInfoRow('bi-hash', 'Prediction ID', renderCopyableId(predictionId), { valueClass: 'ptw-prediction-detail__info-value--id' })}
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderScoringRulesPanel(item) {
  const match = item.match ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const config = match.effectiveScoringConfig ?? {};
  const breakdown = /** @type {Array<{ label: string, points: number, correct: boolean }>} */ (
    item.scoringBreakdown ?? []
  );
  const breakdownByLabel = new Map(
    breakdown.map((entry) => [String(entry.label).toLowerCase(), entry]),
  );
  const matchScorePoints = Number(config.correctMatchScorePoints ?? 0);
  const penaltyPoints = Number(config.correctPenaltyWinnerPoints ?? 0);
  const showPenalty = Boolean(config.showPenaltyWinnerPoints);
  const totalPossible = matchScorePoints + (showPenalty ? penaltyPoints : 0);
  const hasResult = Boolean(result.published);

  const rules = [
    {
      key: 'exact-score',
      title: 'Exact Score',
      description: 'Predict the exact score',
      maxPoints: matchScorePoints,
      breakdownKey: 'correct match score',
    },
  ];

  if (showPenalty) {
    rules.push({
      key: 'penalty-winner',
      title: 'Correct Winner (Penalty)',
      description: 'Predict the correct winner',
      maxPoints: penaltyPoints,
      breakdownKey: 'correct penalty winner',
    });
  }

  return `
    <div class="ptw-prediction-detail__scoring-rules">
      ${rules.map((rule) => {
    const entry = breakdownByLabel.get(rule.breakdownKey)
      ?? breakdown.find((row) => String(row.label).toLowerCase().includes(rule.breakdownKey.split(' ').slice(-1)[0]));
    const earned = hasResult ? Number(entry?.points ?? 0) : null;
    const correct = entry?.correct ?? false;
    const pointsClass = earned === null
      ? 'text-muted'
      : earned > 0
        ? 'text-success'
        : 'text-danger';
    const iconClass = earned === null
      ? 'text-muted'
      : correct
        ? 'text-success'
        : 'text-danger';
    const icon = earned === null
      ? 'bi-dash-circle'
      : correct
        ? 'bi-check-circle-fill'
        : 'bi-x-circle-fill';
    const pointsLabel = earned === null ? '—' : `${earned} pts`;

    return `
          <div class="ptw-prediction-detail__scoring-rule">
            <div class="ptw-prediction-detail__scoring-rule-main">
              <span class="ptw-prediction-detail__scoring-rule-icon ${iconClass}">
                <i class="bi ${icon}" aria-hidden="true"></i>
              </span>
              <div>
                <p class="ptw-prediction-detail__scoring-rule-title mb-0">${escapeHtml(rule.title)}</p>
                <p class="ptw-prediction-detail__scoring-rule-desc mb-0">${escapeHtml(rule.description)}</p>
              </div>
            </div>
            <span class="ptw-prediction-detail__scoring-rule-points ${pointsClass}">${pointsLabel}</span>
          </div>
        `;
  }).join('')}
      <div class="ptw-prediction-detail__scoring-rules-footer">
        <span class="ptw-prediction-detail__scoring-rules-footer-label">Total Points Possible</span>
        <span class="ptw-prediction-detail__scoring-rules-footer-value">${totalPossible} pts</span>
      </div>
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderMatchInfoPanel(item) {
  const match = item.match ?? {};
  const tournament = item.tournament ?? {};
  const result = /** @type {Record<string, unknown>} */ (match.result ?? {});
  const stadium = String(match.venue ?? match.stadium ?? '').trim() || '—';
  const tournamentName = String(tournament.name ?? tournament.title ?? '—');
  const stage = String(match.stage ?? match.round ?? '—');

  return `
    <div class="ptw-prediction-detail__info-list">
      ${renderInfoRow('bi-trophy', 'Tournament', escapeHtml(tournamentName))}
      ${renderInfoRow('bi-diagram-3', 'Stage', escapeHtml(stage))}
      ${renderInfoRow('bi-calendar-event', 'Kickoff Time', escapeHtml(formatDateTime(match.kickoffUtc) || '—'))}
      ${renderInfoRow('bi-megaphone', 'Result Published', escapeHtml(formatDateTime(result.publishedAt) || '—'))}
      ${renderInfoRow('bi-geo-alt', 'Stadium', escapeHtml(stadium))}
    </div>
  `;
}

/**
 * @param {string} icon
 * @param {string} label
 * @param {string} valueHtml
 * @param {{ valueClass?: string }} [options]
 * @returns {string}
 */
function renderInfoRow(icon, label, valueHtml, options = {}) {
  const valueClass = options.valueClass ?? 'ptw-prediction-detail__info-value';

  return `
    <div class="ptw-prediction-detail__info-row">
      <div class="ptw-prediction-detail__info-label">
        <i class="bi ${icon} me-2" aria-hidden="true"></i>
        <span>${escapeHtml(label)}</span>
      </div>
      <div class="${valueClass}">${valueHtml}</div>
    </div>
  `;
}

/**
 * @param {boolean} value
 * @returns {string}
 */
function renderYesNoBadge(value) {
  if (value) {
    return '<span class="ptw-prediction-detail__yes-badge">Yes</span>';
  }

  return '<span class="ptw-prediction-detail__no-badge">No</span>';
}

/**
 * @param {string} id
 * @returns {string}
 */
function renderCopyableId(id) {
  if (!id) {
    return '—';
  }

  return `
    <span class="ptw-prediction-detail__id-value">${escapeHtml(id)}</span>
    <button
      type="button"
      class="btn btn-sm btn-link ptw-prediction-detail__copy-btn"
      data-ph-copy="${escapeHtml(id)}"
      aria-label="Copy ID"
    >
      <i class="bi bi-clipboard" aria-hidden="true"></i>
    </button>
  `;
}
