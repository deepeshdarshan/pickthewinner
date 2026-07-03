/**
 * @fileoverview Account locked page — shown to users whose accounts have been locked by an administrator.
 * @module pages/account-locked.page
 */

import { renderPageHeader } from '../components/page-header.component.js';
import { performLogout } from '../auth/actions/logout.action.js';
import { USER_MESSAGES } from '../users/user.constants.js';
import { escapeHtml } from '../utils/html.util.js';

/**
 * Renders the account locked page.
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const pageHtml = `
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-12 col-md-8 col-lg-6">
          ${renderPageHeader({
            title: 'Account Locked',
            subtitle: '',
            actionsHtml: '',
          })}
          
          <div class="card ptw-card">
            <div class="card-body text-center py-5">
              <div class="mb-4">
                <i class="bi bi-lock-fill text-danger" style="font-size: 4rem;" aria-hidden="true"></i>
              </div>
              
              <h2 class="h4 mb-3">Your Account Has Been Locked</h2>
              
              <p class="ptw-text-muted mb-4">
                ${escapeHtml(USER_MESSAGES.ACCOUNT_LOCKED)}
              </p>
              
              <div class="alert alert-danger" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2" aria-hidden="true"></i>
                <strong>Access Denied:</strong> You cannot access the application until your account is unlocked by an administrator.
              </div>
              
              <div class="mt-4">
                <p class="mb-3 ptw-text-muted">
                  If you believe this is an error, please contact the system administrator.
                </p>
                
                <button 
                  type="button" 
                  class="btn btn-ptw-primary"
                  id="logout-btn"
                >
                  <i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  outlet.innerHTML = pageHtml;

  // Bind logout button
  const logoutBtn = outlet.querySelector('#logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      logoutBtn.disabled = true;
      logoutBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Signing out…';

      try {
        await performLogout();
      } catch (error) {
        logoutBtn.disabled = false;
        logoutBtn.innerHTML = '<i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Sign Out';
      }
    });
  }
}

