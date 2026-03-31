# WS-B.3: Ambient + Protective Ops

> **Workstream ID:** WS-B.3
> **Phase:** B -- Situation Tab
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.2 (MobileHeader connectivity dot placeholder, MobileShell content area), WS-A.3 (posture tokens `--posture-*-color`, `--posture-*-duration`, `@keyframes threat-pulse`, contrast-adjusted text token `--color-data-stale-bg`)
> **Blocks:** WS-F.4 (Protective Ops Hooks extends the staleness/offline detection system built here)
> **Resolves:** Data staleness / offline indicator requirement (protective-ops-review C1), connectivity indicator dot (protective-ops-review C7)

---

> **Review Fixes Applied (Phase B Review):**
>
> - **H-2 (posture duplication):** `derivePostureLevel` (D-5) and `src/lib/posture-utils.ts` are REMOVED from this SOW. Posture derivation is owned by WS-B.1 (`derivePosture` in `src/lib/threat-utils.ts`). `ThreatPulseBackground` receives posture level as a prop from the parent component.
> - **H-5 (Resolves header):** Updated above to claim C1 and C7.

---

## 1. Objective

Deliver three mobile-specific protective and ambient systems that provide continuous situational awareness without demanding active user attention:

1. **ThreatPulseBackground** -- a full-viewport ambient CSS radial gradient that breathes at a posture-level-dependent cadence, giving the operator an at-a-glance environmental cue of the current threat posture (LOW through CRITICAL).

2. **Data staleness banner** -- a persistent warning strip below the MobileHeader that appears when TanStack Query data becomes stale (>3 minutes since last successful update) or when the device is offline, ensuring the operator is never unaware that displayed intelligence may be outdated.

3. **Connectivity indicator dot** -- a reactive 8px colored dot in the MobileHeader that replaces the static green placeholder from WS-A.2, reflecting real-time network + data freshness state (green/yellow/red).

These three deliverables form the "always-on" protective layer of the mobile view. They run continuously, consume minimal resources, and respect both the `effectsEnabled` user preference and `prefers-reduced-motion` accessibility setting.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `ThreatPulseBackground` component | New React component rendering a CSS radial gradient keyed to the current posture level from `useThreatPicture()` |
| `useDataFreshness` hook | New hook that monitors `dataUpdatedAt` from three TanStack Query results and `navigator.onLine` to derive a tri-state freshness signal |
| `DataStaleBanner` component | Persistent warning banner rendered below MobileHeader when data is stale or device is offline |
| `ConnectivityDot` component | Reactive 8px dot replacing the static placeholder in MobileHeader |
| CSS for threat pulse, stale banner, and connectivity dot | Styles in `src/styles/mobile-ambient.css` |
| Integration into MobileShell/MobileHeader | Wire components into WS-A.2 slot props |
| Unit tests | Tests for `useDataFreshness` hook logic and `ThreatPulseBackground` posture mapping |
| Reduced motion compliance | All animations disabled under `prefers-reduced-motion: reduce` |
| `effectsEnabled` gating | `ThreatPulseBackground` gated behind settings store toggle |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Desktop ambient effects | This workstream is mobile-only; desktop enrichment layer is unchanged |
| `EdgeGlowIndicators` | Deferred to WS-F.4 (Protective Ops Hooks) per phase decomposition |
| Advanced offline caching / service worker | WS-F.3 (Performance + PWA) scope |
| Pull-to-refresh gesture for stale data recovery | WS-F.5 scope |
| Posture-level tokens and `@keyframes threat-pulse` definition | WS-A.3 defines these in `mobile-tokens.css`; this workstream consumes them |
| `MobileHeader` structural changes | WS-A.2 owns the header structure; this workstream replaces the connectivity dot placeholder via the existing component interface |
| Haptic feedback on posture change | Deferred to WS-F.4 |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| WS-A.2: `MobileHeader` | Connectivity dot placeholder slot in header right cluster. The static `<div class="connectivity-dot" />` is replaced by the `ConnectivityDot` component. `MobileHeaderProps` does not currently include a connectivity slot -- see DM-1 for integration approach. | Pending (WS-A.2 draft complete) |
| WS-A.2: `MobileShell` | Content area where `DataStaleBanner` renders (between header and scrollable content). `MobileShellProps` must accept a `staleBanner` slot or the banner is rendered inside the shell layout. | Pending (WS-A.2 draft complete) |
| WS-A.3: `mobile-tokens.css` | Posture tokens: `--posture-low-color` through `--posture-critical-color`, `--posture-elevated-duration`, `--posture-high-duration`, `--posture-critical-duration`. Contrast token: `--color-data-stale-bg` (`rgba(234, 179, 8, 0.15)`). `@keyframes threat-pulse` (global keyframe). `.mobile-threat-pulse` CSS class. | Pending (WS-A.3 draft complete) |
| `src/hooks/use-threat-picture.ts` | `useThreatPicture()` returns `UseQueryResult<ThreatPicture>`. The hook's `data.overallTrend` and `data.bySeverity` are used to derive posture level. `dataUpdatedAt` (TanStack Query metadata) is used for staleness detection. Query key: `['threat-picture', DATA_MODE]`. Polls every 120s, staleTime 90s. | EXISTS (lines 267-274) |
| `src/hooks/use-coverage-metrics.ts` | `useCoverageMetrics()` returns `UseQueryResult<CoverageMetrics>`. `dataUpdatedAt` used for staleness detection. Query key: `['coverage', 'metrics']`. Polls every 60s, staleTime 45s. | EXISTS (lines 135-143) |
| `src/hooks/use-priority-feed.ts` | `usePriorityFeed()` returns `UseQueryResult<PriorityFeedSummary>`. `dataUpdatedAt` used for staleness detection. Query key: `['priority', 'feed', DATA_MODE]`. Polls every 15s, staleTime 10s. | EXISTS (lines 148-156) |
| `src/stores/settings.store.ts` | `effectsEnabled` boolean toggle. Selector: `settingsSelectors.areEffectsEnabled`. Store: `useSettingsStore`. | EXISTS (lines 41, 100, 192-193) |
| `src/lib/interfaces/coverage.ts` | `ThreatLevel` type: `'LOW' \| 'MODERATE' \| 'ELEVATED' \| 'HIGH' \| 'CRITICAL'`. `THREAT_LEVELS` array. | EXISTS (lines 271-274) |
| `src/styles/spatial-tokens.css` | Status color tokens: `--color-healthy` (`#22c55e`), `--color-warning` (`#eab308`), `--color-error` (`#ef4444`). Font tokens: `--font-mono`. Tracking tokens: `--tracking-wider`. | EXISTS |
| `src/styles/enrichment.css` | Pattern reference for `@media (prefers-reduced-motion: reduce)` handling, `[data-panning]` pause pattern, CSS class naming conventions (`enrichment-*` prefix pattern). | EXISTS (lines 228-245) |

---

## 4. Deliverables

### D-1: `useDataFreshness` hook (`src/hooks/use-data-freshness.ts`)

A composable React hook that monitors the freshness of TanStack Query data and device connectivity, returning a tri-state signal consumed by both the `DataStaleBanner` and `ConnectivityDot`.

**Exported types:**

```typescript
/**
 * Tri-state data freshness signal.
 *
 * - `'fresh'`: Online and all monitored queries updated within the staleness threshold.
 * - `'stale'`: Online but at least one monitored query has not updated within the threshold.
 * - `'offline'`: `navigator.onLine` is false (regardless of query age).
 */
export type DataFreshnessState = 'fresh' | 'stale' | 'offline'

export interface DataFreshnessResult {
  /** Current freshness state. */
  state: DataFreshnessState
  /** Whether the device is currently online. */
  isOnline: boolean
  /** Whether at least one monitored query is stale. */
  isStale: boolean
  /** The oldest `dataUpdatedAt` timestamp across all monitored queries, or null if no data yet. */
  oldestUpdateAt: number | null
  /** Human-readable staleness duration string (e.g., "5m ago", "12m ago"), or null if fresh. */
  staleSince: string | null
}
```

**Algorithm:**

```
STALENESS_THRESHOLD_MS = 180_000  (3 minutes)
POLL_INTERVAL_MS       = 15_000   (re-evaluate every 15s)

1. Subscribe to `navigator.onLine` via:
   - Initial value: `navigator.onLine` (default `true` during SSR)
   - Listen to `window.addEventListener('online', ...)` and `window.addEventListener('offline', ...)`
   - Store in `useState<boolean>(true)`

2. Access `dataUpdatedAt` from three query results:
   a. `useThreatPicture()` -> query.dataUpdatedAt  (number | undefined)
   b. `useCoverageMetrics()` -> query.dataUpdatedAt (number | undefined)
   c. `usePriorityFeed()` -> query.dataUpdatedAt    (number | undefined)

   TanStack Query's `dataUpdatedAt` is a Unix timestamp (ms) set when
   the query last successfully resolved. It is `undefined` before the
   first successful fetch.

3. Compute `oldestUpdateAt`:
   - Filter out `undefined` values (queries that have never resolved).
   - If all are undefined, oldestUpdateAt = null (no data yet).
   - Otherwise, oldestUpdateAt = Math.min(...definedTimestamps).

4. Compute `isStale`:
   - If oldestUpdateAt is null, isStale = false (no data to be stale).
   - Otherwise: isStale = (Date.now() - oldestUpdateAt) > STALENESS_THRESHOLD_MS.

5. Re-evaluate `isStale` periodically:
   - Use `useEffect` with a `setInterval(POLL_INTERVAL_MS)` that triggers a
     state update (increment a tick counter) to force re-render and re-compute.
   - This is necessary because `dataUpdatedAt` does not change between refetches,
     so React will not re-render when the staleness threshold is crossed.

6. Derive `state`:
   - If !isOnline -> 'offline'
   - If isStale   -> 'stale'
   - Otherwise    -> 'fresh'

7. Compute `staleSince`:
   - If state === 'fresh' -> null
   - Otherwise: format (Date.now() - oldestUpdateAt) as "Xm ago" (minutes).
```

**File structure (~85 lines):**

```typescript
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { usePriorityFeed } from '@/hooks/use-priority-feed'

export const STALENESS_THRESHOLD_MS = 180_000  // 3 minutes
const POLL_INTERVAL_MS = 15_000                 // 15 seconds

// ... types as above ...

export function useDataFreshness(): DataFreshnessResult {
  // 1. Online state
  const [isOnline, setIsOnline] = useState(true)
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 2. Query dataUpdatedAt
  const threatPicture = useThreatPicture()
  const coverageMetrics = useCoverageMetrics()
  const priorityFeed = usePriorityFeed()

  // 3. Staleness tick (forces re-evaluation every POLL_INTERVAL_MS)
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  // 4. Compute derived values
  return useMemo(() => {
    void tick // dependency to trigger recomputation
    const timestamps = [
      threatPicture.dataUpdatedAt,
      coverageMetrics.dataUpdatedAt,
      priorityFeed.dataUpdatedAt,
    ].filter((t): t is number => t !== undefined)

    const oldestUpdateAt = timestamps.length > 0
      ? Math.min(...timestamps)
      : null

    const isStale = oldestUpdateAt !== null
      ? (Date.now() - oldestUpdateAt) > STALENESS_THRESHOLD_MS
      : false

    const state: DataFreshnessState = !isOnline
      ? 'offline'
      : isStale
        ? 'stale'
        : 'fresh'

    const staleSince = state !== 'fresh' && oldestUpdateAt !== null
      ? `${Math.floor((Date.now() - oldestUpdateAt) / 60_000)}m ago`
      : null

    return { state, isOnline, isStale, oldestUpdateAt, staleSince }
  }, [
    tick, isOnline,
    threatPicture.dataUpdatedAt,
    coverageMetrics.dataUpdatedAt,
    priorityFeed.dataUpdatedAt,
  ])
}
```

**Why these three queries:** These are the three data sources that feed the Situation tab's primary views. `usePriorityFeed` polls fastest (15s) and will typically be the first to indicate a stale connection. `useThreatPicture` polls slowest (120s) and represents the overall posture assessment. `useCoverageMetrics` (60s) covers the category grid data. Monitoring all three ensures that any data pipeline failure is caught, not just one endpoint.

**Important note on `dataUpdatedAt`:** TanStack Query v5 exposes `dataUpdatedAt` directly on the `UseQueryResult` object as a `number` (Unix timestamp in milliseconds). It is set to `Date.now()` when the query function resolves successfully. It is `0` (falsy) before the first successful fetch. The hook must treat `0` and `undefined` identically (no data yet).

---

### D-2: `ThreatPulseBackground` component (`src/components/mobile/ThreatPulseBackground.tsx`)

A full-viewport ambient background layer that renders a CSS radial gradient breathing animation keyed to the current posture level.

**Props interface:**

```typescript
import type { ThreatLevel } from '@/lib/interfaces/coverage'

export interface ThreatPulseBackgroundProps {
  /** Current posture level. Determines gradient color and animation cadence. */
  postureLevel: ThreatLevel
}
```

**Component behavior:**

1. **Reads `effectsEnabled`** from `useSettingsStore(settingsSelectors.areEffectsEnabled)`. Returns `null` when `false`.

2. **Reads `prefers-reduced-motion`** via a `useReducedMotion()` hook (or inline `matchMedia` check). Returns `null` when reduced motion is active, matching the pattern established by `MobileScanLine` (WS-A.3 D-4.4).

3. **Maps `postureLevel` to CSS custom property values:**

   | Posture Level | Gradient Color Token | Animation Duration Token | Active? |
   |---------------|---------------------|-------------------------|---------|
   | `LOW` | `--posture-low-color` (`transparent`) | N/A | No -- returns `null` or renders invisible div |
   | `MODERATE` | `--posture-moderate-color` (`rgba(234, 179, 8, 0.02)`) | N/A | No -- opacity too low for meaningful animation; render static |
   | `ELEVATED` | `--posture-elevated-color` (`rgba(234, 179, 8, 0.04)`) | `--posture-elevated-duration` (`4s`) | Yes |
   | `HIGH` | `--posture-high-color` (`rgba(239, 68, 68, 0.03)`) | `--posture-high-duration` (`6s`) | Yes |
   | `CRITICAL` | `--posture-critical-color` (`rgba(220, 38, 38, 0.04)`) | `--posture-critical-duration` (`4s`) | Yes |

4. **Rendering:**

   ```
   <div
     className="mobile-threat-pulse-bg"
     aria-hidden="true"
     style={{
       '--pulse-color': `var(--posture-${postureLevel.toLowerCase()}-color)`,
       '--pulse-duration': `var(--posture-${postureLevel.toLowerCase()}-duration, 0s)`,
     }}
   />
   ```

5. **CSS specification** (in `mobile-ambient.css`):

   ```css
   .mobile-threat-pulse-bg {
     position: fixed;
     inset: 0;
     z-index: 0;
     pointer-events: none;
     background: radial-gradient(
       ellipse 120% 80% at 50% 100%,
       var(--pulse-color, transparent) 0%,
       transparent 70%
     );
     animation: threat-pulse var(--pulse-duration, 0s) ease-in-out infinite;
     will-change: opacity;
   }
   ```

   The radial gradient is an ellipse anchored at the bottom center of the viewport (50% 100%), extending 120% wide and 80% tall. This creates an ambient glow that rises from the bottom of the screen, beneath all content, giving a subliminal threat-posture cue without interfering with readability.

6. **For LOW and MODERATE posture levels** where the color is transparent or near-transparent and no animation duration is defined, the component renders `null` to avoid unnecessary GPU compositing layers.

7. **Posture derivation:** This component does NOT derive the posture level internally. The parent (`MobileShell` or the Situation tab content wrapper) calls `useThreatPicture()` and derives the `ThreatLevel` from the aggregated threat picture data. The `postureLevel` prop is passed in. This separation of concerns keeps the ambient component pure and testable.

   The recommended derivation logic for the parent:

   ```typescript
   import type { ThreatLevel } from '@/lib/interfaces/coverage'
   import type { ThreatPicture } from '@/hooks/use-threat-picture'

   export function derivePostureLevel(data: ThreatPicture | undefined): ThreatLevel {
     if (!data || data.totalActiveAlerts === 0) return 'LOW'

     // Check severity distribution for extreme/severe alerts
     const extreme = data.bySeverity.find((s) => s.severity === 'Extreme')
     const severe = data.bySeverity.find((s) => s.severity === 'Severe')

     if (extreme && extreme.count >= 3) return 'CRITICAL'
     if (extreme && extreme.count >= 1) return 'HIGH'
     if (severe && severe.count >= 5) return 'ELEVATED'
     if (severe && severe.count >= 1) return 'MODERATE'
     return 'LOW'
   }
   ```

   This function is exported from the hook file or a shared utility for reuse by WS-F.4.

**File size:** ~60 lines.

---

### D-3: `DataStaleBanner` component (`src/components/mobile/DataStaleBanner.tsx`)

A persistent warning banner that appears between the MobileHeader and the scrollable content area when data is stale or the device is offline.

**Props interface:**

```typescript
import type { DataFreshnessState } from '@/hooks/use-data-freshness'

export interface DataStaleBannerProps {
  /** Current data freshness state from `useDataFreshness()`. */
  state: DataFreshnessState
  /** Human-readable staleness description (e.g., "5m ago"). Null when fresh. */
  staleSince: string | null
}
```

**Rendering behavior:**

| State | Visible | Label | Icon | Background | Text Color |
|-------|---------|-------|------|------------|------------|
| `'fresh'` | No | -- | -- | -- | -- |
| `'stale'` | Yes | `DATA STALE` + staleSince | `AlertTriangle` (Lucide, 14px) | `var(--color-data-stale-bg)` (`rgba(234, 179, 8, 0.15)`) | `var(--color-warning)` (`#eab308`) |
| `'offline'` | Yes | `OFFLINE` | `WifiOff` (Lucide, 14px) | `var(--color-data-stale-bg)` (`rgba(234, 179, 8, 0.15)`) | `var(--color-warning)` (`#eab308`) |

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | `28px` | -- |
| Position | Rendered in normal document flow below the fixed header. Occupies space in the content area, pushing content down by 28px. Not `position: fixed` -- scrolls with content. Alternatively, sticky at `top: 48px` (below header) to remain visible during scroll. See DM-3. | -- |
| z-index | 39 (below header at z-40, above content) | -- |
| Background | `var(--color-data-stale-bg)` | WS-A.3 token: `rgba(234, 179, 8, 0.15)` |
| Border bottom | `1px solid rgba(234, 179, 8, 0.10)` | -- |
| Display | `flex`, `align-items: center`, `justify-content: center`, `gap: 6px` | -- |
| Font | `var(--font-mono)`, `10px`, `letter-spacing: var(--tracking-wider, 0.08em)`, `text-transform: uppercase`, `font-weight: 500` | -- |
| Text color | `var(--color-warning)` | `#eab308` |
| Padding | `0 12px` | -- |

**Animation:**

- Appears with a 200ms `slideDown` transition (height from 0 to 28px, opacity 0 to 1).
- Disappears with a 150ms reverse transition.
- Under `prefers-reduced-motion: reduce`, transitions are replaced with instant show/hide (no animation).

**Content layout:**

```
[AlertTriangle 14px] DATA STALE -- 5m ago
```
or
```
[WifiOff 14px] OFFLINE
```

The `staleSince` string is appended after the primary label when state is `'stale'`, separated by ` -- `. When state is `'offline'`, only "OFFLINE" is shown (no staleSince because the timestamp is less meaningful when the network is down).

**Accessibility:**

- `role="status"` and `aria-live="polite"` so screen readers announce the banner when it appears.
- `aria-label` with full descriptive text: "Data is stale, last updated 5 minutes ago" or "Device is offline".

**File size:** ~65 lines.

---

### D-4: `ConnectivityDot` component (`src/components/mobile/ConnectivityDot.tsx`)

An 8px reactive indicator dot that replaces the static green placeholder in `MobileHeader`.

**Props interface:**

```typescript
import type { DataFreshnessState } from '@/hooks/use-data-freshness'

export interface ConnectivityDotProps {
  /** Current data freshness state from `useDataFreshness()`. */
  state: DataFreshnessState
}
```

**Color mapping:**

| State | Color | Token | Glow |
|-------|-------|-------|------|
| `'fresh'` | `#22c55e` (green) | `var(--color-healthy)` | `var(--glow-healthy)` at 50% opacity |
| `'stale'` | `#eab308` (yellow) | `var(--color-warning)` | `var(--glow-warning)` at 50% opacity |
| `'offline'` | `#ef4444` (red) | `var(--color-error)` | `var(--glow-error)` at 50% opacity |

**Visual specification:**

| Property | Value |
|----------|-------|
| Width | `8px` |
| Height | `8px` |
| Border radius | `50%` |
| Background color | Per state mapping above |
| Box shadow | Per glow mapping above (50% opacity of the token value) |
| Transition | `background-color 300ms var(--ease-default), box-shadow 300ms var(--ease-default)` |
| Flex shrink | `0` (prevents compression in header flex layout) |

**Accessibility:**

- `role="img"` with `aria-label` describing the current state:
  - `'fresh'` -> `"Connection: online, data current"`
  - `'stale'` -> `"Connection: online, data stale"`
  - `'offline'` -> `"Connection: offline"`

**Reduced motion:** The transition between states uses a `300ms` ease. Under `prefers-reduced-motion: reduce`, the transition is set to `0ms` (instant color change). No continuous animation is used on this element.

**File size:** ~45 lines.

---

### D-5: `derivePostureLevel` utility (`src/lib/posture-utils.ts`)

A pure function that derives a `ThreatLevel` from the aggregated `ThreatPicture` data. Extracted into a shared utility so it can be consumed by both this workstream (to pass `postureLevel` to `ThreatPulseBackground`) and WS-F.4 (Protective Ops Hooks).

```typescript
import type { ThreatLevel } from '@/lib/interfaces/coverage'
import type { ThreatPicture } from '@/hooks/use-threat-picture'

/**
 * Derive the overall posture level from aggregated threat picture data.
 *
 * Logic:
 * - No data or zero active alerts -> LOW
 * - >= 3 Extreme-severity alerts -> CRITICAL
 * - >= 1 Extreme-severity alert -> HIGH
 * - >= 5 Severe-severity alerts -> ELEVATED
 * - >= 1 Severe-severity alert -> MODERATE
 * - Otherwise -> LOW
 *
 * @param data - The ThreatPicture from useThreatPicture(), or undefined during loading.
 * @returns The derived ThreatLevel.
 *
 * @see WS-B.3 (ThreatPulseBackground consumer)
 * @see WS-F.4 (Protective Ops Hooks consumer)
 */
export function derivePostureLevel(data: ThreatPicture | undefined): ThreatLevel {
  if (!data || data.totalActiveAlerts === 0) return 'LOW'

  const extreme = data.bySeverity.find((s) => s.severity === 'Extreme')
  const severe = data.bySeverity.find((s) => s.severity === 'Severe')

  if (extreme && extreme.count >= 3) return 'CRITICAL'
  if (extreme && extreme.count >= 1) return 'HIGH'
  if (severe && severe.count >= 5) return 'ELEVATED'
  if (severe && severe.count >= 1) return 'MODERATE'
  return 'LOW'
}
```

**File size:** ~35 lines including JSDoc.

---

### D-6: CSS file (`src/styles/mobile-ambient.css`)

Dedicated CSS for the three ambient/protective components. Imported by `ThreatPulseBackground.tsx`.

```css
/**
 * Mobile Ambient + Protective Ops styles.
 *
 * Defines visual rules for:
 * - ThreatPulseBackground (posture-level radial gradient)
 * - DataStaleBanner (stale/offline warning strip)
 * - ConnectivityDot (header indicator)
 *
 * Consumes tokens from mobile-tokens.css (WS-A.3):
 *   --posture-*-color, --posture-*-duration, --color-data-stale-bg
 *
 * Consumes @keyframes threat-pulse from mobile-tokens.css (WS-A.3).
 *
 * @see WS-B.3 Ambient + Protective Ops
 */

/* =========================================================================
   ThreatPulseBackground
   ========================================================================= */

.mobile-threat-pulse-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse 120% 80% at 50% 100%,
    var(--pulse-color, transparent) 0%,
    transparent 70%
  );
  animation: threat-pulse var(--pulse-duration, 0s) ease-in-out infinite;
  will-change: opacity;
}

/* =========================================================================
   DataStaleBanner
   ========================================================================= */

.mobile-stale-banner {
  position: sticky;
  top: 48px; /* below MobileHeader */
  z-index: 39;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
  background: var(--color-data-stale-bg, rgba(234, 179, 8, 0.15));
  border-bottom: 1px solid rgba(234, 179, 8, 0.10);
  font-family: var(--font-mono, monospace);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: var(--tracking-wider, 0.08em);
  text-transform: uppercase;
  color: var(--color-warning, #eab308);
  line-height: 1;
  overflow: hidden;
}

/* Enter/exit transitions */
.mobile-stale-banner[data-visible='true'] {
  max-height: 28px;
  opacity: 1;
  transition:
    max-height 200ms var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1)),
    opacity 200ms var(--ease-default);
}

.mobile-stale-banner[data-visible='false'] {
  max-height: 0;
  opacity: 0;
  border-bottom: none;
  transition:
    max-height 150ms var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1)),
    opacity 150ms var(--ease-default);
}

/* =========================================================================
   ConnectivityDot
   ========================================================================= */

.connectivity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition:
    background-color 300ms var(--ease-default, cubic-bezier(0.4, 0, 0.2, 1)),
    box-shadow 300ms var(--ease-default);
}

.connectivity-dot[data-state='fresh'] {
  background-color: var(--color-healthy, #22c55e);
  box-shadow: 0 0 8px rgba(34, 197, 94, 0.06), 0 0 2px rgba(74, 222, 128, 0.12);
}

.connectivity-dot[data-state='stale'] {
  background-color: var(--color-warning, #eab308);
  box-shadow: 0 0 8px rgba(234, 179, 8, 0.06), 0 0 2px rgba(250, 204, 21, 0.12);
}

.connectivity-dot[data-state='offline'] {
  background-color: var(--color-error, #ef4444);
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.06), 0 0 2px rgba(248, 113, 113, 0.12);
}

/* =========================================================================
   Reduced motion: disable all ambient animations and transitions
   ========================================================================= */

@media (prefers-reduced-motion: reduce) {
  .mobile-threat-pulse-bg {
    animation: none !important;
    /* Show static gradient at full opacity for posture awareness */
    opacity: 1;
  }

  .mobile-stale-banner,
  .mobile-stale-banner[data-visible='true'],
  .mobile-stale-banner[data-visible='false'] {
    transition: none !important;
  }

  .connectivity-dot {
    transition: none !important;
  }
}
```

**Import chain:** `ThreatPulseBackground.tsx` imports this file: `import '@/styles/mobile-ambient.css'`. This CSS is mobile-component-scoped (only loaded when mobile components are rendered, matching the code-splitting strategy from WS-A.1).

---

### D-7: Integration wiring

**In `MobileHeader.tsx` (modify WS-A.2 D-3):**

Replace the static connectivity dot placeholder:

```diff
- <div class="connectivity-dot" />
+ <ConnectivityDot state={freshnessState} />
```

The `MobileHeaderProps` interface gains an optional `connectivityState` prop:

```typescript
import type { DataFreshnessState } from '@/hooks/use-data-freshness'

export interface MobileHeaderProps {
  // ... existing props from WS-A.2 ...
  /** Data freshness state for connectivity dot. Default: 'fresh'. */
  connectivityState?: DataFreshnessState
}
```

Alternatively, if the header does not accept a prop for this, `ConnectivityDot` can internally call `useDataFreshness()`. However, since `DataStaleBanner` also needs the same state, the recommended pattern is to call `useDataFreshness()` once in `MobileShell` and pass the result down to both consumers. See DM-1.

**In `MobileShell.tsx` (modify WS-A.2 D-2):**

Add `ThreatPulseBackground` and `DataStaleBanner` to the shell layout:

```typescript
import { useDataFreshness } from '@/hooks/use-data-freshness'
import { useThreatPicture } from '@/hooks/use-threat-picture'
import { derivePostureLevel } from '@/lib/posture-utils'
import { ThreatPulseBackground } from '@/components/mobile/ThreatPulseBackground'
import { DataStaleBanner } from '@/components/mobile/DataStaleBanner'

// Inside MobileShell:
const freshness = useDataFreshness()
const threatPicture = useThreatPicture()
const postureLevel = derivePostureLevel(threatPicture.data)

return (
  <div className="mobile-shell" data-orientation={...}>
    <ThreatPulseBackground postureLevel={postureLevel} />
    <MobileHeader
      connectivityState={freshness.state}
      /* ...other existing props... */
    />
    <main className="mobile-content">
      <DataStaleBanner state={freshness.state} staleSince={freshness.staleSince} />
      {/* tab content */}
    </main>
    <MobileBottomNav ... />
  </div>
)
```

The `ThreatPulseBackground` sits at z-index 0, behind all content. The `DataStaleBanner` renders inside `.mobile-content` at the top of the scrollable area (or sticky below the header, per DM-3).

---

### D-8: Unit Tests

**`src/hooks/__tests__/use-data-freshness.test.ts`:**

Tests for the `useDataFreshness` hook using `@testing-library/react` `renderHook`.

| Test Case | Description |
|-----------|-------------|
| Returns `'fresh'` when online and all queries updated < 3 min ago | Mock `navigator.onLine = true`, mock query results with `dataUpdatedAt = Date.now() - 60_000` |
| Returns `'stale'` when online and oldest query > 3 min ago | Mock `navigator.onLine = true`, mock one query with `dataUpdatedAt = Date.now() - 200_000` |
| Returns `'offline'` when `navigator.onLine` is false | Mock `navigator.onLine = false`, regardless of query timestamps |
| Returns `'offline'` over `'stale'` when both conditions are true | Offline takes priority |
| Returns `'fresh'` when no queries have resolved yet | All `dataUpdatedAt` are `undefined`; no data to be stale |
| `staleSince` formats correctly | When stale for 300s, returns `"5m ago"` |
| `staleSince` is null when fresh | Verify null return |
| Responds to online/offline events | Dispatch `window` `offline` event, verify state changes to `'offline'`; dispatch `online`, verify recovery |

**`src/lib/__tests__/posture-utils.test.ts`:**

Tests for `derivePostureLevel`.

| Test Case | Description |
|-----------|-------------|
| Returns `'LOW'` for undefined data | `derivePostureLevel(undefined)` |
| Returns `'LOW'` for zero active alerts | `data.totalActiveAlerts = 0` |
| Returns `'CRITICAL'` for >= 3 Extreme alerts | `bySeverity` includes `{ severity: 'Extreme', count: 3, percentage: 10 }` |
| Returns `'HIGH'` for 1-2 Extreme alerts | Count 1 or 2 |
| Returns `'ELEVATED'` for >= 5 Severe, 0 Extreme | Count 5 |
| Returns `'MODERATE'` for 1-4 Severe, 0 Extreme | Count 1-4 |
| Returns `'LOW'` for Moderate-and-below only | No Extreme or Severe |

**`src/components/mobile/__tests__/ThreatPulseBackground.test.tsx`:**

| Test Case | Description |
|-----------|-------------|
| Returns null when `effectsEnabled` is false | Mock settings store |
| Returns null when `postureLevel` is `'LOW'` | LOW has transparent color, component should not render |
| Renders div with correct CSS variable for ELEVATED | Inspect `style` attribute for `--pulse-color` |
| Renders div with correct CSS variable for CRITICAL | Inspect `style` attribute |
| Returns null when `prefers-reduced-motion: reduce` | Mock `matchMedia` |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `ThreatPulseBackground` renders a radial gradient that pulses on a 4s cycle when posture is ELEVATED. | Manual: Set test data to produce ELEVATED posture. Open Chrome DevTools at 375x812. Observe 4s breathing animation on background gradient. |
| AC-2 | `ThreatPulseBackground` renders a radial gradient that pulses on a 6s cycle when posture is HIGH. | Manual: Same as AC-1, with HIGH posture data. Inspect computed `animation-duration`. |
| AC-3 | `ThreatPulseBackground` does not render (returns `null`) when posture is LOW. | Unit test + manual: Inspect DOM for absence of `.mobile-threat-pulse-bg` element. |
| AC-4 | `ThreatPulseBackground` does not render when `effectsEnabled` is `false` in settings store. | Toggle effects off in settings. Verify no `.mobile-threat-pulse-bg` in DOM. |
| AC-5 | `ThreatPulseBackground` does not animate under `prefers-reduced-motion: reduce`. Static gradient is displayed. | Enable reduced motion in OS. Verify `animation: none` in computed styles. Verify the gradient is visible but static. |
| AC-6 | `DataStaleBanner` shows "DATA STALE -- Xm ago" when any monitored query's `dataUpdatedAt` exceeds 3 minutes. | Disconnect backend API for >3 minutes. Verify banner appears with correct label and time. |
| AC-7 | `DataStaleBanner` shows "OFFLINE" when `navigator.onLine` is false. | Chrome DevTools: Network tab > toggle "Offline". Verify banner shows "OFFLINE" within 1 second. |
| AC-8 | `DataStaleBanner` hides with a 150ms transition when data becomes fresh again. | Reconnect backend after staleness. Verify banner slides up and disappears. |
| AC-9 | `DataStaleBanner` uses `role="status"` and `aria-live="polite"` for screen reader announcement. | Inspect DOM attributes. Test with VoiceOver: verify announcement when banner appears. |
| AC-10 | `ConnectivityDot` shows green (`--color-healthy`) when all data is fresh and online. | Verify default state with running backend. Inspect computed `background-color`. |
| AC-11 | `ConnectivityDot` shows yellow (`--color-warning`) when online but data is stale (>3 min). | Disconnect backend, wait >3 min. Verify dot turns yellow. |
| AC-12 | `ConnectivityDot` shows red (`--color-error`) when `navigator.onLine` is false. | Chrome DevTools: toggle "Offline". Verify dot turns red. |
| AC-13 | `ConnectivityDot` has `role="img"` and a descriptive `aria-label` that updates with state changes. | Inspect DOM. Verify `aria-label` changes between "Connection: online, data current", "Connection: online, data stale", and "Connection: offline". |
| AC-14 | `ConnectivityDot` transitions between colors with a 300ms ease, except under `prefers-reduced-motion: reduce` where it is instant. | Visual observation + computed style inspection. |
| AC-15 | `useDataFreshness` monitors `dataUpdatedAt` from `useThreatPicture`, `useCoverageMetrics`, and `usePriorityFeed`. | Unit test: mock all three hooks, verify all three timestamps are checked. |
| AC-16 | `useDataFreshness` uses `STALENESS_THRESHOLD_MS = 180_000` (3 minutes). | Unit test: verify threshold constant. Verify a query at 179s is fresh and at 181s is stale. |
| AC-17 | `useDataFreshness` responds to `window` `online`/`offline` events within one render cycle. | Unit test: dispatch events, verify state update. |
| AC-18 | `derivePostureLevel` correctly maps severity distributions to threat levels per the 5-level scale. | Unit tests: 7 cases covering all thresholds. |
| AC-19 | All animations in `mobile-ambient.css` include `@media (prefers-reduced-motion: reduce)` overrides. | File inspection: verify the reduced-motion media query targets all animated selectors. |
| AC-20 | `pnpm typecheck` passes with zero errors after all deliverables are implemented. | Run `pnpm typecheck`. |
| AC-21 | Desktop view is unaffected. No new components render at viewport >= 768px. | Load desktop at 1920x1080. Verify no `.mobile-threat-pulse-bg`, `.mobile-stale-banner`, or new `.connectivity-dot` elements in DOM. |
| AC-22 | The stale banner background color matches the WS-A.3 token `--color-data-stale-bg` exactly: `rgba(234, 179, 8, 0.15)`. | Inspect computed background on `.mobile-stale-banner`. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Call `useDataFreshness()` once in `MobileShell` and pass the result down to `ConnectivityDot` (via `MobileHeader` prop) and `DataStaleBanner` (via direct prop). | Calling the hook in a single parent avoids duplicate `setInterval` timers and ensures both consumers always agree on the current state. The three underlying data hooks (`useThreatPicture`, `useCoverageMetrics`, `usePriorityFeed`) are already called by other shell children, so they are shared via TanStack Query's deduplication. The freshness hook only adds one 15s interval timer. | (a) Each consumer calls `useDataFreshness` independently: rejected because it creates two independent 15s interval timers and risks transient state disagreement between the dot and the banner. (b) Move freshness into a Zustand store: rejected because the state is derived from TanStack Query metadata and should not be duplicated into a separate store. |
| DM-2 | `ThreatPulseBackground` receives `postureLevel` as a prop rather than internally calling `useThreatPicture()`. | Separates data concerns (posture derivation) from presentation concerns (gradient animation). Makes the component pure and testable with simple prop-based assertions. The derivation logic (`derivePostureLevel`) lives in a shared utility that WS-F.4 can also consume. | (a) Component calls `useThreatPicture()` internally: rejected because it couples the ambient visual layer to a specific data hook, making testing harder and preventing reuse with alternative data sources. |
| DM-3 | `DataStaleBanner` uses `position: sticky; top: 48px` rather than being absolutely positioned or part of the fixed header. | Sticky positioning keeps the banner visible while scrolling (always below the header) but allows it to participate in the normal document flow when at the top of the scroll area. This avoids requiring a dynamic `padding-top` adjustment on the content area when the banner appears/disappears. The `top: 48px` value matches the `MobileHeader` height from WS-A.2. | (a) Absolutely positioned at `top: 48px`: rejected because it overlaps content without pushing it down. (b) Fixed positioned: rejected because managing z-index stacking with both the header (z-40) and the banner (z-39) at fixed position adds complexity and may cause Safari rendering issues. (c) Normal flow with dynamic padding: rejected because it requires imperative DOM measurement. |
| DM-4 | `ThreatPulseBackground` returns `null` for both LOW and MODERATE posture levels. | LOW has a `transparent` gradient color, so rendering is pointless. MODERATE has `rgba(234, 179, 8, 0.02)` -- a 2% opacity amber that is functionally invisible and not animated (no `--posture-moderate-duration` is defined). Rendering a GPU-composited animation layer for an invisible effect wastes battery on mobile devices. | (a) Render a static (non-animated) gradient for MODERATE: rejected because 2% opacity amber is indistinguishable from the void background on OLED screens. (b) Animate MODERATE at a very slow cadence (e.g., 10s): rejected because the effect is invisible. |
| DM-5 | `derivePostureLevel` uses severity count thresholds rather than the `overallTrend` field from the threat picture. | The `overallTrend` field indicates direction (`up`/`down`/`stable`) but not magnitude. Severity counts provide a concrete, quantifiable basis for posture level that maps directly to the 5-level scale. The thresholds (3 Extreme = CRITICAL, 1 Extreme = HIGH, 5 Severe = ELEVATED, 1 Severe = MODERATE) are calibrated to the typical alert volumes in TarvaRI. | (a) Use `overallTrend` to adjust posture up/down: considered for WS-F.4 as a secondary input; too complex for Phase B. (b) Backend-derived posture level: ideal long-term, but no `/console/posture` endpoint exists yet. DM-5 provides a workable client-side derivation. |
| DM-6 | CSS styles are in a dedicated `mobile-ambient.css` file rather than added to `mobile-tokens.css` or `mobile-shell.css`. | `mobile-tokens.css` (WS-A.3) is exclusively for token definitions and keyframes -- not component styles. `mobile-shell.css` (WS-A.2) is for the shell layout components. A dedicated file for ambient/protective component styles follows the codebase pattern of domain-scoped CSS files (`enrichment.css`, `atrium.css`, `ambient-effects.css`). | (a) Add to `mobile-tokens.css`: rejected because that file should only contain custom property definitions and keyframe animations per WS-A.3 spec. (b) Add to `mobile-shell.css`: rejected because ambient effects are not structural layout. (c) Inline styles only: rejected because the `@media (prefers-reduced-motion)` query and `data-*` attribute selectors require CSS. |
| DM-7 | The staleness evaluation interval is 15 seconds, not real-time. | Checking `Date.now() - dataUpdatedAt > threshold` requires periodic re-evaluation because the timestamps do not change until the next successful refetch. 15 seconds provides a reasonable compromise between responsiveness (user sees the banner within 15s of crossing the 3-minute threshold) and efficiency (no RAF loop or 1s timer). This aligns with the `usePriorityFeed` poll interval. | (a) 1-second interval: rejected as unnecessarily frequent for a 3-minute threshold. (b) 60-second interval: rejected because a full minute delay in showing the stale banner may leave the user unaware. (c) Check only on query state changes: rejected because the staleness threshold can be crossed between refetch attempts. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the `ThreatPulseBackground` gradient shape change per posture level (e.g., tighter ellipse for CRITICAL, wider for ELEVATED), or is a single ellipse shape sufficient? Current spec uses a single 120%x80% ellipse for all levels. | world-class-ux-designer | Phase F (polish) |
| OQ-2 | Should the `DataStaleBanner` include a "Retry" button that calls `queryClient.refetchQueries()`? The current spec does not include one, relying on automatic refetch intervals. A manual retry could be useful when the user sees the stale banner and wants to force a refresh. | world-class-ux-designer | Phase B review gate |
| OQ-3 | The `derivePostureLevel` thresholds (3 Extreme = CRITICAL, 1 Extreme = HIGH, 5 Severe = ELEVATED) are a first approximation. Should these be configurable via the settings store or environment variable? | planning-coordinator | Phase F |
| OQ-4 | Should the `ConnectivityDot` have a subtle pulse animation when in `'offline'` state to draw attention? The current spec uses static color only. | world-class-ux-designer | Phase F (polish) |
| OQ-5 | WS-F.4 (Protective Ops Hooks) is described as extending the staleness/offline detection. Should `useDataFreshness` be designed with an extension point (e.g., additional query results passed as parameters) or will WS-F.4 create a wrapper hook? Current design monitors a fixed set of 3 queries. | WS-F.4 author | Phase F |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `navigator.onLine` is unreliable on some mobile browsers (may return `true` when on a captive portal or degraded connection). | Medium | Medium -- false `'fresh'` state when actually unreachable. | Acceptable for Phase B. WS-F.4 (Protective Ops Hooks) can add a secondary connectivity check (e.g., a lightweight HEAD request to the API or checking query `isError` states). The `useDataFreshness` hook's staleness check catches the case where the device is nominally online but queries are failing -- after 3 minutes of failed refetches, `dataUpdatedAt` will be stale. |
| R-2 | The `dataUpdatedAt` field from TanStack Query v5 is `0` (not `undefined`) before the first successful fetch, which would cause `Date.now() - 0` to always exceed the staleness threshold, showing a false stale banner on initial load. | Medium | Medium -- false stale banner flash on first mount. | Filter out `0` values alongside `undefined` in the `useDataFreshness` computation (step 3). Treat `0` as "no data yet" rather than "data is 53 years old". Add a unit test for this edge case. |
| R-3 | The 15-second staleness evaluation interval means the stale banner can appear up to 15 seconds after the actual threshold is crossed, leaving a window where the user sees "fresh" data that is actually >3 minutes old. | High (by design) | Low -- the 15-second delay is negligible relative to the 3-minute threshold. | Accepted trade-off. Reducing the interval to 5s would triple the re-render frequency for marginal improvement. The priority feed's own 15s poll interval already provides a natural re-evaluation point. |
| R-4 | `ThreatPulseBackground`'s `will-change: opacity` creates a persistent GPU compositor layer on mobile, consuming battery even when the animation is running at very low opacity values. | Low | Medium -- battery drain on resource-constrained devices. | The component returns `null` for LOW and MODERATE (the most common posture levels), so the GPU layer is only created when the threat posture is ELEVATED or above. When active, `will-change` ensures the animation runs on the compositor thread without triggering layout/paint. The CSS uses `animation` (not JS-driven) so the main thread is not involved. |
| R-5 | The `DataStaleBanner`'s `position: sticky; top: 48px` may not work correctly on older iOS Safari (known sticky positioning bugs in scrollable containers). | Low | Low -- banner may scroll away instead of sticking. | Acceptable degradation. The connectivity dot in the header provides the same information persistently. If iOS Safari issues are confirmed in testing, fall back to `position: fixed` with a dynamic content offset. |
| R-6 | Calling `useThreatPicture()`, `useCoverageMetrics()`, and `usePriorityFeed()` inside `useDataFreshness` may trigger additional query subscriptions if those hooks are not already called by other components in the same render tree. | Low | Low -- unnecessary network requests if queries are not already active. | TanStack Query v5 deduplicates query subscriptions by query key. Since the Situation tab already calls all three hooks (via category grid, priority strip, and threat banner components), the `useDataFreshness` hook merely adds an observer to already-active queries. No additional network requests are made. If `useDataFreshness` is called on the Map or Intel tabs where some of these hooks may not be mounted, TanStack Query will activate the queries (desired behavior -- we want to monitor freshness across all tabs). |
| R-7 | WS-A.3 may not deliver the `@keyframes threat-pulse` definition or posture tokens in time, blocking the `ThreatPulseBackground` implementation. | Medium | Medium -- component cannot be visually tested. | The CSS uses `var()` with fallback values (`var(--pulse-color, transparent)`, `var(--pulse-duration, 0s)`). If the tokens are not yet defined, the component renders as invisible with no animation -- a safe degradation. Development can proceed using hardcoded test values and switch to tokens when WS-A.3 lands. |

---

## Appendix A: File Inventory

| File | Type | Lines (est.) | Description |
|------|------|-------------|-------------|
| `src/hooks/use-data-freshness.ts` | New | ~85 | Composable hook: online state + query staleness -> tri-state signal |
| `src/lib/posture-utils.ts` | New | ~35 | Pure function: `ThreatPicture` -> `ThreatLevel` |
| `src/components/mobile/ThreatPulseBackground.tsx` | New | ~60 | Ambient radial gradient keyed to posture level |
| `src/components/mobile/DataStaleBanner.tsx` | New | ~65 | Sticky warning banner for stale/offline data |
| `src/components/mobile/ConnectivityDot.tsx` | New | ~45 | Reactive 8px indicator dot for MobileHeader |
| `src/styles/mobile-ambient.css` | New | ~100 | CSS for all three components + reduced-motion overrides |
| `src/hooks/__tests__/use-data-freshness.test.ts` | New | ~120 | Unit tests for staleness/offline detection |
| `src/lib/__tests__/posture-utils.test.ts` | New | ~60 | Unit tests for posture derivation logic |
| `src/components/mobile/__tests__/ThreatPulseBackground.test.tsx` | New | ~50 | Unit tests for effects gating and prop mapping |
| `src/components/mobile/MobileShell.tsx` | Modify | +15 | Wire `useDataFreshness`, `derivePostureLevel`, add components to layout |
| `src/components/mobile/MobileHeader.tsx` | Modify | +5 | Replace static dot with `ConnectivityDot`, add `connectivityState` prop |

**Total new code:** ~520 lines (components + hook + utility + CSS)
**Total new test code:** ~230 lines
**Total modifications:** ~20 lines across two existing files

## Appendix B: Data Flow Diagram

```
                        TarvaRI Backend API
                              |
          +-------------------+-------------------+
          |                   |                   |
  /console/threat-picture  /console/coverage  /console/priority-feed
          |                   |                   |
  useThreatPicture()   useCoverageMetrics()  usePriorityFeed()
    (120s poll)           (60s poll)           (15s poll)
          |                   |                   |
          +------- dataUpdatedAt (each) ---------+
          |                                       |
          v                                       v
  derivePostureLevel()                  useDataFreshness()
          |                              /       |       \
          v                          state   isStale   staleSince
  ThreatPulseBackground              /          |          \
  (posture -> gradient)              v          v          v
                            ConnectivityDot  DataStaleBanner
                            (green/yellow/   (DATA STALE/
                              red dot)        OFFLINE)
```

## Appendix C: Token Dependency Map

| Token (from WS-A.3) | Consumed By | Purpose |
|---------------------|-------------|---------|
| `--posture-low-color` | `ThreatPulseBackground` | Gradient color for LOW (transparent) |
| `--posture-moderate-color` | `ThreatPulseBackground` | Gradient color for MODERATE |
| `--posture-elevated-color` | `ThreatPulseBackground` | Gradient color for ELEVATED |
| `--posture-high-color` | `ThreatPulseBackground` | Gradient color for HIGH |
| `--posture-critical-color` | `ThreatPulseBackground` | Gradient color for CRITICAL |
| `--posture-elevated-duration` | `ThreatPulseBackground` | 4s animation cycle for ELEVATED |
| `--posture-high-duration` | `ThreatPulseBackground` | 6s animation cycle for HIGH |
| `--posture-critical-duration` | `ThreatPulseBackground` | 4s animation cycle for CRITICAL |
| `@keyframes threat-pulse` | `mobile-ambient.css` | Opacity 0->1->0 breathing keyframe |
| `--color-data-stale-bg` | `DataStaleBanner` | `rgba(234, 179, 8, 0.15)` background |
| `--color-healthy` | `ConnectivityDot` | Green dot for fresh state |
| `--color-warning` | `ConnectivityDot`, `DataStaleBanner` | Yellow dot for stale, banner text |
| `--color-error` | `ConnectivityDot` | Red dot for offline |
| `--font-mono` | `DataStaleBanner` | Monospace font for banner label |
| `--tracking-wider` | `DataStaleBanner` | Letter spacing for banner label |
| `--ease-default` | `ConnectivityDot`, `DataStaleBanner` | Transition easing |
