# Quick Reference: Tournament Configuration - requireWinnerForDraw

## For Developers

### How to Use in Code

#### 1. Load Configuration

```javascript
import { TournamentConfigurationService } from '../tournament/configuration/TournamentConfigurationService.js';

// Load for specific tournament
await TournamentConfigurationService.load(tournamentId);

// Get the flag value
const requireWinnerForDraw = TournamentConfigurationService.requireWinnerForDraw();
```

#### 2. In Prediction Forms

```javascript
// Pass to prediction form
renderPredictionForm({ 
  match, 
  existingPrediction, 
  isEdit, 
  requireWinnerForDraw 
});

// Attach handlers with configuration
attachPredictionFormHandlers(
  form,
  requireWinnerForDraw,
  onSubmit,
  onCancel
);
```

#### 3. In Validation

```javascript
// Validate with configuration
const validation = validatePredictionPayload(payload, requireWinnerForDraw);

// Show/hide winner selection
const shouldShow = PredictionDomain.shouldShowWinnerSelection(
  homeScore, 
  awayScore, 
  requireWinnerForDraw
);
```

---

## For Tournament Admins

### Configuration UI

**Location:** Tournament Admin → Edit Tournament → Match Behaviour

**Toggle:** "Require Winner Selection for Draw Predictions"

**Options:**

- **Unchecked (Default)** = League-Style
  - Contestants can predict draws (e.g., 2-2)
  - No winner selection required
  - Best for league/group stage matches

- **Checked** = Knockout-Style
  - When contestants predict equal scores, they must select a winner
  - Only the winner is stored (not penalty scores)
  - Best for elimination/knockout matches

---

## Configuration Values

### Default Configuration

```javascript
{
  requireWinnerForDraw: false  // League-style (draws allowed)
}
```

### Tournament-Specific Configuration

Stored in tournament document:

```json
{
  "configuration": {
    "requireWinnerForDraw": false,
    "timezone": "Asia/Kolkata",
    "leaderboardVisible": false,
    ...
  }
}
```

---

## Behavior Matrix

| Prediction Scores | requireWinnerForDraw | Winner Selection Required? | Behavior |
|-------------------|----------------------|---------------------------|----------|
| 3-1 (different)   | false                | ❌ No                      | Save prediction |
| 3-1 (different)   | true                 | ❌ No                      | Save prediction |
| 2-2 (equal)       | false                | ❌ No                      | Save prediction (draw) |
| 2-2 (equal)       | true                 | ✅ Yes                     | Show winner selection |

---

## Common Patterns

### Pattern 1: Check Before Showing Form

```javascript
async function showPredictionForm(matchId) {
  const match = await getMatchById(matchId);
  await TournamentConfigurationService.load(match.tournamentId);
  const requireWinnerForDraw = TournamentConfigurationService.requireWinnerForDraw();
  
  renderPredictionForm({ 
    match, 
    requireWinnerForDraw 
  });
}
```

### Pattern 2: Validate on Submit

```javascript
async function submitPrediction(matchId, payload) {
  const match = await getMatchById(matchId);
  await TournamentConfigurationService.load(match.tournamentId);
  const requireWinnerForDraw = TournamentConfigurationService.requireWinnerForDraw();
  
  const validation = validatePredictionPayload(payload, requireWinnerForDraw);
  if (!validation.valid) {
    throw new Error(Object.values(validation.errors).join('. '));
  }
  
  // Save prediction...
}
```

### Pattern 3: Dynamic UI Updates

```javascript
homeScoreInput.addEventListener('input', () => {
  const homeScore = parseInt(homeScoreInput.value, 10);
  const awayScore = parseInt(awayScoreInput.value, 10);
  
  if (requireWinnerForDraw && homeScore === awayScore) {
    winnerSelectionSection.style.display = 'block';
  } else {
    winnerSelectionSection.style.display = 'none';
  }
});
```

---

## Migration from Old Configuration

### Old Configuration (Deprecated)

```javascript
{
  canEndInDraw: true,      // ❌ Don't use
  requiresWinner: false    // ❌ Don't use
}
```

### New Configuration

```javascript
{
  requireWinnerForDraw: false  // ✅ Use this
}
```

### Automatic Translation

The service automatically handles legacy configurations:

```javascript
// If old config exists:
// canEndInDraw: true  → requireWinnerForDraw: false
// requiresWinner: true → requireWinnerForDraw: true
```

---

## Troubleshooting

### Winner Selection Not Showing

**Check:**
1. Is `requireWinnerForDraw` set to `true` in tournament configuration?
2. Are the predicted scores equal?
3. Is the form component receiving the correct `requireWinnerForDraw` prop?

### Prediction Rejected with "Winner Required"

**Cause:** Tournament has `requireWinnerForDraw: true` and scores are equal but no winner selected.

**Solution:** Select a winner from the dropdown before submitting.

### Default Behavior

If configuration is not set or tournament is missing the flag:
- **Default:** `requireWinnerForDraw: false` (league-style)
- Draws are allowed without winner selection

---

## Testing

### Unit Tests

```javascript
// Test winner selection visibility
assert.equal(
  PredictionDomain.shouldShowWinnerSelection(2, 2, true), 
  true
);

// Test validation
const result = PredictionDomain.validatePredictionScores({
  homeScore: 2,
  awayScore: 2,
  penaltyWinner: null,
  requireWinnerForDraw: true,
});
assert.equal(result.valid, false);
```

### Manual Testing

1. Create tournament with `requireWinnerForDraw: false`
2. Make prediction with equal scores (e.g., 2-2)
3. Verify no winner selection required
4. Update tournament to `requireWinnerForDraw: true`
5. Make prediction with equal scores
6. Verify winner selection appears and is required

---

## Related Files

- **Service:** `public/js/tournament/configuration/TournamentConfigurationService.js`
- **Form:** `public/js/prediction/prediction-form.component.js`
- **Validation:** `public/js/domain/prediction.domain.js`
- **Submission:** `public/js/prediction/prediction-submission.service.js`
- **Tests:** `tests/prediction.domain.test.js`

---

**Last Updated:** July 2, 2026  
**Version:** 1.0

