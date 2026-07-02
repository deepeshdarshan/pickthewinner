/**
 * @fileoverview Tournament card component for contestant views.
 * @module components/tournament-card.component
 */

import { renderStatusBadge } from './status-badge.component.js';
import { escapeHtml } from '../utils/html.util.js';
import { formatDateTime, formatDate } from '../utils/date.util.js';

/**
 * @typedef {Object} TournamentCardOptions
 * @property {import('../tournament/tournament.service.js').Tournament} tournament
 * @property {number} [totalMatches]
 * @property {number} [submittedPredictions]
 * @property {boolean} [showProgress]
 */

/**
 * Renders a tournament card for contestants.
 * @param {TournamentCardOptions} options
 * @returns {string}
 */
export function renderTournamentCard(options) {
  const { tournament, totalMatches = 0, submittedPredictions = 0, showProgress = false } = options;

  const statusBadge = renderTournamentStatusBadge(tournament.status);
  const progressPercentage = totalMatches > 0 ? Math.round((submittedPredictions / totalMatches) * 100) : 0;

  return `
    <div class="card ptw-card ptw-tournament-card h-100">
      ${tournament.banner ? `
        <div class="card-img-top ptw-tournament-banner" style="background-image: url('${escapeHtml(tournament.banner)}'); height: 150px; background-size: cover; background-position: center;"></div>
      ` : ''}
      <div class="card-body">
        <div class="d-flex align-items-start mb-3">
          ${tournament.logo ? `
            <img src="${escapeHtml(tournament.logo)}" alt="${escapeHtml(tournament.name)}" class="ptw-tournament-logo me-3" style="width: 48px; height: 48px; object-fit: contain;">
          ` : ''}
          <div class="flex-grow-1">
            <h5 class="card-title mb-1">${escapeHtml(tournament.name)}</h5>
            ${tournament.season ? `<p class="text-muted small mb-0">${escapeHtml(tournament.season)}</p>` : ''}
          </div>
        </div>

        ${statusBadge}

        ${tournament.description ? `
          <p class="card-text ptw-text-muted small mt-2">${escapeHtml(tournament.description)}</p>
        ` : ''}

        <!-- Tournament Info -->
        <div class="mt-3">
          ${renderTournamentDuration(tournament)}
          
          ${showProgress && totalMatches > 0 ? `
            <div class="mt-2">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <small class="ptw-text-muted">Prediction Progress</small>
                <small class="text-primary fw-bold">${submittedPredictions} / ${totalMatches}</small>
              </div>
              <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-primary" role="progressbar" 
                     style="width: ${progressPercentage}%;" 
                     aria-valuenow="${progressPercentage}" 
                     aria-valuemin="0" 
                     aria-valuemax="100"></div>
              </div>
            </div>
          ` : totalMatches > 0 ? `
            <div class="mt-2 d-flex justify-content-between align-items-center">
              <small class="ptw-text-muted">Total Matches</small>
              <small class="fw-bold">${totalMatches}</small>
            </div>
          ` : ''}
        </div>
      </div>
      <div class="card-footer bg-transparent border-top-0 pt-0">
        <a href="/tournaments?id=${encodeURIComponent(tournament.id)}" 
           class="btn btn-ptw-primary w-100" 
           data-route>
          <i class="bi bi-arrow-right-circle me-2" aria-hidden="true"></i>Enter Tournament
        </a>
      </div>
    </div>
  `;
}

/**
 * Renders tournament status badge.
 * @param {string} status
 * @returns {string}
 */
function renderTournamentStatusBadge(status) {
  const statusConfig = {
    draft: { label: 'Draft', variant: 'secondary', icon: 'bi-pencil' },
    registration_open: { label: 'Registration Open', variant: 'info', icon: 'bi-door-open' },
    published: { label: 'Upcoming', variant: 'warning', icon: 'bi-calendar-event' },
    live: { label: 'Live', variant: 'success', icon: 'bi-broadcast' },
    completed: { label: 'Completed', variant: 'secondary', icon: 'bi-check-circle' },
    archived: { label: 'Archived', variant: 'dark', icon: 'bi-archive' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return renderStatusBadge({
    label: config.label,
    variant: config.variant,
    icon: config.icon,
  });
}

/**
 * Renders tournament duration.
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @returns {string}
 */
function renderTournamentDuration(tournament) {
  if (!tournament.registrationStart && !tournament.registrationEnd) {
    return '';
  }

  const start = tournament.registrationStart instanceof Date
    ? tournament.registrationStart
    : tournament.registrationStart?.toDate?.() ?? null;

  const end = tournament.registrationEnd instanceof Date
    ? tournament.registrationEnd
    : tournament.registrationEnd?.toDate?.() ?? null;

  if (!start && !end) {
    return '';
  }

  return `
    <div class="d-flex justify-content-between align-items-center">
      <small class="ptw-text-muted">
        <i class="bi bi-calendar-range me-1" aria-hidden="true"></i>
        ${start ? escapeHtml(formatDate(start)) : 'TBD'}
        ${end ? ` - ${escapeHtml(formatDate(end))}` : ''}
      </small>
    </div>
  `;
}

/**
 * Renders a compact tournament card for lists.
 * @param {import('../tournament/tournament.service.js').Tournament} tournament
 * @returns {string}
 */
export function renderCompactTournamentCard(tournament) {
  return `
    <div class="card ptw-card mb-2">
      <div class="card-body py-2">
        <div class="d-flex justify-content-between align-items-center">
          <div class="flex-grow-1">
            <div class="d-flex align-items-center gap-2">
              ${tournament.logo ? `
                <img src="${escapeHtml(tournament.logo)}" alt="${escapeHtml(tournament.name)}" style="width: 24px; height: 24px; object-fit: contain;">
              ` : ''}
              <strong>${escapeHtml(tournament.name)}</strong>
              ${renderTournamentStatusBadge(tournament.status)}
            </div>
            ${tournament.season ? `<small class="ptw-text-muted ms-4">${escapeHtml(tournament.season)}</small>` : ''}
          </div>
          <div>
            <a href="/tournaments?id=${encodeURIComponent(tournament.id)}" class="btn btn-sm btn-outline-primary" data-route>
              View
            </a>
          </div>
        </div>
      </div>
    </div>
  `;
}

