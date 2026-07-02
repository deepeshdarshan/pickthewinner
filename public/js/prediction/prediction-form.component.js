/**
 * @fileoverview Prediction form component for entering and editing predictions.
 * @module prediction/prediction-form.component
 */

import { escapeHtml } from '../utils/html.util.js';

/**
 * @typedef {Object} PredictionFormOptions
 * @property {import('../match/match.service.js').EnrichedMatch} match
 * @property {Record<string, unknown>|null} [existingPrediction]
 * @property {boolean} [isEdit]
 * @property {boolean} [requireWinnerForDraw] - Tournament configuration
 */

/**
 * Renders prediction form.
 * @param {PredictionFormOptions} options
 * @returns {string}
 */
export function renderPredictionForm(options) {
  const { match, existingPrediction = null, isEdit = false, requireWinnerForDraw = false } = options;

  const homeTeam = match.homeTeam?.name || 'Home';
  const awayTeam = match.awayTeam?.name || 'Away';
  const homeScore = existingPrediction?.homeScore ?? '';
  const awayScore = existingPrediction?.awayScore ?? '';
  const penaltyWinner = existingPrediction?.penaltyWinner || '';

  return `
    <div class="card ptw-card">
      <div class="card-header">
        <h5 class="mb-0">${isEdit ? 'Edit' : 'Make'} Prediction</h5>
      </div>
      <div class="card-body">
        <!-- Match Info -->
        <div class="text-center mb-4">
          <div class="row align-items-center g-3">
            <div class="col-5 text-center">
              ${match.homeTeam?.flag ? `<img src="${escapeHtml(match.homeTeam.flag)}" alt="${escapeHtml(homeTeam)}" class="ptw-team-flag mb-2" style="width: 48px; height: 48px; object-fit: contain;">` : ''}
              <h6 class="mb-0">${escapeHtml(homeTeam)}</h6>
            </div>
            <div class="col-2 text-center">
              <div class="ptw-text-muted">VS</div>
            </div>
            <div class="col-5 text-center">
              ${match.awayTeam?.flag ? `<img src="${escapeHtml(match.awayTeam.flag)}" alt="${escapeHtml(awayTeam)}" class="ptw-team-flag mb-2" style="width: 48px; height: 48px; object-fit: contain;">` : ''}
              <h6 class="mb-0">${escapeHtml(awayTeam)}</h6>
            </div>
          </div>
        </div>

        <!-- Prediction Form -->
        <form id="prediction-form" data-match-id="${escapeHtml(match.id)}">
          <div class="row g-3 mb-4">
            <!-- Home Score -->
            <div class="col-6">
              <label for="home-score" class="form-label">${escapeHtml(homeTeam)} Score</label>
              <input 
                type="number" 
                class="form-control form-control-lg text-center" 
                id="home-score" 
                name="homeScore"
                min="0" 
                max="20" 
                value="${escapeHtml(String(homeScore))}"
                required
                placeholder="0"
              >
              <div class="invalid-feedback">Please enter a valid score (0-20)</div>
            </div>

            <!-- Away Score -->
            <div class="col-6">
              <label for="away-score" class="form-label">${escapeHtml(awayTeam)} Score</label>
              <input 
                type="number" 
                class="form-control form-control-lg text-center" 
                id="away-score" 
                name="awayScore"
                min="0" 
                max="20" 
                value="${escapeHtml(String(awayScore))}"
                required
                placeholder="0"
              >
              <div class="invalid-feedback">Please enter a valid score (0-20)</div>
            </div>
          </div>

          <!-- Winner Selection (shown when draw predicted and required by tournament) -->
          ${requireWinnerForDraw ? `
            <div id="winner-selection-section" class="mb-4" style="display: none;">
              <div class="alert alert-info">
                <i class="bi bi-info-circle me-2" aria-hidden="true"></i>
                <strong>Draw Predicted:</strong> Please select which team will win after Normal Time + Extra Time.
              </div>
              <label for="penalty-winner" class="form-label">Winner After Normal Time + Extra Time</label>
              <select class="form-select" id="penalty-winner" name="penaltyWinner">
                <option value="">Select winner...</option>
                <option value="HOME" ${penaltyWinner === 'HOME' ? 'selected' : ''}>${escapeHtml(homeTeam)}</option>
                <option value="AWAY" ${penaltyWinner === 'AWAY' ? 'selected' : ''}>${escapeHtml(awayTeam)}</option>
              </select>
              <div class="invalid-feedback">Please select a winner for draw predictions</div>
            </div>
          ` : ''}

          <!-- Validation Errors -->
          <div id="prediction-form-errors" class="alert alert-danger d-none" role="alert"></div>

          <!-- Action Buttons -->
          <div class="d-flex gap-2">
            <button type="submit" class="btn btn-ptw-primary flex-grow-1">
              <i class="bi ${isEdit ? 'bi-check-circle' : 'bi-send'} me-2" aria-hidden="true"></i>
              ${isEdit ? 'Update' : 'Submit'} Prediction
            </button>
            <button type="button" class="btn btn-outline-secondary" data-action="cancel-prediction">
              Cancel
            </button>
          </div>
        </form>

        <!-- Info -->
        <div class="mt-3 pt-3 border-top">
          <small class="ptw-text-muted">
            <i class="bi bi-info-circle me-1" aria-hidden="true"></i>
            ${requireWinnerForDraw 
              ? 'If you predict equal scores, you must select which team will win after normal and extra time (winner is decided, never penalty shootout scores).'
              : 'Enter the final score you predict for this match. Draws are valid predictions.'
            }
          </small>
        </div>
      </div>
    </div>
  `;
}

/**
 * Attaches event handlers to prediction form.
 * @param {HTMLFormElement} form
 * @param {boolean} requireWinnerForDraw - Tournament configuration
 * @param {(payload: Record<string, unknown>) => Promise<void>} onSubmit
 * @param {() => void} onCancel
 * @returns {void}
 */
export function attachPredictionFormHandlers(form, requireWinnerForDraw, onSubmit, onCancel) {
  const homeScoreInput = form.querySelector('#home-score');
  const awayScoreInput = form.querySelector('#away-score');
  const winnerSelectionSection = form.querySelector('#winner-selection-section');
  const penaltyWinnerSelect = form.querySelector('#penalty-winner');
  const errorsDiv = form.querySelector('#prediction-form-errors');

  // Show/hide winner selection section based on scores
  if (requireWinnerForDraw && homeScoreInput && awayScoreInput && winnerSelectionSection) {
    const checkScores = () => {
      const homeScore = parseInt(homeScoreInput.value, 10);
      const awayScore = parseInt(awayScoreInput.value, 10);

      if (!isNaN(homeScore) && !isNaN(awayScore) && homeScore === awayScore) {
        winnerSelectionSection.style.display = 'block';
        if (penaltyWinnerSelect) {
          penaltyWinnerSelect.required = true;
        }
      } else {
        winnerSelectionSection.style.display = 'none';
        if (penaltyWinnerSelect) {
          penaltyWinnerSelect.required = false;
          penaltyWinnerSelect.value = '';
        }
      }
    };

    homeScoreInput.addEventListener('input', checkScores);
    awayScoreInput.addEventListener('input', checkScores);

    // Check initial state
    checkScores();
  }

  // Form submission
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Clear previous errors
    form.classList.remove('was-validated');
    if (errorsDiv) {
      errorsDiv.classList.add('d-none');
      errorsDiv.textContent = '';
    }

    // Validate
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    const formData = new FormData(form);
    const homeScore = parseInt(formData.get('homeScore'), 10);
    const awayScore = parseInt(formData.get('awayScore'), 10);
    const penaltyWinner = formData.get('penaltyWinner') || null;

    if (isNaN(homeScore) || isNaN(awayScore)) {
      if (errorsDiv) {
        errorsDiv.textContent = 'Please enter valid scores';
        errorsDiv.classList.remove('d-none');
      }
      return;
    }

    // Check winner selection requirement
    if (requireWinnerForDraw && homeScore === awayScore && !penaltyWinner) {
      if (errorsDiv) {
        errorsDiv.textContent = 'Please select a winner when predicting equal scores';
        errorsDiv.classList.remove('d-none');
      }
      return;
    }

    const payload = {
      homeScore,
      awayScore,
      penaltyWinner,
    };

    try {
      // Disable submit button
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
      }

      await onSubmit(payload);
    } catch (error) {
      if (errorsDiv) {
        errorsDiv.textContent = error.message || 'Failed to save prediction';
        errorsDiv.classList.remove('d-none');
      }

      // Re-enable submit button
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.innerHTML = `<i class="bi bi-send me-2" aria-hidden="true"></i>Submit Prediction`;
      }
    }
  });

  // Cancel button
  const cancelButton = form.querySelector('[data-action="cancel-prediction"]');
  if (cancelButton) {
    cancelButton.addEventListener('click', onCancel);
  }
}

