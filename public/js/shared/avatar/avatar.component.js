/**
 * @fileoverview Shared avatar rendering component.
 * @module shared/avatar/avatar.component
 */

import { escapeHtml, escapeUrl } from '../../utils/html.util.js';

/**
 * @typedef {Object} AvatarOptions
 * @property {string} [photoURL]
 * @property {string} [className]
 * @property {number} [size]
 * @property {string} [placeholderClassName]
 */

/**
 * Renders a user avatar with optional photo or placeholder icon.
 * @param {AvatarOptions} [options]
 * @returns {string}
 */
export function renderAvatar(options = {}) {
  const {
    photoURL = '',
    className = 'ptw-avatar',
    size = 32,
    placeholderClassName = 'ptw-avatar--placeholder',
  } = options;

  const safeUrl = escapeUrl(photoURL);

  if (safeUrl) {
    return `
      <span class="${escapeHtml(className)}">
        <img
          src="${safeUrl}"
          alt=""
          class="rounded-circle ptw-avatar__image"
          width="${size}"
          height="${size}"
        >
      </span>
    `;
  }

  return `
    <span class="${escapeHtml(className)} ${escapeHtml(placeholderClassName)}">
      <i class="bi bi-person-fill" aria-hidden="true"></i>
    </span>
  `;
}
