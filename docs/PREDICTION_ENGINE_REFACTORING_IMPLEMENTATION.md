# Prediction Engine Configuration-Driven Refactoring

**Version:** 1.0  
**Status:** Implemented  
**Date:** July 2, 2026

## Overview

This document describes the implementation of a configuration-driven Prediction Engine that replaces hardcoded football-specific rules with flexible tournament and match configurations.

## Objectives

1. ✅ Replace `canEndInDraw` and `requiresWinner` with single `requireWinnerSelectionForDrawPrediction` configuration
2. ✅ Remove penalty shootout checkbox and penalty score collection
3. ✅ Implement automatic winner selection display based on score equality
4. ✅ Update Firestore schema to use `predictedWinner` instead of `isPenaltyShootout` and `penaltyWinner`
5. ✅ Add prediction status field to support lifecycle management
6. ✅ Update all validation logic to be configuration-driven
7. ✅ Maintain backward compatibility with existing configurations

## Implementation Summary

### 1. Tournament Configuration Schema Changes

#### Files Modified
- `public/js/tournament/tournament.constants.js`
- `public/js/tournament/tournament.service.js`
- `public/js/tournament/configuration/TournamentConfigurationService.js`

#### Changes Made

**Replaced Configuration Fields:**
- ❌ Removed: `canEndInDraw: boolean`
- ❌ Removed: `requiresWinner: boolean`
- ✅ Added: `requireWinnerSelectionForDrawPrediction: boolean`

**Configuration Behavior:**

When `requireWinnerSelectionForDrawPrediction = false` (Default):
- Draws are valid predictions without additional winner selection
- Suitable for league-style tournaments
- No winner selection UI is shown

When `requireWinnerSelectionForDrawPrediction = true`:
- Equal scores require selecting which team wins after Normal Time + Extra Time
- Winner selection UI automatically appears when scores are equal
- Only the winner is stored, never penalty shootout scores
- Suitable for knockout tournaments

**Backward Compatibility:**
```javascript
requireWinnerSelectionForDrawPrediction() {
  const config = cachedConfiguration ?? this.getDefaultConfiguration();
  
  // Check new field name first
  if (config.requireWinnerSelectionForDrawPrediction !== undefined) {
    return Boolean(config.requireWinnerSelectionForDrawPrediction);
  }
  
  // Handle legacy configurations
  if (config.requireWinnerForDraw !== undefined) {
    return Boolean(config.requireWinnerForDraw);
  }
  
  // Legacy fallback for canEndInDraw/requiresWinner
  if (config.canEndInDraw !== undefined) {
    return !Boolean(config.canEndInDraw);
  }
  
  if (config.requiresWinner !== undefined) {
    return Boolean(config.requiresWinner);
  }
  
  return false; // Default
}
```

### 2. Prediction Schema Changes

#### Files Modified
- `public/js/domain/prediction.domain.js`
- `public/js/prediction/prediction-submission.service.js`
- `public/js/prediction/prediction.repository.js`

#### Schema Changes

**Removed Fields:**
- ❌ `isPenaltyShootout: boolean` - No longer needed
- ❌ `penaltyWinner: string` - Renamed for clarity

**Added/Updated Fields:**
- ✅ `predictedWinner: string | null` - Stores 'HOME' or 'AWAY' when draw predicted and winner selection required
- ✅ `status: string` - Prediction lifecycle status

**Prediction Status Values:**
```javascript
export const PREDICTION_STATUS = Object.freeze({
  NOT_AVAILABLE: 'not_available',
  OPEN: 'open',
  SAVED: 'saved',
  UPDATED: 'updated',
  LOCKED: 'locked',
  SCORED: 'scored',
  ARCHIVED: 'archived',
});
```

### 3. Validation Logic Updates

#### Files Modified
- `public/js/domain/prediction.domain.js`
- `public/js/prediction/prediction-submission.service.js`

#### New Validation Rules

**Winner Selection Validation:**

1. **When `requireWinnerSelectionForDrawPrediction = false`:**
   - Equal scores without winner → ✅ Valid
   - Different scores without winner → ✅ Valid
   - Any scores with winner selection → ❌ Invalid (winner not allowed)

2. **When `requireWinnerSelectionForDrawPrediction = true`:**
   - Equal scores with valid winner → ✅ Valid
   - Equal scores without winner → ❌ Invalid (winner required)
   - Different scores without winner → ✅ Valid
   - Different scores with winner → ❌ Invalid (winner only for draws)

**Updated Function Signature:**
```javascript
validatePredictionScores({
  homeScore,
  awayScore,
  predictedWinner = null,
  requireWinnerSelectionForDrawPrediction = false,
})
```

### 4. UI Component Updates

#### Files Modified
- `public/js/prediction/prediction-form.component.js`

#### Changes Made

**Form Field Updates:**
- ID changed from `penalty-winner` to `predicted-winner`
- Name changed from `penaltyWinner` to `predictedWinner`
- Updated label: "Who will win after Normal Time + Extra Time?"

**Automatic Winner Selection Display:**
```javascript
const checkScores = () => {
  const homeScore = parseInt(homeScoreInput.value, 10);
  const awayScore = parseInt(awayScoreInput.value, 10);
  
  if (!isNaN(homeScore) && !isNaN(awayScore) && homeScore === awayScore) {
    winnerSelectionSection.style.display = 'block';
    predictedWinnerSelect.required = true;
  } else {
    winnerSelectionSection.style.display = 'none';
    predictedWinnerSelect.required = false;
    predictedWinnerSelect.value = '';
  }
};
```

**Updated Help Text:**
- When enabled: "If you predict equal scores, you must select which team will win after normal and extra time. Do not enter penalty shootout scores."
- When disabled: "Enter the final score you predict for this match. Draws are valid predictions."

### 5. Test Updates

#### Files Modified
- `tests/prediction.domain.test.js`

#### Test Cases Added/Updated

✅ All tests updated to use new field names:
- `predictedWinner` instead of `penaltyWinner`
- `requireWinnerSelectionForDrawPrediction` instead of `requireWinnerForDraw`
- Removed `isPenaltyShootout` parameter

✅ New test case added:
- "rejects different scores with winner selection" - Ensures winner can only be selected when scores are equal

**Test Results:**
```
✔ PredictionDomain winner selection workflow (1.670333ms)
  ✔ hides winner selection when draws do not require winner
  ✔ shows winner selection for equal scores when required
  ✔ rejects equal scores without winner selection when required
  ✔ accepts equal scores with winner when required
  ✔ accepts different scores without winner data
  ✔ rejects different scores with winner selection
  ✔ accepts equal scores without winner when draws allowed
```

## Data Migration Strategy

### Existing Predictions

**Option 1: Automatic Migration (Recommended)**

Create a migration script that:
1. Identifies predictions with `isPenaltyShootout = true`
2. Copies `penaltyWinner` to `predictedWinner`
3. Removes `isPenaltyShootout` field
4. Adds `status: 'saved'` if missing

```javascript
// Migration pseudocode
predictions.forEach(prediction => {
  if (prediction.isPenaltyShootout && prediction.penaltyWinner) {
    prediction.predictedWinner = prediction.penaltyWinner;
  }
  delete prediction.isPenaltyShootout;
  delete prediction.penaltyWinner;
  if (!prediction.status) {
    prediction.status = 'saved';
  }
});
```

**Option 2: Backward-Compatible Read**

Update `getExistingPrediction()` to handle both schemas temporarily:
```javascript
predictedWinner: data.predictedWinner || data.penaltyWinner || null,
```

### Existing Tournaments

No migration required. The backward compatibility logic handles:
- Old configurations with `canEndInDraw`/`requiresWinner`
- Old configurations with `requireWinnerForDraw`
- New configurations with `requireWinnerSelectionForDrawPrediction`

## Breaking Changes

### API Changes

1. **Prediction Payload:**
   - ❌ Removed: `penaltyWinner`
   - ✅ Added: `predictedWinner`

2. **Prediction Response:**
   - ❌ Removed: `isPenaltyShootout`
   - ❌ Removed: `penaltyWinner`
   - ✅ Added: `predictedWinner`
   - ✅ Added: `status`

3. **Tournament Configuration:**
   - ❌ Removed: `canEndInDraw`
   - ❌ Removed: `requiresWinner`
   - ✅ Added: `requireWinnerSelectionForDrawPrediction`

### Form Field Names

- ID: `penalty-winner` → `predicted-winner`
- Name: `penaltyWinner` → `predictedWinner`

## Configuration Examples

### League Tournament (Draws Allowed)
```javascript
{
  name: "Premier League 2026",
  configuration: {
    requireWinnerSelectionForDrawPrediction: false,
    // ... other config
  }
}
```

**Prediction Behavior:**
- Brazil 2 - 2 Argentina → ✅ Valid (no winner selection needed)
- Brazil 3 - 1 Argentina → ✅ Valid

### Knockout Tournament (Winner Required for Draws)
```javascript
{
  name: "World Cup 2026 - Knockout Stage",
  configuration: {
    requireWinnerSelectionForDrawPrediction: true,
    // ... other config
  }
}
```

**Prediction Behavior:**
- Brazil 2 - 2 Argentina + Winner: Brazil → ✅ Valid
- Brazil 2 - 2 Argentina + No Winner → ❌ Invalid
- Brazil 3 - 1 Argentina → ✅ Valid (winner implied)

## Acceptance Criteria

✅ Contestants can view only Published and Active tournaments  
✅ Contestants can view only Published matches  
✅ Contestants can submit predictions only while the prediction window is open  
✅ Manual prediction overrides take precedence (existing feature from MANUAL_PREDICTION_OVERRIDES.md)  
✅ A single configuration (`requireWinnerSelectionForDrawPrediction`) controls winner selection  
✅ Winner selection displays automatically when predicted scores are equal  
✅ No penalty shootout checkbox exists  
✅ Penalty shootout scores are never requested or stored  
✅ Only the predicted winner is stored when required  
✅ Different scores automatically hide the winner selection  
✅ Contestants can edit predictions only while predictions are open  
✅ Locked predictions are read-only  
✅ The Prediction Engine remains configuration-driven

## Future Enhancements

### Phase 2 (Not Yet Implemented)

1. **Match Configuration Fields:**
   - Add `predictionOpenTime` override at match level
   - Add `predictionCloseTime` override at match level
   - Add `matchVisibility` explicit control

2. **Dashboard Integration:**
   - Display read-only scoring results after match completion
   - Show: Actual Match Score, My Prediction, Winner Correct?, Exact Score Correct?, Points Awarded

3. **Prediction Status Lifecycle:**
   - Implement automatic status transitions
   - Add status-based UI indicators
   - Status-based filtering and sorting

4. **Enhanced Manual Overrides:**
   - Admin UI for bulk override management
   - Override expiration timestamps
   - Override history tracking

## Related Documents

- [MANUAL_PREDICTION_OVERRIDES.md](MANUAL_PREDICTION_OVERRIDES.md) - Manual override implementation
- [03_BUSINESS_RULES_AND_DOMAIN_MODEL.md](product/03_BUSINESS_RULES_AND_DOMAIN_MODEL.md) - Business rules
- [05_DATABASE_SCHEMA.md](05_DATABASE_SCHEMA.md) - Database schema
- [TOURNAMENT_CONFIGURATION_SIMPLIFICATION.md](TOURNAMENT_CONFIGURATION_SIMPLIFICATION.md) - Previous config changes

## Testing Recommendations

### Manual Testing Checklist

#### League Tournament (Draws Allowed)
- [ ] Create tournament with `requireWinnerSelectionForDrawPrediction: false`
- [ ] Submit prediction with equal scores (no winner selection shown)
- [ ] Submit prediction with different scores
- [ ] Verify both predictions save successfully
- [ ] Verify no winner selection UI appears

#### Knockout Tournament (Winner Required)
- [ ] Create tournament with `requireWinnerSelectionForDrawPrediction: true`
- [ ] Submit prediction with different scores
- [ ] Submit prediction with equal scores (verify winner selection appears)
- [ ] Try to submit equal scores without winner (verify validation error)
- [ ] Submit equal scores with winner selection
- [ ] Change scores from equal to different (verify winner selection hides)
- [ ] Verify predictedWinner is null when scores differ

#### Backward Compatibility
- [ ] Load existing tournament with `canEndInDraw` configuration
- [ ] Verify prediction form works correctly
- [ ] Load existing tournament with `requiresWinner` configuration
- [ ] Verify prediction form works correctly

#### Validation
- [ ] Verify winner cannot be selected when scores differ
- [ ] Verify winner is required when scores are equal (if configured)
- [ ] Verify form validation messages are clear
- [ ] Verify server-side validation matches client-side

## Deployment Notes

### Pre-Deployment

1. Review all tournament configurations
2. Identify tournaments using old configuration fields
3. Plan data migration strategy
4. Back up predictions collection

### Deployment Steps

1. Deploy new code
2. Run data migration script (if using Option 1)
3. Monitor error logs for validation issues
4. Verify prediction submission works for both configurations

### Rollback Plan

If issues occur:
1. Revert code to previous version
2. Restore prediction data from backup (if migrated)
3. Investigate and fix issues
4. Re-deploy when ready

## Changelog

### Version 1.0 - July 2, 2026
- Initial implementation
- Replaced `canEndInDraw`/`requiresWinner` with `requireWinnerSelectionForDrawPrediction`
- Removed `isPenaltyShootout` checkbox and penalty score collection
- Renamed `penaltyWinner` to `predictedWinner`
- Added `status` field to predictions
- Implemented automatic winner selection display
- Updated validation logic to be configuration-driven
- Added backward compatibility support
- Updated tests
- Created comprehensive documentation

