# 04 - User Management Module

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

# AI Instructions

Before implementing this module:

1. Read README.md
2. Read every document under `/docs`
3. Read every document under `/design`
4. Read `.cursor/rules`
5. Follow the documented architecture.
6. Reuse existing services.
7. Do not duplicate code.
8. Do not modify Authentication module responsibilities.
9. Update TASKS.md after completing this module.
10. Do not implement features outside the scope of this document.

---

# Purpose

This module manages user information inside PickTheWinner.

Authentication has already verified the identity of the user.

This module answers:

> **Who is this user inside PickTheWinner?**

This module owns every Firestore operation related to users.

---

# Scope

This module includes

- User Profile
- Complete Profile
- Firestore User Documents
- User Preferences
- User Status
- Profile Editing
- Last Login Tracking
- User Statistics (basic)
- User Services
- User Validation

This module does NOT include

- Authentication
- Authorization
- Tournament Management
- Match Management
- Predictions
- Leaderboard
- Statistics Engine

---

# Responsibilities

The User Module is responsible for

✓ Creating user profile

✓ Loading user profile

✓ Updating profile

✓ Updating last login

✓ User preferences

✓ User status

✓ Profile validation

✓ Firestore CRUD

---

# Firestore Collection

Collection

```
users
```

Document ID

```
Firebase UID
```

---

# User Document Schema

```javascript
{
    uid: "",

    name: "",

    email: "",

    phone: "",

    photoURL: "",

    role: "CONTESTANT",

    provider: "GOOGLE",

    status: "ACTIVE",

    timezone: "Asia/Kolkata",

    notificationPreferences: {

        email: false,

        browser: true

    },

    statistics: {

        tournamentsPlayed: 0,

        matchesPredicted: 0,

        exactPredictions: 0,

        correctWinnerPredictions: 0,

        totalPoints: 0

    },

    createdAt,

    updatedAt,

    lastLogin
}
```

Use Firestore Server Timestamp.

---

# User Roles

Allowed values only

```
ADMIN

CONTESTANT
```

Never invent additional roles.

---

# User Status

Allowed values

```
ACTIVE

INACTIVE

SUSPENDED
```

---

# First Login Flow

```
Authenticated

↓

Load User Document

↓

Exists?

↓

NO

↓

Complete Profile

↓

Create Firestore User

↓

Dashboard
```

---

# Returning User

```
Authenticated

↓

Load Firestore Profile

↓

Dashboard
```

---

# Complete Profile Page

Shown only once.

Collect

- Phone Number
- Country (optional)
- Timezone
- Notification Preferences

Do NOT ask

- Name
- Email
- Photo

Read these from Firebase Authentication.

---

# Profile Page

Display

- Profile Photo
- Name
- Email
- Phone
- Role
- Provider
- Timezone
- Member Since
- Last Login

Allow editing

- Phone
- Timezone
- Notification Preferences

Read-only

- UID
- Role
- Email
- Provider

---

# User Preferences

Store

```javascript
{
    notificationPreferences: {

        email,

        browser

    },

    timezone
}
```

The application should use these preferences throughout future modules.

---

# Folder Structure

```
js/

users/

    user.service.js

    user.validator.js

    user.renderer.js

    user.constants.js

    profile.page.js

    complete-profile.page.js
```

---

# user.service.js

Responsibilities

- Create User
- Get User
- Update User
- Delete User (soft delete only)
- Update Last Login
- Load Current User

Must never manipulate UI.

---

# user.validator.js

Validate

- Name
- Phone
- Timezone
- Preferences

Return

```javascript
{

    valid,

    errors

}
```

Must never manipulate DOM.

---

# user.renderer.js

Responsible only for rendering

- Profile
- Complete Profile Form
- Empty State
- Loading State

Never access Firestore.

---

# user.constants.js

Store

- Collection Names
- Statuses
- Roles
- Providers
- Routes
- Validation Messages

Never hardcode strings.

---

# Firestore Rules

Contestants

Allowed

Read

Own document

Update

Own profile

Cannot modify

- Role
- Status
- Provider
- UID
- Statistics

Administrators

Full CRUD

---

# User Events

Expose reusable events

```
PROFILE_CREATED

PROFILE_UPDATED

PROFILE_LOADED

PROFILE_DELETED

PREFERENCES_UPDATED
```

Other modules subscribe to these events.

---

# UI Requirements

Follow

```
design/DESIGN_SYSTEM.md
```

Use

- Bootstrap Cards
- Bootstrap Forms
- Bootstrap Validation
- Bootstrap Toast
- Bootstrap Spinner

Dark Theme

Responsive

Accessible

---

# Validation

Phone Number

Required

Minimum 10 digits

Maximum 15 digits

Timezone

Required

Notification Preferences

Optional

---

# Error Handling

Handle

- Firestore Offline
- Permission Denied
- User Not Found
- Duplicate User
- Network Failure

Show friendly messages.

Log technical details.

Never expose Firestore errors.

---

# Loading States

Show loading while

- Creating Profile
- Loading Profile
- Updating Profile

Use reusable loading overlay.

---

# Accessibility

Semantic HTML

Keyboard Navigation

Visible Focus

ARIA Labels

Accessible Forms

---

# Performance

Cache Current User.

Avoid duplicate Firestore reads.

Update only modified fields.

Use merge updates.

Never reload the entire user document unnecessarily.

---

# Security

Never trust client-side validation.

Never allow client to modify

- Role
- Status
- Statistics
- Provider

All sensitive fields protected by Firestore Security Rules.

---

# Deliverables

Implement

✓ User Service

✓ User Validator

✓ User Renderer

✓ User Constants

✓ Complete Profile Page

✓ Profile Page

✓ Firestore CRUD

✓ Profile Update

✓ Preferences

✓ User Events

✓ Loading States

✓ Error Handling

✓ JSDoc Documentation

✓ Responsive Bootstrap UI

---

# Out of Scope

Do not implement

- Authentication
- Authorization
- Tournament Module
- Match Module
- Prediction Module
- Leaderboard
- Statistics Engine
- Settings Module

Those belong to future modules.