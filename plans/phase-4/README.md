# Phase 4 — Core UI Shell + Design System
**Status: Not Started**

## Goal
Build a **professional, polished UI foundation** with a design system and 4 focused views. The UI must be demo-quality — this app will be shown to peers. Usability is top priority. Every view earns its place by telling an AI story.

> **Reminder:** The previous app's problem was not bad components — it was too many things competing for attention. With only 4 views, we have the luxury of giving each element room to breathe. The dashboard should feel like opening a news app — 3-5 headlines you can scan in 5 seconds, not a spreadsheet.

## Design Philosophy
- **4 views, not 10** — AI Dashboard, Medications, Labs & Trends, Pre-Visit Report
- **No standalone pages** for conditions, allergies, immunizations, vitals, insurance, claims, or documents
- **Source badges** on every data item to show cross-system provenance
- **AI-first layout** — insights are prominent, raw data is supporting context
- **Insight-first, not data-first** — the user sees "what matters" before "what exists"
- **Breathing room** — generous spacing, no visual clutter, one thing at a time

## Tasks

### 4.0 — Design System (Tailwind Tokens + Reusable Primitives)

This is the **foundation everything else inherits from**. Build this first.

#### Color System
| Role | Token | Usage |
|------|-------|-------|
| Primary | Deep blue/indigo | Header, sidebar, primary buttons |
| Secondary | Teal/cyan | Accents, links, interactive elements |
| Critical | Red-600 | Drug interactions, allergy conflicts |
| High severity | Amber-500 | Care gaps, dose mismatches |
| Medium severity | Yellow-400 | Trends, correlations |
| Info | Blue-400 | General insights, explainers |
| Normal/Success | Green-500 | Normal lab values, confirmed data |
| Epic source | Blue-500 pill | Source badge for Epic data |
| Community MC source | Emerald-500 pill | Source badge for synthetic data |
| Background | Slate-50 | Page background |
| Surface | White | Cards and panels |
| Text primary | Slate-900 | Headings, important text |
| Text secondary | Slate-500 | Supporting text, labels |

#### Typography Scale
| Level | Usage | Tailwind |
|-------|-------|---------|
| Page title | "AI Dashboard", "Medications" | text-2xl font-bold |
| Section header | "AI Insights", "Active Medications" | text-lg font-semibold |
| Card title | Insight title, med name | text-base font-medium |
| Body | Descriptions, AI narratives | text-sm text-slate-700 |
| Caption | Timestamps, source labels, disclaimers | text-xs text-slate-500 |

#### Spacing
- Page padding: p-6
- Card padding: p-4 to p-5
- Gap between cards: gap-4
- Section gap: gap-6 to gap-8
- Generous breathing room — never cramped

#### Card Design
- Rounded corners: rounded-xl
- Subtle shadow: shadow-sm
- Border: border border-slate-200
- Hover: hover:shadow-md transition
- Clear visual hierarchy within each card

#### Severity Visual Language
- Critical: red left-border accent (border-l-4 border-red-500), red icon, red-50 background
- High: amber left-border accent, amber icon, amber-50 background
- Medium: yellow left-border accent
- Info: blue left-border accent, blue-50 background
- Normal: green check, no special background

#### Loading & Empty States
- **Skeleton loaders** for every async section (not spinners)
- **Meaningful empty states** with icon + message + suggested action
- **Smooth transitions** — content fades in, doesn't jump

### 4.1 — Layout Components

```
src/components/layout/AppShell.tsx     — Persistent layout (react-router Outlet pattern)
src/components/layout/Sidebar.tsx      — Left navigation (4 items only)
src/components/layout/Header.tsx       — Top header with patient info + disconnect
```

**Sidebar:**
- Dark background (slate-900 or similar) — professional dashboard feel
- 4 navigation items with icons
- Active state highlight
- Collapsible on smaller screens
- App name/logo at top

**Sidebar items:**
1. AI Dashboard (brain/sparkle icon) — the "home"
2. Medications (pill icon) — cross-system med story
3. Labs & Trends (chart-trending icon) — AI narratives
4. Pre-Visit Report (document icon) — actionable output

**Header:**
- Dark blue/indigo background (similar to previous app — it worked well)
- Patient banner integrated
- "Connected to: Epic + Community MC" indicator
- Disconnect button

### 4.2 — Patient Banner
`src/components/patient/PatientBanner.tsx`:
- Compact, always-visible in header
- Name, DOB, age, sex — clean horizontal layout
- Connected source indicators with colored dots
- Not overly detailed — just enough for context

### 4.3 — Source Badge Component
`src/components/ui/SourceBadge.tsx`:
- Small pill shape (rounded-full, px-2 py-0.5, text-xs)
- Epic = blue-100 bg + blue-700 text
- Community MC = emerald-100 bg + emerald-700 text
- Inline, non-intrusive, consistent everywhere

### 4.4 — AI Insight Card Component
`src/components/ui/InsightCard.tsx`:
- Left-border color accent based on severity
- Icon matching severity (shield-alert for critical, alert-triangle for high, trending-up for medium, info for info)
- Title (bold) + body (plain language) + source attribution (caption)
- "Not medical advice" footer — subtle but always present
- Expandable: click to see full details
- "Discuss with your doctor" action link

### 4.5 — Skeleton Components
`src/components/ui/Skeleton.tsx`:
- SkeletonCard — animated pulse placeholder for cards
- SkeletonText — line-shaped placeholders for text blocks
- SkeletonList — multiple skeleton cards stacked
- Used everywhere during loading — no blank screens, no raw spinners

### 4.6 — Page Scaffold
Create minimal page components (content filled in Phases 5-7):

```
src/pages/DashboardPage.tsx     — AI Insights home (replaces current)
src/pages/MedicationsPage.tsx   — Cross-system medications view
src/pages/LabsTrendsPage.tsx    — Labs & Trends with AI narrative
src/pages/PreVisitPage.tsx      — Pre-visit report generator
```

Each page shows skeleton loading state initially, then transitions to content.

### 4.7 — Routing
Update `src/App.tsx`:
- Wrap authenticated routes in `AppShell` layout
- Route: `/dashboard` → DashboardPage
- Route: `/medications` → MedicationsPage
- Route: `/labs` → LabsTrendsPage
- Route: `/pre-visit` → PreVisitPage
- Default redirect to `/dashboard`

## Deliverable
A **polished, demo-quality UI shell** with:
- Design system (colors, typography, spacing, severity visual language)
- Professional dark sidebar + dark header layout
- Clean 4-item navigation
- Patient banner with source indicators
- Reusable source badge, insight card, and skeleton components
- All 4 pages scaffolded with skeleton loading states
- Smooth transitions, no layout shifts, breathing room everywhere

## Verification
- All 4 sidebar items navigate correctly with active state
- Patient banner shows correct demographics
- Source badges render with correct colors (blue Epic, green Community MC)
- Insight cards show correct severity styling (border color, icon, background)
- Skeleton loaders appear during loading, transition smoothly to content
- App shell persists across page navigations (no re-mount)
- Layout looks professional and clean — no clutter, generous spacing
- Dark header/sidebar provides clear visual container
- Responsive on reasonable screen sizes (1024px+)
