/**
 * @fileoverview Featured live and upcoming match sections for admin dashboard.
 * @module dashboard/renderers/admin-featured-match.renderer
 */

import { renderMatchCountdownFromDto } from '../../components/countdown.component.js';
import { getTeamFlagUrl, renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import {
  renderCustomScoringSourceBadge,
  renderMatchScoringPointsHtml,
} from '../../match/renderers/match-scoring-points.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateTime } from '../../utils/date.util.js';

/**
 * @param {import('../AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
export function renderAdminLiveMatchSection(data) {
  const match = data.featuredLiveMatch;

  if (!match) {
    return '';
  }

  return renderAdminMatchSpotlightCard({
    match,
    data,
    headingId: 'ptw-admin-live-match-heading',
    heading: 'Live Now',
    sectionClass: 'ptw-featured-match ptw-featured-match--live ptw-live-match',
    showLiveIndicator: true,
    countdown: null,
  });
}

/**
 * @param {import('../AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
export function renderAdminFeaturedMatchSection(data) {
  const match = data.featuredMatch;

  if (!match) {
    return `
      <section class="card ptw-card ptw-featured-match ptw-upcoming-match h-100" aria-labelledby="ptw-admin-featured-match-heading">
        <div class="card-body ptw-placeholder-card">
          <div class="ptw-dashboard-section-header mb-3">
            <h2 class="ptw-dashboard-section-header__title mb-0" id="ptw-admin-featured-match-heading">Upcoming Match</h2>
          </div>
          <p class="ptw-text-muted mb-0">No upcoming matches scheduled right now.</p>
        </div>
      </section>
    `;
  }

  return renderAdminMatchSpotlightCard({
    match,
    data,
    headingId: 'ptw-admin-featured-match-heading',
    heading: 'Upcoming Match',
    sectionClass: 'ptw-featured-match ptw-upcoming-match',
    showLiveIndicator: false,
    countdown: data.featuredMatchCountdown,
  });
}

/**
 * @param {{
 *   match: import('../../match/match.service.js').EnrichedMatch,
 *   data: import('../AdminDashboardService.js').AdminDashboardDto,
 *   headingId: string,
 *   heading: string,
 *   sectionClass: string,
 *   showLiveIndicator: boolean,
 *   countdown: import('../../match/match-countdown.service.js').MatchCountdownDto|null,
 * }} options
 * @returns {string}
 */
function renderAdminMatchSpotlightCard(options) {
  const { match, data, headingId, heading, sectionClass, showLiveIndicator, countdown } = options;

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
        id: `ptw-admin-featured-countdown-${match.id}`,
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

  const manageUrl = `${data.matchesPath}?id=${encodeURIComponent(match.id)}`;

  return `
    <section class="card ptw-card ${sectionClass} h-100" aria-labelledby="${headingId}">
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

        <div class="d-flex flex-column flex-sm-row flex-wrap gap-2 justify-content-center mt-auto pt-3">
          <a href="${escapeHtml(manageUrl)}" class="btn btn-ptw-primary ptw-featured-match__action-btn flex-fill" data-route>
            <i class="bi bi-pencil-square me-2" aria-hidden="true"></i>Manage Match
          </a>
          <a href="${escapeHtml(data.predictionsPath)}" class="btn btn-outline-light ptw-featured-match__action-btn flex-fill" data-route>
            <i class="bi bi-list-check me-2" aria-hidden="true"></i>View Predictions
          </a>
        </div>
      </div>
    </section>
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
