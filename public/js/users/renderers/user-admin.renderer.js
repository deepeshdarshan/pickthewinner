/**
 * @fileoverview User admin renderers — HTML templates for user management.
 * @module users/renderers/user-admin.renderer
 */

import { escapeHtml } from '../../utils/html.util.js';
import { UserAdminDomain } from '../../domain/user-admin.domain.js';
import { renderAvatar } from '../../shared/avatar/avatar.component.js';
import { USER_ROLES, USER_STATUS } from '../user.constants.js';

/**
 * @typedef {import('../user.service.js').UserProfile} UserProfile
 */

/**
 * @param {string} uid
 * @param {string} name
 * @returns {string}
 */
function renderUserProfileLink(uid, name) {
  return `
    <a href="/admin/users/${escapeHtml(uid)}" class="ptw-profile-link fw-semibold text-white text-decoration-none" data-route>
      ${escapeHtml(name)}
    </a>
  `;
}

/**
 * @param {import('firebase/firestore').Timestamp|Date|null|undefined} lastLogin
 * @returns {string}
 */
function renderLastLoginCell(lastLogin) {
  const { primary, secondary } = UserAdminDomain.formatLastLoginDisplay(lastLogin);

  if (primary === 'Never') {
    return '<div class="text-white-50" style="font-size: 0.8125rem;">Never</div>';
  }

  return `
    <div class="text-white" style="font-size: 0.8125rem;">${escapeHtml(primary)}</div>
    ${secondary ? `<small class="text-white-50 d-block" style="font-size: 0.75rem;">${escapeHtml(secondary)}</small>` : ''}
  `;
}

/**
 * @param {UserProfile[]} users
 * @param {Object} [options]
 * @param {(uid: string) => void} [options.onLockClick]
 * @param {(uid: string) => void} [options.onUnlockClick]
 * @param {(uid: string) => void} [options.onViewProfile]
 * @returns {string}
 */
export function renderUserTable(users, options = {}) {
  if (!users || users.length === 0) {
    return renderEmptyUserList();
  }

    const rows = users.map((user) => {
    const statusBadgeClass = UserAdminDomain.getStatusBadgeClass(user.status);
    const roleBadgeClass = UserAdminDomain.getRoleBadgeClass(user.role);
    const lastLoginDisplay = UserAdminDomain.formatLastLoginDisplay(user.lastLogin);
    const isLocked = user.status === USER_STATUS.LOCKED;
    const isAdmin = user.role === USER_ROLES.ADMIN;

    const actionButtons = isLocked
      ? `<button class="btn btn-sm btn-success unlock-user-btn" data-uid="${escapeHtml(user.uid)}" title="Unlock User">
           <i class="bi bi-unlock" aria-hidden="true"></i> Unlock
         </button>`
      : !isAdmin
        ? `<button class="btn btn-sm btn-danger lock-user-btn" data-uid="${escapeHtml(user.uid)}" title="Lock User">
             <i class="bi bi-lock" aria-hidden="true"></i> Lock
           </button>`
        : '';

    return `
      <tr style="font-size: 0.875rem;">
        <td class="ptw-user-admin-table__user-col" style="padding: 0.5rem;">
          <div class="d-flex align-items-center">
            <img 
              src="${escapeHtml(user.photoURL || '')}" 
              alt="${escapeHtml(user.name || 'User')}"
              class="rounded-circle"
              style="width: 32px; height: 32px; object-fit: cover; background: #2D3A52;"
              onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22%3E%3Crect width=%2232%22 height=%2232%22 fill=%22%232D3A52%22/%3E%3Ctext x=%2216%22 y=%2220%22 text-anchor=%22middle%22 fill=%22%23fff%22 font-size=%2214%22%3E${escapeHtml((user.name || 'U')[0].toUpperCase())}%3C/text%3E%3C/svg%3E'"
            />
            <div class="ms-2">
              <div style="font-size: 0.875rem;">${renderUserProfileLink(user.uid, user.name || 'Unknown')}</div>
              <small style="color: #94A3B8; font-size: 0.75rem;">${escapeHtml(user.email || '')}</small>
            </div>
          </div>
        </td>
        <td style="padding: 0.5rem;">
          <span class="badge ${roleBadgeClass}" style="font-size: 0.75rem;">
            ${escapeHtml(UserAdminDomain.formatUserRole(user.role))}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          <span class="badge ${statusBadgeClass}" style="font-size: 0.75rem;">
            ${escapeHtml(UserAdminDomain.formatUserStatus(user.status))}
          </span>
        </td>
        <td style="padding: 0.5rem;">
          <div class="text-white" style="font-size: 0.8125rem;">${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'N/A'}</div>
        </td>
        <td style="padding: 0.5rem;">
          ${renderLastLoginCell(user.lastLogin)}
        </td>
        <td style="padding: 0.5rem;">
          <div class="text-white" style="font-size: 0.8125rem;">${escapeHtml(user.pradeshikaSabha || '—')}</div>
        </td>
        <td class="text-end" style="padding: 0.5rem;">
          <div class="btn-group btn-group-sm" role="group">
            <button 
              class="btn btn-sm btn-outline-primary view-profile-btn" 
              data-uid="${escapeHtml(user.uid)}"
              title="View Profile"
              style="font-size: 0.75rem; padding: 0.25rem 0.5rem;"
            >
              <i class="bi bi-eye" aria-hidden="true"></i>
            </button>
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="table-responsive">
      <table class="table table-dark table-hover align-middle mb-0 ptw-table ptw-table--compact ptw-user-admin-table" aria-label="Users">
        <colgroup>
          <col class="ptw-user-admin-table__user-col" />
        </colgroup>
        <thead>
          <tr style="background-color: #1F2A44;">
            <th scope="col" class="text-white ptw-user-admin-table__user-col" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">User</th>
            <th scope="col" class="text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Role</th>
            <th scope="col" class="text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Status</th>
            <th scope="col" class="text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Registered</th>
            <th scope="col" class="text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Last Login</th>
            <th scope="col" class="text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Pradeshika Sabha</th>
            <th scope="col" class="text-end text-white" style="padding: 0.75rem 0.5rem; font-size: 0.8125rem; font-weight: 600;">Actions</th>
          </tr>
        </thead>
        <tbody style="background-color: #172033;">
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders user cards for mobile view.
 * @param {UserProfile[]} users
 * @returns {string}
 */
export function renderUserCards(users) {
  if (!users || users.length === 0) {
    return renderEmptyUserList();
  }

  return users.map((user) => {
    const statusBadgeClass = UserAdminDomain.getStatusBadgeClass(user.status);
    const roleBadgeClass = UserAdminDomain.getRoleBadgeClass(user.role);
    const lastLoginDisplay = UserAdminDomain.formatLastLoginDisplay(user.lastLogin);
    const isLocked = user.status === USER_STATUS.LOCKED;
    const isAdmin = user.role === USER_ROLES.ADMIN;

    const actionButtons = isLocked
      ? `<button class="btn btn-sm btn-success w-100 unlock-user-btn" data-uid="${escapeHtml(user.uid)}" style="font-size: 0.75rem; padding: 0.375rem;">
           <i class="bi bi-unlock" aria-hidden="true"></i> Unlock User
         </button>`
      : !isAdmin
        ? `<button class="btn btn-sm btn-danger w-100 lock-user-btn" data-uid="${escapeHtml(user.uid)}" style="font-size: 0.75rem; padding: 0.375rem;">
             <i class="bi bi-lock" aria-hidden="true"></i> Lock User
           </button>`
        : '';

    return `
      <div class="card ptw-card mb-2" style="background: #1F2A44;">
        <div class="card-body p-3">
          <div class="d-flex align-items-start mb-2">
            <img 
              src="${escapeHtml(user.photoURL || '')}" 
              alt="${escapeHtml(user.name || 'User')}"
              class="rounded-circle"
              style="width: 40px; height: 40px; object-fit: cover; background: #2D3A52;"
              onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect width=%2240%22 height=%2240%22 fill=%22%232D3A52%22/%3E%3Ctext x=%2220%22 y=%2225%22 text-anchor=%22middle%22 fill=%22%23fff%22 font-size=%2216%22%3E${escapeHtml((user.name || 'U')[0].toUpperCase())}%3C/text%3E%3C/svg%3E'"
            />
            <div class="ms-2 flex-grow-1">
              <h3 class="h6 mb-1" style="font-size: 0.875rem;">${renderUserProfileLink(user.uid, user.name || 'Unknown')}</h3>
              <p class="mb-1 text-white-50" style="font-size: 0.75rem;">${escapeHtml(user.email || '')}</p>
              <div class="d-flex gap-1">
                <span class="badge ${roleBadgeClass}" style="font-size: 0.7rem;">${escapeHtml(UserAdminDomain.formatUserRole(user.role))}</span>
                <span class="badge ${statusBadgeClass}" style="font-size: 0.7rem;">${escapeHtml(UserAdminDomain.formatUserStatus(user.status))}</span>
              </div>
            </div>
          </div>
          
          <div class="row g-2 mb-2">
            <div class="col-6">
              <small class="text-white-50 d-block" style="font-size: 0.7rem;">Last Login</small>
              <strong class="text-white" style="font-size: 0.8125rem;">${escapeHtml(lastLoginDisplay.primary)}</strong>
              ${lastLoginDisplay.secondary ? `<small class="text-white-50 d-block" style="font-size: 0.7rem;">${escapeHtml(lastLoginDisplay.secondary)}</small>` : ''}
            </div>
            <div class="col-6">
              <small class="text-white-50 d-block" style="font-size: 0.7rem;">Pradeshika Sabha</small>
              <strong class="text-white" style="font-size: 0.8125rem;">${escapeHtml(user.pradeshikaSabha || '—')}</strong>
            </div>
          </div>
          
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary btn-sm flex-grow-1 view-profile-btn" data-uid="${escapeHtml(user.uid)}" style="font-size: 0.75rem; padding: 0.375rem;">
              <i class="bi bi-eye" aria-hidden="true"></i> View Profile
            </button>
            ${actionButtons ? `<div class="flex-grow-1">${actionButtons}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Renders statistics cards for the user management dashboard.
 * @param {Object} stats
 * @param {number} stats.totalUsers
 * @param {number} stats.activeUsers
 * @param {number} stats.lockedUsers
 * @param {number} stats.adminUsers
 * @returns {string}
 */
export function renderUserStatistics(stats) {
  const activePercentage = stats.totalUsers > 0 
    ? Math.round((stats.activeUsers / stats.totalUsers) * 100) 
    : 0;

  return `
    <div class="row g-2 mb-3">
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card ptw-card" style="background: #1F2A44;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-people-fill text-primary" style="font-size: 1.5rem;" aria-hidden="true"></i>
              </div>
              <div class="ms-2">
                <h3 class="h4 mb-0 text-white">${stats.totalUsers}</h3>
                <p class="text-white-50 mb-0" style="font-size: 0.75rem;">Total Users</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card ptw-card" style="background: #1F2A44;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-check-circle-fill text-success" style="font-size: 1.5rem;" aria-hidden="true"></i>
              </div>
              <div class="ms-2">
                <h3 class="h4 mb-0 text-white">${stats.activeUsers}</h3>
                <p class="text-white-50 mb-0" style="font-size: 0.75rem;">Active Users</p>
                <small class="text-success" style="font-size: 0.7rem;">${activePercentage}% of total</small>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card ptw-card" style="background: #1F2A44;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-lock-fill text-danger" style="font-size: 1.5rem;" aria-hidden="true"></i>
              </div>
              <div class="ms-2">
                <h3 class="h4 mb-0 text-white">${stats.lockedUsers}</h3>
                <p class="text-white-50 mb-0" style="font-size: 0.75rem;">Locked Users</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card ptw-card" style="background: #1F2A44;">
          <div class="card-body p-3">
            <div class="d-flex align-items-center">
              <div class="flex-shrink-0">
                <i class="bi bi-shield-fill text-info" style="font-size: 1.5rem;" aria-hidden="true"></i>
              </div>
              <div class="ms-2">
                <h3 class="h4 mb-0 text-white">${stats.adminUsers}</h3>
                <p class="text-white-50 mb-0" style="font-size: 0.75rem;">Administrators</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the lock user confirmation modal.
 * @param {UserProfile} user
 * @returns {string}
 */
export function renderLockUserModal(user) {
  return `
    <div class="modal fade" id="lockUserModal" tabindex="-1" aria-labelledby="lockUserModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title" id="lockUserModalLabel">
              <i class="bi bi-lock-fill text-danger me-2" aria-hidden="true"></i>
              Lock User Account
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning" role="alert">
              <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
              <strong>Warning:</strong> This user will no longer be able to sign in to PickTheWinner.
            </div>
            
            <p>Are you sure you want to lock <strong>${escapeHtml(user.name || user.email)}</strong>?</p>
            
            <div class="mb-3">
              <label for="lockReason" class="form-label">Reason (Optional)</label>
              <textarea 
                class="form-control bg-dark text-light border-secondary" 
                id="lockReason" 
                rows="3" 
                maxlength="500"
                placeholder="Enter reason for locking this account…"
              ></textarea>
              <div class="form-text">Maximum 500 characters</div>
            </div>
          </div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-danger" id="confirmLockBtn" data-uid="${escapeHtml(user.uid)}">
              <i class="bi bi-lock-fill me-2" aria-hidden="true"></i>
              Lock User
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders the unlock user confirmation modal.
 * @param {UserProfile} user
 * @returns {string}
 */
export function renderUnlockUserModal(user) {
  return `
    <div class="modal fade" id="unlockUserModal" tabindex="-1" aria-labelledby="unlockUserModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content bg-dark border-secondary">
          <div class="modal-header border-secondary">
            <h5 class="modal-title" id="unlockUserModalLabel">
              <i class="bi bi-unlock-fill text-success me-2" aria-hidden="true"></i>
              Unlock User Account
            </h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to unlock <strong>${escapeHtml(user.name || user.email)}</strong>?</p>
            <p class="text-muted mb-0">This user will be able to sign in to PickTheWinner again.</p>
          </div>
          <div class="modal-footer border-secondary">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="button" class="btn btn-success" id="confirmUnlockBtn" data-uid="${escapeHtml(user.uid)}">
              <i class="bi bi-unlock-fill me-2" aria-hidden="true"></i>
              Unlock User
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Renders filter controls.
 * @param {Object} filters
 * @param {string} [filters.status]
 * @param {string} [filters.role]
 * @returns {string}
 */
export function renderUserFilters(filters = {}) {
  return `
    <div class="row g-2 mb-3">
      <div class="col-12 col-md-4">
        <label for="statusFilter" class="form-label text-white" style="font-size: 0.8125rem; font-weight: 500;">Status</label>
        <select class="form-select bg-dark text-light border-secondary" id="statusFilter" style="font-size: 0.8125rem; padding: 0.5rem;">
          <option value="">All Statuses</option>
          <option value="${USER_STATUS.ACTIVE}" ${filters.status === USER_STATUS.ACTIVE ? 'selected' : ''}>Active</option>
          <option value="${USER_STATUS.LOCKED}" ${filters.status === USER_STATUS.LOCKED ? 'selected' : ''}>Locked</option>
          <option value="${USER_STATUS.INACTIVE}" ${filters.status === USER_STATUS.INACTIVE ? 'selected' : ''}>Inactive</option>
          <option value="${USER_STATUS.SUSPENDED}" ${filters.status === USER_STATUS.SUSPENDED ? 'selected' : ''}>Suspended</option>
        </select>
      </div>
      
      <div class="col-12 col-md-4">
        <label for="roleFilter" class="form-label text-white" style="font-size: 0.8125rem; font-weight: 500;">Role</label>
        <select class="form-select bg-dark text-light border-secondary" id="roleFilter" style="font-size: 0.8125rem; padding: 0.5rem;">
          <option value="">All Roles</option>
          <option value="${USER_ROLES.CONTESTANT}" ${filters.role === USER_ROLES.CONTESTANT ? 'selected' : ''}>Contestant</option>
          <option value="${USER_ROLES.ADMIN}" ${filters.role === USER_ROLES.ADMIN ? 'selected' : ''}>Administrator</option>
        </select>
      </div>
      
      <div class="col-12 col-md-4">
        <label for="searchQuery" class="form-label text-white" style="font-size: 0.8125rem; font-weight: 500;">Search</label>
        <input 
          type="text" 
          class="form-control bg-dark text-light border-secondary" 
          id="searchQuery" 
          placeholder="Search by name, email, or UID…"
          value="${escapeHtml(filters.search ?? '')}"
          style="font-size: 0.8125rem; padding: 0.5rem;"
        />
      </div>
    </div>
  `;
}

/**
 * Renders empty state when no users are found.
 * @returns {string}
 */
function renderEmptyUserList() {
  return `
    <div class="text-center py-5">
      <i class="bi bi-people text-muted" style="font-size: 4rem;" aria-hidden="true"></i>
      <h3 class="h5 mt-3 mb-2">No Users Found</h3>
      <p class="text-muted">Try adjusting your search or filter criteria.</p>
    </div>
  `;
}

/**
 * Renders pagination controls.
 * @param {Object} pagination
 * @param {number} pagination.currentPage
 * @param {boolean} pagination.hasMore
 * @param {number} pagination.totalDisplayed
 * @returns {string}
 */
export function renderPaginationControls(pagination) {
  return `
    <div class="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style="border-color: #2D3A52 !important;">
      <div class="text-white-50" style="font-size: 0.8125rem;">
        Showing ${pagination.totalDisplayed} users
      </div>
      <div class="btn-group btn-group-sm" role="group">
        <button 
          type="button" 
          class="btn btn-outline-primary" 
          id="prevPageBtn"
          ${pagination.currentPage === 1 ? 'disabled' : ''}
          style="font-size: 0.8125rem; padding: 0.375rem 0.75rem;"
        >
          <i class="bi bi-chevron-left" aria-hidden="true"></i> Previous
        </button>
        <button 
          type="button" 
          class="btn btn-outline-primary" 
          id="nextPageBtn"
          ${!pagination.hasMore ? 'disabled' : ''}
          style="font-size: 0.8125rem; padding: 0.375rem 0.75rem;"
        >
          Next <i class="bi bi-chevron-right" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

