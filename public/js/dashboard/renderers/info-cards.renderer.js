/**
 * @fileoverview Informational cards for contestant dashboard footer.
 * @module dashboard/renderers/info-cards.renderer
 */

import { appSettings } from '../../config/app.config.js';
import { renderContactActionButtons } from '../../components/contact-action-buttons.component.js';
import { escapeHtml } from '../../utils/html.util.js';

/**
 * @param {{ icon: string, iconClass: string, title: string, body: string, footerHtml?: string }} options
 * @returns {string}
 */
function renderInfoCard(options) {
  const { icon, iconClass, title, body, footerHtml = '' } = options;

  return `
    <div class="col-12 col-sm-6 col-xl-3">
      <article class="ptw-dashboard-info-card h-100">
        <div class="ptw-dashboard-info-card__icon ${iconClass}" aria-hidden="true">
          <i class="bi ${icon}"></i>
        </div>
        <h3 class="ptw-dashboard-info-card__title">${escapeHtml(title)}</h3>
        <p class="ptw-dashboard-info-card__body mb-0">${body}</p>
        ${footerHtml}
      </article>
    </div>
  `;
}

/**
 * @returns {string}
 */
export function renderDashboardInfoCardsSection() {
  return `
    <section class="ptw-dashboard-info-cards mt-4 mb-4" aria-label="Platform information">
      <div class="row g-3">
        ${renderInfoCard({
    icon: 'bi-clock',
    iconClass: 'ptw-dashboard-info-card__icon--blue',
    title: 'Prediction Window',
    body: 'Predictions open 12 hours before kickoff and close 15 minutes before kickoff. All times are in Indian Standard Time (IST).',
  })}
        ${renderInfoCard({
    icon: 'bi-trophy',
    iconClass: 'ptw-dashboard-info-card__icon--green',
    title: 'Fair Play',
    body: 'Follow the contest rules. Any form of cheating or malpractice will result in immediate disqualification.',
  })}
        ${renderInfoCard({
    icon: 'bi-award',
    iconClass: 'ptw-dashboard-info-card__icon--gold',
    title: 'Final Winners',
    body: 'The final leaderboard and winners will be announced after the tournament concludes.',
  })}
        ${renderInfoCard({
    icon: 'bi-telephone',
    iconClass: 'ptw-dashboard-info-card__icon--purple',
    title: 'Need Help?',
    body: 'Facing any issues? We\'re here to help.',
    footerHtml: `
      <div class="ptw-dashboard-info-card__footer mt-3">
        ${renderContactActionButtons({
    phone: appSettings.supportContactPhone,
    whatsappFirst: true,
  })}
      </div>
    `,
  })}
      </div>
    </section>
  `;
}
