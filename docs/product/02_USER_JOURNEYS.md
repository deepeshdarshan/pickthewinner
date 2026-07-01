# Task: Generate User Journeys Document

## Objective

Create a comprehensive User Journeys document for the PickTheWinner application.

This document describes how users interact with the application from start to finish.

It should describe the expected user experience, business flow, decision points, alternate paths, and recovery scenarios.

This document is intended for:

- Product Owners
- UX Designers
- Developers
- QA Engineers

Do not generate source code.

Generate documentation only.

---

# Before You Begin

Read

- README.md
- docs/*
- architecture/*
- engineering/*
- design/*
- prompts/*
- .cursor/rules/*

Treat these documents as the single source of truth.

---

# Create

```
docs/product/02_USER_JOURNEYS.md
```

---

# Writing Style

The document should be

- Professional
- User-focused
- Business-oriented
- Easy to understand
- Rich with flow diagrams
- Free of implementation details

Avoid JavaScript, Firebase or technical implementation unless required for explaining behavior.

---

# Document Metadata

Include

- Project Name
- Version
- Status
- Author
- Audience
- Last Updated
- Related Documents
- Revision History

---

# Purpose

Explain

- Why this document exists
- How it differs from Product Requirements
- How it should be used by developers and QA

---

# User Personas

Describe

## Contestant

Goals

Responsibilities

Typical behavior

Permissions

Restrictions

---

## Administrator

Goals

Responsibilities

Permissions

Restrictions

---

# Application Entry

Document

```
User opens application

↓

Landing Page

↓

Choose

Contestant Login

OR

Administrator Login
```

Describe expected experience.

---

# Journey 1 — Contestant First Login

Describe

```
Landing Page

↓

Continue with Google

↓

Google Authentication

↓

Authentication Successful

↓

User Exists?

↓

No

↓

Complete Profile

↓

Create User Profile

↓

Dashboard
```

Describe

- Expected screens
- User decisions
- Validation
- Error scenarios
- Success outcome

---

# Journey 2 — Returning Contestant

Describe

```
Landing Page

↓

Google Login

↓

Authentication

↓

Existing Profile

↓

Dashboard
```

No Complete Profile page.

---

# Journey 3 — Contestant Dashboard

Describe

Dashboard experience.

Include

Welcome message

Current tournament

Next matches

Leaderboard summary

Prediction summary

Empty state

No active tournament scenario.

---

# Journey 4 — Submit Prediction

Describe

```
Dashboard

↓

Open Match

↓

Choose Winner

↓

Enter Score

↓

Save Prediction

↓

Confirmation
```

Include

Editable prediction

Locked prediction

Validation

Confirmation

Error handling

---

# Journey 5 — Edit Prediction

Describe

Allowed

↓

Prediction window open

Not allowed

↓

Prediction locked

Display appropriate message.

---

# Journey 6 — View Leaderboard

Describe

Contestant

↓

Leaderboard

↓

Ranking

↓

Points

↓

Prediction Accuracy

Empty state if no tournaments.

---

# Journey 7 — View Profile

Describe

Display

Photo

Name

Email

Phone

Timezone (read-only IST, GMT+05:30)

Notification Preferences

Editable fields

Phone

Notification Preferences

Read-only fields

---

# Journey 8 — Update Profile

Describe

Validation

Successful update

Failure

Offline

Recovery

---

# Journey 9 — Logout

Describe

```
Dashboard

↓

Logout

↓

Session Cleared

↓

Landing Page
```

---

# Journey 10 — Session Restore

Describe

```
Refresh Browser

↓

Restore Session

↓

Restore Profile

↓

Restore Previous Page
```

---

# Journey 11 — Administrator Login

Describe

```
Landing Page

↓

Admin Login

↓

Email

↓

Password

↓

Authentication

↓

Admin Dashboard
```

Include

Invalid credentials

Locked account

Permission denied

---

# Journey 12 — Tournament Management

Describe

Administrator

↓

Create Tournament

↓

Configure Tournament

↓

Save

↓

Publish

Include

Draft

Published

Archived

Hidden

---

# Journey 13 — Match Management

Describe

Administrator

↓

Create Match

↓

Assign Teams

↓

Kickoff Time

↓

Publish

↓

Prediction Window Opens

↓

Prediction Window Closes

---

# Journey 14 — Publish Results

Describe

Administrator

↓

Enter Result

↓

Publish

↓

Scoring Engine

↓

Leaderboard Updated

---

# Journey 15 — Contestant Access Denied

Describe

Contestant

↓

Attempts Admin Page

↓

403 Access Denied

↓

Return Home

---

# Journey 16 — Guest Access

Describe

Guest

↓

Protected Page

↓

Redirect Login

---

# Journey 17 — Network Failure

Describe

Offline

Authentication failure

Firestore unavailable

Save prediction failure

Recovery behavior

Retry behavior

---

# Journey 18 — Empty States

Describe

No tournaments

No matches

No predictions

No leaderboard

No notifications

No profile photo

Expected messaging.

---

# Journey 19 — Error States

Describe

404

403

Authentication failure

Validation failure

Unexpected errors

Expected recovery.

---

# Journey 20 — Mobile Experience

Describe

Navigation

Bottom navigation

Touch interactions

Responsive layouts

Portrait mode

Landscape mode

---

# Decision Points

Document every important decision.

Examples

Google Login Success?

↓

Profile Exists?

↓

Tournament Published?

↓

Prediction Window Open?

↓

User Authorized?

↓

Match Completed?

↓

Leaderboard Available?

---

# Recovery Scenarios

Document

Session expired

Network restored

Retry login

Retry save

Resume previous page

---

# UX Guidelines

Document

Loading indicators

Progress feedback

Toast messages

Confirmation dialogs

Accessibility

Animations

Empty states

---

# Acceptance Criteria

For every journey provide

Expected Result

Success Criteria

Failure Criteria

Recovery

---

# Related Documents

Cross-reference

Project Overview

Product Requirements

Business Rules

Acceptance Criteria

System Architecture

UI Guidelines

Design System

---

# Deliverables

Generate a professional User Journeys document.

The document should include

✓ Contestant journeys

✓ Administrator journeys

✓ Happy paths

✓ Alternate paths

✓ Error paths

✓ Recovery paths

✓ Decision trees

✓ Empty states

✓ Mobile journeys

✓ Acceptance criteria

Do not generate implementation code.

Generate documentation only.