# Task: Generate Coding Standards Document

## Objective

Create a comprehensive Coding Standards document for the PickTheWinner application.

This document defines the engineering standards, coding conventions, architectural principles, project organization, JavaScript guidelines, Bootstrap guidelines, Firebase best practices, documentation requirements, and review checklist.

This document is the definitive engineering standard for the project.

Every contributor and AI coding assistant must follow these standards.

Generate documentation only.

Do NOT generate implementation code.

---

# Before You Begin

Read and understand

- README.md
- docs/**
- architecture/**
- product/**
- engineering/**
- design/**
- prompts/**
- .cursor/rules/**

Treat these documents as the single source of truth.

Do not contradict previous architectural decisions.

---

# Create

```
docs/engineering/01_CODING_STANDARDS.md
```

---

# Writing Style

The document should be

- Professional
- Engineering-focused
- Easy to maintain
- Suitable for long-term development
- Technology-specific where appropriate

Avoid implementation examples beyond illustrating standards.

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

Explain

- Why coding standards exist
- Benefits of consistency
- Relationship with System Architecture
- Relationship with Design System

---

# 2. Engineering Principles

Document

Single Responsibility Principle (SRP)

Don't Repeat Yourself (DRY)

Keep It Simple (KISS)

YAGNI

SOLID Principles

Separation of Concerns

Loose Coupling

High Cohesion

Progressive Enhancement

Accessibility First

Mobile First

Maintainability over cleverness

Readability over brevity

---

# 3. Technology Standards

Frontend

HTML5

CSS3

Bootstrap 5

Vanilla JavaScript (ES Modules)

Backend

Firebase Authentication

Cloud Firestore

Firebase Storage

Hosting

Netlify

Version Control

Git

GitHub

---

# 4. Folder Structure Standards

Document expected structure.

Examples

app/

components/

pages/

services/

firebase/

auth/

authorization/

users/

config/

utils/

css/

assets/

docs/

Describe responsibility of every folder.

---

# 5. File Naming Standards

Document

Folder names

File names

JavaScript modules

CSS files

Markdown files

Assets

Use

kebab-case

camelCase

PascalCase

Explain where each applies.

---

# 6. JavaScript Standards

Document

ES Modules

const

let

async/await

Arrow functions

Template literals

Destructuring

Optional chaining

Nullish coalescing

Strict equality

Avoid

var

Callback pyramids

Global variables

Inline JavaScript

Document examples.

---

# 7. Function Standards

Document

Maximum recommended length

Single responsibility

Meaningful names

Pure functions where appropriate

Small reusable helpers

Avoid deeply nested logic

---

# 8. Module Standards

Document

One responsibility per module

Public API

Private helpers

No circular dependencies

No duplicated modules

Feature-based organization

---

# 9. Service Layer Standards

Document

Firestore access only through services

No DOM manipulation

No rendering

No Bootstrap dependencies

Business logic belongs here

Reusable methods

Caching

Error handling

---

# 10. Renderer Standards

Document

Render HTML only

No Firestore

No authentication

No business logic

No validation

Reusable rendering

---

# 11. Validation Standards

Document

Separate validation layer

Return structured validation results

No DOM manipulation

Reusable validators

Business validation

Input validation

---

# 12. HTML Standards

Document

Semantic HTML

Accessibility

ARIA

Proper heading hierarchy

Labels

Forms

Avoid inline events

Avoid unnecessary nesting

---

# 13. Bootstrap Standards

Document

Bootstrap First philosophy

Grid

Cards

Tables

Forms

Utilities

Responsive classes

Avoid custom CSS when Bootstrap provides a solution

---

# 14. CSS Standards

Document

CSS Variables

Reusable components

Utility classes

Modular CSS

Avoid

Inline styles

Hardcoded colors

Large monolithic stylesheets

---

# 15. Firestore Standards

Document

No Firestore calls from pages

No Firestore calls from renderers

Collection constants

Batch writes

Caching

Minimal reads

Efficient queries

Transactions when appropriate

---

# 16. Error Handling

Document

Centralized Logger

Meaningful user messages

Graceful failures

Never swallow exceptions

Retry strategy

---

# 17. Logging Standards

Document

Logger service

Log levels

INFO

WARN

ERROR

DEBUG

Remove console.log

---

# 18. Constants

Document

Avoid magic numbers

Avoid magic strings

Use constants

Routes

Collection names

Statuses

Configuration values

---

# 19. Documentation Standards

Document

JSDoc

README updates

Architecture updates

Module documentation

Public APIs

Examples

---

# 20. Performance Guidelines

Document

Efficient rendering

Caching

Minimal Firestore reads

Batch operations

Lazy loading

Avoid duplicate calculations

Avoid unnecessary listeners

---

# 21. Security Guidelines

Document

Never trust client input

Role validation

Ownership validation

No secrets in source code

Input sanitization

Permission checks

---

# 22. Accessibility Standards

Document

Keyboard navigation

Screen reader support

ARIA

Focus management

Contrast

Responsive typography

---

# 23. Responsive Design Standards

Document

Mobile First

Tablet

Desktop

Responsive spacing

Responsive typography

Responsive layouts

---

# 24. Code Review Checklist

Generate a checklist.

Examples

✓ SRP followed

✓ DRY followed

✓ JSDoc added

✓ Validation separated

✓ Firestore separated

✓ Responsive

✓ Accessible

✓ No duplicated code

✓ Logger used

✓ Constants extracted

✓ Error handling implemented

---

# 25. Pull Request Checklist

Generate a checklist.

Examples

Architecture followed

Documentation updated

Tests completed

No console.log

Responsive verified

Accessibility verified

No duplicated code

---

# 26. Refactoring Guidelines

Document

When to refactor

How to refactor safely

Avoid premature optimization

Incremental improvements

---

# 27. Anti-Patterns

Document

God classes

God functions

Duplicated logic

Hardcoded values

Inline JavaScript

Inline CSS

Business logic in UI

Firestore in renderers

Deep nesting

Large switch statements

Magic strings

Magic numbers

---

# 28. Architecture Compliance

Explain how developers should ensure their code remains aligned with

System Architecture

Firebase Architecture

Security Model

Database Schema

Business Rules

---

# 29. AI Development Guidelines

Provide specific guidance for AI coding assistants.

Examples

Read documentation before coding

Reuse existing modules

Avoid duplication

Do not redesign architecture

Prefer extending existing modules

Keep functions small

Update documentation when behavior changes

---

# 30. Architecture Decision Records

Document

ADR-CODE-001

Use Vanilla JavaScript.

ADR-CODE-002

Use Bootstrap First.

ADR-CODE-003

Use Service Layer.

ADR-CODE-004

Separate Rendering from Business Logic.

ADR-CODE-005

Use Feature-Based Folder Structure.

Explain rationale.

---

# 31. Related Documents

Cross-reference

Project Overview

Product Requirements

Business Rules

System Architecture

Firebase Architecture

Database Schema

Security Model

Design System

UI Guidelines

Testing Strategy

Deployment Guide

---

# Deliverables

Generate a comprehensive Coding Standards document.

The document must include

✓ Engineering Principles

✓ Folder Standards

✓ JavaScript Standards

✓ Service Standards

✓ Renderer Standards

✓ Validation Standards

✓ HTML Standards

✓ Bootstrap Standards

✓ CSS Standards

✓ Firestore Standards

✓ Error Handling

✓ Logging

✓ Documentation

✓ Performance

✓ Security

✓ Accessibility

✓ Responsive Design

✓ Code Review Checklist

✓ PR Checklist

✓ Refactoring Guidelines

✓ Anti-Patterns

✓ AI Development Guidelines

✓ ADRs

Generate documentation only.

Do not generate implementation code.

The resulting document should become the definitive engineering handbook for the PickTheWinner project.