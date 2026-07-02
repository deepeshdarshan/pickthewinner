/**
 * @fileoverview Contestant section placeholder — shared renderer for contestant sub-routes.
 * @module pages/contestant-section.page
 */

import { mountPlaceholderPage } from './page-placeholder.js';

/** @type {Readonly<Record<string, { title: string, subtitle: string, icon: string, description: string }>>} */
const CONTESTANT_SECTIONS = Object.freeze({
  archived: {
    title: 'Archived Tournaments',
    subtitle: 'Past tournaments',
    icon: 'bi-archive',
    description: 'Browse archived tournaments will appear here.',
  },
  history: {
    title: 'Prediction History',
    subtitle: 'Your past predictions',
    icon: 'bi-clock-history',
    description: 'A full prediction history view will appear here.',
  },
  statistics: {
    title: 'My Statistics',
    subtitle: 'Performance overview',
    icon: 'bi-graph-up',
    description: 'Detailed statistics will appear here.',
  },
  performance: {
    title: 'Performance',
    subtitle: 'Accuracy and trends',
    icon: 'bi-speedometer2',
    description: 'Performance analytics will appear here.',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Preferences and account',
    icon: 'bi-gear',
    description: 'Contestant settings will appear here.',
  },
});

/**
 * Renders a contestant section placeholder based on the current path.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const segments = window.location.pathname.split('/').filter(Boolean);
  const sectionKey = segments[segments.length - 1] ?? '';
  const config = CONTESTANT_SECTIONS[sectionKey] ?? {
    title: 'Coming Soon',
    subtitle: 'Contestant feature',
    icon: 'bi-hourglass-split',
    description: 'This section is coming soon.',
  };

  mountPlaceholderPage(outlet, { ...config, shell: 'contestant' });
}
