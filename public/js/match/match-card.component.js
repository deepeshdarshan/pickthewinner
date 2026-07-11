/**
 * @fileoverview Match card component for contestant views.
 * @module match/match-card.component
 */

import {
  renderMatchCardBgIcons,
  resolveMatchCardBgIconVariant,
  resolveMatchCardThemeClass,
} from '../components/match-card-bg-icons.component.js';
import { renderMatchCountdownFromDto } from '../components/countdown.component.js';
import {
  renderTeamInlineHtml,
  renderTeamStackHtml,
  renderTeamsMatchupHtml,
} from '../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../utils/html.util.js';
import { formatDateTime } from '../utils/date.util.js';
import { PredictionDomain } from '../domain/prediction.domain.js';
import { PredictionManagementDomain } from '../domain/prediction-management.domain.js';
import { ScoringDomain } from '../scoring/scoring.domain.js';
import { renderResultBadge } from '../prediction/admin/renderers/prediction-status-badge.renderer.js';
import {
  renderCustomScoringSourceBadge,
} from './renderers/match-scoring-points.renderer.js';
import { getRoundLabel } from './match.constants.js';
import {
  getContestantPredictionUiStatus,
  renderContestantPredictionActionButtons,
  renderContestantPredictionStatusBadge,
  CONTESTANT_PREDICTION_UI_STATUS,
} from './match-prediction-ui.util.js';
import {
  renderPerformanceCardFooter,
  renderPerformanceCardHeader,
  renderPerformanceCardStats,
} from '../shared/cards/performance-card.component.js';

/**
 * @typedef {Object} MatchCardOptions
 * @property {import('./match.service.js').EnrichedMatch} match
 * @property {boolean} [showPrediction]
 * @property {Record<string, unknown>|null} [prediction]
 * @property {boolean} [showResult]
 * @property {boolean} [showPoints]
 * @property {number} [pointsEarned] Fallback when prediction has no calculatedPoints
 */

/**
 * Renders a match card for contestants.
 * @param {MatchCardOptions} options
 * @returns {string}
 */
export function renderMatchCard(options) {
  const {
    match,
    showPrediction = false,
    prediction = null,
    showResult = false,
    showPoints = false,
    pointsEarned,
  } = options;

  const resolvedPointsEarned = Number(prediction?.calculatedPoints ?? pointsEarned ?? 0);

  const kickoff = match.kickoffUtc instanceof Date ? match.kickoffUtc : match.kickoffUtc?.toDate?.() ?? null;

  const predictionStatus = getContestantPredictionUiStatus(match, prediction);
  const statusBadge = renderContestantPredictionStatusBadge(predictionStatus, { syncable: true });
  const customPointsBadge = renderCustomScoringSourceBadge(match.effectiveScoringConfig);
  const countdownHtml = match.matchCountdown
    ? renderMatchCountdownFromDto(match.matchCountdown, {
      id: `ptw-countdown-${match.id}`,
      status: String(match.status ?? ''),
      predictionStatus: String(match.predictionStatus ?? ''),
      predictionOverride: match.predictionOverride ?? undefined,
    })
    : '';

  const stageLabel = String(match.stage ?? '') || getRoundLabel(String(match.round ?? ''));
  const tournamentName = resolveTournamentName(match);
  const bgVariant = resolveMatchCardBgIconVariant(match);
  const themeClass = resolveMatchCardThemeClass(match);
  const performanceThemeClass = themeClass.includes('live')
    ? 'ptw-performance-card--live'
    : 'ptw-performance-card--pending';
  const predictedScore = prediction
    ? `${prediction.homeScore} - ${prediction.awayScore}`
    : '—';
  const officialScore = showResult && match.result?.published
    ? `${match.result.homeScore} - ${match.result.awayScore}`
    : 'Pending';
  const pointsValue = showPoints && showResult && match.result?.published
    ? String(resolvedPointsEarned)
    : '';
  const stakePoints = match.effectiveScoringConfig?.correctMatchScorePoints ?? '—';
  const statusStat = resolveStatusStatLabel(predictionStatus);

  return `
    <div class="card ptw-card ptw-match-card ptw-performance-card ${themeClass} ${performanceThemeClass} mb-3">
      ${renderMatchCardBgIcons(bgVariant)}
      <div class="card-body">
        ${renderPerformanceCardHeader({
          indicatorHtml: renderStatusIndicator(predictionStatus),
          avatarHtml: renderTeamPairAvatar(match),
          title: escapeHtml(tournamentName || 'Match'),
          subtitle: stageLabel ? escapeHtml(stageLabel) : '',
          badgeHtml: customPointsBadge,
          pointsValue: pointsValue || (showResult && match.result?.published ? '0' : ''),
          pointsLabel: pointsValue || (showResult && match.result?.published) ? 'Points' : '',
          pointsTone: resolvedPointsEarned > 0 ? 'gold' : 'primary',
        })}

        <div class="ptw-performance-card__matchup">
          <div class="ptw-performance-card__matchup-team">
            ${renderTeamStackHtml(match.homeTeam, {
    fallback: 'TBD',
    extraHtml: showResult && match.result
      ? `<div class="ptw-performance-card__matchup-score mt-2">${escapeHtml(String(match.result.homeScore ?? '-'))}</div>`
      : '',
  })}
            <span class="ptw-performance-card__matchup-name">${escapeHtml(String(match.homeTeam?.name ?? 'TBD'))}</span>
          </div>
          <div class="ptw-performance-card__matchup-vs">
            ${countdownHtml || '<span>VS</span>'}
          </div>
          <div class="ptw-performance-card__matchup-team">
            ${renderTeamStackHtml(match.awayTeam, {
    fallback: 'TBD',
    extraHtml: showResult && match.result
      ? `<div class="ptw-performance-card__matchup-score mt-2">${escapeHtml(String(match.result.awayScore ?? '-'))}</div>`
      : '',
  })}
            <span class="ptw-performance-card__matchup-name">${escapeHtml(String(match.awayTeam?.name ?? 'TBD'))}</span>
          </div>
        </div>

        ${renderPerformanceCardStats([
          {
            icon: 'bi-bullseye',
            value: escapeHtml(String(predictedScore)),
            label: 'My Prediction',
            tone: prediction ? 'primary' : 'warning',
          },
          {
            icon: 'bi-flag-fill',
            value: escapeHtml(String(officialScore)),
            label: 'Official Result',
            tone: showResult && match.result?.published ? 'default' : 'warning',
          },
          {
            icon: 'bi-trophy',
            value: escapeHtml(String(stakePoints)),
            label: 'Points at Stake',
            tone: 'info',
          },
        ])}

        ${renderPerformanceCardFooter({
          leftIcon: 'bi-clock',
          leftValue: kickoff ? escapeHtml(formatDateTime(kickoff)) : '—',
          leftLabel: statusStat,
          rightHtml: `
            <div>${statusBadge}</div>
            ${renderActionButtons(match, prediction, predictionStatus)}
          `,
        })}

        ${showResult && match.result?.published ? renderOfficialResultDisplay(match) : ''}
      </div>
    </div>
  `;
}

/**
 * @param {string} predictionStatus
 * @returns {string}
 */
function renderStatusIndicator(predictionStatus) {
  const config = {
    [CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED]: { icon: 'bi-check-circle-fill', label: 'Status', tone: 'success' },
    [CONTESTANT_PREDICTION_UI_STATUS.PENDING]: { icon: 'bi-exclamation-circle-fill', label: 'Status', tone: 'warning' },
    [CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON]: { icon: 'bi-clock-fill', label: 'Status', tone: 'primary' },
    [CONTESTANT_PREDICTION_UI_STATUS.LOCKED]: { icon: 'bi-lock-fill', label: 'Status', tone: 'default' },
  }[predictionStatus] ?? { icon: 'bi-circle-fill', label: 'Status', tone: 'default' };

  return `
    <div class="ptw-rank-badge ptw-rank-badge--${config.tone} ptw-rank-badge--featured" aria-hidden="true">
      <span class="ptw-rank-badge__label">${config.label}</span>
      <i class="bi ${config.icon} ptw-rank-badge__icon" aria-hidden="true"></i>
    </div>
  `;
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderTeamPairAvatar(match) {
  return `
    <div class="d-flex align-items-center gap-1 flex-shrink-0">
      ${renderTeamInlineHtml(match.homeTeam, { fallback: 'H', className: 'ptw-team-flag ptw-team-flag--sm' })}
      ${renderTeamInlineHtml(match.awayTeam, { fallback: 'A', className: 'ptw-team-flag ptw-team-flag--sm' })}
    </div>
  `;
}

/**
 * @param {string} predictionStatus
 * @returns {string}
 */
function resolveStatusStatLabel(predictionStatus) {
  switch (predictionStatus) {
    case CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED:
      return 'Prediction Submitted';
    case CONTESTANT_PREDICTION_UI_STATUS.PENDING:
      return 'Prediction Pending';
    case CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON:
      return 'Opens Soon';
    case CONTESTANT_PREDICTION_UI_STATUS.LOCKED:
      return 'Prediction Locked';
    default:
      return 'Match Status';
  }
}

/**
 * @param {string} predictionStatus
 * @returns {'primary'|'success'|'warning'|'default'}
 */
function resolveStatusTone(predictionStatus) {
  switch (predictionStatus) {
    case CONTESTANT_PREDICTION_UI_STATUS.SUBMITTED:
      return 'success';
    case CONTESTANT_PREDICTION_UI_STATUS.PENDING:
      return 'warning';
    case CONTESTANT_PREDICTION_UI_STATUS.OPENS_SOON:
      return 'primary';
    default:
      return 'default';
  }
}

/**
 * Renders prediction display.
 * @param {Record<string, unknown>} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderPredictionDisplay(prediction, match) {
  const homeScore = prediction.homeScore ?? '-';
  const awayScore = prediction.awayScore ?? '-';
  const predictedWinner = prediction.predictedWinner ?? prediction.penaltyWinner;
  const winnerTeam = predictedWinner === 'HOME'
    ? match.homeTeam
    : (predictedWinner === 'AWAY' ? match.awayTeam : null);

  return `
    <div class="mt-3 pt-3 border-top">
      <h6 class="mb-2">Your Prediction</h6>
      <div class="d-flex justify-content-center align-items-center gap-3">
        <div class="text-center">
          <div class="h4 mb-0 text-info">${escapeHtml(String(homeScore))}</div>
          <div class="d-flex justify-content-center mt-1">
            ${renderTeamInlineHtml(match.homeTeam, { fallback: 'Home', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}
          </div>
        </div>
        <div class="ptw-text-muted">-</div>
        <div class="text-center">
          <div class="h4 mb-0 text-info">${escapeHtml(String(awayScore))}</div>
          <div class="d-flex justify-content-center mt-1">
            ${renderTeamInlineHtml(match.awayTeam, { fallback: 'Away', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}
          </div>
        </div>
      </div>
      ${winnerTeam ? `<div class="text-center mt-2"><small class="ptw-text-muted">Predicted Winner: <span class="text-warning">${renderTeamInlineHtml(winnerTeam, { fallback: 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm', strong: true })}</span></small></div>` : ''}
    </div>
  `;
}

/**
 * Renders points display.
 * @param {number} pointsEarned
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderOfficialResultDisplay(match) {
  const result = /** @type {Record<string, unknown>} */ (match.result);

  if (!ScoringDomain.isPenaltyWinnerScoringApplicable(result)) {
    return '';
  }

  const homeScore = Number(result.homeScore ?? 0);
  const awayScore = Number(result.awayScore ?? 0);
  const winnerName = PredictionDomain.resolveResultWinnerName(result, match);

  if (homeScore !== awayScore || !winnerName) {
    return '';
  }

  const winnerSide = PredictionDomain.resolveResultWinnerSide(result, match);
  const winnerTeam = winnerSide === 'HOME'
    ? match.homeTeam
    : (winnerSide === 'AWAY' ? match.awayTeam : null);

  if (!winnerTeam) {
    return '';
  }

  return `
    <div class="mt-3 text-center">
      <small class="ptw-text-muted">Match Winner: <span class="text-warning">${renderTeamInlineHtml(winnerTeam, { fallback: winnerName ?? 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm', strong: true })}</span></small>
    </div>
  `;
}

/**
 * Renders points display.
 * @param {number} pointsEarned
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderPointsDisplay(pointsEarned, prediction, match) {
  if (!match.result?.published) {
    return '';
  }

  const enrichedPrediction = {
    ...prediction,
    match,
    winnerPredictionCorrect: PredictionDomain.isWinnerPredictionCorrect(
      prediction,
      match.result,
      match,
    ),
    exactScoreCorrect: checkExactScore(prediction, match),
  };
  const resultBadges = PredictionManagementDomain.resolveResultBadges(enrichedPrediction);

  if (resultBadges.length === 0) {
    return '';
  }

  const result = /** @type {Record<string, unknown>} */ (match.result);
  const winnerName = PredictionDomain.resolveResultWinnerName(result, match);
  const winnerSide = PredictionDomain.resolveResultWinnerSide(result, match);
  const winnerTeam = winnerSide === 'HOME'
    ? match.homeTeam
    : (winnerSide === 'AWAY' ? match.awayTeam : null);

  const badgesHtml = resultBadges.map((badge) => {
    const isPenaltyWinner = badge.label === 'Penalty Winner';
    return `
      <div>
        ${renderResultBadge(badge.correct, badge.label)}
        ${isPenaltyWinner && winnerTeam ? `<div class="d-flex justify-content-center mt-1">${renderTeamInlineHtml(winnerTeam, { fallback: winnerName ?? 'Winner', marginClass: 'me-0', className: 'ptw-team-flag ptw-team-flag--sm' })}</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="mt-3 pt-3 border-top">
      <h6 class="mb-2">Result</h6>
      <div class="d-flex justify-content-around text-center flex-wrap gap-3">
        <div class="d-flex flex-wrap gap-3 justify-content-center">
          ${badgesHtml}
        </div>
        <div>
          <div class="text-primary">
            <i class="bi bi-trophy-fill" aria-hidden="true"></i>
            ${pointsEarned} Points
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Checks if exact score prediction is correct.
 * @param {Record<string, unknown>|null} prediction
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {boolean}
 */
function checkExactScore(prediction, match) {
  if (!prediction || !match.result) {
    return false;
  }

  const predHome = Number(prediction.homeScore ?? 0);
  const predAway = Number(prediction.awayScore ?? 0);
  const actualHome = Number(match.result.homeScore ?? 0);
  const actualAway = Number(match.result.awayScore ?? 0);

  return predHome === actualHome && predAway === actualAway;
}

/**
 * Renders action buttons.
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {string} predictionStatus
 * @returns {string}
 */
function renderActionButtons(match, prediction, predictionStatus) {
  return renderContestantPredictionActionButtons({
    matchId: match.id,
    predictionStatus,
    resultPublished: Boolean(match.result?.published),
    predictionExists: Boolean(prediction),
    predictionLocked: Boolean(prediction?.locked),
    disabledButtonClass: 'btn btn-secondary w-100',
    enabledButtonClass: 'btn btn-ptw-primary w-100',
    editButtonClass: 'btn btn-primary w-100',
    viewDetailsButtonClass: 'btn btn-outline-primary w-100',
    predictLabel: 'Make Prediction',
    wrapperClass: 'mt-2',
  });
}

/**
 * Renders a compact match card for lists.
 * @param {import('./match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} [prediction]
 * @returns {string}
 */
export function renderCompactMatchCard(match, prediction = null) {
  const kickoff = match.kickoffUtc instanceof Date ? match.kickoffUtc : match.kickoffUtc?.toDate?.() ?? null;
  const predictionStatus = getContestantPredictionUiStatus(match, prediction);
  const stageLabel = String(match.stage ?? '') || getRoundLabel(String(match.round ?? ''));

  return `
    <div class="card ptw-card mb-2">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              ${stageLabel ? `<span class="badge bg-secondary">${escapeHtml(stageLabel)}</span>` : ''}
              ${renderContestantPredictionStatusBadge(predictionStatus)}
              ${renderCustomScoringSourceBadge(match.effectiveScoringConfig)}
            </div>
            <div class="mt-1">
              ${renderTeamsMatchupHtml(match.homeTeam, match.awayTeam, { homeFallback: 'TBD', awayFallback: 'TBD', strong: true })}
            </div>
            ${renderMatchScoringPointsHtml(match.effectiveScoringConfig, { compact: true })}
            ${kickoff ? `<small class="ptw-text-muted">${escapeHtml(formatDateTime(kickoff))}</small>` : ''}
          </div>
          <div>
            <a href="/matches?id=${encodeURIComponent(match.id)}" class="btn btn-sm btn-outline-primary" data-route>
              View
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * @param {import('./match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function resolveTournamentName(match) {
  const tournament = /** @type {Record<string, unknown>} */ (match.tournament ?? {});

  return String(
    match.tournamentName
    ?? tournament.name
    ?? tournament.title
    ?? '',
  ).trim();
}
