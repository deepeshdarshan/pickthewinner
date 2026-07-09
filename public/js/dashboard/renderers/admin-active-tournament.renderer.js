/**
 * @fileoverview Active tournament hero section for admin dashboard.
 * @module dashboard/renderers/admin-active-tournament.renderer
 */

import { renderTournamentHeroCard } from '../../tournament/renderers/tournament-card.renderer.js';
import { escapeHtml } from '../../utils/html.util.js';

/**
 * @param {import('../AdminDashboardService.js').AdminDashboardDto} data
 * @returns {string}
 */
export function renderAdminActiveTournamentHero(data) {
  const tournament = data.activeTournament;

  if (!tournament) {
    return '';
  }

  return renderTournamentHeroCard(
    {
      ...tournament,
      active: true,
    },
    {
      label: 'Active Tournament',
      stats: tournament.stats,
      headingId: 'ptw-admin-active-tournament-heading',
      headingTag: 'h2',
      wrapperTag: 'section',
      wrapperClass: 'ptw-active-tournament-hero mb-4',
      actionsHtml: `
        <a
          href="${escapeHtml(data.tournamentsPath)}"
          class="btn btn-ptw-primary ptw-active-tournament-hero__cta"
          data-route
        >
          <i class="bi bi-gear me-2" aria-hidden="true"></i>Manage Tournament
        </a>
      `,
    },
  );
}
