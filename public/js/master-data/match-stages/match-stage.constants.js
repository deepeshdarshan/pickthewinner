/**
 * @fileoverview Match stage module constants.
 * @module master-data/match-stages/match-stage.constants
 */

import { FIRESTORE_COLLECTIONS } from '../../config/application.constants.js';

/** @enum {string} */
export const MATCH_STAGE_COLLECTIONS = Object.freeze({
  MATCH_STAGES: FIRESTORE_COLLECTIONS.MATCH_STAGES,
});

/** @enum {string} */
export const MATCH_STAGE_ROUTES = Object.freeze({
  ADMIN_LIST: '/admin/match-stages',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_STAGE_VALIDATION_MESSAGES = Object.freeze({
  LABEL_REQUIRED: 'Stage label is required.',
  LABEL_TOO_SHORT: 'Stage label must be at least 2 characters.',
  VALUE_REQUIRED: 'Stage key is required.',
  VALUE_INVALID: 'Stage key may only contain lowercase letters, numbers, and underscores.',
  SORT_ORDER_INVALID: 'Sort order must be a whole number >= 0.',
});

/** @type {Readonly<Record<string, string>>} */
export const MATCH_STAGE_MESSAGES = Object.freeze({
  LOADING: 'Loading match stages…',
  LOADING_STAGE: 'Loading match stage…',
  CREATING: 'Creating match stage…',
  UPDATING: 'Updating match stage…',
  DELETING: 'Deleting match stage…',
  CREATED: 'Match stage created successfully.',
  UPDATED: 'Match stage updated successfully.',
  DELETED: 'Match stage deleted successfully.',
  NOT_FOUND: 'Match stage not found.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  PERMISSION_DENIED: 'You do not have permission to manage match stages.',
  NO_STAGES: 'No match stages have been created yet.',
  CONFIRM_DELETE: 'Delete this match stage? Existing matches that reference it will continue to display the stored value.',
  VALIDATION_SUMMARY: 'Please correct the highlighted fields and try again.',
});

/** @type {ReadonlyArray<{ label: string, value: string, sortOrder: number }>} */
export const DEFAULT_MATCH_STAGES = Object.freeze([
  { label: 'Group Stage', value: 'group_stage', sortOrder: 10 },
  { label: 'Round of 32', value: 'round_of_32', sortOrder: 20 },
  { label: 'Round of 16', value: 'round_of_16', sortOrder: 30 },
  { label: 'Quarter Final', value: 'quarter_final', sortOrder: 40 },
  { label: 'Semi Final', value: 'semi_final', sortOrder: 50 },
  { label: 'Third Place', value: 'third_place', sortOrder: 55 },
  { label: 'Final', value: 'final', sortOrder: 60 },
]);

/**
 * @returns {Record<string, unknown>}
 */
export function createDefaultMatchStageFields() {
  return {
    active: true,
    sortOrder: 10,
  };
}

/**
 * @returns {Array<{ id: string, label: string, value: string, sortOrder: number, active: boolean, createdBy: string, updatedBy: string, createdAt: null, updatedAt: null }>}
 */
export function buildFallbackMatchStages() {
  return DEFAULT_MATCH_STAGES.map((stage) => ({
    id: `default_${stage.value}`,
    label: stage.label,
    value: stage.value,
    sortOrder: stage.sortOrder,
    active: true,
    createdBy: '',
    updatedBy: '',
    createdAt: null,
    updatedAt: null,
  }));
}

