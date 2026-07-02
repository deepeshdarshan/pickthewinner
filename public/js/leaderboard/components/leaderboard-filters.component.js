/**
 * @fileoverview Leaderboard filters component.
 * @module leaderboard/components/leaderboard-filters.component
 */

import { escapeHtml } from '../../utils/html.util.js';
import {
  LEADERBOARD_FILTER_TYPES,
  LEADERBOARD_MESSAGES,
} from '../leaderboard.constants.js';

/**
 * Renders leaderboard filters and search.
 * @param {Object} options
 * @param {string} options.currentFilter
 * @param {string} options.searchTerm
 * @param {boolean} options.showMyPosition
 * @returns {string}
 */
export function renderLeaderboardFilters({ currentFilter = 'all', searchTerm = '', showMyPosition = true }) {
  return `
    <div class="card ptw-card mb-3">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-12 col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input 
                type="text" 
                class="form-control bg-dark border-secondary text-white" 
                placeholder="${LEADERBOARD_MESSAGES.SEARCH_PLACEHOLDER}"
                id="leaderboardSearch"
                value="${escapeHtml(searchTerm)}"
              />
            </div>
          </div>

          <div class="col-12 col-md-6">
            <select 
              class="form-select bg-dark border-secondary text-white" 
              id="leaderboardFilter"
            >
              <option value="${LEADERBOARD_FILTER_TYPES.ALL}" ${currentFilter === LEADERBOARD_FILTER_TYPES.ALL ? 'selected' : ''}>
                ${LEADERBOARD_MESSAGES.FILTER_ALL}
              </option>
              <option value="${LEADERBOARD_FILTER_TYPES.TOP_10}" ${currentFilter === LEADERBOARD_FILTER_TYPES.TOP_10 ? 'selected' : ''}>
                ${LEADERBOARD_MESSAGES.FILTER_TOP_10}
              </option>
              <option value="${LEADERBOARD_FILTER_TYPES.TOP_25}" ${currentFilter === LEADERBOARD_FILTER_TYPES.TOP_25 ? 'selected' : ''}>
                ${LEADERBOARD_MESSAGES.FILTER_TOP_25}
              </option>
              <option value="${LEADERBOARD_FILTER_TYPES.TOP_50}" ${currentFilter === LEADERBOARD_FILTER_TYPES.TOP_50 ? 'selected' : ''}>
                ${LEADERBOARD_MESSAGES.FILTER_TOP_50}
              </option>
              ${showMyPosition ? `
                <option value="${LEADERBOARD_FILTER_TYPES.MY_POSITION}" ${currentFilter === LEADERBOARD_FILTER_TYPES.MY_POSITION ? 'selected' : ''}>
                  ${LEADERBOARD_MESSAGES.FILTER_MY_POSITION}
                </option>
              ` : ''}
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes filter event handlers.
 * @param {HTMLElement} container
 * @param {Function} onFilterChange
 * @param {Function} onSearchChange
 * @returns {void}
 */
export function initializeFilters(container, onFilterChange, onSearchChange) {
  const searchInput = container.querySelector('#leaderboardSearch');
  const filterSelect = container.querySelector('#leaderboardFilter');

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        onSearchChange(e.target.value);
      }, 300); // Debounce search
    });
  }

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      onFilterChange(e.target.value);
    });
  }
}

