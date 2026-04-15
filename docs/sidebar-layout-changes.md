# Sidebar Layout Changes

**Date:** 2026-04-15
**Branch:** mygaa

---

## Overview

Replaced the top navigation header with a persistent left sidebar. Removed `Navbar.tsx` entirely and introduced a shared dashboard layout with full-height sidebar navigation.

---

## Files Added

### `src/app/dashboard/Sidebar.tsx`
Full-height sticky sidebar containing:
- **Logo block** (top) — NOMAD Traders branding with PHASE 1 badge
- **Navigation section** — Dashboard, Journal, Reports, Analytics, Risk Calculator
- **Bottom section** — Settings, Sign out button (red hover, logout icon)
- Active page highlighting with accent color + border
- SVG icons throughout, smooth hover transitions (`150ms`)
- Top-right corner rounded (`rounded-tr-2xl`)

### `src/app/dashboard/layout.tsx`
Shared layout for all dashboard routes:
- Renders `<Sidebar />` + `<main>` in a flex row
- All sub-pages automatically inherit the sidebar

### `src/app/dashboard/loading.tsx`
Next.js Suspense fallback for dashboard data fetching:
- Skeleton placeholders matching the dashboard layout (header, 6 stat cards, chart, table rows)
- `animate-pulse` on all skeletons

### `src/app/dashboard/journal/page.tsx`
Placeholder page for the Journal route (`/dashboard/journal`).

### `src/app/dashboard/reports/page.tsx`
Placeholder page for Reports (`/dashboard/reports`).

### `src/app/dashboard/analytics/page.tsx`
Placeholder page for Analytics (`/dashboard/analytics`).

### `src/app/dashboard/risk-calculator/page.tsx`
Placeholder page for Risk Calculator (`/dashboard/risk-calculator`).

### `src/app/dashboard/settings/page.tsx`
Placeholder page for Settings (`/dashboard/settings`).

---

## Files Modified

### `src/app/dashboard/page.tsx`
- Removed `<Navbar />` and `<Sidebar />` rendering (now handled by `layout.tsx`)
- Removed outer wrapper `<div className="min-h-screen flex flex-col">`
- Returns page content fragments directly inside the layout's `<main>`
- Added Prisma schema-compatible fields to mock trade objects (`source`, `mt5DealId`, `swap`, `commission`, `reviewed`, `magic`)
- Fixed TypeScript error: `source` cast as `"MANUAL" as const` to satisfy `TradeSource` enum

---

## Files Deleted

### `src/app/dashboard/Navbar.tsx`
Removed entirely. Sign out logic moved to `Sidebar.tsx`. Logo moved to sidebar top block.

---

## Dependency Changes

- **Added:** `@lottiefiles/dotlottie-react` (later removed — not used)
- **Net change:** no new runtime dependencies

---

## Design Decisions

| Decision | Reason |
|----------|--------|
| Sidebar replaces header | More space for nav items, settings, and sign out without crowding the header |
| Logo in sidebar top | Header removed so branding needed a home |
| Sign out at sidebar bottom | Conventionally placed near settings for discoverability |
| Skeleton-only `loading.tsx` | Lottie overlay added complexity without improving UX over simple skeletons |
| Journal instead of Calendar | Better reflects the feature intent (trade journaling by date) |
