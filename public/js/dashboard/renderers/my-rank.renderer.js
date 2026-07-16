/**
 * @fileoverview My Rank card for contestant dashboard.
 * @module dashboard/renderers/my-rank.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { renderMatchCardBgIcons } from '../../components/match-card-bg-icons.component.js';

/**
 * @param {number|null} percent
 * @returns {string}
 */
function buildGaugeGradient(percent) {
  const value = percent ?? 0;

  if (value <= 0) {
    return 'conic-gradient(color-mix(in srgb, var(--ptw-color-border) 80%, transparent) 0% 100%)';
  }

  return `conic-gradient(
    var(--ptw-color-primary-blue) 0% ${value}%,
    color-mix(in srgb, var(--ptw-color-border) 70%, transparent) ${value}% 100%
  )`;
}

/**
 * @param {{ icon: string, tone: string, value: string, label: string }} stat
 * @returns {string}
 */
function renderMyRankStat(stat) {
  return `
    <div class="ptw-my-rank-card__stat">
      <div class="ptw-my-rank-card__stat-head">
        <i class="bi ${escapeHtml(stat.icon)} ptw-my-rank-card__stat-icon ptw-my-rank-card__stat-icon--${escapeHtml(stat.tone)}" aria-hidden="true"></i>
        <span class="ptw-my-rank-card__stat-value">${escapeHtml(stat.value)}</span>
      </div>
      <span class="ptw-my-rank-card__stat-label">${escapeHtml(stat.label)}</span>
    </div>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').MyRankSummary} myRank
 * @returns {string}
 */
function renderMyRankBody(myRank) {
  const rankDisplay = myRank.rank !== null ? `#${myRank.rank}` : '—';
  const contestantMeta = myRank.totalContestants > 0
    ? `out of ${myRank.totalContestants} contestants`
    : 'out of — contestants';

  const rankMeta = !myRank.hasLeaderboardEntry
    ? 'Make predictions to appear on the leaderboard'
    : contestantMeta;

  const gaugePercent = myRank.betterThanPercent ?? 0;
  const gaugeLabel = myRank.betterThanPercent !== null
    ? `${myRank.betterThanPercent}%`
    : '—';

  const predictionsValue = myRank.predictionsTotal > 0
    ? `${myRank.predictionsSubmitted}/${myRank.predictionsTotal}`
    : `${myRank.predictionsSubmitted}`;

  return `
    <div class="ptw-my-rank-card__main">
      <div class="ptw-my-rank-card__rank-block">
        <div class="ptw-my-rank-card__rank-value">${escapeHtml(rankDisplay)}</div>
        <p class="ptw-my-rank-card__rank-meta mb-0">${escapeHtml(rankMeta)}</p>
      </div>
      <div
        class="ptw-my-rank-card__gauge"
        style="background: ${buildGaugeGradient(gaugePercent)}"
        role="img"
        aria-label="${escapeHtml(myRank.betterThanPercent !== null ? `${myRank.betterThanPercent}% better than others` : 'Rank comparison unavailable')}"
      >
        <div class="ptw-my-rank-card__gauge-inner">
          <span class="ptw-my-rank-card__gauge-value">${escapeHtml(gaugeLabel)}</span>
          <span class="ptw-my-rank-card__gauge-label">Better than others</span>
        </div>
      </div>
    </div>

    <div class="ptw-my-rank-card__stats" role="group" aria-label="Ranking statistics">
      ${renderMyRankStat({
    icon: 'bi-star-fill',
    tone: 'gold',
    value: String(myRank.points),
    label: 'Points',
  })}
      ${renderMyRankStat({
    icon: 'bi-bullseye',
    tone: 'danger',
    value: `${myRank.accuracy}%`,
    label: 'Accuracy',
  })}
      ${renderMyRankStat({
    icon: 'bi-dribbble',
    tone: 'purple',
    value: predictionsValue,
    label: 'Predictions',
  })}
    </div>
  `;
}

/**
 * @param {import('../ContestantDashboardService.js').ContestantDashboardDto} data
 * @returns {string}
 */
export function renderMyRankSection(data) {
  const myRank = data.myRank;

  if (!myRank) {
    return '';
  }

  const bodyHtml = myRank.isAvailable
    ? renderMyRankBody(myRank)
    : `<p class="ptw-my-rank-card__pending mb-0">${escapeHtml(data.leaderboardPendingMessage)}</p>`;

  const topBadgeHtml = myRank.isAvailable && myRank.topPercentLabel
    ? `
      <span class="ptw-my-rank-card__top-badge">
        <i class="bi bi-award-fill" aria-hidden="true"></i>
        ${escapeHtml(myRank.topPercentLabel)}
      </span>
    `
    : '';

  return `
    <section class="ptw-my-rank-card" aria-labelledby="ptw-my-rank-heading">
      ${renderMatchCardBgIcons('rank')}
      <header class="ptw-my-rank-card__header">
        <h2 class="ptw-my-rank-card__title mb-0" id="ptw-my-rank-heading">
          <i class="bi bi-trophy-fill ptw-my-rank-card__title-icon" aria-hidden="true"></i>
          My Rank
        </h2>
        ${topBadgeHtml}
      </header>

      <div class="ptw-my-rank-card__body">
        ${bodyHtml}
      </div>

      <footer class="ptw-my-rank-card__footer">
        <a
          href="${escapeHtml(data.leaderboardPath)}"
          class="btn btn-ptw-primary ptw-active-tournament-hero__cta w-100${myRank.isAvailable ? '' : ' disabled'}"
          data-route
          ${myRank.isAvailable ? '' : 'aria-disabled="true" tabindex="-1"'}
        >
          <i class="bi bi-bar-chart me-2" aria-hidden="true"></i>View Leaderboard
        </a>
      </footer>
    </section>
  `;
}
