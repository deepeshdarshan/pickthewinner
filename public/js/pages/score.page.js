/**
 * @fileoverview Score page placeholder.
 * @module pages/score.page
 */

import { mountPlaceholderPage } from './page-placeholder.js';

/**
 * Renders the score page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  mountPlaceholderPage(outlet, {
    title: 'Score',
    subtitle: 'Your tournament points and ranking',
    icon: 'bi-bar-chart',
    description: 'Your personal score summary will appear here.',
  });
}
