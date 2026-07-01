# ADR-001: Domain Layer

| Status | Accepted |
| Date | July 2026 |

## Context

Business rules were embedded in services and pages, making future modules harder to test and extend.

## Decision

Introduce a `domain/` layer with pure JavaScript modules containing validation, workflow, and status transition logic.

## Consequences

- Services delegate business decisions to domain modules
- Domain modules have no Firestore or DOM dependencies
- Tournament, Match, and Prediction modules will add domain rules before services

---

# ADR-002: Generic Event Bus

| Status | Accepted |
| Date | July 2026 |

## Context

Four identical pub/sub implementations existed across app, auth, user, and authorization modules.

## Decision

Extract `createEventBus(namespace)` in `shared/events/event-bus.js`.

## Consequences

- Consistent error handling and logging in event handlers
- Reduced duplication (~150 lines)
- Event semantics unchanged for backwards compatibility

---

# ADR-003: ApplicationContext

| Status | Accepted |
| Date | July 2026 |

## Context

Session state was scattered across auth service, user service cache, and authorization service.

## Decision

Add `ApplicationContext` as the canonical mutable session store. `AppContext` remains the read facade for UI.

## Consequences

- Reduced duplicate Firestore reads
- Tournament context can be added without new globals
- Logout clears all state in one place

---

# ADR-004: HTML Escaping

| Status | Accepted |
| Date | July 2026 |

## Context

Template strings interpolated user data without escaping, creating XSS risk as tournament/user content grows.

## Decision

Mandatory `escapeHtml()` for all user-controlled template values.

## Consequences

- Slightly more verbose templates
- Safe rendering by default
- `escapeUrl()` restricts image/src attributes
