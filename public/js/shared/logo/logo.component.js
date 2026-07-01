/**
 * @fileoverview Shared application logo renderer.
 * @module shared/logo/logo.component
 */

import { appSettings } from '../../config/app.config.js';
import { escapeHtml } from '../../utils/html.util.js';

/**
 * @typedef {'navbar' | 'hero' | 'login' | 'footer'} LogoVariant
 */

/**
 * @typedef {Object} LogoOptions
 * @property {LogoVariant} [variant]
 * @property {string} [className]
 * @property {string} [alt]
 */

/**
 * Renders the application logo image.
 * @param {LogoOptions} [options]
 * @returns {string}
 */
export function renderAppLogo(options = {}) {
  const {
    variant = 'navbar',
    className = '',
    alt = appSettings.appName,
  } = options;

  const classes = ['ptw-brand-logo', `ptw-brand-logo--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return `
    <img
      src="${escapeHtml(appSettings.assets.logo)}"
      alt="${escapeHtml(alt)}"
      class="${escapeHtml(classes)}"
      decoding="async"
    >
  `;
}
