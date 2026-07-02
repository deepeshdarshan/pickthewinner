/**
 * @fileoverview Contestant tournaments page — browse published tournaments.
 * @module tournament/tournaments.page
 */

import { showLoadingOverlay, hideLoadingOverlay } from '../components/loading-overlay.component.js';
import { showErrorToast } from '../utils/toast.util.js';
import { TOURNAMENT_MESSAGES } from './tournament.constants.js';
import {
  getTournamentById,
  getTournamentErrorMessage,
  listTournamentsForContestant,
} from './tournament.service.js';
import {
  renderContestantTournamentDetailPage,
  renderContestantTournamentListPage,
  renderContestantTournamentLoading,
  renderTournamentNotFound,
} from './tournament.renderer.js';
import { Logger } from '../utils/logger.util.js';

/**
 * @param {HTMLElement} outlet
 * @returns {void}
 */
export function render(outlet) {
  void initTournamentsPage(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function initTournamentsPage(outlet) {
  const params = new URLSearchParams(window.location.search);
  const tournamentId = params.get('id');

  if (tournamentId) {
    await renderDetailView(outlet, tournamentId);
    return;
  }

  await renderListView(outlet);
}

/**
 * @param {HTMLElement} outlet
 * @returns {Promise<void>}
 */
async function renderListView(outlet) {
  outlet.innerHTML = renderContestantTournamentLoading();
  showLoadingOverlay(TOURNAMENT_MESSAGES.LOADING);

  try {
    const tournaments = await listTournamentsForContestant();
    outlet.innerHTML = renderContestantTournamentListPage(tournaments);
  } catch (error) {
    Logger.error('[Tournaments] List failed:', error);
    outlet.innerHTML = renderTournamentNotFound(TOURNAMENT_MESSAGES.NO_VISIBLE_TOURNAMENTS);
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}

/**
 * @param {HTMLElement} outlet
 * @param {string} tournamentId
 * @returns {Promise<void>}
 */
async function renderDetailView(outlet, tournamentId) {
  outlet.innerHTML = renderContestantTournamentLoading();
  showLoadingOverlay(TOURNAMENT_MESSAGES.LOADING_TOURNAMENT);

  try {
    const tournaments = await listTournamentsForContestant();
    const tournament = tournaments.find((item) => item.id === tournamentId)
      ?? await getTournamentById(tournamentId);

    if (!tournament) {
      outlet.innerHTML = renderTournamentNotFound(TOURNAMENT_MESSAGES.NOT_FOUND);
      return;
    }

    outlet.innerHTML = renderContestantTournamentDetailPage(tournament);
  } catch (error) {
    Logger.error('[Tournaments] Detail failed:', error);
    outlet.innerHTML = renderTournamentNotFound(getTournamentErrorMessage(error));
    showErrorToast(getTournamentErrorMessage(error));
  } finally {
    hideLoadingOverlay();
  }
}
