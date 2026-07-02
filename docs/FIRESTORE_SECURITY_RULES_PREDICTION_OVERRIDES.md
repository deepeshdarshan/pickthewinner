# Firestore Security Rules Update: Prediction Overrides

**Version:** 1.0  
**Date:** July 2, 2026  
**Related Feature:** Manual Prediction Window Overrides

## Overview

This document specifies the Firestore security rule updates required to properly secure the `predictionOverride` field in the matches collection.

## Security Requirements

### 1. Write Access Control
- Only authenticated administrators can write `predictionOverride` field
- Contestants must not be able to create or modify overrides
- Unauthenticated users cannot write any match data

### 2. Data Validation
- `predictionOverride` structure must be validated
- `performedBy` must match authenticated user
- `status` must be valid match status
- `timestamp` must be server-generated

### 3. Read Access
- All authenticated users can read match data including overrides
- Read access follows existing match visibility rules

## Recommended Security Rules

### Helper Functions

Add these helper functions to your `firestore.rules` file:

```javascript
function isAdmin() {
  return request.auth != null && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

function isValidPredictionOverride(override) {
  // Override can be null (no override) or must have valid structure
  return override == null || (
    // Must have required fields when active
    (!override.isActive || (
      override.keys().hasAll(['isActive', 'status', 'timestamp', 'performedBy']) &&
      override.isActive is bool &&
      override.status is string &&
      override.timestamp is timestamp &&
      override.performedBy is string &&
      // Optional reason field
      (!('reason' in override) || override.reason is string)
    ))
  );
}

function isValidOverrideStatus(status) {
  // Override status must be a valid prediction-related status
  return status in ['prediction_open', 'prediction_locked'];
}

function overridePerformedByCurrentUser(override) {
  // When override is active, performedBy must match current user
  return !override.isActive || override.performedBy == request.auth.uid;
}
```

### Match Collection Rules

Update the matches collection rules:

```javascript
match /matches/{matchId} {
  // Allow read for authenticated users (existing rule)
  allow read: if request.auth != null;
  
  // Allow create for admins (existing rule + override validation)
  allow create: if request.auth != null && 
                   isAdmin() &&
                   isValidPredictionOverride(request.resource.data.predictionOverride);
  
  // Allow update for admins with override validation
  allow update: if request.auth != null && 
                   isAdmin() &&
                   isValidPredictionOverride(request.resource.data.predictionOverride) &&
                   // If override is being written, validate it
                   (!('predictionOverride' in request.resource.data) ||
                    request.resource.data.predictionOverride == null ||
                    (
                      // Validate override status is valid
                      isValidOverrideStatus(request.resource.data.predictionOverride.status) &&
                      // Validate performedBy matches current user
                      overridePerformedByCurrentUser(request.resource.data.predictionOverride) &&
                      // Validate timestamp is server-generated (must change from previous)
                      request.resource.data.predictionOverride.timestamp != resource.data.get('predictionOverride', {}).get('timestamp', null)
                    ));
  
  // Allow delete for admins (existing rule)
  allow delete: if request.auth != null && isAdmin();
}
```

## Complete Example

Here's a complete example section for the matches collection:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper Functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    function isValidPredictionOverride(override) {
      return override == null || (
        (!override.isActive || (
          override.keys().hasAll(['isActive', 'status', 'timestamp', 'performedBy']) &&
          override.isActive is bool &&
          override.status is string &&
          override.timestamp is timestamp &&
          override.performedBy is string &&
          (!('reason' in override) || override.reason is string) &&
          override.status in ['prediction_open', 'prediction_locked'] &&
          override.performedBy == request.auth.uid
        ))
      );
    }
    
    // Matches Collection
    match /matches/{matchId} {
      allow read: if isAuthenticated();
      
      allow create: if isAdmin() && 
                       isValidPredictionOverride(request.resource.data.get('predictionOverride', null));
      
      allow update: if isAdmin() && 
                       isValidPredictionOverride(request.resource.data.get('predictionOverride', null));
      
      allow delete: if isAdmin();
    }
  }
}
```

## Validation Rules Explained

### 1. Structure Validation

```javascript
isValidPredictionOverride(override)
```

Ensures:
- Field can be null (no override)
- When present and active, must have all required fields
- All fields have correct types
- Optional `reason` field validated if present

### 2. Status Validation

```javascript
override.status in ['prediction_open', 'prediction_locked']
```

Ensures:
- Only valid prediction statuses allowed
- Prevents invalid status values
- Maintains data integrity

### 3. User Validation

```javascript
override.performedBy == request.auth.uid
```

Ensures:
- User cannot impersonate another administrator
- Audit trail is accurate
- Accountability is maintained

### 4. Timestamp Validation

```javascript
request.resource.data.predictionOverride.timestamp != 
  resource.data.get('predictionOverride', {}).get('timestamp', null)
```

Ensures:
- Timestamp must be newly generated
- Prevents timestamp tampering
- Forces use of `serverTimestamp()`

## Testing Security Rules

### Test Case 1: Admin Creates Override

```javascript
// SHOULD SUCCEED
await setDoc(doc(db, 'matches', 'match_123'), {
  ...matchData,
  predictionOverride: {
    isActive: true,
    status: 'prediction_open',
    timestamp: serverTimestamp(),
    performedBy: currentAdminUid,
    reason: 'Manual override'
  }
});
```

### Test Case 2: Non-Admin Attempts Override

```javascript
// SHOULD FAIL
await setDoc(doc(db, 'matches', 'match_123'), {
  ...matchData,
  predictionOverride: {
    isActive: true,
    status: 'prediction_open',
    timestamp: serverTimestamp(),
    performedBy: contestantUid,
    reason: 'Attempting override'
  }
});
// Expected: Permission denied
```

### Test Case 3: Invalid Status

```javascript
// SHOULD FAIL
await updateDoc(doc(db, 'matches', 'match_123'), {
  predictionOverride: {
    isActive: true,
    status: 'invalid_status',  // Invalid!
    timestamp: serverTimestamp(),
    performedBy: currentAdminUid
  }
});
// Expected: Permission denied
```

### Test Case 4: Impersonation Attempt

```javascript
// SHOULD FAIL
await updateDoc(doc(db, 'matches', 'match_123'), {
  predictionOverride: {
    isActive: true,
    status: 'prediction_open',
    timestamp: serverTimestamp(),
    performedBy: otherAdminUid  // Different user!
  }
});
// Expected: Permission denied
```

### Test Case 5: Clear Override (Null)

```javascript
// SHOULD SUCCEED
await updateDoc(doc(db, 'matches', 'match_123'), {
  predictionOverride: null
});
```

### Test Case 6: Inactive Override

```javascript
// SHOULD SUCCEED
await updateDoc(doc(db, 'matches', 'match_123'), {
  predictionOverride: {
    isActive: false
  }
});
```

## Deployment Instructions

### Step 1: Update Rules File

Edit `firestore.rules` in your project root:

```bash
# Open rules file
nano firestore.rules

# Add helper functions and update match rules
# Save and exit
```

### Step 2: Test Rules Locally

```bash
# Start Firebase emulator with rules
firebase emulators:start --only firestore

# Run security rules tests
npm test -- security-rules.test.js
```

### Step 3: Deploy Rules

```bash
# Deploy to Firebase
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules get
```

### Step 4: Verify in Console

1. Open Firebase Console
2. Navigate to Firestore → Rules
3. Verify rules are updated
4. Check for any syntax errors

## Error Messages

Users will see appropriate error messages when rules are violated:

### Permission Denied (Non-Admin)
```
FirebaseError: Missing or insufficient permissions.
Code: permission-denied
```

### Invalid Data (Wrong Structure)
```
FirebaseError: Invalid data. 
Document does not match the required schema.
Code: invalid-argument
```

## Monitoring and Auditing

### CloudWatch Logs (if using Firebase Analytics)

Monitor for:
- Failed write attempts to `predictionOverride`
- Permission denied errors on matches collection
- Unusual patterns of override creation

### Application Logs

Log all override operations:
```javascript
Logger.info('[PredictionOverride] Created', {
  matchId,
  status: override.status,
  performedBy: override.performedBy,
  timestamp: override.timestamp
});
```

### Audit Trail

All overrides are logged to `audit_logs` collection:
```javascript
await writeAuditLog({
  action: 'match_prediction_opened',
  entityType: 'match',
  entityId: matchId,
  details: { 
    manual: true,
    previousStatus: match.status,
    newStatus: override.status
  }
});
```

## Rollback Plan

If security rules cause issues:

### Immediate Rollback

```bash
# Get previous rules version
firebase firestore:rules get --version-id=PREVIOUS_VERSION_ID > firestore.rules.backup

# Deploy backup
firebase deploy --only firestore:rules
```

### Alternative: Relax Rules Temporarily

```javascript
// Temporary permissive rules (ONLY FOR EMERGENCY)
match /matches/{matchId} {
  allow read, write: if isAdmin();
}
```

## Related Documents

- [MANUAL_PREDICTION_OVERRIDES.md](MANUAL_PREDICTION_OVERRIDES.md) - Feature documentation
- [DATABASE_SCHEMA_UPDATE_PREDICTION_OVERRIDES.md](DATABASE_SCHEMA_UPDATE_PREDICTION_OVERRIDES.md) - Schema changes
- [06_SECURITY_RULES.md](06_SECURITY_RULES.md) - Main security rules documentation

## Changelog

### Version 1.0 - July 2, 2026
- Initial security rules for `predictionOverride` field
- Defined validation functions
- Provided testing scenarios
- Documented deployment process

