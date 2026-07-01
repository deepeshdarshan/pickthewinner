# PickTheWinner — Task Tracker

## Completed

### Module 01 — Application Foundation
- [x] Project folder structure (`public/css`, `public/js`, config, services, components, pages)
- [x] Design system CSS (variables, layout, components, utilities)
- [x] Firebase initialization (`firebase/firebase.js`)
- [x] SPA router with History API
- [x] Application shell (navbar, footer, loading overlay, toast, confirmation modal)
- [x] Placeholder pages for all routes

### Module 02 — Authentication
- [x] `authentication.constants.js` — providers, routes, messages, Firebase error codes
- [x] `authentication.events.js` — pub/sub for LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT, SESSION_RESTORED, SESSION_EXPIRED
- [x] `auth.service.js` — Google SSO, admin email/password, logout, auth state
- [x] `session.service.js` — session restore, monitoring, clear session
- [x] `auth.guard.js` — route protection (identity only, no role checks)
- [x] Login page — contestant Google sign-in and administrator email/password forms
- [x] Session restore on browser refresh
- [x] Router integration with auth guard and navbar sign-out
- [x] Loading states and user-friendly error handling

### Module 03 — User Management
- [x] `user.constants.js` — roles, statuses, providers, routes, validation messages
- [x] `user.events.js` — PROFILE_CREATED, PROFILE_UPDATED, PROFILE_LOADED, PROFILE_DELETED, PREFERENCES_UPDATED
- [x] `user.validator.js` — phone, IST timezone, preferences validation
- [x] `user.service.js` — Firestore CRUD, caching, last login, soft delete
- [x] `user.renderer.js` — profile and complete-profile UI templates
- [x] `profile.page.js` — view and edit profile
- [x] `complete-profile.page.js` — first-time onboarding form
- [x] `user.guard.js` — redirect to complete-profile when profile missing
- [x] `user.bootstrap.js` — session hooks, cache clear on logout, last login tracking
- [x] Router and login integration for post-login and profile-completion flows

### Module 04 — Authorization
- [x] `permission.constants.js` — permissions, routes, and messages
- [x] `authorization.events.js` — PERMISSION_CHANGED, ROLE_CHANGED, ACCESS_DENIED
- [x] `permission.service.js` — role-to-permission mapping
- [x] `authorization.service.js` — centralized `AuthorizationService` API (`hasPermission`, `hasRole`, `canAccessRoute`)
- [x] `role.guard.js` — route authorization with 403 redirect
- [x] `authorization.bootstrap.js` — session hooks and permission cache lifecycle
- [x] Access denied (403) and not found (404) pages
- [x] Route definitions for contestant and admin paths with permission metadata
- [x] Router integration — role guard, 404 handling, permission loading states
- [x] Navbar UI authorization — role-filtered navigation items
- [x] Admin dashboard sidebar — permission-gated management links

### Module 05 — Integration & Bootstrap
- [x] Application bootstrap (`app.js`, `app.startup.js`, `app.context.js`, `app.events.js`, `app.bootstrap.js`)
- [x] Startup sequence — config, logger, Firebase, auth, session restore, user context, navigation, router
- [x] Firebase initialization — single shared module, no duplicate init
- [x] Authentication integration — Google login, email login, logout, session restore, auth state listener
- [x] User integration — profile load after auth, complete-profile flow, Firestore user creation
- [x] Authorization integration — router connection, 403 for unauthorized access, role-based page access
- [x] Router integration — all routes registered, 404 for unknown routes
- [x] Guard pipeline — authentication guard, user guard, authorization guard
- [x] Navigation — dynamic role-filtered navbar and sidebar
- [x] Session restore — browser refresh preserves login and route
- [x] Logout — session destruction and redirect to login
- [x] User context — centralized AppContext for user, profile, role, permissions
- [x] Event bus — auth, user, and application events wired across modules
- [x] Dashboard — contestant and admin welcome views with meaningful empty states
- [x] Empty states — replaced placeholder "Coming Soon" text across pages
- [x] Global error handling — friendly messages, Logger for technical details
- [x] Logger integration — replaced console usage with Logger utility
- [x] Responsive bootstrap UI — loading overlay during init, navigation, and auth flows
- [x] JSDoc documentation — module files documented
- [x] Obsolete placeholder `pages/profile.page.js` removed (route uses `users/profile.page.js`)

### Sprint 1 — Architecture Remediation (Foundation Stabilization)
- [x] `utils/html.util.js` — `escapeHtml()` and `escapeUrl()` applied across renderers
- [x] Centralized logging — all `console.*` replaced with `Logger`
- [x] User renderer split into `users/renderers/` (profile, complete-profile, preferences, shared-form)
- [x] `auth/actions/logout.action.js` — shared `performLogout()` workflow
- [x] `shared/events/event-bus.js` — generic `createEventBus()` factory
- [x] Domain layer — User, Tournament, Match, Prediction, Leaderboard domains
- [x] `TournamentConfigurationService` — centralized tournament settings
- [x] `app/application-context.js` — global session state store
- [x] Dashboard aggregation services (Admin + Contestant)
- [x] `shared/index.js` — shared UI library barrel
- [x] `BaseFirestoreService` — reusable Firestore CRUD base class
- [x] Route metadata standardized (`showInNavbar`, `showInMobileNav`, `requiresProfile`, `icon`)
- [x] Security — fail-closed user guard, HTML escaping, ApplicationContext cleanup on logout
- [x] Architecture documentation (`docs/architecture/`, `docs/engineering/`)

## Upcoming

### Module 06 — Tournament Module
- [ ] Tournament CRUD (admin)
- [ ] Tournament selection (contestant)

### Module 07 — Match Module
- [ ] Match lifecycle states
- [ ] Match management (admin)

### Module 08 — Prediction Engine
- [ ] Score predictions with penalty winner on draws

### Module 09 — Leaderboard
- [ ] Leaderboard data and caching

### Module 10 — Admin Dashboard
- [ ] Full admin console features

### Module 11 — Contestant Dashboard
- [ ] Dashboard business features

### Module 12 — Deployment
- [ ] Firebase Hosting deployment configuration
