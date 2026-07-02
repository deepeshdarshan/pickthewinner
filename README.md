# PickTheWinner

A modern tournament prediction platform built with

- HTML5
- Bootstrap 5
- Vanilla JavaScript (ES Modules)
- Firebase Authentication
- Cloud Firestore
- Firebase Hosting

## Features

- Google SSO
- Email Login
- Tournament Management
- Prediction Engine
- Leaderboard
- Automatic Prediction Lock
- Multi Tournament Support

## Status

01 Foundation
        ✔

02 Application Shell
        ✔

03 Authentication
        ✔

04 User Management
        ✔

05 Authorization
        ✔

06 Application Startup
        ⭐

07 Tournament Module

08 Match Module

09 Prediction Module

10 Results Module

11 Leaderboard
        ✔

12 Statistics

13 Settings

14 Notifications

15 Deployment


00_PROJECT_OVERVIEW.md (5–8 pages)
Vision
Purpose
Objectives
Technology Stack
Target Audience
Roles
High-Level Features
System Overview
Development Principles
Success Criteria
Roadmap
01_PRODUCT_REQUIREMENTS.md (15–20 pages)

This becomes your PRD.

Everything about:

Contestants
Admin
Tournament lifecycle
Matches
Knockout progression
Predictions
Scoring rules
Leaderboards
Settings
Notifications
Future enhancements
Acceptance criteria
Business rules
02_SYSTEM_ARCHITECTURE.md (10–15 pages)

Contains:

Layered architecture
SPA architecture
Folder structure
Module boundaries
Router
Components
Services
Renderers
Validators
Event Bus
App Context
Startup lifecycle
Dependency rules
Sequence diagrams
03_FIREBASE_ARCHITECTURE.md (12–15 pages)
Firebase Authentication
Google SSO
Admin authentication
Firestore collections
Storage
Hosting (future)
Security Rules strategy
Offline behavior
Caching
Indexes
Cost optimization
Backup strategy
04_DATABASE_SCHEMA.md (15–20 pages)

Every collection:

users
tournaments
matches
predictions
leaderboard
settings
audit_logs (future)

For every collection:

Fields
Types
Required/optional
Validation
Relationships
Composite indexes
Example documents
05_SECURITY_MODEL.md (10–15 pages)
Authentication
Authorization
RBAC
Permission matrix
Firestore rules
Route guards
Client security
Session handling
Admin protection
Threat model
Best practices
06_CODING_STANDARDS.md (15–20 pages)

Everything from your Frontend Architect skill:

SRP
DRY
SOLID
Bootstrap-first
ES Modules
Folder organization
File naming
Logging
Error handling
Validation
JSDoc
Firestore usage
Review checklist
Performance guidelines
07_UI_UX_GUIDELINES.md (10 pages)
Navigation
Responsive design
Forms
Tables
Cards
Empty states
Loading states
Error pages
Accessibility
Mobile UX
FIFA-inspired branding
08_DESIGN_SYSTEM.md

Already done.

09_DEPLOYMENT.md
Local development
Vite/Live Server
Firebase configuration
Environment configuration
Netlify deployment
Production checklist
Versioning
10_TESTING_STRATEGY.md
Manual testing
Smoke tests
Authentication tests
Prediction tests
Tournament tests
Regression checklist
Browser compatibility
Mobile testing
11_RELEASE_PROCESS.md
Git workflow
Branch strategy
Code reviews
Architecture review
Release checklist
Rollback process
Version tagging
12_FUTURE_ROADMAP.md

Everything we might add later:

Multiple tournaments
Multiple sports
Team competitions
Prize management
Push notifications
Progressive Web App (PWA)
Offline support
AI prediction insights
Export to Excel/PDF
Public leaderboards
Multi-language support


====================

01_PRODUCT_REQUIREMENTS.md

This is the functional specification.

It answers:

What should the application do?

Contains

Product Scope
Functional Requirements
Non-functional Requirements
User Roles
Features
Modules
Constraints
Assumptions

No workflows.

No implementation.

02_USER_JOURNEYS.md

This answers

How do users interact with the application?

Contains

Contestant Journey

Admin Journey

First Login

Returning User

Tournament Flow

Prediction Flow

Logout

Session Restore

Error Scenarios

Lots of flow diagrams.

03_BUSINESS_RULES.md

This becomes the most important document.

Everything like

Prediction lock

Scoring

Winner determination

Match status

Tournament status

Visibility

Permissions

Registration

Tie breakers

One place.

04_ACCEPTANCE_CRITERIA.md

This becomes QA documentation.

Examples

Given

When

Then

For every feature.

Can literally become manual test cases later.

05_FUTURE_ROADMAP.md

Everything not planned for Version 1.

Examples

Multiple sports

Push notifications

PWA

Offline mode

Excel export

Public leaderboards

Prize management

Team competitions

AI predictions

glossary.md

Defines

Tournament

Match

Contestant

Administrator

Prediction

Winner

Exact Score

Knockout Match

Penalty Winner

Prediction Window

Lock Window

Published Match

Hidden Match

No ambiguity.
