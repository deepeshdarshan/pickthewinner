/**
 * @fileoverview Pure helpers for tournament permanent delete batching.
 * @module tournament/tournament-delete.util
 */

/** Firestore write batch operation limit. */
export const TOURNAMENT_DELETE_BATCH_SIZE = 500;

/**
 * Splits document refs into chunks sized for Firestore batch commits.
 * @param {ReadonlyArray<unknown>} refs
 * @param {number} [batchSize=TOURNAMENT_DELETE_BATCH_SIZE]
 * @returns {Array<Array<unknown>>}
 */
export function chunkDocumentRefsForDelete(refs, batchSize = TOURNAMENT_DELETE_BATCH_SIZE) {
  const chunks = [];

  for (let index = 0; index < refs.length; index += batchSize) {
    chunks.push(refs.slice(index, index + batchSize));
  }

  return chunks;
}
