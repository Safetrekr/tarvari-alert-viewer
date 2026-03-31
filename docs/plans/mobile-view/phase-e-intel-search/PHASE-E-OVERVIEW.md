# Phase E Overview: Intel Tab + Search

> **Synthesized by:** CTA
> **Parent Plan:** combined-recommendations.md (Phase Decomposition, Phase E)
> **Date:** 2026-03-06
> **Status:** Draft

---

## 1. Phase Summary

Phase E delivers the Intel tab content, geographic region drill-down, intel search, and the cross-tab navigation wiring that connects all three mobile tabs into a cohesive navigation system. When an analyst switches to the Intel tab, they see a chronological intel feed (or bundle cards depending on view mode), a geographic intelligence section with AI-generated regional threat summaries, and a search entry point. Tapping a region card opens a bottom sheet with per-category breakdown, severity distribution, key events, and a "Show on Map" action. Tapping the search bar opens a full-screen overlay with debounced real-time search, category filter chips, and recent search history. Cross-tab navigation handlers enable flowing from any alert context -- Situation tab category detail, Map tab marker detail, Intel tab feed, or search results -- to any other tab with full context preservation. URL deep linking reads and writes `?tab=`, `?category=`, and `?alert=` parameters for shareable links.

Phase E contains three workstreams totaling approximately 10 new files, 3 modified files, and 2 CSS files. All components consume existing TanStack Query hooks (`useIntelFeed`, `useIntelBundles`, `useAllGeoSummaries`, `useLatestGeoSummary`, `useIntelSearch`, `useCoverageMapData`) and introduce no new API endpoints. One new Zustand store field is introduced (the transient `shareConfirmId` state in MobileView, kept as React local state per AD-E.3-5). One new static data file (`REGION_CENTROIDS`) is introduced for geographic fly-to. Four adapter functions bridge feed, priority, search, and key-event data shapes to the `CategoryIntelItem` contract established by WS-D.2.

**Risk profile:** Medium. One BLOCKING cross-SOW conflict (duplicate `THREAT_LEVEL_COLORS` definition with divergent values and file locations) must be resolved before implementation. Three WARNING-level issues (adapter directory inconsistency, MobileIntelTab prop interface gap, upstream `MOBILE_TABS` constant availability) require coordination but do not block individual workstream starts. The persistent `MobileStateView` gap from Phase A remains unresolved and directly affects E.1.

**Key constraint:** Phase E's internal dependency chain is strictly sequential (E.1 then E.2 then E.3). Unlike Phase D where D.1 and D.2 could run in parallel, no parallelism is possible within Phase E. Any delay in E.1 cascades directly to E.2 and E.3.

**Key deliverables at phase exit:**
- Intel tab renders a view-mode-aware feed (raw/triaged items or bundle cards), a geographic intelligence section with global + regional threat summary cards, and a sticky search entry point
- Tapping a region card opens a two-snap-point bottom sheet (50%/100%) with threat level badge, per-category breakdown bars, severity distribution, key events, recommendations, and "Show on Map" action
- Tapping the search bar opens a full-screen slide-from-right overlay with auto-focused input, 300ms debounced results, category filter chips, and localStorage-persisted recent searches
- "Show on Map" from any alert context (Situation, Map, Intel, Search) flies the map to the correct location
- "View Category" from any alert context switches to the Situation tab and opens the category detail sheet
- "Share" from any alert context copies a deep link URL to the clipboard with 1.5s visual feedback
- "View on Map" from a geographic summary card switches to the Map tab and flies to the region centroid
- URL deep linking restores tab, category, and alert state on page load
- Tab switching clears transient state (map alerts, pre-selected alerts, geo summary panel) and updates the URL
- Desktop rendering remains completely unaffected

---

## 2. SOW Summary Table

| SOW | Title | Agent | Size | New Files | Modified Files | Depends On | Blocks |
|-----|-------|-------|------|-----------|----------------|------------|--------|
| WS-E.1 | Intel Tab | `information-architect` | M | `intel-adapters.ts`, `threat-level-colors.ts`, `MobileRegionCard.tsx`, `MobileIntelTab.tsx`, `mobile-intel-tab.css`, unit tests | `MobileView.tsx` (integration) | WS-D.2, WS-A.2, WS-A.3, WS-B.1 | WS-E.2, WS-E.3 |
| WS-E.2 | Region Detail + Search | `information-architect` | M | `search-adapters.ts`, `use-recent-searches.ts`, `MobileRegionDetail.tsx`, `MobileSearchOverlay.tsx`, `mobile-region-search.css`, unit tests | `mobile.ts` (SHEET_CONFIGS), `coverage.ts` (THREAT_LEVEL_COLORS) | WS-E.1, WS-D.2, WS-C.1, WS-A.3 | WS-E.3 |
| WS-E.3 | Cross-Tab Links | `react-developer` | M | `region-centroids.ts`, `mobile-url-sync.ts`, `use-mobile-deep-links.ts`, `cross-tab-links.test.ts` | `MobileView.tsx` (handlers + prop threading) | WS-D.2, WS-D.3, WS-E.1, WS-E.2, WS-C.3, WS-A.2 | WS-F.4, WS-F.5 |

**Agent split:** E.1 and E.2 are assigned to `information-architect` (content components, visual spec, geographic data rendering, search UX). E.3 is assigned to `react-developer` (handler wiring, URL sync, state cleanup, deep linking, prop threading).

**Critical path:** Strictly sequential. E.1 must complete before E.2 can start (E.2 depends on region card tap trigger and search bar entry point from E.1). E.3 depends on both E.1 and E.2. No parallelism within the phase.

---

## 3. Cross-SOW Conflicts

### Conflict 1: `THREAT_LEVEL_COLORS` duplicate definition with divergent values -- BLOCKING

**WS-E.1** (D-2) creates `THREAT_LEVEL_COLORS` at `src/lib/threat-level-colors.ts` using posture tokens:

```typescript
export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  LOW:      'var(--posture-low-color, #22c55e)',
  MODERATE: 'var(--posture-moderate-color, #eab308)',
  ELEVATED: 'var(--posture-elevated-color, #f97316)',
  HIGH:     'var(--posture-high-color, #ef4444)',
  CRITICAL: 'var(--posture-critical-color, #dc2626)',
}
```

Also exports `THREAT_LEVEL_BG` (alpha tints) and `THREAT_LEVEL_LABELS` (human-readable strings).

**WS-E.2** (D-2) creates `THREAT_LEVEL_COLORS` at `src/lib/interfaces/coverage.ts` using threat tokens:

```typescript
export const THREAT_LEVEL_COLORS: Record<ThreatLevel, string> = {
  CRITICAL: 'var(--threat-critical, #dc2626)',
  HIGH:     'var(--threat-high, #ea580c)',      // <-- orange, not red
  ELEVATED: 'var(--threat-elevated, #eab308)',
  MODERATE: 'var(--threat-moderate, #3b82f6)',  // <-- blue, not yellow
  LOW:      'var(--threat-low, #22c55e)',
}
```

Also exports `getThreatLevelColor()` helper.

**Why BLOCKING:**

1. **Same constant name, different files.** TypeScript consumers would get ambiguous imports depending on which file they import from.
2. **Different CSS custom property namespaces.** E.1 uses `--posture-*` tokens (which exist in WS-B.1's `POSTURE_CONFIGS`). E.2 uses `--threat-*` tokens (which do not yet exist in any token file). If both token sets are undefined, the fallback hex values determine the actual rendered color.
3. **Divergent hex fallbacks for HIGH and MODERATE.** E.1 maps HIGH to red (`#ef4444`) and MODERATE to yellow (`#eab308`). E.2 maps HIGH to orange (`#ea580c`) and MODERATE to blue (`#3b82f6`). An analyst viewing a "HIGH" threat badge on a region card (E.1) would see red, but viewing the same badge in region detail (E.2) would see orange.
4. **E.2's AD-9 directly contradicts E.1's AD-4.** E.2 AD-9 says "placing both [THREAT_LEVEL_COLORS and SEVERITY_COLORS] in the same file maintains the single-file convention." E.1 AD-4 says "a small dedicated file maintains clear module boundaries."

**Resolution:** Single definition in `src/lib/interfaces/coverage.ts` (E.2's location), since it co-locates with the `ThreatLevel` type, `THREAT_LEVELS` array, and existing `SEVERITY_COLORS`. Use the `--posture-*` token names from E.1 (they already exist in WS-B.1's `POSTURE_CONFIGS`). Use E.1's hex fallbacks (they align with the severity color palette conventions: red for high-severity, yellow for moderate). Merge E.1's `THREAT_LEVEL_BG` and `THREAT_LEVEL_LABELS` into the same file. Both workstreams import from `@/lib/interfaces/coverage`. Delete the planned `src/lib/threat-level-colors.ts` file from E.1.

---

### Conflict 2: Adapter file directory inconsistency -- WARNING

**WS-E.1** creates `src/lib/adapters/intel-adapters.ts` (new `adapters/` subdirectory under `lib/`).

**WS-E.2** creates `src/lib/search-adapters.ts` (top-level in `lib/`).

Both files serve the same architectural purpose: pure functions mapping data shapes to `CategoryIntelItem` for `MobileAlertCard` consumption. Using two different directory strategies within the same phase creates organizational inconsistency.

**Resolution:** Standardize on `src/lib/adapters/` directory for both files. E.1's `intel-adapters.ts` and E.2's `search-adapters.ts` both live at `src/lib/adapters/`. Import paths update to `@/lib/adapters/intel-adapters` and `@/lib/adapters/search-adapters`. The `adapters/` directory convention is clean and future-proof for additional adapters.

---

### Conflict 3: MobileIntelTab prop interface gap -- WARNING

**WS-E.1** (D-5) defines `MobileIntelTabProps` with 4 props:

```typescript
export interface MobileIntelTabProps {
  readonly onSearchPress: () => void
  readonly onAlertTap: (item: CategoryIntelItem) => void
  readonly onRegionTap: (summary: GeoSummary) => void
  readonly scrollRef?: React.RefObject<HTMLDivElement | null>
}
```

**WS-E.3** (D-8) threads 7 props to `MobileIntelTab`:

```typescript
<MobileIntelTab
  onAlertTap={handleIntelAlertTap}
  onViewCategory={navigateToCategory}       // NOT IN E.1
  onShowOnMap={navigateToMap}                // NOT IN E.1
  onShareAlert={handleShareAlert}            // NOT IN E.1
  onViewRegionOnMap={handleViewRegionOnMap}   // NOT IN E.1
  shareConfirmId={shareConfirmId}             // NOT IN E.1
/>
```

The 5 extra props (`onViewCategory`, `onShowOnMap`, `onShareAlert`, `onViewRegionOnMap`, `shareConfirmId`) are needed by E.3 to thread cross-tab handlers to the nested alert detail sheets opened from the Intel tab context. E.1's scope explicitly excludes cross-tab navigation ("WS-E.3 scope" in the Out of Scope table), so the props are intentionally absent from E.1. But E.3's implementation will require modifying E.1's deliverable to accept and forward these props.

**Resolution:** E.3 must extend `MobileIntelTabProps` as part of its deliverables. Document this as a known retroactive modification to E.1's component. The extended interface should be:

```typescript
export interface MobileIntelTabProps {
  // From E.1
  readonly onSearchPress: () => void
  readonly onAlertTap: (item: CategoryIntelItem) => void
  readonly onRegionTap: (summary: GeoSummary) => void
  readonly scrollRef?: React.RefObject<HTMLDivElement | null>
  // Added by E.3 for cross-tab handler threading
  readonly onViewCategory?: (categoryId: string) => void
  readonly onShowOnMap?: (alertId: string, coords: { lat: number; lng: number }, category: string, basic: { title: string; severity: string; ingestedAt: string }) => void
  readonly onShareAlert?: (alertId: string) => void
  readonly onViewRegionOnMap?: (regionKey: string) => void
  readonly shareConfirmId?: string | null
}
```

Optional props (`?`) ensure E.1 can be implemented and tested without E.3's handlers.

---

### Conflict 4: `MOBILE_TABS` and `DEFAULT_MOBILE_TAB` constants -- WARNING (upstream)

**WS-E.3** (D-4, line 299) imports `MOBILE_TABS` and `DEFAULT_MOBILE_TAB` from `src/lib/interfaces/mobile.ts`:

```typescript
import { MOBILE_TABS, DEFAULT_MOBILE_TAB } from '@/lib/interfaces/mobile'
```

**WS-A.2** defines the `MobileTab` type (`'situation' | 'map' | 'intel'`) in `src/lib/interfaces/mobile.ts` but does not explicitly export an array constant `MOBILE_TABS` or a default constant `DEFAULT_MOBILE_TAB` in the Phase A SOW.

**Resolution:** These constants should be added to WS-A.2's deliverables in `src/lib/interfaces/mobile.ts`:

```typescript
export const MOBILE_TABS = ['situation', 'map', 'intel'] as const
export type MobileTab = (typeof MOBILE_TABS)[number]
export const DEFAULT_MOBILE_TAB: MobileTab = 'situation'
```

If WS-A.2 has already been implemented without these constants, add them as part of E.3 implementation. This is a low-risk addition (two lines, no behavioral change).

---

### Persistent Gap: MobileStateView component -- WARNING (upstream, carried from Phase A)

**WS-E.1** depends on `MobileStateView` from WS-A.2 for loading, error, and empty state rendering in both the feed section (5 shimmer rows) and the geographic intelligence section (3 shimmer cards). This component has been an unresolved dependency gap since Phase A, carried through Phases B, C, D, and now E.

| Phase | Reference | Status |
|-------|-----------|--------|
| A | Section 9.1 gap | Identified |
| B | Conflict 3 | Carried forward |
| C | Not explicitly mentioned | Implicit via C.4 |
| D | R-D.5 risk | Carried forward |
| E | E.1 Input Dependencies table, line 83 | Still Pending (WS-A.2) |

**Resolution:** MobileStateView must be delivered before E.1 starts. If WS-A.2 has not produced it, create a minimal implementation as a prerequisite task:

```typescript
// src/components/mobile/MobileStateView.tsx
interface MobileStateViewProps {
  query: UseQueryResult
  skeletonComponent?: ReactNode
  emptyTitle?: string
  emptyMessage?: string
  retryLabel?: string
}
```

This is a ~60-line component (loading skeleton, error with retry, empty state). Assign to whichever agent implements E.1.

---

## 4. Architecture Decisions Digest

Phase E produces 25 architecture decisions across three workstreams.

### Cross-Cutting Decisions

| ID | Decision | SOWs | Impact |
|----|----------|------|--------|
| AD-E.1-2, E.2-4 | Adapter functions bridge data shapes to `CategoryIntelItem` rather than generalizing `MobileAlertCard` props | E.1, E.2 | 4 adapter functions total. Preserves D.2's prop contract. Each adapter is <30 lines and independently testable. |
| AD-E.3-1 | URL sync uses `history.replaceState` exclusively (never `pushState`) | E.3 | Cross-tab navigation is lateral, not forward. Consistent with `syncCategoriesToUrl()` pattern. Does not conflict with WS-C.2's `pushState` for sheet history. |
| AD-E.3-4 | `REGION_CENTROIDS` separate from `COUNTRY_CENTROIDS` (WS-D.2) | E.3 | Different geographic reference systems: 14 multi-country regions vs ~200 ISO country codes. Different zoom levels. TypeScript `Record<GeoRegionKey, ...>` enforces exhaustiveness. |
| AD-E.3-8 | No new Zustand store actions introduced | E.3 | All cross-tab wiring composes existing store primitives (`selectMapAlert`, `clearMapAlert`, `toggleCategory`, `startMorph`, `resetMorph`, etc.). |

### Per-Workstream Key Decisions

**WS-E.1:**
- AD-1: Intel feed uses `useIntelFeed()` (all categories, chronological), not `usePriorityFeed()` (P1/P2 only). Different intent from Situation tab.
- AD-3: `MobileRegionCard` is a dedicated component, not a reuse of `MobileAlertCard`. Fundamentally different data shape and visual treatment.
- AD-5: Search bar is a `<button>` styled as input. Prevents premature keyboard on tap.
- AD-6: Geographic summaries sorted by threat level severity descending (CRITICAL first). Surfaces urgency.
- AD-8: Pull-to-refresh readiness via forwarded `scrollRef` prop, not context.

**WS-E.2:**
- AD-1: Region detail uses `MobileBottomSheet` (two-snap progressive disclosure), not full-screen overlay.
- AD-2: Search uses full-screen overlay (not bottom sheet). Avoids drag-vs-scroll conflict with search input.
- AD-3: Region detail snap points `[50, 100]` (two stops). Simpler content than category detail's three stops.
- AD-6: Recent searches in `localStorage`, not Zustand or sessionStorage. Persists across sessions.
- AD-7: Search overlay dismissal via swipe-right (not swipe-down). Avoids scroll conflict.
- AD-8: Category filter chips use single-select. Matches current API capability (`category?: string`).

**WS-E.3:**
- AD-2: Share URLs are minimal (`?tab=situation&category=...&alert=...`). No transient filter state.
- AD-3: `handleViewRegionOnMap` clears all category filters. Region views are cross-category.
- AD-5: `shareConfirmId` lives in MobileView React state, not Zustand. Ephemeral 1.5s UI feedback.
- AD-6: `useMobileDeepLinks` uses `useRef` guard for React 19 strict mode double-mount prevention.
- AD-7: `clearMobileUrlParams` does NOT clear `?category=`. Param has dual purpose across desktop/mobile.

---

## 5. Dependency Chain Verification

### Internal Phase E Chain

```
E.1 (Intel Tab)
  |
  +--blocks--> E.2 (Region Detail + Search)
  |              |
  |              +--blocks--> E.3 (Cross-Tab Links)
  |                             |
  +--blocks------------------->+
```

**Strictly sequential.** No parallelism possible within Phase E.

### Upstream Dependencies (bidirectional verification)

| Consumer | Depends On | Verified in Upstream "Blocks"? | Status |
|----------|-----------|-------------------------------|--------|
| E.1 | WS-D.2 (MobileAlertCard) | D.2 blocks D.3, E.3 -- **missing E.1** | GAP |
| E.1 | WS-A.2 (MobileShell, MobileTab, MobileStateView) | A.2 foundational | OK |
| E.1 | WS-A.3 (design tokens) | A.3 foundational | OK |
| E.1 | WS-B.1 (derivePosture, PostureConfig) | B.1 foundational for posture | OK |
| E.2 | WS-E.1 (region card tap, search bar entry) | E.1 blocks E.3 -- **missing E.2** | GAP |
| E.2 | WS-D.2 (MobileAlertCard) | D.2 blocks D.3, E.3 -- **missing E.2** | GAP |
| E.2 | WS-C.1 (MobileBottomSheet, SHEET_CONFIGS) | C.1 foundational for sheets | OK |
| E.2 | WS-A.3 (design tokens) | A.3 foundational | OK |
| E.3 | WS-D.2 (MobileAlertDetail action buttons) | D.2 blocks E.3 | OK |
| E.3 | WS-D.3 (navigateToCategory, navigateToMap) | D.3 blocks E.3 | OK |
| E.3 | WS-E.1 (MobileIntelTab) | E.1 blocks E.3 | OK |
| E.3 | WS-E.2 (MobileRegionDetail onShowOnMap) | E.2 blocks E.3 | OK |
| E.3 | WS-C.3 (MobileMapView externalMapRef) | C.3 -- not verified | NEEDS CHECK |
| E.3 | WS-A.2 (MobileShell tab state, MOBILE_TABS) | A.2 foundational | OK (with Conflict 4 caveat) |

### Downstream Dependencies

| Provider | Blocks | Verified in Downstream "Depends On"? |
|----------|--------|--------------------------------------|
| E.3 | WS-F.4 (protective ops hooks) | Forward reference -- Phase F not yet synthesized |
| E.3 | WS-F.5 (pull-to-refresh) | Forward reference -- Phase F not yet synthesized |

### Cross-Reference Gaps Requiring Upstream SOW Amendments

1. **WS-D.2 "Blocks"** should include WS-E.1 and WS-E.2 (currently lists only WS-D.3 and WS-E.3)
2. **WS-E.1 "Blocks"** should include WS-E.2 (currently lists only WS-E.3)
3. **WS-C.3 "Blocks"** should include WS-E.3 (E.3 depends on `externalMapRef` for `flyTo`)

---

## 6. Risk Register

### Inherited Risks (from individual SOWs)

| ID | Source | Risk | Likelihood | Impact | Mitigation |
|----|--------|------|------------|--------|------------|
| R-E.1-3 | E.1 | `ViewModeToggle` overflows at 375px mobile width (designed for desktop) | Medium | Medium | Visual test at 375px. Wrap in scroll container or create mobile variant in Phase F. |
| R-E.1-4 | E.1 | 50 `MobileAlertCard` instances cause scroll jank on older devices | Low | Medium | Cards are `memo`-wrapped. Minimal backdrop-filter. Windowed rendering via `react-window` deferred to Phase F. |
| R-E.1-5 | E.1 | Alert detail sheet may not open correctly from Intel tab context (pattern designed for map marker taps) | Low | Medium | `onAlertTap` constructs `{ title, severity, ingestedAt }` from `CategoryIntelItem`. Same `selectMapAlert` store action as WS-C.4. |
| R-E.2-2 | E.2 | `SearchResult` lacks `ingestedAt`, causing "NOW" display for all search results | Medium | Medium | Document as known limitation. Enhance search API to return `ingested_at` if updated before implementation. |
| R-E.2-3 | E.2 | Swipe-right-to-dismiss may conflict with text selection in search input | Low | Medium | Constrain `drag="x"` to fire only outside input element. |
| R-E.2-5 | E.2 | `structuredBreakdown` may arrive as JSON string instead of parsed object | Low | Medium | Normalizer in `useLatestGeoSummary` handles this. Defensive null checks downstream. |
| R-E.3-4 | E.3 | Race condition between `handleTabChange` cleanup and `navigateToMap` 100ms timeout | Very Low | Medium | Timing analysis shows final state is correct in all orderings. Sub-100ms sequential taps improbable. |
| R-E.3-5 | E.3 | `useMobileDeepLinks` `queueMicrotask` may fire `startMorph` before tab content renders | Very Low | Low | Zustand updates are synchronous. React batches both state changes. Sheet renders above tab content (z-30). |
| R-E.3-6 | E.3 | Dual deep link processing if desktop and mobile trees both mount | Very Low | Medium | Mutually exclusive code-splitting gate (WS-A.1). `hasApplied` ref guard provides defense-in-depth. |

### Synthesis-Level Risks (cross-SOW)

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-S1 | Strictly sequential critical path (E.1 then E.2 then E.3) means any delay in E.1 cascades to the entire phase | Medium | High | E.1 has no E-internal dependencies and depends only on stable prior-phase deliverables. Prioritize E.1 completion. |
| R-S2 | Unresolved `THREAT_LEVEL_COLORS` conflict causes merge conflict or inconsistent badge rendering | High (if unresolved) | High | MUST resolve before E.1 implementation begins. See Conflict 1 resolution. |
| R-S3 | MobileIntelTab prop interface gap causes E.3 to retroactively modify E.1's deliverables | Medium | Low | E.3's prop additions are optional (`?`) and do not break E.1's existing implementation. Document as expected. |
| R-S4 | `MobileStateView` still undelivered after 5 phases | Medium | Medium | Implement minimal version (~60 lines) as E.1 prerequisite if WS-A.2 has not produced it. |
| R-S5 | `MOBILE_TABS` and `DEFAULT_MOBILE_TAB` constants missing from WS-A.2 | Low | Low | Two-line addition to `mobile.ts`. Can be added during E.3 implementation. |

---

## 7. Estimated Effort

| SOW | Agent | Size | Estimated Hours | Key Complexity Drivers |
|-----|-------|------|-----------------|----------------------|
| WS-E.1 | `information-architect` | M | 11--12h | MobileIntelTab (~250 lines), MobileRegionCard (~120 lines), MobileBundleCard (~80 lines), view-mode-aware rendering, geographic summary ordering, 2 adapter functions |
| WS-E.2 | `information-architect` | M | 13--15h | MobileRegionDetail (~200 lines, two-snap progressive disclosure, per-category bars, severity distribution), MobileSearchOverlay (~250 lines, auto-focus, debounced search, filter chips, swipe-to-dismiss, recent searches), useRecentSearches hook, 2 adapter functions |
| WS-E.3 | `react-developer` | M | 12--14h | 5 handler functions, syncMobileUrlParams utility (~140 lines), useMobileDeepLinks hook, 6-step tab cleanup, prop threading across all three tabs, 29 unit tests (~350 lines) |
| **Total** | | **3 x M** | **36--41h** | |

**Comparison to prior phases:**

| Phase | Workstreams | Sizes | Estimated Hours | Parallelism |
|-------|-------------|-------|-----------------|-------------|
| A | 4 | S, M, M, S | 13--19h | Partial (A.1 independent, A.3 depends on A.2) |
| B | 3 | M, M, S | 19--26h | Partial (B.1 independent, B.3 depends on B.1) |
| D | 3 | L, M, M | 22--33h | Partial (D.1 and D.2 parallel, D.3 depends on both) |
| **E** | **3** | **M, M, M** | **36--41h** | **None (strictly sequential)** |

Phase E's higher estimate relative to Phase D (despite all-M sizes vs D's L+M+M) is driven by:
1. E.2 contains two substantial components (region detail + search overlay) that would individually be M-sized
2. E.3's 29 unit tests and URL sync utility add significant testing overhead
3. Zero parallelism means elapsed time equals sum of all workstreams

---

## 8. Open Questions

### Requiring Resolution Before Implementation

| ID | Question | Source | Owner | Target |
|----|----------|--------|-------|--------|
| OQ-E.1 | Should search result cards show the relevance `score` (0.0--1.0) or the `snippet` with highlighted terms? `MobileAlertCard` does not currently render `shortSummary` in its compact layout, so the adapted snippet would be invisible. | E.2 OQ-2 | UX Designer + IA | Before E.2 implementation |
| OQ-E.2 | Should tapping a `KeyEvent` in region detail open the alert detail sheet (requires matching to an actual intel item by title search) or navigate to the category district view? Current `onEventTap` passes basic event data but not an alert ID. | E.2 OQ-5 | IA | Before E.2 implementation |
| OQ-E.3 | Should the deep link URL include `?view=` to restore view mode (triaged/all-bundles/raw)? Currently omitted per AD-E.3-2 (minimal stable URLs). | E.3 OQ-2 | IA | Phase E review gate |
| OQ-E.4 | The `?category=seismic` param has different behavior on desktop (sets filter) vs mobile (opens detail sheet). Is this acceptable for shared URLs? | E.3 OQ-3 | Planning coordinator | Phase E review gate |

### Deferred to Phase F

| ID | Question | Source | Deferral Rationale |
|----|----------|--------|--------------------|
| OQ-E.5 | Auto-scroll to top on new intel items, or preserve scroll position? | E.1 OQ-1 | Polish decision, not structural |
| OQ-E.6 | Search bar collapse/hide on scroll-down (iOS Safari-style)? | E.1 OQ-2 | Adds complexity, unclear UX benefit |
| OQ-E.7 | Landscape variant foundation in E.1? | E.1 OQ-3 | WS-F.1 scope |
| OQ-E.8 | Bundle card tap behavior if WS-C.2 not wired? | E.1 OQ-5 | Acceptable as no-op until sheet wired |
| OQ-E.9 | Web Share API (`navigator.share()`) instead of clipboard copy? | E.3 OQ-1 | Enhancement, HTTPS-only, mobile-native |
| OQ-E.10 | Region boundary polygon overlay on map for "Show on Map"? | E.3 OQ-4 | Requires new map layer work |
| OQ-E.11 | `/console/intel?region=...` API endpoint for region-filtered feed? | E.2 OQ-1 | Backend scope (TarvaRI API) |
| OQ-E.12 | Voice search input via Web Speech API? | E.2 OQ-4 | Significant complexity, accessibility win but deferred |

---

## 9. Recommendations

### R-E.1: Resolve THREAT_LEVEL_COLORS before E.1 implementation begins (BLOCKING)

**Action:** Create a single `THREAT_LEVEL_COLORS` definition in `src/lib/interfaces/coverage.ts`, co-located with the `ThreatLevel` type and existing `SEVERITY_COLORS`. Use the `--posture-*` CSS custom property names from E.1 (they already exist in WS-B.1's `POSTURE_CONFIGS`). Use E.1's hex fallback values (they align with the severity color palette: red for high, yellow for moderate). Merge E.1's `THREAT_LEVEL_BG` and `THREAT_LEVEL_LABELS` into the same file. Export E.2's `getThreatLevelColor()` helper. Delete the planned `src/lib/threat-level-colors.ts` from E.1's deliverables.

Both workstreams import from `@/lib/interfaces/coverage`. Update E.1 D-2 and E.2 D-2 references accordingly.

### R-E.2: Standardize adapter file directory at `src/lib/adapters/`

**Action:** E.1's `intel-adapters.ts` and E.2's `search-adapters.ts` both live at `src/lib/adapters/`. The `adapters/` subdirectory is created by E.1 (which executes first). E.2 follows the same convention. This prevents top-level `src/lib/` clutter and establishes a clear pattern for future adapters.

### R-E.3: Pre-define MobileIntelTab extended prop interface

**Action:** When E.1 defines `MobileIntelTabProps`, include the cross-tab handler props as optional fields from the start. This prevents E.3 from needing to retroactively modify E.1's interface. The optional nature (`?`) means E.1 can implement and test without providing handler values. E.3 then provides the concrete handler functions.

### R-E.4: Add MOBILE_TABS and DEFAULT_MOBILE_TAB to WS-A.2 deliverables

**Action:** Ensure `src/lib/interfaces/mobile.ts` exports `MOBILE_TABS` as a `const` array and `DEFAULT_MOBILE_TAB` as a typed constant. If WS-A.2 has already been implemented without these, add them as a 2-line addendum during E.3 implementation (zero risk, no behavioral change).

### R-E.5: Resolve MobileStateView before E.1 starts

**Action:** This component has been carried as an unresolved gap for 5 phases. E.1 depends on it for loading/error/empty states in two sections. Assign its implementation (~60 lines) as a prerequisite task to whichever agent picks up E.1. If WS-A.2 delivers it first, use that implementation. If not, create a minimal version with the documented prop interface:

```typescript
interface MobileStateViewProps {
  query: UseQueryResult
  skeletonComponent?: ReactNode
  emptyTitle?: string
  emptyMessage?: string
  retryLabel?: string
}
```

### R-E.6: Fix cross-reference gaps in upstream SOW "Blocks" fields

**Action:** Amend the following upstream SOWs:
- **WS-D.2:** Add WS-E.1 and WS-E.2 to the "Blocks" field
- **WS-E.1:** Add WS-E.2 to the "Blocks" field
- **WS-C.3:** Add WS-E.3 to the "Blocks" field (E.3 depends on `externalMapRef` for `flyTo`)

### R-E.7: Phase E review gate before Phase F planning

**Action:** After E.3 completes, hold a review gate that verifies:
1. All 3 tabs are navigable with full cross-tab context
2. URL deep links round-trip correctly (write -> read -> restore state)
3. Tab switch cleanup leaves no orphaned state
4. "Show on Map" works from all 4 alert contexts (Situation, Map, Intel, Search)
5. Geographic summary cards render consistent threat level colors everywhere
6. MobileStateView is stable across all loading/error/empty scenarios
7. All 29 cross-tab-links unit tests pass
8. Desktop view remains byte-for-byte identical

This gate is the prerequisite for Phase F planning (polish, landscape, pull-to-refresh, protective ops).
