# Product Requirements: Data View Modes

**Project:** TarvaRI Alert Viewer
**Date:** 2026-03-04
**Status:** Draft
**Author:** Product Owner
**Specialist Plans:** [AIA Interface Architecture](aia-interface-architecture.md) | [UX Experience Design](ux-experience-design.md) | [UI Component Design](ui-component-design.md) | [Data Layer Architecture](data-layer-architecture.md)

---

## Table of Contents

1. [Problem Statement & Opportunity](#1-problem-statement--opportunity)
2. [User Stories](#2-user-stories)
3. [Acceptance Criteria Matrix](#3-acceptance-criteria-matrix)
4. [MVP Definition](#4-mvp-definition)
5. [Feature Priority Matrix](#5-feature-priority-matrix)
6. [Success Metrics](#6-success-metrics)
7. [Definition of Done](#7-definition-of-done)
8. [Dependencies & Risks](#8-dependencies--risks)
9. [Future Scope (V2+)](#9-future-scope-v2)

---

## 1. Problem Statement & Opportunity

### 1.1 What Users Cannot Do Today

The TarvaRI Alert Viewer currently displays **44 raw intel alerts** in a flat list with severity badges and map markers. Every alert receives equal visual weight. There is no differentiation between verified, triaged intelligence and unprocessed noise.

Specifically, users cannot:

- **See what matters.** All 44 alerts appear with the same card treatment. A verified Severe tropical storm warning looks identical to a Minor seismic tremor that was automatically rejected. There is no signal-to-noise separation.
- **Understand why something matters.** The TarvaRI backend runs an LLM-powered triage pipeline that clusters alerts into bundles, scores them with a Monte Carlo risk engine, and produces structured rationale for each approve/reject decision. None of this analysis is surfaced in the viewer.
- **Verify the system's work.** Users who want to build confidence in the automated triage have no way to inspect what was filtered out, why it was rejected, or how many sources corroborated a given assessment.
- **Make defensible decisions.** Security officers making GO/NO-GO travel decisions cannot currently point to a confidence score, a risk assessment, or a rationale. They can only screenshot a raw alert list.

### 1.2 What This Feature Enables

Three view modes give users progressive access to the full triage pipeline output:

| Mode | Question Answered | Data Source |
|------|-------------------|-------------|
| **Triaged** (default) | "What should I act on?" | Approved bundles only, with risk scores, confidence, and LLM rationale |
| **All Bundles** | "What was filtered and why?" | All bundles (approved + rejected) with triage decisions visible |
| **Raw Alerts** | "What came in?" | All `intel_normalized` rows (current behavior) |

The **confidence loop** connects these modes: recommendation (Triaged) leads to rationale (bundle detail) leads to evidence (member alerts) leads to raw data (Raw Alerts). Users can drill down for depth and return for summary, adjusting their trust in the system at each layer.

### 1.3 Business Value

| Value Driver | Impact |
|-------------|--------|
| **Faster decisions** | Security officers reach a defensible GO/NO-GO in under 5 minutes instead of manually reviewing 44 alerts (target: UX plan section 2.2) |
| **Higher platform trust** | Showing the triage reasoning (not just the output) addresses the primary analyst objection: "Black box triage is worse than no triage" (UX plan section 1.2) |
| **Reduced support burden** | Self-service confidence loop eliminates "Why did the system flag this?" support questions |
| **Stakeholder justification** | Exportable risk scores and rationale give security officers evidence for school boards, parents, and insurance |
| **Differentiation** | Competitors show alerts. TarvaRI shows decisions, reasoning, and confidence. This is the product's core value proposition. |

### 1.4 Users & Segments

Three personas, validated in the UX plan (section 1):

| Persona | Role | Primary Mode | Time Budget | Decision Model |
|---------|------|-------------|-------------|----------------|
| **Lt. Marcus Okafor** | School District Security Officer | Triaged | 5-15 min per destination | Binary GO/NO-GO with escalation. Errs on caution. |
| **Dr. Priya Nair** | SafeTrekr HQ Analyst | All three (loops) | 30-60 min deep-dive | Evidence-weighted. Wants to see rejected bundles. |
| **Sam Rivera** | HQ Operations Coordinator | Triaged | 2-5 min scan | Triage-by-exception. Monitors 8-15 trips simultaneously. |

All three share a cognitive flow: SCAN (10s) -> ASSESS (30s) -> INVESTIGATE (1-5m) -> DECIDE (30s) -> JUSTIFY (1-2m). The view modes map directly to this flow (UX plan section 1.4).

---

## 2. User Stories

### US-01: View Mode Switching

**Priority:** P0
**Persona:** All users
**Plans:** [AIA section 5.1](aia-interface-architecture.md#51-new-component-viewmodetoggle) | [UX section 5.1-5.3](ux-experience-design.md#51-view-mode-toggle-location) | [UI section 2](ui-component-design.md#2-viewmodetoggle) | [Data section 4](data-layer-architecture.md#4-state-management)

> **As a** security analyst viewing the TarvaRI dashboard,
> **I want to** switch between Triaged, All Bundles, and Raw Alerts views using a toggle in the header,
> **so that** I can choose the appropriate level of detail for my current task without navigating to a different page.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-01.1 | The dashboard is loaded | The page renders | The Triaged view mode is active by default and the toggle shows "TRIAGED" as selected |
| AC-01.2 | Any view mode is active | I click a different segment in the toggle | The active segment updates immediately, the URL updates via `replaceState`, and all data-dependent components re-render with the new mode's data |
| AC-01.3 | A category filter is active (`?category=weather`) | I switch view modes | The category filter is preserved; only the data substrate changes |
| AC-01.4 | A district view is open (morph state) | I switch view modes | The district view remains open; its content re-renders for the new mode with a 200ms crossfade |
| AC-01.5 | I navigate to `?view=bundles` directly | The page loads | The "All Bundles" mode is active and the toggle reflects this |
| AC-01.6 | I navigate to `?view=invalid` | The page loads | The default "Triaged" mode is active and the URL is corrected silently |
| AC-01.7 | I switch modes rapidly (3 clicks within 500ms) | Intermediate queries are in-flight | Only the final mode's data renders; intermediate queries are cancelled by TanStack Query key changes |

---

### US-02: Viewing Approved Bundles with Confidence Scores

**Priority:** P0
**Persona:** Security Officer, HQ Ops
**Plans:** [AIA section 2.1](aia-interface-architecture.md#21-triaged-view-default) | [UX section 4.1](ux-experience-design.md#41-data-hierarchy-per-view-mode) | [UI sections 3, 5, 6](ui-component-design.md#3-bundlecard) | [Data sections 2, 3](data-layer-architecture.md#2-query-design)

> **As a** security officer evaluating a travel destination,
> **I want to** see approved intel bundles on the dashboard with their risk scores, confidence levels, and severity badges,
> **so that** I can quickly assess the threat level without reading individual alerts.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-02.1 | Triaged mode is active and approved bundles exist | I view the category grid | Category cards show bundle count, highest severity badge, and risk score instead of raw alert counts |
| AC-02.2 | Triaged mode is active | I view a category card for "Weather" | The card shows "1 BUNDLE", "Severe" severity badge, and risk score indicator (currently 80) |
| AC-02.3 | Triaged mode is active | I view a category with no approved bundles | The card shows "No bundles" in dimmed text; the card remains clickable |
| AC-02.4 | Triaged mode is active | I view the global KPI stats | Stats show "X Approved Bundles", "Y Active Threats" (Severe/Extreme bundles), "Z Categories Covered" |
| AC-02.5 | Triaged mode is active | I view the feed panel | The feed shows approved bundle summaries with severity, confidence percentage, and relative timestamp instead of raw alert titles |

---

### US-03: Reading Triage Rationale

**Priority:** P0
**Persona:** Analyst, Security Officer
**Plans:** [AIA section 5.3](aia-interface-architecture.md#53-new-component-triagerationalepanel) | [UX section 6.4](ux-experience-design.md#64-llm-rationale-display) | [UI section 4](ui-component-design.md#4-triagerationalepanel) | [Data section 3.2](data-layer-architecture.md#32-hook-usebundledetail)

> **As an** analyst reviewing an approved bundle,
> **I want to** read the full LLM-generated triage rationale, including confidence metadata and source attribution,
> **so that** I can understand why this bundle was approved and assess whether I agree with the decision.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-03.1 | I am viewing a bundle in the district view | I click/expand the bundle card | The triage rationale panel appears showing: decision badge (APPROVED/REJECTED), reviewer version, rationale text, confidence metadata, and decided-at timestamp |
| AC-03.2 | The rationale panel is visible | I read the confidence metadata | I see structured data: model confidence percentage, source agreement ratio, and temporal coverage |
| AC-03.3 | The LLM note contains structured JSON metadata | The rationale panel renders | Metadata is parsed and displayed as labeled key-value pairs, not raw JSON |
| AC-03.4 | The triage decision is null (pending bundle) | I view the bundle detail | A "Pending" badge appears with messaging: "This bundle has not been triaged yet" |

---

### US-04: Drilling from Bundle to Evidence

**Priority:** P0
**Persona:** Analyst
**Plans:** [UX sections 3.4, 7.2](ux-experience-design.md#34-the-confidence-loop) | [AIA section 5.6](aia-interface-architecture.md#56-adapted-component-categorydetailscene) | [Data section 3.2](data-layer-architecture.md#32-hook-usebundledetail)

> **As an** analyst verifying an approved bundle,
> **I want to** drill into the bundle to see its member alerts and then switch to Raw Alerts mode to cross-reference the full data,
> **so that** I can verify the automated triage against the underlying evidence.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-04.1 | I have expanded a bundle in the district view | I view the "Member Alerts" section | I see a list of member alerts (up to 3 initially) with title, severity, and timestamp, plus a "Show More" control |
| AC-04.2 | I am viewing member alerts | I see the member count | The count matches the bundle's `member_intel_ids` length (e.g., "24 alerts from 3 sources") |
| AC-04.3 | I am viewing member alerts | I click "View All in Raw Mode" | The view mode switches to Raw Alerts, preserving the current category filter, so I see all raw alerts for this category |
| AC-04.4 | Member IDs reference deleted intel items | I view member alerts | A warning appears: "X of Y member alerts are no longer available (expired or deleted)" |
| AC-04.5 | I have drilled into evidence | I switch back to Triaged mode | The bundle-level view returns immediately (cache hit); no data is lost |

---

### US-05: Filtering Bundles by Category

**Priority:** P0
**Persona:** All users
**Plans:** [UX section 5.5](ux-experience-design.md#55-filter--view-mode-interaction-matrix) | [AIA section 3.3](aia-interface-architecture.md#33-cross-store-coordination) | [Data section 4.3](data-layer-architecture.md#43-how-viewmode-affects-active-hooks)

> **As a** security officer reviewing a specific threat category,
> **I want to** filter the dashboard by category while in any view mode,
> **so that** I can focus on weather, conflict, or other specific threats without losing my view mode context.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-05.1 | Triaged mode is active, no category filter | I click a category card | The district view opens showing approved bundles for that category |
| AC-05.2 | All Bundles mode is active | I click the Weather category card | The district view shows approved + rejected bundles for Weather |
| AC-05.3 | Raw Alerts mode is active | I click a category card | The district view shows the existing raw alert list (current behavior) |
| AC-05.4 | Category filter is active in Triaged mode | I switch to All Bundles | The same category remains filtered; rejected bundles for that category now appear |

---

### US-06: Map Visualization per Mode

**Priority:** P1
**Persona:** All users
**Plans:** [AIA section 2.4](aia-interface-architecture.md#24-visual-treatment-by-view-mode) | [UX section 7.3](ux-experience-design.md#73-map-progressive-disclosure) | [UI section 7](ui-component-design.md#7-map-marker-variants)

> **As a** user viewing the spatial dashboard,
> **I want to** see map markers that match my current view mode -- bundle centroids in Triaged/Bundles modes and individual alert points in Raw mode,
> **so that** the geographic visualization reflects the level of analysis I am reviewing.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-06.1 | Triaged mode is active and bundles have valid coordinates | Map renders | Markers show bundle centroids, sized by risk score, colored by final severity |
| AC-06.2 | All Bundles mode is active | Map renders | Approved bundles show solid markers; rejected bundles show hollow/outline markers with dimmed styling |
| AC-06.3 | Raw Alerts mode is active | Map renders | Current behavior: individual alert points with uniform size |
| AC-06.4 | I switch view modes | Map markers update | Old markers fade out (150ms), new markers fade in (150ms staggered); the map viewport (pan/zoom) is preserved |
| AC-06.5 | Bundle centroids have null coordinates | Triaged mode map renders | No markers appear; the map is empty but not broken; no error is shown |

**ASSUMPTION:** Current bundle data has null `representative_coordinates` (lat/lon are null). Map marker variants will not be visible until the triage pipeline populates coordinates. This story is P1 because it depends on upstream data availability. **Validation plan:** Verify coordinate population after next triage pipeline run.

---

### US-07: Understanding Rejected Bundles

**Priority:** P1
**Persona:** Analyst
**Plans:** [AIA section 2.2](aia-interface-architecture.md#22-all-bundles-view) | [UX sections 3.2, 9.3](ux-experience-design.md#32-analyst-reviewing-a-new-approved-bundle) | [UI section 3](ui-component-design.md#3-bundlecard)

> **As an** analyst auditing the triage pipeline,
> **I want to** see rejected bundles alongside approved ones in "All Bundles" mode, with clear visual distinction and accessible rejection rationale,
> **so that** I can verify the filter is working correctly and no real threats were missed.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-07.1 | All Bundles mode is active | Category cards render | Cards show split counts: "X approved / Y rejected" |
| AC-07.2 | All Bundles mode, district view open | Bundle list renders | Approved bundles appear first with full color; rejected bundles follow with a visual divider, "REJECTED" badge in red, and dimmed text |
| AC-07.3 | All Bundles mode | I expand a rejected bundle | The rejection rationale from the LLM is visible, explaining why this bundle was rejected |
| AC-07.4 | All Bundles mode | KPI stats render | Stats show "X Total Bundles (Y approved, Z rejected)" and the filter rate |
| AC-07.5 | All bundles are rejected (no approved bundles) | Triaged mode is active | A contextual notice appears: "All bundles were rejected by the triage engine..." with a "View All Bundles" action button |

---

### US-08: Keyboard Navigation of View Modes

**Priority:** P1
**Persona:** Analyst (power user, keyboard-heavy workflow)
**Plans:** [UX sections 5.4, 8.1-8.6](ux-experience-design.md#54-view-mode-toggle-keyboard-interaction) | [UI section 11](ui-component-design.md#11-accessibility-notes) | [AIA section 5.1](aia-interface-architecture.md#51-new-component-viewmodetoggle)

> **As an** analyst using a keyboard-heavy workflow,
> **I want to** navigate between view modes, expand bundle cards, and traverse the confidence loop entirely via keyboard,
> **so that** I can work efficiently without switching to the mouse.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-08.1 | Focus is on the view mode toggle | I press ArrowRight | The next view mode segment is activated |
| AC-08.2 | Focus is on the view mode toggle | I press Home/End | The first (Triaged) or last (Raw) segment is activated |
| AC-08.3 | Focus is on a bundle card in the district view | I press Enter | The bundle card expands to show rationale and member alerts |
| AC-08.4 | A bundle card is expanded | I press Escape | The card collapses and focus returns to the card header |
| AC-08.5 | I tab through the entire page | All interactive elements are reachable | The tab order follows: toggle -> category filter -> category grid -> map -> feed panel -> (district view when open) |
| AC-08.6 | View mode toggle is rendered | The toggle uses WAI-ARIA tablist pattern | `role="tablist"` on container, `role="tab"` on segments, `aria-selected` reflects active mode, roving tabindex pattern |

---

### US-09: Screen Reader Announcements

**Priority:** P1
**Persona:** Users with visual impairments
**Plans:** [UX section 8.2](ux-experience-design.md#82-screen-reader-announcements) | [UI section 11](ui-component-design.md#11-accessibility-notes)

> **As a** user relying on a screen reader,
> **I want to** hear announcements when the view mode changes, bundles expand, and data loads,
> **so that** I can navigate the dashboard without visual reference.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-09.1 | I switch to Triaged mode | The data renders | An `aria-live="polite"` region announces: "View mode changed to Triaged. Showing N approved bundle(s) across M categories." |
| AC-09.2 | I switch to All Bundles mode | The data renders | Announcement: "View mode changed to All Bundles. Showing N total bundles: A approved, R rejected." |
| AC-09.3 | I switch to Raw Alerts mode | The data renders | Announcement: "View mode changed to Raw Alerts. Showing N individual alerts across M categories." |
| AC-09.4 | I expand a bundle card | The detail renders | Announcement: "Expanded [Category] bundle detail. [Decision], [Severity] severity, risk score [X], confidence [Y] percent based on [Z] corroborating alerts." |
| AC-09.5 | Confidence score is displayed | Screen reader reads the element | The meter has `role="meter"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and a label like "Confidence: 88 percent, high." |

---

### US-10: Empty and Edge State Handling

**Priority:** P0
**Persona:** All users
**Plans:** [UX section 9](ux-experience-design.md#9-edge-cases) | [Data section 7](data-layer-architecture.md#7-error-handling--edge-cases)

> **As a** user arriving at the dashboard when the triage pipeline has not run,
> **I want to** see a clear, non-alarming notice that explains the data state and offers a path to the available data,
> **so that** I am not confused by an empty screen or led to believe there are no threats.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-10.1 | `intel_bundles` has 0 rows; `intel_normalized` has 44 rows | Triaged mode is active | A contextual notice appears: "No triaged bundles available. The triage pipeline may not have processed recent alerts yet. Switch to Raw Alerts to view unprocessed data." with a "Switch" action button |
| AC-10.2 | All bundles are rejected | Triaged mode is active | A notice appears explaining all bundles were rejected, with a "View All Bundles" button |
| AC-10.3 | A bundle has 0 resolvable member alerts | I expand the bundle | A warning appears: "No member alerts found. Bundle metadata may be inconsistent." Confidence meter shows a note about unreliable confidence. |
| AC-10.4 | Network error occurs during bundle fetch | Any bundle view mode | TanStack Query retries 3 times with backoff; on exhaustion, an error state renders with a "Retry" button |
| AC-10.5 | Most recent `ingested_at` is older than 15 minutes | Any view mode | A stale data indicator appears below the view mode toggle: "[!] LAST DATA: Xm AGO" with amber styling |

---

### US-11: View Mode Data Layer

**Priority:** P0
**Persona:** Development team (internal)
**Plans:** [Data sections 1-5](data-layer-architecture.md#1-typescript-type-definitions) | [AIA section 3](aia-interface-architecture.md#3-state-management-architecture)

> **As a** developer implementing view modes,
> **I want** TypeScript types, Zustand store extensions, TanStack Query hooks, and data transformation utilities that follow existing codebase patterns,
> **so that** the data layer is consistent, testable, and minimizes risk of regressions to existing functionality.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-11.1 | TypeScript types are added | Build runs (`pnpm typecheck`) | All new types compile without errors; existing types are unchanged |
| AC-11.2 | `coverage.store.ts` is extended with `viewMode` and `selectedBundleId` | Store is imported in components | Existing `selectedCategories` behavior is unchanged; new fields default to `'triaged'` and `null` |
| AC-11.3 | `useIntelBundles(viewMode)` hook is created | Called in Triaged mode | Returns approved bundles only from `intel_bundles` joined with `triage_decisions` |
| AC-11.4 | `useIntelBundles(viewMode)` hook is created | Called in All Bundles mode | Returns all bundles (approved + rejected) with triage decisions |
| AC-11.5 | `useIntelBundles(viewMode)` hook is created | Called in Raw mode | Query is disabled (`enabled: false`); returns `undefined` |
| AC-11.6 | `useBundleDetail(bundleId)` hook is created | Called with a valid bundle ID | Returns the bundle with resolved member intel items from `intel_normalized` |
| AC-11.7 | Transform functions are created | `bundlesToMarkers()`, `bundlesToFeedItems()`, `bundlesToCategoryMetrics()` are called | Pure functions return correctly shaped data matching existing `MapMarker`, `IntelFeedItem`, and category metric types |
| AC-11.8 | URL sync is extended | Page loads with `?view=all-bundles` | Store initializes with `viewMode: 'all-bundles'`; composable with existing `?category=` params |

---

### US-12: Transition Animations

**Priority:** P2
**Persona:** All users
**Plans:** [UX section 5.3](ux-experience-design.md#53-view-mode-toggle-behavior) | [UI section 10](ui-component-design.md#10-animation-inventory) | [AIA section 7](aia-interface-architecture.md#7-transition-choreography)

> **As a** user switching view modes,
> **I want** smooth visual transitions (crossfades, marker animations, toggle indicator slides)
> **so that** the data change feels like adjusting a lens, not jumping to a new page.

**Acceptance Criteria:**

| # | Given | When | Then |
|---|-------|------|------|
| AC-12.1 | I click a different view mode | The toggle indicator | It slides horizontally with a 150ms ease-out animation |
| AC-12.2 | I switch view modes | Data-dependent components update | A 200ms opacity crossfade: current data fades to 0.3, new data fades in from 0.3 to 1.0 |
| AC-12.3 | I expand a bundle card | The content area | Height animates from 0 to auto (300ms ease-out via `motion/react`); content fades in with 150ms delay |
| AC-12.4 | I switch modes rapidly | Animations are in progress | Animations are interrupted and restart from current state (interruptible via `motion/react`) |

---

## 3. Acceptance Criteria Matrix

Summary view mapping features to their testable criteria and edge case coverage.

| Feature | User Story | Criteria Count | Edge Cases Covered | Implementation Plan |
|---------|------------|----------------|--------------------|--------------------|
| View mode toggle (UI + state) | US-01 | 7 | Invalid URL value, rapid switching, district view open during switch | AIA section 5.1, UI section 2, Data section 4.1 |
| Bundle display on category cards | US-02 | 5 | Categories with no bundles, single bundle | AIA section 5.2, UI section 3, Data section 5.1 |
| Triage rationale panel | US-03 | 4 | Null decision (pending), malformed JSON in note | AIA section 5.3, UI section 4, Data section 3.2 |
| Confidence loop drill-down | US-04 | 5 | Deleted member alerts, empty member list | UX section 3.4, Data section 3.2 |
| Category filter preservation | US-05 | 4 | Filter + mode switch combo matrix (6 combinations) | UX section 5.5, Data section 4.3 |
| Map marker variants | US-06 | 5 | Null coordinates, mode switch with open map | UI section 7, Data section 5.1 |
| Rejected bundle display | US-07 | 5 | All rejected, mixed approval | UX section 9.3-9.4 |
| Keyboard navigation | US-08 | 6 | Focus management during morph, bundle expand/collapse | UX section 8.1-8.6, UI section 11 |
| Screen reader support | US-09 | 5 | Dynamic content updates, meter semantics | UX section 8.2 |
| Empty/edge states | US-10 | 5 | No bundles, all rejected, stale data, network error, data integrity | UX section 9, Data section 7 |
| Data layer (hooks + types + store) | US-11 | 8 | Race conditions, FK breakage, cache behavior | Data sections 1-5 |
| Animations | US-12 | 4 | Rapid switching interruption | UI section 10, AIA section 7 |

**Total: 63 acceptance criteria across 12 user stories.**

---

## 4. MVP Definition

### 4.1 MVP Scope (Minimum to Deliver the Confidence Loop)

The MVP must enable this end-to-end flow: a user lands on the dashboard, sees approved bundles with scores, reads the rationale, drills into member alerts, and can switch to raw data to verify. That is the confidence loop.

**In MVP:**

| Feature | User Stories | Rationale |
|---------|-------------|-----------|
| View mode toggle (3-segment, in header) | US-01 | Core navigation mechanism. Without it, nothing else works. |
| View mode state + URL sync | US-01, US-11 | Data plumbing that enables everything. |
| Category cards show bundle metrics in bundle modes | US-02 | Users must see the signal change when mode changes. |
| Triage rationale panel (expand bundle to see LLM note) | US-03 | The "why" is the entire value proposition. |
| Member alert preview (top 3 + "View All in Raw Mode" link) | US-04 | Completes the confidence loop. Without this, the drill-down dead-ends. |
| Category filter preservation across modes | US-05 | Without this, mode switching resets context and breaks flow. |
| Empty state: no bundles notice with "Switch to Raw" action | US-10 (AC-10.1) | Critical because current data may have 0 bundles at any time. |
| Error state: network failures with retry | US-10 (AC-10.4) | Essential reliability. |
| Data layer: types, store, hooks, transforms | US-11 | Foundation for all UI work. |
| Feed panel adapts to view mode | US-02 (AC-02.5) | Feed is prominent UI surface; inconsistency would confuse users. |
| KPI stats adapt to view mode | US-02 (AC-02.4) | Stats are prominent; stale labels would undermine trust. |

**Estimated scope: 10-12 components/hooks to create or modify.**

### 4.2 Deferred to V2

| Feature | User Stories | Rationale for Deferral |
|---------|-------------|----------------------|
| Map marker variants (bundle centroids vs raw points) | US-06 | Current bundle data has null coordinates. Map markers will not render even if built. Defer until triage pipeline populates `representative_coordinates`. |
| Rejected bundle display (All Bundles mode district view) | US-07 | Can ship with basic rejected bundle visibility on category cards. Full district view with reject rationale is polish. |
| Keyboard navigation (full roving tabindex) | US-08 | Valuable but not blocking for initial release. Toggle will have basic keyboard support (clicks work); full WAI-ARIA tablist pattern follows. |
| Screen reader announcements | US-09 | Important for accessibility compliance. Not blocking for alpha/internal testing. Must be in place before beta. |
| Transition animations (crossfades, stagger) | US-12 | Visual polish. Mode switching works without animation. |
| Stale data warning | US-10 (AC-10.5) | Useful but not critical for internal testing. |
| All-rejected notice | US-10 (AC-10.2) | Edge case that is unlikely given current data patterns. |

### 4.3 Cut Line Rationale

The cut line is drawn at: **"Can a user complete the confidence loop and make a decision?"**

Everything in MVP contributes to the SCAN -> ASSESS -> INVESTIGATE -> DECIDE cycle. Everything deferred is either polish (animations, keyboard), dependent on upstream data not yet available (map markers), or handling edge cases that are unlikely in the near term (all-rejected).

The one deliberate tension: deferring full accessibility (US-08, US-09) to V2. This is acceptable for internal/alpha testing but MUST be resolved before beta or any external user access.

---

## 5. Feature Priority Matrix

### P0 -- Must Have for Launch

These features are required for any deployable version. Without any single one, the confidence loop is broken.

| Feature | Story | Effort Est. | Implementation Phase |
|---------|-------|-------------|---------------------|
| TypeScript types (`IntelBundleRow`, `TriageDecisionRow`, `ViewMode`) | US-11 | S | Phase 1: Types & Store |
| `coverage.store.ts` extension (`viewMode`, `selectedBundleId`, URL sync) | US-11 | M | Phase 1: Types & Store |
| `useIntelBundles()` hook | US-11 | M | Phase 2: Hooks |
| `useBundleDetail()` hook | US-11 | M | Phase 2: Hooks |
| `bundle-transforms.ts` (markers, feed, category metrics) | US-11 | M | Phase 3: Transforms |
| `ViewModeToggle` component | US-01 | M | Phase 4: UI Integration |
| Category card bundle metrics (`CategoryCard` adaptation) | US-02 | M | Phase 4: UI Integration |
| Triage rationale panel | US-03 | M | Phase 4: UI Integration |
| Member alert preview (in expanded bundle) | US-04 | S | Phase 4: UI Integration |
| Feed panel mode adaptation | US-02 | S | Phase 4: UI Integration |
| KPI stats mode adaptation | US-02 | S | Phase 4: UI Integration |
| Empty state notice (no bundles) | US-10 | S | Phase 4: UI Integration |
| Error state (query failure + retry) | US-10 | S | Phase 4: UI Integration |

**S = Small (< 2 hours), M = Medium (2-4 hours)**

### P1 -- Should Have (Complete Before Beta)

These features round out the experience. They can follow the P0 launch by days, not weeks.

| Feature | Story | Effort Est. | Notes |
|---------|-------|-------------|-------|
| Map marker variants (bundle centroids) | US-06 | M | Blocked by upstream coordinate data |
| Rejected bundle display (All Bundles district view) | US-07 | M | Depends on P0 bundle display |
| Full keyboard navigation (WAI-ARIA tablist) | US-08 | M | Upgrade toggle from basic to spec-compliant |
| Screen reader announcements | US-09 | S | Add `aria-live` region and dynamic messages |
| Stale data warning indicator | US-10 | S | Simple UI; needs freshness query |
| All-rejected notice | US-10 | S | Copy variant of empty state |
| Confidence indicator component (bar + ring variants) | US-02 | M | Currently inlined; extract as reusable component |
| Risk score badge component | US-02 | S | Currently inlined; extract as reusable component |

### P2 -- Nice to Have (Future Sprints)

| Feature | Story | Effort Est. | Notes |
|---------|-------|-------------|-------|
| Transition animations (crossfade, stagger) | US-12 | M | Visual polish using `motion/react` |
| Analytics events (`view_mode_changed`, `bundle_expanded`) | -- | S | Required for success metrics; can instrument after launch |
| Responsive toggle (icon-only at narrow viewport) | US-01 | S | Desktop-first product; mobile is secondary |
| Bundle "new" indicator (pulse dot for recent bundles) | -- | S | Requires tracking last-visit timestamp |
| Prefetch other modes on hover | -- | S | Performance optimization for larger datasets |

---

## 6. Success Metrics

### 6.1 KPI Tree

```
North Star: Time to confident safety decision
    |
    +-- Driver 1: Information quality
    |     +-- Input: Confidence loop completion rate
    |     +-- Input: Bundle-to-evidence drill rate
    |     +-- Guardrail: False confidence rate (< 5%)
    |
    +-- Driver 2: Interface efficiency
    |     +-- Input: Time to first decision signal (< 10s)
    |     +-- Input: View mode discovery rate (80%+ in 30s)
    |     +-- Guardrail: Task abandonment rate
    |
    +-- Driver 3: System trust
          +-- Input: Self-reported confidence score (4+/5)
          +-- Input: Raw mode check rate (analysts verify pipeline)
          +-- Guardrail: Support ticket volume for "why was this flagged"
```

### 6.2 Success Metrics Detail

| Metric | Target | Measurement Method | When to Measure | Baseline |
|--------|--------|--------------------|-----------------|----------|
| **Time to first decision signal** | < 10 seconds from page load | Analytics event: time from `page.loaded` to first interaction with a bundle card or category card | Post-MVP, once analytics instrumented (P2) | No baseline (feature does not exist) |
| **Time to GO/NO-GO recommendation** | < 5 minutes (Security Officer) | Usability test: task completion time for "evaluate this destination" scenario | Alpha testing with internal team | No baseline |
| **View mode discovery rate** | 80%+ find toggle within 30 seconds | Usability test: first-time users, unguided. Measured via screen recording or click tracking. | Alpha testing | No baseline |
| **Confidence loop completion rate** | 60%+ of analyst sessions drill from Triaged to Raw at least once | Analytics: `view_mode_changed` events with `from=triaged` and `to=raw` in the same session | Post-analytics instrumentation | No baseline |
| **Self-reported confidence** | 4+ out of 5 | Post-task questionnaire: "How confident are you in the recommendation you just made?" | Usability tests during alpha and beta | No baseline |
| **Error rate** | < 5% false confidence | Expert review: decision + evidence pairs in controlled study. "Did the user express high confidence on a decision contradicted by available evidence?" | Beta phase, with 5+ users | No baseline |
| **Keyboard task completion** | 100% of view mode operations achievable without mouse | Accessibility audit: attempt all operations keyboard-only | Before beta release | No baseline |
| **Support ticket reduction** | 50% reduction in "why was this flagged" questions | Support ticket categorization. Baseline: count tickets tagged "alert-explanation" over 30 days pre-launch. | 30 days post-GA | Establish during MVP period |

### 6.3 Guardrail Metrics

| Guardrail | Threshold | Action if Breached |
|-----------|-----------|-------------------|
| **Page load time** | < 3 seconds (P95) with view mode initialization | Investigate bundle query performance; consider prefetch vs lazy-load trade-off |
| **Bundle query latency** | < 500ms (P95) | Review Supabase query plan; add indexes if needed |
| **Mode switch latency** | < 300ms perceived (cache hit) / < 1s (cache miss) | Enable TanStack Query prefetch for adjacent modes |
| **Existing feature regression** | Zero P0 regressions in Raw Alerts mode | Raw Alerts mode must behave identically to current implementation |
| **WCAG AA compliance** | All new elements pass contrast checks | Address contrast issues identified in UX plan section 8.5 (rationale text at 0.35 opacity may need increase to 0.45) |

### 6.4 How to Measure (Instrumentation Plan)

Analytics events to instrument (P2 priority, but designed now for forward compatibility):

| Event | When Fired | Properties (No PII) |
|-------|-----------|---------------------|
| `view_mode.changed` | User switches view mode | `from: ViewMode`, `to: ViewMode`, `trigger: 'click' \| 'keyboard' \| 'url'` |
| `bundle.viewed` | Bundle card enters viewport or is expanded | `bundleId`, `status`, `severity`, `riskScore` |
| `bundle.expanded` | User expands bundle to see rationale | `bundleId`, `expandedSection: 'rationale' \| 'members' \| 'sources'` |
| `bundle.drilldown` | User clicks "View All in Raw Mode" | `bundleId`, `fromMode: ViewMode` |
| `empty_state.shown` | No-bundles notice renders | `viewMode`, `rawAlertCount` |
| `empty_state.action` | User clicks "Switch to Raw" in notice | `viewMode`, `action: 'switch_to_raw'` |
| `page.loaded` | Dashboard finishes initial render | `viewMode`, `bundleCount`, `alertCount`, `loadTimeMs` |

---

## 7. Definition of Done

### 7.1 Per-Feature Definition of Done

Every feature (user story implementation) must satisfy ALL of these criteria before it is considered done:

- [ ] All acceptance criteria for the story pass (manual verification against the AC table)
- [ ] TypeScript compiles without errors (`pnpm typecheck` passes)
- [ ] No console errors or warnings in the browser during normal operation
- [ ] Existing Raw Alerts behavior is unchanged (regression check)
- [ ] Component renders correctly with: current live data, empty data (0 bundles), and error state
- [ ] Code follows existing codebase patterns (Zustand + Immer, TanStack Query, glass design tokens, `motion/react`)
- [ ] New components use design tokens from UI plan section 1 (no ad-hoc color values)

### 7.2 Overall Feature Definition of Done

The Data View Modes feature is complete when:

- [ ] All P0 user stories are implemented and pass acceptance criteria
- [ ] The confidence loop works end-to-end: Triaged -> bundle detail -> rationale -> member alerts -> "View All in Raw Mode" -> Raw Alerts -> back to Triaged
- [ ] View mode toggle renders in the NavigationHUD, positioned top-center per AIA section 5.1
- [ ] URL deep-linking works: `?view=triaged`, `?view=bundles`, `?view=raw` all load the correct mode
- [ ] `?view=` composes with `?category=` (both params active simultaneously)
- [ ] Category cards show bundle-level metrics in Triaged/Bundles modes and raw alert metrics in Raw mode
- [ ] Feed panel and KPI stats adapt to the active view mode
- [ ] Empty state renders when no bundles exist, with a path to Raw Alerts
- [ ] Error state renders on network failure, with retry capability
- [ ] `pnpm build` succeeds (static export for GitHub Pages)
- [ ] No P0 regressions: existing spatial ZUI, morph animations, category grid, map, and ambient effects all function as before

### 7.3 Quality Rubric

| Dimension | Score Required | Verification Method |
|-----------|---------------|-------------------|
| Functional completeness | All P0 ACs pass | Manual test run through each AC |
| Data integrity | Correct data shown per mode | Verify bundle counts, severity, confidence against Supabase |
| Visual consistency | Uses existing design tokens | Visual comparison with existing panels and cards |
| Performance | Mode switch < 300ms (cache hit) | Manual timing with DevTools Performance tab |
| Accessibility | Toggle has keyboard support | Tab to toggle, use arrow keys, verify focus management |
| Edge case coverage | Empty + error states render | Test with Supabase disconnected and with 0 bundles |

---

## 8. Dependencies & Risks

### 8.1 Data Dependencies

| Dependency | Status | Impact if Missing | Mitigation |
|-----------|--------|-------------------|------------|
| `intel_bundles` table has rows | **Partial** -- 2 rows exist (1 approved, 1 rejected) | Empty states render instead of bundle data | Empty state notice with "Switch to Raw" action (US-10, AC-10.1) |
| `triage_decisions` table has rows | **Partial** -- 2 rows exist | Bundles display without rationale; "Pending" badge shown | Null-safe rendering with fallback messaging (US-03, AC-03.4) |
| `representative_coordinates` populated | **NOT MET** -- Both bundles have null lat/lon | Map markers will not render in bundle modes | Defer map marker variants to P1 (US-06); graceful handling of null coords |
| `trip_alerts` table has rows | **NOT MET** -- 0 rows | Trip alert integration cannot be tested | Deferred to V2 (section 9) |
| TarvaRI triage pipeline running regularly | **UNKNOWN** | Bundles may become stale; new raw alerts not triaged | Stale data warning (P1); raw mode always available as fallback |

### 8.2 Technical Dependencies

| Dependency | Source Plan | Risk Level | Notes |
|-----------|------------|------------|-------|
| Supabase FK relationship: `triage_decisions.bundle_id` -> `intel_bundles.id` | Data plan, Appendix A | Low | Verified; if broken, embedded select returns empty array; handled gracefully |
| TanStack Query v5 `enabled` option | Data plan, section 3.3 | Low | Already used by existing hooks |
| `motion/react` layout animations | UI plan, section 10 | Low | Already imported and used for morph choreography |
| Zustand + Immer middleware | Data plan, section 4.1 | Low | Already used by all existing stores |
| PostgREST `.in()` query for member intel | Data plan, section 6.5 | Low | Uses PK index; performant even with 100+ member IDs |

### 8.3 UX Risks

| Risk | Likelihood | Impact | Source | Mitigation |
|------|------------|--------|--------|------------|
| Users do not discover the view mode toggle | Medium | High | UX plan section 3.1 (drop-off risks) | Prominent placement in header (top-center); first-run tooltip (V2); clear "TRIAGED" label in active state |
| Users are confused by "0 bundles" in Triaged mode when raw alerts exist | Medium | Medium | UX plan section 9.1 | Contextual notice explaining pipeline status with action to switch to Raw Alerts |
| Confidence scores create false precision ("88% confident" sounds more precise than warranted) | Medium | High | UX plan section 6.2 | Display confidence as band (HIGH/MODERATE/LOW) alongside numeric value; always show source count for grounding |
| Rejected bundles in All Bundles mode confuse non-analyst users | Low | Medium | UX plan section 9.3 | Visual hierarchy: rejected bundles are strongly demoted (dimmed, below divider); mode labels clearly distinguish the views |
| Rapid mode switching causes visual flicker or stale data | Low | Low | UX plan section 9.8 | TanStack Query cache key isolation + interruptible animations; no loading spinners for < 300ms transitions |
| WCAG contrast failure on rationale text | Medium | Medium | UX plan section 8.5 | Verify contrast before implementation; may need to increase text opacity from 0.35 to 0.45 |

### 8.4 Risk Register

| # | Risk | L | I | Score | Mitigation | Contingency | Owner |
|---|------|---|---|-------|------------|-------------|-------|
| R1 | Triage pipeline not running -- 0 bundles in production | M | H | 6 | Empty state with clear messaging and Raw Alerts fallback | Raw Alerts mode always works; users can see all data | Product |
| R2 | Bundle coordinates null -- map markers absent | H | M | 6 | Defer map marker variants to P1; handle gracefully | Map falls back to raw alert markers in all modes | Engineering |
| R3 | Toggle placement not discoverable | M | H | 6 | Top-center in fixed header; semantic color tints; testing in alpha | Add first-run tooltip or onboarding hint | Design |
| R4 | Confidence score misinterpreted as certainty | M | H | 6 | Band labels (HIGH/MODERATE/LOW); source count context line | Add disclaimer text in rationale panel | Product |
| R5 | Schema changes in `intel_bundles` or `triage_decisions` | L | M | 3 | Types use string for enum fields (tolerates unknowns); verified against `information_schema` | Update types; transforms degrade gracefully | Engineering |
| R6 | Performance degrades with larger dataset (100+ bundles) | L | M | 3 | LIMIT 100 on queries; lazy-load (no prefetch); client-side transforms are O(n) | Add pagination; move aggregations to database | Engineering |

**L = Likelihood (H=3, M=2, L=1), I = Impact (H=3, M=2, L=1), Score = L x I**

---

## 9. Future Scope (V2+)

### 9.1 Trip Alert Integration

**When:** After `trip_alerts` table has data (requires TarvaRI routing pipeline to be active for real trips).

**Scope:**
- Fourth view mode or overlay: "Trip Alerts" showing bundles matched to specific trips with relevance scores
- Trip-scoped filtering: select a trip and see only alerts relevant to that trip's geography and timeframe
- Trip detail panel: risk summary per trip, combining multiple bundles

**Depends on:** `trip_alerts` table populated, trip data from safetrekr-app-v2, cross-service identity (Supabase Auth swap)

### 9.2 Real-Time Supabase Subscriptions

**When:** After static export constraint is resolved (currently deploying to GitHub Pages with `output: 'export'`).

**Scope:**
- Real-time feed updates via Supabase Realtime channels
- New bundle toast notifications
- Live confidence score updates when additional source data arrives
- Automatic view mode refresh (not just polling)

**Depends on:** Server-side rendering or at least a runtime that can maintain WebSocket connections. GitHub Pages static export does not prevent Realtime (it is client-side), but connection management and reconnection logic need design.

### 9.3 Analyst Annotation and Override

**When:** After basic view modes are stable and analyst workflow is validated.

**Scope:**
- Analysts can add notes to bundles (write to `analyst_notes` column in `intel_bundles`)
- Analysts can override triage decisions (create new `triage_decisions` row with `reviewer_id` = analyst user ID)
- Override audit trail: show original LLM decision alongside analyst override
- Requires authentication (Supabase Auth, not passphrase)

**Depends on:** Supabase Auth integration (Phase 1 in CLAUDE.md), RLS policies for write access, analyst role permissions

### 9.4 Multi-User Collaboration

**When:** After authentication and annotation are in place.

**Scope:**
- Presence indicators: see which analysts are viewing the same dashboard
- Shared annotations: one analyst's notes visible to others
- Assignment: security officer assigns analyst to investigate a specific bundle
- Activity log: who looked at what, when

**Depends on:** Full authentication, user identity, Supabase Realtime for presence

### 9.5 Export and Reporting

**When:** After confidence loop is validated by users.

**Scope:**
- "Export Summary" button on bundle detail: generates a PDF or formatted text summary of the bundle, rationale, and evidence for inclusion in travel safety reports
- Dashboard snapshot: export current view state as an image or structured report
- Scheduled reports: periodic email summaries of the threat landscape

**Depends on:** User feedback confirming the reporting need; PDF generation library or API

---

## Appendix A: Plan Cross-Reference Index

| Topic | AIA Plan | UX Plan | UI Plan | Data Plan |
|-------|----------|---------|---------|-----------|
| View mode toggle design | section 5.1 | sections 5.1-5.4 | section 2 | -- |
| View mode state management | section 3.1-3.3 | -- | -- | section 4.1 |
| URL synchronization | section 1.3 | section 4.3 | -- | section 4.2 |
| Bundle display (category cards) | section 5.2 | section 4.1 | section 3 | section 5.1 |
| Triage rationale panel | section 5.3 | section 6.4 | section 4 | section 3.2 |
| Confidence indicators | -- | section 6.2 | section 5 | -- |
| Risk score display | -- | section 6.3 | section 6 | -- |
| Map marker variants | section 2.4 | section 7.3 | section 7 | section 5.1 |
| Feed panel adaptation | section 6 | section 4.1 | section 8 | section 4.4 |
| System status adaptation | section 6 | section 4.1 | section 9 | -- |
| District view adaptation | section 5.6 | sections 5.6, 7.2 | -- | section 4.4 |
| Accessibility (ARIA, keyboard) | section 5.1 | section 8 | section 11 | -- |
| Edge cases | -- | section 9 | -- | section 7 |
| Animations | section 7 | section 5.3 | section 10 | -- |
| Data types | section 4.1 | -- | -- | section 1 |
| Hooks | section 4.2 | -- | -- | sections 2-3 |
| Transforms | -- | -- | -- | section 5 |
| Performance | -- | -- | -- | section 6 |
| Database schema | section 4.1 | -- | -- | Appendix A |

## Appendix B: Implementation Sequence

The recommended implementation sequence, synthesized from all four specialist plans:

**Phase 1: Types and Store** (no UI changes, no visual impact)
1. Add `IntelBundleRow`, `TriageDecisionRow`, `TripAlertRow` types (Data plan section 1)
2. Create `ViewMode` type and `intel-bundles.ts` interfaces (Data plan section 1)
3. Extend `coverage.store.ts` with `viewMode`, `selectedBundleId`, URL sync (Data plan section 4)

**Phase 2: Data Hooks** (data flows, no UI)
4. Create `useIntelBundles()` hook (Data plan section 3.1)
5. Create `useBundleDetail()` hook (Data plan section 3.2)
6. Verify queries against live Supabase data

**Phase 3: Transforms** (pure functions, independently testable)
7. Create `bundle-transforms.ts` with all transform functions (Data plan section 5)
8. Test transforms against known bundle shapes

**Phase 4: UI Integration** (visible changes)
9. Add `ViewModeToggle` component to NavigationHUD (AIA section 5.1, UI section 2)
10. Wire view mode to `CategoryCard` (bundle metrics display) (AIA section 5.2, UI section 3)
11. Wire view mode to `FeedPanel` and `CoverageOverviewStats` (AIA section 6)
12. Create `TriageRationalePanel` with member alert preview (AIA section 5.3, UI section 4)
13. Create `ConfidenceIndicator` and `RiskScoreBadge` components (UI sections 5-6)
14. Add empty states and error states (UX section 9, Data section 7)
15. Adapt `CategoryDetailScene` for bundle view modes (AIA section 5.6)

**Phase 5: Polish** (P1/P2 features)
16. Map marker variants (UI section 7) -- when coordinate data is available
17. Keyboard navigation upgrade (UX section 8)
18. Screen reader announcements (UX section 8.2)
19. Transition animations (UI section 10)
20. Analytics instrumentation (section 6.4)

---

## Appendix C: Decision Log

| # | Decision | Alternatives Considered | Rationale | Revisit If |
|---|----------|------------------------|-----------|------------|
| D1 | Triaged mode is the default view | Raw Alerts as default (current behavior) | Most users need recommendations, not raw data. The system has done work; show it. (UX principle 1) | User testing shows confusion; users expect raw alerts |
| D2 | View mode is a "global lens" (all components adapt) | Separate pages per mode; or only feed panel adapts | Spatial ZUI metaphor: changing a lens, not navigating away. Preserves spatial context, zoom, and category filter. (AIA section 1.2) | Performance issues with re-rendering all components simultaneously |
| D3 | Extend `coverage.store.ts` rather than create separate `viewmode.store.ts` | Separate store (AIA section 3.1 proposes this) | Data plan argues viewMode belongs alongside selectedCategories -- both are data-filtering concerns with the same lifecycle. Fewer stores = less coordination. | Store grows too complex; concerns should separate |
| D4 | Defer map marker variants to P1 | Build map markers in MVP | Current data has null coordinates. Building the feature would be untestable. Ship what works first. | Triage pipeline populates coordinates |
| D5 | Defer full ARIA tablist pattern to P1 | Include in MVP | Basic keyboard support (click works, tab works) is sufficient for internal alpha. Full spec compliance before any external user access. | External users access the tool earlier than planned |
| D6 | Use `replaceState` for URL (no history entries) | `pushState` (creates back-button entries per mode switch) | Mode switching is a lens change, not navigation. Back button should go to the previous page, not the previous view mode. | Users report wanting back-button for mode changes |
| D7 | No prefetch of adjacent modes | Prefetch all modes on page load | Dataset is tiny (2 bundles, 44 alerts). Query latency < 100ms. Prefetching adds unnecessary network requests for negligible UX gain. | Dataset grows to 100+ bundles; mode switch latency > 500ms |
| D8 | Client-side aggregation for category metrics | Database-side aggregation (SQL views or RPC) | 2 bundles, 44 alerts. Client-side computation is trivial. Avoids database schema coupling. | Dataset grows to 1000+ bundles; client computation becomes noticeable |
