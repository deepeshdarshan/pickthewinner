# Predictions Requirements

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |

## Purpose

Define contestant-facing prediction submission, management, and history requirements.

## Modules

| Module | Route | Responsibility |
|--------|-------|----------------|
| Prediction Engine | `/predictions` | Submit and edit predictions while window is open |
| Upcoming Matches | `/matches` | Browse upcoming matches |
| Prediction History | `/predictions/history` | Read-only cross-tournament prediction archive |
| My Score | `/score` | Active tournament quick score summary |

## Prediction History

### Scope

Contestants can view their own predictions across all tournaments. The module is read-only. Editing is handled exclusively by the Prediction Engine.

### Data Sources

Reads from:

- `predictions` (including `calculatedPoints` and `scoringBreakdown`)
- `matches` (official results)
- `tournaments` (metadata)
- `leaderboard_cache` (rank when leaderboard enabled)

The module never calculates scores.

### Features

- Summary statistics (total predictions, correct winners, exact scores, bonus points, total points, accuracy)
- View modes: timeline, card, table
- Filters: tournament, stage, match status, result type, date range
- Search: tournament name, team names, match number (case-insensitive)
- Sorting: match date, points, tournament, accuracy
- Pagination: 10, 25, 50, 100 per page
- Detail view with scoring breakdown and prediction lifecycle timeline
- Tournament and stage statistics

### Security

- Contestants read only `predictions` where `userId == auth.uid`
- Firestore security rules enforce ownership
- Service layer validates authenticated user before queries

### Services

- `PredictionHistoryService`
- `PredictionHistoryRepository`
- `PredictionHistoryDomain`
- `prediction-history.validator.js`

## Prediction Submission

See `prompts/05_PREDICTION_ENGINE.md` for submission and edit rules while the prediction window is open.

## Related Documents

- [Scoring Requirements](scoring.md)
- [Database Schema](../../architecture/03_DATABASE_SCHEMA.md)
- [Contestant Dashboard Implementation](../../CONTESTANT_DASHBOARD_IMPLEMENTATION.md)
