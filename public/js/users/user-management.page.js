/**
 * @fileoverview User management page — admin interface for managing users.
 * @module users/user-management.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { UserAdminService } from './user-admin.service.js';
import { UserAdminDomain } from '../domain/user-admin.domain.js';
import { getCachedProfile } from './user.service.js';
import { USER_MESSAGES } from './user.constants.js';
import { showToast } from '../components/toast.component.js';
import { Logger } from '../utils/logger.util.js';
import {
  renderUserTable,
  renderUserCards,
  renderUserStatistics,
  renderUserFilters,
  renderLockUserModal,
  renderUnlockUserModal,
  renderPaginationControls,
} from './renderers/user-admin.renderer.js';

/** @typedef {import('./user.service.js').UserProfile} UserProfile */

/**
 * Page state
 */
const state = {
  users: /** @type {UserProfile[]} */ ([]),
  filteredUsers: /** @type {UserProfile[]} */ ([]),
  statistics: null,
  filters: {
    status: '',
    role: '',
    search: '',
  },
  currentPage: 1,
  pageSize: 25,
  lastDoc: null,
  hasMore: false,
  loading: false,
  selectedUser: /** @type {UserProfile|null} */ (null),
};

/**
 * Renders the user management page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initUserManagement(outlet);
}

/**
 * Initializes the user management page.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initUserManagement(outlet) {
  renderPageSkeleton(outlet);

  try {
    // Load statistics and users in parallel
    const [statistics, usersResult] = await Promise.all([
      UserAdminService.getUserStatistics(),
      UserAdminService.getAllUsers({ pageSize: state.pageSize }),
    ]);

    state.statistics = statistics;
    state.users = usersResult.users;
    state.filteredUsers = usersResult.users;
    state.lastDoc = usersResult.lastDoc;
    state.hasMore = usersResult.hasMore;

    renderPage(outlet);
    bindEvents(outlet);
  } catch (error) {
    Logger.error('[UserManagement] Failed to load users:', error);
    showToast(USER_MESSAGES.USERS_LOAD_FAILED, 'error');
    renderErrorState(outlet);
  }
}

/**
 * Renders the page skeleton with loading state.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderPageSkeleton(outlet) {
  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'User Management',
        subtitle: 'Manage all registered users and their access',
        actionsHtml: '',
      })}
      
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading users…</span>
        </div>
        <p class="mt-3 text-muted">${USER_MESSAGES.LOADING_USERS}</p>
      </div>
    </div>
  `;
}

/**
 * Renders the full page with data.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderPage(outlet) {
  const isMobile = window.innerWidth < 768;
  const userListHtml = isMobile
    ? renderUserCards(state.filteredUsers)
    : renderUserTable(state.filteredUsers);

  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'User Management',
        subtitle: 'Manage all registered users and their access',
        actionsHtml: `
          <button class="btn btn-outline-light btn-sm" id="refreshBtn">
            <i class="bi bi-arrow-clockwise" aria-hidden="true"></i> Refresh
          </button>
        `,
      })}
      
      ${state.statistics ? renderUserStatistics(state.statistics) : ''}
      
      <div class="card ptw-card">
        <div class="card-body">
          ${renderUserFilters(state.filters)}
          
          <div id="userListContainer">
            ${userListHtml}
          </div>
          
          ${renderPaginationControls({
            currentPage: state.currentPage,
            hasMore: state.hasMore,
            totalDisplayed: state.filteredUsers.length,
          })}
        </div>
      </div>
    </div>
    
    <div id="modalContainer"></div>
  `;
}

/**
 * Renders error state.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderErrorState(outlet) {
  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'User Management',
        subtitle: 'Manage all registered users and their access',
        actionsHtml: '',
      })}
      
      <div class="card ptw-card">
        <div class="card-body text-center py-5">
          <i class="bi bi-exclamation-triangle text-danger" style="font-size: 3rem;" aria-hidden="true"></i>
          <h3 class="h5 mt-3">${USER_MESSAGES.USERS_LOAD_FAILED}</h3>
          <button class="btn btn-ptw-primary mt-3" onclick="window.location.reload()">
            <i class="bi bi-arrow-clockwise me-2" aria-hidden="true"></i>
            Retry
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Binds event handlers.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function bindEvents(outlet) {
  // Refresh button
  const refreshBtn = outlet.querySelector('#refreshBtn');

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      void initUserManagement(outlet);
    });
  }

  // View profile buttons
  outlet.querySelectorAll('.view-profile-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const uid = /** @type {HTMLElement} */ (e.currentTarget).dataset.uid;

      if (uid) {
        window.history.pushState({}, '', `/admin/users/${uid}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    });
  });

  // Lock user buttons
  outlet.querySelectorAll('.lock-user-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const uid = /** @type {HTMLElement} */ (e.currentTarget).dataset.uid;
      const user = state.users.find((u) => u.uid === uid);

      if (user) {
        await showLockUserModal(user, outlet);
      }
    });
  });

  // Unlock user buttons
  outlet.querySelectorAll('.unlock-user-btn').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const uid = /** @type {HTMLElement} */ (e.currentTarget).dataset.uid;
      const user = state.users.find((u) => u.uid === uid);

      if (user) {
        await showUnlockUserModal(user, outlet);
      }
    });
  });

  // Filter handlers
  const statusFilter = outlet.querySelector('#statusFilter');
  const roleFilter = outlet.querySelector('#roleFilter');
  const searchInput = outlet.querySelector('#searchQuery');

  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      state.filters.status = /** @type {HTMLSelectElement} */ (statusFilter).value;
      applyFilters();
      updateUserList(outlet);
    });
  }

  if (roleFilter) {
    roleFilter.addEventListener('change', () => {
      state.filters.role = /** @type {HTMLSelectElement} */ (roleFilter).value;
      applyFilters();
      updateUserList(outlet);
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = window.setTimeout(() => {
        state.filters.search = /** @type {HTMLInputElement} */ (searchInput).value;
        void performSearch(outlet);
      }, 300);
    });
  }

  // Pagination handlers
  const prevBtn = outlet.querySelector('#prevPageBtn');
  const nextBtn = outlet.querySelector('#nextPageBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      // Previous page not implemented for Firestore cursor pagination
      showToast('Previous page navigation coming soon.', 'info');
    });
  }

  if (nextBtn && state.hasMore) {
    nextBtn.addEventListener('click', async () => {
      await loadNextPage(outlet);
    });
  }
}

/**
 * Applies filters to the user list.
 * @returns {void}
 */
function applyFilters() {
  let filtered = [...state.users];

  if (state.filters.status) {
    filtered = filtered.filter((u) => u.status === state.filters.status);
  }

  if (state.filters.role) {
    filtered = filtered.filter((u) => u.role === state.filters.role);
  }

  state.filteredUsers = filtered;
}

/**
 * Performs search.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function performSearch(outlet) {
  if (!state.filters.search.trim()) {
    state.filteredUsers = state.users;
    updateUserList(outlet);
    return;
  }

  try {
    const results = await UserAdminService.searchUsers(state.filters.search);
    state.filteredUsers = results;
    updateUserList(outlet);
  } catch (error) {
    Logger.error('[UserManagement] Search failed:', error);
    showToast('Search failed. Please try again.', 'error');
  }
}

/**
 * Updates the user list display.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function updateUserList(outlet) {
  const container = outlet.querySelector('#userListContainer');

  if (!container) {
    return;
  }

  const isMobile = window.innerWidth < 768;
  container.innerHTML = isMobile
    ? renderUserCards(state.filteredUsers)
    : renderUserTable(state.filteredUsers);

  bindEvents(outlet);
}

/**
 * Loads the next page of users.
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function loadNextPage(outlet) {
  if (state.loading || !state.hasMore) {
    return;
  }

  state.loading = true;

  try {
    const result = await UserAdminService.getAllUsers({
      pageSize: state.pageSize,
      startAfterDoc: state.lastDoc,
    });

    state.users = [...state.users, ...result.users];
    state.filteredUsers = [...state.filteredUsers, ...result.users];
    state.lastDoc = result.lastDoc;
    state.hasMore = result.hasMore;
    state.currentPage += 1;

    updateUserList(outlet);
  } catch (error) {
    Logger.error('[UserManagement] Failed to load next page:', error);
    showToast('Failed to load more users.', 'error');
  } finally {
    state.loading = false;
  }
}

/**
 * Shows the lock user modal.
 * @param {UserProfile} user
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function showLockUserModal(user, outlet) {
  const adminProfile = getCachedProfile();
  const validation = UserAdminDomain.canLockUser(user, adminProfile);

  if (!validation.allowed) {
    showToast(validation.reason ?? USER_MESSAGES.PERMISSION_DENIED, 'error');
    return;
  }

  const modalContainer = outlet.querySelector('#modalContainer');

  if (!modalContainer) {
    return;
  }

  modalContainer.innerHTML = renderLockUserModal(user);

  const modalEl = modalContainer.querySelector('#lockUserModal');

  if (!modalEl) {
    return;
  }

  const modal = new window.bootstrap.Modal(modalEl);
  modal.show();

  const confirmBtn = modalEl.querySelector('#confirmLockBtn');
  const reasonInput = /** @type {HTMLTextAreaElement|null} */ (modalEl.querySelector('#lockReason'));

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Locking…';

      try {
        const reason = reasonInput?.value.trim() ?? '';
        await UserAdminService.lockUser(user.uid, adminProfile?.uid ?? '', reason);

        modal.hide();
        showToast(USER_MESSAGES.USER_LOCKED_SUCCESS, 'success');

        // Refresh the page
        await initUserManagement(outlet);
      } catch (error) {
        Logger.error('[UserManagement] Failed to lock user:', error);
        showToast(USER_MESSAGES.USER_LOCK_FAILED, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-lock-fill me-2" aria-hidden="true"></i>Lock User';
      }
    });
  }
}

/**
 * Shows the unlock user modal.
 * @param {UserProfile} user
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function showUnlockUserModal(user, outlet) {
  const adminProfile = getCachedProfile();
  const validation = UserAdminDomain.canUnlockUser(user, adminProfile);

  if (!validation.allowed) {
    showToast(validation.reason ?? USER_MESSAGES.PERMISSION_DENIED, 'error');
    return;
  }

  const modalContainer = outlet.querySelector('#modalContainer');

  if (!modalContainer) {
    return;
  }

  modalContainer.innerHTML = renderUnlockUserModal(user);

  const modalEl = modalContainer.querySelector('#unlockUserModal');

  if (!modalEl) {
    return;
  }

  const modal = new window.bootstrap.Modal(modalEl);
  modal.show();

  const confirmBtn = modalEl.querySelector('#confirmUnlockBtn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      confirmBtn.disabled = true;
      confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Unlocking…';

      try {
        await UserAdminService.unlockUser(user.uid, adminProfile?.uid ?? '');

        modal.hide();
        showToast(USER_MESSAGES.USER_UNLOCKED_SUCCESS, 'success');

        // Refresh the page
        await initUserManagement(outlet);
      } catch (error) {
        Logger.error('[UserManagement] Failed to unlock user:', error);
        showToast(USER_MESSAGES.USER_UNLOCK_FAILED, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-unlock-fill me-2" aria-hidden="true"></i>Unlock User';
      }
    });
  }
}

