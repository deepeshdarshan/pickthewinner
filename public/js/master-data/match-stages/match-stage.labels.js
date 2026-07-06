/**
 * @fileoverview Match stage label lookup — no Firestore dependencies.
 * @module master-data/match-stages/match-stage.labels
 */

/** @type {Map<string, string>|null} */
let labelMap = null;

/**
 * @param {Array<{ value: string, label: string }>} stages
 * @returns {void}
 */
export function setMatchStageLabels(stages) {
  labelMap = new Map(stages.map((stage) => [stage.value, stage.label]));
}

/**
 * @returns {void}
 */
export function clearMatchStageLabels() {
  labelMap = null;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function getMatchStageLabel(value) {
  if (!value) {
    return '';
  }

  const label = labelMap?.get(value);

  if (label) {
    return label;
  }

  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
