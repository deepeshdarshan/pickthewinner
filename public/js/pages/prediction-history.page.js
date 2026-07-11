/**
 * @fileoverview Prediction history page — contestant cross-tournament prediction archive.
 * @module pages/prediction-history.page
 */

import { getCurrentUser } from '../auth/auth.service.js';
import {
  initPredictionHistoryPage,
  createContestantHistoryConfig,
} from '../prediction/history/prediction-history.controller.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  const user = getCurrentUser();
  const config = createContestantHistoryConfig(user?.uid ?? '');
  void initPredictionHistoryPage(outlet, config);
}
