/**
 * @fileoverview Admin section placeholder — shared renderer for admin sub-routes.
 * @module pages/admin-section.page
 */

import { mountPlaceholderPage } from './page-placeholder.js';

/** @type {Readonly<Record<string, { title: string, subtitle: string, icon: string, description: string }>>} */
const ADMIN_SECTIONS = Object.freeze({
  tournaments: {
    title: 'Tournaments',
    subtitle: 'Manage tournaments',
    icon: 'bi-calendar-event',
    description: 'Tournament creation and management will appear here.',
  },
  matches: {
    title: 'Matches',
    subtitle: 'Manage matches',
    icon: 'bi-flag',
    description: 'Match scheduling and lifecycle management will appear here.',
  },
  results: {
    title: 'Results',
    subtitle: 'Publish match results',
    icon: 'bi-clipboard-check',
    description: 'Result publishing will appear here.',
  },
  users: {
    title: 'Users',
    subtitle: 'Manage contestants',
    icon: 'bi-people',
    description: 'Contestant management will appear here.',
  },
  settings: {
    title: 'Admin Settings',
    subtitle: 'Application configuration',
    icon: 'bi-gear',
    description: 'Admin settings will appear here.',
  },
});

/**
 * Renders an admin section placeholder based on the current path.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const sectionKey = window.location.pathname.split('/').pop() ?? '';
  const config = ADMIN_SECTIONS[sectionKey] ?? {
    title: 'Admin',
    subtitle: 'Administration',
    icon: 'bi-shield-lock',
    description: 'This admin section is coming soon.',
  };

  mountPlaceholderPage(outlet, config);
}
