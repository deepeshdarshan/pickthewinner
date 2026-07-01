/**
 * @fileoverview User renderer barrel — backwards-compatible public API.
 * @module users/user.renderer
 */

export {
  renderProfileLoading,
  renderProfileEmpty,
  renderProfilePage,
  mountProfileLoading,
} from './renderers/profile.renderer.js';

export {
  renderCompleteProfileLoading,
  renderCompleteProfileForm,
  mountCompleteProfileLoading,
} from './renderers/complete-profile.renderer.js';

export {
  applyFormErrors,
  readNotificationPreferences,
  renderTimezoneOptions,
} from './renderers/shared-form.renderer.js';

export { renderNotificationPreferences } from './renderers/preferences.renderer.js';
