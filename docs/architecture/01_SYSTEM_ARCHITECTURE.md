# System Architecture

| Property | Value |
|----------|--------|
| Version | 1.1 |
| Status | Active |
| Last Updated | July 2026 |

## Layered Architecture

```
Pages / Components (Renderers)
        ↓
Dashboard Aggregation Services
        ↓
Domain Services (business rules)
        ↓
Application Services (Firestore CRUD)
        ↓
BaseFirestoreService
        ↓
Firebase SDK
```

## Core Modules

### Application Layer
- `app/application-context.js` — global session state (user, profile, tournament, permissions)
- `app/app.context.js` — read facade over ApplicationContext for UI modules
- `app/app.startup.js` — deterministic bootstrap sequence

### Domain Layer (`public/js/domain/`)
Pure business logic with no Firestore or DOM access:
- `UserDomain` — profile completeness, role suggestions, protected fields
- `TournamentDomain` — lifecycle transitions
- `MatchDomain` — prediction windows, lock calculation
- `PredictionDomain` — prediction workflow rules
- `LeaderboardDomain` — ranking logic

### Shared Infrastructure
- `shared/events/event-bus.js` — `createEventBus(namespace)` factory
- `shared/avatar/` — reusable avatar component
- `utils/html.util.js` — `escapeHtml()` for all template interpolation
- `auth/actions/logout.action.js` — single `performLogout()` workflow

### Configuration
- `tournament/configuration/TournamentConfigurationService.js` — centralized tournament settings

### Data Access
- `services/BaseFirestoreService.js` — CRUD, caching, batch, transaction helpers

## Event Architecture

All module event buses use `createEventBus()`:
- `app.events.js`
- `authentication.events.js`
- `user.events.js`
- `authorization.events.js`

## Routing

Route metadata standardized in `config/routes.js`:
- `requiresAuth`, `requiresProfile`, `requiredRole`, `guestOnly`
- `showInNavbar`, `showInMobileNav`, `icon`, `title`

`AuthorizationService` is the single source of truth for nav filtering.

## Sprint 1 Improvements (Architecture Remediation)

1. HTML escaping utility applied across renderers
2. Centralized logging via `Logger` only
3. User renderer split into focused modules under `users/renderers/`
4. Shared logout action
5. Generic event bus factory
6. Domain layer introduced
7. Tournament configuration service
8. Global ApplicationContext
9. Dashboard aggregation services
10. Shared UI library (`shared/index.js`)
11. BaseFirestoreService
12. Route metadata cleanup
13. Fail-closed user guard

## Related Documents

- `02_FIREBASE_ARCHITECTURE.md`
- `04_SECURITY_MODEL.md`
- `../engineering/01_CODING_STANDARDS.md`
- `ADR-001-domain-layer.md`
