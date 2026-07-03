/**
 * @fileoverview Sidebar navigation configuration for admin and contestant shells.
 * @module components/sidebar-nav.config
 */

/** @type {ReadonlySet<string>} */
export const ADMIN_SHELL_EXACT_PATHS = new Set(['/admin', '/settings', '/leaderboard', '/profile']);

/** @type {ReadonlySet<string>} */
export const CONTESTANT_SHELL_EXACT_PATHS = new Set([
  '/dashboard',
  '/tournaments',
  '/predictions',
  '/score',
  '/matches',
  '/leaderboard',
  '/leaderboard/unavailable',
  '/profile',
  '/settings',
  '/statistics',
]);

/** @type {ReadonlyArray<{ type: 'item', path: string, label: string, icon: string } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }>, hideWhenLeaderboardHidden?: boolean }>} */
export const ADMIN_NAV_SECTIONS = Object.freeze([
  { type: 'item', path: '/admin', label: 'Overview', icon: 'bi-house' },
  {
    type: 'group',
    label: 'Tournament Management',
    icon: 'bi-calendar-event',
    children: [
      { path: '/admin/tournaments', label: 'Tournaments' },
    ],
  },
  { type: 'item', path: '/admin/teams', label: 'Teams', icon: 'bi-people' },
  {
    type: 'group',
    label: 'Match Management',
    icon: 'bi-flag',
    children: [
      { path: '/admin/matches', label: 'Matches' },
      { path: '/admin/predictions', label: 'Predictions' },
    ],
  },
  { type: 'item', path: '/leaderboard', label: 'Leaderboard', icon: 'bi-bar-chart' },
  {
    type: 'group',
    label: 'Administration',
    icon: 'bi-shield-lock',
    children: [
      { path: '/admin/users', label: 'User Management' },
    ],
  },
]);

/** @type {ReadonlyArray<{ type: 'item', path: string, label: string, icon: string } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }>, hideWhenLeaderboardHidden?: boolean }>} */
export const CONTESTANT_NAV_SECTIONS = Object.freeze([
  { type: 'item', path: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
  {
    type: 'group',
    label: 'Tournaments',
    icon: 'bi-trophy',
    children: [
      { path: '/tournaments', label: 'My Tournaments' },
      { path: '/tournaments/archived', label: 'Archived Tournaments' },
    ],
  },
  {
    type: 'group',
    label: 'Predictions',
    icon: 'bi-bullseye',
    children: [
      { path: '/predictions', label: 'My Predictions' },
      { path: '/matches', label: 'Upcoming Matches' },
      { path: '/predictions/history', label: 'Prediction History' },
    ],
  },
  {
    type: 'group',
    label: 'Leaderboard',
    icon: 'bi-bar-chart',
    hideWhenLeaderboardHidden: true,
    children: [
      { path: '/leaderboard', label: 'Tournament Leaderboards' },
    ],
  },
  {
    type: 'group',
    label: 'Statistics',
    icon: 'bi-graph-up',
    children: [
      { path: '/statistics', label: 'My Statistics' },
      { path: '/statistics/performance', label: 'Performance' },
    ],
  },
]);

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
export const ADMIN_ACCOUNT_LINKS = Object.freeze([
  { path: '/profile', label: 'Profile', icon: 'bi-person' },
  { path: '/settings', label: 'Settings', icon: 'bi-gear' },
]);

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
export const CONTESTANT_ACCOUNT_LINKS = Object.freeze([
  { path: '/profile', label: 'Profile', icon: 'bi-person' },
  { path: '/settings', label: 'Settings', icon: 'bi-gear' },
]);

/**
 * @param {string} path
 * @returns {string}
 */
export function normalizeShellPath(path) {
  const trimmed = path.split('?')[0].replace(/\/+$/, '') || '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isAdminShellPath(path) {
  const normalized = normalizeShellPath(path);

  if (ADMIN_SHELL_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return normalized.startsWith('/admin/');
}

/**
 * @param {string} path
 * @returns {boolean}
 */
export function isContestantShellPath(path) {
  const normalized = normalizeShellPath(path);

  if (CONTESTANT_SHELL_EXACT_PATHS.has(normalized)) {
    return true;
  }

  return normalized.startsWith('/tournaments/')
    || normalized.startsWith('/predictions/')
    || normalized.startsWith('/statistics/');
}
