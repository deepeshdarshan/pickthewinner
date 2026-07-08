# Database Schema

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |
| Related Documents | [Firebase Architecture](02_FIREBASE_ARCHITECTURE.md), [Business Rules](../product/03_BUSINESS_RULES_AND_DOMAIN_MODEL.md) |

## Purpose

Authoritative Firestore schema specification for PickTheWinner. This document covers implemented collections and fields relevant to current development.

## Users Collection

**Collection:** `users`

### User Document Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uid` | String | Yes | Firebase Authentication UID (document ID) |
| `name` | String | Yes | User's display name |
| `email` | String | Yes | User's email address |
| `phone` | String | No | Phone number (required for contestants) |
| `photoURL` | String | No | Profile photo URL |
| `role` | String | Yes | User role: `ADMIN` or `CONTESTANT` |
| `provider` | String | Yes | Auth provider: `GOOGLE` or `EMAIL_PASSWORD` |
| `status` | String | Yes | Account status: `ACTIVE`, `LOCKED`, `INACTIVE`, `SUSPENDED` |
| `district` | String | No | District (required for contestants) |
| `pradeshikaSabha` | String | No | Pradeshika Sabha (required for contestants) |
| `timezone` | String | Yes | Fixed to `Asia/Kolkata` (IST) |
| `notificationPreferences` | Object | Yes | Email and browser notification settings |
| `statistics` | Object | Yes | User statistics (tournaments played, predictions, points, etc.) |
| `createdAt` | Timestamp | Yes | Account creation timestamp |
| `updatedAt` | Timestamp | Yes | Last update timestamp |
| `lastLogin` | Timestamp | No | Last login timestamp |
| `lockedBy` | String | No | UID of admin who locked the account |
| `lockedAt` | Timestamp | No | When the account was locked |
| `lockReason` | String | No | Reason for locking the account (max 500 chars) |

### User Status

- **ACTIVE**: User can access the application
- **LOCKED**: User cannot sign in; locked by an administrator
- **INACTIVE**: Soft-deleted user
- **SUSPENDED**: Temporarily suspended (future use)

### Lock Workflow

When an administrator locks a user:
1. `status` is set to `LOCKED`
2. `lockedBy` is set to the admin's UID
3. `lockedAt` is set to the current server timestamp
4. `lockReason` is optionally set (max 500 characters)

When unlocked:
1. `status` is restored to `ACTIVE`
2. `lockedBy`, `lockedAt`, and `lockReason` are cleared (set to `null`)

Locked users are blocked by:
- Client-side route guard (`user.guard.js`) — redirects to `/account-locked`
- Firestore Security Rules — denies prediction creation/updates

## Tournaments Collection

**Collection:** `tournaments`

### Configuration Object

Tournament settings are stored in a nested `configuration` object.

#### `configuration.scoringConfiguration`

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `correctMatchScorePoints` | Integer | Yes (on save) | None | 0–100 | Points for correct match score prediction (normal time + extra time) |
| `correctPenaltyWinnerPoints` | Integer | Yes (on save) | None | 0–100 | Points for correct penalty shootout winner prediction |

No hardcoded point defaults. Legacy tournaments without these fields must be updated by an administrator before scoring can run.

#### Other Configuration Fields

| Field | Type | Description |
|-------|------|-------------|
| `timezone` | String | Fixed to `Asia/Kolkata` (IST) |
| `canEndInDraw` | Boolean | Whether league matches may end in a draw |
| `requiresWinner` | Boolean | Whether knockout matches require a winner |
| `winnerResolution` | String | Winner resolution strategy (e.g. `regulation`) |
| `tieBreaker` | Object | Leaderboard tie-breaker strategy |
| `predictionLockMinutes` | Integer | Minutes before kickoff when predictions lock (1–60, default 10) |
| `predictionOpenHoursBeforeKickoff` | Integer | Hours before kickoff when predictions open (1–168, default 48) |

### Example Tournament Document (configuration excerpt)

```json
{
  "name": "FIFA World Cup 2026",
  "status": "draft",
  "configuration": {
    "timezone": "Asia/Kolkata",
    "canEndInDraw": false,
    "requiresWinner": true,
    "winnerResolution": "regulation",
    "tieBreaker": {
      "strategy": "totalPoints",
      "secondary": "correctWinnerPredictions"
    },
    "scoringConfiguration": {
      "correctMatchScorePoints": 10,
      "correctPenaltyWinnerPoints": 5
    }
  }
}
```

### Future Scoring Fields

The `scoringConfiguration` object may be extended with additional integer fields (e.g. `correctWinnerPoints`, `goalDifferencePoints`) without changing the parent schema structure.

## Access Pattern

`TournamentConfigurationService` is the only approved read path for `configuration.scoringConfiguration` values at runtime.

## Settings Collection

**Collection:** `settings`

**Document:** `general`

| Field | Type | Description |
|-------|------|-------------|
| `leaderboardVisible` | Boolean | Whether contestants may view the tournament leaderboard (default `false`) |
| `updatedAt` | Timestamp | Last update time |
| `updatedBy` | String | UID of the administrator who last updated settings |

`PlatformSettingsService` is the only approved read path for `leaderboardVisible` at runtime.

## Teams Collection

**Collection:** `teams`

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Team name |
| `shortName` | String | Optional short name |
| `country` | String | Country |
| `flagUrl` | String | Flag or logo URL |
| `sport` | String | Sport category |
| `active` | Boolean | Whether selectable in match forms |

## Venues Collection

**Collection:** `venues`

| Field | Type | Description |
|-------|------|-------------|
| `name` | String | Venue name |
| `city` | String | City |
| `country` | String | Country |
| `capacity` | Integer | Optional capacity |
| `active` | Boolean | Whether selectable in match forms |

## Matches Collection

**Collection:** `matches`

| Field | Type | Description |
|-------|------|-------------|
| `tournamentId` | String | Parent tournament reference |
| `matchNumber` | Integer | Unique within tournament |
| `round` | String | Tournament round |
| `homeTeamId` | String | Home team reference |
| `awayTeamId` | String | Away team reference |
| `venueId` | String | Venue reference |
| `kickoffUtc` | Timestamp | Kickoff stored in UTC |
| `status` | String | Lifecycle status |
| `visible` | Boolean | Contestant visibility flag |
| `result` | Object | Official result subdocument |
| `scoringStatus` | String | Scoring completion state |
| `customScoringConfig` | Object \| null | Optional match-level scoring override |

Tournament configuration is never duplicated on match documents. Runtime reads use `TournamentConfigurationService`.

### `customScoringConfig` subdocument

| Field | Type | Description |
|-------|------|-------------|
| `useCustomPoints` | Boolean | Enables match-level point override when `true` |
| `correctMatchScorePoints` | Integer | Points for exact match score (0-100) |
| `correctPenaltyWinnerPoints` | Integer | Points for correct penalty winner (0-100) |

Behavior:

- When `customScoringConfig` is `null` or `useCustomPoints` is `false`, scoring uses tournament-level configuration.
- When `useCustomPoints` is `true`, scoring engine uses match-level values and ignores tournament-level point fields for that match.
- Existing matches without this field remain valid and continue using tournament defaults.

### `result` subdocument

| Field | Type | Description |
|-------|------|-------------|
| `homeScore` | Integer | Score after normal + extra time |
| `awayScore` | Integer | Score after normal + extra time |
| `winnerResolution` | String | `normal_time_extra_time` or `penalties` |
| `winningTeamId` | String | Winning team reference |
| `notes` | String | Optional admin notes |
| `published` | Boolean | Whether result is official |
| `publishedAt` | Timestamp | Publication time |
| `publishedBy` | String | Admin user ID |

Penalty shootout goals are never stored.

## Predictions Collection

**Collection:** `predictions`

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Contestant owner (Firebase Auth UID) |
| `matchId` | String | Parent match reference |
| `tournamentId` | String | Parent tournament reference |
| `homeScore` | Integer | Predicted home score |
| `awayScore` | Integer | Predicted away score |
| `predictedWinner` | String \| null | `HOME` or `AWAY` when draw winner selection required |
| `locked` | Boolean | Whether prediction is locked |
| `status` | String | Lifecycle status (`saved`, `updated`, `locked`, `scored`) |
| `submittedAt` | Timestamp | Initial submission time |
| `updatedAt` | Timestamp | Last update time |
| `calculatedPoints` | Integer | Total points after scoring (read-only for contestants) |
| `scoringBreakdown` | Array | `{ label, points, correct }` line items from Scoring Engine |
| `scored` | Boolean | Whether scoring has been applied |
| `scoredAt` | Timestamp | When scoring was applied |

### Indexes

Contestant prediction history queries use:

```
Collection: predictions
Fields: userId ASC, submittedAt DESC
```

Defined in `firestore.indexes.json`. Contestants may read only documents where `userId == request.auth.uid` (see `firestore.rules`).

## Audit Logs Collection

**Collection:** `audit_logs`

Append-only administrative audit trail for result publication, scoring, and manual prediction window changes.

## Match Stages Collection

**Collection:** `match_stages`

| Field | Type | Description |
|-------|------|-------------|
| `label` | String | Display label used in admin and contestant UI (e.g. `Quarter Final`) |
| `value` | String | Stable stage key used in match documents (e.g. `quarter_final`) |
| `sortOrder` | Integer | Sort order for dropdown display |
| `active` | Boolean | Whether stage is selectable in match forms |
| `createdBy` | String | Admin UID who created the stage |
| `updatedBy` | String | Admin UID who last updated the stage |
| `createdAt` | Timestamp | Creation time |
| `updatedAt` | Timestamp | Last update time |

Runtime behavior:

- Match creation forms load active stages from `match_stages` sorted by `sortOrder`.
- If `match_stages` is empty, the application falls back to built-in default stages.
- Existing matches remain compatible because match documents still store the stage key under `round`.

---
