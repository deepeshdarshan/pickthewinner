# Testing Guide: Manual Prediction Window Overrides

**Feature:** Manual Prediction Window Overrides  
**Version:** 1.0  
**Date:** July 2, 2026

---

## Quick Start Testing

### Prerequisites

✅ Administrator account with proper permissions  
✅ Access to Firebase Console  
✅ At least one tournament with matches  
✅ Development or staging environment for initial tests

---

## Test Suite

### Test Group 1: Manual Open Predictions

#### Test 1.1: Open from Published Status

**Setup:**
1. Create or select a match in PUBLISHED status
2. Ensure predictions would normally open in the future (automatic time not reached)

**Steps:**
1. Navigate to Match Management
2. Click on the match
3. Click "Open Predictions" button

**Expected Results:**
- ✅ Match status changes to PREDICTION_OPEN immediately
- ✅ Alert banner appears: "Manual Override Active"
- ✅ "Open Predictions" button disappears
- ✅ "Close Predictions" button appears
- ✅ Match remains open even after automatic open time passes

**Verification in Database:**
```javascript
// Check Firestore document
matches/{matchId}:
{
  status: "prediction_open",
  predictionOverride: {
    isActive: true,
    status: "prediction_open",
    timestamp: [current timestamp],
    performedBy: "[your uid]",
    reason: "Manual override by administrator"
  }
}
```

**Verification in Audit Log:**
```javascript
audit_logs/{logId}:
{
  action: "match_prediction_opened",
  entityType: "match",
  entityId: "[match id]",
  details: { manual: true }
}
```

---

#### Test 1.2: Open Button Hidden After Manual Open

**Setup:**
1. Use match from Test 1.1 (already manually opened)

**Steps:**
1. Refresh the page
2. Click on the same match

**Expected Results:**
- ✅ Match still shows PREDICTION_OPEN status
- ✅ Override indicator still visible
- ✅ "Open Predictions" button NOT shown
- ✅ "Close Predictions" button shown

**Why:** Once manually opened, "Open Predictions" should not be available again

---

#### Test 1.3: Open from Prediction Locked Status

**Setup:**
1. Create match in PREDICTION_LOCKED status

**Steps:**
1. Navigate to match detail
2. Click "Open Predictions" button

**Expected Results:**
- ✅ Match status changes to PREDICTION_OPEN
- ✅ Override indicator appears
- ✅ Button visibility updates correctly

---

### Test Group 2: Manual Close Predictions

#### Test 2.1: Close from Prediction Open Status

**Setup:**
1. Create or select match in PREDICTION_OPEN status
2. Ensure predictions would normally stay open (lock time not reached)

**Steps:**
1. Navigate to match detail
2. Click "Close Predictions" button

**Expected Results:**
- ✅ Match status changes to PREDICTION_LOCKED immediately
- ✅ Override indicator appears with "Manually Closed"
- ✅ "Close Predictions" button disappears
- ✅ "Reopen Predictions" button does NOT appear (manually closed)
- ✅ Match stays closed even past automatic open time

**Verification in Database:**
```javascript
matches/{matchId}:
{
  status: "prediction_locked",
  predictionOverride: {
    isActive: true,
    status: "prediction_locked",
    timestamp: [current timestamp],
    performedBy: "[your uid]",
    reason: "Manual override by administrator"
  }
}
```

---

#### Test 2.2: No Automatic Reopening

**Setup:**
1. Use match from Test 2.1 (manually closed)
2. Wait for automatic lock time to pass

**Steps:**
1. Wait until current time < kickoff time - openHours
2. Refresh match detail page
3. Check match status

**Expected Results:**
- ✅ Match remains PREDICTION_LOCKED
- ✅ No automatic status change
- ✅ Override indicator still shows "Manually Closed"
- ✅ "Reopen Predictions" button still hidden

**Why:** Manual close should prevent any automatic reopening

---

#### Test 2.3: Close Button Only Available When Open

**Setup:**
1. Check multiple matches in different statuses

**Steps:**
1. View match in PUBLISHED status
2. View match in PREDICTION_LOCKED status
3. View match in LIVE status
4. View match in PREDICTION_OPEN status

**Expected Results:**
- ✅ PUBLISHED: No "Close Predictions" button
- ✅ PREDICTION_LOCKED: No "Close Predictions" button
- ✅ LIVE: No "Close Predictions" button
- ✅ PREDICTION_OPEN: "Close Predictions" button shown

---

### Test Group 3: Scheduler Behavior

#### Test 3.1: Scheduler Respects Manual Open

**Setup:**
1. Manually open predictions (Test 1.1)
2. Configure match so automatic lock time has passed

**Steps:**
1. Wait for scheduler to run (or trigger manually)
2. Check match status

**Expected Results:**
- ✅ Match remains PREDICTION_OPEN
- ✅ Override indicator still shows
- ✅ No automatic transition to PREDICTION_LOCKED
- ✅ Logs show scheduler skipped automatic transition

**Console Logs:**
```
[MatchStatusService] Override detected, skipping automatic transition
```

---

#### Test 3.2: Scheduler Respects Manual Close

**Setup:**
1. Manually close predictions (Test 2.1)
2. Set kickoff time in future so predictions should be open

**Steps:**
1. Wait for scheduler to run
2. Check match status

**Expected Results:**
- ✅ Match remains PREDICTION_LOCKED
- ✅ No automatic transition to PREDICTION_OPEN
- ✅ Override persists
- ✅ Scheduler logs show override detected

---

#### Test 3.3: Automatic Scheduling Without Override

**Setup:**
1. Create match without any manual actions
2. Set prediction open time in past
3. Set prediction lock time in future

**Steps:**
1. Wait for scheduler to run
2. Check match status

**Expected Results:**
- ✅ Match automatically changes to PREDICTION_OPEN
- ✅ NO override indicator shown
- ✅ Automatic scheduling works normally
- ✅ Match will auto-lock at configured time

**Why:** Ensures backward compatibility and automatic scheduling still works

---

### Test Group 4: UI Display

#### Test 4.1: Override Indicator Display

**Setup:**
1. Create match with manual override

**Steps:**
1. View match detail page
2. Examine override indicator

**Expected Results:**
- ✅ Alert banner visible with info icon
- ✅ Correct status shown (Manually Opened/Closed)
- ✅ Timestamp formatted correctly (readable format)
- ✅ Reason displayed if provided
- ✅ Alert has appropriate styling (blue info alert)

**Example Display:**
```
ℹ️ Manual Override Active

Predictions Manually Opened by administrator on Jul 2, 2026, 2:30 PM.
Automatic scheduling is disabled for this match.
Manual override by administrator
```

---

#### Test 4.2: Button Visibility Matrix

**Create test matches in each status and verify button visibility:**

| Match Status | Open Predictions | Close Predictions | Reopen Predictions |
|--------------|------------------|-------------------|-------------------|
| DRAFT | ❌ | ❌ | ❌ |
| SCHEDULED | ❌ | ❌ | ❌ |
| PUBLISHED | ✅ | ❌ | ❌ |
| PREDICTION_OPEN | ❌ | ✅ | ❌ |
| PREDICTION_LOCKED | ✅ | ❌ | ✅* |
| LIVE | ❌ | ❌ | ❌ |
| COMPLETED | ❌ | ❌ | ❌ |
| ARCHIVED | ❌ | ❌ | ❌ |

\* Reopen hidden if manually closed

**Verification Steps:**
1. Create match in each status
2. Navigate to match detail
3. Check which buttons are visible
4. Compare against table above

---

#### Test 4.3: Override Indicator Clears Appropriately

**Test transitions that should/shouldn't clear override:**

**Scenario 1: GO_LIVE**
1. Manually open predictions
2. Click "Go Live"
3. Override indicator may persist (implementation dependent)

**Scenario 2: COMPLETE**
1. Match in LIVE status with override
2. Click "Mark Completed"
3. Override persists for audit trail

**Scenario 3: ARCHIVE**
1. Match with override active
2. Click "Archive"
3. Override persists in archived data

---

### Test Group 5: Validation

#### Test 5.1: Invalid State Transitions Prevented

**Test Case: Open when already open**

**Setup:**
1. Match already in PREDICTION_OPEN (via automatic)

**Steps:**
1. Try to click "Open Predictions" (should not be visible)

**Expected:**
- ✅ Button not shown
- ✅ UI prevents invalid action

---

**Test Case: Close when already closed**

**Setup:**
1. Match in PREDICTION_LOCKED

**Steps:**
1. Check for "Close Predictions" button

**Expected:**
- ✅ Button not shown
- ✅ Only PREDICTION_OPEN status shows close button

---

#### Test 5.2: Permission Enforcement

**Test as Non-Admin User:**

**Setup:**
1. Log in as contestant (non-admin)
2. Access match detail (should not be possible normally)

**Expected:**
- ✅ No lifecycle action buttons shown
- ✅ Cannot access admin match pages
- ✅ Permission denied if attempting direct API access

**Firestore Test:**
```javascript
// Attempt as non-admin (should fail)
await updateDoc(doc(db, 'matches', matchId), {
  predictionOverride: { ... }
});
// Expected: Permission denied error
```

---

### Test Group 6: Backward Compatibility

#### Test 6.1: Legacy Matches Work Normally

**Setup:**
1. Access existing match without predictionOverride field
2. Match created before feature deployment

**Steps:**
1. View match detail
2. Check automatic scheduling works
3. Verify no errors in console

**Expected Results:**
- ✅ No errors or warnings
- ✅ Automatic scheduling works
- ✅ No override indicator shown
- ✅ All functionality works as before

**Database Check:**
```javascript
matches/{oldMatchId}:
{
  // No predictionOverride field
  status: "published",
  // ... other fields
}
```

---

#### Test 6.2: Mixed Environment

**Setup:**
1. Have some matches with overrides
2. Have some matches without overrides
3. All in same tournament

**Steps:**
1. List all matches
2. Check each match individually
3. Verify scheduler handles both types

**Expected Results:**
- ✅ Matches with overrides: Manual control active
- ✅ Matches without overrides: Automatic scheduling active
- ✅ No conflicts or errors
- ✅ System handles hybrid state correctly

---

### Test Group 7: Edge Cases

#### Test 7.1: Rapid Status Changes

**Steps:**
1. Manually open predictions
2. Immediately close predictions
3. Check override state

**Expected:**
- ✅ Final override state is "closed"
- ✅ No race conditions
- ✅ Audit log has both entries

---

#### Test 7.2: Page Refresh During Override

**Steps:**
1. Create manual override
2. Immediately refresh page
3. Check persistence

**Expected:**
- ✅ Override persists
- ✅ Indicator still shows
- ✅ Correct status displayed

---

#### Test 7.3: Multiple Admins

**Steps:**
1. Admin A manually opens predictions
2. Admin B views match
3. Admin B manually closes predictions

**Expected:**
- ✅ Admin B sees Admin A's override
- ✅ Admin B can override Admin A's action
- ✅ Latest action takes precedence
- ✅ Audit log shows both actions

---

## Automated Testing Script

### Browser Console Test

```javascript
// Run in browser console on match detail page

async function testPredictionOverride() {
  console.log('Testing Manual Prediction Override...');
  
  // Test 1: Check current match has override support
  const match = window.__currentMatch; // Adjust based on your app context
  if (!match) {
    console.error('❌ No match loaded');
    return;
  }
  
  console.log('Match ID:', match.id);
  console.log('Current Status:', match.status);
  console.log('Has Override:', match.predictionOverride?.isActive ?? false);
  
  // Test 2: Check button visibility
  const openBtn = document.querySelector('[data-ptw-lifecycle="open_predictions"]');
  const closeBtn = document.querySelector('[data-ptw-lifecycle="close_predictions"]');
  
  console.log('Open Button Visible:', !!openBtn);
  console.log('Close Button Visible:', !!closeBtn);
  
  // Test 3: Check indicator
  const indicator = document.querySelector('.alert.alert-info');
  console.log('Override Indicator Visible:', !!indicator);
  
  // Test 4: Validate button state matches match state
  if (match.status === 'published' || match.status === 'prediction_locked') {
    console.log(openBtn ? '✅ Open button correctly shown' : '❌ Open button should be shown');
  }
  
  if (match.status === 'prediction_open') {
    console.log(closeBtn ? '✅ Close button correctly shown' : '❌ Close button should be shown');
  }
  
  console.log('✅ Test complete');
}

testPredictionOverride();
```

---

## Regression Testing Checklist

After deployment, verify these still work:

### Core Match Features
- [ ] Create new match
- [ ] Edit match details
- [ ] Publish match
- [ ] Match visibility toggle
- [ ] Go Live transition
- [ ] Mark Completed
- [ ] Archive match
- [ ] Delete match (if no predictions)

### Prediction Features
- [ ] Contestants can submit predictions
- [ ] Predictions locked at correct time (automatic)
- [ ] Prediction editing before lock
- [ ] Prediction display on match card

### Results Features
- [ ] Enter match results
- [ ] Publish results
- [ ] Score calculation
- [ ] Leaderboard updates

---

## Performance Testing

### Load Test

```javascript
// Test scheduler performance with mixed matches
// 100 matches: 50 with overrides, 50 without

async function loadTest() {
  const start = Date.now();
  
  // Process all matches
  const matches = await listMatchesForAdmin();
  
  for (const match of matches) {
    await getMatchWithEffectiveStatus(match.id);
  }
  
  const duration = Date.now() - start;
  const avg = duration / matches.length;
  
  console.log(`Processed ${matches.length} matches in ${duration}ms`);
  console.log(`Average: ${avg.toFixed(2)}ms per match`);
  
  // Expected: <50ms per match even with overrides
}
```

---

## Sign-Off Checklist

Before marking feature as complete:

### Functionality
- [ ] All Test Group 1 tests pass (Manual Open)
- [ ] All Test Group 2 tests pass (Manual Close)
- [ ] All Test Group 3 tests pass (Scheduler)
- [ ] All Test Group 4 tests pass (UI Display)
- [ ] All Test Group 5 tests pass (Validation)
- [ ] All Test Group 6 tests pass (Backward Compatibility)
- [ ] All Test Group 7 tests pass (Edge Cases)

### Documentation
- [ ] Feature documentation complete
- [ ] Database schema documented
- [ ] Security rules documented
- [ ] Implementation summary created
- [ ] Testing guide created (this document)

### Security
- [ ] Only admins can create overrides
- [ ] Firestore rules validated
- [ ] Audit logging verified
- [ ] No permission escalation possible

### Performance
- [ ] No degradation in match loading
- [ ] Scheduler runs efficiently
- [ ] UI renders quickly

### User Experience
- [ ] Override indicator clear and informative
- [ ] Buttons show/hide appropriately
- [ ] Error messages are helpful
- [ ] Workflow is intuitive

---

## Troubleshooting Test Failures

### If "Open Predictions" button doesn't appear:

1. Check match status (must be PUBLISHED or PREDICTION_LOCKED)
2. Verify no active override already exists
3. Check user permissions (must be admin)
4. Review console for JavaScript errors
5. Verify `renderLifecycleButtons()` logic

### If override doesn't persist:

1. Check Firestore write succeeded
2. Verify security rules allow write
3. Check network tab for 403 errors
4. Review `applyLifecycleAction()` code
5. Verify `predictionOverride` object structure

### If scheduler ignores override:

1. Check `predictionOverride.isActive` is `true`
2. Verify `getMatchWithEffectiveStatus()` checks override
3. Review scheduler logs
4. Check `resolveEffectiveStatus()` receives match object
5. Verify priority logic in domain layer

---

## Test Results Template

```markdown
## Test Results - [Date]

### Tester: [Name]
### Environment: [Dev/Staging/Prod]

### Test Group 1: Manual Open ✅
- Test 1.1: ✅ Pass
- Test 1.2: ✅ Pass
- Test 1.3: ✅ Pass

### Test Group 2: Manual Close ✅
- Test 2.1: ✅ Pass
- Test 2.2: ✅ Pass
- Test 2.3: ✅ Pass

[Continue for all groups...]

### Issues Found:
- [None / List issues]

### Overall Status: ✅ PASS / ❌ FAIL

### Notes:
[Any additional observations]

### Sign-off: ______________________
```

---

**Test Suite Version:** 1.0  
**Last Updated:** July 2, 2026  
**Status:** ✅ Complete

