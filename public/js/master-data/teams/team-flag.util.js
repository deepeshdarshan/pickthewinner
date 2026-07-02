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
