/**
 * @fileoverview Bootstrap tab shell for admin list pages (active / archived).
 * @module components/admin-list-tabs.component
 */

import { escapeHtml } from '../utils/html.util.js';

/** @type {string} */
export const ADMIN_TAB_STORAGE_KEY = 'ptw-admin-tab';

/**
 * @typedef {Object} AdminListTab
 * @property {string} id
 * @property {string} label
 * @property {number} [count]
 * @property {string} contentHtml
 */

/**
 * @typedef {Object} AdminListTabsOptions
 * @property {ReadonlyArray<AdminListTab>} tabs
 * @property {string} [activeTabId]
 * @property {string} [groupId='ptw-admin-list-tabs']
 */

/**
 * @param {AdminListTabsOptions} options
 * @returns {string}
 */
export function renderAdminListTabs(options) {
  const { tabs, activeTabId, groupId = 'ptw-admin-list-tabs' } = options;
  const resolvedActiveId = activeTabId && tabs.some((tab) => tab.id === activeTabId)
    ? activeTabId
    : tabs[0]?.id ?? '';

  const tabButtons = tabs.map((tab) => {
    const isActive = tab.id === resolvedActiveId;
    const countSuffix = typeof tab.count === 'number' ? ` (${tab.count})` : '';

    return `
      <li class="nav-item" role="presentation">
        <button
          class="nav-link${isActive ? ' active' : ''}"
          id="${escapeHtml(groupId)}-${escapeHtml(tab.id)}-tab"
          data-bs-toggle="tab"
          data-bs-target="#${escapeHtml(groupId)}-${escapeHtml(tab.id)}"
          type="button"
          role="tab"
          aria-controls="${escapeHtml(groupId)}-${escapeHtml(tab.id)}"
          aria-selected="${isActive ? 'true' : 'false'}"
        >
          ${escapeHtml(tab.label)}${countSuffix}
        </button>
      </li>
    `;
  }).join('');

  const tabPanes = tabs.map((tab) => {
    const isActive = tab.id === resolvedActiveId;

    return `
      <div
        class="tab-pane fade${isActive ? ' show active' : ''}"
        id="${escapeHtml(groupId)}-${escapeHtml(tab.id)}"
        role="tabpanel"
        aria-labelledby="${escapeHtml(groupId)}-${escapeHtml(tab.id)}-tab"
        tabindex="0"
      >
        ${tab.contentHtml}
      </div>
    `;
  }).join('');

  return `
    <div class="ptw-admin-list-tabs" data-ptw-admin-list-tabs="${escapeHtml(groupId)}">
      <ul class="nav nav-tabs ptw-admin-list-tabs__nav mb-3" role="tablist">
        ${tabButtons}
      </ul>
      <div class="tab-content ptw-admin-list-tabs__content">
        ${tabPanes}
      </div>
    </div>
  `;
}

/**
 * Activates a tab programmatically (e.g. after redirect from legacy archived route).
 * @param {HTMLElement} container
 * @param {string} tabId
 * @param {string} [groupId='ptw-admin-list-tabs']
 * @returns {boolean}
 */
export function activateAdminListTab(container, tabId, groupId = 'ptw-admin-list-tabs') {
  const tabButton = container.querySelector(`#${groupId}-${tabId}-tab`);

  if (!tabButton || tabButton.tagName !== 'BUTTON') {
    return false;
  }

  if (typeof window.bootstrap !== 'undefined' && window.bootstrap.Tab) {
    const tab = window.bootstrap.Tab.getOrCreateInstance(tabButton);
    tab.show();
    return true;
  }

  const group = container.querySelector(`[data-ptw-admin-list-tabs="${groupId}"]`);

  if (!group) {
    return false;
  }

  group.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active');
    link.setAttribute('aria-selected', 'false');
  });

  group.querySelectorAll('.tab-pane').forEach((pane) => {
    pane.classList.remove('show', 'active');
  });

  tabButton.classList.add('active');
  tabButton.setAttribute('aria-selected', 'true');

  const pane = container.querySelector(`#${groupId}-${tabId}`);

  if (pane) {
    pane.classList.add('show', 'active');
  }

  return true;
}

/**
 * Reads and clears a one-time sessionStorage tab activation flag.
 * @param {string} expectedValue
 * @returns {boolean}
 */
export function consumeAdminTabFlag(expectedValue) {
  try {
    const stored = sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY);

    if (stored === expectedValue) {
      sessionStorage.removeItem(ADMIN_TAB_STORAGE_KEY);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Sets a one-time sessionStorage flag to activate a tab after navigation.
 * @param {string} value
 * @returns {void}
 */
export function setAdminTabFlag(value) {
  try {
    sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, value);
  } catch {
    // sessionStorage may be unavailable
  }
}
