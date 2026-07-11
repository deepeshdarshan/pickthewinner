/**
 * @fileoverview Timeline view renderer for prediction history.
 * @module prediction/history/renderers/prediction-history-timeline.renderer
 */

import { escapeHtml } from '../../../utils/html.util.js';
import { PredictionHistoryDomain } from '../../../domain/prediction-history.domain.js';
import { renderHistoryCard } from './prediction-history-card.renderer.js';

/**
 * @typedef {import('../../../domain/prediction-history.domain.js').HistoryItem} HistoryItem
 */

/**
 * @param {HistoryItem[]} items
 * @returns {string}
 */
export function renderHistoryTimeline(items) {
  if (items.length === 0) {
    return '';
  }

  const groups = PredictionHistoryDomain.groupByMonth(items);

  return `
    <div class="ptw-prediction-timeline">
      ${groups.map((group) => `
        <section class="ptw-prediction-timeline__group mb-4" aria-label="${escapeHtml(group.label)}">
          <h2 class="h6 text-uppercase mb-3 ptw-prediction-timeline__group-label">${escapeHtml(group.label)}</h2>
          <ol class="list-unstyled mb-0 ptw-prediction-timeline__list">
            ${group.items.map((item) => renderTimelineItem(item)).join('')}
          </ol>
        </section>
      `).join('')}
    </div>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {string}
 */
function renderTimelineItem(item) {
  const markerTone = resolveTimelineMarkerTone(item);

  return `
    <li class="ptw-prediction-timeline__item">
      <div class="ptw-prediction-timeline__marker" aria-hidden="true">
        <span class="ptw-prediction-timeline__marker-dot ptw-prediction-timeline__marker-dot--${markerTone}"></span>
      </div>
      ${renderHistoryCard(item, { asTimelineContent: true })}
    </li>
  `;
}

/**
 * @param {HistoryItem} item
 * @returns {'success'|'failed'|'pending'}
 */
function resolveTimelineMarkerTone(item) {
  const hasResult = Boolean(item.match?.result?.published);

  if (!hasResult) {
    return 'pending';
  }

  return Number(item.calculatedPoints ?? 0) > 0 ? 'success' : 'failed';
}
