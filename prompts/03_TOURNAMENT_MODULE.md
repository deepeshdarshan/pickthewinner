# Task: Implement Tournament Management Module

## Objective

Implement the complete Tournament Management module for PickTheWinner.

This module is responsible for creating, configuring, publishing, archiving and managing tournaments.

The Tournament Module acts as the master configuration for all matches, prediction rules, scoring rules and tournament behaviour.

Do NOT implement placeholder code.

Build production-ready, maintainable code following the documented architecture.

---

# Before You Begin

Read ALL project documentation before making any changes.

Mandatory:

- README.md
- docs/product/*
- docs/product/requirements/*
- docs/architecture/*
- docs/engineering/*
- docs/design/*
- .cursor/rules/*
- AGENTS.md (if available)

Treat these documents as the single source of truth.

Do not contradict documented business rules.

---

# Architecture Requirements

Follow

- Feature-based architecture
- ES Modules
- Bootstrap 5
- Vanilla JavaScript
- Firebase Firestore
- Firebase Authentication
- Service Layer
- Renderer Layer
- Validation Layer

Never access Firestore directly from page modules.

---

# Module Responsibilities

The Tournament module is responsible for

- Tournament CRUD
- Tournament configuration
- Tournament lifecycle
- Tournament visibility
- Registration period
- Prediction configuration
- Scoring configuration
- Tournament status
- Tournament settings

---

# Tournament Lifecycle

Support the following states.

DRAFT

Tournament is being configured.

Invisible to contestants.

---

REGISTRATION_OPEN

Contestants may register.

Tournament still hidden.

---

PUBLISHED

Tournament becomes visible.

Matches may be published.

Prediction windows may open.

---

LIVE

Tournament has started.

Predictions follow configured lock rules.

---

COMPLETED

Tournament finished.

Leaderboard becomes final.

Read-only.

---

ARCHIVED

Historical.

Read-only.

Hidden from default lists.

---

# Tournament Fields

Every tournament should support

Tournament Name

Short Name

Description

Sport

Season

Tournament Type

Timezone

Country

Logo

Banner

Status

Visibility

Registration Start

Registration End

Prediction Lock Minutes

Scoring Configuration

Created By

Created At

Updated By

Updated At

Archived

Active

---

# Tournament Visibility

Support

Visible

Hidden

Archived

Only published and visible tournaments appear for contestants.

Administrators can always view all tournaments.

---

# Tournament Type

Support

Knockout

League

Hybrid

The tournament type determines match behaviour.

---

# Match Behaviour Configuration

Every tournament should define

Can matches end in draw?

Boolean

Example

League

true

Knockout

false

This property controls prediction behaviour.

Do NOT hardcode Round of 16.

Use configuration.

---

# Prediction Configuration

Each tournament configures

Prediction Lock Minutes

Default

10 minutes

Configurable

1

5

10

15

20

30

60

Predictions automatically close before kickoff.

---

# Knockout Match Behaviour

If

canEndInDraw == false

Contestants predict

Final Score after Normal Time + Extra Time

NOT penalty shootout score.

---

Prediction Form

Initially

Brazil

[  ]

Spain

[  ]

---

If

Brazil Score != Spain Score

Prediction complete.

No penalty section displayed.

---

If

Brazil Score == Spain Score

Display

☐ Match decided by Penalty Shootout

---

If checked

Display

Penalty Winner

( ) Brazil

( ) Spain

---

Do NOT collect

Penalty shootout goals.

Only collect

Winning Team.

---

Validation

Equal score

+

Penalty unchecked

↓

Validation Error

Cannot save prediction.

---

Equal score

+

Penalty checked

+

Winner selected

↓

Prediction valid.

---

Different scores

↓

Penalty section hidden.

---

Database Fields

Prediction document must contain

homeScore

awayScore

isPenaltyShootout

penaltyWinner

Never store

Penalty shootout scores.

---

# Scoring Configuration

Tournament administrator configures

Correct Winner Points

Exact Score Points

Bonus Points

Tie-breaker Rules

Future scoring extensions.

Hardcoded values are prohibited.

---

# Registration Configuration

Support

Registration Opens

Registration Closes

Contestants cannot register after close.

---

# Leaderboard Configuration

Support

Tournament leaderboard

Historical leaderboard

Ranking strategy

Tie-breaker strategy

Automatic recalculation

---

# Tournament Settings

Support

Timezone

Prediction Lock

Visibility

Registration

Notifications

Theme (future)

Logo

Banner

Sponsor Logo (future)

---

# User Experience

Administrator

Create Tournament

↓

Configure Tournament

↓

Save Draft

↓

Publish Tournament

↓

Create Matches

↓

Publish Matches

↓

Tournament Live

---

Contestant

View Published Tournament

↓

Predict Matches

↓

View Leaderboard

---

# Validation Rules

Tournament Name required

Season required

Timezone required

Prediction Lock required

Scoring Configuration required

Only one tournament may be Active.

Archived tournaments cannot be edited.

Completed tournaments become read-only.

---

# Security

Only Administrators

Create Tournament

Update Tournament

Delete Tournament

Archive Tournament

Publish Tournament

Contestants

Read Published Tournament only.

---

# Firestore

Create

TournamentService

TournamentValidator

TournamentRenderer

TournamentRepository (if repository pattern exists)

TournamentPage

Separate

Business Logic

Rendering

Validation

Firestore Access

---

# Responsive Design

Support

Desktop

Tablet

Mobile

Cards

Tables

Forms

Bootstrap only.

---

# Accessibility

Keyboard navigation

ARIA labels

Visible focus

Screen reader friendly

---

# Deliverables

Implement

✓ Tournament CRUD

✓ Tournament Lifecycle

✓ Visibility Management

✓ Registration Management

✓ Prediction Configuration

✓ Knockout Configuration

✓ Penalty Shootout Workflow Support

✓ Scoring Configuration

✓ Validation

✓ Firestore Integration

✓ Responsive UI

✓ Accessibility

✓ Unit Tests

✓ Documentation Updates

---

# Acceptance Criteria

The implementation is complete only when

✓ Administrators can create tournaments.

✓ Administrators can configure prediction rules.

✓ Administrators can configure scoring.

✓ Administrators can publish tournaments.

✓ Contestants only see published tournaments.

✓ Knockout tournaments require a winner.

✓ Equal predicted scores display the Penalty Shootout workflow.

✓ Penalty shootout scores are never collected.

✓ Penalty winner becomes mandatory when required.

✓ League tournaments allow draw predictions.

✓ Tournament settings drive behaviour instead of hardcoded rules.

Do not implement placeholder functionality.

Build production-ready code that follows the documented architecture.