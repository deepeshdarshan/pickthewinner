# Task: Establish the Application Foundation

Before making any changes, read the following documents completely.

- README.md
- docs/*
- design/*
- agents/frontend-architect.md

Treat these documents as the single source of truth.

Do not violate any documented requirements.

---

## Objective

Create the production-ready application foundation for PickTheWinner.

Do NOT implement any business features yet.

The objective is to create a scalable architecture.

---

## Technology

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Firebase
- Firestore
- Firebase Authentication

---

## Folder Structure

Review the current project.

Improve the folder structure if necessary.

Follow a feature-based modular architecture.

---

## CSS Architecture

Create

css/

variables.css

layout.css

components.css

utilities.css

app.css

Never hardcode colors.

Use the Design System.

---

## JavaScript Architecture

Create

app/

config/

firebase/

services/

components/

pages/

utils/

auth/

Each folder should contain placeholder modules.

---

## Configuration

Create

app.config.js

application.constants.js

routes.js

---

## Firebase

Create

firebase.js

Initialize Firebase only once.

Export

auth

firestore

storage

---

## Common Components

Prepare reusable components.

Navbar

Footer

Loading Overlay

Toast

Confirmation Modal

Page Header

No business logic yet.

---

## Utilities

Create utility modules.

Date

Time

Countdown

Validation

Formatting

Storage

Toast

---

## HTML

Create placeholder pages.

Landing

Login

Dashboard

Leaderboard

Admin Dashboard

Settings

Profile

Each page should share the same layout.

---

## Requirements

Use ES Modules.

No jQuery.

No duplicated code.

No inline CSS.

No inline JavaScript.

Use Bootstrap 5.

Keep everything responsive.

Add JSDoc comments.

---

## Deliverables

A production-ready project foundation that future features can build upon.

Do not implement authentication.

Do not implement prediction logic.

Do not implement Firestore CRUD.

Architecture only.