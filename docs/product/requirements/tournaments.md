# Tournament Requirements

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |

## Purpose

Define functional requirements for tournament management, including scoring configuration.

## Actors

- **Administrator** — creates, configures, and publishes tournaments
- **Contestant** — browses published tournaments

## Scoring Configuration

Administrators configure how many points contestants receive for correct predictions in the **Scoring Configuration** section of tournament settings.

### Fields

#### Correct Match Score Points

- **Field:** `configuration.scoringConfiguration.correctMatchScorePoints`
- **Label:** Points for Correct Match Score (Normal Time + Extra Time)
- **Description:** Award when the contestant correctly predicts the final match score after normal time and extra time. Penalty shootout goals are not included.
- **Validation:** Required integer, minimum 0, maximum 100

#### Correct Penalty Winner Points

- **Field:** `configuration.scoringConfiguration.correctPenaltyWinnerPoints`
- **Label:** Points for Correct Penalty Shootout Winner
- **Description:** Award when the contestant correctly predicts the penalty shootout winner. Applies only to knockout matches that proceed to penalties.
- **Validation:** Required integer, minimum 0, maximum 100

### Business Rules

- Different tournaments may use different scoring systems.
- Point values must not be hardcoded in application code.
- A tournament cannot be saved unless both scoring fields are configured with valid integers.
- The `scoringConfiguration` object supports future scoring rules without schema migration.

### User Flow

1. Administrator opens Create or Edit Tournament.
2. Administrator completes the Scoring Configuration card.
3. On save, validation runs; invalid or missing values block submission with field-level errors.
4. Valid values persist to Firestore under `configuration.scoringConfiguration`.

### Permissions

Only administrators with tournament management permissions may configure scoring.

### Dependencies

- `TournamentConfigurationService` — single source of truth for scoring reads
- `tournament.validator.js` — scoring validation on create/update
- Future Scoring Engine — reads point values from `TournamentConfigurationService`

## Visibility Settings

Administrators control whether contestants can view the tournament leaderboard in the **Visibility Settings** section of tournament settings.

### Fields

#### Leaderboard Visible to Contestants

- **Field:** `configuration.leaderboardVisible`
- **Label:** Make Leaderboard Visible to Contestants
- **Description:** When enabled, contestants can view the tournament leaderboard. When disabled, only administrators can access the leaderboard.
- **Default:** `false` (unchecked)
- **Validation:** No additional validation required on create or update

### Business Rules

- **BR-061:** Leaderboard visibility is controlled independently for each tournament.
- **BR-062:** The default value is `false`.
- **BR-063:** Administrators always retain leaderboard access.
- **BR-064:** Contestants may only access the leaderboard when `leaderboardVisible == true`.
- **BR-065:** Hidden leaderboards must not appear in navigation menus or dashboard widgets.

### User Flow

1. Administrator opens Create or Edit Tournament.
2. Administrator toggles **Make Leaderboard Visible to Contestants** in the Visibility Settings card.
3. On save, the value persists to Firestore under `configuration.leaderboardVisible`.
4. Contestant navigation, route guards, and dashboard widgets respect the setting immediately after configuration reload.

### Contestant Experience

When `leaderboardVisible == false`:

- Leaderboard navigation items and dashboard widgets are hidden.
- Direct URL access to `/leaderboard` redirects to an informational page (not a 403 error).
- Message displayed: *"The tournament organizer has not yet made the leaderboard available."*

When `leaderboardVisible == true`:

- Contestants may access the Leaderboard page, view rankings, and view tournament statistics.

### Dependencies

- `TournamentConfigurationService` — single source of truth for `isLeaderboardVisible()` reads
- `leaderboard.guard.js` — route protection for contestant leaderboard access
- Leaderboard module — must read visibility through `TournamentConfigurationService`, not Firestore directly
