/**
 * @fileoverview Progress bar component using Bootstrap progress.
 * @module components/progress-bar.component
 */

/**
 * @typedef {Object} ProgressBarOptions
 * @property {number} value - Progress value 0–100.
 * @property {string} [label]
 * @property {'primary'|'success'|'warning'|'danger'} [variant]
 * @property {boolean} [striped]
 * @property {boolean} [animated]
 */

/**
 * Renders a progress bar.
 * @param {ProgressBarOptions} options
 * @returns {string}
 */
export function renderProgressBar(options) {
  const {
    value,
    label = '',
    variant = 'primary',
    striped = false,
    animated = false,
  } = options;

  const clamped = Math.min(100, Math.max(0, value));
  const barClasses = [
    'progress-bar',
    variant !== 'primary' ? `bg-${variant === 'primary' ? 'primary' : variant}` : '',
    striped ? 'progress-bar-striped' : '',
    animated ? 'progress-bar-animated' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="ptw-progress-bar">
      ${label ? `<span class="ptw-progress-bar__label">${label}</span>` : ''}
      <div class="progress" role="progressbar" aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100"${label ? ` aria-label="${label}"` : ''}>
        <div class="${barClasses}" style="width: ${clamped}%"></div>
      </div>
    </div>
  `;
}

/**
 * Mounts a progress bar into a container element.
 * @param {HTMLElement} container
 * @param {ProgressBarOptions} options
 * @returns {void}
 */
export function mountProgressBar(container, options) {
  container.innerHTML = renderProgressBar(options);
}
