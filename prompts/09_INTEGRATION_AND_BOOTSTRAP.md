# 06 - Integration & Application Bootstrap

**Module Version:** 1.0

**Status:** Approved

**Priority:** Critical

---

# AI Instructions

Before implementing this module:

1. Read README.md.
2. Read every document under `/docs`.
3. Read every document under `/design`.
4. Read every document under `/prompts`.
5. Read every file under `.cursor/rules`.
6. Review all existing modules before making changes.
7. Reuse existing services instead of creating new ones.
8. Do not duplicate functionality.
9. Replace placeholders rather than introducing parallel implementations.
10. Update TASKS.md after completing this module.

---

# Existing Implementation Review

Before writing any code:

1. Review the current implementation.
2. Compare it against this specification.
3. Identify every placeholder, stub and disconnected module.
4. Produce a short implementation plan.
5. Then implement the changes incrementally.
6. Prefer connecting existing modules over creating new ones.
7. Delete obsolete placeholder implementations once replaced.
8. Ensure all acceptance criteria pass before considering the module complete.

---

# Purpose

This module integrates every completed module into a fully functional application.

The following modules already exist:

- Project Foundation
- Application Shell
- Authentication
- User Management
- Authorization

This module MUST NOT redesign those modules.

Its responsibility is to connect them together into one coherent application.

---

# Existing Gap Analysis

The previous implementation produced a modular architecture but left several modules disconnected.

Treat the previous implementation as correct.

Treat the existing gap analysis as the implementation backlog.

Your objective is to:

- connect existing modules
- replace placeholders
- wire services together
- complete the authentication journey

Do NOT create duplicate implementations.

Do NOT redesign the architecture.

---

# Objective

After this module is complete, the application must behave like a finished product from a user's perspective.

Business features such as tournaments and predictions are still out of scope.

However, authentication, profile management, authorization, routing and navigation must all work together.

---

# Scope

Implement

- Application bootstrap
- Startup sequence
- Session restoration
- Router integration
- Guard integration
- Navigation integration
- User context
- Logout
- Dashboard initialization
- Empty states
- Placeholder replacement

Do NOT implement

- Tournament module
- Match module
- Prediction module
- Leaderboard logic
- Scoring engine

---

# Startup Flow

Implement the following startup sequence.

```
Application Starts

↓

Load Configuration

↓

Initialize Logger

↓

Initialize Firebase

↓

Initialize Authentication

↓

Restore Existing Session

↓

Authenticated?

↓

No

↓

Navigate to Login

↓

Yes

↓

Load Firestore User

↓

Load Permissions

↓

Initialize User Context

↓

Initialize Navigation

↓

Initialize Router

↓

Render Dashboard
```

The startup sequence should exist in one place only.

---

# Application Bootstrap

Create or complete

```
app.js

app.startup.js

app.context.js

app.events.js

app.bootstrap.js
```

The bootstrap module is responsible for orchestrating the application.

Business modules must never perform application startup.

---

# Firebase Initialization

Firebase must be initialized exactly once.

Every module must import Firebase from the shared module.

Remove duplicate initialization.

---

# Authentication Integration

Replace every authentication placeholder.

Complete

- Google Login
- Email Login
- Logout
- Session Restore
- Authentication State Listener

Remove all "Not Implemented" placeholders.

Authentication must become production ready.

---

# Session Management

Implement

```
Browser Refresh

↓

Restore Firebase Session

↓

Restore User Context

↓

Restore Navigation

↓

Open Previous Route
```

Refreshing the browser must never force login again.

---

# User Integration

After authentication succeeds

Load User Profile.

If profile does not exist

↓

Complete Profile

↓

Create Firestore User

↓

Dashboard

Returning users must never see Complete Profile.

---

# Router Integration

Complete routing.

Register routes

```
/

/login

/dashboard

/profile

/settings

/leaderboard

/admin

/complete-profile

/403

/404
```

Unknown routes

↓

404

Unauthorized routes

↓

403

---

# Guard Pipeline

Implement route guards.

Every route must execute

```
Authentication Guard

↓

User Guard

↓

Authorization Guard

↓

Render Page
```

Never bypass guards.

---

# Route Metadata

Standardize route metadata.

Use

```javascript
{
    requiresAuth: true,

    guestOnly: false,

    requiredRole: null
}
```

Remove inconsistent properties

- protected
- adminOnly

Use one consistent structure.

---

# Navigation

Navigation must be generated dynamically.

Guest

Show

- Login

Contestant

Show

- Dashboard
- Leaderboard
- Profile
- Settings

Admin

Show

- Dashboard
- Tournament Management
- Match Management
- Users
- Settings

Hide unauthorized items.

Never hardcode navigation.

---

# Navbar

Replace placeholder dropdown.

Display

- User Avatar
- Name
- Email
- Logout

Logout must destroy session.

---

# Dashboard

Replace placeholder.

Contestant

Display

```
Welcome {Name}

There are currently no active tournaments.

Once a tournament is published,
you can begin submitting predictions.
```

Administrator

Display

```
Welcome Administrator

There are currently no tournaments.

Create your first tournament.
```

---

# Leaderboard

No tournament

↓

Display Empty State

Do not show placeholder text.

---

# Profile

Use the implemented User Management pages.

Do not use placeholder profile page.

Allow editing

- Phone

- Timezone

- Notification Preferences

---

# Settings

Replace placeholder.

Display

Theme

Timezone

Notification Preferences

Application Version

Logout

Other settings remain disabled with "Coming Soon" labels.

---

# Empty States

Replace every

```
Coming Soon
```

with meaningful empty states.

Examples

No tournaments

No predictions

No leaderboard

No notifications

---

# Authorization Integration

Connect Authorization Service with Router.

Unauthorized users

↓

403

Contestants

↓

Cannot access Admin pages

Admins

↓

Can access all pages

---

# User Context

Create a centralized application context.

Store

```
Current User

Current Profile

Current Role

Permissions

Theme

Timezone

Application Version
```

Every module must use AppContext.

Never query Firestore repeatedly.

---

# Event Bus

Complete application events.

Examples

APPLICATION_STARTED

LOGIN_SUCCESS

LOGIN_FAILED

SESSION_RESTORED

PROFILE_LOADED

PROFILE_UPDATED

ROLE_CHANGED

LOGOUT

NETWORK_ONLINE

NETWORK_OFFLINE

Modules should communicate through events.

Avoid tight coupling.

---

# Loading Infrastructure

Implement reusable loading behavior.

During

- Login
- Logout
- Session Restore
- Profile Load
- Navigation

Display loading overlay.

Remove loading after initialization completes.

---

# Error Handling

Implement global error handling.

Handle

- Authentication failure

- Firestore unavailable

- Network offline

- Unauthorized

- Page not found

Never expose Firebase error messages directly.

Use friendly messages.

Log technical details through Logger.

---

# Logging

Replace console.log.

Use Logger.

Levels

INFO

WARN

ERROR

DEBUG

---

# Accessibility

Verify

Keyboard Navigation

Focus States

ARIA Labels

Accessible Forms

Accessible Navigation

---

# Performance

Avoid duplicate Firestore reads.

Reuse User Context.

Cache profile where appropriate.

Do not reload user document on every page navigation.

---

# Acceptance Criteria

The module is complete ONLY IF all the following scenarios pass.

## Contestant

```
Open /

↓

Google Login

↓

Complete Profile

↓

Dashboard

↓

Refresh

↓

Still Logged In

↓

Logout

↓

Login Page
```

---

## Returning User

```
Google Login

↓

Dashboard

(No Complete Profile)
```

---

## Administrator

```
/admin

↓

Email Login

↓

Admin Dashboard
```

---

## Contestant Visiting Admin

```
/admin

↓

403 Access Denied
```

---

## Guest Visiting Dashboard

```
/dashboard

↓

Redirect Login
```

---

## Logout

```
Dashboard

↓

Logout

↓

Login
```

---

## Profile

```
Update Phone

↓

Firestore Updated
```

---

## Navbar

Contestant

No Admin Menu

Administrator

Admin Menu Visible

---

## Browser Refresh

```
Dashboard

↓

Refresh

↓

Dashboard
```

No login required.

---

# Deliverables

Implement

✓ Application Bootstrap

✓ Startup Sequence

✓ Firebase Initialization

✓ Authentication Integration

✓ User Integration

✓ Authorization Integration

✓ Router Integration

✓ Guard Pipeline

✓ Navigation

✓ Session Restore

✓ Logout

✓ User Context

✓ Event Bus

✓ Dashboard

✓ Empty States

✓ Global Error Handling

✓ Logger Integration

✓ Responsive Bootstrap UI

✓ JSDoc Documentation

---

# Out of Scope

Do not implement

- Tournament Management
- Match Management
- Prediction Engine
- Results Processing
- Scoring Engine
- Leaderboards
- Notifications
- Statistics

This module exists solely to integrate the completed foundation into a fully working application.

---

# Definition of Done

This module is considered complete only when the application behaves as a production-ready platform from the user's perspective.

The application must provide a seamless authentication, profile, authorization and navigation experience.

All placeholder implementations must be replaced with working integrations.

No duplicate services or parallel implementations should exist.

The architecture must remain modular, reusable and maintainable.