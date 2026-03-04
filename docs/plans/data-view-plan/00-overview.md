# Data View Modes -- Unified Architectural Overview

> **Status:** Draft
> **Author:** Chief Technology Architect
> **Date:** 2026-03-04
> **Scope:** TarvaRI Alert Viewer -- Data View Modes feature
> **Specialist Plans Synthesized:**
> - `aia-interface-architecture.md` -- Interface architecture, state machine, choreography
> - `ux-experience-design.md` -- User experience, personas, trust patterns, accessibility
> - `ui-component-design.md` -- Component specifications, design tokens, motion inventory
> - `data-layer-architecture.md` -- Types, queries, transforms, store design

---

## 1. Executive Summary

The Data View Modes feature introduces a three-mode "Confidence Loop" into the TarvaRI Alert Viewer, giving security officers and intel analysts the ability to inspect intel data at increasing levels of granularity:

| Mode | What It Shows | Primary Query Target |
|------|---------------|---------------------|
| **Triaged** (default) | Approved bundles only -- the vetted, actionable picture | `intel_bundles` WHERE triage decision = 'approve' |
| **All Bundles** | Full pipeline output including rejected bundles with LLM rationale | `intel_bundles` with all `triage_decisions` |
| **Raw Alerts** | Unprocessed intel_normalized rows before bundling | `intel_normalized` directly |

This feature touches every visual surface of the application: the coverage grid, the map, the feed panel, the system status panel, and the district detail views. It must integrate cleanly with the existing spatial ZUI engine and its morph choreography system without introducing animation conflicts or performance regressions.

**Key architectural decisions resolved in this overview:**

1. **State location:** Extend `coverage.store.ts` (not a separate store) with `viewMode`, `selectedBundleId`, `isTransitioning`, and `previousMode`.
2. **ViewMode type:** `'triaged' | 'all-bundles' | 'raw'` -- the data layer's hyphenated convention, which is URL-friendly and unambiguous.
3. **Type authority:** The data layer plan's schema-verified types (25 columns for bundles, 19 for decisions) are canonical.
4. **Component strategy:** Hybrid approach -- adapt existing grid/panel components for multi-mode rendering; create new components for trust indicators, bundle cards, and the triage rationale panel.

**Estimated effort:** 8 working days across 6 phases, with opportunities for parallelism on independent tracks.

---

## 2. Architecture Synopsis

### 2.1 Conceptual Model

The Confidence Loop is the central organizing concept. Users begin at the highest-trust layer (Triaged) and can drill down through All Bundles to Raw Alerts to build confidence in the intel picture. Navigation is bidirectional and non-destructive -- switching modes preserves scroll position, selected items, and filter state.

```
              Confidence Loop
   +----------+    +----------+    +----------+
   |          | -> |          | -> |          |
   | TRIAGED  |    |   ALL    |    |   RAW    |
   | (default)|    | BUNDLES  |    |  ALERTS  |
   |          | <- |          | <- |          |
   +----------+    +----------+    +----------+
     Approved        Full           Unprocessed
     bundles         pipeline       intel rows
     only            output
```

> **Ref:** `ux-experience-design.md` Section 3 (The Confidence Loop), `aia-interface-architecture.md` Section 2 (Product Design Intent)

### 2.2 Progressive Disclosure Layers

The UX plan defines a four-layer progressive disclosure model that operates independently of (but is enhanced by) the view mode:

| Layer | Content | Trigger |
|-------|---------|---------|
| **Ambient Awareness** | Glow intensity, severity colors, dot density on grid | Passive -- always visible |
| **Summary Assessment** | Category cards with bundle counts, confidence, risk scores | Grid view (zoom level) |
| **Bundle Detail** | Individual bundle cards with triage rationale, member intel list | Click/select bundle |
| **Evidence & Audit** | Raw intel, source metadata, LLM reasoning chain, diff | District detail view or rationale panel |

> **Ref:** `ux-experience-design.md` Section 5 (Progressive Disclosure), `aia-interface-architecture.md` Section 6 (Multi-Surface Interaction)

### 2.3 State Architecture

All view mode state lives in `coverage.store.ts` (extended). This is a deliberate choice to co-locate view mode with the data it controls, avoiding cross-store synchronization.

```typescript
// Additions to coverage.store.ts
interface ViewModeSlice {
  // Core state
  viewMode: ViewMode;            // 'triaged' | 'all-bundles' | 'raw'
  selectedBundleId: string | null;

  // Transition state (from AIA plan)
  previousMode: ViewMode | null;
  isTransitioning: boolean;

  // Actions
  setViewMode: (mode: ViewMode) => void;
  selectBundle: (id: string | null) => void;

  // URL sync
  syncCoverageFromUrl: () => void;
  syncCoverageToUrl: () => void;
}
```

**URL serialization:** `?view=all-bundles` or `?view=raw`. Triaged is the default and produces no URL parameter, ensuring clean default URLs and safe bookmark behavior.

> **Ref:** `data-layer-architecture.md` Section 5 (Store Extension), `aia-interface-architecture.md` Section 3 (State Management)

### 2.4 Data Flow

```
  Supabase (TarvaRI instance)
       |
       v
  TanStack Query hooks
  (useIntelBundles, useBundleDetail)
       |
       v
  Transform functions
  (bundlesToMarkers, bundlesToFeedItems, bundlesToCategoryMetrics)
       |
       v
  React components
  (CoverageGrid, FeedPanel, Map, SystemStatusPanel)
       |
       v
  User interaction
  (ViewModeToggle, BundleCard click, keyboard shortcuts)
       |
       v
  Zustand store (coverage.store.ts)
       |
       v
  URL sync (replaceState, no navigation)
```

All data fetching is client-side (required for GitHub Pages static export). TanStack Query manages caching with 30-second stale time and 45-second background refetch interval.

> **Ref:** `data-layer-architecture.md` Sections 3-4 (Query Architecture), `aia-interface-architecture.md` Section 4 (Data Layer)

### 2.5 Component Hierarchy

```
SpatialViewport
  SpatialCanvas
    CoverageGrid (adapted)
      ViewModeToggle (new)             -- positioned in header
      CategoryCard (adapted)           -- multi-mode rendering
        BundleCard (new)               -- individual bundle display
          ConfidenceIndicator (new)    -- compact badge or arc gauge
          RiskScoreBadge (new)         -- cyan-magenta gradient
    CoverageMap (adapted)
      BundleMapMarkerLayer (new)       -- map markers per bundle
      BundleMapPopup (new)             -- marker click popup
    FeedPanel (adapted)                -- triage/bundle feed mode
    SystemStatusPanel (adapted)        -- triage metrics overlay
  TriageRationalePanel (new)           -- slide-out detail panel
  NavigationHUD
    SpatialBreadcrumb (adapted)        -- view mode indicator
```

> **Ref:** `ui-component-design.md` Section 2 (Component Specifications), `aia-interface-architecture.md` Section 5 (Component Architecture)

---

## 3. Cross-Plan Integration Points

This section identifies every point where two or more specialist plans must agree on a shared contract. Each integration point includes the resolution and the authoritative plan.

### 3.1 ViewMode Type Definition

| Plan | Proposed Values |
|------|----------------|
| `aia-interface-architecture.md` | `'triaged' \| 'bundles' \| 'raw'` |
| `ux-experience-design.md` | Triaged / All Bundles / Raw Alerts (display names only) |
| `ui-component-design.md` | `'triaged' \| 'all_bundles' \| 'raw_alerts'` |
| `data-layer-architecture.md` | `'triaged' \| 'all-bundles' \| 'raw'` |

**Resolution:** Use `'triaged' | 'all-bundles' | 'raw'` from `data-layer-architecture.md`.

**Rationale:** Hyphenated values are URL-friendly (no encoding needed), align with existing URL parameter conventions, and avoid the ambiguity of abbreviated forms. The data layer plan is authoritative because it validated these values against URL serialization and query key construction.

**Display labels** (from `ux-experience-design.md`): "Triaged", "All Bundles", "Raw Alerts" -- these are UI concerns handled in the toggle component, not the type definition.

### 3.2 State Management Location

| Plan | Proposed Location |
|------|-------------------|
| `aia-interface-architecture.md` | New `viewmode.store.ts` |
| `ui-component-design.md` | Extend `coverage.store.ts` |
| `data-layer-architecture.md` | Extend `coverage.store.ts` |

**Resolution:** Extend `coverage.store.ts` with fields from both the data layer plan (`viewMode`, `selectedBundleId`, URL sync) and the AIA plan (`isTransitioning`, `previousMode`).

**Rationale:** View mode is intrinsically coupled to coverage data -- switching modes changes what the coverage grid, map, and panels display. A separate store would require cross-store subscriptions and synchronization, adding complexity without benefit. The AIA plan's transition fields are needed for choreography but belong in the same store to enable atomic state updates.

### 3.3 Type Definitions (IntelBundleRow, TriageDecisionRow)

| Plan | Completeness |
|------|-------------|
| `aia-interface-architecture.md` | Simplified: 12 fields (bundles), 6 fields (decisions) |
| `data-layer-architecture.md` | Comprehensive: 25 fields (bundles), 19 fields (decisions), verified against `information_schema.columns` |

**Resolution:** Use `data-layer-architecture.md` types as canonical. The AIA plan's simplified types omit fields that are needed for bundle detail views (e.g., `risk_details`, `analyst_notes`, `source_breakdown`, `edited_title`, `edited_severity`, `diff`).

**Implementation note:** Components that only need a subset of fields should use TypeScript `Pick<>` rather than defining separate lightweight interfaces, keeping a single source of truth.

### 3.4 Confidence Score Thresholds

| Plan | Tiers | Breakpoints | Colors |
|------|-------|-------------|--------|
| `ux-experience-design.md` | 3-tier | 0-59 LOW, 60-79 MODERATE, 80-100 HIGH | red, amber, green |
| `ui-component-design.md` | 4-tier (implied by arc gauge gradient) | Continuous gradient | Green to amber to red arc |

**Resolution:** Use the UX plan's 3-tier system for labels and semantic meaning. The UI plan's arc gauge provides continuous visual feedback within those tiers. These are complementary, not conflicting -- the gauge shows the exact value while the tier provides the cognitive shortcut.

```
LOW (0-59)       -- red label, red arc segment
MODERATE (60-79) -- amber label, amber arc segment
HIGH (80-100)    -- green label, green arc segment
```

### 3.5 Risk Score Color Palette

| Plan | Approach |
|------|----------|
| `ux-experience-design.md` | Severity-aligned: blue (LOW), amber (MODERATE), red-orange (HIGH) |
| `ui-component-design.md` | Distinct spectrum: dim cyan (0-29), bright cyan (30-59), purple (60-79), magenta (80-100) |

**Resolution:** Use the UI plan's cyan-to-magenta spectrum.

**Rationale:** Risk score and severity are different dimensions. Using the same color palette for both (red/amber/green) would conflate them visually. The cyan-magenta spectrum creates clear visual separation: severity uses the warm palette (blue/yellow/orange/red as already established in the codebase), risk score uses the cool-to-hot spectrum (cyan to magenta). This aligns with the UI plan's design intent of making risk immediately distinguishable from severity at a glance.

### 3.6 TriageRationalePanel Placement

| Plan | Approach |
|------|----------|
| `aia-interface-architecture.md` | Inline within district detail view scenes |
| `ui-component-design.md` | Slide-out panel, fixed right, 360px wide, z-35 |

**Resolution:** Both placements are needed for different contexts:

1. **Compact inline** (AIA approach): When a user is in district detail view, triage rationale appears inline within the detail scene -- a condensed summary with confidence badge, decision label, and a "View Full Rationale" link.
2. **Full slide-out** (UI approach): Activated by the "View Full Rationale" link or by keyboard shortcut `R`. Provides the complete LLM reasoning chain, diff view, and source breakdown in a dedicated panel.

This follows the progressive disclosure model: summary in context, full detail on demand.

### 3.7 Hook Design Pattern (Parameter vs Store Read)

| Plan | Approach |
|------|----------|
| `aia-interface-architecture.md` | Hooks read viewMode internally from store |
| `data-layer-architecture.md` | Hooks accept viewMode as a parameter |

**Resolution:** Accept `viewMode` as a parameter.

**Rationale:** Parameter-based hooks are more testable (no store mocking needed), more explicit about their dependencies, and follow the existing codebase pattern where hooks like `useCoverageMapData` accept configuration parameters. The calling component reads from the store and passes the value down.

```typescript
// Preferred pattern
function useIntelBundles(viewMode: ViewMode) { ... }

// In component
const { viewMode } = useCoverageStore();
const { data } = useIntelBundles(viewMode);
```

### 3.8 Component Organization (Modify vs Create)

| Plan | Approach |
|------|----------|
| `aia-interface-architecture.md` | Modify existing components (CoverageGrid, CategoryCard) to handle multiple modes |
| `ui-component-design.md` | Create new components (BundleCard, BundleGrid, BundleMapMarkerLayer) alongside existing |

**Resolution:** Hybrid approach:

- **Adapt existing:** `CoverageGrid`, `CategoryCard`, `FeedPanel`, `SystemStatusPanel`, `CoverageOverviewStats`, `SpatialBreadcrumb` -- these components already own their visual surface and adding mode-aware rendering avoids duplicating layout logic.
- **Create new:** `ViewModeToggle`, `BundleCard`, `ConfidenceIndicator`, `RiskScoreBadge`, `TriageRationalePanel`, `BundleMapMarkerLayer`, `BundleMapPopup` -- these are genuinely new UI elements with no existing counterpart.

---

## 4. Dependency Graph

### 4.1 Build-Order Dependencies

The following graph shows what must be built before what. Items at the same level can be built in parallel.

```
Level 0 (no dependencies)
  [T1] Types & interfaces
       src/lib/interfaces/intel.ts
       Ref: data-layer-architecture.md Section 2

Level 1 (depends on Level 0)
  [S1] Store extension             depends on T1
       coverage.store.ts additions
       Ref: data-layer-architecture.md Section 5,
            aia-interface-architecture.md Section 3
  [X1] Transform functions         depends on T1
       src/lib/bundle-transforms.ts
       Ref: data-layer-architecture.md Section 6
  [C1] Trust indicator components  depends on T1
       ConfidenceIndicator, RiskScoreBadge
       Ref: ui-component-design.md Section 2.4, 2.5

Level 2 (depends on Level 1)
  [Q1] Query hooks                 depends on T1, S1
       useIntelBundles, useBundleDetail
       Ref: data-layer-architecture.md Sections 3-4
  [C2] ViewModeToggle              depends on S1
       Ref: ui-component-design.md Section 2.1,
            ux-experience-design.md Section 4,
            aia-interface-architecture.md Section 8
  [C3] BundleCard                  depends on T1, C1
       Ref: ui-component-design.md Section 2.2

Level 3 (depends on Level 2)
  [A1] CoverageGrid adaptation     depends on Q1, C2, C3, X1
       Ref: aia-interface-architecture.md Section 6,
            ui-component-design.md Section 3
  [A2] FeedPanel adaptation        depends on X1, S1
       Ref: ui-component-design.md Section 3.1
  [A3] SystemStatusPanel adaptation depends on X1, S1
       Ref: ui-component-design.md Section 3.2
  [A4] Map marker layer            depends on Q1, X1
       BundleMapMarkerLayer, BundleMapPopup
       Ref: ui-component-design.md Section 2.7, 2.8

Level 4 (depends on Level 3)
  [D1] TriageRationalePanel        depends on Q1, S1
       Ref: ui-component-design.md Section 2.3,
            aia-interface-architecture.md Section 7
  [D2] District view adaptation    depends on Q1, C1
       Ref: aia-interface-architecture.md Section 7

Level 5 (depends on Level 4)
  [P1] Transition choreography     depends on A1, A2, A3, A4
       Ref: aia-interface-architecture.md Section 8
  [P2] Accessibility & keyboard    depends on C2, D1
       Ref: ux-experience-design.md Section 7,
            aia-interface-architecture.md Section 9
  [P3] Edge case handling          depends on all above
       Ref: ux-experience-design.md Section 8
```

### 4.2 Critical Path

The longest chain through the dependency graph determines the minimum build time:

```
T1 (types) -> S1 (store) -> Q1 (hooks) -> A1 (grid adaptation) -> P1 (choreography)
   0.5 day      0.5 day      0.5 day        1.5 days                 0.5 day
                                                            Total: 3.5 days minimum
```

With parallelism, the remaining items (transforms, trust indicators, feed/status panels, map layer, rationale panel, accessibility) fill the remaining 4.5 days of the 8-day estimate.

### 4.3 Parallel Tracks

Four independent work streams can proceed simultaneously after Level 0 completes:

| Track | Focus | Items | Est. Days |
|-------|-------|-------|-----------|
| **A -- Grid** | Coverage grid multi-mode rendering | S1, C2, Q1, A1 | 3.5 |
| **B -- Components** | New display components | C1, C3, D1 | 2.5 |
| **C -- Panels** | Feed and status panel adaptation | X1, A2, A3 | 1.5 |
| **D -- Map** | Map marker integration | X1, Q1, A4 | 1.5 |

Track A is the critical path. Tracks C and D can proceed independently once transforms (X1) are complete.

---

## 5. Implementation Phases

### Phase 1 -- Foundation (Day 1)

**Objective:** Establish the type system, store extension, and URL synchronization that all subsequent work depends on.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 1.1 | Create `src/lib/interfaces/intel.ts` with `ViewMode`, `IntelBundleRow`, `TriageDecisionRow`, `BundleWithDecision`, `BundleWithMembers` | `data-layer-architecture.md` S2 |
| 1.2 | Add helper functions: `getBundleDisplayTitle`, `getBundleDisplaySeverity`, `getBundleDisplaySummary`, `isAutoTriaged` | `data-layer-architecture.md` S2.4 |
| 1.3 | Extend `coverage.store.ts` with `viewMode`, `selectedBundleId`, `previousMode`, `isTransitioning`, actions, and URL sync | `data-layer-architecture.md` S5 + `aia-interface-architecture.md` S3 |
| 1.4 | Implement `syncCoverageFromUrl()` and `syncCoverageToUrl()` with `replaceState` | `data-layer-architecture.md` S5.2 |

**Exit criteria:** `pnpm typecheck` passes. Store round-trips viewMode through URL. Unit tests for URL sync and helper functions.

### Phase 2 -- Data Pipeline (Day 2)

**Objective:** Connect to Supabase and provide transformed data to components.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 2.1 | Define `BUNDLE_SELECT` constant and `normalizeBundleResponse` helper | `data-layer-architecture.md` S3.1 |
| 2.2 | Implement `useIntelBundles(viewMode)` hook with TanStack Query (staleTime 30s, refetchInterval 45s) | `data-layer-architecture.md` S3.2 |
| 2.3 | Implement `useBundleDetail(bundleId)` dependent query hook (staleTime 60s, no polling) | `data-layer-architecture.md` S3.3 |
| 2.4 | Create `src/lib/bundle-transforms.ts` with all transform and statistical functions | `data-layer-architecture.md` S6 |

**Exit criteria:** Console logging confirms bundles fetched for triaged and all-bundles modes. Transform functions produce correct marker, feed item, and metric shapes. Query keys follow `['intel', 'bundles', viewMode]` convention.

### Phase 3 -- Core Components (Days 3-4)

**Objective:** Build the new UI components and wire the toggle into the interface.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 3.1 | Build `ViewModeToggle` -- segmented control with sliding pill (`layoutId="view-mode-pill"`), spring stiffness 400 damping 30 | `ui-component-design.md` S2.1 |
| 3.2 | Build `ConfidenceIndicator` -- compact badge variant + expanded SVG arc gauge (270-degree arc, viewBox 0 0 64 64) | `ui-component-design.md` S2.4 |
| 3.3 | Build `RiskScoreBadge` -- cyan-to-magenta gradient (dim cyan 0-29, bright cyan 30-59, purple 60-79, magenta 80-100) | `ui-component-design.md` S2.5 |
| 3.4 | Build `BundleCard` -- severity border-left (3px solid approved, 3px dashed rejected), rejected state at 0.55 opacity | `ui-component-design.md` S2.2 |
| 3.5 | Position toggle in header (top-center, `top: 21px`, `left: 50%`, transform translateX(-50%)) | `ux-experience-design.md` S4.1 |
| 3.6 | Wire keyboard shortcuts: `1`/`2`/`3` for direct mode, `Shift+V` to cycle, `R` for rationale panel | `aia-interface-architecture.md` S9 |

**Exit criteria:** Toggle visually switches between modes with animated pill. Bundle cards render with correct severity colors and status indicators. Trust indicators display confidence and risk score values. Keyboard shortcuts work.

### Phase 4 -- Surface Adaptation (Days 5-6)

**Objective:** Adapt every existing visual surface to respond to view mode changes.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 4.1 | Adapt `CoverageGrid` to render mode-appropriate content (triaged: approved bundles as category cards, all-bundles: full bundle grid, raw: intel list) | `aia-interface-architecture.md` S6 |
| 4.2 | Adapt `CategoryCard` to display bundle data (count badges, confidence indicator, severity border) | `ui-component-design.md` S3 |
| 4.3 | Adapt `CoverageOverviewStats` to show mode-specific aggregate metrics | `aia-interface-architecture.md` S6.2 |
| 4.4 | Adapt `FeedPanel` -- "TRIAGE FEED" header in triaged mode, approval rate bar, triage event rows | `ui-component-design.md` S3.1 |
| 4.5 | Adapt `SystemStatusPanel` -- triage status breakdown, confidence overview, risk distribution | `ui-component-design.md` S3.2 |
| 4.6 | Build `BundleMapMarkerLayer` -- approved markers (solid, severity-colored, radius from source_count), rejected markers (dashed outline, 0.3 opacity) | `ui-component-design.md` S2.7 |
| 4.7 | Build `BundleMapPopup` -- marker click popup with bundle summary | `ui-component-design.md` S2.8 |
| 4.8 | Adapt `SpatialBreadcrumb` to include view mode indicator | `aia-interface-architecture.md` S6.3 |

**Exit criteria:** All three view modes render distinct content on every surface. Map shows markers for bundles with valid coordinates. Feed panel shows triage events. Status panel shows pipeline metrics.

### Phase 5 -- Detail and Rationale (Day 7)

**Objective:** Enable deep inspection of individual bundles and their triage decisions.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 5.1 | Build `TriageRationalePanel` -- slide-out from right, 360px wide, z-35, `rgba(5, 9, 17, 0.95)` background | `ui-component-design.md` S2.3 |
| 5.2 | Wire `useBundleDetail` to populate the rationale panel with LLM reasoning, confidence, diff | `data-layer-architecture.md` S3.3 |
| 5.3 | Add compact inline triage summary to district detail view scenes | `aia-interface-architecture.md` S7 |
| 5.4 | Connect "View Full Rationale" link from inline summary to slide-out panel | Integration point |

**Exit criteria:** Clicking a bundle card opens the rationale panel. Panel shows decision, confidence, edited fields, and LLM rationale. Keyboard `R` toggles the panel. District view shows inline triage summary.

### Phase 6 -- Choreography and Polish (Day 8)

**Objective:** Smooth transitions, accessibility compliance, and edge case handling.

| Step | Deliverable | Source Plan |
|------|------------|-------------|
| 6.1 | Implement transition choreography: T+0ms store update, T+50ms card morph, T+100ms panel fade, T+150ms queries fire, T+250ms data arrives, T+550ms complete | `aia-interface-architecture.md` S8 |
| 6.2 | Implement morph queue conflict prevention (`pendingModeRef`) to prevent view mode switches during active spatial morph | `aia-interface-architecture.md` S8.3 |
| 6.3 | Add ARIA roles: `role="tablist"` on toggle, `role="tab"` on options with `aria-selected`, `role="meter"` on confidence gauge | `ux-experience-design.md` S7 |
| 6.4 | Implement data freshness indicators: 15-minute amber warning, 1-hour red critical | `ux-experience-design.md` S6.4 |
| 6.5 | Handle edge cases: empty states (no bundles, all rejected), rapid switching debounce, district view open during mode switch | `ux-experience-design.md` S8 |
| 6.6 | Add `useAnimatedNumber` hook for spring-based number morphing during transitions | `aia-interface-architecture.md` S8.2 |

**Exit criteria:** Mode transitions are visually smooth (no flash of empty content). Morph and view mode animations do not conflict. Screen reader can navigate the toggle and read confidence values. Empty states display appropriate messages. Rapid switching does not cause race conditions.

---

## 6. Risk Register

### R1 -- NULL Representative Coordinates (HIGH)

**Description:** The `representative_coordinates` field on both existing bundles contains NULL latitude and longitude values. This was confirmed by the data layer plan's audit of production data.

**Impact:** Map markers will not render for any bundle. The map surface appears empty even when bundles exist, undermining user trust in the system.

**Mitigation strategies (ordered by preference):**
1. **Centroid fallback:** Compute centroid from member `intel_normalized` rows that have valid coordinates. The data layer plan's `bundlesToMarkers` transform should implement this fallback.
2. **Geographic scope fallback:** Use the `geographic_scope` text field to geocode an approximate location.
3. **Graceful empty state:** If no coordinates can be resolved, show a "Coordinates unavailable" indicator on the map with a count of un-plottable bundles.

**Owner:** Data pipeline (Phase 2, Step 2.4 -- bundlesToMarkers transform)
**Plan refs:** `data-layer-architecture.md` Section 7 (Current Data Snapshot), `ui-component-design.md` Section 2.7 (Map Markers)

---

### R2 -- Morph/ViewMode Animation Conflict (MEDIUM)

**Description:** The spatial ZUI engine has an existing morph choreography system for district drill-down animations. View mode transitions introduce a second animation system. If a user switches view mode while a morph is in progress (e.g., during district zoom-in), the two systems could fight, causing visual glitches, stuck animation states, or incorrect final positions.

**Impact:** Visual corruption, potentially frozen UI requiring page refresh.

**Mitigation:** Implement the AIA plan's `pendingModeRef` approach: when a morph animation is active (`isTransitioning` in `ui.store.ts`), queue the view mode change and apply it after the morph completes. Conversely, if a view mode transition is in progress, delay the morph until the view mode transition settles.

**Owner:** Choreography (Phase 6, Step 6.2)
**Plan refs:** `aia-interface-architecture.md` Section 8.3 (Morph Queue Conflict Prevention)

---

### R3 -- Small Dataset Masks Performance Issues (MEDIUM)

**Description:** Production currently contains only 2 bundles and 44 intel_normalized rows. This dataset is too small to reveal performance problems that will emerge at scale (hundreds of bundles, thousands of raw alerts).

**Impact:** Performance regressions discovered late, after the feature ships, when real data volumes arrive.

**Mitigation:**
1. Design all list rendering for 200+ items from the start: use `key` props correctly, avoid unnecessary re-renders with `React.memo`, and structure query keys to prevent cache thrashing.
2. Defer virtual scrolling implementation but architect the component boundaries to allow it as a drop-in optimization later (e.g., BundleGrid accepts a `renderItem` prop).
3. Create a seed script that generates synthetic bundles for local development testing.

**Owner:** Component implementation (Phase 3-4)
**Plan refs:** `data-layer-architecture.md` Section 7 (Current Data Snapshot), `ui-component-design.md` Section 2.6 (BundleGrid)

---

### R4 -- Raw Alerts Mode Query Complexity (MEDIUM)

**Description:** The "Raw Alerts" mode queries `intel_normalized` directly, which is a different table with a different schema than `intel_bundles`. This mode has no triage decisions and requires a separate type definition, query hook, and set of transforms. It is also the mode least likely to be used by the primary persona (Security Officer).

**Impact:** Significant additional implementation effort for a secondary use case. The 44-row dataset today could grow to thousands, requiring pagination that the other modes do not need.

**Mitigation:** Consider deferring raw alerts mode to a Phase 2 release. The toggle can show the third option as disabled with a "Coming soon" tooltip. This allows shipping the high-value Triaged and All Bundles modes faster while designing the raw alerts experience with more data volume insight.

**Decision needed:** See Open Questions, Q4.

**Owner:** Architecture decision
**Plan refs:** `data-layer-architecture.md` Section 3 (Query Architecture), `ux-experience-design.md` Section 3 (Confidence Loop)

---

### R5 -- @tarva/ui Workspace Dependency (LOW)

**Description:** The project depends on `@tarva/ui` via a workspace link to `../../tarva-ui-library`. New design tokens for trust indicators (confidence colors, risk score gradient, bundle card borders) may need to be added to the shared library.

**Impact:** If tokens are added to @tarva/ui, other consumers of the library would receive them. If added locally, there is a risk of divergence.

**Mitigation:** Add new tokens to the local Tailwind config first (in `tailwind.config.ts` or CSS custom properties). Once the feature is stable and the token names are finalized, upstream to @tarva/ui in a separate PR.

**Owner:** Component implementation (Phase 3)
**Plan refs:** `ui-component-design.md` Section 1 (Design Tokens)

---

### R6 -- Data Freshness Without Server Push (LOW)

**Description:** The static export deployment model (GitHub Pages) means there is no WebSocket or server-sent events channel. Data freshness relies entirely on TanStack Query polling (45-second interval). The UX plan defines freshness thresholds of 15 minutes (amber) and 1 hour (red).

**Impact:** Users may see stale data without realizing it, especially if the polling fails silently (e.g., network issues, browser tab backgrounded).

**Mitigation:** Track `dataUpdatedAt` from TanStack Query and compute staleness client-side. Display a freshness indicator in the system status panel. When the tab regains focus, trigger an immediate refetch via `refetchOnWindowFocus: true` (already a TanStack Query default).

**Owner:** Polish (Phase 6, Step 6.4)
**Plan refs:** `ux-experience-design.md` Section 6.4 (Data Freshness), `data-layer-architecture.md` Section 3.2 (Query Configuration)

---

## 7. Plan Cross-Reference Matrix

This matrix maps each major feature element to the specialist plan(s) that define it, and identifies the authoritative plan for each element.

| Feature Element | AIA | UX | UI | Data | Authority |
|----------------|-----|----|----|------|-----------|
| **ViewMode type definition** | S3 | -- | S2.1 | S2.1 | **Data** |
| **Store shape (viewMode, selectedBundleId)** | S3 | -- | S4 | S5 | **Data** (+AIA transition fields) |
| **URL synchronization** | S3.3 | -- | -- | S5.2 | **Data** |
| **Confidence Loop concept** | S2 | S3 | -- | -- | **UX** |
| **Progressive disclosure layers** | S6 | S5 | -- | -- | **UX** |
| **Persona definitions** | -- | S2 | -- | -- | **UX** |
| **Trust indicator thresholds (confidence)** | -- | S6.2 | S2.4 | -- | **UX** (3-tier) + **UI** (visual gauge) |
| **Trust indicator thresholds (risk)** | -- | S6.3 | S2.5 | -- | **UI** (cyan-magenta) |
| **ViewModeToggle component** | S5.1 | S4.1 | S2.1 | -- | **UI** (visual spec) + **UX** (placement) |
| **BundleCard component** | -- | -- | S2.2 | -- | **UI** |
| **TriageRationalePanel** | S7 | S5.4 | S2.3 | -- | **UI** (slide-out) + **AIA** (inline) |
| **ConfidenceIndicator** | -- | S6.2 | S2.4 | -- | **UI** |
| **RiskScoreBadge** | -- | S6.3 | S2.5 | -- | **UI** |
| **Map markers** | -- | -- | S2.7-8 | S6.1 | **UI** (visual) + **Data** (transform) |
| **FeedPanel adaptation** | S6.4 | -- | S3.1 | S6.2 | **UI** (visual) + **Data** (transform) |
| **SystemStatusPanel adaptation** | S6.5 | -- | S3.2 | S6.3 | **UI** (visual) + **Data** (transform) |
| **IntelBundleRow type** | S4.1 | -- | -- | S2.1 | **Data** |
| **TriageDecisionRow type** | S4.2 | -- | -- | S2.2 | **Data** |
| **Composite types (BundleWithDecision, etc.)** | -- | -- | -- | S2.3 | **Data** |
| **Helper functions (getBundleDisplayTitle, etc.)** | -- | -- | -- | S2.4 | **Data** |
| **useIntelBundles hook** | S4.3 | -- | -- | S3.2 | **Data** |
| **useBundleDetail hook** | S4.4 | -- | -- | S3.3 | **Data** |
| **Transform functions** | S4.5 | -- | -- | S6 | **Data** |
| **Query key convention** | -- | -- | -- | S3.4 | **Data** |
| **Transition choreography** | S8 | -- | S5 | -- | **AIA** |
| **Morph queue conflict prevention** | S8.3 | -- | -- | -- | **AIA** |
| **Keyboard shortcuts** | S9 | S7.2 | -- | -- | **AIA** (keys) + **UX** (ARIA) |
| **ARIA roles and accessibility** | -- | S7 | -- | -- | **UX** |
| **Edge cases** | -- | S8 | -- | S7 | **UX** (scenarios) + **Data** (data audit) |
| **Data freshness indicators** | -- | S6.4 | -- | -- | **UX** |
| **Analytics events** | -- | S9 | -- | -- | **UX** |
| **Design tokens (glass surface, etc.)** | -- | S10 | S1 | -- | **UI** |
| **Animation inventory** | S8.1 | -- | S5 | -- | **UI** (specs) + **AIA** (timing) |
| **World-space coordinates** | -- | -- | S6 | -- | **UI** |
| **CoverageGrid adaptation** | S6.1 | -- | S3 | -- | **AIA** (logic) + **UI** (visual) |
| **District view adaptation** | S7 | -- | -- | -- | **AIA** |
| **SpatialBreadcrumb adaptation** | S6.3 | -- | -- | -- | **AIA** |
| **useAnimatedNumber hook** | S8.2 | -- | -- | -- | **AIA** |

**Legend:**
- AIA = `aia-interface-architecture.md`
- UX = `ux-experience-design.md`
- UI = `ui-component-design.md`
- Data = `data-layer-architecture.md`
- Section references use the plan's internal numbering (S = Section)

---

## 8. Open Questions and Decisions Needed

### Q1 -- Default Mode Persistence

**Question:** Should the application always reset to Triaged mode on page load, or should the URL-synced view mode persist across sessions?

**Context:** The UX plan recommends Triaged as the hard default for safety -- "the user should always start from the vetted picture." The data layer plan implements URL sync via `syncCoverageFromUrl()`, which would restore a previously selected mode from a bookmarked or shared URL.

**Recommendation:** Persist via URL. If the URL contains `?view=all-bundles`, honor it. If no `view` parameter is present, default to `triaged`. This supports both the safety default (new visits start at triaged) and the workflow continuity use case (shared URLs, bookmarks). Session storage is not needed.

**Impact:** Low -- this is a one-line conditional in `syncCoverageFromUrl()`.

---

### Q2 -- Confidence Visual: Tiers vs Continuous Gauge

**Question:** Are the UX plan's 3-tier labels (LOW/MODERATE/HIGH) and the UI plan's continuous arc gauge complementary or redundant?

**Context:** The UX plan defines three discrete tiers with color stops. The UI plan specifies a continuous SVG arc gauge that smoothly represents the exact score.

**Recommendation:** Complementary. Use both:
- The **compact badge** variant (used in cards and lists) shows the tier label and color: "HIGH" in green, "MODERATE" in amber, "LOW" in red.
- The **expanded arc gauge** variant (used in the rationale panel and district detail) shows the exact numeric score on a continuous gradient arc, with tier-colored segments.

**Impact:** None -- the UI plan already specifies both variants. The UX plan's tiers provide the label text and ARIA attributes.

---

### Q3 -- Risk Score Palette Confirmation

**Question:** Should risk score use the severity-aligned palette (UX plan: blue/amber/red) or the distinct spectrum (UI plan: cyan-magenta)?

**Context:** Section 3.5 above recommends cyan-magenta. This question escalates the decision for stakeholder confirmation since it affects the visual identity of a core data dimension.

**Recommendation:** Cyan-to-magenta. The severity palette is already overloaded (used for alert severity across the entire platform). Risk score is a computed composite metric that deserves its own visual language. The cyan-magenta spectrum also creates stronger visual contrast against the warm-toned severity indicators.

**Impact:** Medium -- affects `RiskScoreBadge`, map marker tooltips, and any future charts. Should be decided before Phase 3 begins.

---

### Q4 -- Raw Alerts Mode: Ship or Defer?

**Question:** Should the Raw Alerts view mode be included in the initial release, or deferred to a follow-up?

**Context:** Raw Alerts queries a different table (`intel_normalized`), requires its own type definitions and query hook, and serves a secondary persona (Intel Analyst). The current dataset has 44 rows but this could grow to thousands, potentially requiring pagination infrastructure that the other modes do not need.

**Arguments for shipping now:**
- The Confidence Loop is incomplete without all three tiers.
- The toggle UI already has three segments; disabling one feels unfinished.
- The Intel Analyst persona needs it for evidence verification.

**Arguments for deferring:**
- Two modes (Triaged + All Bundles) deliver 90% of the value for the primary persona.
- Raw mode is architecturally distinct (different table, no triage data, potential pagination).
- Shipping faster allows learning from real usage before designing the raw experience.

**Recommendation:** Ship with a simplified raw mode that fetches the first 100 intel_normalized rows without pagination. Add a "Showing first 100 of N" indicator. This preserves the Confidence Loop concept without building full pagination infrastructure. Pagination can be added when the dataset grows.

**Impact:** High -- affects Phase 2 scope (additional query hook), Phase 4 scope (additional grid rendering mode), and total timeline.

---

### Q5 -- TriageRationalePanel Overlay Behavior

**Question:** Should the slide-out rationale panel overlay the map, or should the map viewport contract to accommodate it?

**Context:** The UI plan specifies `position: fixed; right: 0; width: 360px; z-index: 35;`. This overlays whatever is underneath, including the map. On smaller viewports, this could obscure a significant portion of the map surface.

**Recommendation:** Overlay with a map viewport adjustment. When the rationale panel opens:
1. The panel slides in from the right (as specified).
2. The map container reduces its width by 360px to avoid marker occlusion.
3. On viewports narrower than 1024px, the panel becomes full-width and the map is hidden (progressive disclosure -- the user chose to inspect detail, so the map can yield).

**Impact:** Medium -- affects Phase 5 layout logic and map integration in Phase 4.

---

### Q6 -- Analytics Infrastructure

**Question:** Does analytics infrastructure exist for the tracking events defined in the UX plan?

**Context:** The UX plan defines 8+ analytics events (`view_mode_changed`, `bundle_expanded`, `evidence_drilldown`, `confidence_loop_completed`, etc.) but the current codebase has no visible analytics integration.

**Recommendation:** Stub the events with a lightweight `trackEvent(name, properties)` function that logs to console in development. This preserves the event definitions for future analytics integration (e.g., PostHog, Amplitude) without blocking the feature. The stub can be replaced with a real provider later.

**Impact:** Low -- a single utility function plus scattered `trackEvent()` calls.

---

### Q7 -- Bundle Count Threshold for Grid vs List

**Question:** At what bundle count should the display switch from card grid to compact list?

**Context:** Neither the UX nor UI plan specifies a breakpoint. With 2 bundles, a card grid makes sense. With 200 bundles, individual cards become impractical and a compact list with sorting/filtering would be more useful.

**Recommendation:** Defer this decision. Start with card grid only (the current requirement). When real data reveals the practical threshold, add a grid/list toggle as a separate enhancement. The component architecture should support both layouts through a `renderItem` pattern, but only the grid implementation is needed now.

**Impact:** Low -- architectural guidance only, no immediate implementation.

---

### Q8 -- Keyboard Shortcut Scope

**Question:** Should keyboard shortcuts (1/2/3 for modes, R for rationale) be active globally or only when the coverage grid has focus?

**Context:** The AIA plan defines global shortcuts. However, global number keys could conflict with other spatial ZUI interactions (e.g., the command palette, text inputs in future features).

**Recommendation:** Scoped activation. Shortcuts are active when:
1. No text input or command palette is focused.
2. The coverage grid is visible (not in a full-screen modal or builder mode).

Implementation: Check `document.activeElement` tag name and the current morph state before handling shortcuts.

**Impact:** Low -- a guard condition in the keyboard event handler.

---

## Appendix A -- File Manifest

New files to be created during implementation:

| File | Phase | Purpose |
|------|-------|---------|
| `src/lib/interfaces/intel.ts` | 1 | Type definitions for bundles, decisions, view modes |
| `src/lib/bundle-transforms.ts` | 2 | Transform functions for markers, feed items, metrics |
| `src/hooks/use-intel-bundles.ts` | 2 | TanStack Query hook for bundle fetching |
| `src/hooks/use-bundle-detail.ts` | 2 | TanStack Query hook for single bundle detail |
| `src/components/coverage/ViewModeToggle.tsx` | 3 | Segmented control for view mode switching |
| `src/components/coverage/BundleCard.tsx` | 3 | Individual bundle display card |
| `src/components/coverage/ConfidenceIndicator.tsx` | 3 | Confidence badge and arc gauge |
| `src/components/coverage/RiskScoreBadge.tsx` | 3 | Risk score with cyan-magenta gradient |
| `src/components/coverage/BundleMapMarkerLayer.tsx` | 4 | Map markers for bundles |
| `src/components/coverage/BundleMapPopup.tsx` | 4 | Map marker click popup |
| `src/components/coverage/TriageRationalePanel.tsx` | 5 | Slide-out triage detail panel |
| `src/hooks/use-animated-number.ts` | 6 | Spring-based number animation hook |

Existing files to be modified:

| File | Phase | Nature of Change |
|------|-------|-----------------|
| `src/stores/coverage.store.ts` | 1 | Add viewMode, selectedBundleId, transition state, URL sync |
| `src/components/coverage/CoverageGrid.tsx` | 4 | Multi-mode rendering logic |
| `src/components/coverage/CategoryCard.tsx` | 4 | Bundle data display, confidence/risk indicators |
| `src/components/coverage/CoverageMap.tsx` | 4 | Bundle marker layer integration |
| `src/components/coverage/CoverageOverviewStats.tsx` | 4 | Mode-specific aggregate metrics |
| `src/components/ambient/feed-panel.tsx` | 4 | Triage feed mode, approval rate bar |
| `src/components/ambient/system-status-panel.tsx` | 4 | Triage status, confidence, risk distribution |
| `src/components/ui/SpatialBreadcrumb.tsx` | 4 | View mode indicator |
| `src/components/district-view/district-view-header.tsx` | 5 | Inline triage summary |
| `src/hooks/use-coverage-map-data.ts` | 4 | Bundle marker data source |

---

## Appendix B -- Resolved Conflicts Summary

For quick reference, here are all conflicts identified between the four specialist plans and their resolutions:

| # | Conflict | Resolution | Rationale |
|---|----------|-----------|-----------|
| 1 | Store location: separate vs extend | Extend `coverage.store.ts` | Co-location avoids cross-store sync; view mode is intrinsically coupled to coverage data |
| 2 | ViewMode values: `bundles` vs `all-bundles` vs `all_bundles` | `'triaged' \| 'all-bundles' \| 'raw'` | URL-friendly, unambiguous, validated by data layer |
| 3 | Type completeness: 12/6 fields vs 25/19 fields | Use data layer's comprehensive types | Verified against schema; simplified types omit fields needed for detail views |
| 4 | Hook design: store-read vs parameter | Parameter-based | More testable, more explicit, matches existing codebase pattern |
| 5 | Component strategy: modify vs create | Hybrid | Adapt existing for layout surfaces; create new for novel UI elements |
| 6 | TriageRationalePanel: inline vs slide-out | Both | Progressive disclosure: compact inline summary + full slide-out on demand |
| 7 | Confidence thresholds: 4-tier vs 3-tier | 3-tier (UX) + continuous gauge (UI) | Complementary: tier for label/ARIA, gauge for visual precision |
| 8 | Risk score colors: severity palette vs cyan-magenta | Cyan-magenta spectrum | Visually distinguishes risk from severity; avoids color overloading |
