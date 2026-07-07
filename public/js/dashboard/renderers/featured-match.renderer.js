/**
 * @fileoverview Featured live and upcoming match sections for contestant dashboard.
 * @module dashboard/renderers/featured-match.renderer
 */

import { renderCountdown } from '../../components/countdown.component.js';
import { renderTeamInlineHtml, getTeamFlagUrl, renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateTime } from '../../utils/date.util.js';
import { renderMatchStatusBadge } from '../../match/renderers/status-badge.renderer.js';
import { getRoundLabel } from '../../match/match.constants.js';
import { MATCH_STATUS } from '../../domain/match.domain.js';

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderLiveMatchSection(data) {
  const match = data.featuredLiveMatch;

  if (!match) {
    return '';
  }

  const prediction = data.featuredLiveMatchPrediction ?? null;

  return renderMatchSpotlightCard({
    match,
    prediction,
    headingId: 'ptw-live-match-heading',
    heading: 'Live Now',
    sectionClass: 'ptw-featured-match ptw-live-match',
    showLiveIndicator: true,
    countdown: null,
    actionButtons: '',
  });
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderFeaturedMatchSection(data) {
  const match = data.featuredMatch;

  if (!match) {
    return `
      <section class="card ptw-card ptw-featured-match ptw-upcoming-match h-100" aria-labelledby="ptw-featured-match-heading">
        <div class="card-body ptw-placeholder-card">
          <h2 class="h5" id="ptw-featured-match-heading">Upcoming Match</h2>
          <p class="ptw-text-muted mb-0">No upcoming matches scheduled right now.</p>
        </div>
      </section>
    `;
  }

  const prediction = data.featuredMatchPrediction ?? null;
  const predictionStatus = getPredictionStatus(match, prediction);
  const countdown = data.featuredMatchCountdown;

  return renderMatchSpotlightCard({
    match,
    prediction,
    headingId: 'ptw-featured-match-heading',
    heading: 'Upcoming Match',
    sectionClass: 'ptw-featured-match ptw-upcoming-match',
    showLiveIndicator: false,
    countdown,
    actionButtons: renderUpcomingActionButtons(match, prediction, predictionStatus),
  });
}

/**
 * @param {{
 *   match: import('../../match/match.service.js').EnrichedMatch,
 *   prediction: Record<string, unknown>|null,
 *   headingId: string,
 *   heading: string,
 *   sectionClass: string,
 *   showLiveIndicator: boolean,
 *   countdown: { targetDate: string, label: string }|null,
 *   actionButtons: string,
 * }} options
 * @returns {string}
 */
function renderMatchSpotlightCard(options) {
  const {
    match,
    prediction,
    headingId,
    heading,
    sectionClass,
    showLiveIndicator,
    countdown,
    actionButtons,
  } = options;

  const kickoff = toDate(match.kickoffUtc);
  const homeName = match.homeTeam?.name ?? 'Home';
  const awayName = match.awayTeam?.name ?? 'Away';
  const homeFlag = renderTeamFlagHtml(getTeamFlagUrl(match.homeTeam), { marginClass: 'me-2', className: 'ptw-team-flag ptw-team-flag--stacked' });
  const awayFlag = renderTeamFlagHtml(getTeamFlagUrl(match.awayTeam), { marginClass: 'me-2', className: 'ptw-team-flag ptw-team-flag--stacked' });
  const liveIndicator = showLiveIndicator
    ? '<span class="ptw-live-indicator" aria-hidden="true"><span class="ptw-live-indicator__dot"></span> LIVE</span>'
    : '';
  const stageLabel = String(match.stage ?? '') || getRoundLabel(String(match.round ?? '')) || 'Match';

  return `
    <section class="card ptw-card ${sectionClass} h-100" aria-labelledby="${headingId}">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div class="d-flex align-items-center flex-wrap gap-2">
          <span class="badge bg-secondary">${escapeHtml(match.tournamentName ?? 'Tournament')}</span>
          <span class="badge bg-info">${escapeHtml(stageLabel)}</span>
          ${showLiveIndicator ? renderMatchStatusBadge(MATCH_STATUS.LIVE) : ''}
        </div>
        ${countdown ? renderCountdown({ targetDate: countdown.targetDate, label: countdown.label, id: `ptw-featured-countdown-${match.id}` }) : ''}
      </div>
      <div class="card-body">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <h2 class="h5 mb-0" id="${headingId}">${escapeHtml(heading)}</h2>
          ${liveIndicator}
        </div>
        <div class="ptw-featured-match__teams d-flex align-items-center justify-content-center gap-3 flex-wrap mb-4">
          <div class="ptw-featured-match__team text-center">
            ${homeFlag}
            <div class="fw-semibold mt-2">${escapeHtml(homeName)}</div>
          </div>
          <div class="ptw-featured-match__vs ptw-text-muted fw-bold">VS</div>
          <div class="ptw-featured-match__team text-center">
            ${awayFlag}
            <div class="fw-semibold mt-2">${escapeHtml(awayName)}</div>
          </div>
        </div>
        <div class="ptw-featured-match__meta text-center mb-4">
          ${kickoff ? `<div><i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(showLiveIndicator ? `Started ${formatDateTime(kickoff)}` : formatDateTime(kickoff))}</div>` : ''}
          ${match.venueName ? `<div class="ptw-text-muted mt-1"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${escapeHtml(match.venueName)}</div>` : ''}
        </div>
        ${prediction ? renderPredictionSummary(prediction, match) : ''}
        ${actionButtons ? `
        <div class="d-flex flex-wrap gap-2 justify-content-center">
          ${actionButtons}
        </div>
        ` : ''}
      </div>
    </section>
  `;
}

/**
 * @param {Record<string, unknown>} prediction
 * @param {import('../../match/match.service.js').EnrichedMatch} match
 * @returns {string}
 */
function renderPredictionSummary(prediction, match) {
  const homeScore = prediction.homeScore ?? '-';
  const awayScore = prediction.awayScore ?? '-';
  const predictedWinner = prediction.predictedWinner ?? prediction.penaltyWinner;
  const winnerTeam = predictedWinner === 'HOME'
    ? match.homeTeam
    : (predictedWinner === 'AWAY' ? match.awayTeam : null);

  return `
    <div class="ptw-featured-match__prediction border-top pt-3 mb-4">
      <h3 class="h6 text-center mb-3">Your Prediction</h3>
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
 * @param {import('../../match/match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @returns {string}
 */
function getPredictionStatus(match, prediction) {
  if (!prediction) {
    return match.predictionStatus === 'Open' ? 'pending' : 'locked';
  }

  if (prediction.locked) {
    return 'locked';
  }

  if (match.predictionStatus === 'Open') {
    return 'submitted';
  }

  return 'locked';
}

/**
 * @param {import('../../match/match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {string} predictionStatus
 * @returns {string}
 */
function renderUpcomingActionButtons(match, prediction, predictionStatus) {
  if (match.result?.published) {
    return `
      <a href="/matches?id=${encodeURIComponent(match.id)}" class="btn btn-outline-primary" data-route>
        View Details
      </a>
    `;
  }

  if (predictionStatus === 'locked') {
    return `
      <button type="button" class="btn btn-secondary" disabled>
        <i class="bi bi-lock me-2" aria-hidden="true"></i>Prediction Locked
      </button>
    `;
  }

  if (prediction && predictionStatus === 'submitted') {
    return `
      <a href="/predictions?action=edit&matchId=${encodeURIComponent(match.id)}" class="btn btn-ptw-primary" data-route>
        <i class="bi bi-pencil me-2" aria-hidden="true"></i>Edit Prediction
      </a>
    `;
  }

  return `
    <a href="/predictions?action=create&matchId=${encodeURIComponent(match.id)}" class="btn btn-ptw-primary" data-route>
      <i class="bi bi-bullseye me-2" aria-hidden="true"></i>Predict Match
    </a>
  `;
}

/**
 * @param {unknown} value
 * @returns {Date|null}
 */
function toDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }

  return null;
}
