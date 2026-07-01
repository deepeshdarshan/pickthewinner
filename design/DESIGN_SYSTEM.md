# Task: Create the PickTheWinner Design System & Color Theme

## Objective

Create a modern, premium, mobile-first design system for the PickTheWinner application.

The application is a football tournament prediction platform inspired by the energy of international football tournaments, but it must NOT copy FIFA branding, logos, graphics or exact visual identity.

The design language should feel:

- Premium
- Sporty
- High Energy
- Modern
- Professional
- Dark Theme First
- Mobile First
- Clean
- Minimal
- Accessible

---

# Design Inspiration

Think of:

- Stadium lighting
- Night football matches
- Sports broadcasting graphics
- UEFA/FIFA tournament atmosphere
- Live score applications
- ESPN / OneFootball / Sofascore style

Avoid flashy effects.

The UI should feel modern and premium.

---

# Theme

Dark Theme is the default.

Use a vibrant color palette based on:

- Electric Blue
- Vibrant Green
- Deep Red

Gold should only be used for achievements and trophies.

---

# Color Palette

Create a centralized design system using CSS variables.

Create:

`public/css/variables.css`

Use the following colors.

## Primary Colors

- Primary Blue
  - #1565FF
- Primary Green
  - #00C853
- Accent Red
  - #D50032
- Accent Gold
  - #FFC107

---

## Background

- Primary Background
  - #0B1220
- Secondary Background
  - #172033
- Tertiary Background
  - #1F2A44

---

## Text

- Primary
  - #FFFFFF
- Secondary
  - #C7D2E0
- Muted
  - #94A3B8

---

## Border

- #2D3A52

---

## Status

- Success
  - #00C853
- Warning
  - #FFC107
- Danger
  - #D50032
- Info
  - #1565FF

---

# CSS Variables

Create variables for

- Colors
- Spacing
- Border Radius
- Transitions
- Shadows
- Font Sizes
- Z Index
- Container Width
- Navbar Height
- Sidebar Width

Never hardcode colors anywhere else.

All colors must come from variables.css.

---

# Typography

- Heading Font
  - Poppins
- Body Font
  - Inter
- Weights
  - 400
  - 500
  - 600
  - 700

---

# Buttons

- Primary
  - Blue
- Secondary
  - Green
- Danger
  - Red
- Gold
  - Reserved for trophy and achievement related actions.

Buttons should have

- Rounded corners
- Smooth hover animation
- Focus state
- Disabled state
- Loading state

---

# Cards

Cards should have

- Dark background
- Rounded corners
- Subtle border
- Soft shadow
- Smooth hover animation

Cards must be reusable.

---

# Navbar

- Dark background
- Sticky
- Application logo on left
- Navigation on right
- Profile dropdown
- Notification icon (future)

---

# Sidebar (Admin)

- Dark
- Collapsible
- Icons
- Smooth hover
- Selected menu highlighted using Primary Blue.

---

# Forms

- Rounded inputs
- Floating labels preferred
- Consistent spacing
- Blue focus border
- Error messages in Red
- Success messages in Green

---

# Tables

Desktop only.

Mobile must convert tables into cards.

Support

- Sorting
- Searching
- Pagination

---

# Match Cards

Create reusable Match Card component.

Include

- Tournament
- Round
- Teams
- Flags
- Kickoff Time
- Countdown
- Prediction Status
- Action Button

Cards should be reusable throughout the application.

---

# Leaderboard

Top 3 should use

- 🥇 Gold
- 🥈 Silver
- 🥉 Bronze

Remaining rows use neutral styling.

Current logged-in user should always be highlighted.

---

# Dashboard Statistics Cards

Reusable statistic cards.

Examples

- Points
- Rank
- Accuracy
- Predictions
- Upcoming Matches

Cards should support

- Icon
- Title
- Value
- Optional trend

---

# Icons

Use Bootstrap Icons.

Avoid emoji except for placeholder content.

Preferred icons

- Trophy
- Calendar
- Clock
- Flag
- Bar Chart
- Gear
- Person
- House
- Bell
- Shield

---

# Animations

Subtle only.

Allowed

- Fade In
- Slide Up
- Scale Hover
- Button Ripple
- Countdown Pulse
- Toast Slide

Avoid excessive animation.

---

# Responsive Design

Mobile First.

Support

- Mobile
- Tablet
- Desktop
- Large Desktop

Cards should stack on mobile.

Navigation should collapse.

Buttons should remain touch friendly.

---

# Accessibility

- Minimum contrast ratio
- Keyboard navigation
- Visible focus states
- ARIA labels where applicable
- Semantic HTML

---

# Deliverables

Create

- variables.css
- layout.css
- components.css
- app.css

Update Bootstrap variables where appropriate.

Use CSS variables throughout the application.

No inline styles.

No hardcoded colors.

No duplicated CSS.

---

# Expected Result

The application should immediately have a premium sports look and feel.

The design system must be reusable across all pages.

Future pages should inherit this design automatically without introducing new colors or inconsistent styling.

The design should feel like a professional football prediction platform rather than a generic Bootstrap application.