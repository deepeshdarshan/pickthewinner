# Database Schema

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |
| Related Documents | [Firebase Architecture](02_FIREBASE_ARCHITECTURE.md), [Business Rules](../product/03_BUSINESS_RULES_AND_DOMAIN_MODEL.md) |

## Purpose

Authoritative Firestore schema specification for PickTheWinner. This document covers implemented collections and fields relevant to current development.

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
| `leaderboardVisible` | Boolean | Whether contestants may view the tournament leaderboard (default `false`) |

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
    "leaderboardVisible": false,
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

`TournamentConfigurationService` is the only approved read path for `configuration.scoringConfiguration` and `configuration.leaderboardVisible` values at runtime.

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

Tournament configuration is never duplicated on match documents. Runtime reads use `TournamentConfigurationService`.

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

## Audit Logs Collection

**Collection:** `audit_logs`

Append-only administrative audit trail for result publication, scoring, and manual prediction window changes.
