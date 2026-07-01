/**
 * @fileoverview Statistic card component for displaying metrics.
 * @module components/statistic-card.component
 */

/**
 * @typedef {Object} StatisticCardOptions
 * @property {string} label
 * @property {string|number} value
 * @property {string} [icon]
 * @property {string} [trend]
 * @property {'up'|'down'|'neutral'} [trendDirection]
 */

/**
 * Renders a statistic card.
 * @param {StatisticCardOptions} options
 * @returns {string}
 */
export function renderStatisticCard(options) {
  const {
    label,
    value,
    icon = 'bi-bar-chart',
    trend = '',
    trendDirection = 'neutral',
  } = options;

  const trendClass = trend
    ? `ptw-stat-card__trend--${trendDirection}`
    : '';

  return `
    <div class="card ptw-card ptw-stat-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <p class="ptw-stat-card__label mb-1">${label}</p>
            <p class="ptw-stat-card__value mb-0">${value}</p>
            ${trend ? `<p class="ptw-stat-card__trend ${trendClass} mb-0">${trend}</p>` : ''}
          </div>
          <div class="ptw-stat-card__icon" aria-hidden="true">
            <i class="bi ${icon}"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a row of statistic cards.
 * @param {StatisticCardOptions[]} cards
 * @returns {string}
 */
export function renderStatisticCardGrid(cards) {
  const items = cards.map((card) => `
    <div class="col-6 col-md-3">
      ${renderStatisticCard(card)}
    </div>
  `).join('');

  return `<div class="row g-3">${items}</div>`;
}
