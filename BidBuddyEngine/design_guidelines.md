# Design Guidelines: Multi-Tier Auction Bidding Platform

## Design Approach
**Selected Approach:** Design System (shadcn/ui + Tailwind)

**Justification:** This auction management platform requires consistent, scalable UI patterns across three distinct user interfaces (customer, employee, super admin). The reference West Automotive site demonstrates a modern, utility-focused design that prioritizes efficiency and clarity—ideal for a transaction-heavy application.

**Core Principles:**
- Clarity over decoration: Information hierarchy guides every decision
- Workflow optimization: Minimize clicks, maximize context
- Role-appropriate interfaces: Each user tier sees exactly what they need
- Trust signals: Professional presentation for financial transactions

---

## Typography

**Font System:** Inter (via Google Fonts)
- **Display:** 3xl-4xl, font-bold (page titles, dashboard headers)
- **Heading:** xl-2xl, font-semibold (section headers, card titles)
- **Body:** base, font-normal (forms, descriptions, tables)
- **Label:** sm, font-medium (form labels, metadata)
- **Caption:** xs, font-normal (helper text, timestamps)

**Hierarchy Rules:**
- Maintain 2-step size jumps for visual contrast
- Use weight variation (medium → semibold → bold) to establish importance
- Limit to 3 weights maximum per view

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8
- Container gaps: gap-4, gap-6, gap-8
- Page margins: mx-4 (mobile), mx-auto with max-w-7xl (desktop)

**Grid Structure:**
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Form layouts: Single column on mobile, max-w-2xl centered
- Tables: Full-width with horizontal scroll on mobile
- Sidebar navigation: Fixed 16-unit width on desktop, slide-over on mobile

---

## Component Library

### Navigation & Layout
**Top Navigation Bar:**
- Sticky positioning with backdrop blur
- Logo + brand name (left), user menu + notifications (right)
- Height: h-16
- Max container: max-w-7xl mx-auto

**Sidebar Navigation (Employee/Admin):**
- Fixed left sidebar on desktop (w-64), mobile drawer
- Navigation items with icon + label
- Active state indication with subtle background shift
- Collapsible sections for nested navigation

### Authentication Components
**Customer Registration Form:**
- Two-step process: Account creation → ID verification
- File upload zones for ID photo and address document (drag-and-drop with preview)
- Progress indicator showing step 1 of 2, 2 of 2
- Clear field validation with inline error messages

**Employee Registration:**
- Company code input field (prominent, validated on blur)
- Username/password fields (revealed after valid code)
- Success confirmation with automatic redirect

**Super Admin Login:**
- Two-factor authentication flow
- QR code display for authenticator app setup
- Verification code input (6-digit with auto-focus)

### Bid Management Components
**Customer Bid Submission Card:**
- Lot number input (large, prominent)
- Auto-calculated breakdown table: Service fee ($215), Deposit (10%), Total
- Stripe payment button (primary CTA)
- Terms acceptance checkbox

**Employee Bid Dashboard:**
- Table view with columns: Customer, Lot Number, Max Bid, Status, Actions
- Status badges with distinct visual treatment per state
- Action dropdown per row: Approve, Reject, Update Status, Contact
- Bulk actions toolbar when multiple rows selected

**Bid Status Timeline:**
- Horizontal stepper showing: Pending → Winning → Won/Lost
- Current status highlighted, completed steps checked
- Timestamps beneath each step

### Data Display
**Bid Cards (Customer View):**
- Card layout with shadow and rounded corners
- Lot number (prominent heading)
- Status badge (top-right corner)
- Bid amount, deposit paid, fee paid (labeled rows)
- Action button (context-dependent: "Pay Deposit," "View Status," etc.)

**Employee Directory Table (Super Admin):**
- Sortable columns: Name, Username, Status, Join Date, Actions
- Status indicator (active/inactive with icon)
- Delete action (requires confirmation modal)
- Search/filter bar above table

### Forms & Inputs
**Standard Text Input:**
- Label above, input field with border, helper text below
- Focus state with border accent
- Error state with message and icon
- Height: h-10 for consistency

**File Upload Component:**
- Dashed border drop zone
- Upload icon + "Drop files or click to browse"
- File preview with thumbnail and remove option
- Progress bar during upload

**Action Buttons:**
- Primary: Solid background, font-medium, px-6 py-3
- Secondary: Border variant with transparent background
- Danger: Used for destructive actions (delete)
- Spacing: gap-4 between button groups

### Feedback Components
**Status Badges:**
- Rounded-full with px-3 py-1
- Uppercase text, text-xs font-semibold
- Variants: Pending, Winning, Outbid, Won, Lost, Active, Inactive

**Alert Banners:**
- Full-width notification at page top
- Icon + message + dismiss button
- Variants: Success, Error, Warning, Info
- Auto-dismiss after 5 seconds (except errors)

**Confirmation Modals:**
- Centered overlay with backdrop
- max-w-md container
- Title, description, action buttons (Cancel + Confirm)
- Focus trap and ESC to close

### Tables
**Data Tables:**
- Striped rows for readability
- Sticky header on scroll
- Hover state on rows
- Responsive: Stack cells on mobile or horizontal scroll
- Pagination: Previous/Next with page numbers

---

## Images

**Hero Section (Public Landing/Login Pages):**
- Full-width hero image depicting professional automotive auction environment (auction house, vehicles, or bidding floor)
- Overlay with semi-transparent gradient for text legibility
- Height: 60vh on desktop, 40vh on mobile
- CTA buttons with blurred background treatment

**ID Verification Upload:**
- Placeholder icons for document types
- Preview thumbnails after upload (max-w-xs)

**Empty States:**
- Illustration or icon for "No bids yet," "No employees," etc.
- Centered with descriptive text

**Logo:**
- SVG format, sized at h-10 w-auto
- Displayed in navigation and login forms

---

## Animations
**Minimal, Purposeful Motion:**
- Page transitions: None (instant navigation)
- Modal entrance: Subtle fade-in (150ms)
- Dropdown menus: Slide-down (100ms)
- Status badge updates: Fade transition (200ms)
- Loading states: Spinner only, no skeleton screens

---

## Accessibility
- ARIA labels on all interactive elements
- Keyboard navigation support (tab order, focus visible states)
- Form inputs with associated labels (for/id relationship)
- Sufficient contrast ratios throughout
- Screen reader announcements for status changes

---

## Responsive Breakpoints
- Mobile: Default (< 768px) - single column, stacked navigation
- Tablet: md (768px+) - two-column grids where appropriate
- Desktop: lg (1024px+) - three-column grids, sidebar navigation
- Container: max-w-7xl for all main content areas