/**
 * @fileoverview User profile detail page for administrators.
 * @module users/user-profile-admin.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { ADMIN_PAGE_SHELL_CLASSES } from '../components/admin-page-shell.component.js';
import { UserAdminService } from './user-admin.service.js';
import { UserAdminDomain } from '../domain/user-admin.domain.js';
import { getCachedProfile } from './user.service.js';
import { USER_MESSAGES, USER_STATUS, USER_ROLES } from './user.constants.js';
import { showToast } from '../components/toast.component.js';
import { Logger } from '../utils/logger.util.js';
import { escapeHtml } from '../utils/html.util.js';
import {
  renderLockUserModal,
  renderUnlockUserModal,
} from './renderers/user-admin.renderer.js';

/** @typedef {import('./user.service.js').UserProfile} UserProfile */

/**
 * Renders the user profile detail page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const path = window.location.pathname;
  const uid = path.split('/').pop();

  if (!uid || uid === 'users') {
    showToast('Invalid user ID', 'error');
    window.history.back();
    return;
  }

  void initUserProfile(outlet, uid);
}

/**
 * Initializes the user profile page.
 * @param {HTMLElement} outlet
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function initUserProfile(outlet, uid) {
  renderLoadingSkeleton(outlet);

  try {
    const user = await UserAdminService.getUserProfile(uid);

    if (!user) {
      renderNotFound(outlet);
      return;
    }

    renderProfilePage(outlet, user);
    bindEvents(outlet, user);
  } catch (error) {
    Logger.error('[UserProfileAdmin] Failed to load user profile:', error);
    showToast(USER_MESSAGES.USERS_LOAD_FAILED, 'error');
    renderError(outlet);
  }
}

/**
 * Renders loading skeleton.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderLoadingSkeleton(outlet) {
  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading profile…</span>
        </div>
        <p class="mt-3 text-white-50">Loading user profile…</p>
      </div>
    </div>
  `;
}

/**
 * Renders the full profile page.
 * @param {HTMLElement} outlet
 * @param {UserProfile} user
 * @returns {void}
 */
function renderProfilePage(outlet, user) {
  const adminProfile = getCachedProfile();
  const isLocked = user.status === USER_STATUS.LOCKED;
  const canLock = UserAdminDomain.canLockUser(user, adminProfile);
  const canUnlock = UserAdminDomain.canUnlockUser(user, adminProfile);

  const lockButton = canLock.allowed
    ? `<button class="btn btn-danger btn-sm" id="lockUserBtn">
         <i class="bi bi-lock-fill me-1" aria-hidden="true"></i>Lock User
       </button>`
    : canUnlock.allowed
      ? `<button class="btn btn-success btn-sm" id="unlockUserBtn">
           <i class="bi bi-unlock-fill me-1" aria-hidden="true"></i>Unlock User
         </button>`
      : '';

  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      ${renderPageHeader({
        title: 'User Profile',
        subtitle: escapeHtml(user.name || 'Unknown User'),
        actionsHtml: `
          <a href="/admin/users" class="btn btn-outline-light btn-sm" data-route>
            <i class="bi bi-arrow-left me-1" aria-hidden="true"></i>Back to Users
          </a>
          ${lockButton}
        `,
      })}
      
      ${isLocked ? `
        <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
          <i class="bi bi-lock-fill me-2" style="font-size: 1.5rem;" aria-hidden="true"></i>
          <div>
            <strong>This account is locked</strong>
            ${user.lockReason ? `<p class="mb-0 small mt-1">Reason: ${escapeHtml(user.lockReason)}</p>` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="row g-3">
        <!-- Basic Information -->
        <div class="col-12 col-lg-4">
          <div class="card ptw-card" style="background: #1F2A44;">
            <div class="card-body">
              <h2 class="h5 text-white mb-3" style="font-size: 1rem;">Basic Information</h2>
              
              <div class="text-center mb-3">
                <img 
                  src="${escapeHtml(user.photoURL || '')}" 
                  alt="${escapeHtml(user.name || 'User')}"
                  class="rounded-circle"
                  style="width: 80px; height: 80px; object-fit: cover; background: #2D3A52;"
                  onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22%232D3A52%22/%3E%3Ctext x=%2240%22 y=%2250%22 text-anchor=%22middle%22 fill=%22%23fff%22 font-size=%2232%22%3E${escapeHtml((user.name || 'U')[0].toUpperCase())}%3C/text%3E%3C/svg%3E'"
                />
                <h3 class="h6 text-white mt-2 mb-0" style="font-size: 0.9375rem;">${escapeHtml(user.name || 'Unknown')}</h3>
              </div>
              
              <div class="mb-3">
                <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Email</label>
                <p class="text-white mb-0" style="font-size: 0.8125rem;">${escapeHtml(user.email || 'N/A')}</p>
              </div>
              
              ${user.phone ? `
              <div class="mb-3">
                <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Phone</label>
                <p class="text-white mb-0" style="font-size: 0.8125rem;">${escapeHtml(user.phone)}</p>
              </div>
              ` : ''}
              
              <div class="mb-3">
                <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">User ID</label>
                <p class="text-white mb-0 font-monospace" style="font-size: 0.75rem; word-break: break-all;">${escapeHtml(user.uid)}</p>
              </div>
              
              <div class="mb-3">
                <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Role</label>
                <span class="badge ${UserAdminDomain.getRoleBadgeClass(user.role)}" style="font-size: 0.75rem;">
                  ${escapeHtml(UserAdminDomain.formatUserRole(user.role))}
                </span>
              </div>
              
              <div>
                <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Status</label>
                <span class="badge ${UserAdminDomain.getStatusBadgeClass(user.status)}" style="font-size: 0.75rem;">
                  ${escapeHtml(UserAdminDomain.formatUserStatus(user.status))}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Activity & Statistics -->
        <div class="col-12 col-lg-8">
          <div class="card ptw-card mb-3" style="background: #1F2A44;">
            <div class="card-body">
              <h2 class="h5 text-white mb-3" style="font-size: 1rem;">Activity</h2>
              
              <div class="row g-3">
                <div class="col-6 col-md-4">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Registered</label>
                  <p class="text-white mb-0" style="font-size: 0.8125rem;">
                    ${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div class="col-6 col-md-4">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Last Login</label>
                  <p class="text-white mb-0" style="font-size: 0.8125rem;">
                    ${UserAdminDomain.getUserActivityLabel(user.lastLogin)}
                  </p>
                </div>
                
                <div class="col-6 col-md-4">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Provider</label>
                  <p class="text-white mb-0" style="font-size: 0.8125rem;">
                    ${escapeHtml(user.provider || 'N/A')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="card ptw-card" style="background: #1F2A44;">
            <div class="card-body">
              <h2 class="h5 text-white mb-3" style="font-size: 1rem;">Statistics</h2>
              
              <div class="row g-3">
                <div class="col-6 col-md-3">
                  <div class="text-center">
                    <div class="text-primary" style="font-size: 1.5rem; font-weight: 600;">
                      ${user.statistics?.tournamentsPlayed ?? 0}
                    </div>
                    <small class="text-white-50" style="font-size: 0.75rem;">Tournaments</small>
                  </div>
                </div>
                
                <div class="col-6 col-md-3">
                  <div class="text-center">
                    <div class="text-success" style="font-size: 1.5rem; font-weight: 600;">
                      ${user.statistics?.matchesPredicted ?? 0}
                    </div>
                    <small class="text-white-50" style="font-size: 0.75rem;">Predictions</small>
                  </div>
                </div>
                
                <div class="col-6 col-md-3">
                  <div class="text-center">
                    <div class="text-info" style="font-size: 1.5rem; font-weight: 600;">
                      ${user.statistics?.exactPredictions ?? 0}
                    </div>
                    <small class="text-white-50" style="font-size: 0.75rem;">Exact Scores</small>
                  </div>
                </div>
                
                <div class="col-6 col-md-3">
                  <div class="text-center">
                    <div class="text-warning" style="font-size: 1.5rem; font-weight: 600;">
                      ${user.statistics?.totalPoints ?? 0}
                    </div>
                    <small class="text-white-50" style="font-size: 0.75rem;">Total Points</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          ${isLocked ? `
          <div class="card ptw-card mt-3" style="background: #1F2A44;">
            <div class="card-body">
              <h2 class="h5 text-white mb-3" style="font-size: 1rem;">Lock Information</h2>
              
              <div class="row g-3">
                <div class="col-6">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Locked At</label>
                  <p class="text-white mb-0" style="font-size: 0.8125rem;">
                    ${user.lockedAt ? new Date(user.lockedAt.toDate()).toLocaleString() : 'N/A'}
                  </p>
                </div>
                
                <div class="col-6">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Locked By</label>
                  <p class="text-white mb-0 font-monospace" style="font-size: 0.75rem;">
                    ${escapeHtml(user.lockedBy || 'N/A')}
                  </p>
                </div>
                
                ${user.lockReason ? `
                <div class="col-12">
                  <label class="text-white-50 d-block mb-1" style="font-size: 0.75rem;">Reason</label>
                  <p class="text-white mb-0" style="font-size: 0.8125rem;">
                    ${escapeHtml(user.lockReason)}
                  </p>
                </div>
                ` : ''}
              </div>
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <div id="modalContainer"></div>
  `;
}

/**
 * Renders not found state.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderNotFound(outlet) {
  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body text-center py-5">
          <i class="bi bi-person-x text-muted" style="font-size: 4rem;" aria-hidden="true"></i>
          <h2 class="h4 text-white mt-3">User Not Found</h2>
          <p class="text-white-50 mb-4">The requested user profile could not be found.</p>
          <a href="/admin/users" class="btn btn-ptw-primary" data-route>
            <i class="bi bi-arrow-left me-2" aria-hidden="true"></i>
            Back to Users
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders error state.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
function renderError(outlet) {
  outlet.innerHTML = `
    <div class="${ADMIN_PAGE_SHELL_CLASSES}">
      <div class="card ptw-card">
        <div class="card-body text-center py-5">
          <i class="bi bi-exclamation-triangle text-danger" style="font-size: 4rem;" aria-hidden="true"></i>
          <h2 class="h4 text-white mt-3">Error Loading Profile</h2>
          <p class="text-white-50 mb-4">Unable to load the user profile. Please try again.</p>
          <button class="btn btn-ptw-primary" onclick="window.location.reload()">
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
 * @param {UserProfile} user
 * @returns {void}
 */
function bindEvents(outlet, user) {
  const lockBtn = outlet.querySelector('#lockUserBtn');
  const unlockBtn = outlet.querySelector('#unlockUserBtn');

  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      void showLockModal(outlet, user);
    });
  }

  if (unlockBtn) {
    unlockBtn.addEventListener('click', () => {
      void showUnlockModal(outlet, user);
    });
  }
}

/**
 * Shows lock user modal.
 * @param {HTMLElement} outlet
 * @param {UserProfile} user
 * @returns {Promise<void>}
 */
async function showLockModal(outlet, user) {
  const adminProfile = getCachedProfile();
  const validation = UserAdminDomain.canLockUser(user, adminProfile);

  if (!validation.allowed) {
    showToast(validation.reason ?? USER_MESSAGES.PERMISSION_DENIED, 'error');
    return;
  }

  const modalContainer = outlet.querySelector('#modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = renderLockUserModal(user);
  const modalEl = modalContainer.querySelector('#lockUserModal');
  if (!modalEl) return;

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

        // Reload the page
        window.location.reload();
      } catch (error) {
        Logger.error('[UserProfileAdmin] Failed to lock user:', error);
        showToast(USER_MESSAGES.USER_LOCK_FAILED, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-lock-fill me-2" aria-hidden="true"></i>Lock User';
      }
    });
  }
}

/**
 * Shows unlock user modal.
 * @param {HTMLElement} outlet
 * @param {UserProfile} user
 * @returns {Promise<void>}
 */
async function showUnlockModal(outlet, user) {
  const adminProfile = getCachedProfile();
  const validation = UserAdminDomain.canUnlockUser(user, adminProfile);

  if (!validation.allowed) {
    showToast(validation.reason ?? USER_MESSAGES.PERMISSION_DENIED, 'error');
    return;
  }

  const modalContainer = outlet.querySelector('#modalContainer');
  if (!modalContainer) return;

  modalContainer.innerHTML = renderUnlockUserModal(user);
  const modalEl = modalContainer.querySelector('#unlockUserModal');
  if (!modalEl) return;

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

        // Reload the page
        window.location.reload();
      } catch (error) {
        Logger.error('[UserProfileAdmin] Failed to unlock user:', error);
        showToast(USER_MESSAGES.USER_UNLOCK_FAILED, 'error');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-unlock-fill me-2" aria-hidden="true"></i>Unlock User';
      }
    });
  }
}

