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
 * @property {'compact'|'default'} [density]
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
    density = 'compact',
  } = options;

  const trendClass = trend
    ? `ptw-stat-card__trend--${trendDirection}`
    : '';

  const showIcon = density !== 'compact' || !trend;

  return `
    <div class="card ptw-card ptw-stat-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start">
          <div class="min-w-0">
            <p class="ptw-stat-card__label mb-1">${label}</p>
            <p class="ptw-stat-card__value mb-0">${value}</p>
            ${trend ? `<p class="ptw-stat-card__trend ${trendClass} mb-0">${trend}</p>` : ''}
          </div>
          ${showIcon ? `
            <div class="ptw-stat-card__icon flex-shrink-0 ms-2" aria-hidden="true">
              <i class="bi ${icon}"></i>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders a row of statistic cards using the compact stat grid.
 * @param {StatisticCardOptions[]} cards
 * @returns {string}
 */
export function renderStatisticCardGrid(cards) {
  const items = cards.map((card) => renderStatisticCard(card)).join('');
  return `<div class="ptw-stat-grid">${items}</div>`;
}

/**
 * Renders a compact inline stat tile.
 * @param {{ label: string, value: string|number, detail?: string }} options
 * @returns {string}
 */
export function renderStatTile(options) {
  const { label, value, detail = '' } = options;
  return `
    <div class="ptw-stat-tile">
      <p class="ptw-stat-tile__label mb-0">${label}</p>
      <p class="ptw-stat-tile__value mb-0">${value}</p>
      ${detail ? `<p class="ptw-stat-tile__detail mb-0">${detail}</p>` : ''}
    </div>
  `;
}

/**
 * Renders a grid of compact stat tiles.
 * @param {Array<{ label: string, value: string|number, detail?: string }>} tiles
 * @returns {string}
 */
export function renderStatTileGrid(tiles) {
  const items = tiles.map((tile) => renderStatTile(tile)).join('');
  return `<div class="ptw-stat-grid">${items}</div>`;
}
