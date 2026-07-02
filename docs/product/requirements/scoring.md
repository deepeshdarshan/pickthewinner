# Scoring Requirements

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Last Updated | July 2026 |

## Purpose

Define how prediction scoring works and how point values are sourced from tournament configuration.

## Scope

- Tournament-specific scoring configuration
- Point award rules for match score and penalty winner predictions
- Integration contract with `TournamentConfigurationService`

The Scoring Engine module is not yet implemented. This document defines the configuration and evaluation contract.

## Business Rules

### No Hardcoded Point Values

The Scoring Engine and all dependent modules must read point values from `TournamentConfigurationService`. Hardcoded defaults are prohibited.

### Tournament-Specific Configuration

Each tournament stores its scoring rules at `configuration.scoringConfiguration`:

```json
{
  "correctMatchScorePoints": 10,
  "correctPenaltyWinnerPoints": 5
}
```

### Match Score Points

Award `correctMatchScorePoints` when the predicted home score and away score both match the actual result after normal time and extra time.

Penalty shootout goals are not included in this comparison.

### Penalty Winner Points

Award `correctPenaltyWinnerPoints` when the contestant correctly predicts the penalty shootout winner. This applies only to knockout matches resolved by penalties.

### Future Rules (not yet implemented)

- Correct Winner Points
- Goal Difference Points
- Bonus Round Points
- Perfect Round Bonus
- Streak Bonus

## Scoring Engine Integration

Before evaluating predictions for a match:

```javascript
await TournamentConfigurationService.load(tournamentId);
const scorePoints = TournamentConfigurationService.getCorrectMatchScorePoints();
const penaltyPoints = TournamentConfigurationService.getCorrectPenaltyWinnerPoints();
```

If scoring configuration is incomplete, getters throw an error. The Scoring Engine must not proceed with partial or default values.

## Validation

| Field | Type | Required | Range |
|-------|------|----------|-------|
| `correctMatchScorePoints` | Integer | Yes | 0–100 |
| `correctPenaltyWinnerPoints` | Integer | Yes | 0–100 |

## Dependencies

- Tournament Module — scoring configuration UI and persistence
- `TournamentConfigurationService` — configuration access
- Prediction Engine — prediction data for evaluation
- Match Module — published match results
