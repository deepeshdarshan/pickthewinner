# Task: Implement Tournament Management Module

## Before You Begin

Read the following documentation completely before making any changes:

- README.md
- docs/*
- design/*
- prompts/*
- .cursor/rules/*

Treat these documents as the single source of truth.

Do not introduce functionality that contradicts the documentation.

---

# Objective

Implement the Tournament Management module.

This module allows administrators to create, edit, archive and configure tournaments.

The module must be generic and reusable.

Never hardcode FIFA, football, IPL or any sport-specific logic.

Future tournaments should be configurable without changing application code.

---

# Technology

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore

---

# User Permissions

Only users with

role = "admin"

can access this module.

Contestants must never access Tournament Management.

Enforce both:

- UI restrictions
- Firestore Security Rules

---

# Firestore Collection

Collection

tournaments

Document Example

{
id,
name,
shortName,
description,
sport,
tournamentType,
season,
timezone,
status,
registrationOpen,
predictionLockMinutes,
visibility,
startDate,
endDate,
logoUrl,
bannerUrl,
createdBy,
createdAt,
updatedAt
}

Use server timestamps.

---

# Tournament Status

Allowed values only

DRAFT

REGISTRATION_OPEN

LIVE

COMPLETED

ARCHIVED

Do not create additional states.

---

# Tournament Types

Support

GROUP_STAGE

KNOCKOUT

GROUP_AND_KNOCKOUT

LEAGUE

CUSTOM

Store as constants.

---

# Supported Sports

Initially support

Football

Cricket

Basketball

Other

Do not hardcode football-only values.

---

# Tournament List Page

Create

Tournament List

Features

Search

Sort

Pagination

Status Badge

Visibility Badge

Actions

Create

Edit

Archive

Delete (soft delete only)

Clone (future placeholder)

Responsive

Desktop table

Mobile cards

---

# Tournament Form

Fields

Tournament Name *

Short Name

Description

Sport

Tournament Type

Season

Timezone

Start Date

End Date

Prediction Lock Minutes

Visibility

Registration Open

Logo URL

Banner URL

Validation

All required fields

Date validation

Unique tournament name

No invalid status

---

# Tournament Details Page

Display

General Information

Statistics (placeholder)

Number of Matches

Number of Contestants

Number of Predictions

Current Status

Settings

No business logic yet.

---

# Tournament Settings

Administrator can configure

Prediction Lock Minutes

Default Match Points

Timezone

Visibility

Registration Open

Leaderboard Visibility

Prediction Editing

Maximum Contestants (optional)

Store configuration inside tournament document.

Never hardcode.

---

# Validation

Create

TournamentValidator

Validation must be independent of UI.

Return validation results only.

Never manipulate the DOM.

---

# Services

Create

TournamentService

Responsibilities

Load tournaments

Create tournament

Update tournament

Archive tournament

Soft delete tournament

Get active tournament

Never manipulate the UI.

---

# Renderer

Create

TournamentRenderer

Responsibilities

Render list

Render cards

Render details

Render empty state

Render loading state

No Firestore calls.

---

# Page Controller

Create

TournamentPage

Responsibilities

Event wiring

Calling services

Calling renderers

Navigation

No business calculations.

---

# Constants

Create

TournamentConstants

Store

Statuses

Sports

Tournament Types

Collection Names

Routes

Never hardcode strings.

---

# Firestore Rules

Only admins can

Create

Update

Delete

Archive

Contestants can only read

Visible tournaments

Active tournaments

---

# UI Requirements

Follow

design/DESIGN_SYSTEM.md

Use

Bootstrap Cards

Bootstrap Forms

Bootstrap Tables

Bootstrap Badges

Bootstrap Icons

Dark Theme

Responsive

No inline CSS.

---

# Accessibility

Keyboard navigation

Visible focus

ARIA labels

Semantic HTML

---

# Error Handling

Display friendly error messages.

Log errors using Logger.

Never swallow exceptions.

---

# JSDoc

Every exported function must include JSDoc.

---

# Deliverables

Create

TournamentService

TournamentValidator

TournamentRenderer

TournamentPage

TournamentConstants

Tournament List UI

Tournament Form UI

Tournament Details UI

Firestore Integration

Responsive Layout

Loading States

Empty States

Error Handling

The module must be production-ready and reusable.

Do not implement Matches.

Do not implement Predictions.

Do not implement Leaderboards.

This module only manages tournament metadata and configuration.