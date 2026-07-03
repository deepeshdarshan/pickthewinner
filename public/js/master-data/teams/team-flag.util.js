/**
 * @fileoverview Team flag rendering — flag-icons and legacy image URLs.
 * @module master-data/teams/team-flag.util
 */

import { escapeHtml } from '../../utils/html.util.js';
import { getFlagCountryName } from './flag-countries.constants.js';

/** @type {string} */
export const FLAG_ICON_PREFIX = 'fi:';

/**
 * @param {string} code
 * @returns {string}
 */
export function buildFlagIconValue(code) {
  return `${FLAG_ICON_PREFIX}${code.toLowerCase()}`;
}

/**
 * @param {unknown} flagUrl
 * @returns {string|null}
 */
export function parseFlagIconCode(flagUrl) {
  if (typeof flagUrl !== 'string' || !flagUrl.startsWith(FLAG_ICON_PREFIX)) {
    return null;
  }

  const code = flagUrl.slice(FLAG_ICON_PREFIX.length).trim().toLowerCase();
  return code || null;
}

/**
 * @param {unknown} flagUrl
 * @returns {boolean}
 */
export function isLegacyFlagUrl(flagUrl) {
  return typeof flagUrl === 'string' && /^https?:\/\//i.test(flagUrl.trim());
}

/**
 * @param {unknown} flagUrl
 * @returns {string}
 */
export function getFlagDisplayLabel(flagUrl) {
  const code = parseFlagIconCode(flagUrl);

  if (code) {
    return getFlagCountryName(code) ?? code.toUpperCase();
  }

  if (isLegacyFlagUrl(flagUrl)) {
    return 'Custom flag URL';
  }

  return '';
}

/**
 * @param {unknown} flagUrl
 * @param {{ className?: string, marginClass?: string }} [options]
 * @returns {string}
 */
export function renderTeamFlagHtml(flagUrl, options = {}) {
  const {
    className = 'ptw-team-flag',
    marginClass = 'me-2',
  } = options;

  const code = parseFlagIconCode(flagUrl);

  if (code) {
    return `<span class="fi fi-${escapeHtml(code)} ${escapeHtml(className)} ${escapeHtml(marginClass)}" aria-hidden="true"></span>`;
  }

  if (isLegacyFlagUrl(flagUrl)) {
    return `<img src="${escapeHtml(String(flagUrl).trim())}" alt="" class="${escapeHtml(className)} ${escapeHtml(marginClass)}" width="24" height="18" loading="lazy">`;
  }

  return `<span class="ptw-team-flag-placeholder ${escapeHtml(marginClass)}" aria-hidden="true"><i class="bi bi-flag"></i></span>`;
}

/**
 * @param {{ flagUrl?: string, flag?: string }|null|undefined} team
 * @returns {string|null}
 */
export function getTeamFlagUrl(team) {
  if (!team || typeof team !== 'object') {
    return null;
  }

  const flagUrl = team.flagUrl ?? team.flag;
  return typeof flagUrl === 'string' && flagUrl.trim() ? flagUrl.trim() : null;
}

/**
 * @param {{ name?: string, flagUrl?: string, flag?: string }|null|undefined} team
 * @param {{ fallback?: string, headingTag?: string, className?: string, extraHtml?: string }} [options]
 * @returns {string}
 */
export function renderTeamStackHtml(team, options = {}) {
  const {
    fallback = 'TBD',
    headingTag = 'h5',
    className = 'ptw-team-flag ptw-team-flag--stacked mb-2',
    extraHtml = '',
  } = options;

  const name = team?.name?.trim() || fallback;
  const flagHtml = renderTeamFlagHtml(getTeamFlagUrl(team), {
    className,
    marginClass: '',
  });

  return `
    ${flagHtml}
    <${headingTag} class="mb-0">${escapeHtml(name)}</${headingTag}>
    ${extraHtml}
  `.trim();
}

/**
 * @param {{ name?: string, flagUrl?: string, flag?: string }|null|undefined} team
 * @param {{ fallback?: string, marginClass?: string, className?: string, strong?: boolean }} [options]
 * @returns {string}
 */
export function renderTeamInlineHtml(team, options = {}) {
  const {
    fallback = 'Home',
    marginClass = 'me-1',
    className = 'ptw-team-flag',
    strong = false,
  } = options;

  const name = team?.name?.trim() || fallback;
  const flagHtml = renderTeamFlagHtml(getTeamFlagUrl(team), { className, marginClass });
  const nameHtml = strong
    ? `<strong>${escapeHtml(name)}</strong>`
    : escapeHtml(name);

  return `<span class="d-inline-flex align-items-center gap-1">${flagHtml}${nameHtml}</span>`;
}

/**
 * @param {{ name?: string, flagUrl?: string, flag?: string }|null|undefined} homeTeam
 * @param {{ name?: string, flagUrl?: string, flag?: string }|null|undefined} awayTeam
 * @param {{ homeFallback?: string, awayFallback?: string, separator?: string, strong?: boolean }} [options]
 * @returns {string}
 */
export function renderTeamsMatchupHtml(homeTeam, awayTeam, options = {}) {
  const {
    homeFallback = 'Home',
    awayFallback = 'Away',
    separator = 'vs',
    strong = false,
  } = options;

  return `
    <span class="d-inline-flex align-items-center flex-wrap gap-2 ptw-teams-matchup">
      ${renderTeamInlineHtml(homeTeam, { fallback: homeFallback, strong })}
      <span class="ptw-text-muted">${escapeHtml(separator)}</span>
      ${renderTeamInlineHtml(awayTeam, { fallback: awayFallback, strong })}
    </span>
  `.trim();
}
