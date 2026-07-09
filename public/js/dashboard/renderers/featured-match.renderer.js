/**
 * @fileoverview Featured live and upcoming match sections for contestant dashboard.
 * @module dashboard/renderers/featured-match.renderer
 */

import { renderCountdown } from '../../components/countdown.component.js';
import { getTeamFlagUrl, renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import {
  renderCustomScoringSourceBadge,
  renderMatchScoringPointsHtml,
} from '../../match/renderers/match-scoring-points.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateTime } from '../../utils/date.util.js';

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
    sectionClass: 'ptw-featured-match ptw-featured-match--live ptw-live-match',
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
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h2 class="h5 mb-0" id="ptw-featured-match-heading">Upcoming Match</h2>
          </div>
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
  const flagClass = showLiveIndicator
    ? 'ptw-team-flag ptw-team-flag--stacked ptw-team-flag--lg'
    : 'ptw-team-flag ptw-team-flag--stacked';
  const homeFlag = renderTeamFlagHtml(getTeamFlagUrl(match.homeTeam), { marginClass: 'me-0', className: flagClass });
  const awayFlag = renderTeamFlagHtml(getTeamFlagUrl(match.awayTeam), { marginClass: 'me-0', className: flagClass });

  const headerRight = showLiveIndicator
    ? '<span class="ptw-live-indicator" aria-hidden="true"><span class="ptw-live-indicator__dot"></span> LIVE NOW</span>'
    : (countdown
      ? renderCountdown({
        targetDate: countdown.targetDate,
        label: 'CLOSES IN',
        id: `ptw-featured-countdown-${match.id}`,
      })
      : '');

  const customPointsBadge = renderCustomScoringSourceBadge(match.effectiveScoringConfig);
  const scoringPointsHtml = renderMatchScoringPointsHtml(match.effectiveScoringConfig, { compact: true });

  const metaHtml = kickoff
    ? `<div class="ptw-featured-match__meta text-center">
        <small class="ptw-text-muted">
          <i class="bi bi-clock me-1" aria-hidden="true"></i>
          ${escapeHtml(showLiveIndicator ? `Started ${formatDateTime(kickoff)}` : formatDateTime(kickoff))}
        </small>
      </div>`
    : '';

  return `
    <section class="card ptw-card ${sectionClass} h-100" aria-labelledby="${headingId}">
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <h2 class="h5 mb-0" id="${headingId}">${escapeHtml(heading)}</h2>
            ${customPointsBadge}
          </div>
          ${headerRight}
        </div>

        <div class="ptw-featured-match__teams d-flex align-items-center justify-content-center gap-3 flex-wrap mb-3">
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

        ${metaHtml}

        ${scoringPointsHtml ? `<div class="ptw-featured-match__scoring text-center mb-2">${scoringPointsHtml}</div>` : ''}

        ${prediction && !showLiveIndicator ? renderPredictionSummary(prediction) : ''}

        ${actionButtons ? `
          <div class="d-flex flex-wrap gap-2 justify-content-center mt-auto pt-3">
            ${actionButtons}
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

/**
 * @param {Record<string, unknown>} prediction
 * @returns {string}
 */
function renderPredictionSummary(prediction) {
  const homeScore = prediction.homeScore ?? '-';
  const awayScore = prediction.awayScore ?? '-';

  return `
    <div class="ptw-featured-match__prediction mt-3 mb-2">
      <p class="ptw-text-muted small text-center mb-1">Your Prediction</p>
      <div class="ptw-featured-match__score text-center">
        ${escapeHtml(String(homeScore))} - ${escapeHtml(String(awayScore))}
      </div>
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
      <a href="/matches?id=${encodeURIComponent(match.id)}" class="btn btn-sm btn-outline-primary" data-route>
        View Details
      </a>
    `;
  }

  if (predictionStatus === 'locked') {
    return `
      <button type="button" class="btn btn-sm btn-secondary" disabled>
        <i class="bi bi-lock me-1" aria-hidden="true"></i>Prediction Locked
      </button>
    `;
  }

  if (prediction && predictionStatus === 'submitted') {
    return `
      <a href="/predictions?action=edit&matchId=${encodeURIComponent(match.id)}" class="btn btn-sm btn-ptw-primary" data-route>
        <i class="bi bi-pencil me-1" aria-hidden="true"></i>Edit Prediction
      </a>
    `;
  }

  return `
    <a href="/predictions?action=create&matchId=${encodeURIComponent(match.id)}" class="btn btn-sm btn-ptw-primary" data-route>
      <i class="bi bi-bullseye me-1" aria-hidden="true"></i>Predict Match
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
