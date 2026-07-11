import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  renderAdminListTabs,
  activateAdminListTab,
  consumeAdminTabFlag,
  setAdminTabFlag,
  ADMIN_TAB_STORAGE_KEY,
} from '../public/js/components/admin-list-tabs.component.js';
import { ADMIN_NAV_SECTIONS, CONTESTANT_NAV_SECTIONS, collectNavPaths, isNavPathActive } from '../public/js/components/sidebar-nav.config.js';

describe('admin-list-tabs.component', () => {
  /** @type {Storage|null} */
  let originalSessionStorage;

  beforeEach(() => {
    originalSessionStorage = globalThis.sessionStorage;
    const store = new Map();

    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: {
        getItem: (key) => store.get(key) ?? null,
        setItem: (key, value) => store.set(key, value),
        removeItem: (key) => store.delete(key),
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'sessionStorage', {
      configurable: true,
      value: originalSessionStorage,
    });
  });

  it('renders bootstrap tabs with active tab classes', () => {
    const html = renderAdminListTabs({
      groupId: 'test-tabs',
      activeTabId: 'archived',
      tabs: [
        { id: 'active', label: 'Active', count: 2, contentHtml: '<p>Active list</p>' },
        { id: 'archived', label: 'Archived', count: 1, contentHtml: '<p>Archived list</p>' },
      ],
    });

    assert.match(html, /id="test-tabs-active-tab"/);
    assert.match(html, /id="test-tabs-archived-tab"/);
    assert.match(html, /class="nav-link active"/);
    assert.ok(html.includes('id="test-tabs-archived"'));
    assert.ok(html.includes('class="tab-pane fade show active"'));
    assert.match(html, /Active \(2\)/);
    assert.match(html, /Archived list/);
  });

  it('returns false when the tab button is missing', () => {
    const activated = activateAdminListTab({ querySelector: () => null }, 'archived', 'test-tabs');
    assert.equal(activated, false);
  });

  it('stores and consumes one-time tab flags', () => {
    setAdminTabFlag('matches-archived');
    assert.equal(globalThis.sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY), 'matches-archived');
    assert.equal(consumeAdminTabFlag('matches-archived'), true);
    assert.equal(globalThis.sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY), null);
    assert.equal(consumeAdminTabFlag('matches-archived'), false);
  });
});

describe('sidebar-nav.config admin sections', () => {
  it('groups overview under Dashboard', () => {
    const dashboardGroup = ADMIN_NAV_SECTIONS.find((section) => (
      section.type === 'group' && section.label === 'Dashboard'
    ));

    assert.ok(dashboardGroup && dashboardGroup.type === 'group');
    assert.deepEqual(
      dashboardGroup.children.map((child) => child.path),
      ['/admin'],
    );
    assert.equal(dashboardGroup.children[0].label, 'Overview');
  });

  it('groups tournaments and matches without archived sub-links', () => {
    const tournamentGroup = ADMIN_NAV_SECTIONS.find((section) => (
      section.type === 'group' && section.label === 'Tournament Management'
    ));

    assert.ok(tournamentGroup && tournamentGroup.type === 'group');
    assert.deepEqual(
      tournamentGroup.children.map((child) => child.path),
      ['/admin/tournaments', '/admin/matches'],
    );
    assert.ok(!tournamentGroup.children.some((child) => child.path.includes('archived')));
  });

  it('groups predictions, history, and leaderboard under Predictions', () => {
    const predictionsGroup = ADMIN_NAV_SECTIONS.find((section) => (
      section.type === 'group' && section.label === 'Predictions'
    ));

    assert.ok(predictionsGroup && predictionsGroup.type === 'group');
    assert.deepEqual(
      predictionsGroup.children.map((child) => child.path),
      ['/admin/predictions', '/admin/prediction-history', '/leaderboard'],
    );
  });

  it('groups profile and settings under My Account', () => {
    const accountGroup = ADMIN_NAV_SECTIONS.find((section) => (
      section.type === 'group' && section.label === 'My Account'
    ));

    assert.ok(accountGroup && accountGroup.type === 'group');
    assert.deepEqual(
      accountGroup.children.map((child) => child.path),
      ['/profile', '/settings'],
    );
  });
});

describe('sidebar-nav.config active path matching', () => {
  const contestantNavPaths = collectNavPaths(CONTESTANT_NAV_SECTIONS);

  it('highlights only Prediction History when on /predictions/history', () => {
    assert.equal(isNavPathActive('/predictions/history', '/predictions/history', '/dashboard', contestantNavPaths), true);
    assert.equal(isNavPathActive('/predictions/history', '/predictions', '/dashboard', contestantNavPaths), false);
    assert.equal(isNavPathActive('/predictions/history', '/matches', '/dashboard', contestantNavPaths), false);
  });

  it('highlights only My Predictions when on /predictions', () => {
    assert.equal(isNavPathActive('/predictions', '/predictions', '/dashboard', contestantNavPaths), true);
    assert.equal(isNavPathActive('/predictions', '/predictions/history', '/dashboard', contestantNavPaths), false);
  });

  it('highlights only Archived Tournaments when on /tournaments/archived', () => {
    assert.equal(isNavPathActive('/tournaments/archived', '/tournaments/archived', '/dashboard', contestantNavPaths), true);
    assert.equal(isNavPathActive('/tournaments/archived', '/tournaments', '/dashboard', contestantNavPaths), false);
  });

  it('keeps parent admin routes active for nested detail paths', () => {
    const adminNavPaths = collectNavPaths(ADMIN_NAV_SECTIONS);

    assert.equal(isNavPathActive('/admin/tournaments/t1', '/admin/tournaments', '/admin', adminNavPaths), true);
    assert.equal(isNavPathActive('/admin/matches/m1', '/admin/matches', '/admin', adminNavPaths), true);
    assert.equal(isNavPathActive('/admin/prediction-history/u1', '/admin/prediction-history', '/admin', adminNavPaths), true);
  });
});
