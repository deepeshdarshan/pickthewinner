/**
 * @fileoverview Application entry point — bootstraps shell and router.
 * @module app/app
 */

import '../firebase/firebase.js';
import { bootstrapApplication } from './app.bootstrap.js';
import { Logger } from '../utils/logger.util.js';
import { hideLoadingOverlay } from '../components/loading-overlay.component.js';

bootstrapApplication().catch((error) => {
  Logger.error('Application failed to start:', error);
  hideLoadingOverlay();
});
