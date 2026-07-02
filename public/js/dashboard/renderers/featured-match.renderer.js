/**
 * @fileoverview Featured upcoming match hero for contestant dashboard.
 * @module dashboard/renderers/featured-match.renderer
 */

import { renderCountdown } from '../../components/countdown.component.js';
import { renderTeamFlagHtml } from '../../master-data/teams/team-flag.util.js';
import { escapeHtml } from '../../utils/html.util.js';
import { formatDateTime } from '../../utils/date.util.js';

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderFeaturedMatchSection(data) {
  const match = data.featuredMatch;

  if (!match) {
    return `
      <section class="card ptw-card ptw-featured-match h-100" aria-labelledby="ptw-featured-match-heading">
        <div class="card-body ptw-placeholder-card">
          <h2 class="h5" id="ptw-featured-match-heading">Upcoming Match</h2>
          <p class="ptw-text-muted mb-0">No upcoming matches scheduled right now.</p>
        </div>
      </section>
    `;
  }

  const kickoff = toDate(match.kickoffUtc);
  const homeName = match.homeTeam?.name ?? 'Home';
  const awayName = match.awayTeam?.name ?? 'Away';
  const homeFlag = renderTeamFlagHtml(match.homeTeam?.flagUrl, { marginClass: 'me-2' });
  const awayFlag = renderTeamFlagHtml(match.awayTeam?.flagUrl, { marginClass: 'me-2' });
  const predictionUrl = `/predictions?action=create&matchId=${encodeURIComponent(match.id)}`;
  const hasPrediction = Boolean(data.featuredMatchPrediction);
  const primaryLabel = hasPrediction ? 'Edit Prediction' : 'Predict Match';
  const primaryUrl = hasPrediction
    ? `/predictions?action=edit&matchId=${encodeURIComponent(match.id)}`
    : predictionUrl;

  return `
    <section class="card ptw-card ptw-featured-match h-100" aria-labelledby="ptw-featured-match-heading">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <span class="badge bg-secondary me-2">${escapeHtml(match.tournamentName ?? 'Tournament')}</span>
          <span class="badge bg-info">${escapeHtml(match.round ?? 'Match')}</span>
        </div>
        ${kickoff ? renderCountdown({ targetDate: kickoff.toISOString(), label: 'Prediction opens in', id: `ptw-featured-countdown-${match.id}` }) : ''}
      </div>
      <div class="card-body">
        <h2 class="h5 mb-4" id="ptw-featured-match-heading">Upcoming Match</h2>
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
          ${kickoff ? `<div><i class="bi bi-clock me-1" aria-hidden="true"></i>${escapeHtml(formatDateTime(kickoff))}</div>` : ''}
          ${match.venueName ? `<div class="ptw-text-muted mt-1"><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${escapeHtml(match.venueName)}</div>` : ''}
        </div>
        <div class="d-flex flex-wrap gap-2 justify-content-center">
          <a href="${primaryUrl}" class="btn btn-ptw-primary" data-route>${escapeHtml(primaryLabel)}</a>
          <button type="button" class="btn btn-outline-light" disabled title="Coming soon">Set Reminder</button>
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
