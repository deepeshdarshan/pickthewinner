# 03 - Authentication Module

# AI Instructions

Before implementing this module:

1. Read README.md.
2. Read every document under `/docs`.
3. Read every document under `/design`.
4. Read every document under `/agents`.
5. Follow the documented architecture.
6. Reuse existing components and services.
7. Do not duplicate functionality.
8. If this module depends on a future module, create extension points instead of temporary implementations.
9. Update `TASKS.md` after completing the work.
10. Do not implement features outside the scope of this document.

**Module Version:** 1.0

**Status:** Approved

**Priority:** High

---

# Purpose

This document defines the authentication architecture for the PickTheWinner application.

Authentication is responsible only for verifying the identity of the user.

Authentication must never contain business logic, Firestore CRUD operations, profile management, tournament logic, or prediction logic.

Authentication answers only one question:

> **Who is the current user?**

---

# Scope

This module includes:

- Firebase Authentication
- Google Sign-In
- Email & Password Authentication
- Session Management
- Authentication State Management
- Login
- Logout
- Route Protection
- Authentication Events

This module does NOT include:

- User Profile Creation
- Firestore User Documents
- Tournament Management
- Match Management
- Predictions
- Leaderboard
- Authorization Rules

Those belong to separate modules.

---

# Authentication Providers

The application supports exactly two authentication providers.

## Contestant Authentication

Provider

Google Authentication

Authentication Method

Google Sign-In (Popup)

Requirements

- No registration page
- No password creation
- No forgot password
- No email verification

Contestants always authenticate using Google.

---

## Administrator Authentication

Provider

Firebase Email & Password

Requirements

- Admin accounts are created manually.
- There is no public admin registration.
- Only administrators can use Email/Password authentication.
- Administrators must never authenticate using Google Sign-In.

---

# Authentication Flow

## Contestant

```
Application

↓

Continue with Google

↓

Firebase Google Authentication

↓

Authentication Successful

↓

Application Startup Module
```

Authentication ends here.

The User Module decides what happens next.

---

## Administrator

```
Admin Login

↓

Email

↓

Password

↓

Firebase Authentication

↓

Authentication Successful

↓

Application Startup Module
```

---

# Responsibilities

Authentication is responsible for

- Login
- Logout
- Restore Session
- Detect Authentication State
- Current Firebase User
- Token Refresh
- Authentication Events

Authentication is NOT responsible for

- Loading Firestore Profile
- Creating User Documents
- Role Management
- Tournament Selection

---

# Folder Structure

```
js/

auth/

    auth.service.js

    session.service.js

    auth.guard.js

    authentication.constants.js

    authentication.events.js
```

---

# auth.service.js

Responsibilities

- Google Login
- Admin Login
- Logout
- Current User
- Authentication State Listener

Must never

- Read Firestore
- Write Firestore
- Manipulate UI

---

# session.service.js

Responsibilities

- Restore existing session
- Monitor authentication changes
- Clear session
- Session expiration handling

Must never

- Render HTML
- Read Firestore

---

# auth.guard.js

Responsibilities

Protect routes.

Example

Guest

↓

Login Page

Authenticated

↓

Dashboard

Unauthorized

↓

Access Denied

The guard must not contain business logic.

---

# Authentication Events

The module should expose reusable events.

Examples

```
LOGIN_SUCCESS

LOGIN_FAILED

LOGOUT

SESSION_RESTORED

SESSION_EXPIRED
```

Other modules subscribe to these events.

Authentication never calls business modules directly.

---

# Firebase Configuration

Firebase Authentication should be initialized exactly once.

Create

```
firebase/firebase.js
```

Export

- app
- auth
- firestore
- storage

Never initialize Firebase elsewhere.

---

# Session Behaviour

The application should automatically restore sessions.

Example

```
Browser Refresh

↓

Firebase

↓

Existing Session?

↓

Yes

↓

Continue

↓

No

↓

Login
```

Users should not need to login again after refreshing.

---

# Login Screen

Contestant Login

Components

- Application Logo
- Continue with Google
- About PickTheWinner
- Admin Login Link

Administrator Login

Components

- Email
- Password
- Login Button
- Back to Contestant Login

---

# Route Protection

Guests

Allowed

/

Authenticated Users

Allowed

/dashboard

/profile

/leaderboard

/settings

Administrators

Allowed

/admin

Application Startup will later determine role access.

Authentication only verifies whether the user is logged in.

---

# Error Handling

Handle

- Invalid Credentials
- Google Authentication Cancelled
- Popup Closed
- Network Failure
- Authentication Disabled
- Too Many Requests

Display friendly messages.

Log technical details using Logger.

Never expose Firebase errors directly.

---

# Loading States

Show loading while

- Google popup
- Email login
- Session restore
- Logout

Loading UI must use shared components.

---

# Constants

Create

```
authentication.constants.js
```

Store

Authentication Providers

Routes

Messages

Firebase Error Codes

Never hardcode strings.

---

# Security

Never trust UI.

Authentication verifies identity only.

Authorization is handled by another module.

Never expose sensitive tokens.

Never store Firebase ID tokens manually.

Never store passwords.

Use Firebase session persistence.

---

# Accessibility

Keyboard accessible

Visible focus states

ARIA labels

Screen-reader friendly buttons

Semantic HTML

---

# Deliverables

Cursor should implement

✓ Firebase Authentication

✓ Google Authentication

✓ Email Authentication

✓ Authentication Service

✓ Session Service

✓ Authentication Guard

✓ Authentication Events

✓ Login Pages

✓ Logout

✓ Session Restore

✓ Error Handling

✓ Loading States

✓ JSDoc Documentation

✓ Responsive Bootstrap UI

---

# Out of Scope

Do not implement

- Firestore User Documents
- User Profiles
- Tournament Module
- Match Module
- Prediction Module
- Leaderboard
- Statistics
- Settings

Those belong to future modules.