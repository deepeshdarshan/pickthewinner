# Coding Standards

| Property | Value |
|----------|--------|
| Version | 1.1 |
| Status | Active |
| Last Updated | July 2026 |

## Principles

- **SRP** — one responsibility per module
- **DRY** — shared renderers, actions, event bus, UI components
- **Bootstrap First** — use Bootstrap utilities before custom CSS
- **ES Modules** — no global variables, no `var`

## Layer Rules

| Layer | May Do | Must Not Do |
|-------|--------|-------------|
| Pages | Init, bind events, call services | Firestore directly |
| Renderers | HTML templates | Firestore, business logic |
| Domain | Business rules, validation | Firestore, DOM |
| Services | Firestore CRUD, caching | DOM manipulation |
| Components | Reusable UI | Business logic |

## Logging

Use `Logger` from `utils/logger.util.js` exclusively. No `console.*` in application code.

## HTML Safety

```javascript
import { escapeHtml } from '../utils/html.util.js';
// Always escape user-controlled values in templates
`<p>${escapeHtml(displayName)}</p>`
```

## Event Bus

Use `createEventBus(namespace)` from `shared/events/event-bus.js`. Do not duplicate pub/sub implementations.

## User Renderer Structure

```
users/renderers/
  profile.renderer.js
  complete-profile.renderer.js
  preferences.renderer.js
  shared-form.renderer.js
users/user.renderer.js  ← backwards-compatible barrel
```

## Logout

Always use `performLogout()` from `auth/actions/logout.action.js`.

## Route Metadata

Define routes in `config/routes.js` with full metadata. Filter navigation only through `AuthorizationService`.

## JSDoc

All exported functions require `@param`, `@returns`, and `@fileoverview` on modules.

## New Module Template

Follow the `users/` module structure:
- `*.constants.js`, `*.events.js`, `*.service.js`, `*.domain.js`
- `renderers/*.renderer.js`, `*.guard.js`, `*.bootstrap.js`

Services extending Firestore should use `BaseFirestoreService`.
