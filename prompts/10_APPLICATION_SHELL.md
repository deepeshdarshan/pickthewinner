# Task: Build the Application Shell

## Before You Begin

Read the following documents completely before making any changes.

- README.md
- docs/*
- design/*
- prompts/*
- .cursor/rules/*
- agents/frontend-architect.md

Treat these documents as the single source of truth.

Do not violate any documented architecture.

---

# Objective

Build the reusable application shell for PickTheWinner.

This shell will be the foundation for every feature in the application.

Do NOT implement business modules.

Do NOT implement Firestore CRUD.

Do NOT implement Tournament Management.

Do NOT implement Predictions.

Do NOT implement Leaderboards.

Focus only on reusable infrastructure.

---

# Technology

Use only

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Firebase SDK

Do not introduce

- React
- Angular
- Vue
- jQuery
- TypeScript

---

# Architecture

The application must be implemented as a Single Page Application (SPA).

Structure

```
index.html

↓

App Router

↓

Layout

↓

Page Controller

↓

Components

↓

Services

↓

Firebase
```

Never reload the browser when navigating.

Navigation must happen through the router.

---

# Folder Structure

Use the existing architecture.

public/

css/

js/

app/

auth/

components/

config/

constants/

firebase/

pages/

renderers/

routes/

services/

utils/

validators/

assets/

design/

docs/

prompts/

Do not invent additional folders unless necessary.

---

# Routing

Create a lightweight client-side router.

Support

/

/dashboard

/profile

/leaderboard

/settings

/admin

/404

The router should

- Handle browser refresh
- Support browser history
- Handle unknown routes
- Support protected routes
- Support role-based routing later

No authentication yet.

Only routing infrastructure.

---

# Layout

Create a reusable application layout.

Desktop

--------------------------------

Navbar

Sidebar

Content Area

Footer

--------------------------------

Mobile

Navbar

Content

Bottom Navigation

Footer

The layout must automatically adapt.

---

# Navbar

Sticky

Responsive

Application Logo

Navigation

Profile Area (placeholder)

Notification Icon (placeholder)

Theme Toggle (future placeholder)

User Avatar (placeholder)

No business logic.

---

# Sidebar

Admin only (placeholder)

Collapsible

Bootstrap Icons

Active Menu Highlight

Smooth Collapse Animation

Responsive

Hidden on mobile.

---

# Mobile Navigation

Bottom Navigation Bar.

Items

Home

Leaderboard

Predictions

Profile

Menu

Touch Friendly

Sticky

Bootstrap Icons

---

# Footer

Reusable

Application Version

Copyright

Links

Privacy

Terms

GitHub (placeholder)

---

# Common Components

Create reusable components.

Navbar

Sidebar

Footer

Page Header

Breadcrumb

Loading Overlay

Loading Spinner

Empty State

Error State

Confirmation Dialog

Toast Notification

Modal Wrapper

Search Box

Pagination

Status Badge

Countdown Component (placeholder)

Statistic Card

Reusable Card Container

These components must contain no business logic.

---

# Page Containers

Create placeholder pages.

Home

Dashboard

Leaderboard

Profile

Settings

Admin Dashboard

404

Each page should

- Use the common layout
- Display a placeholder title
- Demonstrate responsiveness

No Firestore.

No Authentication.

No API Calls.

---

# Configuration

Create

app.config.js

application.constants.js

routes.js

environment.js

Store

Application Name

Version

Timezone

Fixed to IST (`Asia/Kolkata`, GMT+05:30). Configure in `app.config.js` only.

Default Prediction Lock Minutes

Date Formats

Theme

Never hardcode values elsewhere.

---

# Theme

Use the Design System.

Read

design/DESIGN_SYSTEM.md

Dark Theme First.

Bootstrap First.

Use CSS variables only.

No hardcoded colors.

---

# Utilities

Create reusable utilities.

Date Formatter

Time Formatter

Timezone Helper (IST / `Asia/Kolkata` only)

Countdown Helper

Storage Helper

Validation Helper

Logger

Toast Helper

Modal Helper

Debounce

Throttle

UUID Generator

No business logic.

---

# Logger

Create centralized logging.

Logger.info()

Logger.warn()

Logger.error()

Logger.debug()

No console.log() outside Logger.

---

# Error Handling

Create reusable

Error Page

Error Component

Error Dialog

Global Error Handler

Gracefully handle failures.

---

# Loading

Create reusable loading infrastructure.

Loading Overlay

Skeleton Cards

Skeleton Table

Spinner

Progress Bar

All reusable.

---

# Responsive Design

Mobile First.

Support

320px

375px

425px

768px

1024px

1440px

1920px

Use Bootstrap Grid.

Avoid unnecessary custom CSS.

---

# Accessibility

Semantic HTML

Keyboard Navigation

ARIA Labels

Visible Focus

Accessible Colors

Accessible Buttons

---

# Bootstrap

Use Bootstrap components whenever possible.

Cards

Forms

Navbar

Offcanvas

Collapse

Toast

Modal

Pagination

Dropdown

Do not recreate Bootstrap functionality.

---

# Icons

Use Bootstrap Icons.

Do not use emoji except placeholder text.

---

# Performance

Lazy-load page controllers.

Avoid unnecessary rendering.

Keep components reusable.

No duplicated code.

---

# JavaScript Standards

ES Modules only.

async/await.

No global variables.

No inline JavaScript.

Separate

Rendering

Business Logic

Services

Routing

Utilities

---

# CSS Standards

Structure

variables.css

layout.css

components.css

utilities.css

app.css

Never hardcode colors.

Never duplicate styles.

Prefer Bootstrap utilities.

---

# Deliverables

Implement

✓ SPA Router

✓ Application Layout

✓ Navbar

✓ Sidebar

✓ Mobile Navigation

✓ Footer

✓ Placeholder Pages

✓ Shared Components

✓ Logger

✓ Utilities

✓ Loading Infrastructure

✓ Error Infrastructure

✓ Configuration Modules

✓ Responsive Design

✓ Bootstrap Integration

✓ CSS Architecture

The application should feel like a polished professional shell ready for future business modules.

Do not implement Authentication.

Do not implement Tournament Management.

Do not implement Firestore CRUD.

Do not implement Prediction logic.

Focus exclusively on creating a reusable application framework.