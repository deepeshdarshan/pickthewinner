/**
 * @fileoverview Predictions page placeholder.
 * @module pages/predictions.page
 */

import { mountPlaceholderPage } from './page-placeholder.js';

/**
 * Renders the predictions page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  mountPlaceholderPage(outlet, {
    title: 'My Predictions',
    subtitle: 'Your match predictions',
    icon: 'bi-bullseye',
    description: 'Prediction entry and editing will appear here.',
  });
}
