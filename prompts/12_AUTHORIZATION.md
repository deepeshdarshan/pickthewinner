# 05 - Authorization Module

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
5. Read Authentication Module
6. Read User Management Module
7. Follow the documented architecture.
8. Do not duplicate authentication logic.
9. Update TASKS.md after completing this module.
10. Do not implement features outside the scope of this document.

---

# Purpose

The Authorization Module determines what an authenticated user is allowed to access and perform within the PickTheWinner application.

Authentication verifies identity.

User Management loads user information.

Authorization determines permissions.

Authorization must NEVER authenticate users.

Authorization must NEVER manage user profiles.

---

# Scope

This module includes

- Role Based Access Control (RBAC)
- Permission Checking
- Route Authorization
- Feature Authorization
- UI Authorization
- Permission Helpers
- Role Guards
- Permission Constants

This module does NOT include

- Login
- Logout
- Firebase Authentication
- Firestore User CRUD
- Tournament Logic
- Prediction Logic
- Leaderboard Logic

---

# Authorization Model

The application uses Role Based Access Control (RBAC).

Every authenticated user belongs to exactly one role.

Allowed Roles

ADMIN

CONTESTANT

No additional roles may be introduced without updating this specification.

---

# Permission Philosophy

Always validate permissions in two places.

1. UI
2. Firestore Security Rules

UI validation improves user experience.

Firestore Rules enforce security.

Never rely solely on UI visibility.

---

# Folder Structure

```
js/

authorization/

    authorization.service.js

    permission.service.js

    role.guard.js

    permission.constants.js

    permission.helper.js
```

---

# Roles

ADMIN

Full application access.

Can

- Manage tournaments
- Manage matches
- Publish results
- Manage contestants
- View all predictions
- Configure settings
- View audit logs (future)

Cannot

- Bypass Firestore Security Rules

---

CONTESTANT

Can

- View active tournaments
- View visible matches
- Submit predictions
- Edit predictions before lock
- View own profile
- View leaderboard
- View own statistics

Cannot

- Access Admin pages
- Modify tournaments
- Modify matches
- Modify results
- View other contestant profiles
- View hidden tournaments

---

# Permission Constants

Create

permission.constants.js

Example

```javascript
export const Permissions = {

    VIEW_DASHBOARD: "VIEW_DASHBOARD",

    VIEW_PROFILE: "VIEW_PROFILE",

    EDIT_PROFILE: "EDIT_PROFILE",

    VIEW_LEADERBOARD: "VIEW_LEADERBOARD",

    CREATE_TOURNAMENT: "CREATE_TOURNAMENT",

    UPDATE_TOURNAMENT: "UPDATE_TOURNAMENT",

    DELETE_TOURNAMENT: "DELETE_TOURNAMENT",

    CREATE_MATCH: "CREATE_MATCH",

    UPDATE_MATCH: "UPDATE_MATCH",

    DELETE_MATCH: "DELETE_MATCH",

    SUBMIT_PREDICTION: "SUBMIT_PREDICTION",

    EDIT_PREDICTION: "EDIT_PREDICTION",

    VIEW_ALL_PREDICTIONS: "VIEW_ALL_PREDICTIONS"

};
```

Never hardcode permission strings.

---

# authorization.service.js

Responsibilities

Determine

Current User Role

Current Permissions

Can Access Route

Can Access Feature

Can Execute Action

Must never

Access Firestore directly

Render UI

Authenticate users

---

# permission.service.js

Responsibilities

Map

Role

↓

Permissions

All permission logic belongs here.

---

# permission.helper.js

Reusable helper functions.

Examples

```javascript
canViewLeaderboard();

canEditTournament();

canSubmitPrediction();

canViewAdminDashboard();

canManageContestants();
```

Keep helpers simple and reusable.

---

# role.guard.js

Protect routes.

Examples

Guest

↓

Login

Contestant

↓

Dashboard

Admin

↓

Admin Dashboard

Unauthorized

↓

403 Access Denied

---

# Route Authorization

Guest

Allowed

/

Contestant

Allowed

/dashboard

/profile

/leaderboard

/settings

/predictions

Admin

Allowed

/admin

/admin/tournaments

/admin/matches

/admin/results

/admin/users

/admin/settings

Unknown Route

↓

404

Unauthorized Route

↓

403

---

# UI Authorization

Hide actions the user cannot perform.

Examples

Contestant

Must never see

Delete Tournament

Create Match

Publish Result

Manage Users

Admin

Can see all management actions.

Remember

Hidden buttons are NOT security.

Firestore Rules provide actual enforcement.

---

# Feature Authorization

Every feature must check permission before execution.

Example

```javascript
if (!AuthorizationService.canCreateTournament()) {

    return;

}
```

Never assume UI already validated permissions.

---

# Firestore Security

Authorization must align with Firestore Rules.

Examples

Contestants

Read

Visible Tournaments

Own Predictions

Own Profile

Write

Own Predictions

Own Profile

Admins

Full CRUD

Never allow Authorization logic to bypass Firestore Rules.

---

# Permission Events

Expose events

PERMISSION_CHANGED

ROLE_CHANGED

ACCESS_DENIED

Modules may subscribe when necessary.

---

# Error Handling

Unauthorized

↓

403 Page

Forbidden

↓

Access Denied Component

Permission Failure

↓

Toast Notification

Log technical details.

Never expose sensitive information.

---

# Loading States

Authorization checks should be asynchronous where required.

Display loading indicator while permissions are being resolved.

Avoid flashing unauthorized content.

---

# Accessibility

Unauthorized pages

Accessible

Keyboard Navigation

Semantic HTML

Visible Focus

---

# Performance

Cache permission calculations.

Avoid recalculating permissions repeatedly.

Permission evaluation should be lightweight.

---

# Security Principles

Never trust

Hidden Buttons

Hidden Menus

Disabled Controls

Always validate

Server (Firestore Rules)

Never expose admin functionality through client-side routing alone.

---

# Future Extensibility

The authorization model should support future roles.

Examples

SUPER_ADMIN

MODERATOR

VIEWER

without requiring major architectural changes.

Do not implement these roles now.

Only prepare extensibility.

---

# Deliverables

Implement

✓ authorization.service.js

✓ permission.service.js

✓ permission.helper.js

✓ role.guard.js

✓ permission.constants.js

✓ Route Authorization

✓ Feature Authorization

✓ Permission Helpers

✓ Access Denied Page

✓ 403 Page

✓ Loading States

✓ Error Handling

✓ JSDoc Documentation

✓ Responsive UI Integration

---

# Out of Scope

Do not implement

- Authentication
- User Profile Management
- Tournament Module
- Match Module
- Prediction Engine
- Leaderboard
- Statistics
- Settings

This module only determines what authenticated users are permitted to access and perform.