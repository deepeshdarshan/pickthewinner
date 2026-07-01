# Security Model

| Property | Value |
|----------|--------|
| Version | 1.1 |
| Status | Active |
| Last Updated | July 2026 |

## Authentication

- Firebase Authentication handles identity
- Session restored via `onAuthStateChanged` in `auth.service.js`
- Single logout path: `performLogout()` in `auth/actions/logout.action.js`

## Authorization

- RBAC via `permission.service.js` role-to-permission map
- Route guards: auth → user profile → role (sequential pipeline)
- UI filtering via `AuthorizationService.getAuthorizedNavRoutes()`

## Fail-Closed Guards

The user guard (`user.guard.js`) redirects to `/error` when profile loading fails on protected routes. It no longer fails open.

## HTML Safety

All user-controlled values interpolated into templates must pass through `escapeHtml()` from `utils/html.util.js`.

URL attributes use `escapeUrl()` to restrict to safe schemes.

## Client Trust Boundaries

| Data | Client May Set | Server Must Enforce |
|------|----------------|---------------------|
| User role | Suggested via `UserDomain` | Firestore rules / custom claims |
| User statistics | Never | Firestore rules |
| Tournament status | Never (future) | Firestore rules |
| Prediction scores | Never (future) | Firestore rules |

## Protected Fields

`UserDomain.isProtectedField()` defines fields blocked from client updates. Firestore rules must mirror this list.

## Session Cleanup

On logout, `performLogout()` clears:
- Firebase auth session
- Profile cache
- Authorization cache
- Tournament configuration cache
- ApplicationContext

## Required Next Steps

1. Deploy `firestore.rules` before business modules
2. Implement admin custom claims
3. Add ownership validation rules per collection
