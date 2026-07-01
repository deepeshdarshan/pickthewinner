# PickTheWinner - Project Overview

| Property | Value |
|----------|--------|
| Project Name | PickTheWinner |
| Version | 1.0 |
| Status | Draft |
| Document Type | Project Overview |
| Audience | Product Owners, Developers, Architects, QA Engineers |
| Last Updated | July 2026 |

---

# 1. Purpose

PickTheWinner is a web-based tournament prediction platform that allows contestants to predict the outcomes of sporting events and compete against other participants based on the accuracy of their predictions.

The application is designed primarily for FIFA World Cup-style knockout tournaments but has been architected as a generic tournament prediction platform capable of supporting multiple sports and tournament formats in the future.

The goal of the application is to provide a simple, engaging, and fair prediction experience while minimizing manual administration through automation.

---

# 2. Vision

Create a modern, lightweight, highly maintainable tournament prediction platform that can be easily hosted using Firebase and Netlify while providing an excellent user experience across desktop and mobile devices.

The application should be scalable enough to support multiple tournaments over time without requiring significant architectural changes.

---

# 3. Objectives

The primary objectives of PickTheWinner are:

- Provide a simple prediction experience for contestants.
- Automatically lock predictions before each match.
- Eliminate manual score calculation.
- Automatically calculate contestant points.
- Display real-time leaderboards.
- Provide administrators with complete tournament management capabilities.
- Support multiple tournaments over time.
- Maintain a clean and scalable architecture suitable for future expansion.

---

# 4. Target Audience

## Contestants

Contestants participate in prediction competitions.

They can:

- Register using Google Sign-In.
- View active tournaments.
- Predict match winners.
- Predict match scores.
- Edit predictions before the prediction window closes.
- View previous predictions.
- Track accumulated points.
- View leaderboard rankings.

---

## Administrators

Administrators manage the platform.

They can:

- Create tournaments.
- Manage tournament settings.
- Create matches.
- Publish match schedules.
- Publish match results.
- Configure scoring rules.
- Lock and unlock prediction windows.
- Manage contestants.
- View prediction statistics.
- View leaderboards.

---

# 5. Product Scope

The initial release focuses on tournament prediction for knockout football tournaments.

The system includes:

- Authentication
- User Management
- Tournament Management
- Match Management
- Prediction Engine
- Result Processing
- Scoring Engine
- Leaderboards
- User Profiles
- Settings
- Administration

The application intentionally excludes:

- Betting
- Payments
- Gambling
- Live match tracking
- Streaming
- Social networking
- Chat functionality

---

# 6. Technology Stack

## Frontend

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript (ES Modules)

## Backend

Backend-as-a-Service (Firebase)

- Firebase Authentication
- Cloud Firestore
- Firebase Storage

## Hosting

- Netlify

## Version Control

- Git
- GitHub

---

# 7. Core Design Principles

The application follows several guiding principles.

## Simplicity

Avoid unnecessary complexity.

Use Vanilla JavaScript instead of frontend frameworks.

---

## Maintainability

Code should remain understandable years after implementation.

Readable code is preferred over clever code.

---

## Reusability

Components, services and utilities should be reusable across modules.

Avoid duplicated logic.

---

## Scalability

The architecture should support:

- Multiple tournaments
- Multiple sports
- Future feature additions

without major redesign.

---

## Security

Authentication and authorization are first-class concerns.

The application never relies solely on client-side validation.

---

## Performance

Minimize Firestore reads.

Reuse loaded data whenever possible.

Cache appropriate information.

---

# 8. High-Level Architecture

The application follows a layered architecture.

```
Browser

↓

Application Shell

↓

Router

↓

Pages

↓

Components

↓

Services

↓

Firebase SDK

↓

Cloud Firestore
```

Each layer has a single responsibility.

Business logic never directly manipulates the DOM.

Rendering logic never communicates directly with Firestore.

---

# 9. User Roles

The application currently supports two user roles.

## Contestant

Can

- Submit predictions
- View leaderboard
- View profile
- Update personal information

Cannot

- Manage tournaments
- Manage matches
- Manage users

---

## Administrator

Can

- Access all administration features
- Manage tournaments
- Manage matches
- Publish results
- Manage contestants

---

# 10. Authentication Strategy

Contestants authenticate using:

- Google Sign-In

Administrators authenticate using:

- Firebase Email & Password

Authentication and authorization are implemented independently.

---

# 11. Major Modules

The application is divided into the following modules.

- Application Shell
- Authentication
- User Management
- Authorization
- Tournament Management
- Match Management
- Prediction Engine
- Results Processing
- Scoring Engine
- Leaderboard
- Statistics
- Settings
- Notifications

Each module is documented independently.

---

# 12. Prediction Workflow

A typical contestant journey is:

```
Open Application

↓

Google Sign-In

↓

Complete Profile (First Login Only)

↓

Dashboard

↓

View Active Tournament

↓

Select Match

↓

Predict Winner

↓

Predict Score

↓

Save Prediction

↓

Prediction Locked Automatically

↓

Wait for Result

↓

Points Calculated Automatically

↓

Leaderboard Updated
```

---

# 13. Administrative Workflow

```
Login

↓

Create Tournament

↓

Configure Tournament

↓

Add Matches

↓

Publish Schedule

↓

Prediction Window Opens

↓

Prediction Window Closes Automatically

↓

Publish Match Result

↓

Scoring Engine Executes

↓

Leaderboard Updated
```

---

# 14. Quality Attributes

The application prioritizes the following quality attributes.

### Maintainability

Modular architecture.

Feature-based organization.

---

### Scalability

Support additional sports without architectural changes.

---

### Security

Role-based authorization.

Firestore Security Rules.

Session management.

---

### Performance

Efficient Firestore usage.

Caching.

Lazy loading.

Reusable rendering.

---

### Reliability

Automatic session restoration.

Meaningful error handling.

Graceful recovery.

---

### Accessibility

Responsive design.

Keyboard navigation.

Semantic HTML.

Bootstrap accessibility.

---

# 15. Development Philosophy

The project follows several engineering principles.

- Single Responsibility Principle (SRP)
- Don't Repeat Yourself (DRY)
- Bootstrap First
- Service-Oriented Architecture
- Modular JavaScript
- Progressive Enhancement
- Mobile-First Design

---

# 16. Non-Goals

The project intentionally does not aim to become:

- A betting platform
- A fantasy sports platform
- A social media platform
- A messaging application
- A live score provider
- A streaming platform

The focus remains tournament prediction.

---

# 17. Success Metrics

The project is considered successful when it achieves:

- Simple contestant onboarding.
- Zero manual score calculations.
- Automatic prediction locking.
- Automatic leaderboard generation.
- Responsive user experience.
- Secure authentication.
- Maintainable architecture.
- Easy deployment.
- Minimal operational overhead.

---

# 18. Future Vision

Future releases may include:

- Multiple concurrent tournaments
- Additional sports
- Team competitions
- Push notifications
- Progressive Web App (PWA)
- Offline support
- AI-assisted prediction insights
- Internationalization
- Public leaderboards
- Tournament templates

These enhancements should integrate with the existing architecture without major redesign.

---

# 19. Related Documentation

This document should be read together with:

- 01_PRODUCT_REQUIREMENTS.md
- 02_SYSTEM_ARCHITECTURE.md
- 03_FIREBASE_ARCHITECTURE.md
- 04_DATABASE_SCHEMA.md
- 05_SECURITY_MODEL.md
- 06_CODING_STANDARDS.md
- 07_UI_UX_GUIDELINES.md
- 08_DESIGN_SYSTEM.md

---

# 20. Revision History

| Version | Date | Author | Description |
|----------|------|--------|-------------|
| 1.0 | July 2026 | Project Team | Initial project overview |