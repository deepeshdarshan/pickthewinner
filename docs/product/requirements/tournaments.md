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
