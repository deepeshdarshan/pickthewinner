# Task: Generate Database Schema Document

## Objective

Create a comprehensive Database Schema document for the PickTheWinner application.

This document defines the complete Firestore data model for the application.

It serves as the single source of truth for every collection, document, field, relationship, index, ownership model and future database evolution.

The schema must remain stable and extensible for future releases.

This document is intended for

- Software Architects
- Developers
- Technical Leads
- QA Engineers

Generate documentation only.

Do NOT generate implementation code.

---

# Before You Begin

Read

- README.md
- docs/**
- architecture/**
- product/**
- engineering/**
- design/**
- prompts/**
- .cursor/rules/**

Treat those documents as the single source of truth.

Do not contradict previous architectural decisions.

---

# Create

```
docs/architecture/03_DATABASE_SCHEMA.md
```

---

# Writing Style

The document should be

- Professional
- Architecture-focused
- Database-oriented
- Implementation independent
- Easy to maintain
- Suitable for future evolution

Do not write Firestore code.

Document the schema only.

---

# Document Metadata

Include

- Project Name
- Version
- Status
- Author
- Audience
- Last Updated
- Related Documents
- Revision History

---

# 1. Purpose

Describe

Why this schema exists.

Relationship with

System Architecture

Firebase Architecture

Business Rules

Explain that this document is the authoritative schema specification.

---

# 2. Database Design Principles

Document principles.

Examples

- Firestore is schema-less but follows a documented schema.
- Collections should remain flat where possible.
- Denormalization is allowed only when justified.
- Avoid unnecessary subcollections.
- Store timestamps in UTC.
- Prefer immutable identifiers.
- Keep documents small.
- Avoid deeply nested objects.
- Minimize Firestore reads.
- Prefer query efficiency over strict normalization.

---

# 3. High-Level Data Model

Create a diagram similar to

```
Users

↓

Predictions

↓

Matches

↓

Tournament

↓

Leaderboard

↓

Settings
```

Explain entity relationships.

---

# 4. Collection Overview

Create a table.

| Collection | Purpose | Owner | Expected Growth |

Include

users

tournaments

matches

predictions

leaderboards

settings

notifications

audit_logs

system_configuration

Future collections

---

# 5. Collection Specifications

For EVERY collection document

Purpose

Ownership

Relationships

Document ID strategy

Growth expectations

Retention policy

Security considerations

Indexes

Typical queries

Example document

Future expansion

---

# Users Collection

Document every field.

Examples

uid

displayName

email

phone

country

timezone

role

status

photoURL

preferences

createdAt

updatedAt

lastLogin

Explain

Type

Required

Nullable

Default

Validation

Read permissions

Write permissions

Business purpose

---

# Tournaments Collection

Document

Tournament ID

Name

Description

Sport

Season

Status

Visibility

Registration

Prediction Lock

Scoring Configuration

Timezone

Logo

Banner

Created By

Created At

Updated At

Archive Flag

Everything required for tournament management.

---

# Matches Collection

Document

Match ID

Tournament

Round

Home Team

Away Team

Kickoff Time

Venue

Status

Visibility

Prediction Open

Prediction Close

Winner

Score

Penalty Winner

Published

Created By

Updated By

Audit Information

Explain every field.

---

# Predictions Collection

Document

Prediction ID

User

Tournament

Match

Predicted Winner

Predicted Home Score

Predicted Away Score

Submitted Time

Last Modified

Locked

Calculated Points

Audit

Future fields

Explain

Validation

Ownership

Relationships

---

# Leaderboards Collection

Document

Tournament

Contestant

Rank

Points

Correct Winners

Correct Scores

Accuracy

Tie Breakers

Last Updated

Historical Data

---

# Settings Collection

Document

Application Settings

Tournament Settings

Theme

Notification Defaults

Prediction Lock Defaults

Timezone

Future configuration

---

# Notifications Collection

Document

Notification Type

Recipient

Status

Created

Read

Archived

Future Push Support

---

# Audit Logs Collection

Document

Action

Actor

Timestamp

Entity

Old Value

New Value

Reason

Future reporting

---

# System Configuration Collection

Document

Application Version

Maintenance Mode

Feature Flags

Global Configuration

Future use

---

# 6. Relationships

Document

One-to-many

Many-to-one

Ownership

References

Explain every relationship.

Examples

Tournament

↓

Matches

↓

Predictions

↓

Leaderboard

---

# 7. Document ID Strategy

Explain

Auto IDs

Generated IDs

Business IDs

Composite IDs

Naming conventions

---

# 8. Timestamp Strategy

Document

createdAt

updatedAt

deletedAt

lastLogin

publishedAt

Always UTC.

Server timestamps.

---

# 9. Status Enumerations

Document every status.

Examples

Tournament

DRAFT

REGISTRATION_OPEN

PUBLISHED

LIVE

COMPLETED

ARCHIVED

Match

SCHEDULED

OPEN

LOCKED

LIVE

COMPLETED

PUBLISHED

CANCELLED

User

ACTIVE

INACTIVE

SUSPENDED

ADMIN

Contestant

Prediction

OPEN

LOCKED

SCORED

---

# 10. Validation Rules

Document validation for every field.

Examples

Email

Phone

Timezone

Score

Winner

Kickoff Time

Prediction Lock

---

# 11. Firestore Index Strategy

Document

Single indexes

Composite indexes

Expected queries

Performance considerations

Future indexes

---

# 12. Query Patterns

Document

Most common queries.

Examples

Active Tournament

Upcoming Matches

User Predictions

Tournament Leaderboard

Contestant History

Admin Dashboard

Recent Results

---

# 13. Data Lifecycle

Document lifecycle.

User

Tournament

Match

Prediction

Leaderboard

Notification

Audit

From creation to archival.

---

# 14. Data Ownership

Document ownership.

Users own

Profile

Predictions

Preferences

Administrators own

Tournaments

Matches

Results

Settings

Audit

---

# 15. Soft Delete Strategy

Document

Archive

Deleted

Hidden

Retention

Recovery

Historical reporting

---

# 16. Migration Strategy

Describe

Schema evolution

Versioning

Backwards compatibility

Future migrations

---

# 17. Performance Strategy

Document

Read optimization

Write optimization

Caching

Pagination

Denormalization

Document size

---

# 18. Security Considerations

Document

Collection ownership

Field protection

Sensitive data

Read permissions

Write permissions

Audit requirements

---

# 19. Backup Strategy

Document

Firestore exports

Retention

Recovery

Version history

Disaster recovery

---

# 20. Sample Documents

Provide representative JSON examples for every collection.

Include realistic values.

Document every field.

---

# 21. Future Collections

Document anticipated collections.

Examples

sports

teams

venues

player_statistics

prediction_templates

badges

achievements

season_rankings

---

# 22. Architecture Decision Records

Examples

ADR-DB-001

Use one prediction document per contestant per match.

ADR-DB-002

Store leaderboard separately.

ADR-DB-003

Use denormalized tournament name where appropriate.

ADR-DB-004

Store timestamps in UTC.

ADR-DB-005

Use immutable document IDs.

Explain every decision.

---

# 23. Related Documents

Cross-reference

Project Overview

Product Requirements

Business Rules

System Architecture

Firebase Architecture

Security Model

Coding Standards

Testing Strategy

Deployment Guide

---

# Deliverables

Generate a complete Database Schema document.

The document must include

✓ Database Design Principles

✓ Collection Specifications

✓ Field Specifications

✓ Validation Rules

✓ Relationships

✓ Query Patterns

✓ Ownership

✓ Status Enumerations

✓ Timestamp Strategy

✓ Index Strategy

✓ Security Considerations

✓ Sample Documents

✓ Future Collections

✓ ADRs

Generate documentation only.

Do not generate implementation code.

The resulting document should serve as the definitive Firestore schema specification for the PickTheWinner application.

---

isPenaltyShootout

Type

Boolean

Default

false

Description

Indicates whether the contestant predicts that the match is decided by penalties.

---

penaltyWinner

Type

String

Nullable

Description

Stores the predicted winner if the match proceeds to penalties.

Possible values

HOME

AWAY

Null when

isPenaltyShootout == false