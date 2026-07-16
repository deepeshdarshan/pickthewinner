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
]);

/** @type {ReadonlyArray<{ type: 'item', path: string, label: string, icon: string } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }>, hideWhenLeaderboardHidden?: boolean } | { type: 'divider' }>} */
export const ADMIN_NAV_SECTIONS = Object.freeze([
  {
    type: 'group',
    label: 'Dashboard',
    icon: 'bi-house',
    children: [
      { path: '/admin', label: 'Overview' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'Tournament Management',
    icon: 'bi-trophy',
    children: [
      { path: '/admin/tournaments', label: 'Tournaments' },
      { path: '/admin/matches', label: 'Matches' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'Predictions',
    icon: 'bi-bullseye',
    children: [
      { path: '/admin/predictions', label: 'Predictions' },
      { path: '/admin/prediction-history', label: 'Prediction History' },
      { path: '/leaderboard', label: 'Leaderboard' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'Master Data',
    icon: 'bi-book',
    children: [
      { path: '/admin/teams', label: 'Teams' },
      { path: '/admin/match-stages', label: 'Match Stages' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'Administration',
    icon: 'bi-people',
    children: [
      { path: '/admin/users', label: 'User Management' },
      { path: '/admin/settings', label: 'General Settings' },
    ],
  },
  { type: 'divider' },
  {
    type: 'group',
    label: 'My Account',
    icon: 'bi-person',
    children: [
      { path: '/profile', label: 'Profile' },
      { path: '/settings', label: 'Settings' },
    ],
  },
]);

/** @type {ReadonlyArray<{ type: 'item', path: string, label: string, icon: string, hideWhenLeaderboardHidden?: boolean } | { type: 'group', label: string, icon: string, children: ReadonlyArray<{ path: string, label: string }>, hideWhenLeaderboardHidden?: boolean }>} */
export const CONTESTANT_NAV_SECTIONS = Object.freeze([
  { type: 'item', path: '/dashboard', label: 'Dashboard', icon: 'bi-grid' },
  { type: 'item', path: '/tournaments', label: 'Tournaments', icon: 'bi-trophy' },
  { type: 'item', path: '/matches', label: 'Matches', icon: 'bi-flag' },
  {
    type: 'group',
    label: 'Predictions',
    icon: 'bi-bullseye',
    children: [
      { path: '/predictions', label: 'My Predictions' },
      { path: '/predictions/history', label: 'Prediction History' },
    ],
  },
  {
    type: 'item',
    path: '/leaderboard',
    label: 'Leaderboard',
    icon: 'bi-bar-chart',
    hideWhenLeaderboardHidden: true,
  },
]);

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
export const ADMIN_ACCOUNT_LINKS = Object.freeze([]);

/** @type {ReadonlyArray<{ path: string, label: string, icon: string }>} */
export const CONTESTANT_ACCOUNT_LINKS = Object.freeze([
  { path: '/profile', label: 'Profile', icon: 'bi-person' },
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
 * Collects all navigation paths from sections and account links.
 * @param {ReadonlyArray<{ type: string, path?: string, children?: ReadonlyArray<{ path: string }> }>} sections
 * @param {ReadonlyArray<{ path: string }>} [accountLinks]
 * @returns {string[]}
 */
export function collectNavPaths(sections, accountLinks = []) {
  /** @type {string[]} */
  const paths = [];

  for (const section of sections) {
    if (section.type === 'item' && section.path) {
      paths.push(section.path);
      continue;
    }

    if (section.type === 'group' && section.children) {
      for (const child of section.children) {
        paths.push(child.path);
      }
    }
  }

  for (const link of accountLinks) {
    paths.push(link.path);
  }

  return paths;
}

/**
 * Returns whether a navigation item should be marked active for the current path.
 * Prefers the most specific registered nav path so siblings like
 * `/predictions` and `/predictions/history` do not both highlight.
 * @param {string} activePath
 * @param {string} itemPath
 * @param {string} homePath
 * @param {ReadonlyArray<string>} [allNavPaths]
 * @returns {boolean}
 */
export function isNavPathActive(activePath, itemPath, homePath, allNavPaths = []) {
  const normalizedActive = normalizeShellPath(activePath);
  const normalizedItem = normalizeShellPath(itemPath);

  if (normalizedActive === normalizedItem) {
    return true;
  }

  if (normalizedItem === homePath || !normalizedActive.startsWith(`${normalizedItem}/`)) {
    return false;
  }

  return !hasMoreSpecificNavMatch(normalizedActive, normalizedItem, allNavPaths);
}

/**
 * @param {string} normalizedActive
 * @param {string} normalizedItem
 * @param {ReadonlyArray<string>} allNavPaths
 * @returns {boolean}
 */
function hasMoreSpecificNavMatch(normalizedActive, normalizedItem, allNavPaths) {
  return allNavPaths.some((path) => {
    const normalizedPath = normalizeShellPath(path);

    if (normalizedPath === normalizedItem || !normalizedPath.startsWith(`${normalizedItem}/`)) {
      return false;
    }

    return normalizedActive === normalizedPath
      || normalizedActive.startsWith(`${normalizedPath}/`);
  });
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
    || normalized.startsWith('/matches/')
    || normalized.startsWith('/predictions/');
}
