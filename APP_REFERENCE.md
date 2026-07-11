# PickTheWinner — Application Reference

| Property | Value |
|----------|--------|
| Version | 1.0 |
| Status | Canonical reference |
| Audience | Product, engineering, QA, AI agents |
| Last Updated | July 2026 |
| Source of truth | Code + this document |

This is the **single authoritative reference** for PickTheWinner application behavior, architecture, UI, data model, permissions, and conventions. It consolidates product requirements, design system, prompts, and module documentation into one place.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Application Shell & Layout](#4-application-shell--layout)
5. [Design System — Themes, Colors & Typography](#5-design-system--themes-colors--typography)
6. [Bootstrap, CSS Classes & DOM IDs](#6-bootstrap-css-classes--dom-ids)
7. [Icons (Bootstrap Icons)](#7-icons-bootstrap-icons)
8. [Authentication](#8-authentication)
9. [Authorization & Permissions](#9-authorization--permissions)
10. [User Management](#10-user-management)
11. [Database — Firestore Collections & Schema](#11-database--firestore-collections--schema)
12. [Administrator Experience](#12-administrator-experience)
13. [Contestant Experience](#13-contestant-experience)
14. [Tournament Module](#14-tournament-module)
15. [Match Module](#15-match-module)
16. [Prediction Engine](#16-prediction-engine)
17. [Scoring Engine](#17-scoring-engine)
18. [Leaderboard Module](#18-leaderboard-module)
19. [Status Reference — Tournaments & Matches](#19-status-reference--tournaments--matches)
20. [Security Model](#20-security-model)
21. [Coding Standards](#21-coding-standards)
22. [Tests](#22-tests)
23. [Key Source Files Index](#23-key-source-files-index)

---

## 1. Project Overview

**PickTheWinner** is a web-based tournament prediction platform. Contestants predict match outcomes and compete on leaderboards. Administrators configure tournaments, publish matches and results, and manage users.

### Vision

A modern, lightweight, Firebase-hosted prediction platform with excellent desktop and mobile UX, scalable across multiple tournaments without architectural rewrites.

### Primary Objectives

- Simple prediction experience for contestants
- Automatic prediction locking before kickoff
- Automated scoring (no manual point calculation)
- Real-time leaderboards
- Full tournament administration
- Multi-tournament support over time
- Clean, maintainable layered architecture

### User Roles

| Role | Code | Description |
|------|------|-------------|
| Administrator | `ADMIN` | Full platform management |
| Contestant | `CONTESTANT` | Predictions, leaderboard (when enabled), profile |
| Guest | — | Unauthenticated; landing and login only |

### Timezone

All application times are **Indian Standard Time (IST / Asia/Kolkata)**. Users cannot select a different timezone.

---

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vanilla JavaScript (ES modules), HTML5, CSS3 |
| UI Framework | Bootstrap 5 (utilities first) |
| Icons | Bootstrap Icons (`bi-*`) |
| Fonts | Poppins (headings), Inter (body) — Google Fonts |
| Backend / DB | Firebase (Authentication + Firestore) |
| Hosting | Netlify (static SPA) |
| Tests | Node.js built-in test runner (`node --test`) |

### CSS File Structure

```
public/css/
  variables.css      — Design tokens (colors, spacing, typography)
  layout.css         — App shell, sidebar, navbar, page layout
  components.css     — Cards, buttons, forms, badges, match cards
  utilities.css      — PTW utility classes
  app.css            — Entry imports
  leaderboard.css    — Leaderboard-specific styles
  admin-prediction-card.css
```

### JavaScript Folder Structure (high level)

```
public/js/
  app/               — ApplicationContext, startup, bootstrap
  auth/              — Authentication service, guards, logout action
  authorization/     — RBAC, permissions, route access
  config/            — routes.js, app.config.js
  domain/            — Pure business logic (no Firestore/DOM)
  components/        — Reusable UI (navbar, sidebar, cards, countdown)
  pages/             — Page entry points
  services/          — Router, layout, BaseFirestoreService
  tournament/        — Tournament admin & contestant views
  match/             — Match admin & contestant views
  prediction/        — Prediction form, submission, admin views
  scoring/           — Scoring engine
  leaderboard/       — Leaderboard display
  users/             — Profile, user management
  dashboard/         — Admin & contestant dashboard aggregation
  settings/          — Platform settings (leaderboard visibility)
  master-data/       — Teams, match stages
  shared/            — Avatar, logo, event bus
  utils/             — Logger, HTML escape, toast
```

---

## 3. System Architecture

### Layered Architecture

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

### Layer Responsibilities

| Layer | May Do | Must Not Do |
|-------|--------|-------------|
| **Pages** | Init, bind events, call services | Firestore directly |
| **Renderers** | HTML templates | Firestore, business logic |
| **Domain** | Business rules, validation | Firestore, DOM |
| **Services** | Firestore CRUD, caching | DOM manipulation |
| **Components** | Reusable UI | Business logic |

### Core Domain Modules (`public/js/domain/`)

| Domain | Responsibility |
|--------|----------------|
| `UserDomain` | Profile completeness, role suggestions, protected fields |
| `TournamentDomain` | Tournament lifecycle transitions, visibility |
| `MatchDomain` | Prediction windows, lock calculation, effective status |
| `PredictionDomain` | Prediction workflow rules, penalty winner |
| `LeaderboardDomain` | Ranking, tie-breakers, visibility limits |
| `ScoringDomain` | Point evaluation from predictions vs results |
| `ContestantMatchViewDomain` | Contestant match list filtering rules |
| `PredictionManagementDomain` | Admin prediction views |

### Application Context

`app/application-context.js` holds global session state: authenticated user, profile, active tournament, permissions. `app/app.context.js` is the read facade for UI modules.

### Bootstrap Sequence

`app/app.startup.js` runs a deterministic startup:

1. Firebase initialization
2. Auth state restoration (`onAuthStateChanged`)
3. Profile load (if authenticated)
4. Authorization resolution
5. Router initialization
6. App shell layout update
7. Initial route render

### Event Architecture

All module event buses use `createEventBus(namespace)` from `shared/events/event-bus.js`:

- `app.events.js`
- `authentication.events.js`
- `user.events.js`
- `authorization.events.js`
- Module-specific buses (tournament, match, scoring, leaderboard, etc.)

### Routing

- Route definitions: `config/routes.js`
- Router service: `services/router.service.js`
- Metadata per route: `requiresAuth`, `requiresProfile`, `requiredRole`, `guestOnly`, `showInNavbar`, `showInMobileNav`, `icon`, `title`, `roles`
- Navigation filtering: **only** through `AuthorizationService.getAuthorizedNavRoutes()`

### Guard Pipeline (sequential)

1. **Auth guard** — redirects unauthenticated users to `/login`
2. **User guard** — loads profile; fail-closed redirect to `/error` on failure; locked users → `/account-locked`
3. **Role guard** — enforces `requiredRole` on routes
4. **Leaderboard guard** — enforces `settings/general.leaderboardVisible` for contestants

---

## 4. Application Shell & Layout

### DOM Mount Points (`public/index.html`)

| ID | Purpose |
|----|---------|
| `#ptw-navbar-mount` | Top navbar (guest/minimal) or hidden in admin shell |
| `#ptw-body-wrapper` | Flex wrapper for sidebar + main |
| `#ptw-sidebar-mount` | Left sidebar (admin & contestant shells) |
| `#ptw-page-outlet` | Main content area (`role="main"`) |
| `#ptw-mobile-nav-mount` | Mobile bottom navigation |
| `#ptw-footer-mount` | Footer |

### Shell Modes

| Mode | Trigger | Layout |
|------|---------|--------|
| **Guest** | `/`, `/login` | Navbar only, centered content |
| **Admin sidebar** | `/admin/*`, `/admin`, `/settings`, `/profile`, `/leaderboard` (admin) | Left sidebar + main; navbar/footer/mobile-nav hidden |
| **Contestant sidebar** | `/dashboard`, `/tournaments`, `/matches`, `/predictions`, `/score`, `/leaderboard`, `/profile`, `/settings` | Left sidebar + main |

Shell mode is managed by `services/layout.service.js` via class `ptw-app-shell--admin` on the app shell root.

### Sidebar Offcanvas (Mobile)

| ID | Purpose |
|----|---------|
| `#ptwAdminSidebarOffcanvas` | Bootstrap offcanvas for mobile sidebar |
| `#ptwAdminSidebarOffcanvasLabel` | Offcanvas title |

### Page Shell Classes

| Shell | Classes |
|-------|---------|
| Admin pages | `container-fluid px-3 px-lg-4 ptw-admin-page ptw-page-content ptw-density-compact` |
| Contestant pages | Same as admin (`CONTESTANT_PAGE_SHELL_CLASSES`) |

### Responsive Breakpoints

- **Mobile-first** design; root font size `14px` on mobile
- **Desktop sidebar**: persistent from `lg` breakpoint (~992px)
- **Mobile**: hamburger toggles offcanvas sidebar; compact density
- **Leaderboard**: table layout ≥768px; card layout <768px

---

## 5. Design System — Themes, Colors & Typography

**Principle:** Dark theme first. Premium, sporty, high-energy — inspired by stadium lighting and sports broadcast graphics. **Do not** copy FIFA branding.

### Theme

- Default: **Dark theme**
- All colors via CSS variables in `public/css/variables.css` — **never hardcode colors elsewhere**

### Color Palette

| Token | Variable | Hex |
|-------|----------|-----|
| Primary Blue | `--ptw-color-primary-blue` | `#1565FF` |
| Primary Green | `--ptw-color-primary-green` | `#00C853` |
| Accent Red | `--ptw-color-accent-red` | `#D50032` |
| Accent Gold | `--ptw-color-accent-gold` | `#FFC107` |
| BG Primary | `--ptw-color-bg-primary` | `#0B1220` |
| BG Secondary | `--ptw-color-bg-secondary` | `#172033` |
| BG Tertiary | `--ptw-color-bg-tertiary` | `#1F2A44` |
| Text Primary | `--ptw-color-text-primary` | `#FFFFFF` |
| Text Secondary | `--ptw-color-text-secondary` | `#C7D2E0` |
| Text Muted | `--ptw-color-text-muted` | `#94A3B8` |
| Border | `--ptw-color-border` | `#2D3A52` |
| Success | `--ptw-color-success` | `#00C853` |
| Warning | `--ptw-color-warning` | `#FFC107` |
| Danger | `--ptw-color-danger` | `#D50032` |
| Info | `--ptw-color-info` | `#1565FF` |

Gold is reserved for trophies and achievements only.

### Typography

| Token | Value |
|-------|-------|
| Heading font | `--ptw-font-heading`: Poppins |
| Body font | `--ptw-font-body`: Inter |
| Weights | 400, 500, 600, 700 |

### Spacing & Layout Tokens

| Token | Value |
|-------|-------|
| Container max | `--ptw-container-max`: 1200px |
| Navbar height | `--ptw-navbar-height`: 4rem |
| Sidebar width | `--ptw-sidebar-width`: 280px |
| Sidebar collapsed | `--ptw-sidebar-collapsed-width`: 72px |
| Mobile nav height | `--ptw-mobile-nav-height`: 4rem |
| Border radius | sm/md/lg/xl/pill |
| Shadows | sm/md/lg |
| Transitions | fast (150ms), base (250ms), slow (400ms) |
| Z-index scale | dropdown 1000 → loading 1070 |

### Component Patterns

| Component | Style |
|-----------|-------|
| **Buttons** | `btn-ptw-primary` (blue), `btn-ptw-secondary` (green), `btn-ptw-danger` (red); rounded, hover, focus, disabled, loading states |
| **Cards** | `ptw-card` — dark bg, rounded, subtle border, soft shadow, hover animation |
| **Badges** | Semantic variants with readable tints on dark backgrounds (`--ptw-badge-*`) |
| **Forms** | Bootstrap form controls themed via CSS variables |
| **Tables** | Dark themed; sticky header on desktop leaderboard |
| **Empty states** | Icon + title + message + optional CTA |
| **Skeleton loading** | `ptw-skeleton-card` placeholder cards |

### Density

Apply `.ptw-density-compact` on page shells for tighter card padding and stat sizing on dashboard views.

---

## 6. Bootstrap, CSS Classes & DOM IDs

### Bootstrap Usage

- **Bootstrap First** — prefer Bootstrap utilities (`d-flex`, `gap-3`, `row`, `col-*`, `mb-4`, `btn`, `card`, `badge`, `spinner-border`) before custom CSS
- Bootstrap theme overridden via CSS variables (`--bs-primary`, `--bs-body-bg`, etc.)

### Key PTW CSS Classes

| Class | Purpose |
|-------|---------|
| `.ptw-app-shell` | Root application wrapper |
| `.ptw-app-shell--admin` | Admin/contestant sidebar shell mode |
| `.ptw-body-wrapper` | Sidebar + main flex container |
| `.ptw-body-wrapper--with-sidebar` | Sidebar visible |
| `.ptw-main` | Main content outlet |
| `.ptw-page-content` | Page content padding |
| `.ptw-admin-page` | Admin/contestant page shell |
| `.ptw-density-compact` | Compact dashboard density |
| `.ptw-card` | Standard dark card |
| `.ptw-text-muted` | Muted text color |
| `.ptw-navbar` | Navbar component |
| `.ptw-sidebar` | Sidebar panel |
| `.ptw-sidebar__link` | Sidebar nav link |
| `.ptw-sidebar__group-label` | Sidebar section group |
| `.ptw-admin-mobile-bar` | Mobile top bar with hamburger |
| `.ptw-contestant-dashboard` | Contestant dashboard root |
| `.ptw-admin-dashboard` | Admin dashboard root |
| `.ptw-dashboard-welcome-header` | Welcome header block |
| `.ptw-dashboard-timezone-badge` | IST timezone indicator |
| `.ptw-dashboard-main-grid` | Featured match grid |
| `.ptw-login-page` | Login page layout |
| `.ptw-landing-page` | Landing page layout |
| `.ptw-placeholder-card` | Loading placeholder centering |

### Button Classes

| Class | Use |
|-------|-----|
| `btn-ptw-primary` | Primary actions (blue) |
| `btn-ptw-secondary` | Secondary actions (green) |
| `btn-ptw-danger` | Destructive actions (red) |

### Data Attributes

| Attribute | Purpose |
|-----------|---------|
| `data-route` | Client-side router link interception |
| `data-bs-toggle="offcanvas"` | Mobile sidebar toggle |
| `data-bs-target="#ptwAdminSidebarOffcanvas"` | Offcanvas target |

---

## 7. Icons (Bootstrap Icons)

Icons use the `bi bi-{name}` pattern. Key icons by area:

### Navigation

| Icon | Usage |
|------|-------|
| `bi-grid` | Contestant dashboard |
| `bi-house` | Admin dashboard group |
| `bi-trophy` | Tournaments, leaderboard |
| `bi-bullseye` | Predictions |
| `bi-flag` | Matches |
| `bi-bar-chart` | Score, contestant leaderboard nav |
| `bi-book` | Master data |
| `bi-people` | User management |
| `bi-person` | Profile |
| `bi-gear` | Settings |
| `bi-shield-lock` | Admin nav item |
| `bi-box-arrow-in-right` | Sign in |
| `bi-box-arrow-right` | Sign out |

### Status & Actions

| Icon | Usage |
|------|-------|
| `bi-broadcast` / `bi-broadcast-pin` | Live match |
| `bi-calendar-event` | Published / upcoming |
| `bi-check-circle` | Completed, success |
| `bi-archive` | Archived |
| `bi-lock` / `bi-lock-fill` | Locked account/prediction |
| `bi-unlock` | Unlock user |
| `bi-pencil` | Draft, edit |
| `bi-eye` | View details |
| `bi-plus-circle` | Create |
| `bi-trash` | Delete |
| `bi-arrow-clockwise` | Refresh |
| `bi-clock` | Countdown, timezone |
| `bi-exclamation-triangle` | Warnings |
| `bi-dribbble` | Match card decoration |
| `bi-stopwatch` | Match timing |
| `bi-award` | Achievements |
| `bi-telephone` | Contact info |

---

## 8. Authentication

### Providers

| Provider | Code | Method |
|----------|------|--------|
| Google | `GOOGLE` | OAuth popup |
| Email/Password | `EMAIL_PASSWORD` | Email + password form |

### Auth Routes

| Route | Path | Access |
|-------|------|--------|
| Login | `/login` | Guest only |
| Dashboard | `/dashboard` | Contestant default after login |
| Admin | `/admin` | Admin default after login |
| Complete Profile | `/complete-profile` | Authenticated, incomplete profile |
| Account Locked | `/account-locked` | Locked users |

### Session Flow

1. Firebase `onAuthStateChanged` restores session on page load
2. Profile loaded from Firestore `users/{uid}`
3. Authorization resolved from profile role
4. Router navigates to role default route

### Login Behavior

| Scenario | Result |
|----------|--------|
| Guest visits `/login` | Login page shown |
| Authenticated contestant visits `/login` | Redirect to `/dashboard` |
| Authenticated admin visits `/login` | Redirect to `/admin` |
| Returning user (session restored) | Redirect to role default route |
| Locked user signs in | Redirect to `/account-locked` |

### Logout

**Always** use `performLogout()` from `auth/actions/logout.action.js`.

Logout clears:
- Firebase auth session
- Profile cache
- Authorization cache
- Tournament configuration cache
- Tournament list cache
- ApplicationContext / AppContext

Then navigates to `/login` with success toast.

### Auth Events

`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `SESSION_RESTORED`, `SESSION_EXPIRED`

---

## 9. Authorization & Permissions

### Role-Permission Map

**Administrator (`ADMIN`)**: All permissions.

**Contestant (`CONTESTANT`)**:

| Permission | Description |
|------------|-------------|
| `VIEW_PROFILE` | View own profile |
| `EDIT_PROFILE` | Edit own profile |
| `SUBMIT_PREDICTION` | Submit new prediction |
| `EDIT_PREDICTION` | Edit prediction before lock |

### Full Permission List

| Permission | Admin | Contestant |
|------------|:-----:|:----------:|
| `VIEW_DASHBOARD` | ✓ | — |
| `VIEW_PROFILE` | ✓ | ✓ |
| `EDIT_PROFILE` | ✓ | ✓ |
| `VIEW_LEADERBOARD` | ✓ | conditional* |
| `CREATE_TOURNAMENT` | ✓ | — |
| `UPDATE_TOURNAMENT` | ✓ | — |
| `DELETE_TOURNAMENT` | ✓ | — |
| `CREATE_MATCH` | ✓ | — |
| `UPDATE_MATCH` | ✓ | — |
| `DELETE_MATCH` | ✓ | — |
| `SUBMIT_PREDICTION` | ✓ | ✓ |
| `EDIT_PREDICTION` | ✓ | ✓ |
| `VIEW_ALL_PREDICTIONS` | ✓ | — |
| `MANAGE_CONTESTANTS` | ✓ | — |
| `PUBLISH_RESULTS` | ✓ | — |
| `CONFIGURE_SETTINGS` | ✓ | — |
| `MANAGE_TEAMS` | ✓ | — |
| `MANAGE_MATCH_STAGES` | ✓ | — |

\*Contestant leaderboard access requires `settings/general.leaderboardVisible === true`.

### Route Access Rules

- `guestOnly: true` — only unauthenticated users (e.g. `/login`)
- `requiresAuth: true` — must be signed in
- `requiresProfile: true` — must have complete Firestore profile (contestants)
- `requiredRole: 'ADMIN' | 'CONTESTANT'` — role enforcement
- Admins do **not** require completed profile on admin routes

### Default Routes by Role

| Role | Default Route |
|------|---------------|
| Admin | `/admin` |
| Contestant | `/dashboard` |
| Authenticated, no profile | `/complete-profile` |
| Guest | `/` |

### Access Denied

- Route: `/403` — permission denied page
- Not found: `/404`
- UI actions: `AuthorizationService.requirePermission()` shows warning toast

### Contestant Visiting Admin Routes

Redirected to `/403` or role default — contestants cannot access `/admin/*`.

### Admin Visiting Contestant Routes

Admins may access shared routes (`/profile`, `/settings`, `/leaderboard`).

---

## 10. User Management

### User Document (`users` collection)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `uid` | String | Yes | Firebase Auth UID (document ID) |
| `name` | String | Yes | Display name |
| `email` | String | Yes | Email |
| `phone` | String | No | Required for contestants |
| `photoURL` | String | No | Profile photo |
| `role` | String | Yes | `ADMIN` or `CONTESTANT` |
| `provider` | String | Yes | `GOOGLE` or `EMAIL_PASSWORD` |
| `status` | String | Yes | See statuses below |
| `district` | String | No | Required for contestants |
| `pradeshikaSabha` | String | No | Required for contestants |
| `timezone` | String | Yes | Fixed `Asia/Kolkata` |
| `notificationPreferences` | Object | Yes | `{ email, browser }` |
| `statistics` | Object | Yes | Tournaments, predictions, points |
| `createdAt` | Timestamp | Yes | |
| `updatedAt` | Timestamp | Yes | |
| `lastLogin` | Timestamp | No | |
| `lockedBy` | String | No | Admin UID who locked |
| `lockedAt` | Timestamp | No | Lock timestamp |
| `lockReason` | String | No | Max 500 chars |

### User Statuses

| Status | Behavior |
|--------|----------|
| `ACTIVE` | Full access |
| `LOCKED` | Cannot sign in; redirected to `/account-locked` |
| `INACTIVE` | Soft-deleted |
| `SUSPENDED` | Future use |

### Lock Workflow

**Lock:** `status → LOCKED`, set `lockedBy`, `lockedAt`, optional `lockReason`

**Unlock:** `status → ACTIVE`, clear lock fields

**Restrictions:**
- Admin cannot lock own account
- Admin cannot lock another admin
- Firestore rules deny prediction writes for locked users

### Contestant Profile Requirements

Required fields for complete profile: `name`, `phone`, `district`, `pradeshikaSabha`

Incomplete profile → redirect to `/complete-profile` on contestant routes.

### Admin User Management Pages

| Route | Features |
|-------|----------|
| `/admin/users` | List, search, filter by role/status, lock/unlock, view profile |
| `/admin/users/:uid` | Individual user profile admin view |

---

## 11. Database — Firestore Collections & Schema

### Collections Overview

| Collection | Purpose |
|------------|---------|
| `users` | User profiles and statistics |
| `tournaments` | Tournament config and lifecycle |
| `matches` | Match schedule, status, results |
| `predictions` | Contestant predictions |
| `teams` | Team master data |
| `venues` | Venue master data |
| `match_stages` | Configurable round/stage labels |
| `settings` | Platform-wide settings (`general` doc) |
| `leaderboard_cache` | Cached point totals per tournament |
| `audit_logs` | Append-only admin audit trail |

### Tournaments (`tournaments`)

Key fields: `name`, `status`, `visibility`, `configuration`, `active` flag

#### Configuration Object

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `timezone` | String | `Asia/Kolkata` | Fixed IST |
| `canEndInDraw` | Boolean | — | League draws allowed |
| `requiresWinner` | Boolean | — | Knockout requires winner |
| `winnerResolution` | String | — | e.g. `regulation` |
| `tieBreaker` | Object | — | Leaderboard tie-break strategy |
| `predictionLockMinutes` | Integer | 10 | Lock before kickoff (1–60) |
| `predictionOpenHoursBeforeKickoff` | Integer | 48 | Open window (1–168) |
| `scoringConfiguration.correctMatchScorePoints` | Integer | — | Points for exact score (0–100) |
| `scoringConfiguration.correctPenaltyWinnerPoints` | Integer | — | Points for penalty winner (0–100) |

No hardcoded scoring defaults — legacy tournaments must be configured before scoring runs.

### Matches (`matches`)

| Field | Type | Description |
|-------|------|-------------|
| `tournamentId` | String | Parent tournament |
| `matchNumber` | Integer | Unique within tournament |
| `round` | String | Stage key (from `match_stages`) |
| `homeTeamId`, `awayTeamId` | String | Team references |
| `venueId` | String | Venue reference |
| `kickoffUtc` | Timestamp | Kickoff in UTC |
| `status` | String | Lifecycle status |
| `visible` | Boolean | Contestant visibility |
| `result` | Object | Official result |
| `scoringStatus` | String | Scoring state |
| `customScoringConfig` | Object/null | Per-match point override |

#### Result Subdocument

| Field | Description |
|-------|-------------|
| `homeScore`, `awayScore` | Normal + extra time scores |
| `winnerResolution` | `normal_time_extra_time` or `penalties` |
| `winningTeamId` | Winner team ID |
| `published` | Result visible to contestants |
| `publishedAt`, `publishedBy` | Audit fields |

Penalty shootout goals are **never** stored.

### Predictions (`predictions`)

| Field | Type | Description |
|-------|------|-------------|
| `userId` | String | Contestant UID |
| `matchId` | String | Match reference |
| `tournamentId` | String | Tournament reference |
| `homeScore`, `awayScore` | Integer | Predicted scores |
| `predictedWinner` | String/null | `HOME` or `AWAY` for knockout draws |
| `locked` | Boolean | Prediction locked |
| `status` | String | `saved`, `updated`, `locked`, `scored` |
| `calculatedPoints` | Integer | Points after scoring |
| `scoringBreakdown` | Array | `{ label, points, correct }` |
| `scored` | Boolean | Scoring applied |
| `submittedAt`, `updatedAt`, `scoredAt` | Timestamp | |

**Index:** `userId ASC, submittedAt DESC` (contestant history queries)

### Settings (`settings/general`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `leaderboardVisible` | Boolean | `false` | Contestants can view leaderboard |
| `contestantLeaderboardLimit` | Integer | `10` | Top N ranks visible to contestants (1–10) |
| `updatedAt`, `updatedBy` | — | Audit fields |

Read via `PlatformSettingsService` only.

### Leaderboard Cache (`leaderboard_cache`)

```javascript
{
  tournamentId: string,
  matchId: string,       // or tournament-level key
  totals: { [userId]: points },
  updatedAt: Timestamp
}
```

### Teams & Venues

Master data with `active` flag controlling form availability.

### Match Stages (`match_stages`)

Configurable round labels. Falls back to built-in defaults if collection empty.

---

## 12. Administrator Experience

### Shell & Navigation

- **Layout:** Left sidebar (desktop) / offcanvas (mobile)
- **Top bar:** Minimal admin mobile bar with hamburger on small screens
- **Navbar/footer:** Hidden in admin shell mode

### Sidebar Navigation (`sidebar-nav.config.js`)

| Section | Items |
|---------|-------|
| **Dashboard** | Overview (`/admin`) |
| **Tournament Management** | Tournaments (`/admin/tournaments`), Matches (`/admin/matches`) |
| **Predictions** | Predictions (`/admin/predictions`), Prediction History (`/admin/prediction-history`), Leaderboard (`/leaderboard`) |
| **Master Data** | Teams (`/admin/teams`), Match Stages (`/admin/match-stages`) |
| **Administration** | User Management (`/admin/users`), General Settings (`/admin/settings`) |
| **My Account** | Profile (`/profile`), Settings (`/settings`) |

### Admin Pages & Routes

| Route | Page Module | Purpose |
|-------|-------------|---------|
| `/admin` | `admin-dashboard.page.js` | Overview dashboard |
| `/admin/tournaments` | `tournament-admin.page.js` | CRUD tournaments |
| `/admin/tournaments/archived` | `tournament-archived.page.js` | Archived tournaments |
| `/admin/matches` | `match-admin.page.js` | CRUD matches |
| `/admin/matches/archived` | `match-archived.page.js` | Archived matches |
| `/admin/predictions` | `admin-predictions.page.js` | All predictions overview |
| `/admin/prediction-history` | `admin-prediction-history-list.page.js` | Per-contestant history list |
| `/admin/prediction-history/:uid` | `admin-prediction-history-contestant.page.js` | Single contestant history |
| `/admin/users` | `user-management.page.js` | User list & lock/unlock |
| `/admin/users/:uid` | `user-profile-admin.page.js` | User detail |
| `/admin/teams` | `teams-admin.page.js` | Team master data |
| `/admin/match-stages` | `match-stages-admin.page.js` | Stage master data |
| `/admin/settings` | `admin-settings.page.js` | Platform settings |
| `/admin/leaderboard` | `admin-leaderboard.page.js` | Full leaderboard (admin view) |
| `/leaderboard` | `leaderboard.page.js` | Shared leaderboard route |
| `/profile` | `profile.page.js` | Admin profile |
| `/settings` | `settings.page.js` | Account settings |

### Admin Dashboard (`/admin`)

**Service:** `AdminDashboardService.getDashboardData()`

**Sections (UI):**

| Section | Content |
|---------|---------|
| Page header | Title, subtitle, CTA (Manage/Create Tournament) |
| Welcome card | Personalized welcome message |
| Active tournament hero | Current active tournament name, status, quick stats |
| Live match spotlight | Currently live match card |
| Upcoming match spotlight | Next featured match with countdown |
| Empty state | When no tournaments exist — create CTA |

**Actions permitted:**
- View tournament overview
- Navigate to tournament management
- Create new tournament (when none exist)
- View live/upcoming match details

### Admin Actions by Module

| Module | Permitted Actions |
|--------|-------------------|
| **Tournaments** | Create, edit, publish, go live, complete, archive, restore, delete (archived), set active tournament, configure scoring/locks/tie-breakers |
| **Matches** | Create, edit, publish, hide/show, open/close predictions, go live, enter result, publish result, archive, custom scoring override |
| **Predictions** | View all predictions, filter, statistics, export stubs |
| **Prediction History** | Browse by contestant, view full history |
| **Users** | List, search, view profile, lock, unlock |
| **Teams** | CRUD team master data |
| **Match Stages** | CRUD stage labels and sort order |
| **Settings** | Toggle leaderboard visibility, set contestant leaderboard limit |
| **Leaderboard** | View full rankings, refresh, all contestants (no Top-N limit) |

### Admin UI Design

| Aspect | Web (≥992px) | Mobile (<992px) |
|--------|--------------|-----------------|
| Navigation | Persistent left sidebar | Offcanvas sidebar via hamburger |
| Dashboard | Two-column spotlight grid | Stacked cards |
| Tables | Full data tables with filters | Responsive cards or horizontal scroll |
| Forms | Multi-column where appropriate | Single column stacked |
| Density | Compact (`ptw-density-compact`) | Compact |

---

## 13. Contestant Experience

### Shell & Navigation

- **Layout:** Left sidebar (same shell system as admin, contestant variant)
- **Home path:** `/dashboard`

### Sidebar Navigation

| Item | Path | Notes |
|------|------|-------|
| Dashboard | `/dashboard` | Home |
| **Tournaments** | | |
| → My Tournaments | `/tournaments` | |
| → Archived Tournaments | `/tournaments/archived` | Placeholder section |
| **Predictions** | | |
| → Upcoming Matches | `/matches` | |
| → My Predictions | `/predictions` | Primary workspace |
| → Prediction History | `/predictions/history` | |
| Leaderboard | `/leaderboard` | Hidden when `leaderboardVisible=false` |
| Profile | `/profile` | Account links footer |

### Contestant Pages & Routes

| Route | Page Module | Purpose |
|-------|-------------|---------|
| `/dashboard` | `dashboard.page.js` | Contestant home |
| `/tournaments` | `tournaments.page.js` | Browse visible tournaments |
| `/tournaments/archived` | `contestant-section.page.js` | Placeholder |
| `/matches` | `matches.page.js` | All visible matches |
| `/predictions` | `predictions.page.js` | Submit/edit predictions |
| `/predictions/history` | `prediction-history.page.js` | Historical predictions |
| `/score` | `score.page.js` | Score summary |
| `/leaderboard` | `leaderboard.page.js` | Rankings (when enabled) |
| `/leaderboard/unavailable` | `leaderboard-unavailable.page.js` | Leaderboard disabled message |
| `/statistics` | `contestant-section.page.js` | Placeholder |
| `/profile` | `profile.page.js` | Profile management |
| `/settings` | `settings.page.js` | Preferences |
| `/complete-profile` | `complete-profile.page.js` | First-time profile setup |
| `/account-locked` | `account-locked.page.js` | Locked account message |

### Contestant Dashboard (`/dashboard`)

**Service:** `ContestantDashboardService`

**Sections:**

| Section | Renderer | Content |
|---------|----------|---------|
| Welcome header | `contestant-dashboard.renderer.js` | "Welcome back, {name}!" + IST badge |
| Active tournament hero | `active-tournament.renderer.js` | Tournament name, season, status badge, prediction stats |
| Live match | `featured-match.renderer.js` | Currently live match card |
| Upcoming match | `featured-match.renderer.js` | Next match with countdown |
| Quick stats | `quick-stats.renderer.js` | Total/submitted/pending predictions |
| Recent activity | `recent-activity.renderer.js` | Recent prediction activity feed |
| Info cards | `info-cards.renderer.js` | Helpful links (predictions, leaderboard, contact) |

**Empty state:** No visible tournaments — "Browse Tournaments" CTA.

**Layout:**
- Live + upcoming matches side-by-side on desktop (`col-lg-6` each)
- Single column on mobile
- Countdown hidden when predictions locked

### Contestant Actions Permitted

| Action | Condition |
|--------|-----------|
| View tournaments | Tournament visible + status `published`/`live`/`completed` |
| View matches | Match `visible=true` + contestant-visible status |
| Submit prediction | Prediction window open (`prediction_open`) |
| Edit prediction | Window open + existing prediction |
| View own predictions | Always (own `userId`) |
| View leaderboard | `leaderboardVisible=true` |
| Edit profile | `EDIT_PROFILE` permission |
| View match results | `result.published=true` |

### Contestant UI Design

| Aspect | Web (≥992px) | Mobile (<992px) |
|--------|--------------|-----------------|
| Navigation | Persistent sidebar | Offcanvas sidebar |
| Dashboard | Two-column match spotlight | Stacked cards |
| Predictions | Match cards grouped by round | Full-width cards |
| Leaderboard | Table view | Card view per contestant |
| Match cards | Team flags, scores, badges, countdown | Same, touch-friendly buttons |
| Buttons | Full-width on cards for primary actions | Full-width |

### Prediction Button States

| State | Button |
|-------|--------|
| Window open, no prediction | **Make Prediction** |
| Window open, has prediction | **Edit Prediction** |
| Window closed / live / completed | **Prediction Locked** (disabled) |
| Result published | **View Details** |

---

## 14. Tournament Module

### Tournament Statuses

| Status | Label | Contestant visible? |
|--------|-------|---------------------|
| `draft` | Draft | No |
| `published` | Published | Yes (if visibility=`visible`) |
| `live` | Live | Yes |
| `completed` | Completed | Yes |
| `archived` | Archived | No |

### Tournament Visibility (independent of status)

| Value | Effect |
|-------|--------|
| `visible` | Eligible when status is published/live/completed |
| `hidden` | Never shown to contestants |
| `archived` | Never shown |

### Allowed Transitions

```
draft → published, archived
published → live, completed, archived
live → completed, archived
completed → archived
archived → completed (restore)
```

### Key Business Rules

- Only one **active tournament** at a time
- Publishing auto-sets active if no other active tournament
- `completed` tournaments are read-only for admins
- Permanent delete only from archived tab (removes all related data)

### Admin Tournament Features

- Create/edit tournament metadata (name, season, sport, type)
- Configure prediction windows, scoring, tie-breakers
- Publish, go live, complete, archive, restore
- Set as active tournament
- View tournament detail with match list

---

## 15. Match Module

### Match Statuses

| Status | Label | Contestant visible? |
|--------|-------|---------------------|
| `draft` | Draft | No |
| `published` | Published | Yes (if visible) |
| `prediction_open` | Prediction Open | Yes |
| `prediction_locked` | Prediction Locked | Yes |
| `live` | Live | Yes |
| `completed` | Completed | Yes |
| `result_published` | Result Published | Yes |
| `archived` | Archived | No |

Note: `scheduled` may appear in docs but primary enum uses `published` as first visible state.

### Effective (Automatic) Status

Based on kickoff time and tournament config:

| Condition | Effective Status |
|-----------|------------------|
| Before prediction window | `published` (predictions closed) |
| Inside prediction window | `prediction_open` |
| After lock, before kickoff | `prediction_locked` |
| At/after kickoff | `live` |
| Admin terminal states | `completed`, `result_published` not auto-changed |

**Defaults:** Open 48h before kickoff, lock 10 min before kickoff.

### Countdown Phases

| Phase | Label |
|-------|-------|
| `PRE_OPEN` | Time Remaining for Prediction Window Opens |
| `OPEN` | Time Remaining for Kickoff |
| `CLOSED` / `HIDDEN` | No countdown (locked or live) |

### Admin Match Features

- CRUD matches within tournament
- Publish / hide (visibility toggle)
- Manual open/close prediction window
- Go live, enter result, publish result
- Per-match custom scoring override
- Archive matches
- Penalty shootout winner resolution

### Contestant Match Features

- List all visible matches
- Match detail: teams, kickoff, status, prediction status
- Official result comparison (when published)
- Match cards with status badges and points earned

---

## 16. Prediction Engine

### Submission Rules

- Contestant must be authenticated with complete profile
- Match must be `visible=true`
- Tournament must be visible to contestants
- Prediction window must be open (`MatchDomain.isPredictionOpen()`)
- One prediction per user per match

### Prediction Fields

| Field | Description |
|-------|-------------|
| `homeScore`, `awayScore` | Predicted full-time scores (incl. extra time) |
| `predictedWinner` | Required for knockout draws — `HOME` or `AWAY` |

### Lock Behavior

- Automatic lock at `kickoff - predictionLockMinutes`
- Manual admin close also locks
- Locked predictions cannot be edited
- `canEditPrediction()` enforces window + lock state

### Prediction Status Lifecycle

`saved` → `updated` → `locked` → `scored`

### Validation

- Scores must be non-negative integers
- Penalty winner required when predicting draw in knockout requiring winner
- Rejects submission for hidden matches, closed windows, locked accounts

---

## 17. Scoring Engine

**Module:** `public/js/scoring/scoring.domain.js`, `scoring.service.js`

### Principle

Scoring runs when admin publishes a match result. Predictions are evaluated against the official result; points update `calculatedPoints`, `scoringBreakdown`, and leaderboard cache.

### Scoring Configuration Resolution

1. If match `customScoringConfig.useCustomPoints=true` → use match-level points
2. Else → use tournament `configuration.scoringConfiguration`
3. Both `correctMatchScorePoints` and `correctPenaltyWinnerPoints` must be valid (0–100) or scoring is blocked

### Evaluation Rules

| Rule | Points |
|------|--------|
| **Correct Match Score** | `correctMatchScorePoints` if `homeScore` AND `awayScore` match exactly |
| **Correct Penalty Winner** | `correctPenaltyWinnerPoints` if result resolved via penalties AND `predictedWinner` matches actual penalty winner |

### Scoring Breakdown

Each scored prediction stores:

```javascript
scoringBreakdown: [
  { label: 'Correct Match Score', points: 10, correct: true },
  { label: 'Correct Penalty Winner', points: 5, correct: false }
]
```

### Idempotency

Re-scoring the same match should not double-count points (service enforces scored flag).

### Leaderboard Integration

`ScoringDomain.aggregatePointsByUser()` sums `calculatedPoints` from scored predictions → updates `leaderboard_cache`.

---

## 18. Leaderboard Module

### Principle

**Leaderboard does NOT calculate scores.** It displays pre-calculated rankings from the Scoring Engine.

### Architecture

```
Pages → Components → Renderers → Service → Domain → Repository → Firestore
```

### Data Sources

1. `leaderboard_cache` — point totals per tournament
2. `predictions` — detailed stats (correct winners, exact scores)
3. `users` — display names, photos
4. `matches` — completion counts

### Ranking Logic

1. **Primary sort:** Total points (descending)
2. **Tie-breaker:** From `configuration.tieBreaker` (default: `displayName` alphabetical)
   - Configurable: `correctWinnerPredictions`, `exactScorePredictions`, etc.

### Visibility Controls

| Setting | Field | Behavior |
|---------|-------|----------|
| Show Leaderboard | `leaderboardVisible` | `false` → contestants see unavailable page |
| Top N Limit | `contestantLeaderboardLimit` | Contestants see only top N ranks (1–10, default 10) |
| Admin view | — | Always full leaderboard, no limit |

### Features

**Contestant:**
- Tournament rankings with points, accuracy, stats
- Search by name/country (debounced 300ms)
- Filters: All, Top 10/25/50, My Position (±5 ranks)
- Responsive table (desktop) / cards (mobile)

**Admin:**
- All tournaments switcher
- Manual refresh
- Full statistics and completion rates

### Caching

- Cache duration: 5 minutes
- Cache key: `{tournamentId}:full`
- Manual refresh via button

### Movement Indicators

↑ improved, ↓ decreased, → same, NEW (first appearance)

---

## 19. Status Reference — Tournaments & Matches

### Can a Contestant Predict?

| Tournament Status | Match Status (effective) | `visible` | Can Predict? |
|-------------------|--------------------------|-----------|--------------|
| `draft` / `archived` | Any | Any | **No** |
| `published` / `live` | `published` (before window) | `true` | **No** — window closed |
| `published` / `live` | `prediction_open` | `true` | **Yes** |
| `published` / `live` | `prediction_locked` / `live` | `true` | **No** — locked |
| `completed` | Any visible | `true` | **No** — tournament finished |
| Any visible | `completed` / `result_published` | `true` | **No** — match finished |
| Any | Any | `false` | **No** — hidden |

### Contestant Page Behavior Summary

| Page | Key Behavior |
|------|--------------|
| `/dashboard` | Active tournament, upcoming matches (max 5), stats, empty state |
| `/tournaments` | Visible tournaments only; status badges |
| `/matches` | All visible matches; click for detail |
| `/predictions` | Primary prediction workspace; grouped by round |
| `/leaderboard` | Gated by platform setting |

---

## 20. Security Model

### Authentication

- Firebase Authentication handles identity
- Session via `onAuthStateChanged`
- Single logout: `performLogout()`

### Authorization

- RBAC via `permission.service.js`
- Route guards: auth → profile → role (sequential)
- UI nav filtered through `AuthorizationService`

### Fail-Closed Guards

- Profile load failure on protected routes → `/error` (not fail-open)
- Locked users → `/account-locked`
- Missing permissions → toast + event emission

### HTML Safety

- All user-controlled template values: `escapeHtml()` from `utils/html.util.js`
- URL attributes: `escapeUrl()` for safe schemes

### Client Trust Boundaries

| Data | Client May Set | Server Must Enforce |
|------|----------------|---------------------|
| User role | Suggested via domain | Firestore rules |
| User statistics | Never | Firestore rules |
| Tournament status | Never | Firestore rules |
| Prediction scores | Never | Firestore rules |

### Firestore Rules

- Contestants read/write own predictions only (`userId == auth.uid`)
- Locked users denied prediction writes
- Admin operations require admin role in rules
- Deploy `firestore.rules` before business modules

### Protected User Fields

`UserDomain.isProtectedField()` — Firestore rules must mirror.

---

## 21. Coding Standards

### Principles

- **SRP** — one responsibility per module
- **DRY** — shared renderers, actions, event bus
- **Bootstrap First** — utilities before custom CSS
- **ES Modules** — no globals, no `var`

### Logging

Use `Logger` from `utils/logger.util.js` exclusively. No `console.*` in application code.

### JSDoc

All exported functions: `@param`, `@returns`. Modules: `@fileoverview`.

### New Module Template

```
module/
  *.constants.js
  *.events.js
  *.service.js
  *.domain.js
  renderers/*.renderer.js
  *.guard.js
  *.bootstrap.js
```

Services extending Firestore use `BaseFirestoreService`.

### User Renderer Structure

```
users/renderers/
  profile.renderer.js
  complete-profile.renderer.js
  preferences.renderer.js
  shared-form.renderer.js
users/user.renderer.js  ← barrel export
```

### Route Metadata

Define in `config/routes.js`. Filter navigation only through `AuthorizationService`.

---

## 22. Tests

### Runner

```bash
npm test
# node --import ./tests/setup.js --test tests/**/*.test.js
```

### Test Files (29 suites)

| Area | Test Files |
|------|------------|
| Domain | `tournament.domain`, `match.domain`, `prediction.domain`, `scoring.domain`, `leaderboard.domain`, `contestant-match-view.domain`, `prediction-management.domain`, `prediction-history.domain`, `admin-prediction-history.domain`, `user-admin.domain` |
| Services | `contestant-dashboard.service`, `prediction-history.service`, `prediction-management.service`, `tournament-delete.service`, `match-stage.service` |
| Validators | `match.validator`, `tournament.validator`, `team.validator`, `match-stage.validator` |
| UI/Renderers | `prediction-comparison.renderer`, `prediction-display.renderer`, `rank-badge.component`, `admin-list-tabs.component`, `match-prediction-ui.util` |
| Repository | `prediction-history.repository`, `prediction-management.repository` |
| Other | `match-list.controller`, `prediction-statistics`, `match-custom-scoring` |

### Testing Principles

- Domain tests: pure logic, no Firebase mocks required
- Service tests: mock Firestore via setup
- Renderer tests: HTML output assertions
- Focus on real behavior, not trivial assertions

---

## 23. Key Source Files Index

| Topic | File |
|-------|------|
| Routes | `public/js/config/routes.js` |
| Sidebar nav | `public/js/components/sidebar-nav.config.js` |
| Authorization | `public/js/authorization/authorization.service.js` |
| Permissions | `public/js/authorization/permission.service.js` |
| Auth | `public/js/auth/auth.service.js` |
| Logout | `public/js/auth/actions/logout.action.js` |
| Tournament domain | `public/js/domain/tournament.domain.js` |
| Match domain | `public/js/domain/match.domain.js` |
| Scoring | `public/js/scoring/scoring.domain.js` |
| Leaderboard domain | `public/js/domain/leaderboard.domain.js` |
| CSS variables | `public/css/variables.css` |
| App shell HTML | `public/index.html` |
| Layout service | `public/js/services/layout.service.js` |
| Platform settings | `public/js/settings/settings.service.js` |
| Tournament config | `public/js/tournament/configuration/TournamentConfigurationService.js` |
| Firestore schema (rules) | `firestore.rules`, `firestore.indexes.json` |
| Admin dashboard | `public/js/dashboard/AdminDashboardService.js` |
| Contestant dashboard | `public/js/dashboard/ContestantDashboardService.js` |
| Prediction form | `public/js/prediction/prediction-form.component.js` |
| Countdown | `public/js/components/countdown.component.js` |

---

*This document replaces scattered design docs, prompts, and module READMEs as the canonical application reference. When code and this document diverge, **code wins** — update this file accordingly.*
