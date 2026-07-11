/**
 * @fileoverview Shared performance card layout used by leaderboard, predictions, and history cards.
 * @module shared/cards/performance-card.component
 */

import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {Object} PerformanceCardStat
 * @property {string} icon
 * @property {string} value
 * @property {string} label
 * @property {'primary'|'success'|'info'|'warning'|'danger'|'default'} [tone]
 */

/**
 * @typedef {Object} PerformanceCardHeaderOptions
 * @property {string} [indicatorHtml]
 * @property {string} [avatarHtml]
 * @property {string} title
 * @property {string} [subtitle]
 * @property {string} [badgeHtml]
 * @property {string} [pointsValue]
 * @property {string} [pointsLabel]
 * @property {'gold'|'primary'|'success'|'default'} [pointsTone]
 */

/**
 * @typedef {Object} PerformanceCardFooterOptions
 * @property {string} [leftIcon]
 * @property {string} [leftValue]
 * @property {string} [leftLabel]
 * @property {string} [rightHtml]
 * @property {boolean} [inline] Keep left/right content on one row on mobile
 */

/**
 * @typedef {Object} PerformanceCardFooterMetaItem
 * @property {string} icon
 * @property {string} label
 * @property {string|number} value
 */

/**
 * @param {PerformanceCardHeaderOptions} options
 * @returns {string}
 */
export function renderPerformanceCardHeader(options) {
  const {
    indicatorHtml = '',
    avatarHtml = '',
    title,
    subtitle = '',
    badgeHtml = '',
    pointsValue = '',
    pointsLabel = '',
    pointsTone = 'primary',
  } = options;

  const pointsHtml = pointsValue !== ''
    ? `
      <div class="ptw-performance-card__points">
        <div class="ptw-performance-card__points-value ptw-performance-card__points-value--${escapeHtml(pointsTone)}">
          ${escapeHtml(pointsValue)}
        </div>
        ${pointsLabel ? `<div class="ptw-performance-card__points-label">${escapeHtml(pointsLabel)}</div>` : ''}
      </div>
    `
    : '';

  return `
    <div class="ptw-performance-card__header">
      ${indicatorHtml}
      ${avatarHtml}
      <div class="ptw-performance-card__identity min-w-0">
        <h3 class="ptw-performance-card__title mb-0">${title}</h3>
        ${subtitle ? `<p class="ptw-performance-card__subtitle mb-0">${subtitle}</p>` : ''}
        ${badgeHtml}
      </div>
      ${pointsHtml}
    </div>
  `;
}

/**
 * @param {PerformanceCardStat[]} stats
 * @returns {string}
 */
export function renderPerformanceCardStats(stats) {
  if (!stats.length) {
    return '';
  }

  return `
    <div class="ptw-performance-card__stats" role="group" aria-label="Match statistics">
      ${stats.map((stat) => `
        <div class="ptw-performance-card__stat">
          <div class="ptw-performance-card__stat-head">
            <i class="bi ${escapeHtml(stat.icon)} ptw-performance-card__stat-icon ptw-performance-card__stat-icon--${escapeHtml(stat.tone ?? 'default')}" aria-hidden="true"></i>
            <span class="ptw-performance-card__stat-value ptw-performance-card__stat-value--${escapeHtml(stat.tone ?? 'default')}">${stat.value}</span>
          </div>
          <span class="ptw-performance-card__stat-label">${escapeHtml(stat.label)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * @param {PerformanceCardFooterMetaItem[]} items
 * @returns {string}
 */
export function renderPerformanceCardFooterMeta(items) {
  if (!items.length) {
    return '';
  }

  return `
    <div class="ptw-performance-card__footer-meta">
      ${items.map((item) => `
        <div class="ptw-performance-card__footer-meta-item">
          <i class="bi ${escapeHtml(item.icon)} ptw-performance-card__footer-meta-icon" aria-hidden="true"></i>
          <span class="ptw-performance-card__footer-meta-text">
            <span class="ptw-performance-card__footer-meta-label">${escapeHtml(item.label)}:</span>
            <span class="ptw-performance-card__footer-meta-value">${escapeHtml(String(item.value))}</span>
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * @param {PerformanceCardFooterOptions} options
 * @returns {string}
 */
export function renderPerformanceCardFooter(options) {
  const {
    leftIcon = '',
    leftValue = '',
    leftLabel = '',
    rightHtml = '',
    inline = false,
  } = options;

  if (!leftValue && !rightHtml) {
    return '';
  }

  const leftHtml = leftValue
    ? `
      <div class="ptw-performance-card__footer-main">
        ${leftIcon ? `<i class="bi ${escapeHtml(leftIcon)} ptw-performance-card__footer-icon" aria-hidden="true"></i>` : ''}
        <div>
          <div class="ptw-performance-card__footer-value">${leftValue}</div>
          ${leftLabel ? `<div class="ptw-performance-card__footer-label">${escapeHtml(leftLabel)}</div>` : ''}
        </div>
      </div>
    `
    : '<div></div>';

  return `
    <div class="ptw-performance-card__footer${inline ? ' ptw-performance-card__footer--inline' : ''}">
      ${leftHtml}
      ${rightHtml ? `<div class="ptw-performance-card__footer-side">${rightHtml}</div>` : ''}
    </div>
  `;
}

/**
 * @param {string} html
 * @returns {string}
 */
export function renderPerformanceCardBody(html) {
  return `<div class="ptw-performance-card__body">${html}</div>`;
}
