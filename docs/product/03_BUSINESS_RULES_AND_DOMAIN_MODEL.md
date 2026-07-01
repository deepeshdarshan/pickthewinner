# Task: Generate Business Rules Document

## Objective

Create a comprehensive Business Rules document for the PickTheWinner application.

This document defines the business behavior of the application.

It specifies the rules that govern tournaments, matches, predictions, scoring, users, permissions, and administration.

This document is the authoritative source for all business logic.

Every implementation must comply with these rules.

This document must NOT contain implementation details.

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

Treat those documents as the single source of truth.

---

# Create

```
docs/product/03_BUSINESS_RULES.md
```

---

# Writing Style

The document should be

- Business-oriented
- Technology independent
- Easy to understand
- Structured
- Unambiguous

Avoid implementation details.

Avoid JavaScript.

Avoid Firebase-specific explanations.

---

# Document Metadata

Include

- Project Name
- Version
- Status
- Author
- Audience
- Related Documents
- Revision History

---

# Purpose

Explain

- Why business rules exist.
- Why every implementation must follow them.
- Relationship with Product Requirements.
- Relationship with Acceptance Criteria.

---

# Domain Model

Define the primary business entities.

Describe

Contestant

Administrator

Tournament

Match

Prediction

Result

Leaderboard

Score

Points

Settings

Notification

Do not describe implementation.

Only business meaning.

---

# User Rules

Document rules governing users.

Examples

Contestants authenticate using Google Sign-In.

Administrators authenticate using Email and Password.

Only administrators may create tournaments.

Suspended users cannot access protected functionality.

Inactive users cannot submit predictions.

Users may update only their own profile.

Administrators may manage all users.

---

# Tournament Rules

Document

Tournament lifecycle.

Examples

Tournament may exist in

Draft

Registration Open

Published

Live

Completed

Archived

Only one tournament may be marked Active.

Hidden tournaments are not visible to contestants.

Archived tournaments become read-only.

Completed tournaments cannot accept predictions.

Deleting tournaments should not remove historical prediction data.

---

# Match Rules

Document

Match lifecycle.

Examples

Scheduled

Prediction Open

Prediction Locked

Live

Completed

Published

Cancelled

Only published matches are visible.

Hidden matches cannot be predicted.

Completed matches become read-only.

Match kickoff time determines prediction lock.

---

# Prediction Rules

Document

Contestants may submit only one prediction per match.

Predictions may be modified only before lock.

Predictions automatically lock configurable minutes before kickoff.

Lock period is configured at tournament level.

Prediction consists of

Winning Team

Final Match Score

Penalty shootout score is NOT predicted.

Contestant predicts only

Which team eventually wins.

If the match goes to penalties, the contestant still predicts only the winner.

Penalty shootout scores are never entered.

---

# Prediction Lock Rules

Document

Lock window

Timezone behavior

All application times use IST (`Asia/Kolkata`, GMT+05:30). Users cannot select a different timezone.

Automatic locking

Manual override

Administrator permissions

Examples

Prediction closes

10 minutes before kickoff.

Time is based on IST (`Asia/Kolkata`, GMT+05:30).

Administrators may manually reopen prediction windows if required.

Manual reopen actions should be audited.

---

# Result Rules

Document

Only administrators publish results.

Results become immutable after publication unless explicitly corrected.

Corrections should be logged.

Publishing results automatically triggers score calculation.

---

# Scoring Rules

Document

Scoring model.

Include

Winner prediction

Exact score

Bonus points

Tie-breakers

Tournament-specific configuration

Manual score adjustments

Automatic recalculation

Document configurable scoring.

Do not hardcode point values.

---

# Leaderboard Rules

Document

Leaderboard updates automatically.

Leaderboard displays

Rank

Contestant

Points

Prediction Accuracy

Leaderboard supports ties.

Tie-breakers follow tournament configuration.

Hidden contestants do not appear.

Inactive contestants remain in historical leaderboards.

---

# Administration Rules

Only administrators may

Create tournaments

Modify tournaments

Delete tournaments

Create matches

Modify matches

Publish matches

Publish results

Configure scoring

Manage contestants

Manage settings

View all predictions

Contestants cannot perform administrative operations.

---

# Visibility Rules

Document

Tournament visibility.

Match visibility.

Leaderboard visibility.

Profile visibility.

Prediction visibility.

Hidden data must never be visible to unauthorized users.

---

# Profile Rules

Document

Editable fields

Read-only fields

Profile completion

First login

Last login tracking

Profile deletion

Account suspension

---

# Notification Rules

Document

Notification preferences.

Examples

Prediction reminder

Result published

Tournament published

Leaderboard updated

Future support

Push notifications

Email notifications

---

# Settings Rules

Document

Theme

Timezone

Read-only IST (`Asia/Kolkata`, GMT+05:30)

Application version

Default values

---

# Security Rules

Document business security.

Examples

Users access only their own profile.

Contestants access only their own predictions.

Administrators access everything.

Role determines permissions.

UI restrictions do not replace security.

---

# Audit Rules

Document actions that should be audited.

Examples

Tournament created

Tournament deleted

Prediction reopened

Result corrected

Contestant suspended

Administrator login

Future support only if not implemented.

---

# Time Rules

Document

Timezone — IST only (`Asia/Kolkata`, GMT+05:30)

Kickoff

Prediction lock

Result publication

Daylight Saving considerations

Time calculations

---

# Error Handling Rules

Document

Unauthorized

Invalid prediction

Duplicate prediction

Prediction after lock

Tournament unavailable

Hidden match

Suspended account

Network failure

Expected business behavior.

---

# Reporting Rules

Document

Leaderboard

Prediction statistics

Tournament statistics

Contestant statistics

Administrator reports

---

# Business Constraints

Document

One prediction per contestant per match.

One active tournament.

Only published tournaments visible.

Only published matches visible.

No prediction after lock.

No score modification after publication without administrator correction.

---

# Future Business Rules

Document anticipated future rules.

Examples

Multiple sports

Multiple active tournaments

Team competitions

Prediction templates

Private tournaments

Invitation-only tournaments

Season rankings

---

# Acceptance Rules

Summarize

Critical rules that every implementation must enforce.

These rules become mandatory acceptance criteria.

---

## Knockout Match Prediction Rules

BR-041

Contestants predict the final score after Normal Time plus Extra Time.

Penalty shootout goals are excluded.

---

BR-042

If the predicted scores are unequal,

the application shall not display Penalty Winner selection.

---

BR-043

If the predicted scores are equal,

the application shall display

☐ Match decided by Penalty Shootout

---

BR-044

If the contestant selects the checkbox,

Penalty Winner selection becomes mandatory.

---

BR-045

Penalty shootout scores shall never be stored.

Only the winning team shall be stored.

---

BR-046

A tied score without selecting a Penalty Winner is invalid for knockout matches.

The prediction cannot be submitted.

---

# Related Documents

Cross-reference

Project Overview

Product Requirements

User Journeys

Acceptance Criteria

System Architecture

Database Schema

Security Model

---

# Deliverables

Generate a complete Business Rules document.

The document should include

✓ Domain Model

✓ User Rules

✓ Tournament Rules

✓ Match Rules

✓ Prediction Rules

✓ Scoring Rules

✓ Leaderboard Rules

✓ Security Rules

✓ Visibility Rules

✓ Time Rules

✓ Audit Rules

✓ Future Rules

Generate documentation only.

Do not generate implementation code.