/**
 * @fileoverview Status badge component.
 * @module components/status-badge.component
 */

/** @type {Readonly<Record<string, string>>} */
const STATUS_VARIANTS = Object.freeze({
  success: 'ptw-badge--success',
  warning: 'ptw-badge--warning',
  danger: 'ptw-badge--danger',
  info: 'ptw-badge--info',
  muted: 'ptw-badge--muted',
});

/**
 * @typedef {Object} StatusBadgeOptions
 * @property {string} label
 * @property {'success'|'warning'|'danger'|'info'|'muted'} [variant]
 * @property {string} [icon]
 */

/**
 * Renders a status badge.
 * @param {StatusBadgeOptions} options
 * @returns {string}
 */
export function renderStatusBadge(options) {
  const { label, variant = 'muted', icon = '' } = options;
  const variantClass = STATUS_VARIANTS[variant] ?? STATUS_VARIANTS.muted;

  return `
    <span class="badge ptw-badge ${variantClass}">
      ${icon ? `<i class="bi ${icon} me-1" aria-hidden="true"></i>` : ''}
      ${label}
    </span>
  `;
}
