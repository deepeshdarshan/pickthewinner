# Manual Prediction Window Overrides

**Version:** 1.0  
**Status:** Implemented  
**Date:** July 2, 2026

## Overview

The Manual Prediction Window Overrides feature allows tournament administrators to manually control when predictions open and close for matches, overriding the automatic scheduling system.

## Background

Previously, all matches used automatic prediction scheduling based on configured timestamps:
- **Prediction Open Time**: Calculated as kickoff time minus `predictionOpenHours`
- **Prediction Close Time**: Calculated as kickoff time minus `predictionLockMinutes`

While automatic scheduling works well for most scenarios, administrators occasionally need manual control for special circumstances such as:
- Technical issues requiring prediction window adjustments
- Last-minute match schedule changes
- Tournament-specific exceptions
- Emergency situations requiring immediate prediction closure

## Feature Description

### Priority System

Prediction availability is determined using the following priority:

1. **Manual Override** (Highest Priority)
   - When an administrator manually opens or closes predictions
   - Takes precedence over all automatic scheduling
   - Persists across application restarts

2. **Automatic Scheduling** (Default Behavior)
   - Based on configured `predictionOpenHours` and `predictionLockMinutes`
   - Only applies when no manual override exists
   - Continues to work for all existing matches

### Manual Override Behavior

#### Open Predictions Action

**Availability:**
- Only available when match status is `PUBLISHED` or `PREDICTION_LOCKED`
- Hidden after predictions have been manually opened

**Effect:**
- Immediately sets match status to `PREDICTION_OPEN`
- Creates persistent override record in database
- Prevents automatic scheduler from changing prediction state
- Logs the action to audit trail

#### Close Predictions Action

**Availability:**
- Only available when match status is `PREDICTION_OPEN`

**Effect:**
- Immediately sets match status to `PREDICTION_LOCKED`
- Creates persistent override record in database
- Prevents automatic reopening by scheduler
- Logs the action to audit trail

### Scheduler Behavior

The automatic scheduler (`getMatchWithEffectiveStatus`) now:

1. Checks if manual override is active
2. If override exists: Skip automatic status transitions
3. If no override: Apply normal automatic scheduling logic

This ensures manual overrides are never accidentally overwritten by the scheduler.

## Database Schema Changes

### New Field: `predictionOverride`

Added to the `matches` collection:

```javascript
{
  predictionOverride: {
    isActive: boolean,      // Whether override is active
    status: string,         // Override status (PREDICTION_OPEN or PREDICTION_LOCKED)
    timestamp: Timestamp,   // When override was created
    performedBy: string,    // UID of administrator who created override
    reason: string          // Optional reason/note for audit purposes
  }
}
```

**Default Value:** `null` or `{ isActive: false }`

**Backward Compatibility:** Existing matches without this field default to `isActive: false`, maintaining automatic scheduling.

## UI Changes

### Match Detail Page (Administrator View)

**Override Indicator:**
When manual override is active, displays an alert banner:

```
ℹ️ Manual Override Active

Predictions Manually [Opened/Closed] by administrator on [timestamp].
Automatic scheduling is disabled for this match.
[Reason if provided]
```

**Button Visibility Rules:**

| Button | When Shown | When Hidden |
|--------|------------|-------------|
| Open Predictions | Status is PUBLISHED or PREDICTION_LOCKED | Already manually opened, or status is PREDICTION_OPEN |
| Close Predictions | Status is PREDICTION_OPEN | Any other status |
| Reopen Predictions | Status is PREDICTION_LOCKED AND not manually closed | Manually closed |

### Status Badge

The match status badge displays the current effective status, whether set manually or automatically.

## Business Rules

### BR-OVERRIDE-001: Manual Takes Precedence
Manual overrides always take precedence over automatic scheduling.

### BR-OVERRIDE-002: Override Persistence
Manual override state must persist in the database and survive application restarts.

### BR-OVERRIDE-003: Scheduler Respect
Automatic scheduler must never overwrite manual overrides.

### BR-OVERRIDE-004: No Automatic Reopening
Once predictions are manually closed, they must never reopen automatically, even if the configured lock time hasn't been reached.

### BR-OVERRIDE-005: Valid Transitions Only
Manual open/close actions must respect the match lifecycle state machine.

### BR-OVERRIDE-006: Audit Trail
All manual override actions must be logged for audit purposes.

## Implementation Details

### Modified Files

1. **`public/js/domain/match.domain.js`**
   - Updated `resolveEffectiveStatus()` to check for manual overrides first

2. **`public/js/match/match.service.js`**
   - Added `PredictionOverride` typedef
   - Updated `normalizeMatchDocument()` to include `predictionOverride`
   - Added `normalizePredictionOverride()` helper function

3. **`public/js/match/match-status.service.js`**
   - Updated `applyLifecycleAction()` to create override records
   - Modified `getMatchWithEffectiveStatus()` to skip automatic transitions when override exists
   - Added local `normalizePredictionOverride()` function

4. **`public/js/match/match.validator.js`**
   - Enhanced `validateLifecycleAction()` with override-specific validation rules

5. **`public/js/match/renderers/detail.renderer.js`**
   - Added `renderOverrideIndicator()` to display override status
   - Updated `renderLifecycleButtons()` to respect override state
   - Added `formatTimestamp()` helper for consistent date formatting

### Key Functions

#### `MatchDomain.resolveEffectiveStatus(status, kickoffUtc, openHours, lockMinutes, now, match)`

Priority logic:
```javascript
1. Check match.predictionOverride.isActive
   → If true and status is valid, return override status
2. Otherwise, apply automatic scheduling logic
```

#### `applyLifecycleAction(match, action)`

For `OPEN_PREDICTIONS` and `CLOSE_PREDICTIONS`:
```javascript
1. Validate action is allowed
2. Set target status
3. Create predictionOverride object with:
   - isActive: true
   - status: target status
   - timestamp: now
   - performedBy: current user
   - reason: standard message
4. Update database
5. Log to audit trail
```

## Security Considerations

### Authorization
- Only users with `CREATE_MATCH` permission can use manual override actions
- Permission checks enforced in both UI and backend

### Firestore Security Rules
Security rules should validate:
```javascript
// Only administrators can write predictionOverride
allow update: if request.auth.uid != null 
  && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
  && request.resource.data.predictionOverride is map;
```

### Audit Logging
All manual override actions are logged with:
- Action type (`match_prediction_opened`, `match_prediction_closed`)
- Entity type and ID
- User who performed action
- Timestamp
- Manual flag in details

## Testing Scenarios

### Test Case 1: Manual Open from Published
1. Create match in PUBLISHED status
2. Click "Open Predictions"
3. Verify status changes to PREDICTION_OPEN
4. Verify override indicator appears
5. Verify "Open Predictions" button is hidden
6. Verify automatic scheduler doesn't change status

### Test Case 2: Manual Close
1. Have match in PREDICTION_OPEN status
2. Click "Close Predictions"
3. Verify status changes to PREDICTION_LOCKED
4. Verify override indicator appears
5. Verify "Reopen Predictions" button is hidden
6. Verify match stays closed even after automatic lock time

### Test Case 3: Scheduler Respect
1. Manually open predictions
2. Wait past automatic lock time
3. Verify match remains PREDICTION_OPEN
4. Verify scheduler doesn't change status

### Test Case 4: Button Visibility
1. Test each match status
2. Verify correct buttons are shown/hidden
3. Test with and without override active

### Test Case 5: Backward Compatibility
1. Access existing match without predictionOverride field
2. Verify automatic scheduling still works
3. Verify no errors occur

## Future Enhancements

### Clear Override Action
Add ability to clear manual override and restore automatic scheduling:
```javascript
MATCH_LIFECYCLE_ACTIONS.CLEAR_OVERRIDE = 'clear_override'
```

### Override Expiration
Consider adding expiration timestamp:
```javascript
predictionOverride: {
  expiresAt: Timestamp,  // When override expires
  autoRestore: boolean   // Restore automatic scheduling after expiry
}
```

### Bulk Override Management
Admin interface to manage overrides across multiple matches.

### Override History
Track all override changes over time:
```javascript
predictionOverrideHistory: [
  { timestamp, action, performedBy, reason }
]
```

## Related Documents

- [03_BUSINESS_RULES_AND_DOMAIN_MODEL.md](product/03_BUSINESS_RULES_AND_DOMAIN_MODEL.md)
- [05_DATABASE_SCHEMA.md](05_DATABASE_SCHEMA.md)
- [MATCH_MODULE_ARCHITECTURE.md](architecture/MATCH_MODULE_ARCHITECTURE.md)

## Changelog

### Version 1.0 - July 2, 2026
- Initial implementation
- Manual open/close prediction actions
- Override persistence and display
- Scheduler integration
- UI enhancements
- Validation rules
- Documentation

