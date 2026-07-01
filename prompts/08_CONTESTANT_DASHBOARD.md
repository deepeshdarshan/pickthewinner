# Task: Implement Contestant Dashboard Module

## Objective

Implement the complete Contestant Dashboard for PickTheWinner.

The Contestant Dashboard serves as the personalized home page for every contestant.

It provides a consolidated view of tournaments, upcoming matches, prediction progress, leaderboard position, personal statistics, notifications and quick actions.

The dashboard should encourage contestants to complete pending predictions while keeping them engaged throughout the tournament.

The dashboard MUST NOT contain business logic.

It consumes information exposed by other modules.

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
- Renderer Layer
- Validation Layer

Never access Firestore directly from pages.

Never calculate points.

Never calculate rankings.

---

# Module Responsibilities

The Contestant Dashboard is responsible for

- Welcome screen
- Active Tournament
- Upcoming Matches
- Prediction Summary
- Leaderboard Summary
- Personal Statistics
- Notifications
- Quick Actions

The dashboard is NOT responsible for

- Saving predictions
- Calculating scores
- Updating leaderboard
- Publishing results

---

# Dashboard Layout

--------------------------------------------------

Header

↓

Welcome Card

↓

Active Tournament

↓

Next Match Countdown

↓

Pending Predictions

↓

My Predictions

↓

Leaderboard Position

↓

Personal Statistics

↓

Notifications

↓

Recent Results

↓

Quick Actions

--------------------------------------------------

---

# Header

Display

Profile Photo

Welcome Message

Display Name

Country

Current Tournament

Logout

Example

Welcome back,

Deepesh!

Ready for today's predictions?

---

# Active Tournament Card

Display

Tournament Logo

Tournament Name

Season

Current Round

Tournament Progress

Prediction Lock Time

Status

Buttons

View Matches

Leaderboard

Tournament Rules

---

# Next Match Card

Display the next match requiring prediction.

Show

Home Team Logo

Away Team Logo

Team Names

Kickoff Date

Kickoff Time

Countdown

Prediction Status

Button

Predict Now

If prediction already submitted

Button

Edit Prediction

Until prediction lock.

---

# Pending Predictions

Display

Total Upcoming Matches

Predictions Submitted

Predictions Remaining

Prediction Completion %

Large progress bar.

Example

7 / 8 Predictions Completed

---

# My Predictions

Display

Recent Predictions

Prediction Status

Locked

Pending

Scored

Upcoming

Each card displays

Teams

Predicted Score

Penalty Winner (if applicable)

Kickoff

Status

Points Awarded (after scoring)

---

# Leaderboard Summary

Display

Current Rank

Points

Rank Movement

Top Contestant

Gap to Next Rank

Button

View Full Leaderboard

Example

Current Rank

#12

Points

84

Moved Up

▲ 3

---

# Personal Statistics

Display

Correct Winner Predictions

Correct Score Predictions

Prediction Accuracy

Matches Predicted

Matches Remaining

Tournament Points

Best Round

Worst Round

Average Points Per Match

---

# Recent Results

Display

Recently completed matches.

Include

Teams

Final Score

Winner

Your Prediction

Points Awarded

Correct / Incorrect Indicator

---

# Notifications

Display

Prediction Closing Soon

Result Published

Leaderboard Updated

Tournament Announcement

Friendly reminders.

---

# Quick Actions

Buttons

Predict Matches

View Leaderboard

View My Predictions

Profile

Tournament Rules

Settings

---

# Prediction Reminder

If

Prediction closes within 24 hours

Display prominent reminder.

If

Prediction closes within 1 hour

Highlight card.

If

Prediction already locked

Display

Prediction Locked

instead of Predict Now.

---

# Knockout Match Display

If

Match

requiresWinner == true

Display

Predicted Score

Penalty Winner

Example

Brazil 2

Spain 2

Penalty Winner

Brazil

Do NOT display

Penalty shootout goals.

---

# Empty States

Support

No Active Tournament

No Upcoming Matches

No Predictions

No Notifications

No Leaderboard

No Results

Display friendly messages.

---

# Loading States

Support

Skeleton Cards

Loading Overlay

Progress Indicators

Partial Loading

---

# Error Handling

Handle

Network Failure

Firestore Failure

Tournament Unavailable

Prediction Unavailable

Permission Denied

Unexpected Errors

Provide meaningful messages.

---

# Responsive Design

Desktop

Responsive Grid

Tablet

Adaptive Layout

Mobile

Stacked Cards

Bottom Navigation

Sticky Predict Button

Bootstrap only.

---

# Accessibility

Keyboard Navigation

ARIA Labels

Screen Reader Support

Visible Focus

Accessible Cards

Accessible Progress Bars

Accessible Countdown

---

# Performance

Load dashboard summary in parallel.

Cache user profile.

Cache tournament summary.

Avoid duplicate Firestore reads.

Lazy-load historical data.

Dashboard should load within 2 seconds under normal conditions.

---

# Security

Only authenticated contestants may access.

Guests

↓

Redirect to Login

Administrators

↓

Redirect to Admin Dashboard

Contestants may only view their own predictions and statistics.

Firestore Security Rules must enforce ownership.

---

# Services

Create

ContestantDashboardService

ContestantDashboardRenderer

ContestantDashboardValidator

DashboardStatistics

DashboardNotifications

DashboardQuickActions

DashboardUpcomingMatches

DashboardPredictions

DashboardLeaderboard

DashboardResults

---

# Firestore

Read

users

tournaments

matches

predictions

leaderboards

notifications

settings

Never duplicate data.

---

# Future Enhancements

Support

Favorite Teams

Badges

Achievements

Prediction Streaks

Daily Challenges

Gamification

Dark Theme

PWA

Push Notifications

Offline Support

Friend Leaderboards

Country Rankings

Season Statistics

---

# Documentation

Update

Product Requirements

Business Rules

Acceptance Criteria

System Architecture

Database Schema

if required.

---

# Unit Tests

Include tests for

Dashboard Statistics

Prediction Summary

Leaderboard Summary

Upcoming Matches

Responsive Layout

Notifications

Loading States

Accessibility

Security

---

# Deliverables

Implement

✓ Welcome Card

✓ Active Tournament

✓ Next Match Countdown

✓ Pending Predictions

✓ My Predictions

✓ Leaderboard Summary

✓ Personal Statistics

✓ Recent Results

✓ Notifications

✓ Quick Actions

✓ Responsive Design

✓ Accessibility

✓ Firestore Integration

✓ Loading States

✓ Error Handling

✓ Unit Tests

✓ Documentation Updates

---

# Acceptance Criteria

The implementation is complete only when

✓ Authenticated contestants land on the dashboard after login.

✓ Dashboard displays the active tournament.

✓ Dashboard highlights the next match requiring prediction.

✓ Countdown is accurate.

✓ Pending predictions are clearly displayed.

✓ Contestants can navigate directly to prediction screens.

✓ Leaderboard summary is accurate.

✓ Personal statistics display correctly.

✓ Recent results show awarded points.

✓ Knockout match predictions display penalty winner when applicable.

✓ Prediction lock status is clearly indicated.

✓ Responsive design works across desktop, tablet and mobile.

✓ Firestore Security Rules prevent access to other contestants' data.

✓ Dashboard contains no business logic.

Do not implement placeholder functionality.

Build production-ready code following the documented architecture.