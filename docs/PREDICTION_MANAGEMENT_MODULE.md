# Prediction Management Module

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Active |
| Route | `/admin/predictions` |
| Permission | `VIEW_ALL_PREDICTIONS` |

## Overview

The Tournament Predictions Management module provides administrators with a **read-only** interface to view, search, filter, and analyze contestant predictions across tournaments.

## Architecture

```
pages/admin-predictions.page.js
        ↓
prediction/admin/renderers/*
        ↓
prediction/admin/PredictionManagementService.js
prediction/admin/PredictionStatisticsService.js
        ↓
prediction/admin/PredictionManagementRepository.js
        ↓
domain/prediction-management.domain.js
        ↓
Firestore (predictions, matches, tournaments, users)
```

## Key Files

| File | Responsibility |
|------|----------------|
| `pages/admin-predictions.page.js` | Page controller, event binding, view orchestration |
| `prediction/admin/PredictionManagementService.js` | Data loading, caching, enrichment |
| `prediction/admin/PredictionManagementRepository.js` | Firestore queries |
| `prediction/admin/PredictionStatisticsService.js` | Tournament, match, and contestant statistics |
| `domain/prediction-management.domain.js` | Filter, search, sort, pagination rules |
| `prediction/admin/renderers/` | UI rendering (table, cards, detail modal, stats) |

## View Modes

1. **All Predictions** — Full paginated table of all submissions
2. **Match-wise** — Single match header with all contestant predictions
3. **Contestant-wise** — Contestant summary with prediction history

## Filters

- Tournament (defaults to active tournament)
- Match
- Stage
- Contestant
- Prediction status (Submitted, Updated, Locked, Scored)
- Search (contestant name, email, team, match)

## Pagination

Page sizes: 10, 25, 50, 100 (default 20).

## Security

- Route requires `ADMIN` role
- Permission: `VIEW_ALL_PREDICTIONS`
- Firestore rules: admins can read all predictions via existing `isAdmin()` rule
- Module is read-only — no create, update, or delete operations

## Firestore Indexes

Basic queries use single-field filters (`tournamentId`, `matchId`). Composite indexes may be required if future queries combine `tournamentId + status + submittedAt`.

## Export Stubs

`PredictionManagementService` includes stub methods for future Excel/PDF export:

- `exportPredictionsToExcel(tournamentId)`
- `exportPredictionsToPdf(tournamentId)`

## Testing

```bash
npm test -- tests/prediction-management*.test.js tests/prediction-statistics.test.js
```

## Future Enhancements

- Real-time Firestore listeners
- Export to Excel/PDF
- Prediction analytics and heatmaps
- Bulk correction mode
- Prediction audit history
