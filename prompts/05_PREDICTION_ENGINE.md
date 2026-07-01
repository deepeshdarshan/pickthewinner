# Task: Implement Prediction Engine Module

## Objective

Implement the complete Prediction Engine module for PickTheWinner.

The Prediction Engine is responsible for allowing contestants to submit, edit, validate, view and manage predictions for tournament matches.

The Prediction Engine shall support both league matches and knockout matches.

It shall automatically adapt its user interface and validation rules based on the match configuration.

The Prediction Engine shall NOT calculate points.

The Prediction Engine shall NOT publish results.

The Prediction Engine shall NOT update leaderboards.

Those responsibilities belong to other modules.

---

# Before You Begin

Read ALL project documentation.

Mandatory

- README.md
- docs/product/*
- docs/product/requirements/*
- docs/architecture/*
- docs/engineering/*
- docs/design/*
- .cursor/rules/*
- AGENTS.md (if available)

Treat all documentation as the single source of truth.

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

- Service Layer
- Validation Layer
- Renderer Layer
- Feature-based architecture
- ES Modules

Never access Firestore directly from pages.

---

# Module Responsibilities

The Prediction Engine is responsible for

- Creating predictions
- Editing predictions
- Viewing predictions
- Prediction validation
- Automatic locking
- Prediction history
- Prediction ownership
- Responsive UI
- Accessibility

The Prediction Engine is NOT responsible for

- Scoring
- Match results
- Leaderboards
- Tournament configuration

---

# Prediction Lifecycle

Support

NOT_STARTED

↓

OPEN

↓

SAVED

↓

UPDATED

↓

LOCKED

↓

SCORED

↓

ARCHIVED

Each state shall have validation rules.

---

# Prediction Form

Every prediction contains

Tournament

Match

Home Team

Away Team

Predicted Home Score

Predicted Away Score

Penalty Shootout

Penalty Winner

Prediction Time

Last Modified

Locked

Points Awarded (read only)

Scored

---

# Match Configuration

The Prediction Engine shall read

canEndInDraw

requiresWinner

winnerResolutionAllowed

from the Match configuration.

The Prediction Engine shall NOT hardcode football logic.

---

# League Match Behaviour

If

canEndInDraw == true

Contestants may predict

1–1

2–2

0–0

No additional fields shall appear.

The prediction is valid.

---

# Knockout Match Behaviour

If

canEndInDraw == false

Contestants predict

Final score after

Normal Time

+

Extra Time

Penalty shootout goals are NOT predicted.

---

# Prediction Workflow

Initially display

Home Team

[ Score ]

Away Team

[ Score ]

---

If

Home Score != Away Score

Hide

Penalty section.

Prediction is complete.

---

If

Home Score == Away Score

Display

☐ Match decided by Penalty Shootout

---

If the checkbox is checked

Display

Penalty Winner

( ) Home Team

( ) Away Team

---

Penalty Winner becomes mandatory.

---

Never display

Penalty goal fields.

Never store

Penalty shootout scores.

---

# Validation Rules

Validate

Scores must be whole numbers.

Scores cannot be negative.

Scores are required.

Prediction must belong to logged-in contestant.

Prediction must be before prediction lock.

---

League Match

Equal score

↓

Valid

---

Knockout Match

Equal score

↓

Penalty checkbox not selected

↓

Validation error

---

Knockout Match

Equal score

↓

Penalty selected

↓

Winner selected

↓

Valid

---

Knockout Match

Different scores

↓

Penalty section hidden

↓

Valid

---

Penalty Winner selected

while

scores differ

↓

Validation error

---

# Editing Predictions

Contestants may edit

Home Score

Away Score

Penalty Winner

Until

Prediction Lock.

After lock

Prediction becomes read-only.

---

# Prediction Lock

Prediction automatically locks

X minutes before kickoff.

Lock duration comes from Tournament configuration.

Administrator may manually reopen predictions.

Audit every reopen.

---

# Prediction Card

Display

Teams

Logos

Kickoff

Round

Predicted Score

Penalty Winner (if applicable)

Status

Last Updated

Points Awarded

---

# Dashboard Integration

Contestants shall see

Upcoming Predictions

Locked Predictions

Scored Predictions

Recent Predictions

Prediction Accuracy (future)

---

# Firestore Document

Prediction document shall contain

predictionId

userId

tournamentId

matchId

homeScore

awayScore

isPenaltyShootout

penaltyWinner

status

locked

submittedAt

updatedAt

pointsAwarded

scored

createdBy

updatedBy

---

Never store

Penalty shootout scores.

---

# Query Requirements

Support

My Predictions

Upcoming Predictions

Locked Predictions

Scored Predictions

Tournament Predictions (Admin)

Match Predictions (Admin)

Historical Predictions

---

# Services

Create

PredictionService

PredictionValidator

PredictionRenderer

PredictionRepository (if repository pattern exists)

PredictionCard

PredictionForm

PredictionHistory

PredictionStatus

---

# Security

Contestants

May

Create

Read

Update

their own predictions.

Cannot view

other contestants' predictions.

Administrators

May

View all predictions.

May reopen predictions.

Cannot modify contestant predictions after scoring unless correction mode is enabled.

Firestore rules must enforce ownership.

---

# Error Handling

Handle

Prediction locked

Duplicate prediction

Network failure

Permission denied

Tournament unavailable

Hidden match

Validation errors

Unexpected failures

Provide user-friendly messages.

---

# Performance

Cache Tournament configuration.

Reuse Match configuration.

Avoid duplicate Firestore reads.

Batch updates where possible.

No duplicate listeners.

---

# Responsive Design

Support

Desktop

Tablet

Mobile

Cards

Responsive Forms

Bootstrap only.

---

# Accessibility

Keyboard navigation

ARIA labels

Screen reader support

Visible focus

Accessible validation messages

Accessible radio buttons

Accessible checkbox

---

# Unit Tests

Include tests for

Prediction validation

Penalty workflow

Prediction locking

Ownership

Firestore operations

UI rendering

Responsive behaviour

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

✓ Prediction Form

✓ Prediction CRUD

✓ Prediction Lifecycle

✓ Automatic Locking

✓ League Match Behaviour

✓ Knockout Match Behaviour

✓ Penalty Shootout Workflow

✓ Validation

✓ Firestore Integration

✓ Responsive UI

✓ Accessibility

✓ Unit Tests

✓ Documentation Updates

---

# Acceptance Criteria

The implementation is complete only when

✓ Contestants can submit predictions.

✓ Contestants can edit predictions before lock.

✓ Predictions automatically lock before kickoff.

✓ League matches allow draw predictions.

✓ Knockout matches require a winner.

✓ Equal scores display the Penalty Shootout option.

✓ Penalty Winner becomes mandatory when required.

✓ Penalty shootout scores are never requested.

✓ Penalty shootout scores are never stored.

✓ Different scores hide the penalty section.

✓ Contestants can only access their own predictions.

✓ Administrators can view all predictions.

✓ Firestore Security Rules enforce ownership.

✓ Prediction Engine remains independent from the Scoring Engine.

Do not implement placeholder functionality.

Build production-ready code following the documented architecture.