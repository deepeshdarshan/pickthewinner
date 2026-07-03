/**
 * @fileoverview Match renderer barrel.
 * @module match/match.renderer
 */

export {
  renderMatchListLoading,
  renderMatchListPage,
  renderMatchListPageWithTabs,
  renderMatchListTabContent,
  renderArchivedMatchListPage,
  renderMatchFilters,
  mountMatchListLoading,
  renderMatchNotFound,
  MATCH_LIST_PAGE_SIZE,
} from './renderers/list.renderer.js';

export {
  renderMatchFormPage,
  readMatchForm,
  renderInheritedConfigPanel,
} from './renderers/form.renderer.js';

export {
  renderMatchDetailPage,
  renderContestantMatchDetail,
} from './renderers/detail.renderer.js';

export {
  renderResultForm,
  readResultForm,
} from './renderers/result-form.renderer.js';

export { renderPredictionComparison } from './renderers/comparison.renderer.js';
export { renderMatchStatusBadge } from './renderers/status-badge.renderer.js';
export { applyFormErrors } from './match.validator.js';
