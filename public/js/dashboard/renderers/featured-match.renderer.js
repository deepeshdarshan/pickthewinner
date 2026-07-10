/**
 * @fileoverview Featured live and upcoming match sections for contestant dashboard.
 * @module dashboard/renderers/featured-match.renderer
 */

import { renderMatchCountdownFromDto } from '../../components/countdown.component.js';
import { getTeamFlagUrl, renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import {
  getContestantPredictionUiStatus,
  renderContestantPredictionActionButtons,
} from '../../match/match-prediction-ui.util.js';
import {
  renderCustomScoringSourceBadge,
  renderMatchScoringPointsHtml,
} from '../../match/renderers/match-scoring-points.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateTime } from '../../utils/date.util.js';

/** @type {Readonly<Record<string, ReadonlyArray<{ icon: string, modifier: string }>>>} */
const FEATURED_MATCH_BG_ICONS = Object.freeze({
  live: [
    { icon: 'bi-broadcast-pin', modifier: '--primary' },
    { icon: 'bi-stopwatch', modifier: '--secondary' },
    { icon: 'bi-flag-fill', modifier: '--tertiary' },
  ],
  upcoming: [
    { icon: 'bi-dribbble', modifier: '--primary' },
    { icon: 'bi-bullseye', modifier: '--secondary' },
    { icon: 'bi-trophy', modifier: '--tertiary' },
  ],
  empty: [
    { icon: 'bi-dribbble', modifier: '--primary' },
    { icon: 'bi-clock', modifier: '--secondary' },
    { icon: 'bi-bullseye', modifier: '--tertiary' },
  ],
});

/**
 * @param {'live'|'upcoming'|'empty'} variant
 * @returns {string}
 */
export function renderFeaturedMatchBgIcons(variant) {
  const icons = FEATURED_MATCH_BG_ICONS[variant] ?? FEATURED_MATCH_BG_ICONS.upcoming;

  return `
    <div class="ptw-featured-match__bg-icons" aria-hidden="true">
      ${icons.map(({ icon, modifier }) => `
        <i class="bi ${icon} ptw-featured-match__bg-icon ptw-featured-match__bg-icon${modifier}"></i>
      `).join('')}
    </div>
  `;
}

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
        ${renderFeaturedMatchBgIcons('empty')}
        <div class="card-body ptw-placeholder-card">
          <div class="ptw-dashboard-section-header mb-3">
            <h2 class="ptw-dashboard-section-header__title mb-0" id="ptw-featured-match-heading">Upcoming Match</h2>
          </div>
          <p class="ptw-text-muted mb-0">No upcoming matches scheduled right now.</p>
        </div>
      </section>
    `;
  }

  const prediction = data.featuredMatchPrediction ?? null;
  const predictionStatus = getContestantPredictionUiStatus(match, prediction);
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
 *   countdown: import('../../match/match-countdown.service.js').MatchCountdownDto|null,
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
  const flagClass = 'ptw-team-flag ptw-team-flag--stacked ptw-team-flag--dashboard';
  const homeFlag = renderTeamFlagHtml(getTeamFlagUrl(match.homeTeam), { marginClass: 'me-0', className: flagClass });
  const awayFlag = renderTeamFlagHtml(getTeamFlagUrl(match.awayTeam), { marginClass: 'me-0', className: flagClass });

  const headerRight = showLiveIndicator
    ? '<span class="ptw-live-indicator" aria-hidden="true"><span class="ptw-live-indicator__dot"></span> LIVE NOW</span>'
    : (countdown
      ? renderMatchCountdownFromDto(countdown, {
        id: `ptw-featured-countdown-${match.id}`,
        status: String(match.status ?? ''),
        predictionStatus: String(match.predictionStatus ?? ''),
        predictionOverride: match.predictionOverride ?? undefined,
        variant: 'dashboard',
      })
      : '');

  const customPointsBadge = renderCustomScoringSourceBadge(match.effectiveScoringConfig);
  const scoringPointsHtml = renderMatchScoringPointsHtml(match.effectiveScoringConfig, {
    compact: true,
    variant: 'dashboard',
  });

  const metaHtml = kickoff
    ? `<div class="ptw-featured-match__meta">
        <span class="ptw-featured-match__meta-item">
          <i class="bi bi-calendar3" aria-hidden="true"></i>
          ${escapeHtml(showLiveIndicator ? `Started ${formatDateTime(kickoff)}` : formatDateTime(kickoff))}
        </span>
        ${match.stage ? `
          <span class="ptw-featured-match__meta-item">
            <i class="bi bi-geo-alt" aria-hidden="true"></i>
            ${escapeHtml(match.stage)}
          </span>
        ` : ''}
      </div>`
    : '';

  const bgVariant = showLiveIndicator ? 'live' : 'upcoming';

  return `
    <section class="card ptw-card ${sectionClass} h-100" aria-labelledby="${headingId}">
      ${renderFeaturedMatchBgIcons(bgVariant)}
      <div class="card-body d-flex flex-column">
        <div class="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
          <div class="d-flex align-items-center flex-wrap gap-2">
            <h2 class="ptw-dashboard-section-header__title mb-0" id="${headingId}">${escapeHtml(heading)}</h2>
            ${customPointsBadge}
          </div>
          ${headerRight}
        </div>

        <div class="ptw-featured-match__teams d-flex align-items-center justify-content-center gap-4 flex-wrap mb-3">
          <div class="ptw-featured-match__team text-center">
            ${homeFlag}
            <div class="ptw-featured-match__team-name mt-3">${escapeHtml(homeName)}</div>
          </div>
          <div class="ptw-featured-match__vs">VS</div>
          <div class="ptw-featured-match__team text-center">
            ${awayFlag}
            <div class="ptw-featured-match__team-name mt-3">${escapeHtml(awayName)}</div>
          </div>
        </div>

        ${metaHtml}

        ${scoringPointsHtml ? `<div class="ptw-featured-match__scoring mb-3">${scoringPointsHtml}</div>` : ''}

        ${prediction && !showLiveIndicator ? renderPredictionSummary(prediction) : ''}

        ${actionButtons ? `
          <div class="d-flex flex-wrap gap-2 justify-content-center mt-auto pt-3 w-100">
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
    <div class="ptw-featured-match__prediction">
      <p class="ptw-featured-match__prediction-label mb-2">Your Prediction</p>
      <div class="ptw-featured-match__score-box">
        <span class="ptw-featured-match__score">${escapeHtml(String(homeScore))}</span>
        <span class="ptw-featured-match__score-sep">-</span>
        <span class="ptw-featured-match__score">${escapeHtml(String(awayScore))}</span>
      </div>
    </div>
  `;
}

/**
 * @param {import('../../match/match.service.js').EnrichedMatch} match
 * @param {Record<string, unknown>|null} prediction
 * @param {string} predictionStatus
 * @returns {string}
 */
function renderUpcomingActionButtons(match, prediction, predictionStatus) {
  return renderContestantPredictionActionButtons({
    matchId: match.id,
    predictionStatus,
    resultPublished: Boolean(match.result?.published),
    predictionExists: Boolean(prediction),
    predictionLocked: Boolean(prediction?.locked),
    disabledButtonClass: 'btn btn-secondary ptw-featured-match__action-btn',
    enabledButtonClass: 'btn btn-ptw-primary ptw-featured-match__action-btn',
    editButtonClass: 'btn btn-ptw-primary ptw-featured-match__action-btn',
    predictLabel: 'Predict Match',
  });
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
