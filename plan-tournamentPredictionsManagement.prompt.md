# Plan: Tournament Predictions Management Module

Create a read-only admin interface for viewing, searching, filtering, and analyzing contestant predictions across tournaments. This module enables administrators to monitor prediction submission progress, review contestant choices, and inspect detailed prediction data without modifying any submissions. Integrates seamlessly with the existing admin dashboard using the established layered architecture and design system.

## Steps

1. **Create prediction management domain and service layer** — Add [`prediction/admin/PredictionManagementService.js`](public/js/prediction/admin/PredictionManagementService.js) extending `BaseFirestoreService`, [`prediction/admin/PredictionManagementRepository.js`](public/js/prediction/admin/PredictionManagementRepository.js) with Firestore queries for listing predictions by tournament/match/contestant with pagination, [`prediction/admin/PredictionStatisticsService.js`](public/js/prediction/admin/PredictionStatisticsService.js) for aggregating completion rates and accuracy metrics, and [`domain/prediction-management.domain.js`](public/js/domain/prediction-management.domain.js) for business rules validation.

2. **Build renderer modules for three view modes** — Create [`prediction/admin/renderers/list.renderer.js`](public/js/prediction/admin/renderers/list.renderer.js) for main prediction table with tournament selector and overview statistics cards, [`prediction/admin/renderers/match-view.renderer.js`](public/js/prediction/admin/renderers/match-view.renderer.js) showing all contestant predictions for a single match, [`prediction/admin/renderers/contestant-view.renderer.js`](public/js/prediction/admin/renderers/contestant-view.renderer.js) displaying prediction history for one contestant, and [`prediction/admin/renderers/detail.renderer.js`](public/js/prediction/admin/renderers/detail.renderer.js) for the detailed prediction modal/panel.

3. **Implement main admin page with filters and search** — Add [`pages/admin-predictions.page.js`](public/js/pages/admin-predictions.page.js) following the pattern from [`match/match-admin.page.js`](public/js/match/match-admin.page.js) with tournament selection dropdown, view mode toggle (match-wise/contestant-wise), search box supporting contestant name/email/team search, filters for prediction status/stage/submission date, pagination using `PREDICTION_LIST_PAGE_SIZE = 20`, and responsive mobile card layout.

4. **Configure routing, navigation, and permissions** — Add route entry in [`config/routes.js`](public/js/config/routes.js) for `/admin/predictions` requiring `ADMIN` role and `VIEW_PREDICTIONS` permission (add to [`authorization/permission.constants.js`](public/js/authorization/permission.constants.js)), update [`components/sidebar-nav.config.js`](public/js/components/sidebar-nav.config.js) to add "Predictions" under Match Management section with `bi-bullseye` icon, and ensure Firestore rules already allow admins to read all predictions via existing `allow read: if isSignedIn() && isAdmin()` rule in [`firestore.rules`](firestore.rules).

5. **Add UI components for statistics and status badges** — Create [`prediction/admin/renderers/statistics-cards.renderer.js`](public/js/prediction/admin/renderers/statistics-cards.renderer.js) for overview dashboard cards (Total Predictions, Completion %, Pending, Locked, Completed Matches), [`prediction/admin/renderers/prediction-status-badge.renderer.js`](public/js/prediction/admin/renderers/prediction-status-badge.renderer.js) for color-coded status indicators, and responsive mobile card renderer in [`prediction/admin/renderers/prediction-card.renderer.js`](public/js/prediction/admin/renderers/prediction-card.renderer.js) following patterns from [`match/match-card.component.js`](public/js/match/match-card.component.js).

6. **Write unit tests and update documentation** — Create test files [`tests/prediction-management.service.test.js`](tests/prediction-management.service.test.js), [`tests/prediction-management.repository.test.js`](tests/prediction-management.repository.test.js), and [`tests/prediction-statistics.test.js`](tests/prediction-statistics.test.js) following existing test patterns, add comprehensive module documentation in [`docs/PREDICTION_MANAGEMENT_MODULE.md`](docs/PREDICTION_MANAGEMENT_MODULE.md), update [`docs/architecture/01_SYSTEM_ARCHITECTURE.md`](docs/architecture/01_SYSTEM_ARCHITECTURE.md) to reference the new admin module, and document administrator workflows in product documentation.

## Further Considerations

1. **Tournament selector behavior** — Should the page default to the active tournament (from `TournamentConfigurationService`) or show "Select a tournament" prompt? Recommend defaulting to active tournament for immediate data visibility with option to switch.

2. **Prediction detail view mode** — Should detailed prediction view open in a modal overlay (better for quick inspection) or navigate to a dedicated detail page (better for deep linking)? Recommend modal for consistency with existing admin patterns.

3. **Real-time updates vs manual refresh** — Should prediction statistics auto-refresh when new predictions arrive (adds Firestore listener complexity) or require manual page refresh? Recommend manual refresh initially with auto-refresh indicator showing "X new predictions" as future enhancement.

4. **Export functionality scope** — User mentions future export to Excel/PDF - should we design the data layer to support this now (e.g., dedicated export DTOs) or add later? Recommend adding export method stubs in service layer now to avoid breaking changes later.

5. **Composite index requirements** — Firestore queries combining `tournamentId + status + submittedAt` will require composite indexes. Should we auto-generate `firestore.indexes.json` or document manual index creation? Recommend adding index definitions to deployment checklist in documentation.

