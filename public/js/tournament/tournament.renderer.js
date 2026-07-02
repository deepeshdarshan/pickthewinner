/**
 * @fileoverview Tournament renderer barrel — re-exports focused renderers.
 * @module tournament/tournament.renderer
 */

export {
  renderTournamentListLoading,
  renderTournamentListPage,
  mountTournamentListLoading,
} from './renderers/list.renderer.js';

export {
  renderTournamentFormPage,
  readTournamentForm,
} from './renderers/form.renderer.js';

export {
  renderTournamentDetailPage,
  renderTournamentNotFound,
  bindTournamentMatchBehaviourPreview,
} from './renderers/detail.renderer.js';

export {
  renderStatusBadge,
  renderVisibilityBadge,
  renderActiveBadge,
} from './renderers/status-badge.renderer.js';

export {
  renderContestantTournamentLoading,
  renderContestantTournamentListPage,
  renderContestantTournamentDetailPage,
} from './renderers/contestant-list.renderer.js';

export { applyFormErrors, getTournamentValidationMessage } from './tournament.validator.js';
