# Mobile Information Architecture -- TarvaRI Alert Viewer

> Version 1.0.0 | 2026-03-06
> Status: Draft for Review
> Author: Information Architecture

---

## Table of Contents

1. [IA Brief](#1-ia-brief)
2. [Content Inventory](#2-content-inventory)
3. [Information Hierarchy](#3-information-hierarchy)
4. [Navigation Model Analysis](#4-navigation-model-analysis)
5. [Recommended Navigation Architecture](#5-recommended-navigation-architecture)
6. [Progressive Disclosure Strategy](#6-progressive-disclosure-strategy)
7. [Mobile Content Prioritization](#7-mobile-content-prioritization)
8. [Screen-Level Content Mapping](#8-screen-level-content-mapping)
9. [Contextual Navigation Flows](#9-contextual-navigation-flows)
10. [Search and Filter IA](#10-search-and-filter-ia)
11. [Notification and Alert Display](#11-notification-and-alert-display)
12. [Data Density Analysis](#12-data-density-analysis)
13. [Content Grouping Rationale](#13-content-grouping-rationale)
14. [Card Sorting Recommendations](#14-card-sorting-recommendations)
15. [Accessibility Specification](#15-accessibility-specification)
16. [Validation Plan](#16-validation-plan)
17. [Risks and Open Questions](#17-risks-and-open-questions)

---

## 1. IA Brief

| Field | Content |
|-------|---------|
| **Problem** | The TarvaRI Alert Viewer is a spatial intelligence dashboard built on a zoomable canvas (ZUI) that requires panning, zooming, and hover interactions impossible on mobile devices. All content is displayed simultaneously in world-space. Mobile users have no way to access the dashboard. |
| **Target Users** | Security analysts and operations staff who need situational awareness of global threat intelligence while away from their desk. They check posture, scan priority alerts, drill into specific categories or regions, and need to be reachable for P1 escalations. |
| **Desired Outcome** | A mobile view within the same Next.js codebase that provides glanceable threat posture, priority alert monitoring, category-level drill-down, and map-based geographic awareness -- all within the Oblivion-inspired dark cinematic aesthetic. |
| **Constraints** | Same codebase (responsive, not a separate app). No hover states. Minimum 375px width (iPhone SE). Same TarvaRI API endpoints and TanStack Query hooks. Touch targets >= 44px (WCAG 2.2 AAA). Oblivion aesthetic (dark glass, minimal chrome, glowing accents). MapLibre GL JS works on mobile but needs full-screen treatment. |
| **Success Metrics** | Threat posture visible within 1 second of load. P1 alerts accessible within 1 tap. Category drill-down within 2 taps. Tree test success rate > 70% across 5 core tasks. |

---

## 2. Content Inventory

### 2.1 Complete Content Audit

Every data element currently rendered on the desktop spatial canvas, classified by type and mobile relevance.

| # | Content Element | Data Source Hook | Update Freq | Desktop Location | Mobile Priority | Notes |
|---|----------------|-----------------|-------------|-----------------|----------------|-------|
| 1 | Threat posture level (CRITICAL/HIGH/ELEVATED/GUARDED/LOW) | `useThreatPicture` | 120s | ThreatPictureCard, upper-left | **P0 -- Critical** | Single most important signal. Must be visible on launch. |
| 2 | Total active alert count | `useThreatPicture` | 120s | ThreatPictureCard | **P0 -- Critical** | Paired with posture level. |
| 3 | Overall trend direction + delta | `useThreatPicture` | 120s | ThreatPictureCard | **P1 -- High** | Contextualizes the count. |
| 4 | P1 (Critical) alert count | `usePriorityFeed` | 15s | PriorityFeedStrip | **P0 -- Critical** | Must animate/pulse when > 0. |
| 5 | P2 (High) alert count | `usePriorityFeed` | 15s | PriorityFeedStrip | **P1 -- High** | Paired with P1. |
| 6 | Most recent P1 alert title + severity | `usePriorityFeed` | 15s | PriorityFeedStrip | **P0 -- Critical** | Glanceable headline. |
| 7 | P1/P2 alert list (full) | `usePriorityFeed` | 15s | PriorityFeedPanel | **P1 -- High** | Scrollable list, 1 tap from posture. |
| 8 | 15 category cards (icon, name, alert count, source count, trend, P1/P2 badge) | `useCoverageMetrics` + `useThreatPicture` | 60s/120s | CoverageGrid (9-column) | **P1 -- High** | Cannot display 9-column grid. Needs mobile layout. |
| 9 | Coverage map (global, all categories) | `useCoverageMapData` | 30s | World-space, 1830x900px | **P1 -- High** | Full-screen on mobile when viewed. |
| 10 | Map markers (severity-colored, category-filtered) | `useCoverageMapData` | 30s | CoverageMap overlay | **P1 -- High** | Tap to inspect on mobile. |
| 11 | Coverage overview stats (categories covered, total alerts) | `useCoverageMetrics` | 60s | Left of grid | **P2 -- Medium** | Folded into header or summary card. |
| 12 | View mode toggle (Triaged / All Bundles / Raw) | `coverage.store` | n/a | Above map | **P2 -- Medium** | Segment control on mobile. |
| 13 | Time range selector (24h/7d/30d/custom) | `coverage.store` | n/a | Above map, right | **P2 -- Medium** | Compact selector or bottom sheet. |
| 14 | Map Ledger (severity color legend) | Static | n/a | Right of map | **P3 -- Low** | Collapsible or info button. |
| 15 | Alert detail panel (title, severity, priority, summary, event type, source, confidence, geo scope, timestamps) | `useCategoryIntel` | on-demand | Right of map (INSPECT) | **P1 -- High** | Bottom sheet on mobile. |
| 16 | Category detail scene -- alert list | `useCategoryIntel` | 45s | District left column | **P1 -- High** | Full-screen list on mobile. |
| 17 | Category detail scene -- severity breakdown | `useCoverageMapData` | 30s | District right column, top | **P2 -- Medium** | Inline in category header. |
| 18 | Category detail scene -- category map | `useCoverageMapData` | 30s | District right column, middle | **P1 -- High** | Full-width, reduced height. |
| 19 | Category detail scene -- source health table | `useCoverageMetrics` | 60s | District right column, bottom | **P3 -- Low** | On-demand, deep drill. |
| 20 | District dock -- category overview (name, description, sources, regions) | `useCoverageMetrics` | 60s | Side panel | **P2 -- Medium** | Integrated into category header. |
| 21 | Triage rationale panel (bundle detail + decision) | `useIntelBundles` | on-demand | Slide-over, z-45 | **P2 -- Medium** | Bottom sheet on mobile. |
| 22 | Geo summary panel (AI threat assessment, structured breakdown, recommendations) | `useLatestGeoSummary` | 120s | Slide-over, z-42 | **P2 -- Medium** | Full-screen or bottom sheet. |
| 23 | Geographic summaries -- key events list | `useLatestGeoSummary` | 120s | Inside GeoSummaryPanel | **P2 -- Medium** | Part of geo summary view. |
| 24 | Geographic summaries -- recommendations | `useLatestGeoSummary` | 120s | Inside GeoSummaryPanel | **P2 -- Medium** | Part of geo summary view. |
| 25 | Geographic summaries -- threats by category | `useLatestGeoSummary` | 120s | Inside GeoSummaryPanel | **P3 -- Low** | Deep drill within summary. |
| 26 | Geographic summaries -- severity distribution | `useLatestGeoSummary` | 120s | Inside GeoSummaryPanel | **P3 -- Low** | Deep drill within summary. |
| 27 | Intelligence summary availability (hourly/daily, global + regions) | `/console/summaries` | 120s | ThreatPictureCard row 4 | **P3 -- Low** | Metadata, not primary content. |
| 28 | Top 4 threat categories (from threat picture) | `useThreatPicture` | 120s | ThreatPictureCard row 3 | **P1 -- High** | Glanceable in posture card. |
| 29 | Top 4 regions by alert count | `useThreatPicture` | 120s | ThreatPictureCard row 3 | **P2 -- Medium** | Glanceable in posture card. |
| 30 | Command palette (search across intel) | `useIntelSearch` | on-demand | Cmd+K dialog, z-50 | **P1 -- High** | Search icon in header on mobile. |
| 31 | System status panel | Ambient | slow | World-space left | **Omit** | Ambient data, desktop only. |
| 32 | Feed panel (Intel Monitoring) | Ambient | slow | World-space left | **Omit** | Ambient data, desktop only. |
| 33 | Signal pulse monitor | Ambient | slow | World-space right | **Omit** | Ambient decoration. |
| 34 | Activity ticker | Ambient | slow | World-space right | **Omit** | Ambient decoration. |
| 35 | Horizon scan line | CSS animation | continuous | Fixed viewport overlay | **Keep** | 12s CSS-only gradient sweep, 1px, opacity: 0.03. Near-zero cost, iconic Oblivion aesthetic. |
| 36 | Session timecode | Timer | 1s | Fixed bottom-right | **Keep** | Repositioned to header area on mobile. Near-zero cost. |
| 37 | Calibration marks | Static | n/a | Fixed corners | **Omit** | Desktop chrome. |
| 38 | Top telemetry bar | Static/ambient | slow | Fixed top | **Omit** | Desktop chrome. |
| 39 | Bottom status strip | Static/ambient | slow | Fixed bottom | **Omit** | Desktop chrome. |
| 40 | Dot grid background | Static | n/a | World-space 20000x20000 | **Omit** | Spatial ZUI only. |
| 41 | Sector grid | Static | n/a | World-space | **Omit** | Spatial ZUI only. |
| 42 | Enrichment layer (halo glow, range rings) | Animated | continuous | World-space | **Omit** | Spatial ZUI only. |
| 43 | Minimap | `useSemanticZoom` | on-change | Fixed bottom-right | **Omit** | No spatial canvas on mobile. |
| 44 | Zoom indicator | `useSemanticZoom` | on-change | Fixed top-right | **Omit** | No spatial canvas on mobile. |
| 45 | Spatial breadcrumb | Camera state | on-change | Fixed top | **Omit** | Replaced by standard mobile breadcrumb. |
| 46 | Color scheme switcher | `settings.store` | n/a | Fixed top-right | **P3 -- Low** | Settings gear on mobile. |
| 47 | ThreatPulseBackground | CSS animation | continuous | Full viewport background | **Keep** | New mobile ambient effect. CSS radial gradient keyed to posture level (4s ELEVATED, 6s HIGH, off LOW). Near-zero cost. |

### 2.2 Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| **P0 -- Critical** | 4 | Must be visible within 1 second of page load |
| **P1 -- High** | 11 | Must be accessible within 1 tap |
| **P2 -- Medium** | 10 | Accessible within 2 taps |
| **P3 -- Low** | 5 | Accessible on demand (3+ taps) |
| **Omit** | 16 | Desktop-only spatial/ambient elements |

---

## 3. Information Hierarchy

### 3.1 What the User Sees First (Layer 0 -- Glance)

The mobile experience opens on a **Situation Screen** that answers the single most important question: **"Is anything on fire right now?"**

```
LAYER 0 -- VISIBLE ON LOAD (no interaction required)
----------------------------------------------------
+------------------------------------------+
|  TARVA logo            [search] [menu]   |    <- Minimal header, 44px
|------------------------------------------|
|  THREAT POSTURE: ████ ELEVATED ████      |    <- Posture badge, full-width
|  247 active  |  P1: 3  |  P2: 12  | +5% |    <- Single-line summary bar
|------------------------------------------|
|  LATEST P1: "7.2 Earthquake near..."     |    <- Most recent critical alert
|  Extreme | Seismic | 4m ago         [>]  |    <- Tap to expand
|------------------------------------------|
|  [MAP - Full width, ~40vh]               |    <- Touch-interactive map
|  Severity-colored markers                |
|  Category chip filters (horizontal)      |
|------------------------------------------|
|  Categories (2-col grid, scrollable)     |
|    SEIS  47  |  CON  23                  |
|    WX    18  |  FIR  12                  |
|    ...                                   |
+------------------------------------------+
|  [Situation] [Alerts] [Intel] [More]     |    <- Bottom tab bar
+------------------------------------------+
```

**Rationale:** Security analysts check their phone for one thing: "Has the threat level changed?" The posture level, P1 count, and most recent critical alert answer this in under 2 seconds. The map provides spatial context. The category grid shows distribution.

### 3.2 What the User Sees Second (Layer 1 -- One Tap)

| Tap Target | Destination | Content Revealed |
|------------|-------------|-----------------|
| Posture badge | Threat Picture detail | Full severity distribution, priority breakdown, top regions, trend delta |
| Latest P1 banner | Alert detail bottom sheet | Title, severity, summary, event type, geo scope, timestamps |
| P1/P2 counts | Priority Feed list | Full P1/P2 alert list, sortable, with severity dots |
| Any category card | Category Detail screen | Alert list + category map + severity breakdown |
| Map marker | Alert detail bottom sheet | Same as alert detail |
| Search icon | Search overlay | Full-text search across intel items |
| "Alerts" tab | Priority alerts tab | All P1/P2 alerts, filter by priority level |
| "Intel" tab | Geographic intelligence tab | Geo summaries by region, daily/hourly briefs |

### 3.3 What the User Sees Third (Layer 2 -- Two Taps)

| Path | Content |
|------|---------|
| Category > Alert row | Full alert detail (summary, event type, confidence, geo scope, timestamps) |
| Category > Source health | Source status table for that category |
| Intel tab > Region | Full AI geographic summary with breakdown, key events, recommendations |
| Alert detail > View on Map | Map zoomed to alert location |
| Threat Picture > Region row | Region-specific threat summary |
| Map > Filter > Time range | Time range selector (24h/7d/30d/all/custom) |

### 3.4 What Requires Deliberate Exploration (Layer 3 -- Three+ Taps)

| Path | Content |
|------|---------|
| Category > Alert > Source detail | Source key, confidence score, ingested/sent timestamps |
| Intel > Region > History | Previous hourly/daily summaries |
| Triage rationale | Bundle composition, member intel items, triage decision, analyst notes |
| View mode switch (Raw/Bundles/Triaged) > Bundles > Bundle detail | Triage decision details |
| Settings | Color scheme, notification preferences |
| Summary availability metadata | Which regions have hourly vs daily summaries |

---

## 4. Navigation Model Analysis

### 4.1 Models Evaluated

#### Option A: Bottom Tab Bar (Standard)

```
[Situation]  [Alerts]  [Map]  [Intel]  [More]
```

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Learnability | 5 | Universal mobile pattern, zero learning curve |
| Content coverage | 4 | 4 primary views plus overflow |
| Tap efficiency | 5 | Any primary view in 1 tap |
| Visual weight | 3 | 49px bottom bar is permanent chrome |
| Aesthetic fit | 2 | Standard iOS/Android tab bar clashes with Oblivion cinematic feel |
| Scalability | 3 | Limited to 5 tabs; overflow ("More") is a junk drawer |

**Verdict:** Functionally excellent, aesthetically generic. The Oblivion brief demands something with more visual identity.

#### Option B: Hub-and-Spoke (Threat-Centered)

```
                    [Map]
                      |
[Categories] --- POSTURE HUB --- [Alerts]
                      |
                   [Intel]
```

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Learnability | 3 | Less conventional; requires understanding the hub concept |
| Content coverage | 4 | Hub provides overview; spokes provide depth |
| Tap efficiency | 3 | Always requires return to hub between spokes |
| Visual weight | 4 | Hub can be visually dramatic (posture card as center) |
| Aesthetic fit | 4 | Matches Oblivion command-center feel |
| Scalability | 2 | Adding new spokes is awkward; cross-spoke navigation painful |

**Verdict:** Aesthetically strong but navigation friction is high. Cross-referencing between categories and alerts requires constant backtracking.

#### Option C: Single Scrolling Feed (Alert-Centric)

```
[Posture Header]
[P1 Alert Cards]
[P2 Alert Cards]
[Category Summary Cards]
[Map Preview]
[Geo Intel Cards]
```

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Learnability | 5 | Scroll is the most natural mobile gesture |
| Content coverage | 4 | Everything in one stream |
| Tap efficiency | 2 | Items at bottom require significant scrolling |
| Visual weight | 5 | No persistent navigation chrome |
| Aesthetic fit | 4 | Can be made cinematic with full-bleed cards |
| Scalability | 4 | New content types are just new cards |

**Verdict:** Great for consumption but poor for task-directed access. An analyst looking for a specific category must scroll past everything else. Not suitable for "check the map" workflows.

#### Option D: Hybrid -- Minimal Tab Bar + Cinematic Content (Recommended)

```
+------------------------------------------+
|  Cinematic content area                  |
|  (scrollable, full-screen feel)          |
|  Bottom sheets for detail                |
|  Swipe between related views             |
+------------------------------------------+
|  ▪ Situation    ▪ Map    ▪ Intel    ☰    |   <- Ghost tab bar
+------------------------------------------+
```

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Learnability | 4 | Tab bar is familiar; 3 tabs is trivial |
| Content coverage | 5 | 3 primary views cover all content; hamburger for settings |
| Tap efficiency | 5 | Any primary view in 1 tap; detail via bottom sheets |
| Visual weight | 4 | Ghost bar (translucent, minimal) preserves cinematic feel |
| Aesthetic fit | 5 | Content-first; bar disappears into the aesthetic |
| Scalability | 4 | New content lives within existing tabs; 4th tab if needed |

**Verdict:** Best balance. Three primary tabs cover the three user intents (check status, see the map, read analysis). The ghost bar is barely visible until needed. Content fills the screen. Detail views use bottom sheets, preserving context.

### 4.2 Recommendation

**Option D: Hybrid -- Minimal Ghost Tab Bar + Cinematic Content.**

Three tabs, not five. Each tab is a complete workspace:
- **Situation** -- Threat posture, priority alerts, category overview (the "dashboard")
- **Map** -- Full-screen map with filters, marker inspection, time range
- **Intel** -- Geographic summaries, daily briefs, regional analysis

A fourth icon (hamburger or gear) provides access to settings, about, and logout.

---

## 5. Recommended Navigation Architecture

### 5.1 Navigation Tree

```
Mobile Root
├── Situation (Tab 1 -- default)
│   ├── Threat Posture Header [always visible at top]
│   │   ├── Posture level badge (CRITICAL/HIGH/ELEVATED/GUARDED/LOW)
│   │   ├── Active alert count + trend
│   │   └── P1 count | P2 count [tap -> Priority Feed]
│   ├── Latest P1 Alert Banner [conditional, only when P1 > 0]
│   │   └── [tap -> Alert Detail Bottom Sheet]
│   ├── Category Grid (2-column, scrollable)
│   │   ├── Category Card (x15, sorted by alert count desc, dampened re-sort)
│   │   │   ├── Icon + Name + Short Code
│   │   │   ├── Alert Count + Trend Arrow
│   │   │   ├── Priority Badge (if P1/P2 exist)
│   │   │   └── [tap -> Category Detail Screen]
│   │   └── [long-press -> Map Filter Shortcut]
│   ├── Top Threats Mini-Summary [collapsible]
│   │   ├── Top 4 categories by count
│   │   └── Top 4 regions by count
│   └── [pull-to-refresh -> all queries refetch]
│
├── Map (Tab 2)
│   ├── Full-Screen Map [fills viewport minus header and tab bar]
│   │   ├── Severity-colored markers
│   │   ├── Cluster aggregation at low zoom
│   │   └── [tap marker -> Alert Detail Bottom Sheet]
│   ├── Category Filter Chips [horizontal scroll, top of map]
│   │   ├── "All" chip (default)
│   │   └── Category chips (icon + short name, toggleable)
│   ├── View Mode Selector [compact, below filters]
│   │   ├── Triaged | All Bundles | Raw
│   │   └── Count badges
│   ├── Time Range Selector [bottom sheet trigger]
│   │   └── 24h | 7d | 30d | All | Custom
│   ├── Map Ledger [info button -> overlay]
│   └── Alert Detail Bottom Sheet [on marker tap]
│       ├── Title + Severity Badge + Priority Badge
│       ├── Short Summary
│       ├── Event Type + Source
│       ├── Confidence Bar
│       ├── Geographic Scope Tags
│       ├── Timestamps (Ingested, Sent)
│       └── [Action: View Category ->] Category Detail
│
├── Intel (Tab 3)
│   ├── Priority Feed Section [top, expandable]
│   │   ├── P1 Alerts (sorted by time desc)
│   │   ├── P2 Alerts (sorted by time desc)
│   │   └── [tap alert -> Alert Detail Bottom Sheet]
│   ├── Geographic Summaries Section
│   │   ├── Global Summary Card
│   │   │   ├── Threat level + generated timestamp
│   │   │   ├── Summary text (truncated, tap to expand)
│   │   │   └── [tap -> Full Summary Screen]
│   │   └── Regional Summary Cards (11 regions)
│   │       ├── Region name + threat level + trend
│   │       ├── Alert count + top category
│   │       └── [tap -> Region Detail Screen]
│   └── Threat Picture Detail [expandable section]
│       ├── Severity distribution bar
│       ├── Priority breakdown
│       └── Regional breakdown table
│
├── Category Detail Screen [push navigation from Situation tab]
│   ├── Category Header
│   │   ├── Back arrow + Category name + icon
│   │   ├── Alert count + source count + trend
│   │   └── Severity breakdown bar (inline)
│   ├── View Toggle: [List] [Map]
│   │   ├── List View
│   │   │   ├── Sort: Severity | Time
│   │   │   ├── Priority Filter: P1 | P2 | P3 | P4
│   │   │   ├── Alert rows (severity badge, priority badge, title, time)
│   │   │   └── [tap row -> Alert Detail Bottom Sheet]
│   │   └── Map View
│   │       ├── Category-filtered map (full width)
│   │       └── [tap marker -> Alert Detail Bottom Sheet]
│   └── Source Health [expandable footer section]
│       ├── Source name + status dot + region + frequency
│       └── Scrollable table
│
├── Region Detail Screen [push navigation from Intel tab]
│   ├── Region Header (name + threat level + trend)
│   ├── AI Summary Text (full)
│   ├── Key Events List
│   ├── Threats by Category Breakdown
│   ├── Severity Distribution
│   ├── Recommendations
│   └── Summary History (hourly/daily tabs)
│
└── Settings (Hamburger / Gear icon)
    ├── Color Scheme (Light/Dark/System)
    ├── Notification Preferences
    ├── Session Info
    └── Logout
```

### 5.2 Navigation Depth Analysis

| Destination | Taps from Launch | Acceptable? |
|-------------|-----------------|-------------|
| Threat posture level | 0 (visible) | Yes (P0 target: 0 taps) |
| P1 alert count | 0 (visible) | Yes (P0 target: 0 taps) |
| Latest P1 alert title | 0 (visible) | Yes (P0 target: 0 taps) |
| Full P1 alert detail | 1 (tap banner) | Yes (P1 target: 1 tap) |
| Priority feed (all P1/P2) | 1 (tap Intel tab) | Yes (P1 target: 1 tap) |
| Any category card | 0 (scroll, visible) | Yes (P1 target: 1 tap to drill) |
| Category alert list | 1 (tap category) | Yes (P1 target: 1 tap) |
| Full-screen map | 1 (tap Map tab) | Yes (P1 target: 1 tap) |
| Map marker detail | 2 (Map tab + tap marker) | Yes |
| Geographic summary | 1 (tap Intel tab) | Yes |
| Region detail | 2 (Intel tab + tap region) | Yes |
| Individual alert metadata | 2 (category + tap alert) | Yes |
| Source health table | 3 (category + scroll + expand) | Acceptable for P3 |
| Triage rationale | 3 (view mode + bundle + detail) | Acceptable for P3 |
| Color scheme change | 2 (menu + settings) | Acceptable |

**Maximum depth for any content: 3 taps.** No content requires more than 3 interactions to reach.

---

## 6. Progressive Disclosure Strategy

### 6.1 Disclosure Layers

```
LAYER 0: Ambient Awareness (0 taps, visible on load)
------------------------------------------------------
- Threat posture level and badge color
- Total active alert count
- P1 alert count (with pulse animation when > 0)
- P2 alert count
- Most recent P1 alert headline
- Overall trend direction indicator

LAYER 1: Primary Interaction (1 tap)
------------------------------------------------------
- Full priority alert list (P1/P2 with detail)
- Category detail screen (alert list + severity breakdown)
- Full-screen interactive map
- Geographic intelligence summaries
- Search overlay

LAYER 2: Contextual Detail (2 taps)
------------------------------------------------------
- Individual alert detail (summary, event type, confidence, geo scope)
- Map marker inspection
- Region-specific threat assessment
- View mode switching (Raw/Bundles/Triaged)
- Time range filtering

LAYER 3: Expert Data (3+ taps)
------------------------------------------------------
- Source health table per category
- Triage rationale and bundle composition
- Summary history (previous hourly/daily summaries)
- Category-by-category breakdown within a region
- Confidence score details
```

### 6.2 Disclosure Mechanisms (Mobile-Specific)

| Mechanism | Used For | Aesthetic Treatment |
|-----------|----------|-------------------|
| **Bottom Sheet (half)** | Alert detail, time range selector | Glass morphism panel rising from bottom edge. Drag handle as a thin glowing line. Dark translucent backdrop. |
| **Bottom Sheet (full)** | Priority feed list, geo summary detail | Full-screen takeover with shared element transition from the card that triggered it. Back gesture to dismiss. |
| **Push Navigation** | Category detail, region detail | Slide-in from right with parallax background shift. Category color accent carries through as a thin border or glow. |
| **Expandable Section** | Source health, threat breakdown, top regions | Chevron indicator. Smooth height animation. Content fades in after container expands. |
| **Horizontal Scroll** | Category filter chips on map, priority filter pills | Scrollable chip row with fade gradient at edges. Active chips glow with category color. |
| **Pull-to-Refresh** | All data-bearing screens | Custom animation: thin horizontal scan line sweeps down, Oblivion-style. Replaces standard spinner. |
| **Segmented Control** | List/Map toggle in category detail, view modes | Ghost-glass pill selector. Active segment has subtle inner glow. |

### 6.3 What Gets Cut vs. Collapsed vs. Kept

| Desktop Element | Mobile Treatment | Rationale |
|----------------|------------------|-----------|
| Spatial ZUI engine (pan, zoom, semantic zoom) | **Cut entirely** | Mobile has no equivalent. Replaced by standard scrolling + tabs. |
| Ambient effects (dot grid, sector grid, range rings, halo) | **Cut entirely** | Performance cost on mobile. Cinematic feel achieved through dark glass, subtle gradients, and motion instead. |
| Scan line (HorizonScanLine) | **Kept** | 12s CSS-only gradient sweep, 1px, opacity: 0.03. Near-zero performance cost, iconic Oblivion aesthetic. |
| ThreatPulseBackground | **New for mobile** | CSS radial gradient keyed to posture level (4s ELEVATED, 6s HIGH, off LOW). Ambient threat-level awareness at near-zero cost. |
| Minimap + zoom indicator + breadcrumb | **Cut entirely** | No spatial canvas = no spatial navigation instruments. Standard mobile back/breadcrumb instead. |
| Session timecode | **Kept** | Repositioned to header on mobile. Near-zero cost. |
| Calibration marks, telemetry bars | **Cut entirely** | Desktop decorative chrome. |
| 9-column category grid | **Collapsed to 2-column grid** | 2 columns fit 375px+ screens with adequate touch targets. Sorted by alert count (most active first). |
| Category card hover overlay (2 buttons) | **Replaced with tap** | No hover on mobile. Single tap goes to category detail. Long-press for map filter shortcut. |
| ThreatPictureCard (320px, 4-row) | **Condensed to header strip** | Posture level + counts on single line. Tap expands to full detail. |
| Priority feed strip | **Elevated to header bar** | Persistent at top of Situation tab. |
| Map (1830x900px in world-space) | **Full-screen with overlay controls** | Map is a dedicated tab, not a world-space element. |
| Side dock panel (360px) | **Bottom sheet** | Standard mobile pattern. No persistent side panels on phones. |
| Slide-over panels (GeoSummary, Triage) | **Bottom sheet or push navigation** | Matches mobile convention. |
| Command palette (Cmd+K dialog) | **Search icon in header** | Tap search icon to open full-screen search overlay. |
| Color scheme switcher | **Moved to settings** | Not frequently accessed. |
| Logout button (vertical pill) | **Moved to settings/menu** | Not primary navigation. |

---

## 7. Mobile Content Prioritization

### 7.1 Priority Matrix

The matrix below cross-references **user frequency** (how often this content is accessed) with **urgency** (how time-sensitive it is) to determine mobile prominence.

```
                    URGENCY
                    High ──────────────────── Low
                    │                           │
         ┌──────────┼───────────────────────────┤
    High │ ZONE A   │  ZONE B                   │
         │ Always   │  1-tap access              │
  F      │ visible  │                            │
  R      │          │                            │
  E      │ Posture  │  Category cards            │
  Q      │ P1 count │  Map overview              │
  U      │ P1 title │  Search                    │
  E      │          │                            │
  N      ├──────────┼───────────────────────────┤
  C      │ ZONE C   │  ZONE D                   │
  Y      │ 1-tap    │  On-demand                 │
         │ access   │                            │
    Low  │          │                            │
         │ P2 count │  Source health              │
         │ Trend    │  Triage rationale           │
         │ Geo      │  Summary history            │
         │ summaries│  View modes                 │
         │          │  Time ranges                │
         └──────────┴───────────────────────────┘
```

### 7.2 Content Sizing for Mobile Viewports

Given a reference viewport of 375 x 812px (iPhone SE logical):

| Zone | Vertical Budget | Content |
|------|----------------|---------|
| Safe area (top) | 47px | Status bar |
| Header | 44px | Logo, search icon, menu icon |
| Posture strip | 56px (sticky, collapses to 44px single-line on scroll) | Posture badge + P1/P2 counts + trend. Sticky with collapse: shrinks to "ELEVATED | P1: 3" when user scrolls down. Horizontal scroll with CSS scroll-snap. |
| P1 banner | 64px | Most recent P1 alert (conditional) |
| Scrollable content | ~540px | Category grid, top threats, map preview |
| Tab bar + safe area (bottom) | 83px | 3 tabs + home indicator |
| **Total** | **812px** | |

This budget allows approximately **6-7 category cards** visible without scrolling in a 2-column layout (each card ~80px tall). The remaining 8-9 categories require a short scroll. This is acceptable because cards are sorted by alert count, so the most important categories are above the fold.

---

## 8. Screen-Level Content Mapping

### 8.1 Situation Tab (Default View)

```
┌──────────────────────────────────┐
│  ── TARVA ──        🔍    ☰     │  Header: 44px
│──────────────────────────────────│
│  ◆ ELEVATED    247 active   ↑5% │  Posture strip: 56px
│  P1: 3 (pulsing)  |  P2: 12    │  Tap P1 -> Priority Feed
│──────────────────────────────────│
│  ⚠ 7.2 Earthquake off coast of  │  P1 Banner: 64px (conditional)
│  Extreme | SEIS | 4m ago    [>] │  Tap -> Alert Detail Sheet
│──────────────────────────────────│
│ ┌──────────┐ ┌──────────┐       │
│ │ ⚡ SEIS   │ │ 🛡 CON   │       │  Category Grid: 2-col
│ │    47  ↑  │ │    23  ─ │       │  Cards: 80px each
│ │ 3 src  P1 │ │ 5 src    │       │  Sorted by alert count
│ └──────────┘ └──────────┘       │
│ ┌──────────┐ ┌──────────┐       │
│ │ ☁ WX     │ │ 🔥 FIR   │       │
│ │    18  ↓  │ │    12  ↑ │       │
│ │ 4 src     │ │ 2 src P2 │       │
│ └──────────┘ └──────────┘       │
│ ┌──────────┐ ┌──────────┐       │  ... scrollable
│ │ ⛰ GEO    │ │ ⚠ DIS   │       │
│ │     8  ─  │ │     6  ─ │       │
│ └──────────┘ └──────────┘       │
│              ...                 │
│──────────────────────────────────│
│  ▪ Situation    ▪ Map    ▪ Intel│  Tab bar: 49px + 34px safe
└──────────────────────────────────┘
```

**Content density:** 4-6 category cards visible without scroll, posture always visible. The P1 banner only appears when P1 > 0, freeing vertical space when all clear.

### 8.2 Map Tab

```
┌──────────────────────────────────┐
│  ── TARVA ──        🔍    ☰     │  Header: 44px
│──────────────────────────────────│
│  [All] [SEIS] [CON] [WX] [FIR]→│  Filter chips: 40px, h-scroll
│──────────────────────────────────│
│                                  │
│                                  │
│         ┌─── MAP ───┐            │  Map: fills remaining space
│         │  markers   │            │  (~600px on iPhone SE)
│         │  clusters  │            │
│         │            │            │
│         │            │            │
│         │            │            │
│         └────────────┘            │
│                                  │
│                                  │
│──────────────────────────────────│
│  [Triaged|Bundles|Raw]    [24h]→│  Controls: 40px
│──────────────────────────────────│
│  ▪ Situation    ▪ Map    ▪ Intel│  Tab bar
└──────────────────────────────────┘
```

**On marker tap:** Half-height bottom sheet slides up with alert detail. Map remains visible behind sheet. Sheet can be dragged to full height for complete detail.

### 8.3 Intel Tab

```
┌──────────────────────────────────┐
│  ── TARVA ──        🔍    ☰     │  Header
│──────────────────────────────────│
│  PRIORITY ALERTS                 │  Section header
│  ┌──────────────────────────────┐│
│  │ ◆ P1  Extreme | SEIS        ││  P1 alert card
│  │ 7.2 Earthquake off coast... ││  Tap -> detail sheet
│  │                       4m ago ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ ▲ P2  Severe | CON          ││  P2 alert card
│  │ Armed clashes in northern...││
│  │                      12m ago ││
│  └──────────────────────────────┘│
│  ... more P1/P2 alerts           │
│──────────────────────────────────│
│  GEOGRAPHIC INTELLIGENCE         │  Section header
│  ┌──────────────────────────────┐│
│  │ 🌍 Global  ELEVATED   ↑     ││  World summary card
│  │ Heightened seismic act...    ││  Tap -> full summary
│  │ hourly: 23m ago | daily: 4h ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ Middle East  HIGH      ↑    ││  Regional summary
│  │ Escalating conflict in...   ││
│  └──────────────────────────────┘│
│  ... more regional summaries     │
│──────────────────────────────────│
│  ▪ Situation    ▪ Map    ▪ Intel│  Tab bar
└──────────────────────────────────┘
```

### 8.4 Category Detail Screen (Push from Situation)

```
┌──────────────────────────────────┐
│  ← Back         SEISMIC    ⚡    │  Header with back navigation
│──────────────────────────────────│
│  47 alerts  |  3 sources  |  ↑  │  Summary strip
│  ████████░░ Severity breakdown   │  Inline severity bar
│──────────────────────────────────│
│  [List]  [Map]                   │  View toggle
│──────────────────────────────────│
│  Sort: [Severity▼] [Time]       │  Sort + filter controls
│  Filter: [P1] [P2] [P3] [P4]   │  Priority pills
│──────────────────────────────────│
│  ┌──────────────────────────────┐│
│  │ ■ Extreme ◆P1               ││  Alert row
│  │ 7.2 Earthquake off coast... ││
│  │                       4m ago ││
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ ■ Severe                     ││  Alert row
│  │ Aftershock sequence cont... ││
│  │                      12m ago ││
│  └──────────────────────────────┘│
│  ... scrollable alert list       │
│──────────────────────────────────│
│  ▸ Source Health (3 sources)     │  Expandable footer
│──────────────────────────────────│
│  ▪ Situation    ▪ Map    ▪ Intel│  Tab bar
└──────────────────────────────────┘
```

### 8.5 Alert Detail Bottom Sheet

```
┌──────────────────────────────────┐
│                                  │  Map or list visible behind
│          (translucent)           │  sheet backdrop
│                                  │
│──────────── ─── ─────────────────│  Drag handle (glowing line)
│  ■ EXTREME                       │  Severity badge
│  ◆ CRITICAL (P1)                │  Priority badge
│──────────────────────────────────│
│  7.2 Magnitude Earthquake Off   │  Title
│  the Coast of Papua New Guinea   │
│──────────────────────────────────│
│  A 7.2 magnitude earthquake     │  Summary text
│  struck 45km NW of Rabaul...    │
│──────────────────────────────────│
│  Event Type    earthquake        │  Metadata rows
│  Source        usgs-feed         │
│  Confidence    ████████░░ 82%   │
│  Scope         PG, AU, SB       │  Geo scope tags
│──────────────────────────────────│
│  Ingested    Mar 6, 2026 14:23  │  Timestamps
│  Sent        Mar 6, 2026 14:25  │
│──────────────────────────────────│
│  [View Category: Seismic    →]  │  Action button
└──────────────────────────────────┘
```

---

## 9. Contextual Navigation Flows

### 9.1 Primary User Flows

#### Flow A: "Check Threat Level" (Most Common, <2 seconds)

```
Launch App
    └─> Situation tab loads (default)
        └─> Eyes land on posture badge: "ELEVATED"
            └─> See P1 count: "3"
                └─> Read P1 banner: "7.2 Earthquake..."
                    └─> DONE (situational awareness achieved)
```

#### Flow B: "Investigate a P1 Alert" (2-3 taps)

```
Situation tab
    └─> Tap P1 banner
        └─> Alert Detail Bottom Sheet opens
            ├─> Read summary, severity, geo scope
            ├─> [Option A] Tap "View Category: Seismic"
            │       └─> Push to Category Detail screen
            │           └─> Full alert list + category map
            └─> [Option B] Swipe sheet down to dismiss
                └─> Back to Situation tab
```

#### Flow C: "Check a Specific Category" (1-2 taps)

```
Situation tab
    └─> Scroll to category card (e.g., "Conflict")
        └─> Tap card
            └─> Push to Category Detail screen
                ├─> Alert list (sorted by severity)
                ├─> Toggle to Map view
                └─> Tap alert row
                    └─> Alert Detail Bottom Sheet
```

#### Flow D: "Explore the Map" (1-3 taps)

```
Map tab (1 tap)
    └─> Full-screen map loads with all markers
        ├─> Pinch to zoom, pan
        ├─> Tap category filter chip (e.g., "SEIS")
        │       └─> Map filters to seismic markers only
        ├─> Tap a marker
        │       └─> Alert Detail Bottom Sheet (half height)
        │           └─> Drag up for full detail
        └─> Tap time range (e.g., "24h")
                └─> Markers filter to last 24 hours
```

#### Flow E: "Read Geographic Intelligence" (1-2 taps)

```
Intel tab (1 tap)
    └─> Scroll past priority alerts
        └─> See geographic summary cards
            └─> Tap "Middle East" card
                └─> Push to Region Detail screen
                    ├─> Full AI summary text
                    ├─> Key events list
                    ├─> Recommendations
                    └─> History (hourly/daily tabs)
```

### 9.2 Cross-Tab Navigation

Users should not be forced to return to a tab to access related content on another tab. The following cross-links are provided:

| From | To | Mechanism |
|------|-----|-----------|
| Alert Detail sheet (any context) | Category Detail screen | "View Category" action button |
| Alert Detail sheet (map context) | Map zoomed to location | "Show on Map" action button |
| Category card (Situation tab) | Map filtered to that category | Long-press shortcut |
| Geo summary card (Intel tab) | Map filtered to that region | "View on Map" action |
| Priority feed (Intel tab) | Alert Detail sheet | Tap any alert row |
| Category Detail > Alert Detail | Map with marker highlighted | "Show on Map" action |

### 9.3 Back Navigation

| Context | Back Action | Result |
|---------|------------|--------|
| Category Detail screen | System back gesture or back arrow | Return to Situation tab (scroll position preserved) |
| Region Detail screen | System back gesture or back arrow | Return to Intel tab (scroll position preserved) |
| Alert Detail Bottom Sheet | Swipe down or tap backdrop | Dismiss sheet, return to underlying view |
| Search overlay | System back gesture or cancel button | Dismiss overlay |
| Settings screen | System back gesture or back arrow | Return to previous tab |
| Time range bottom sheet | Swipe down or tap backdrop | Dismiss sheet |

---

## 10. Search and Filter IA

### 10.1 Search Architecture

The desktop uses a Command Palette (Cmd+K) for search. On mobile, this becomes a search overlay triggered by a persistent search icon in the header.

```
Search Entry Points:
├── Header search icon (visible on all tabs) -> opens search overlay
└── "Search" action in category detail (pre-scoped to category)
```

**Note:** Pull-down gesture is reserved exclusively for pull-to-refresh. Search is accessed via the header icon (search overlay), not a pull-down gesture.

**Search Scope:** All intel items across all categories. Results grouped by category with severity indicators.

**Search Result Structure:**

```
┌──────────────────────────────────┐
│  🔍 earthquake                   │  Search input
│──────────────────────────────────│
│  SEISMIC (12 results)            │  Category group header
│  ┌──────────────────────────────┐│
│  │ ■ Extreme  7.2 Earthquake...││  Result row
│  │ PG, AU | 4m ago              ││  Tap -> Alert Detail
│  └──────────────────────────────┘│
│  ┌──────────────────────────────┐│
│  │ ■ Severe   5.4 Aftershock...││
│  │ PG | 1h ago                  ││
│  └──────────────────────────────┘│
│  DISASTER (3 results)            │  Next category group
│  ...                             │
└──────────────────────────────────┘
```

### 10.2 Filter Architecture

Filters are contextual -- they appear where they are relevant, not in a universal filter panel.

| Context | Available Filters | Mechanism |
|---------|------------------|-----------|
| **Map tab** | Category (multi-select chips), Time range (preset selector), View mode (segmented control) | Inline: chips at top, controls at bottom |
| **Category Detail (list view)** | Priority (P1/P2/P3/P4 toggle pills), Sort (severity/time segmented control) | Inline: pills below header |
| **Category Detail (map view)** | Source key (chip selector if >1 source), Bounding box (auto from viewport) | Inline: chips at top of map |
| **Intel tab (priority feed)** | Priority level (P1/P2 segment) | Inline: segmented control |
| **Search results** | Category (tap category group to collapse/expand) | Built into result grouping |

### 10.3 Filter State Persistence

| Filter | Persisted? | Mechanism |
|--------|-----------|-----------|
| Map category filters | Yes | URL search params (`?categories=seismic,conflict`) + coverage store |
| Map time range | Yes | URL search params (`?time=24h`) + coverage store |
| View mode | Yes | URL search params (`?mode=triaged`) + coverage store |
| Category detail sort order | No | Component state, resets on re-entry |
| Category detail priority filter | Yes | URL search params (`?priorities=P1,P2`) + coverage store |
| Search query | No | Cleared on dismiss |

---

## 11. Notification and Alert Display

### 11.1 Alert Hierarchy on Constrained Screens

On mobile, screen real estate demands strict triage of what gets attention. The existing desktop design already has a well-defined priority system; mobile enforces it more aggressively.

| Priority | Mobile Display | Animation | Persistence |
|----------|---------------|-----------|-------------|
| **P1 (Critical)** | Full-width banner below posture strip. Severity color accent. Title visible. | Pulse animation on P1 badge in posture strip. Banner slides in with spring ease. | Persistent until acknowledged or superseded by newer P1. |
| **P2 (High)** | Count in posture strip. Listed in Intel tab priority feed. | None (static count). Count increments with brief flash. | Visible in feed, not in banner. |
| **P3 (Standard)** | Visible only inside category detail alert lists. | None. | Not surfaced outside category context. |
| **P4 (Low)** | Hidden by default everywhere. Visible only with explicit priority filter in category detail. | None. | Filter-only, per desktop behavior. |

### 11.2 Real-Time Updates on Mobile

The existing polling intervals are appropriate for mobile with one adjustment:

| Data | Desktop Poll | Mobile Poll | Rationale |
|------|-------------|-------------|-----------|
| Priority feed (P1/P2) | 15s | 15s | Same. Critical alert latency must match. |
| Coverage metrics | 60s | 60s | Same. Category counts are not latency-sensitive. |
| Map markers | 30s | 30s when map tab is active, paused when not | Save bandwidth when map is not visible. |
| Threat picture | 120s | 120s | Same. Aggregated data, slow-changing. |
| Geo summaries | 120s | 120s when Intel tab is active, paused when not | Same. |

### 11.3 Push Notification Integration (Future)

While not in scope for the initial mobile view, the architecture should accommodate push notifications:

| Trigger | Notification Content | Tap Action |
|---------|---------------------|------------|
| New P1 alert | "[CRITICAL] {title}" with severity and category | Deep-link to Alert Detail on Situation tab |
| Posture level increase | "Threat posture elevated to {level}" | Deep-link to Situation tab |
| New geo summary | "New {region} threat assessment: {threat_level}" | Deep-link to Intel tab, region detail |

---

## 12. Data Density Analysis

### 12.1 Viewport Capacity

**Reference device:** iPhone SE (375 x 667px logical, smallest supported)

| Metric | Value |
|--------|-------|
| Total viewport height | 667px |
| Status bar | 20px |
| Header | 44px |
| Tab bar + home indicator | 83px |
| **Available content height** | **520px** |
| Available content width | 375px - 32px padding = 343px |

**Reference device:** iPhone 15 Pro Max (430 x 932px logical, largest common)

| Metric | Value |
|--------|-------|
| Total viewport height | 932px |
| Dynamic Island | 59px |
| Header | 44px |
| Tab bar + home indicator | 83px |
| **Available content height** | **746px** |
| Available content width | 430px - 32px padding = 398px |

### 12.2 Content Fitting Analysis -- Situation Tab

| Element | Height | iPhone SE Fit | iPhone 15 PM Fit |
|---------|--------|--------------|-----------------|
| Posture strip | 56px | Yes | Yes |
| P1 banner (when active) | 64px | Yes | Yes |
| 1st row of category cards (2 cards) | 80px | Yes | Yes |
| 2nd row of category cards (2 cards) | 80px | Yes | Yes |
| 3rd row of category cards (2 cards) | 80px | Yes | Yes |
| 4th row of category cards (2 cards) | 80px | Scroll needed | Yes |
| 5th row | 80px | Scroll needed | Yes |
| **Subtotal (with P1 banner)** | **520px** | 6 cards visible | 10 cards visible |
| **Subtotal (no P1 banner)** | **456px** | 8 cards visible | 12 cards visible |

**Conclusion:** On iPhone SE, 6-8 category cards are visible without scrolling (depending on P1 banner). On larger phones, 10-12 cards are visible. Since cards are sorted by alert count (most active first), the most important categories are always above the fold.

### 12.3 Category Card -- Mobile Design

The desktop card is ~150x140px. Mobile cards must be ~165x80px (2-column in 343px width with 8px gap).

**Information that fits in 165x80px:**

```
┌───────────────────────────┐
│  ⚡ SEISMIC           ◆P1 │   Icon + name + priority badge: 20px
│                           │
│  47 alerts  ↑             │   Primary metric + trend: 24px
│  3 sources                │   Secondary metric: 16px
│  ████████░░░              │   Severity micro-bar: 12px
└───────────────────────────┘
```

**What gets cut from desktop card:** Hover overlay (replaced by tap), animation variants (simplified), category description (available in detail view).

### 12.4 Map Tab -- Data Density

The map tab maximizes geographic real estate:

| Element | Height | Purpose |
|---------|--------|---------|
| Header | 44px | Logo, search, menu |
| Filter chips | 40px | Category multi-select |
| Map area | remaining (~500-640px) | Interactive map |
| Bottom controls | 40px | View mode + time range |
| Tab bar | 83px | Navigation |

**Marker density considerations:**
- At world zoom, markers should cluster to prevent overlap. MapLibre supercluster handles this.
- At city zoom, individual markers with severity color coding.
- Tap target for markers: minimum 44x44px hit area (larger than visual 12px dot).

---

## 13. Content Grouping Rationale

### 13.1 Tab Groupings -- Why These Three?

The three tabs map to three distinct **user intents** that security analysts cycle between:

| Tab | User Intent | Mental Model | Content Type |
|-----|------------|--------------|-------------|
| **Situation** | "What's happening right now?" | Status dashboard | Aggregated metrics, posture, category distribution |
| **Map** | "Where is it happening?" | Geographic awareness | Spatial data, markers, clusters, region context |
| **Intel** | "What should I know about it?" | Analytical briefing | Priority alerts, AI summaries, regional assessments |

**Alternative groupings considered and rejected:**

| Alternative | Why Rejected |
|-------------|-------------|
| "Dashboard / Alerts / Map / Regions / Settings" (5 tabs) | Too many tabs. "Alerts" and "Regions" are subsets of the analyst's workflow, not primary intents. Violates Miller's 4+/-1 for mobile tab bars. |
| "Feed / Map" (2 tabs) | Too few. Forces too much content into a single scrolling feed. Loses the distinction between "what's happening" (metrics) and "what should I know" (analysis). |
| "Map / Categories / Briefs" | "Categories" is a content structure, not a user intent. Users don't think "I need to see the categories" -- they think "what's the situation?" |

### 13.2 Within-Tab Content Grouping

#### Situation Tab Groups

| Group | Content | Ordering Rationale |
|-------|---------|-------------------|
| **Posture Zone** (sticky, collapses on scroll) | Threat level + counts + trend | Sticky: always visible. 56px expanded, collapses to 44px single-line ("ELEVATED | P1: 3") when user scrolls down. Horizontal scroll with CSS scroll-snap. Answers "is anything critical?" in <1 second. |
| **P1 Banner** (conditional) | Latest P1 alert headline | Only shown when P1 > 0. Demands immediate attention. Disappears when all clear, freeing space. |
| **Category Grid** (scrollable) | 15 category cards in 2-col layout | Sorted by alert count descending with dampening (re-sort only on refresh or when delta >= 2). Most active categories float to top. Provides complete coverage landscape. |
| **Top Threats Mini-Summary** (expandable, optional) | Top 4 categories + top 4 regions | Condensed from ThreatPictureCard. Collapsed by default to save space; expanded by tapping posture zone. |

#### Intel Tab Groups

| Group | Content | Ordering Rationale |
|-------|---------|-------------------|
| **Priority Alerts** (top) | P1 and P2 alert list | Highest urgency content. Analysts come to this tab specifically for priority alerts. |
| **Geographic Intelligence** (below) | World + regional AI summaries | Analysis content. Read after checking priority alerts. Ordered by threat level descending. |
| **Threat Picture Detail** (expandable) | Full severity/priority/region breakdowns | Deep data for extended analysis sessions. Hidden by default to avoid overwhelming. |

### 13.3 Category Card Ordering

Desktop displays all 15 categories in a fixed 9-column grid (left-to-right, defined order in `KNOWN_CATEGORIES`). Mobile must use a different strategy because:

1. Only 6-8 cards are visible without scrolling.
2. A fixed order means inactive categories may take prominent positions.
3. Users need to see the most relevant categories first.

**Mobile ordering rule:** Sort by `alertCount` descending, with a secondary sort by `p1Count + p2Count` descending. Categories with zero alerts sort to the bottom but are still shown (consistent with desktop's `buildAllGridItems` behavior).

**Sort dampening:** To prevent visual jitter during poll cycles, category cards only re-sort on manual refresh (pull-to-refresh) or when the alert count delta for a category is >= 2 since the last sort. Minor fluctuations (+/- 1 alert) do not trigger a re-sort.

**Tie-breaking:** When alert counts are equal, maintain the `KNOWN_CATEGORIES` array order as a stable fallback. This provides additional sort stability.

---

## 14. Card Sorting Recommendations

### 14.1 Recommended Studies

Before implementing the mobile navigation, the following validation studies should be conducted:

#### Study 1: Open Card Sort -- Mobile Content Organization

| Parameter | Value |
|-----------|-------|
| **Objective** | Discover how security analysts naturally group the dashboard's content objects on a mobile device |
| **Participants** | 15-20 security analysts (mix of roles: analyst, security_officer, hq_security) |
| **Cards** | 25 content cards representing all P0-P2 content elements from Section 2 |
| **Platform** | Optimal Workshop (remote, async) |
| **Analysis** | Dendrogram for natural grouping; similarity matrix for co-occurrence |

**Example cards:**
- "Threat posture level (e.g., ELEVATED)"
- "Number of P1 critical alerts"
- "Most recent P1 alert headline"
- "Seismic category -- 47 alerts"
- "Full-screen map with alert markers"
- "AI summary for Middle East region"
- "Priority alert list (P1 and P2)"
- "Severity distribution chart"
- "Filter alerts by time range"
- ... (25 total)

**Expected outcome:** Validates whether analysts group content into the three proposed tabs (Situation/Map/Intel) or reveal an alternative mental model.

#### Study 2: Closed Card Sort -- Category Grouping Validation

| Parameter | Value |
|-----------|-------|
| **Objective** | Validate whether the 15 categories are understood independently or if analysts mentally group them |
| **Participants** | 12-15 security analysts |
| **Cards** | 15 cards, one per category (using displayName, not shortCode) |
| **Groups (pre-defined)** | "Natural Hazards," "Conflict & Security," "Transport," "Infrastructure," "Multi-Category" |
| **Analysis** | Category-to-group agreement percentage |

**Expected outcome:** Determines whether the mobile UI should offer "super-categories" as a filter grouping (e.g., "All Natural Hazards" = seismic + geological + weather + storm + flood + fire). If agreement is >80% on super-categories, implement them as filter presets on the map.

#### Study 3: Tree Test -- Mobile Navigation Validation

| Parameter | Value |
|-----------|-------|
| **Objective** | Validate that users can find content within the proposed 3-tab navigation structure |
| **Participants** | 20-25 security analysts |
| **Tree** | The navigation tree from Section 5.1 (simplified labels) |
| **Tasks** | 8-10 findability tasks (see Section 16) |
| **Platform** | Optimal Workshop Treejack (remote, async) |
| **Success threshold** | >70% correct path on all tasks; >80% on P0 tasks |

---

## 15. Accessibility Specification

### 15.1 Semantic Structure

| Requirement | Implementation |
|-------------|---------------|
| **Tab bar** | `<nav role="tablist">` with `<button role="tab">` for each tab. `aria-selected` on active tab. `aria-controls` linking to tab panel. |
| **Tab panels** | `<div role="tabpanel" aria-labelledby="{tab-id}">` for each panel. |
| **Category grid** | `<ul role="list">` with `<li role="listitem">` per card. Not a `<table>`. |
| **Alert lists** | `<ul role="list">` with `role="listitem"` per alert. Selected alert has `aria-current="true"`. |
| **Bottom sheets** | `<div role="dialog" aria-modal="true" aria-label="{context}">`. Focus trap when open. Return focus to trigger on dismiss. |
| **Posture strip** | `role="status"` with `aria-live="polite"` for count updates. `aria-live="assertive"` for P1 count changes. |
| **Search overlay** | `<div role="search">` wrapping `<input type="search">` with `aria-label="Search intel alerts"`. Results in `role="listbox"` with `role="option"`. |
| **Severity badges** | `aria-label` including severity level text (not color-only). |
| **Priority badges** | Shape + weight already convey priority (AD-1 achromatic channel). `aria-label` includes "Critical," "High," etc. |

### 15.2 Touch Targets

| Element | Minimum Size | WCAG Target |
|---------|-------------|-------------|
| Tab bar buttons | 44 x 49px | AAA (44px) |
| Category cards | 165 x 80px | Exceeds |
| Alert list rows | full-width x 56px | Exceeds |
| Filter chips | 64 x 40px | AA (24px minimum), improved touch target compliance |
| Map markers (hit area) | 44 x 44px | AAA (visual may be smaller) |
| Back button | 44 x 44px | AAA |
| Search icon | 44 x 44px | AAA |
| Bottom sheet drag handle | full-width x 44px | AAA |

### 15.3 Focus Management

| Transition | Focus Behavior |
|-----------|---------------|
| Tab switch | Focus moves to first focusable element in new panel |
| Bottom sheet open | Focus moves to first element in sheet. Focus trapped inside sheet. |
| Bottom sheet close | Focus returns to the element that triggered the sheet |
| Push navigation (category detail) | Focus moves to back button in new screen header |
| Search overlay open | Focus moves to search input |
| Search overlay close | Focus returns to search icon |

### 15.4 Reduced Motion

| Element | Default | Reduced Motion |
|---------|---------|---------------|
| P1 pulse animation | Continuous pulse (2.5s cycle) | Static badge, no animation |
| Tab transition | Slide animation | Instant swap, no transition |
| Bottom sheet entry | Spring ease slide-up | Instant appear |
| Category card tap | Scale feedback | Opacity feedback only |
| Pull-to-refresh scan line | Sweep animation | Standard circular spinner |
| Trend arrows | Subtle bounce on update | Static icon |

---

## 16. Validation Plan

### 16.1 Tree Test Tasks

These tasks should be used with the navigation tree from Section 5.1 in Optimal Workshop Treejack:

| # | Task Description | Correct Path | Target Success |
|---|-----------------|--------------|---------------|
| 1 | "You want to check the current overall threat level for the organization." | Situation tab > Posture strip (visible on load) | >90% |
| 2 | "A P1 critical alert just came in. You want to read the full details." | Situation tab > Tap P1 banner > Alert Detail Sheet | >85% |
| 3 | "You want to see all seismic alerts currently being tracked." | Situation tab > Tap Seismic card > Category Detail | >80% |
| 4 | "You want to see where alerts are concentrated on a map." | Map tab | >90% |
| 5 | "You want to filter the map to only show conflict-related alerts." | Map tab > Tap "CON" filter chip | >75% |
| 6 | "You want to read the latest AI-generated threat assessment for the Middle East." | Intel tab > Geographic Intelligence > Tap Middle East card | >70% |
| 7 | "You want to see all P1 and P2 priority alerts in one list." | Intel tab > Priority Alerts section | >75% |
| 8 | "You want to change the map to show only the last 24 hours of data." | Map tab > Tap time range > Select "24h" | >70% |
| 9 | "You want to see what data sources feed into the weather category." | Situation > Weather card > Category Detail > Source Health (expand) | >60% |
| 10 | "You want to log out of the application." | Menu/gear icon > Settings > Logout | >80% |

### 16.2 First-Click Test Tasks

Run after tree test, using clickable wireframes:

| # | Task | Expected First Click | Success If |
|---|------|---------------------|-----------|
| 1 | "Check the threat level" | Posture strip area | Click anywhere on posture strip |
| 2 | "Find earthquake alerts" | Seismic category card OR search icon | Either is correct |
| 3 | "See the map" | Map tab | Map tab |
| 4 | "Read a threat briefing" | Intel tab | Intel tab |

### 16.3 Validation Timeline

| Phase | Method | When | Participants |
|-------|--------|------|-------------|
| Pre-build | Open card sort | Before implementation | 15-20 analysts |
| Pre-build | Tree test (navigation structure) | Before implementation | 20-25 analysts |
| Alpha | First-click test (wireframes) | After wireframes | 10-15 analysts |
| Beta | Usability test (prototype) | After initial build | 8-10 analysts |
| Post-launch | Navigation analytics + search log analysis | 2 weeks after deploy | All users (quantitative) |

---

## 17. Risks and Open Questions

### 17.1 Risks

| # | Risk | Impact | Likelihood | Mitigation |
|---|------|--------|-----------|------------|
| R1 | MapLibre GL JS performance on low-end mobile devices | Map lag/jank degrades trust in data freshness | Medium | Reduce default marker count; aggressive clustering; test on iPhone SE (A15 chip) |
| R2 | 15 categories are too many for a 2-column mobile grid | Visual overwhelm; users don't scroll past fold | Medium | Sort by alert count (most relevant on top); card sort study may reveal super-category grouping to reduce count |
| R3 | P1 banner consumes 64px of scarce vertical space | Less room for category cards when P1 is active | Low | Banner persists until tapped/acknowledged or superseded by a newer P1. No auto-dismiss timer. Space is reclaimed when all clear. |
| R4 | Bottom sheets compete for attention with map | Sheet obscures markers user wants to cross-reference | Medium | Half-sheet default (map still visible above); full-sheet only on explicit drag-up |
| R5 | Real-time polling (15s for priority feed) drains battery on mobile | Users may disable or avoid mobile app | Low | Poll only when tab is active and app is in foreground; use `document.visibilityState` |
| R6 | Oblivion aesthetic (very dark, low contrast) may fail WCAG contrast requirements | Accessibility violation; some text unreadable in sunlight | High | Audit all text against WCAG 2.2 AA (4.5:1 ratio). The desktop uses many `rgba(255,255,255,0.15-0.25)` values that will fail. Mobile must increase to at least 0.45 for body text. |
| R7 | "Intel" tab name may be unclear to non-analyst users | Users skip the tab, missing geo summaries | Medium | Card sort will validate. Alternatives: "Briefing," "Analysis," "Reports" |
| R8 | Long-press for map filter shortcut is undiscoverable | Users never learn the shortcut | Medium | Not critical path -- filter chips on Map tab are the primary mechanism. Long-press is a power-user accelerator. |

### 17.2 Open Questions

| # | Question | Owner | Decision Needed By |
|---|----------|-------|-------------------|
| Q1 | Should the mobile view be a separate route (`/mobile`) or a responsive breakpoint within the existing page? | Engineering Lead | Before implementation starts |
| Q2 | ~~Is the P1 banner dismissible per-alert or per-session?~~ **Resolved:** P1 banner persists until tapped/acknowledged or superseded by a newer P1. No auto-dismiss timer. | Product Owner | Resolved |
| Q3 | Should super-categories (Natural Hazards, Conflict, Transport) be pre-defined or derived from card sort results? | IA + Product | After card sort study |
| Q4 | What is the minimum viewport width for the ghost tab bar labels? Icons-only at 375px? Icons + labels at 390px+? | UX Designer | During wireframe phase |
| Q5 | Should the mobile view support landscape orientation for map usage? | Product Owner | Before implementation |
| Q6 | How should "view mode" (Triaged/Bundles/Raw) behave on mobile? Is it map-only or does it affect category detail alert lists too? | Product Owner | Before implementation |
| Q7 | Is offline support required? (Service worker caching of last-known posture + recent alerts) | Product Owner + Engineering | Before beta |
| Q8 | Should the mobile view support haptic feedback for P1 alert arrival? | UX Designer | During implementation |
| Q9 | What contrast ratios should ghost/ambient text use on mobile? Desktop uses 0.15-0.25 alpha which fails WCAG. Mobile needs higher contrast but this changes the aesthetic. | UX Designer + Accessibility | Before implementation |
| Q10 | Should the "Situation" tab remember scroll position when returning from a category detail push? | Engineering | During implementation |

### 17.3 Aesthetic Risk -- Oblivion vs. Accessibility

The desktop aesthetic deliberately uses very low contrast text (`rgba(255,255,255,0.15)` for labels, `rgba(255,255,255,0.25)` for content). On a bright OLED phone screen, especially outdoors, this text will be effectively invisible.

**Recommendation:** Define two contrast tiers for mobile:

| Tier | Desktop Alpha | Mobile Alpha | WCAG Level | Used For |
|------|--------------|-------------|------------|---------|
| **Primary text** | 0.40-0.60 | 0.70-0.90 | AA (4.5:1) | Alert titles, category names, counts |
| **Secondary text** | 0.20-0.30 | 0.45-0.55 | AA (4.5:1) | Timestamps, source names, metadata |
| **Ambient text** | 0.10-0.15 | 0.30-0.40 | Fails AA | Section labels, decorative text (acceptable for non-essential content if paired with icon/color) |

This preserves the dark cinematic feel while making the app usable in varied lighting conditions.

---

## Appendix A: Content-to-Hook Mapping

For implementation reference, every mobile content element mapped to its data source:

| Mobile Element | Hook(s) | Store Selector(s) | Polling |
|---------------|---------|-------------------|---------|
| Posture level + badge | `useThreatPicture()` | -- | 120s |
| Active alert count | `useThreatPicture()` | -- | 120s |
| P1/P2 counts | `usePriorityFeed()` | -- | 15s |
| P1 banner content | `usePriorityFeed()` | `.mostRecentP1` | 15s |
| Category cards | `useCoverageMetrics()` + `useThreatPicture()` | `buildAllGridItems()` | 60s/120s |
| Map markers | `useCoverageMapData(filters)` | `coverage.store: selectedCategories, mapTimePreset` | 30s |
| Map category filters | -- | `coverage.store: selectedCategories, toggleCategory` | -- |
| View mode | -- | `coverage.store: viewMode, setViewMode` | -- |
| Time range | -- | `coverage.store: mapTimePreset, setMapTimePreset` | -- |
| Bundle data (triaged/all modes) | `useIntelBundles(viewMode)` | `coverage.store: viewMode` | varies |
| Category alert list | `useCategoryIntel(categoryId)` | -- | 45s |
| Category map markers | `useCoverageMapData({ category })` | -- | 30s |
| Category sources | `useCoverageMetrics()` | `.sourcesByCoverage` | 60s |
| Alert detail | `useCategoryIntel(categoryId)` | `.find(id)` | 45s |
| Geographic summaries | `useAllGeoSummaries()` or `useLatestGeoSummary(level, key)` | -- | 120s |
| Region detail | `useLatestGeoSummary(level, key)` + `useGeoSummaryHistory(level, key, type)` | -- | 120s/on-demand |
| Priority feed list | `usePriorityFeed()` | `.items` | 15s |
| Search results | `useIntelSearch(query)` | -- | on-demand |
| Threat picture detail | `useThreatPicture()` | `.bySeverity, .byPriority, .byRegion` | 120s |
| Triage rationale | `useIntelBundles(viewMode)` + bundle detail | `coverage.store: selectedBundleId` | on-demand |

## Appendix B: Desktop-to-Mobile Component Mapping

| Desktop Component | Mobile Replacement | Reuse Strategy |
|-------------------|-------------------|----------------|
| `SpatialViewport` + `SpatialCanvas` | Standard scrollable layout | Not reused. Mobile has no spatial canvas. |
| `MorphOrchestrator` | 2-column `CategoryGrid` (new) | New component. Reuses `CategoryGridItem` type and `buildAllGridItems()` function. |
| `CategoryCard` | `MobileCategoryCard` (new) | New component, smaller. Reuses `CategoryMeta`, `CoverageByCategory` types. |
| `CoverageMap` | `CoverageMap` (reused, full-screen) | Same component. Pass `overview` prop. Use CSS to make full-width. |
| `ThreatPictureCard` | `MobilePostureStrip` (new) | New component. Same `useThreatPicture()` hook. Condensed layout. |
| `PriorityFeedStrip` | Integrated into `MobilePostureStrip` | P1/P2 counts in posture strip. |
| `PriorityFeedPanel` | Section in Intel tab | Reuses `usePriorityFeed()` hook and `PriorityFeedItem` type. |
| `CategoryDetailScene` | `MobileCategoryDetail` (new) | New layout (single column). Reuses `useCategoryIntel()`, `useCoverageMapData()`. |
| `DistrictViewDock` | Bottom sheet | New component. Reuses `CategoryIntelItem` type and detail content. |
| `AlertDetailPanel` | Bottom sheet | New component. Same data, bottom sheet layout. |
| `GeoSummaryPanel` | Push screen or bottom sheet | New layout. Reuses `useLatestGeoSummary()`, `GeoSummary` type. |
| `TriageRationalePanel` | Bottom sheet | New component. Same data. |
| `CommandPalette` | Search overlay (new) | New component. Reuses `useIntelSearch()` hook. |
| `NavigationHUD` | Mobile header (new) | New component. Logo + search + menu only. |
| `HorizonScanLine` | Kept | 12s CSS-only gradient sweep, 1px, opacity: 0.03. Reused as-is. |
| `SessionTimecode` | Kept (repositioned) | Reused from desktop, repositioned to mobile header. |
| `ThreatPulseBackground` | New for mobile | CSS radial gradient keyed to posture level (4s ELEVATED, 6s HIGH, off LOW). |
| Other ambient components (DotGrid, SectorGrid, RangeRings, HaloGlow, etc.) | Omitted | Not used on mobile. |

> **Cross-reference:** See `interface-architecture.md` for technical implementation details including code splitting strategy, component reuse patterns, state management approach, and morph fast path optimizations.

---

*Document version: 1.0.0 | Created: 2026-03-06 | Classification: Internal*
*Validation status: Pre-validation (card sort and tree test pending)*


---

## #every-time Review

**Reviewer:** every-time protocol v3.2
**Date:** 2026-03-06
**Cross-referenced against:** ux-strategy.md, ui-design-system.md, interface-architecture.md
**Codebase verified:** Yes (hooks, interfaces, store structure confirmed; all hook names verified)

### Rating: A -> A+ (after revisions)

All required changes from the #every-time review have been applied: ambient effects restored, ThreatPulseBackground added, P1 banner auto-dismiss removed, category sort dampening specified, posture strip scroll behavior defined, pull-down gesture conflict resolved, filter chip height increased, and Interface Architecture cross-referenced.

This is the strongest document of the four. It provides the most thorough content inventory, the only systematically evaluated navigation model, the most practical progressive disclosure strategy, and the most honest risk assessment. The 3-tab model (Situation, Map, Intel) is the best-justified navigation recommendation across all documents.

### Strengths

- **Navigation model evaluation is the gold standard.** Four options scored across six criteria with explicit verdicts. This is the only document that justifies its navigation choice rather than simply asserting it.
- **Content inventory is exhaustive.** 46 elements catalogued with data source hook, update frequency, desktop location, mobile priority, and notes. The P0-P3 priority classification with "Omit" for desktop-only elements gives implementers a clear cut list.
- **Progressive disclosure layers are the most practical.** The four-layer model (Ambient Awareness / Primary Interaction / Contextual Detail / Expert Data) with specific content assigned to each layer creates a clear implementation roadmap.
- **Data density analysis with per-device viewport calculations** gives concrete answers about what fits above the fold.
- **Card sorting study recommendations demonstrate rigorous IA methodology.** The tree test tasks serve as acceptance criteria even if formal studies aren't conducted.
- **Risk R6 (Oblivion aesthetic vs WCAG contrast)** is the most important risk identified across all four documents.
- **Tab grouping rationale** mapping tabs to user intents ("What's happening?", "Where is it?", "What should I know?") is persuasive.
- **Content-to-hook mapping** is the most implementation-useful table across all documents.

### Issues Found

1. **Cutting ALL ambient effects goes too far.** The scan line is the single most iconic Oblivion visual element and costs essentially nothing. The session timecode is similarly trivial. Recommendation: Retain scan line and session timecode.

2. **Missing: ThreatPulseBackground.** The UX Strategy's viewport-covering ambient gradient that shifts with threat posture is absent here. This effect directly addresses the Oblivion aesthetic requirement at near-zero cost.

3. **The "Intel" tab name is self-identified as a risk** but no decision is proposed. "Briefing" may be the strongest alternative.

4. **P1 banner "auto-hides after 30s"** could cause users to miss critical alerts. Better pattern: persist until user taps (acknowledges) or a newer P1 supersedes it.

5. **Category cards sorted by alert count means positions change on every poll cycle.** Mitigation: only re-sort when delta >= 2 alerts, or on manual refresh only.

6. **The "Situation" tab scroll behavior is ambiguous.** Recommendation: Make posture strip sticky but collapsible -- shrinks to single-line "ELEVATED | P1: 3" when user scrolls down.

7. **Pull-down search conflicts with pull-to-refresh.** Both use the same gesture on the same tab. Remove pull-down search; header search icon is sufficient.

8. **Filter chips at 64x36px** are below the 44px AAA threshold vertically. Consider increasing to 40px minimum.

### Cross-Document Conflicts

| Decision Point | This Document | Conflicts With |
|---|---|---|
| Tab count | 3 (Situation, Map, Intel) + hamburger | UX (4-item nav rail), UI (4 tabs), Interface (3 different tabs) |
| Ambient effects | Keep scan line + session timecode + ThreatPulseBackground; cut rest | Aligned with UX, UI, and Interface recommendations. |
| Default landing | Situation tab (posture-first) | UI (Map), Interface (Map). Agrees with UX. |
| Category card height | ~80px | UI: min-height 120px |
| Header height | 44px | UI (48px), Interface (48px) |

### Recommendations

1. **Retain scan line and session timecode** as mobile ambient effects. Near-zero cost, high aesthetic impact.
2. **Add ThreatPulseBackground** as a new mobile ambient effect.
3. **Replace P1 banner auto-hide timer** with interaction-based dismissal.
4. **Dampen category card re-sorting** to prevent visual jitter during polls.
5. **Make posture strip sticky with scroll-collapse behavior.**
6. **Resolve pull-down gesture conflict** between search and pull-to-refresh. Remove pull-down search.
7. **Increase filter chip height** to 40px for better touch target compliance.
8. **Cross-reference Interface Architecture** for technical implementation details.

### Required Changes Before Implementation

- [x] Restore scan line and session timecode to "Keep" status
- [x] Add ThreatPulseBackground to ambient effects
- [x] Remove P1 banner auto-hide timer; use interaction-based dismissal
- [x] Address category card re-sort jitter
- [x] Specify posture strip scroll behavior (recommend: sticky with collapse)
- [x] Resolve pull-down search vs pull-to-refresh gesture conflict
- [x] Increase filter chip height from 36px to 40px minimum
- [x] Cross-reference Interface Architecture for technical implementation


---

## Client Decisions (2026-03-06)

The following client decisions affect this document:

- **Q1 -- No offline support.** Online-only. No need to plan for stale data display or offline content hierarchy.
- **Q2 -- Landscape supported.** Content hierarchy must account for landscape viewports. In landscape, the Situation tab can use a side-by-side layout (posture strip on left, category grid on right). The Map tab is naturally landscape-friendly. The Intel tab can use two-column layout for summaries. Data density analysis should include landscape viewport calculations.
- **Q4 -- "Intel" tab name approved.** Ship as "Intel". No need for card sort study on tab naming (though other card sort recommendations remain valid).
- **Q6 -- Dynamic sort with dampening confirmed.** Categories sorted by alert count descending, re-sort only on manual refresh or when delta >= 2 alerts. KNOWN_CATEGORIES order as tie-breaker.
- **Q7 -- Bottom sheet with expand-to-full-screen.** Alert detail progressive disclosure: Layer 2 = bottom sheet (half/full snap), with an expand button that transitions to Layer 2.5 = full-screen overlay for deep reading. This adds a new disclosure mechanism to the progressive disclosure table.
- **Q8 -- Allow viewport zoom.** Confirmed. All contrast and touch target specs remain as-is.
