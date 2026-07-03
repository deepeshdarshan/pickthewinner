# Task: Generate UI/UX Guidelines Document

## Objective

Create a comprehensive UI/UX Guidelines document for the PickTheWinner application.

This document defines the visual language, interaction patterns, responsive behavior, accessibility standards, design principles, navigation guidelines, reusable UI patterns, and user experience expectations.

This document serves as the definitive UI/UX handbook for the project.

Every future screen, component, and interaction must follow these guidelines.

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

Treat these documents as the single source of truth.

Do not contradict previously documented design decisions.

---

# Create

```
docs/design/01_UI_UX_GUIDELINES.md
```

---

# Writing Style

The document should be

- Professional
- Design-focused
- User-centric
- Easy to understand
- Rich with examples
- Suitable for designers and developers

Avoid implementation code.

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

Purpose of the UI Guidelines.

Relationship with

Design System

Coding Standards

Product Requirements

System Architecture

---

# 2. Design Philosophy

Describe

Simple

Clean

Modern

Professional

Sports-inspired

Energetic

Minimal

Accessible

Responsive

Fast

Explain the overall design direction.

---

# 3. Brand Identity

Document

Application personality

Tone

Emotion

Visual identity

Examples

Competitive

Exciting

Trustworthy

Modern

Premium

Community-driven

---

# 4. FIFA-Inspired Theme

Document

Color palette

Primary

Secondary

Accent

Success

Warning

Danger

Info

Background

Surface

Border

Typography colors

Button colors

Card colors

Navigation colors

Explain intended usage.

---

# 5. Typography

Document

Font Family

Heading hierarchy

Body text

Labels

Captions

Buttons

Tables

Responsive typography

Line heights

Spacing

---

# 6. Iconography

Document

Bootstrap Icons

Usage rules

Consistency

Sizes

Spacing

Accessibility

Future custom icons

---

# 7. Spacing System

Document

Spacing scale

Margins

Padding

Section spacing

Card spacing

Form spacing

Responsive spacing

---

# 8. Layout Principles

Document

Container widths

Grid system

Responsive breakpoints

Desktop

Tablet

Mobile

Content alignment

Maximum content width

---

# 9. Navigation Guidelines

Document

Top Navigation

Sidebar

Mobile Navigation

Breadcrumbs

Back navigation

Current page indication

User profile menu

Admin menu

Role-based navigation

---

# 10. Dashboard Guidelines

Contestant Dashboard

Administrator Dashboard

Summary Cards

Statistics

Recent Activity

Upcoming Matches

Leaderboard

Quick Actions

Empty States

---

# 11. Card Design

Document

Information cards

Statistics cards

Match cards

Prediction cards

Tournament cards

Hover effects

Spacing

Alignment

Elevation

---

# 12. Forms

Document

Labels

Inputs

Dropdowns

Checkboxes

Radio buttons

Validation

Required fields

Read-only fields

Disabled fields

Success messages

Error messages

Responsive forms

## Icon Input Fields (Login & Profile)

Use the shared icon input pattern for authentication and profile forms.

- Label positioned above the field
- Single rounded container with border
- Leading Bootstrap Icon (Primary Blue) on the left
- Thin vertical divider between icon and control
- Borderless `input` or `select` inside the container
- Placeholder text inside the control area

Standard icon mapping:

- Email — `bi-envelope`
- Password — `bi-lock`
- Phone — `bi-telephone`
- District — `bi-geo-alt`
- Pradeshika Sabha — `bi-building`
- Username — `bi-person`

Implementation: `renderIconInputField()` and `renderIconSelectField()` in `public/js/shared/form/icon-input.component.js`. Styles: `.ptw-icon-input` in `public/css/components.css`.

Icons are decorative; the visible label provides the accessible name.

---

# 13. Tables

Document

Leaderboard

User Management

Tournament Management

Match Management

Sorting

Filtering

Pagination

Responsive behavior

Sticky headers

---

# 14. Buttons

Document

Primary

Secondary

Outline

Danger

Success

Icon buttons

Floating buttons

Loading buttons

Disabled buttons

Spacing

Icons

---

# 15. Modals

Document

Confirmation dialogs

Delete confirmation

Success dialogs

Error dialogs

Information dialogs

Modal sizing

Mobile behavior

---

# 16. Toast Notifications

Document

Success

Error

Warning

Information

Auto dismiss

Manual dismiss

Position

Icons

---

# 17. Loading States

Document

Full page loading

Section loading

Skeleton loaders

Spinner

Progress bar

Button loading

Table loading

---

# 18. Empty States

Document

No tournaments

No matches

No predictions

No leaderboard

No notifications

No users

No results

Provide friendly messaging.

Illustrations (future)

---

# 19. Error States

Document

404

403

Network failure

Authentication failure

Permission denied

Unexpected error

Retry actions

Recovery guidance

---

# 20. Responsive Design

Document

Mobile First

Portrait

Landscape

Tablet

Desktop

Large screens

Navigation changes

Cards

Tables

Forms

---

# 21. Mobile Experience

Document

Touch targets

Gestures

Bottom navigation

Scrolling

Keyboard handling

Safe areas

Performance

---

# 22. Accessibility

Document

WCAG considerations

Keyboard navigation

ARIA

Screen readers

Focus states

Contrast

Responsive text

Accessible forms

Accessible tables

---

# 23. Animation Guidelines

Document

Page transitions

Button interactions

Hover effects

Loading animations

Modal animations

Toast animations

Keep animations subtle.

---

# 24. Theme Guidelines

Document

Light Theme

Dark Theme (future)

Theme switching

Color consistency

Brand consistency

---

# 25. User Experience Principles

Document

Reduce clicks

Progressive disclosure

Meaningful feedback

Error prevention

Undo where possible

Consistency

Predictability

---

# 26. Page Templates

Describe expected layouts for

Landing

Login

Dashboard

Leaderboard

Tournament

Match

Prediction

Profile

Settings

Admin Dashboard

User Management

404

403

---

# 27. Component Library

Document reusable components.

Examples

Navbar

Footer

Page Header

Card

Table

Modal

Toast

Loading Overlay

Statistic Card

Match Card

Prediction Card

Empty State

---

# 28. Microcopy Guidelines

Document wording.

Examples

Buttons

Validation messages

Error messages

Success messages

Confirmation dialogs

Loading text

Empty states

Use friendly, concise language.

---

# 29. Performance Guidelines

Document

Fast rendering

Minimal animations

Lazy loading

Image optimization

Responsive images

Avoid layout shift

---

# 30. Future UI Enhancements

Document

Dark Mode

PWA

Offline UI

Charts

Gamification

Badges

Achievements

Avatar customization

Team themes

---

# 31. UI Review Checklist

Generate checklist.

Examples

✓ Responsive

✓ Accessible

✓ Consistent spacing

✓ Bootstrap first

✓ Empty states

✓ Loading states

✓ Error states

✓ Mobile friendly

✓ Typography consistent

✓ Colors consistent

---

# 32. Design Decision Records

Examples

DDR-001

Use FIFA-inspired color palette.

DDR-002

Bootstrap 5 as primary UI framework.

DDR-003

Cards over complex tables on mobile.

DDR-004

Mobile-first layouts.

DDR-005

Consistent spacing system.

Explain rationale.

---

# 33. Related Documents

Reference

Project Overview

Product Requirements

Business Rules

System Architecture

Coding Standards

Design System

Accessibility Guidelines

Testing Strategy

---

# Deliverables

Generate a comprehensive UI/UX Guidelines document.

The document must include

✓ Design Philosophy

✓ Brand Identity

✓ FIFA Theme

✓ Typography

✓ Layout

✓ Navigation

✓ Dashboard

✓ Cards

✓ Forms

✓ Tables

✓ Buttons

✓ Modals

✓ Toasts

✓ Loading States

✓ Empty States

✓ Error States

✓ Responsive Design

✓ Mobile Experience

✓ Accessibility

✓ Animations

✓ Component Library

✓ Page Templates

✓ UI Review Checklist

✓ Design Decision Records

Generate documentation only.

Do not generate implementation code.

The resulting document should become the definitive UI/UX handbook for the PickTheWinner project.

---

## Prediction Form

The Penalty Shootout section shall be conditionally displayed.

Visible only when

Home Score == Away Score

When hidden,

the page layout shall not reserve empty space.

The transition shall be smooth.

Penalty Winner uses radio buttons.

Penalty checkbox appears immediately after score entry.

---

## Compact UI Density (Implemented)

All admin and contestant page content uses `ptw-density-compact` on page shells for consistent spacing.

### Spacing and typography

| Element | Standard |
|---------|----------|
| Card body padding | 0.75rem (`--ptw-density-card-padding`) |
| Page header title | 1.25rem (`--ptw-font-size-xl`) |
| Stat card values | 1.125rem (`--ptw-density-stat-value`) |
| Form labels | 0.75rem (`--ptw-font-size-xs`) |
| Table text | 0.875rem with compact cell padding |

### Layout utilities

- `.ptw-filter-bar` — single-row flex filter bar (matches, predictions)
- `.ptw-stat-grid` — responsive stat card grid (2 / 3 / 6 columns)
- `.ptw-stat-tile` — compact inline metric tile
- `.ptw-table--compact` — fixed-layout data tables with reduced padding

### Rules

- Do not use Bootstrap `display-*` for metric values
- Prefer `renderFilterBar()` and `renderStatisticCardGrid()` shared components
- Sidebar and navigation are excluded from compact overrides