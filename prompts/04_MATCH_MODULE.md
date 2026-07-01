# Task: Implement Match Management Module

## Objective

Implement the complete Match Management module for PickTheWinner.

This module is responsible for creating, managing, publishing and completing matches within a tournament.

The Match Module acts as the central source of truth for every match.

It controls

- Match Schedule
- Match Visibility
- Match Status
- Prediction Availability
- Match Result
- Winner Resolution
- Automatic Prediction Locking

The Match Module MUST NOT implement prediction scoring logic.

It should expose the required information for the Prediction Engine.

---

# Before You Begin

Read ALL project documentation before making changes.

Mandatory

- README.md
- docs/product/*
- docs/product/requirements/*
- docs/architecture/*
- docs/engineering/*
- docs/design/*
- .cursor/rules/*
- AGENTS.md (if available)

Treat these documents as the single source of truth.

Do not violate documented business rules.

---

# Technology

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore

---

# Architecture

Follow

- Feature-based architecture
- Service Layer
- Validation Layer
- Renderer Layer
- Component-based UI

Never access Firestore directly from pages.

---

# Module Responsibilities

The Match Module manages

- Match CRUD
- Match Schedule
- Match Visibility
- Match Status
- Kickoff Time
- Teams
- Venue
- Result Publication
- Winner Resolution
- Prediction Availability

---

# Match Lifecycle

Support the following lifecycle.

DRAFT

↓

SCHEDULED

↓

PUBLISHED

↓

PREDICTION_OPEN

↓

PREDICTION_LOCKED

↓

LIVE

↓

COMPLETED

↓

RESULT_PUBLISHED

↓

ARCHIVED

Each state must have validation rules.

---

# Match Fields

Every match shall contain

Match ID

Tournament ID

Round

Match Number

Home Team

Away Team

Venue

City

Country

Kickoff Date

Kickoff Time

Timezone

Status

Visible

Published

Prediction Opens

Prediction Closes

Can End In Draw

Requires Winner

Winner Resolution

Result Published

Created By

Created At

Updated By

Updated At

Archive Flag

---

# Supported Tournament Rounds

Support

Group Stage

Round of 32

Round of 16

Quarter Final

Semi Final

Third Place

Final

Future rounds must be configurable.

Never hardcode round behaviour.

---

# Match Visibility

Administrator may

Publish Match

Hide Match

Archive Match

Delete Match

Contestants only see

Published

Visible

Matches.

---

# Kickoff Time

Store kickoff in UTC.

Display using

Tournament Timezone

Contestant Local Time (future)

Automatically calculate

Prediction Open

Prediction Close

based on Tournament configuration.

---

# Automatic Prediction Lock

The prediction window closes automatically

X minutes before kickoff.

The lock duration is inherited from Tournament configuration.

Administrator may manually

Open

Close

Reopen

Prediction windows.

Every manual action must be audited.

---

# Match Behaviour

Every match shall inherit

Can End In Draw

Requires Winner

Winner Resolution

from Tournament configuration.

The Match module must not hardcode football logic.

---

# Winner Resolution

Support

NORMAL_TIME

EXTRA_TIME

PENALTIES

Future values

WALKOVER

ABANDONED

CANCELLED

POSTPONED

---

# Match Result

Administrator enters

Home Score

Away Score

Winner Resolution

Winning Team

Result Notes

Published

Published Time

Published By

---

# Penalty Shootout Behaviour

The Match Module records

Winner Resolution = PENALTIES

The Match Module DOES NOT store

Penalty shootout scores.

Only store

Winning Team

Final Score after Extra Time

Winner Resolution

Example

Brazil

2

Spain

2

Winner Resolution

PENALTIES

Winner

Brazil

Penalty goals

NOT STORED

---

# Match Validation

Required

Tournament

Teams

Kickoff

Venue

Round

Timezone

Status

Cannot create

Home Team == Away Team

Cannot publish

without kickoff time.

Cannot publish

without tournament.

Cannot publish

without teams.

---

# Match Status Rules

DRAFT

Invisible.

Cannot predict.

---

SCHEDULED

Visible only to Admin.

---

PUBLISHED

Visible.

Prediction available according to window.

---

PREDICTION_OPEN

Contestants may submit predictions.

---

PREDICTION_LOCKED

Predictions become read-only.

---

LIVE

No modifications.

---

COMPLETED

Administrator enters result.

---

RESULT_PUBLISHED

Scoring Engine executes.

Leaderboard updates.

---

ARCHIVED

Read-only.

Historical.

---

# Match Cards

Display

Home Team Logo

Away Team Logo

Team Names

Round

Kickoff Time

Venue

Prediction Status

Countdown

Published Status

Result (after publication)

---

# Administrator Features

Create Match

Edit Match

Delete Match

Hide Match

Publish Match

Archive Match

Duplicate Match

Bulk Import (future)

Bulk Publish (future)

Bulk Archive (future)

---

# Contestant Experience

Contestant sees

Upcoming Matches

Prediction Status

Countdown

Locked Matches

Completed Matches

Results

Prediction History

---

# Firestore Collections

Use

matches

Do not duplicate tournament information unnecessarily.

Reference Tournament ID.

---

# Required Services

Create

MatchService

MatchValidator

MatchRenderer

MatchRepository (if repository pattern exists)

MatchPage

MatchForm

MatchTable

MatchCard

MatchCountdown

---

# Query Requirements

Support queries

Upcoming Matches

Published Matches

Tournament Matches

Completed Matches

Prediction Open Matches

Prediction Locked Matches

Live Matches

Historical Matches

---

# Performance

Minimize Firestore reads.

Reuse cached Tournament configuration.

Batch updates where possible.

Avoid duplicate listeners.

---

# Responsive Design

Support

Desktop

Tablet

Mobile

Cards on Mobile

Table on Desktop

Bootstrap only.

---

# Accessibility

Keyboard Navigation

ARIA Labels

Screen Reader Support

Visible Focus

Accessible Countdown

Accessible Status Indicators

---

# Security

Only Administrators may

Create

Edit

Delete

Publish

Archive

Update Result

Contestants

Read Published Matches only.

Firestore rules must enforce ownership and roles.

---

# Error Handling

Handle

Network Failure

Duplicate Match

Missing Tournament

Invalid Kickoff

Permission Denied

Unexpected Errors

Provide meaningful user feedback.

---

# Unit Tests

Include tests for

Validation

Status Transitions

Prediction Lock Calculation

Visibility

Winner Resolution

Result Publication

---

# Documentation

Update

Product Requirements

Business Rules

Acceptance Criteria

Database Schema

if required.

---

# Deliverables

Implement

✓ Match CRUD

✓ Match Lifecycle

✓ Match Status

✓ Match Visibility

✓ Kickoff Scheduling

✓ Automatic Prediction Lock

✓ Winner Resolution

✓ Result Publication

✓ Countdown Support

✓ Responsive UI

✓ Firestore Integration

✓ Validation

✓ Accessibility

✓ Unit Tests

✓ Documentation Updates

---

# Acceptance Criteria

The implementation is complete only when

✓ Administrators can create matches.

✓ Matches can be published.

✓ Matches inherit Tournament behaviour.

✓ Prediction windows automatically open and close.

✓ Countdown is accurate.

✓ Contestants only see published matches.

✓ Match results can be published.

✓ Penalty shootout scores are never stored.

✓ Winner Resolution supports penalties.

✓ Match lifecycle follows documented states.

✓ Firestore rules enforce security.

Do not implement placeholder functionality.

Build production-ready code following the documented architecture.