/**
 * @fileoverview Prediction submission service — handles contestant prediction CRUD operations.
 * @module prediction/prediction-submission.service
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';
import { db, ensureFirestoreOnline } from '../firebase/firebase.js';
import { getCurrentUser } from '../auth/auth.service.js';
import { getMatchById } from '../match/match.service.js';
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';
import { MatchDomain } from '../domain/match.domain.js';
import { Logger } from '../utils/logger.util.js';

const PREDICTIONS_COLLECTION = 'predictions';

/**
 * @typedef {Object} PredictionPayload
 * @property {number} homeScore
 * @property {number} awayScore
 * @property {string|null} [penaltyWinner]
 */

/**
 * @typedef {Object} Prediction
 * @property {string} id
 * @property {string} userId
 * @property {string} matchId
 * @property {string} tournamentId
 * @property {number} homeScore
 * @property {number} awayScore
 * @property {boolean} isPenaltyShootout
 * @property {string|null} penaltyWinner
 * @property {boolean} locked
 * @property {import('firebase/firestore').Timestamp|Date|null} submittedAt
 * @property {import('firebase/firestore').Timestamp|Date|null} updatedAt
 */

/**
 * Validates prediction payload.
 * @param {PredictionPayload} payload
 * @param {boolean} requireWinnerForDraw
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
function validatePredictionPayload(payload, requireWinnerForDraw) {
  const errors = {};

  if (!Number.isInteger(payload.homeScore) || payload.homeScore < 0) {
    errors.homeScore = 'Home score must be a non-negative integer';
  }

  if (!Number.isInteger(payload.awayScore) || payload.awayScore < 0) {
    errors.awayScore = 'Away score must be a non-negative integer';
  }

  const isDraw = payload.homeScore === payload.awayScore;

  if (requireWinnerForDraw && isDraw && !payload.penaltyWinner) {
    errors.penaltyWinner = 'Winner selection is required when predicting equal scores';
  }

  if (!requireWinnerForDraw && payload.penaltyWinner) {
    errors.penaltyWinner = 'Winner cannot be selected when draws are allowed';
  }

  if (payload.penaltyWinner && !['HOME', 'AWAY'].includes(payload.penaltyWinner)) {
    errors.penaltyWinner = 'Winner must be either HOME or AWAY';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Checks if a prediction can be edited.
 * @param {string} matchId
 * @returns {Promise<{ canEdit: boolean, reason?: string }>}
 */
export async function canEditPrediction(matchId) {
  try {
    const match = await getMatchById(matchId);

    if (!match) {
      return { canEdit: false, reason: 'Match not found' };
    }

    if (!match.visible) {
      return { canEdit: false, reason: 'Match is not visible' };
    }

    const kickoff = match.kickoffUtc instanceof Date
      ? match.kickoffUtc
      : match.kickoffUtc?.toDate?.() ?? null;

    if (!kickoff) {
      return { canEdit: false, reason: 'Match kickoff time is not set' };
    }

    await TournamentConfigurationService.load(match.tournamentId);
    const lockMinutes = TournamentConfigurationService.getPredictionLockMinutes();

    const isPredictionOpen = MatchDomain.isPredictionOpen(match.status, kickoff, lockMinutes);

    if (!isPredictionOpen) {
      return { canEdit: false, reason: 'Prediction window is closed' };
    }

    return { canEdit: true };
  } catch (error) {
    Logger.error('[PredictionSubmission] canEditPrediction error:', error);
    return { canEdit: false, reason: 'Unable to verify prediction status' };
  }
}

/**
 * Gets existing prediction for a match and user.
 * @param {string} matchId
 * @param {string} userId
 * @returns {Promise<Prediction|null>}
 */
export async function getExistingPrediction(matchId, userId) {
  await ensureFirestoreOnline();

  const predictionsRef = collection(db, PREDICTIONS_COLLECTION);
  const q = query(
    predictionsRef,
    where('matchId', '==', matchId),
    where('userId', '==', userId),
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();

  return {
    id: docSnap.id,
    userId: data.userId || '',
    matchId: data.matchId || '',
    tournamentId: data.tournamentId || '',
    homeScore: Number(data.homeScore ?? 0),
    awayScore: Number(data.awayScore ?? 0),
    isPenaltyShootout: Boolean(data.isPenaltyShootout),
    penaltyWinner: data.penaltyWinner || null,
    locked: Boolean(data.locked),
    submittedAt: data.submittedAt || null,
    updatedAt: data.updatedAt || null,
  };
}

/**
 * Submits a new prediction.
 * @param {string} matchId
 * @param {PredictionPayload} payload
 * @returns {Promise<Prediction>}
 */
export async function submitPrediction(matchId, payload) {
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be authenticated to submit predictions');
  }

  const editCheck = await canEditPrediction(matchId);

  if (!editCheck.canEdit) {
    throw new Error(editCheck.reason || 'Cannot submit prediction at this time');
  }

  const match = await getMatchById(matchId);

  if (!match) {
    throw new Error('Match not found');
  }

  // Load tournament configuration
  await TournamentConfigurationService.load(match.tournamentId);
  const requireWinnerForDraw = TournamentConfigurationService.requireWinnerForDraw();

  const validation = validatePredictionPayload(payload, requireWinnerForDraw);

  if (!validation.valid) {
    const errorMessage = Object.values(validation.errors).join('. ');
    throw Object.assign(new Error(errorMessage), { validation });
  }

  // Check if prediction already exists
  const existing = await getExistingPrediction(matchId, user.uid);

  if (existing) {
    throw new Error('Prediction already exists for this match. Use update instead.');
  }

  await ensureFirestoreOnline();

  const isDraw = payload.homeScore === payload.awayScore;
  const predictionData = {
    userId: user.uid,
    matchId,
    tournamentId: match.tournamentId,
    homeScore: payload.homeScore,
    awayScore: payload.awayScore,
    isPenaltyShootout: requireWinnerForDraw && isDraw,
    penaltyWinner: (requireWinnerForDraw && isDraw) ? payload.penaltyWinner : null,
    locked: false,
    submittedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, PREDICTIONS_COLLECTION), predictionData);

  Logger.info('[PredictionSubmission] Prediction submitted:', docRef.id);

  return {
    id: docRef.id,
    ...predictionData,
    submittedAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Updates an existing prediction.
 * @param {string} matchId
 * @param {PredictionPayload} payload
 * @returns {Promise<Prediction>}
 */
export async function updatePrediction(matchId, payload) {
  const user = getCurrentUser();

  if (!user) {
    throw new Error('User must be authenticated to update predictions');
  }

  const editCheck = await canEditPrediction(matchId);

  if (!editCheck.canEdit) {
    throw new Error(editCheck.reason || 'Cannot update prediction at this time');
  }

  const match = await getMatchById(matchId);

  if (!match) {
    throw new Error('Match not found');
  }

  const existing = await getExistingPrediction(matchId, user.uid);

  if (!existing) {
    throw new Error('No prediction found for this match. Use submit instead.');
  }

  if (existing.locked) {
    throw new Error('Prediction is locked and cannot be updated');
  }

  // Load tournament configuration
  await TournamentConfigurationService.load(match.tournamentId);
  const requireWinnerForDraw = TournamentConfigurationService.requireWinnerForDraw();

  const validation = validatePredictionPayload(payload, requireWinnerForDraw);

  if (!validation.valid) {
    const errorMessage = Object.values(validation.errors).join('. ');
    throw Object.assign(new Error(errorMessage), { validation });
  }

  await ensureFirestoreOnline();

  const isDraw = payload.homeScore === payload.awayScore;
  const updateData = {
    homeScore: payload.homeScore,
    awayScore: payload.awayScore,
    isPenaltyShootout: requireWinnerForDraw && isDraw,
    penaltyWinner: (requireWinnerForDraw && isDraw) ? payload.penaltyWinner : null,
    updatedAt: serverTimestamp(),
  };

  const docRef = doc(db, PREDICTIONS_COLLECTION, existing.id);
  await updateDoc(docRef, updateData);

  Logger.info('[PredictionSubmission] Prediction updated:', existing.id);

  return {
    ...existing,
    ...updateData,
    updatedAt: new Date(),
  };
}

/**
 * Gets prediction summary for a user in a tournament.
 * @param {string} userId
 * @param {string} tournamentId
 * @returns {Promise<{ total: number, submitted: number, correct: number, exactScore: number }>}
 */
export async function getPredictionSummary(userId, tournamentId) {
  await ensureFirestoreOnline();

  const predictionsRef = collection(db, PREDICTIONS_COLLECTION);
  const q = query(
    predictionsRef,
    where('userId', '==', userId),
    where('tournamentId', '==', tournamentId),
  );

  const snapshot = await getDocs(q);

  const summary = {
    total: snapshot.size,
    submitted: snapshot.size,
    correct: 0,
    exactScore: 0,
  };

  // TODO: Calculate correct and exactScore based on match results
  // This requires comparing prediction with actual match results

  return summary;
}

