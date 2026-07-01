# Task: Implement Scoring Engine

## Objective

Implement the complete Scoring Engine for PickTheWinner.

The Scoring Engine is responsible for evaluating contestant predictions after a match result is published.

It calculates points, updates prediction records and generates leaderboard data.

The Scoring Engine is the ONLY module allowed to calculate points.

No other module shall implement scoring logic.

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
- AGENTS.md

Treat documentation as the single source of truth.

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

Renderer

↓

Service

↓

Engine

↓

Domain

↓

Repository

↓

Firestore

Business rules belong inside

ScoringEngine

and

ScoringDomain

Only.

---

# Module Responsibilities

The Scoring Engine shall

Evaluate predictions

Award points

Mark predictions as scored

Update leaderboard

Update contestant statistics

Generate scoring summary

Generate audit log

Trigger leaderboard refresh

Trigger dashboard refresh

Trigger notifications (future)

---

# Module MUST NOT

Render UI

Modify tournaments

Modify matches

Modify prediction values

Modify contestant profiles

---

# Input

The engine receives

Tournament

Match Result

All Predictions for Match

Scoring Configuration

---

# Output

The engine produces

Prediction Points

Leaderboard Updates

Contestant Statistics

Scoring Summary

Audit Records

---

# Match Result

The result contains

Home Score

Away Score

Winner Resolution

Winning Team

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

# Prediction

Prediction contains

Home Score

Away Score

Predicted Winner

Winner Resolution

Submitted Time

---

# Scoring Configuration

Read from

TournamentConfigurationService

Never hardcode

Point values.

Support

Winner Points

Exact Score Points

Bonus Points

Penalty Winner Points

Tie Breakers

Future extensions.

---

# Scoring Workflow

Administrator

↓

Publish Result

↓

Scoring Engine starts

↓

Load Match

↓

Load Tournament Configuration

↓

Load Predictions

↓

Evaluate every prediction

↓

Award points

↓

Update Prediction

↓

Update Leaderboard

↓

Update Statistics

↓

Publish Event

↓

Result Complete

---

# Evaluation Order

Evaluate

Correct Winner

↓

Correct Score

↓

Penalty Winner

↓

Bonus Points

↓

Total

---

# Winner Evaluation

If predicted winner matches

Award

Winner Points

Else

0

---

# Exact Score Evaluation

If

Home Score

AND

Away Score

both match

Award

Exact Score Points

Else

0

---

# Knockout Matches

When

RequiresWinner == true

Prediction contains

Final Score

+

Penalty Winner

Example

Prediction

Brazil

2

Spain

2

Penalty Winner

Brazil

Result

Brazil

2

Spain

2

Winner

Brazil

Resolution

PENALTIES

---

Scoring

Correct Score

YES

Correct Winner

YES

Penalty Winner

YES

Award

Winner

+

Score

+

Penalty Bonus

---

Example

Prediction

Brazil

2

Spain

2

Penalty Winner

Spain

Result

Winner

Brazil

Award

Correct Score

YES

Winner

NO

Penalty

NO

---

League Matches

Penalty section ignored.

---

# Bonus Points

Support future bonuses.

Examples

Perfect Round

First Prediction

Streak

Wildcard

Do not implement now.

Architecture only.

---

# Contestant Statistics

Update

Matches Predicted

Correct Winners

Correct Scores

Accuracy

Tournament Points

Average Points

Best Round

Worst Round

---

# Leaderboard Update

Update

Rank

Points

Accuracy

Correct Winners

Correct Scores

Movement

Historical Rank

---

# Tie Breakers

Read configuration.

Possible strategies

Most Correct Winners

Most Exact Scores

Accuracy

Earliest Prediction

Alphabetical

Do not hardcode.

---

# Prediction Status

Support

OPEN

LOCKED

SCORED

ARCHIVED

After scoring

Prediction becomes

SCORED

---

# Batch Processing

All predictions for one match

must be processed

inside one transaction or coordinated batch where appropriate.

Avoid partial scoring.

---

# Idempotency

Publishing the same result twice

must not

Award points twice.

Engine must detect

Already Scored.

---

# Recalculation

Administrator may

Recalculate Match

Recalculate Tournament

Recalculate Leaderboard

Engine must

Reset

↓

Recalculate

↓

Republish

---

# Events

Publish

Prediction Scored

↓

Leaderboard Updated

↓

Contestant Statistics Updated

↓

Dashboard Refresh

↓

Notification (future)

---

# Firestore

Read

matches

predictions

tournaments

leaderboards

settings

Write

predictions

leaderboards

statistics

audit_logs

---

# Services

Create

ScoringEngine

ScoringDomain

ScoringService

ScoringRepository

ScoringSummary

ScoringStatistics

ScoringAudit

---

# Performance

Support

1000+

predictions

per match.

Minimize Firestore reads.

Use caching.

Batch writes.

Parallel evaluation.

---

# Error Handling

Handle

Already Scored

Missing Result

Missing Predictions

Configuration Missing

Firestore Failure

Network Failure

Partial Failure

Provide rollback where possible.

---

# Responsive Design

No UI.

Admin pages consume engine output.

---

# Security

Only Administrators

may trigger scoring.

Contestants

cannot

trigger recalculation.

All scoring actions

must be audited.

---

# Documentation

Update

Business Rules

Acceptance Criteria

Database Schema

Architecture

ADR

---

# Unit Tests

Test

Winner evaluation

Exact score

Penalty workflow

Tie breakers

Batch scoring

Recalculation

Idempotency

Performance

Error handling

---

# Deliverables

Implement

✓ Scoring Engine

✓ Scoring Domain

✓ Batch Processing

✓ Idempotency

✓ Recalculation

✓ Leaderboard Update

✓ Contestant Statistics

✓ Event Publishing

✓ Audit Logging

✓ Documentation Updates

✓ Unit Tests

---

# Acceptance Criteria

Implementation is complete only when

✓ Every prediction is evaluated exactly once.

✓ League matches score correctly.

✓ Knockout matches score correctly.

✓ Penalty winner is evaluated correctly.

✓ Exact score awards points.

✓ Winner awards points.

✓ Tie breakers follow tournament configuration.

✓ Leaderboard updates automatically.

✓ Statistics update automatically.

✓ Recalculation works.

✓ Duplicate scoring cannot occur.

✓ All scoring actions are audited.

✓ Scoring logic exists ONLY inside ScoringEngine.

Do not implement placeholder functionality.

Build production-ready code following the documented architecture.