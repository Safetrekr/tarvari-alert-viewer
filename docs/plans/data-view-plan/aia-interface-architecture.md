# Interface Architecture: Data View Mode System

**Project:** TarvaRI Alert Viewer
**Date:** 2026-03-04
**Status:** Draft
**Scope:** View Mode toggle (Triaged / All Bundles / Raw Alerts) with full spatial integration

---

## Table of Contents

1. [Product Architecture](#1-product-architecture)
2. [Information Hierarchy](#2-information-hierarchy)
3. [State Management Architecture](#3-state-management-architecture)
4. [Data Layer](#4-data-layer)
5. [Component Architecture](#5-component-architecture)
6. [Multi-Surface Interaction Map](#6-multi-surface-interaction-map)
7. [Transition Choreography](#7-transition-choreography)
8. [Run Supervision UX](#8-run-supervision-ux)
9. [Implementation Sequence](#9-implementation-sequence)

---

## 1. Product Architecture

### 1.1 Design Intent

The user's core question is: **"Should I act on this intel?"** The current raw-alerts view
answers "What happened?" but not "What should I do?" The view mode system bridges that gap by
surfacing TarvaRI's triage pipeline output -- approved bundles with LLM-generated rationale,
risk scores, and confidence metrics -- as the default, decision-ready interface.

Three view modes form a progressive disclosure stack:

```
TRIAGED (default)          ALL BUNDLES               RAW ALERTS
Decision-ready intel       Full pipeline output       Unprocessed source data
Only approved bundles      Approved + rejected        All intel_normalized rows
Risk scores + rationale    Triage decisions visible   Individual alerts
"What should I act on?"    "What was filtered?"       "What came in?"
```

### 1.2 Spatial Integration Model

The view mode toggle is a **global lens** -- it changes the data substrate beneath the spatial
ZUI without changing the spatial structure. The category grid, map, panels, and district views
all remain in place; only their data source and visual treatment change.

```
+------------------------------------------------------------------+
|  NavigationHUD (fixed, z-40)                                     |
|  +--------------------+                                          |
|  | [View Mode Toggle] |  <-- new: positioned top-center         |
|  +--------------------+                                          |
|                                                                  |
|  +--SpatialViewport-----------------------------------------+   |
|  |  +--SpatialCanvas--------------------------------------+ |   |
|  |  |                                                      | |   |
|  |  |  [SystemStatusPanel]                                 | |   |
|  |  |        |                                             | |   |
|  |  |        |    [CoverageMap]  ---- data changes ----    | |   |
|  |  |        |    [CoverageOverviewStats] -- changes --    | |   |
|  |  |        |    [CoverageGrid] ---- cards adapt -----    | |   |
|  |  |        |                                             | |   |
|  |  |        |               [FeedPanel]  -- changes --    | |   |
|  |  |        |               [ActivityTicker] - changes    | |   |
|  |  |                                                      | |   |
|  |  +------------------------------------------------------+ |   |
|  +------------------------------------------------------------+   |
|                                                                  |
|  [DistrictViewOverlay] ---- scene adapts per view mode ------   |
+------------------------------------------------------------------+
```

### 1.3 URL Persistence

View mode is persisted in the URL query parameter `?view=triaged|bundles|raw` using
the same `replaceState` pattern as category selection in `coverage.store.ts`. This enables
deep-linking to a specific view mode.

```
https://alerts.tarvari.com/?view=triaged                  # default
https://alerts.tarvari.com/?view=bundles&category=weather  # all bundles, weather filtered
https://alerts.tarvari.com/?view=raw&category=seismic      # raw, seismic filtered
```

---

## 2. Information Hierarchy

### 2.1 Triaged View (Default)

The triaged view prioritizes actionable intelligence. Every visible element answers:
"Is this real? How bad? What do I do?"

**Primary (immediate visual weight):**
- Bundle verdict badge: `APPROVED` with green indicator
- Risk score: large numeric display (0-100 scale, Monte Carlo derived)
- Final severity: color-coded level with the standard severity palette
- Confidence aggregate: percentage with visual bar

**Secondary (one interaction away):**
- Triage rationale: the full LLM-generated `note` from `triage_decisions`
- Categories array: multi-category bundles show all affected categories
- Source count: how many distinct sources contributed
- Member intel count: how many raw alerts were clustered into this bundle

**Tertiary (available on demand):**
- Individual member alerts: expandable list of the raw `intel_normalized` rows
- Primary intel ID: the single most representative alert
- Triage decision metadata: reviewer_id, version, decided_at timestamp
- Bundle creation timestamp

### 2.2 All Bundles View

Adds rejected bundles alongside approved ones. The key addition is **contrast** -- users
see what was filtered out and why.

**Primary:** Same as Triaged, plus:
- Decision badge: `APPROVED` (green) or `REJECTED` (red/muted)
- Rejected bundles render at reduced opacity (0.4) with strikethrough severity

**Secondary:** Same, plus:
- Rejection rationale: why the LLM rejected this bundle
- Side-by-side comparison of approved vs rejected decision notes

### 2.3 Raw Alerts View

The current implementation. Individual alerts from `intel_normalized` with no
aggregation or triage context.

**Primary:** Alert title, severity, category
**Secondary:** Source, ingested timestamp, geo location
**Tertiary:** Event type, confidence score, effective/expiry dates

### 2.4 Visual Treatment by View Mode

| Element             | Triaged                          | All Bundles                      | Raw Alerts              |
|---------------------|----------------------------------|----------------------------------|-------------------------|
| Card primary metric | Risk Score (0-100)               | Risk Score + Decision badge      | Source Count             |
| Card secondary      | Confidence + Severity            | Confidence + Severity            | Active Sources           |
| Map markers         | Bundle centroids (larger, pulsing)| Bundle centroids (approved glow, rejected dim) | Individual alert points  |
| Map marker size     | Scaled by risk_score             | Scaled by risk_score             | Uniform small            |
| Feed panel          | Bundle summaries + verdicts      | All bundles + verdicts           | Raw alert titles         |
| Activity ticker     | Triage events (APPROVE/REJECT)   | Triage events                    | ALERT.{category} events  |
| System status       | Pipeline throughput + triage rate | Pipeline stats + rejection rate  | Source health + counts   |
| KPI stats           | Bundles / Risk / Confidence      | Total / Approved / Rejected      | Sources / Active / Categories |

---

## 3. State Management Architecture

### 3.1 New Store: `viewmode.store.ts`

A dedicated Zustand store for view mode state, following the established pattern of
keeping data concerns (coverage.store) separate from animation concerns (ui.store).

```typescript
// src/stores/viewmode.store.ts

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ============================================================================
// Types
// ============================================================================

/**
 * The three data view modes.
 *
 * - triaged:  Only approved bundles (decision-ready intel)
 * - bundles:  All bundles (approved + rejected, shows pipeline output)
 * - raw:      All intel_normalized rows (unprocessed source data)
 */
export type ViewMode = 'triaged' | 'bundles' | 'raw'

/** Labels and descriptions for each view mode (used by toggle UI). */
export const VIEW_MODE_META: Record<ViewMode, { label: string; shortLabel: string; description: string }> = {
  triaged: {
    label: 'Triaged Intel',
    shortLabel: 'TRIAGED',
    description: 'Approved bundles with risk scores and LLM rationale',
  },
  bundles: {
    label: 'All Bundles',
    shortLabel: 'BUNDLES',
    description: 'Full pipeline output including rejected bundles',
  },
  raw: {
    label: 'Raw Alerts',
    shortLabel: 'RAW',
    description: 'Unprocessed individual alerts from all sources',
  },
}

// ============================================================================
// State
// ============================================================================

interface ViewModeState {
  /** Currently active view mode. */
  mode: ViewMode

  /** Previous mode (used for transition direction). Null on first load. */
  previousMode: ViewMode | null

  /** Whether a view mode transition is in progress (data loading). */
  isTransitioning: boolean
}

// ============================================================================
// Actions
// ============================================================================

interface ViewModeActions {
  /** Set the active view mode. Triggers transition state. */
  setMode: (mode: ViewMode) => void

  /** Mark the transition as complete (called when data finishes loading). */
  completeTransition: () => void
}

export type ViewModeStore = ViewModeState & ViewModeActions

// ============================================================================
// Store
// ============================================================================

export const useViewModeStore = create<ViewModeStore>()(
  immer((set) => ({
    mode: 'triaged',
    previousMode: null,
    isTransitioning: false,

    setMode: (mode) =>
      set((state) => {
        if (state.mode === mode) return
        state.previousMode = state.mode
        state.mode = mode
        state.isTransitioning = true
      }),

    completeTransition: () =>
      set((state) => {
        state.isTransitioning = false
      }),
  })),
)

// ============================================================================
// Selectors
// ============================================================================

export const viewModeSelectors = {
  isTriaged: (state: ViewModeStore): boolean => state.mode === 'triaged',
  isBundles: (state: ViewModeStore): boolean => state.mode === 'bundles',
  isRaw: (state: ViewModeStore): boolean => state.mode === 'raw',
  /** Whether the current mode shows bundle-level data (triaged or bundles). */
  isBundleView: (state: ViewModeStore): boolean =>
    state.mode === 'triaged' || state.mode === 'bundles',
} as const

// ============================================================================
// URL Synchronization
// ============================================================================

/** Initialize store from URL query parameter. Call once on page mount. */
export function syncViewModeFromUrl(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  if (view === 'triaged' || view === 'bundles' || view === 'raw') {
    useViewModeStore.getState().setMode(view)
    // Immediately complete since this is initialization, not a user switch
    useViewModeStore.getState().completeTransition()
  }
}

/** Push current view mode to URL. Uses replaceState. */
export function syncViewModeToUrl(mode: ViewMode): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (mode === 'triaged') {
    url.searchParams.delete('view') // triaged is the default, keep URL clean
  } else {
    url.searchParams.set('view', mode)
  }
  window.history.replaceState({}, '', url.toString())
}
```

### 3.2 Store Interaction Map

The view mode store does NOT touch animation or camera state. It is purely a data-lens
selector that existing hooks read to determine their query parameters.

```
+---------------------+     reads      +---------------------+
|  viewmode.store.ts  |<---------------|  useIntelBundles()   |
|                     |<---------------|  useTriageDecisions()|
|  mode: ViewMode     |<---------------|  useIntelFeed()      |  (adapted)
|  isTransitioning    |<---------------|  useCoverageMapData()|  (adapted)
|  previousMode       |<---------------|  usePipelineStats()  |  (new)
+---------------------+                +---------------------+
         |                                       |
         |  does NOT write to:                   |  data flows down to:
         |                                       |
         |  ui.store.ts (morph state)            |  CoverageGrid
         |  camera.store.ts (pan/zoom)           |  CoverageMap
         |  coverage.store.ts (category filter)  |  FeedPanel
         |  enrichment.store.ts (effects)        |  ActivityTicker
         |  settings.store.ts (preferences)      |  SystemStatusPanel
                                                 |  CoverageOverviewStats
                                                 |  CategoryDetailScene
                                                 |  MapLedger
```

### 3.3 Cross-Store Coordination

The view mode store interacts with the coverage store through a composition pattern
at the hook level, not through direct store-to-store coupling:

```typescript
// Example: useCoverageMapData becomes view-mode-aware
function useCoverageMapData(filters?: CoverageMapFilters) {
  const mode = useViewModeStore((s) => s.mode)

  // In bundle modes, fetch bundle centroids instead of raw alerts
  const queryFn = mode === 'raw'
    ? () => fetchRawMapData(filters)
    : () => fetchBundleMapData(filters, mode)

  return useQuery({
    queryKey: ['coverage', 'map-data', mode, filters],
    queryFn,
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
```

The `mode` value in the `queryKey` ensures TanStack Query maintains separate caches per
view mode, so switching back to a previously-loaded mode is instant (cache hit).

---

## 4. Data Layer

### 4.1 New Supabase Types

Add to `src/lib/supabase/types.ts`:

```typescript
// ============================================================================
// intel_bundles
// ============================================================================

/**
 * Row type for intel_bundles table (SELECT result).
 *
 * A bundle is a cluster of related intel_normalized items that have been
 * scored by the Monte Carlo risk engine and passed through LLM triage.
 */
export interface IntelBundleRow {
  id: string                    // uuid, primary key
  status: string                // 'approved' | 'rejected' | 'pending'
  final_severity: string        // 'Extreme' | 'Severe' | 'Moderate' | 'Minor'
  categories: string[]          // array of category IDs
  confidence_aggregate: number  // 0-100, weighted confidence across member intel
  risk_score: number            // 0-100, Monte Carlo derived
  source_count: number          // count of distinct sources
  member_intel_ids: string[]    // UUID array of intel_normalized IDs
  primary_intel_id: string      // UUID of most representative member
  geo_centroid: {               // jsonb, nullable -- computed centroid
    type: string
    coordinates: number[]
  } | null
  created_at: string            // timestamptz, ISO 8601
}

// ============================================================================
// triage_decisions
// ============================================================================

/**
 * Row type for triage_decisions table (SELECT result).
 *
 * Each row is an LLM-generated verdict on an intel_bundle, including
 * the full rationale text and confidence metadata.
 */
export interface TriageDecisionRow {
  id: string              // uuid, primary key
  bundle_id: string       // uuid, FK to intel_bundles.id
  decision: string        // 'approve' | 'reject'
  version: number         // triage model version
  reviewer_id: string     // uuid of the LLM/reviewer agent
  note: string            // full LLM rationale text (may include JSON metadata)
  decided_at: string      // timestamptz, ISO 8601
}
```

### 4.2 New Hooks

#### `useIntelBundles` -- bundle data with joined triage decisions

```typescript
// src/hooks/use-intel-bundles.ts

export interface IntelBundle {
  id: string
  status: 'approved' | 'rejected' | 'pending'
  finalSeverity: string
  categories: string[]
  confidenceAggregate: number
  riskScore: number
  sourceCount: number
  memberIntelIds: string[]
  primaryIntelId: string
  geoCentroid: { type: string; coordinates: number[] } | null
  createdAt: string
  // Joined triage decision (1:1 relationship)
  triageDecision: {
    decision: string
    version: number
    note: string
    decidedAt: string
  } | null
}

async function fetchIntelBundles(mode: ViewMode): Promise<IntelBundle[]> {
  const supabase = getSupabaseBrowserClient()

  let query = supabase
    .from('intel_bundles')
    .select('*, triage_decisions(*)')
    .order('created_at', { ascending: false })
    .limit(50)

  if (mode === 'triaged') {
    query = query.eq('status', 'approved')
  }
  // 'bundles' mode: no status filter (shows all)

  const { data, error } = await query
  if (error) throw error
  if (!data) return []

  return (data as any[]).map(mapBundleRow)
}

export function useIntelBundles() {
  const mode = useViewModeStore((s) => s.mode)

  return useQuery<IntelBundle[]>({
    queryKey: ['intel', 'bundles', mode],
    queryFn: () => fetchIntelBundles(mode),
    staleTime: 20_000,
    refetchInterval: 30_000,
    enabled: mode !== 'raw', // skip fetch in raw mode
  })
}
```

#### `usePipelineStats` -- triage pipeline health metrics

```typescript
// src/hooks/use-pipeline-stats.ts

export interface PipelineStats {
  totalBundles: number
  approvedCount: number
  rejectedCount: number
  pendingCount: number
  approvalRate: number          // 0-1 decimal
  averageRiskScore: number
  averageConfidence: number
  lastTriageAt: string | null   // ISO timestamp of most recent decision
  categoriesProcessed: string[] // unique categories across all bundles
}

async function fetchPipelineStats(): Promise<PipelineStats> {
  const supabase = getSupabaseBrowserClient()

  const { data: bundles, error } = await supabase
    .from('intel_bundles')
    .select('status, risk_score, confidence_aggregate, categories, created_at')

  if (error) throw error
  if (!bundles || bundles.length === 0) return emptyPipelineStats()

  // Compute aggregates client-side (small dataset)
  const approved = bundles.filter((b: any) => b.status === 'approved')
  const rejected = bundles.filter((b: any) => b.status === 'rejected')
  const pending = bundles.filter((b: any) => b.status === 'pending')

  const allCategories = new Set<string>()
  for (const b of bundles as any[]) {
    for (const cat of b.categories ?? []) allCategories.add(cat)
  }

  return {
    totalBundles: bundles.length,
    approvedCount: approved.length,
    rejectedCount: rejected.length,
    pendingCount: pending.length,
    approvalRate: bundles.length > 0 ? approved.length / bundles.length : 0,
    averageRiskScore: average(bundles.map((b: any) => b.risk_score)),
    averageConfidence: average(bundles.map((b: any) => b.confidence_aggregate)),
    lastTriageAt: bundles[0]?.created_at ?? null,
    categoriesProcessed: Array.from(allCategories),
  }
}

export function usePipelineStats() {
  const mode = useViewModeStore((s) => s.mode)

  return useQuery<PipelineStats>({
    queryKey: ['pipeline', 'stats'],
    queryFn: fetchPipelineStats,
    staleTime: 30_000,
    refetchInterval: 30_000,
    enabled: mode !== 'raw', // only needed in bundle views
  })
}
```

### 4.3 Adapted Hooks

#### `useIntelFeed` -- becomes view-mode-aware

The feed hook currently returns `IntelFeedItem[]` from `intel_normalized`. In bundle
modes, it should return `BundleFeedItem[]` from `intel_bundles` with triage context.

```typescript
// Extended return type for bundle modes
export interface BundleFeedItem {
  id: string
  status: 'approved' | 'rejected'
  finalSeverity: string
  categories: string[]
  riskScore: number
  confidence: number
  sourceCount: number
  memberCount: number
  decision: string      // 'approve' | 'reject'
  rationale: string     // truncated LLM note for feed display
  createdAt: string
}

// Union return type
export type FeedItem = IntelFeedItem | BundleFeedItem

// Type guard
export function isBundleFeedItem(item: FeedItem): item is BundleFeedItem {
  return 'riskScore' in item
}
```

The hook switches its query function based on view mode:

```typescript
export function useIntelFeed() {
  const mode = useViewModeStore((s) => s.mode)

  return useQuery<FeedItem[]>({
    queryKey: ['intel', 'feed', mode],
    queryFn: mode === 'raw' ? fetchRawFeed : () => fetchBundleFeed(mode),
    staleTime: 20_000,
    refetchInterval: 30_000,
  })
}
```

#### `useCoverageMapData` -- dual-source map markers

In bundle modes, map markers come from bundle geo_centroids (larger, fewer, scored).
In raw mode, they come from individual `intel_normalized` rows (current behavior).

```typescript
// Extended MapMarker for bundle centroids
export interface BundleMapMarker extends MapMarker {
  bundleId: string
  riskScore: number
  confidence: number
  status: 'approved' | 'rejected'
  memberCount: number
  categories: string[]
}

// Type guard
export function isBundleMarker(m: MapMarker): m is BundleMapMarker {
  return 'bundleId' in m
}
```

The query key includes `mode` so TanStack Query caches each view separately:

```typescript
export function useCoverageMapData(filters?: CoverageMapFilters) {
  const mode = useViewModeStore((s) => s.mode)

  return useQuery<MapMarker[]>({
    queryKey: ['coverage', 'map-data', mode, filters],
    queryFn: mode === 'raw'
      ? () => fetchCoverageMapData(filters)
      : () => fetchBundleMapData(filters, mode),
    staleTime: 30_000,
    refetchInterval: 30_000,
  })
}
```

### 4.4 Database Type Registration

Update the `Database` interface in `src/lib/supabase/types.ts` to include the new tables:

```typescript
export interface Database {
  public: {
    Tables: {
      // ... existing tables ...
      intel_bundles: {
        Row: IntelBundleRow
        Insert: Omit<IntelBundleRow, never>
        Update: Partial<IntelBundleRow>
      }
      triage_decisions: {
        Row: TriageDecisionRow
        Insert: Omit<TriageDecisionRow, never>
        Update: Partial<TriageDecisionRow>
      }
    }
  }
}
```

---

## 5. Component Architecture

### 5.1 New Component: `ViewModeToggle`

A three-segment toggle bar positioned in the top-center of the NavigationHUD.
Renders as a glass-effect pill with three labeled segments.

**File:** `src/components/ui/ViewModeToggle.tsx`

```
+-----------------------------------------------+
|  [ TRIAGED ]  [ BUNDLES ]  [ RAW ]             |
+-----------------------------------------------+
     ^active                    muted
     glowing border             dim text
     filled bg                  transparent bg
```

**Design tokens:**
- Active segment: `bg-[rgba(var(--ambient-ink-rgb),0.15)]`, border `rgba(255,255,255,0.15)`, text `rgba(255,255,255,0.7)`
- Inactive segment: transparent bg, no border, text `rgba(255,255,255,0.2)`
- Container: `bg-[rgba(var(--ambient-ink-rgb),0.05)]`, border `rgba(var(--ambient-ink-rgb),0.10)`, rounded-lg, backdrop-blur
- Font: mono, 10px, tracking-[0.10em], uppercase
- Height: 32px, segment padding: 8px 16px
- Transition: 200ms ease for bg, color, border; active indicator slides with spring physics

**Keyboard:** Arrow keys cycle modes. Enter/Space activates. Focus ring uses standard `--color-ember-bright`.

**Placement in page.tsx:**
```tsx
{/* Top-center: view mode toggle */}
<div
  className="pointer-events-auto fixed z-40 flex items-center"
  style={{ top: 21, left: '50%', transform: 'translate(-50%, -50%)' }}
>
  <ViewModeToggle />
</div>
```

**Component structure:**
```typescript
interface ViewModeToggleProps {
  className?: string
}

export function ViewModeToggle({ className }: ViewModeToggleProps) {
  const mode = useViewModeStore((s) => s.mode)
  const setMode = useViewModeStore((s) => s.setMode)
  const isTransitioning = useViewModeStore((s) => s.isTransitioning)

  const modes: ViewMode[] = ['triaged', 'bundles', 'raw']

  return (
    <div role="tablist" aria-label="Intel view mode" className={...}>
      {modes.map((m) => (
        <button
          key={m}
          role="tab"
          aria-selected={mode === m}
          aria-controls="spatial-canvas"
          onClick={() => {
            setMode(m)
            syncViewModeToUrl(m)
          }}
          disabled={isTransitioning}
          className={...}
        >
          {VIEW_MODE_META[m].shortLabel}
        </button>
      ))}
    </div>
  )
}
```

### 5.2 New Component: `BundleCard`

Replaces the metric display on `CategoryCard` when in bundle view modes.
Rendered conditionally inside the existing `CategoryCard` component, not as a
separate card type.

**Approach:** `CategoryCard` gains an optional `bundleData` prop. When present
(bundle view modes), the card shows bundle-level metrics instead of source counts.

```typescript
// Added to CategoryCardProps
interface CategoryCardProps {
  // ... existing props ...
  /** Bundle-level data for this category (provided in bundle view modes). */
  bundleData?: CategoryBundleData | null
}

interface CategoryBundleData {
  bundleCount: number           // how many bundles include this category
  approvedCount: number
  rejectedCount: number
  averageRiskScore: number
  averageConfidence: number
  topSeverity: string           // highest severity across bundles
}
```

**Card content in bundle mode:**

```
+----------------------------------+
|  [WeatherIcon]                   |
|  WEATHER                         |
|                                  |
|  1                               |  <-- bundle count (was source count)
|  BUNDLE                          |  <-- label changes
|                                  |
|  RISK 80  CONF 88%              |  <-- risk score + confidence
|  ====----  =========-            |  <-- mini progress bars
|                                  |
|  [APPROVED badge]                |  <-- verdict indicator
+----------------------------------+
```

### 5.3 New Component: `TriageRationalePanel`

A glass-effect expandable panel that displays the full LLM triage rationale
for a selected bundle. Appears in the `CategoryDetailScene` (district view)
and can be triggered from the `FeedPanel`.

**File:** `src/components/coverage/TriageRationalePanel.tsx`

```
+------------------------------------------+
|  TRIAGE RATIONALE                        |
|  ----------------------------------------|
|  Decision: APPROVED                [v2]  |
|  Confidence: HIGH (88%)                  |
|  Decided: 2h ago                         |
|  ----------------------------------------|
|                                          |
|  "This bundle contains 24 weather        |
|  alerts from NWS covering severe         |
|  thunderstorm warnings across the        |
|  central US corridor. Multiple           |
|  independent sources confirm the         |
|  threat assessment. Risk score of        |
|  80 reflects high probability of         |
|  impact on active travel routes."        |
|                                          |
|  ----------------------------------------|
|  Sources: 24 alerts from 3 feeds         |
|  Primary: NWS Severe Thunderstorm #4421  |
+------------------------------------------+
```

**Design:** Same glass panel styling as existing panels (`bg rgba(255,255,255,0.03)`,
`border rgba(255,255,255,0.06)`, `rounded-xl`, mono font).

### 5.4 New Component: `ConfidenceIndicator`

A compact visual indicator for confidence scores. Used in cards, feed items,
and the detail scene.

**File:** `src/components/ui/ConfidenceIndicator.tsx`

Three visual forms:
1. **Inline** (feed items): `CONF 88%` text with color-coded percentage
2. **Bar** (cards): thin horizontal bar, filled proportionally, color shifts from yellow (<70) to green (>85)
3. **Ring** (detail scene): circular progress indicator with percentage center-text

```typescript
interface ConfidenceIndicatorProps {
  value: number        // 0-100
  variant: 'inline' | 'bar' | 'ring'
  size?: 'sm' | 'md'  // default 'sm'
}
```

Color mapping:
- 0-49: `rgba(239, 68, 68, 0.6)` (red -- low confidence)
- 50-69: `rgba(234, 179, 8, 0.5)` (yellow -- moderate)
- 70-84: `rgba(14, 165, 233, 0.6)` (blue -- good)
- 85-100: `rgba(34, 197, 94, 0.6)` (green -- high)

### 5.5 New Component: `RiskScoreBadge`

Displays the Monte Carlo risk score as a prominent numeric badge.

**File:** `src/components/ui/RiskScoreBadge.tsx`

```typescript
interface RiskScoreBadgeProps {
  score: number        // 0-100
  size?: 'sm' | 'md' | 'lg'
}
```

Visual: A rounded rectangle with the score as large mono text. Background tint
follows severity color mapping. Subtle pulse animation when score > 70.

### 5.6 Adapted Component: `CategoryDetailScene`

In bundle view modes, the 2x2 grid layout changes:

**Raw mode (current):**
```
+-------------------+-------------------+
| A: Alert List     | B: Severity       |
|                   |    Breakdown      |
+-------------------+-------------------+
| C: Source Health  | D: Coverage Map   |
|    Table          |                   |
+-------------------+-------------------+
```

**Bundle mode:**
```
+-------------------+-------------------+
| A: Bundle Detail  | B: Triage         |
|    (risk, conf,   |    Rationale      |
|    severity,      |    Panel          |
|    member count)  |                   |
+-------------------+-------------------+
| C: Member Alerts  | D: Coverage Map   |
|    (expandable    |    (bundle        |
|    intel list)    |    centroids)     |
+-------------------+-------------------+
```

The scene component reads view mode and conditionally renders:

```typescript
export const CategoryDetailScene = memo(function CategoryDetailScene({
  categoryId,
  dockSide,
}: CategoryDetailSceneProps) {
  const mode = useViewModeStore((s) => s.mode)

  // Bundle modes: fetch bundles for this category
  const { data: bundles } = useIntelBundles()
  const categoryBundles = useMemo(
    () => bundles?.filter((b) => b.categories.includes(categoryId)) ?? [],
    [bundles, categoryId],
  )

  // Raw mode: existing behavior
  const { data: markers, isLoading, isError } = useCoverageMapData({ category: categoryId })

  return (
    <div style={contentInset}>
      <div className={gridClassName}>
        {mode === 'raw' ? (
          <>
            <AlertList markers={markers} ... />
            <SeverityBreakdown markers={markers} />
            <SourceHealthTable categoryId={categoryId} ... />
            <CoverageMap ... markers={markers ?? []} />
          </>
        ) : (
          <>
            <BundleDetailPanel bundles={categoryBundles} />
            <TriageRationalePanel bundles={categoryBundles} />
            <MemberAlertList bundles={categoryBundles} />
            <CoverageMap ... markers={bundleMarkers} />
          </>
        )}
      </div>
    </div>
  )
})
```

### 5.7 Adapted Component: `FeedPanel`

The feed panel switches its data source and item rendering based on view mode.

```
TRIAGED/BUNDLES MODE:                    RAW MODE (current):
+---------------------------+            +---------------------------+
| INTEL FEED                |            | INTEL FEED                |
|                           |            |                           |
| PIPELINE    2/2           |            | SOURCES    3/5            |
|             PROCESSED     |            |            ACTIVE         |
|                           |            |                           |
| TRIAGE                    |            | SEVERITY                  |
| APPROVED  1               |            | EXTREME  0                |
| REJECTED  1               |            | SEVERE   24               |
|                           |            | MODERATE 20               |
| RECENT                    |            | MINOR    0                |
| [14:20] APPROVED          |            |                           |
|   WX -> 24 weather alerts |            | RECENT                    |
|   RISK 80  CONF 88%       |            | [14:20] SEVERE            |
|                           |            |   WX -> Thunderstorm...   |
| [14:18] REJECTED          |            |                           |
|   SEIS -> 20 seismic...   |            |                           |
|   RISK 80  CONF 99%       |            |                           |
+---------------------------+            +---------------------------+
```

### 5.8 Adapted Component: `SystemStatusPanel`

In bundle modes, the left-side status panel shifts from source health to
pipeline supervision.

```
BUNDLE MODES:                           RAW MODE (current):
+---------------------------+           +---------------------------+
| * PIPELINE ACTIVE         |           | * ALL CLEAR               |
|                           |           |                           |
| 2                         |           | 3/5                       |
| BUNDLES PROCESSED         |           | ACTIVE SOURCES            |
|                           |           |                           |
| MISSION                   |           | MISSION                   |
| TRIAGE MONITORING         |           | INTEL MONITORING          |
|                           |           |                           |
| PIPELINE STATUS           |           | SOURCE STATUS             |
| * approved    1           |           | * active      3           |
| * rejected    1           |           | * staging     1           |
| * pending     0           |           | * quarantine  0           |
|                           |           | * disabled    1           |
| RISK DIST                 |           |                           |
| ===== 80  AVG             |           | SEVERITY DIST             |
|                           |           | ==== bars ====            |
| CONFIDENCE                |           |                           |
| HIGH (88-99%)             |           | CATEGORY ACTIVITY         |
|                           |           | WX  ====== 24             |
| COVERAGE                  |           | SEIS ===== 20             |
| 2 CATEGORIES * LIVE       |           |                           |
+---------------------------+           +---------------------------+
```

### 5.9 Adapted Component: `ActivityTicker`

In bundle modes, ticker events change from individual alert lines to
triage decision events.

```
BUNDLE MODES:                           RAW MODE (current):
[14:20] TRIAGE.APPROVE                  [14:20] ALERT.WX
  -> 24 weather alerts, RISK 80           -> Severe Thunderstorm Warn...
[14:18] TRIAGE.REJECT                   [14:19] ALERT.SEIS
  -> 20 seismic alerts, CONF 99%          -> 4.2 Earthquake Near...
```

### 5.10 Adapted Component: `CoverageOverviewStats`

KPI stats change based on view mode:

| Stat Row      | Triaged              | All Bundles              | Raw (current)       |
|---------------|----------------------|--------------------------|---------------------|
| Row 1         | Bundles: 1           | Total Bundles: 2         | Total Sources: 5    |
| Row 2         | Avg Risk: 80         | Approved: 1              | Active Sources: 3   |
| Row 3         | Categories: 1        | Rejected: 1              | Categories: 2       |

### 5.11 Adapted Component: `MapLedger`

The legend updates to describe bundle markers in bundle view modes:

```
BUNDLE MODES:                           RAW MODE (current):
+--------------------+                  +--------------------+
| Map Ledger         |                  | Map Ledger         |
|                    |                  |                    |
| MARKERS            |                  | SEVERITY           |
| * Approved         |                  | * Extreme          |
| * Rejected (dim)   |                  | * Severe           |
|                    |                  | * Moderate         |
| RISK SCORE         |                  | * Minor            |
| Size = risk level  |                  |                    |
|                    |                  | CLUSTERS           |
| CATEGORIES         |                  | [n] Grouped alerts |
| WX  SEIS  ...      |                  |                    |
+--------------------+                  | CATEGORIES         |
                                        | WX  SEIS  ...      |
                                        +--------------------+
```

### 5.12 Adapted Component: `CoverageMap`

The map component itself is data-agnostic -- it renders `MapMarker[]`. However,
the `MapMarkerLayer` and `MapPopup` need to handle `BundleMapMarker` variants:

- **Bundle markers** render larger (proportional to `riskScore`), with a double-ring
  style: outer ring = severity color, inner fill = decision color (green approved,
  red rejected at 0.3 opacity)
- **Bundle popups** show: severity badge, risk score, confidence, member count,
  truncated rationale, and a "View Full Rationale" link that scrolls to the
  TriageRationalePanel in the district view
- **Rejected markers** (in "All Bundles" mode) render with dashed outline and
  reduced opacity (0.35)

### 5.13 Component File Index

| File                                        | Status    | Description                           |
|---------------------------------------------|-----------|---------------------------------------|
| `src/stores/viewmode.store.ts`              | **New**   | View mode state + URL sync            |
| `src/hooks/use-intel-bundles.ts`            | **New**   | Bundle data with triage decisions     |
| `src/hooks/use-pipeline-stats.ts`           | **New**   | Pipeline throughput metrics            |
| `src/components/ui/ViewModeToggle.tsx`      | **New**   | Three-segment toggle control          |
| `src/components/coverage/TriageRationalePanel.tsx` | **New** | LLM rationale display panel      |
| `src/components/ui/ConfidenceIndicator.tsx` | **New**   | Confidence score visual indicator     |
| `src/components/ui/RiskScoreBadge.tsx`      | **New**   | Risk score numeric badge              |
| `src/lib/supabase/types.ts`                | **Edit**  | Add IntelBundleRow, TriageDecisionRow |
| `src/lib/coverage-utils.ts`                | **Edit**  | Add bundle marker types + transforms  |
| `src/hooks/use-intel-feed.ts`              | **Edit**  | View-mode-aware query switching       |
| `src/hooks/use-coverage-map-data.ts`       | **Edit**  | Bundle centroid map data fetch        |
| `src/components/coverage/CategoryCard.tsx`  | **Edit**  | Optional bundleData display mode      |
| `src/components/coverage/CoverageGrid.tsx`  | **Edit**  | Pass bundleData to cards              |
| `src/components/coverage/CoverageMap.tsx`   | **Edit**  | Bundle marker rendering support       |
| `src/components/coverage/MapMarkerLayer.tsx`| **Edit**  | Bundle marker layer + styling         |
| `src/components/coverage/MapPopup.tsx`      | **Edit**  | Bundle popup variant                  |
| `src/components/coverage/MapLedger.tsx`     | **Edit**  | View-mode-aware legend                |
| `src/components/coverage/CoverageOverviewStats.tsx` | **Edit** | View-mode-aware KPI rows       |
| `src/components/ambient/feed-panel.tsx`     | **Edit**  | Bundle feed mode                      |
| `src/components/ambient/activity-ticker.tsx`| **Edit**  | Triage event ticker mode              |
| `src/components/ambient/system-status-panel.tsx` | **Edit** | Pipeline status mode              |
| `src/components/district-view/scenes/CategoryDetailScene.tsx` | **Edit** | Bundle detail scene    |
| `src/components/districts/morph-orchestrator.tsx` | **Edit** | Pass bundle data to grid          |
| `src/app/(launch)/page.tsx`                 | **Edit**  | Mount ViewModeToggle, URL sync        |

---

## 6. Multi-Surface Interaction Map

When the user switches view mode, every data-bound surface updates simultaneously.
This section maps each surface to its data source per mode.

### 6.1 Data Flow Diagram

```
                         useViewModeStore
                              |
                        mode: ViewMode
                              |
              +---------------+---------------+
              |               |               |
         'triaged'        'bundles'          'raw'
              |               |               |
              v               v               v
     +--useIntelBundles--+    |      +--useIntelFeed (raw)--+
     | status=approved   |    |      | intel_normalized     |
     | + triage_decisions|    |      | 50 most recent       |
     +-------------------+    |      +----------------------+
              |               |               |
              |    +--useIntelBundles--+       |
              |    | all statuses      |       |
              |    | + triage_decisions|       |
              |    +------------------+       |
              |               |               |
              +-------+-------+-------+-------+
                      |               |
               useCoverageMapData     |
               (bundle centroids      |
                or raw markers)       |
                      |               |
          +-----------+-----------+   |
          |           |           |   |
  CoverageMap  CoverageGrid  FeedPanel  ActivityTicker  SystemStatusPanel
                                                         CoverageOverviewStats
                                                         MapLedger
                                                         CategoryDetailScene
```

### 6.2 Surface Response Table

| Surface             | Reads From (Bundle Modes)              | Reads From (Raw Mode)         | Update Trigger     |
|---------------------|----------------------------------------|-------------------------------|--------------------|
| CoverageGrid        | useIntelBundles + usePipelineStats     | useCoverageMetrics            | queryKey includes mode |
| CoverageMap         | useCoverageMapData (bundle centroids)  | useCoverageMapData (raw)      | queryKey includes mode |
| FeedPanel           | useIntelFeed (bundle variant)          | useIntelFeed (raw variant)    | queryKey includes mode |
| ActivityTicker      | useIntelFeed (bundle variant)          | useIntelFeed (raw variant)    | queryKey includes mode |
| SystemStatusPanel   | usePipelineStats                       | useCoverageMetrics + useIntelFeed | queryKey includes mode |
| CoverageOverviewStats | usePipelineStats                     | useCoverageMetrics            | queryKey includes mode |
| MapLedger           | useViewModeStore (mode only)           | useViewModeStore (mode only)  | mode selector         |
| CategoryDetailScene | useIntelBundles (filtered by category) | useCoverageMapData (filtered) | queryKey includes mode |
| ViewModeToggle      | useViewModeStore                       | useViewModeStore              | direct store read     |

### 6.3 Cache Strategy

TanStack Query maintains independent caches per `queryKey`. Since `mode` is part of
every data hook's query key, switching modes triggers:

1. **First switch:** Network fetch, components show skeleton/loading state during
   the `isTransitioning` window
2. **Subsequent switches:** Instant cache hit (data from previous visit still fresh
   within `staleTime`)
3. **Background refetch:** continues per `refetchInterval` for the active mode only
   (inactive modes are not polled)

This means the first time a user switches to "All Bundles" there is a brief data fetch,
but switching back to "Triaged" is instant because the cache is warm.

---

## 7. Transition Choreography

### 7.1 Design Principles

View mode transitions follow the same choreography language as the existing morph
system -- glass surfaces that crossfade, data that morphs, and ambient effects that
respond. The transitions are **not** morph-state-machine transitions (those are for
district drill-down). View mode transitions are lighter: a 300ms crossfade with
staggered element updates.

### 7.2 Transition Sequence

When the user clicks a new view mode segment:

```
T+0ms    Store update: viewmode.store.setMode(newMode)
         ViewModeToggle: active indicator slides to new segment (spring, 200ms)
         All surfaces: begin exit animation for old data

T+50ms   CoverageGrid: card metric values start morphing (countUp/countDown)
         CoverageMap: old markers begin fade-out (opacity 1 -> 0, 200ms)
         FeedPanel: old items slide up and fade (stagger 30ms per item)
         ActivityTicker: scroll pauses, old events fade

T+100ms  SystemStatusPanel: old stats fade, skeleton pulse begins
         CoverageOverviewStats: number morphs begin (spring)
         MapLedger: legend items crossfade

T+150ms  Data hooks fire new queries (TanStack Query)
         If cache hit: data available immediately, skip to T+250ms
         If cache miss: loading skeletons visible

T+250ms  New data arrives (cache hit) or T+500-1500ms (network fetch)
         viewmode.store.completeTransition()

T+250ms  CoverageGrid: new metrics animate in (spring stiffness 120)
         CoverageMap: new markers fade in (opacity 0 -> 1, 300ms, stagger by marker)
         FeedPanel: new items slide in from bottom (stagger 40ms per item)
         ActivityTicker: new events populate, scroll resumes
         SystemStatusPanel: new stats fade in
         CoverageOverviewStats: number morph completes to new values
         MapLedger: new legend items fade in

T+550ms  All transitions complete. Stable state.
```

### 7.3 CSS Implementation

The transition uses a data attribute on the spatial canvas root that components read:

```css
/* src/styles/coverage.css -- additions */

/* View mode transition: fade-through for data surfaces */
[data-view-transitioning="true"] [data-coverage-surface] {
  transition: opacity 200ms ease, filter 200ms ease;
  opacity: 0.6;
  filter: blur(1px);
}

[data-view-transitioning="false"] [data-coverage-surface] {
  transition: opacity 300ms ease 100ms, filter 300ms ease 100ms;
  opacity: 1;
  filter: blur(0);
}
```

Each data-bound component adds `data-coverage-surface` to its root element:

```tsx
<div data-coverage-surface style={{ ... }}>
  {/* component content */}
</div>
```

### 7.4 Map Marker Transition

Map markers require special handling because MapLibre manages its own rendering.
The transition uses a two-phase approach:

1. **Phase 1 (exit):** Set the current GeoJSON source data to an empty FeatureCollection.
   MapLibre's built-in transition smooths the removal (markers shrink/fade).

2. **Phase 2 (enter):** After 150ms delay, set the new GeoJSON source data.
   MapLibre animates the new markers appearing.

This is controlled at the `CoverageMap` level:

```typescript
// In CoverageMap, watch for transition state
const isTransitioning = useViewModeStore((s) => s.isTransitioning)

useEffect(() => {
  if (isTransitioning && mapRef.current) {
    // Clear markers during transition
    const source = mapRef.current.getSource(SOURCE_ID) as maplibregl.GeoJSONSource
    source?.setData({ type: 'FeatureCollection', features: [] })
  }
}, [isTransitioning])
```

### 7.5 Number Morphing

Numeric values in cards and KPI stats morph between old and new values using a
spring-based counter animation:

```typescript
// src/hooks/use-animated-number.ts
export function useAnimatedNumber(target: number, config?: SpringConfig): number {
  const [display, setDisplay] = useState(target)
  const prev = useRef(target)

  useEffect(() => {
    if (prev.current === target) return
    // Animate from prev to target using requestAnimationFrame + spring physics
    const spring = createSpring({ from: prev.current, to: target, ...config })
    // ... rAF loop updating setDisplay ...
    prev.current = target
  }, [target])

  return Math.round(display)
}
```

### 7.6 Reduced Motion

When `prefers-reduced-motion` is active:
- All crossfades become instant (0ms duration)
- Number morphing skips animation (jumps to target)
- Map markers swap instantly (no two-phase transition)
- Toggle indicator jumps instead of sliding

### 7.7 Morph State Machine Interaction

View mode transitions and morph transitions are independent. If a user switches
view mode while in the district view (morph phase = `district`), the district
content updates in-place without triggering a morph phase change. The transition
sequence runs within the `CategoryDetailScene` component.

If a view mode switch happens during an active morph animation (phases `expanding`,
`entering-district`, `leaving-district`), the switch is queued and applied when the
morph reaches a stable phase (`idle`, `settled`, or `district`). This prevents
visual conflicts between the two animation systems.

```typescript
// In ViewModeToggle: queue mode change if morph is animating
const morphPhase = useUIStore((s) => s.morph.phase)
const isStableMorphPhase = morphPhase === 'idle' || morphPhase === 'settled' || morphPhase === 'district'

const handleModeChange = useCallback((newMode: ViewMode) => {
  if (!isStableMorphPhase) {
    // Queue for after morph settles (store the pending mode)
    pendingModeRef.current = newMode
    return
  }
  setMode(newMode)
  syncViewModeToUrl(newMode)
}, [isStableMorphPhase, setMode])

// Effect: apply pending mode when morph settles
useEffect(() => {
  if (isStableMorphPhase && pendingModeRef.current) {
    setMode(pendingModeRef.current)
    syncViewModeToUrl(pendingModeRef.current)
    pendingModeRef.current = null
  }
}, [isStableMorphPhase, setMode])
```

---

## 8. Run Supervision UX

### 8.1 Pipeline Status Indicators

Users need to understand the health of the triage pipeline, not just the output.
Three levels of supervision information:

**Level 1 -- Ambient (always visible in bundle modes):**
- SystemStatusPanel header shows "PIPELINE ACTIVE" (green) or "PIPELINE STALE" (amber)
- Stale = `lastTriageAt` is older than 5 minutes
- A subtle pulse animation on the status dot when the pipeline has processed a bundle
  in the last 60 seconds

**Level 2 -- Summary (visible in bundle mode panels):**
- Approved/rejected/pending counts in SystemStatusPanel
- Approval rate percentage
- Average risk score and confidence

**Level 3 -- Detail (visible in district view):**
- Per-bundle triage decision with full LLM rationale
- Decision version number (triage model version)
- Timestamp of decision
- Member alert count and primary alert reference

### 8.2 Pipeline Health Indicator Component

A compact indicator that can be embedded in the TopTelemetryBar or the
ViewModeToggle area:

```
Active:     [*] PIPELINE  2 processed  12s ago
Stale:      [!] PIPELINE  2 processed  8m ago
No data:    [-] PIPELINE  no bundles
```

**File:** `src/components/ui/PipelineHealthIndicator.tsx`

```typescript
interface PipelineHealthIndicatorProps {
  stats: PipelineStats | undefined
  isLoading: boolean
}

export function PipelineHealthIndicator({ stats, isLoading }: PipelineHealthIndicatorProps) {
  const isStale = stats?.lastTriageAt
    ? Date.now() - new Date(stats.lastTriageAt).getTime() > 5 * 60 * 1000
    : true

  // Renders as a single-line mono text with status dot
  // Only visible in bundle view modes (self-gated by viewmode store)
}
```

### 8.3 Confidence Calibration Display

In the district view's TriageRationalePanel, show a "Confidence Calibration" section
that helps users understand what the confidence percentage means:

```
CONFIDENCE CALIBRATION
=======================
88% = HIGH CONFIDENCE

The triage model is 88% confident in its APPROVE decision.
This means:
- Multiple independent sources corroborate the threat
- Geographic and temporal clustering is tight
- Source reliability scores are above threshold

Factors contributing to confidence:
- Source agreement:    4/4 sources agree (100%)
- Temporal coherence:  All alerts within 2h window
- Geographic overlap:  All within 150km radius
```

This is extracted from the structured portion of the `triage_decisions.note` field,
which contains both the narrative rationale and JSON-encoded confidence metadata.

### 8.4 Decision Provenance Trail

In "All Bundles" mode, rejected bundles show a muted but accessible provenance trail:

```
REJECTED -- SEIS bundle (20 alerts)
Confidence: 99%  Risk: 80
Reason: "While confidence in the seismic data is high,
the 20 alerts represent historical catalog entries
from the past 30 days, not an active seismic event.
Risk score reflects cumulative probability, not
imminent threat. Rejecting as non-actionable."
```

This gives users transparency into what was filtered and why, building trust in the
triage pipeline's decisions.

---

## 9. Implementation Sequence

### Phase 1: Foundation (data layer + store)

1. Add `IntelBundleRow` and `TriageDecisionRow` to `src/lib/supabase/types.ts`
2. Create `src/stores/viewmode.store.ts` with URL sync functions
3. Create `src/hooks/use-intel-bundles.ts`
4. Create `src/hooks/use-pipeline-stats.ts`
5. Add `BundleMapMarker` type to `src/lib/coverage-utils.ts`
6. Write unit tests for the new store and hook query functions

**Verification:** Run `pnpm typecheck` to confirm all new types compile.
Query hooks return expected data from Supabase in the browser console.

### Phase 2: Toggle + wiring

7. Create `src/components/ui/ViewModeToggle.tsx`
8. Mount ViewModeToggle in `src/app/(launch)/page.tsx` (top-center, z-40)
9. Add URL sync (`syncViewModeFromUrl`) to page mount effect
10. Adapt `useIntelFeed` to be view-mode-aware
11. Adapt `useCoverageMapData` to support bundle centroids
12. Wire `MorphOrchestrator` to pass bundleData to `CoverageGrid`

**Verification:** Toggle appears, switches mode, URL updates. Console logs confirm
different data hooks fire per mode. Grid cards show different numbers.

### Phase 3: Surface adaptation

13. Adapt `CategoryCard` with optional `bundleData` display
14. Create `src/components/ui/ConfidenceIndicator.tsx`
15. Create `src/components/ui/RiskScoreBadge.tsx`
16. Adapt `FeedPanel` with bundle feed mode
17. Adapt `ActivityTicker` with triage event mode
18. Adapt `SystemStatusPanel` with pipeline status mode
19. Adapt `CoverageOverviewStats` with bundle KPIs
20. Adapt `MapLedger` with bundle legend

**Verification:** All panels render correct data for each view mode. No console errors.
Visual inspection confirms data matches the mode.

### Phase 4: District view + rationale

21. Create `src/components/coverage/TriageRationalePanel.tsx`
22. Adapt `CategoryDetailScene` with bundle detail layout
23. Adapt `CoverageMap` MapMarkerLayer for bundle markers
24. Adapt `MapPopup` for bundle popup variant
25. Create `src/components/ui/PipelineHealthIndicator.tsx`

**Verification:** District view shows bundle detail with triage rationale.
Map shows larger bundle centroid markers. Popup shows risk/confidence data.

### Phase 5: Choreography + polish

26. Add `data-coverage-surface` attributes to all adapted components
27. Add CSS transition rules for view mode switching
28. Create `src/hooks/use-animated-number.ts` for number morphing
29. Implement map marker two-phase transition
30. Add morph-queue logic to ViewModeToggle
31. Test reduced motion compliance
32. Add `data-view-transitioning` attribute propagation from store

**Verification:** Switching modes shows smooth crossfade transitions.
Numbers morph. Map markers fade in/out. Reduced motion works.
Mode switch during morph animation is queued correctly.

### Phase 6: Keyboard + accessibility

33. Add keyboard navigation to ViewModeToggle (arrow keys, Enter)
34. Add ARIA attributes to all new components
35. Ensure screen reader announcements for mode changes
36. Add focus management for mode transitions
37. Run axe-core audit on all three modes

**Verification:** Full keyboard navigation. No axe violations. Screen reader
announces "View mode changed to Triaged Intel" on switch.

---

## Appendix A: Data Shape Reference

### intel_bundles (2 rows in current database)

```json
{
  "id": "uuid-1",
  "status": "approved",
  "final_severity": "Severe",
  "categories": ["weather"],
  "confidence_aggregate": 88,
  "risk_score": 80,
  "source_count": 3,
  "member_intel_ids": ["uuid-a", "uuid-b", "...24 total"],
  "primary_intel_id": "uuid-a",
  "created_at": "2026-03-03T14:20:00Z"
}
```

```json
{
  "id": "uuid-2",
  "status": "rejected",
  "final_severity": "Severe",
  "categories": ["seismic"],
  "confidence_aggregate": 99,
  "risk_score": 80,
  "source_count": 2,
  "member_intel_ids": ["uuid-c", "uuid-d", "...20 total"],
  "primary_intel_id": "uuid-c",
  "created_at": "2026-03-03T14:18:00Z"
}
```

### triage_decisions (2 rows, one per bundle)

```json
{
  "id": "uuid-td-1",
  "bundle_id": "uuid-1",
  "decision": "approve",
  "version": 2,
  "reviewer_id": "uuid-llm-agent",
  "note": "This bundle contains 24 weather alerts...[full LLM rationale]",
  "decided_at": "2026-03-03T14:20:30Z"
}
```

### intel_normalized -> intel_bundles relationship

```
intel_normalized (44 rows)
    |
    | member_intel_ids (UUID array in bundle)
    v
intel_bundles (2 rows)
    |
    | bundle_id (FK)
    v
triage_decisions (2 rows)
```

Bundle 1 (approved): 24 of 44 raw alerts (weather category)
Bundle 2 (rejected): 20 of 44 raw alerts (seismic category)

---

## Appendix B: Keyboard Shortcut Additions

| Key         | Action                                    | Context         |
|-------------|-------------------------------------------|-----------------|
| `1`         | Switch to Triaged view mode               | Global          |
| `2`         | Switch to All Bundles view mode           | Global          |
| `3`         | Switch to Raw Alerts view mode            | Global          |
| `Shift+V`  | Cycle to next view mode                   | Global          |
| `R`         | Expand/collapse triage rationale panel    | District view   |

These are registered in the existing `useKeyboardShortcuts` hook in `page.tsx`.

---

## Appendix C: Accessibility Considerations

### View Mode Toggle
- Uses `role="tablist"` with `role="tab"` segments
- `aria-selected` indicates active mode
- `aria-controls` points to the spatial canvas content area
- Focus ring uses `--color-ember-bright` (existing pattern)
- Disabled state during transitions prevents double-switching

### Screen Reader Announcements
- Mode switch triggers `aria-live="polite"` announcement:
  "View mode changed to {mode label}. {description}."
- Pipeline status changes announced via existing live region pattern

### Bundle Data
- Risk scores include `aria-label`: "Risk score 80 out of 100"
- Confidence indicators include `aria-label`: "Confidence 88 percent, high"
- Triage rationale panel uses `aria-expanded` for collapse/expand
- Rejected bundles in "All Bundles" mode use `aria-label` suffix: "(rejected)"

### Color Independence
- Decision badges use text ("APPROVED"/"REJECTED") not just color
- Severity always includes text label alongside color dot
- Confidence uses both color and percentage text
- Risk score is always displayed as a number, not just a color gradient
