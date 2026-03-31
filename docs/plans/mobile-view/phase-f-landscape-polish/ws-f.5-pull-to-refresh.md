# WS-F.5: Pull-to-Refresh + Edge Polish

> **Workstream ID:** WS-F.5
> **Phase:** F -- Landscape + Polish
> **Assigned Agent:** `world-class-ux-designer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-E.3 (active tab context from `MobileView` -- `activeTab` state determines which query keys to invalidate), WS-A.2 (`MobileShell` tab content containers with scroll areas; `MobileBottomNav` component for tab re-tap detection; `MobileTab` type), WS-B.3 (conceptually related -- both monitor connectivity -- but `useConnectionToast` uses `navigator.onLine` events directly, not the `useDataFreshness` hook)
> **Blocks:** None (final workstream in the mobile view project)
> **Resolves:** Gap 2 in `combined-recommendations.md` (pull-to-refresh has no implementation path), `information-architecture.md` Section 7.7 (pull-to-refresh interaction pattern), `ux-strategy.md` Section 4.3 (haptic feedback table -- pull-to-refresh release: single tap 10ms)

---

## Review Fixes Applied

**M-2:** Corrected Depends On header -- `useConnectionToast` uses `navigator.onLine` events directly, not the `useDataFreshness` hook from WS-B.3.

**L-3:** Connection toast z-index should be 45 (below idle lock overlay at z-50). Update `.mobile-connection-toast` z-index from 50 to 45 during implementation.

---

## 1. Objective

Deliver a native-feeling pull-to-refresh gesture for all three mobile tabs, plus four edge polish items that complete the mobile experience's tactile quality. After this workstream, a user can pull down from any tab to force-refresh the tab's data, tap an already-active tab to scroll its content to the top, see a brief toast when network connectivity is restored, and experience consistent shimmer animations across all loading skeletons.

The pull-to-refresh gesture is the last gap in the mobile data freshness story. WS-B.3 provides passive staleness detection (banner + connectivity dot). This workstream adds the user-initiated counterpart: an explicit "I want fresh data now" action. Together they close the loop between automatic polling (TanStack Query refetchInterval) and user-controlled refresh.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **`usePullToRefresh` hook** | Custom touch gesture detector using `touchstart`/`touchmove`/`touchend` on a scroll container element. Activates when the user pulls down past a 60px threshold while the scroll container is at `scrollTop === 0`. Calls a provided `onRefresh` callback (which invokes `queryClient.invalidateQueries` for the active tab's query keys). ~80 lines, no external library. |
| **`MobilePullIndicator` component** | Visual feedback element rendered at the top of the tab content area. Shows a progress arc during the pull phase (0-100% mapped to 0-60px pull distance) and triggers a scan line sweep animation on release. Positioned absolutely above the scroll content with a translate-Y driven by pull distance. |
| **Pull-to-refresh CSS** | Styles for the pull indicator, progress arc (SVG circle stroke-dashoffset), scan line sweep keyframes, and reduced motion fallbacks. |
| **Per-tab query key mapping** | `TAB_QUERY_KEYS` constant mapping each `MobileTab` to the TanStack Query key prefixes that should be invalidated on pull-to-refresh. Situation: `useThreatPicture`, `usePriorityFeed`, `useCoverageMetrics`. Map: `useCoverageMapData`. Intel: `useIntelFeed`, `useAllGeoSummaries`. |
| **Haptic feedback** | `navigator.vibrate(10)` called on pull release to confirm refresh initiated. Silent fallback on unsupported browsers (iOS Safari). |
| **Tab re-tap scroll-to-top** | When the user taps the already-active tab button in `MobileBottomNav`, the active tab's scroll container smoothly scrolls to the top (`scrollTo({ top: 0, behavior: 'smooth' })`). Follows iOS tab bar convention. |
| **Overscroll bounce suppression** | `overscroll-behavior: contain` applied to all `MobileShell` tab content containers. Prevents iOS Safari's native pull-to-refresh and rubber-band scroll from conflicting with the custom pull gesture. |
| **`useConnectionToast` hook** | Monitors `navigator.onLine` state transitions. When transitioning from offline to online, sets a transient flag that drives a brief "Connection restored" toast. Auto-clears after 3 seconds. Consumes `useDataFreshness` from WS-B.3 for the offline detection baseline. |
| **`MobileConnectionToast` component** | Minimal glass-styled toast that slides up from the bottom of the screen (above the tab bar), displays "Connection restored", and fades out after 3 seconds. |
| **Skeleton shimmer polish** | Standardized shimmer animation across all existing `MobileStateView` loading skeletons. Consistent timing (1.5s duration, ease-in-out), staggered start (each row offset by 50ms), and uniform gradient direction (left-to-right). |
| **Unit tests** | Tests for `usePullToRefresh` gesture logic, `useConnectionToast` state transitions, tab re-tap detection, and per-tab query invalidation mapping. |
| **Integration** | Wiring `usePullToRefresh` into `MobileView` for all three tabs, connecting scroll refs, and passing `activeTab` to the invalidation callback. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Service worker / offline caching | WS-F.3 (Performance + PWA) scope. |
| Landscape layout variants | WS-F.1 scope. Pull-to-refresh works identically in portrait and landscape. |
| Desktop rendering changes | All new files are under `src/components/mobile/` and `src/hooks/` with mobile-only consumers. |
| `useDataFreshness` or `DataStaleBanner` modifications | WS-B.3 scope. This workstream consumes the hook as-is. |
| Bottom sheet scroll containers | Bottom sheets already have `overscroll-behavior-y: contain` from WS-C.1. Pull-to-refresh does not activate inside bottom sheets. |
| Haptic feedback for other gestures | WS-F.4 scope for P1 alert haptics. This workstream only adds pull-release haptic. |
| `MobileShell` structural changes | WS-A.2 owns the shell. This workstream adds CSS to existing containers and passes callback props. |
| Sort dampening on pull-to-refresh | `information-architecture.md` Section 10.2 specifies that category cards re-sort on manual refresh. The sort logic is in `MobileCategoryGrid` (WS-B.2) and triggers automatically when data changes. No modification needed here. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/components/providers/query-provider.tsx` (line 3) | `QueryClientProvider` wrapping the app -- enables `useQueryClient()` access in hooks. | Exists |
| `@tanstack/react-query` | `useQueryClient` hook for accessing `queryClient.invalidateQueries()`. | Exists (dependency) |
| `src/hooks/use-threat-picture.ts` (line 269) | Query key: `['threat-picture', DATA_MODE]`. Polls every 120s, staleTime 90s. | Exists |
| `src/hooks/use-priority-feed.ts` (line 96) | `PRIORITY_FEED_QUERY_KEY = ['priority', 'feed']`. Actual key at runtime: `['priority', 'feed', DATA_MODE]`. Polls every 15s, staleTime 10s. | Exists |
| `src/hooks/use-coverage-metrics.ts` (line 136) | Query key: `['coverage', 'metrics']`. Polls every 60s, staleTime 45s. | Exists |
| `src/hooks/use-coverage-map-data.ts` (line 128) | Query key: `['coverage', 'map-data', filters]`. Polls every 30s, staleTime 30s. | Exists |
| `src/hooks/use-intel-feed.ts` (line 93) | Query key: `['intel', 'feed']`. Polls every 30s, staleTime 20s. | Exists |
| `src/hooks/use-geo-summaries.ts` (line 147) | `GEO_SUMMARY_QUERY_KEYS.all = ['geo-summary']`. Used as prefix for all geo summary caches. | Exists |
| `src/hooks/use-realtime-priority-alerts.ts` (lines 122-125) | Existing pattern for `queryClient.invalidateQueries()` calls -- uses prefix matching. | Exists (pattern reference) |
| WS-A.2 D-2 | `MobileShell` component with tab content containers (`.mobile-shell-tab-content`). Each tab's content area is a flex child with overflow handling. | Pending (Phase A) |
| WS-A.2 D-4 | `MobileBottomNav` component with `onTabChange(tab: MobileTab)` callback. Needs extension to detect re-tap on active tab. | Pending (Phase A) |
| WS-A.2 D-1 | `MobileTab` type: `'situation' | 'map' | 'intel'`. `MOBILE_TABS` constant. | Pending (Phase A) |
| WS-B.3 D-2 | `useDataFreshness()` hook returning `'fresh' | 'stale' | 'offline'`. Monitors `dataUpdatedAt` from TanStack Query and `navigator.onLine`. | Pending (Phase B) |
| WS-E.1 D-2 | `MobileIntelTab` exposes `scrollRef` prop (or `React.forwardRef`) for pull-to-refresh attachment. `overscroll-behavior-y: contain` already applied to its scroll container. | Pending (Phase E) |
| WS-E.3 | Active tab context: `activeTab` state in `MobileView` determines which tab's queries to invalidate. | Pending (Phase E) |

---

## 4. Deliverables

### D-1: `usePullToRefresh` hook (`src/hooks/use-pull-to-refresh.ts`)

Custom touch gesture hook that detects a pull-down gesture on a scroll container and invokes a refresh callback when the pull exceeds a configurable threshold.

**Type signature:**

```typescript
'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

// ============================================================================
// Types
// ============================================================================

interface UsePullToRefreshOptions {
  /** Ref to the scroll container element. Pull gesture is detected on this element. */
  scrollRef: React.RefObject<HTMLElement | null>
  /** Callback invoked when pull exceeds threshold and is released. Should return a
   *  promise that resolves when the refresh is complete (used to hold the indicator). */
  onRefresh: () => Promise<void>
  /** Pull distance in px required to trigger refresh. Default: 60. */
  threshold?: number
  /** Whether the pull gesture is enabled. Disable when a bottom sheet is open
   *  or during morph transitions. Default: true. */
  enabled?: boolean
}

interface UsePullToRefreshReturn {
  /** Whether the user is currently pulling (finger on screen, scrollTop === 0, deltaY > 0). */
  isPulling: boolean
  /** Current pull distance in pixels (0 to threshold). Clamped to threshold max. */
  pullDistance: number
  /** Whether a refresh is in progress (after release, before onRefresh resolves). */
  isRefreshing: boolean
}
```

**Implementation:**

```typescript
export function usePullToRefresh({
  scrollRef,
  onRefresh,
  threshold = 60,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [isPulling, setIsPulling] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const startYRef = useRef(0)
  const pullingRef = useRef(false)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return
      const el = scrollRef.current
      if (!el) return

      // Only activate when at scroll top
      if (el.scrollTop > 0) return

      startYRef.current = e.touches[0].clientY
      pullingRef.current = false
    },
    [enabled, isRefreshing, scrollRef],
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!enabled || isRefreshing) return
      const el = scrollRef.current
      if (!el) return

      // Re-check scroll position (user may have scrolled during touch)
      if (el.scrollTop > 0) {
        if (pullingRef.current) {
          // Cancel pull if user scrolled away from top
          pullingRef.current = false
          setIsPulling(false)
          setPullDistance(0)
        }
        return
      }

      const deltaY = e.touches[0].clientY - startYRef.current

      // Only activate on downward pull (positive deltaY)
      if (deltaY <= 0) {
        if (pullingRef.current) {
          pullingRef.current = false
          setIsPulling(false)
          setPullDistance(0)
        }
        return
      }

      // Prevent browser default pull-to-refresh
      e.preventDefault()

      pullingRef.current = true
      setIsPulling(true)
      // Apply resistance: diminishing returns past threshold (rubber-band feel)
      const distance = deltaY < threshold
        ? deltaY
        : threshold + (deltaY - threshold) * 0.3
      setPullDistance(Math.min(distance, threshold * 1.5))
    },
    [enabled, isRefreshing, scrollRef, threshold],
  )

  const handleTouchEnd = useCallback(async () => {
    if (!pullingRef.current) return

    pullingRef.current = false
    setIsPulling(false)

    if (pullDistance >= threshold) {
      // Haptic feedback on release (silent fallback on iOS Safari)
      try {
        navigator.vibrate?.(10)
      } catch {
        // vibrate() may throw on some browsers -- ignore
      }

      setIsRefreshing(true)
      setPullDistance(threshold) // Hold at threshold during refresh

      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back -- pull did not reach threshold
      setPullDistance(0)
    }
  }, [pullDistance, threshold, onRefresh])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !enabled) return

    // Use passive: false for touchmove to allow preventDefault
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [scrollRef, enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return { isPulling, pullDistance, isRefreshing }
}
```

**Key design decisions embedded in the hook:**

| Behavior | Implementation |
|----------|---------------|
| Rubber-band resistance | Past the 60px threshold, additional pull distance is multiplied by 0.3, creating a diminishing-returns feel that signals "you've pulled enough." |
| Scroll-top gating | `scrollTop > 0` check in both `touchstart` and `touchmove`. The pull gesture only activates when the container is scrolled to the very top. |
| Cancel on scroll-away | If the user pulls down but then scrolls up (content moves), the pull is cancelled mid-gesture. |
| Passive false on touchmove | Required for `e.preventDefault()` which suppresses the browser's native pull-to-refresh during the custom gesture. |
| Haptic feedback | `navigator.vibrate?.(10)` -- optional chaining because the API may not exist (iOS Safari). Wrapped in try-catch for browsers that throw on the call. |
| Async onRefresh | The hook holds the indicator at the threshold position while `onRefresh` resolves, giving the user visual confirmation that the refresh is in progress. |

**Size:** ~110 lines.

---

### D-2: `MobilePullIndicator` component (`src/components/mobile/MobilePullIndicator.tsx`)

Visual feedback component rendered at the top of each tab's content area. Displays pull progress and a scan line sweep animation on refresh.

**Props:**

```typescript
interface MobilePullIndicatorProps {
  /** Current pull distance in pixels (0 to ~90). */
  pullDistance: number
  /** Whether a refresh is currently in progress. */
  isRefreshing: boolean
  /** Pull threshold value for progress calculation. */
  threshold: number
}
```

**Implementation:**

```typescript
'use client'

import { memo } from 'react'
import '@/styles/mobile-pull-to-refresh.css'

export const MobilePullIndicator = memo(function MobilePullIndicator({
  pullDistance,
  isRefreshing,
  threshold,
}: MobilePullIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null

  const progress = Math.min(pullDistance / threshold, 1)
  const translateY = Math.min(pullDistance, threshold) - threshold

  // SVG progress arc: stroke-dasharray and dashoffset control fill
  const circumference = 2 * Math.PI * 10 // r=10
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="mobile-pull-indicator"
      style={{ transform: `translateY(${translateY}px)` }}
      aria-hidden="true"
    >
      {isRefreshing ? (
        <div className="mobile-pull-scan-line" />
      ) : (
        <svg
          className="mobile-pull-arc"
          width="28"
          height="28"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--color-glass-border, rgba(255, 255, 255, 0.08))"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="none"
            stroke="var(--color-ember, #ff6b35)"
            strokeWidth="2"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
            style={{ transition: 'stroke-dashoffset 50ms linear' }}
          />
        </svg>
      )}
    </div>
  )
})
```

**Visual states:**

| State | Visual |
|-------|--------|
| Pulling (0-99%) | Progress arc (SVG circle) fills clockwise from top as pull distance increases. Positioned at the top of the content area, sliding down with pull distance. |
| Pulling (100%) | Arc is fully filled. Color intensifies to `--color-ember`. |
| Refreshing | Arc is replaced by a scan line sweep -- a thin horizontal luminous line that sweeps from top to bottom of the indicator area over 800ms, then fades. Repeats while `isRefreshing` is true. Matches the Oblivion scan line aesthetic from `HorizonScanLine` on desktop. |
| Idle | Component returns `null`. No DOM footprint. |

**Accessibility:** `aria-hidden="true"` -- the visual indicator is decorative. The refresh action's outcome (data update) is communicated via the data change itself, not via the indicator.

**Size:** ~60 lines (component) + CSS.

---

### D-3: Pull-to-refresh CSS (`src/styles/mobile-pull-to-refresh.css`)

```css
/* ============================================================================
 * Pull-to-Refresh Indicator
 * Scan line sweep + progress arc for pull-to-refresh gesture.
 * Imported by MobilePullIndicator.tsx.
 * ============================================================================ */

.mobile-pull-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
  pointer-events: none;
  will-change: transform;
}

/* Progress arc (SVG) */
.mobile-pull-arc {
  opacity: 0.9;
  filter: drop-shadow(0 0 4px var(--color-ember, #ff6b35));
}

/* Scan line sweep animation (replaces arc during refresh) */
.mobile-pull-scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--color-ember, #ff6b35) 30%,
    rgba(255, 255, 255, 0.9) 50%,
    var(--color-ember, #ff6b35) 70%,
    transparent 100%
  );
  box-shadow: 0 0 8px var(--color-ember, #ff6b35),
              0 0 16px rgba(255, 107, 53, 0.3);
  animation: pull-scan-sweep 800ms ease-in-out infinite;
}

@keyframes pull-scan-sweep {
  0% {
    top: 0;
    opacity: 1;
  }
  80% {
    top: 56px;
    opacity: 1;
  }
  100% {
    top: 60px;
    opacity: 0;
  }
}

/* ============================================================================
 * Connection Toast
 * ============================================================================ */

.mobile-connection-toast {
  position: fixed;
  bottom: calc(56px + var(--safe-area-bottom, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  padding: 8px 20px;
  border-radius: 20px;
  background: var(--color-glass-bg, rgba(255, 255, 255, 0.06));
  backdrop-filter: blur(var(--blur-active, 12px));
  -webkit-backdrop-filter: blur(var(--blur-active, 12px));
  border: 1px solid var(--color-glass-border, rgba(255, 255, 255, 0.08));
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  z-index: 50;
  pointer-events: none;
  opacity: 0;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.mobile-connection-toast[data-visible='true'] {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.mobile-connection-toast[data-visible='false'] {
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
}

/* ============================================================================
 * Skeleton Shimmer Polish
 * Consistent shimmer animation for all loading skeletons.
 * Applied via .mobile-shimmer class on skeleton placeholder elements.
 * ============================================================================ */

.mobile-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.03) 25%,
    rgba(255, 255, 255, 0.08) 50%,
    rgba(255, 255, 255, 0.03) 75%
  );
  background-size: 200% 100%;
  animation: shimmer-sweep 1.5s ease-in-out infinite;
  border-radius: 6px;
}

/* Stagger: each .mobile-shimmer with data-shimmer-index gets a delay */
.mobile-shimmer[data-shimmer-index='1'] { animation-delay: 50ms; }
.mobile-shimmer[data-shimmer-index='2'] { animation-delay: 100ms; }
.mobile-shimmer[data-shimmer-index='3'] { animation-delay: 150ms; }
.mobile-shimmer[data-shimmer-index='4'] { animation-delay: 200ms; }
.mobile-shimmer[data-shimmer-index='5'] { animation-delay: 250ms; }
.mobile-shimmer[data-shimmer-index='6'] { animation-delay: 300ms; }

@keyframes shimmer-sweep {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ============================================================================
 * Overscroll Bounce Suppression
 * Applied to MobileShell tab content containers.
 * Prevents browser native pull-to-refresh and rubber-band scroll.
 * ============================================================================ */

.mobile-shell-tab-content {
  overscroll-behavior: contain;
  /* iOS Safari: prevent elastic bounce at scroll boundaries */
  -webkit-overflow-scrolling: touch;
}

/* ============================================================================
 * Reduced Motion
 * ============================================================================ */

@media (prefers-reduced-motion: reduce) {
  .mobile-pull-scan-line {
    animation: none;
    top: 30px;
    opacity: 0.7;
  }

  .mobile-shimmer {
    animation: none;
    background: rgba(255, 255, 255, 0.05);
  }

  .mobile-connection-toast {
    transition: opacity 100ms linear;
    transform: translateX(-50%) translateY(0);
  }
}
```

**Size:** ~160 lines.

**Import:** Added to `src/app/(launch)/layout.tsx` or the mobile entry point alongside other mobile CSS imports. Import statement: `import '@/styles/mobile-pull-to-refresh.css'`.

---

### D-4: Per-tab query key mapping (`src/lib/mobile-query-keys.ts`)

Static mapping from `MobileTab` to the TanStack Query key prefixes that should be invalidated when pull-to-refresh triggers on that tab.

```typescript
/**
 * Per-tab query key prefixes for pull-to-refresh invalidation.
 *
 * Each tab invalidates only the queries that feed its visible content.
 * TanStack Query's invalidateQueries uses prefix matching by default:
 * passing ['threat-picture'] invalidates ['threat-picture', 'console'],
 * ['threat-picture', 'supabase'], etc.
 *
 * @module mobile-query-keys
 * @see usePullToRefresh (consumer)
 * @see use-realtime-priority-alerts.ts (pattern reference for invalidation)
 */

import type { MobileTab } from '@/lib/interfaces/mobile'

/**
 * Query key prefixes to invalidate when pull-to-refresh fires on each tab.
 *
 * Situation tab:
 * - ['threat-picture'] -> useThreatPicture (posture banner, severity breakdown)
 * - ['priority'] -> usePriorityFeed (P1/P2 threat banner, priority feed)
 * - ['coverage', 'metrics'] -> useCoverageMetrics (category card counts)
 *
 * Map tab:
 * - ['coverage', 'map-data'] -> useCoverageMapData (map markers)
 *
 * Intel tab:
 * - ['intel', 'feed'] -> useIntelFeed (chronological intel feed)
 * - ['geo-summary'] -> useAllGeoSummaries (geographic summary cards)
 */
export const TAB_QUERY_KEYS: Record<MobileTab, readonly (readonly string[])[]> = {
  situation: [
    ['threat-picture'],
    ['priority'],
    ['coverage', 'metrics'],
  ],
  map: [
    ['coverage', 'map-data'],
  ],
  intel: [
    ['intel', 'feed'],
    ['geo-summary'],
  ],
} as const
```

**Size:** ~40 lines.

**Design note:** The `situation` tab uses `['priority']` (not `['priority', 'feed']`) as the prefix. This invalidates the query key `['priority', 'feed', DATA_MODE]` via TanStack Query's default prefix matching. Similarly, `['threat-picture']` matches `['threat-picture', DATA_MODE]`. Using shorter prefixes ensures invalidation works regardless of the `DATA_MODE` suffix value.

---

### D-5: `createTabRefreshHandler` factory (`src/lib/mobile-query-keys.ts` -- same file as D-4)

Factory function that creates the `onRefresh` callback for `usePullToRefresh`, bound to the active tab.

```typescript
import { type QueryClient } from '@tanstack/react-query'

/**
 * Create a refresh handler for pull-to-refresh that invalidates
 * the active tab's query keys.
 *
 * Returns a stable async function suitable for usePullToRefresh's
 * onRefresh callback. Invalidation is fire-and-forget (all queries
 * invalidated in parallel via Promise.all).
 *
 * @param queryClient - TanStack QueryClient instance from useQueryClient()
 * @param activeTab - Currently active MobileTab
 * @returns Async function that invalidates the tab's queries
 */
export function createTabRefreshHandler(
  queryClient: QueryClient,
  activeTab: MobileTab,
): () => Promise<void> {
  return async () => {
    const keys = TAB_QUERY_KEYS[activeTab]
    await Promise.all(
      keys.map((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [...queryKey] }),
      ),
    )
  }
}
```

**Why a factory, not inline:** The `onRefresh` callback passed to `usePullToRefresh` should be stable across renders to avoid re-attaching touch listeners. The factory is called inside a `useCallback` or `useMemo` in `MobileView` with `[activeTab]` in the dependency array, so the handler updates only when the tab changes.

---

### D-6: Tab re-tap scroll-to-top (`src/components/mobile/MobileBottomNav.tsx` -- modified)

Extends `MobileBottomNav` (from WS-A.2) to detect when the user taps the already-active tab and invoke a scroll-to-top callback.

**Modified props interface:**

```typescript
export interface MobileBottomNavProps {
  activeTab: MobileTab
  onTabChange: (tab: MobileTab) => void
  /** Called when the user taps the already-active tab. Used to scroll content to top. */
  onActiveTabRetap?: () => void
  onMenuPress?: () => void
}
```

**Modified tap handler in each tab button:**

```typescript
const handleTabPress = useCallback(
  (tab: MobileTab) => {
    if (tab === activeTab) {
      // Re-tap on active tab: scroll content to top
      onActiveTabRetap?.()
    } else {
      onTabChange(tab)
    }
  },
  [activeTab, onTabChange, onActiveTabRetap],
)
```

**Integration in `MobileView`:**

```typescript
const scrollRefs: Record<MobileTab, React.RefObject<HTMLElement | null>> = {
  situation: situationScrollRef,
  map: mapScrollRef,
  intel: intelScrollRef,
}

const handleActiveTabRetap = useCallback(() => {
  const ref = scrollRefs[activeTab]
  ref?.current?.scrollTo({ top: 0, behavior: 'smooth' })
}, [activeTab])
```

**Map tab behavior:** The Map tab's content area is not scrollable (it is a full-viewport MapLibre canvas). `scrollTo` on a non-scrolling element is a no-op, which is correct -- there is nothing to scroll to top.

---

### D-7: Overscroll bounce suppression (`src/styles/mobile-shell.css` -- modified)

Add `overscroll-behavior: contain` to the existing `.mobile-shell-tab-content` class defined by WS-A.2.

```css
/* Existing rule in mobile-shell.css (WS-A.2) -- ADD these properties: */
.mobile-shell-tab-content {
  /* ... existing styles ... */
  overscroll-behavior: contain;
  /* Suppress iOS Safari native pull-to-refresh and rubber-band bounce.
   * Required for the custom usePullToRefresh gesture to work without
   * conflicting with the browser's built-in refresh behavior.
   * Also prevents scroll chaining from tab content to the viewport. */
}
```

**This is a CSS-only change.** No JavaScript modification to `MobileShell` is needed. The property is applied declaratively to the existing class.

**Browser behavior with `overscroll-behavior: contain`:**

| Browser | Native Pull-to-Refresh | Rubber-band Bounce | Custom Gesture |
|---------|----------------------|-------------------|----------------|
| Chrome Android | Suppressed | Suppressed | Works |
| Safari iOS 16+ | Suppressed | Suppressed | Works |
| Safari iOS 15 | Partially suppressed (may still trigger in some edge cases) | Reduced | Works with R-2 mitigation |
| Firefox Android | Suppressed | Suppressed | Works |

---

### D-8: `useConnectionToast` hook (`src/hooks/use-connection-toast.ts`)

Hook that monitors online/offline state transitions and exposes a transient flag for the connection restored toast.

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'

/**
 * Monitor network connectivity transitions and expose a transient
 * "connection restored" signal for the toast component.
 *
 * The hook tracks the previous online state. When transitioning from
 * offline to online, it sets `showToast = true` for 3 seconds.
 *
 * Does NOT consume useDataFreshness directly -- uses the browser's
 * navigator.onLine API for immediate transition detection. The
 * useDataFreshness hook (WS-B.3) uses the same underlying signal
 * for the staleness banner, which operates on a different timescale
 * (sustained offline detection vs. instantaneous transition).
 *
 * @module use-connection-toast
 * @see WS-B.3 useDataFreshness (complementary, not consumed)
 */
export function useConnectionToast() {
  const [showToast, setShowToast] = useState(false)
  const wasOfflineRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Initialize: check current state
    wasOfflineRef.current = !navigator.onLine

    const handleOnline = () => {
      if (wasOfflineRef.current) {
        // Transition: offline -> online
        setShowToast(true)

        // Auto-dismiss after 3 seconds
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          setShowToast(false)
        }, 3000)
      }
      wasOfflineRef.current = false
    }

    const handleOffline = () => {
      wasOfflineRef.current = true
      // Immediately hide toast if it was showing
      setShowToast(false)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return { showToast }
}
```

**Size:** ~55 lines.

**Relationship to `useDataFreshness` (WS-B.3):** Both hooks monitor `navigator.onLine`. They serve different purposes and operate on different timescales:

| Concern | Hook | Timescale | UI |
|---------|------|-----------|-----|
| Sustained offline/stale state | `useDataFreshness` (WS-B.3) | Continuous (monitors `dataUpdatedAt` + `navigator.onLine`) | `DataStaleBanner` (persistent warning) |
| Offline-to-online transition | `useConnectionToast` (this WS) | Instantaneous (fires once on `online` event) | `MobileConnectionToast` (3s auto-dismiss) |

The toast fires on the transition event itself, not on the freshness state. This means the user sees "Connection restored" the instant connectivity returns, even before TanStack Query has refetched and updated `dataUpdatedAt`. The staleness banner dismisses separately once queries succeed.

---

### D-9: `MobileConnectionToast` component (`src/components/mobile/MobileConnectionToast.tsx`)

Minimal toast component positioned above the bottom tab bar.

```typescript
'use client'

import { memo } from 'react'

interface MobileConnectionToastProps {
  visible: boolean
}

export const MobileConnectionToast = memo(function MobileConnectionToast({
  visible,
}: MobileConnectionToastProps) {
  return (
    <div
      className="mobile-connection-toast"
      data-visible={visible}
      role="status"
      aria-live="polite"
      aria-label={visible ? 'Connection restored' : undefined}
    >
      Connection restored
    </div>
  )
})
```

**Accessibility:** `role="status"` with `aria-live="polite"` ensures screen readers announce the toast when it appears, without interrupting the current reading flow.

**Size:** ~25 lines (component only; CSS is in D-3).

---

### D-10: Skeleton shimmer polish (`src/components/mobile/MobileStateView.tsx` -- modified, `src/styles/mobile-pull-to-refresh.css` -- already in D-3)

Modify the existing `MobileStateView` loading skeleton (from WS-A.2) to use the standardized `.mobile-shimmer` class and stagger attributes.

**Current skeleton pattern (WS-A.2):**

```tsx
// Inside MobileStateView's loading state rendering
<div className="mobile-skeleton-row" />
<div className="mobile-skeleton-row" />
<div className="mobile-skeleton-row" />
```

**Updated pattern:**

```tsx
{Array.from({ length: skeletonRows }, (_, i) => (
  <div
    key={i}
    className="mobile-shimmer"
    data-shimmer-index={i}
    style={{
      height: skeletonRowHeight,
      marginBottom: 8,
    }}
  />
))}
```

**Props addition to `MobileStateView`:**

```typescript
interface MobileStateViewProps {
  // ... existing props ...
  /** Number of shimmer rows to show in loading state. Default: 5. */
  skeletonRows?: number
  /** Height of each shimmer row. Default: '56px'. */
  skeletonRowHeight?: string | number
}
```

**Shimmer timing summary:**

| Property | Value | Rationale |
|----------|-------|-----------|
| Duration | 1.5s | Perceptible but not distracting. Matches common loading skeleton conventions. |
| Easing | ease-in-out | Smooth acceleration/deceleration prevents mechanical feel. |
| Direction | Left-to-right (`background-position` 200% to -200%) | Matches western reading direction. Consistent with Material Design shimmer. |
| Stagger | 50ms per row | Creates a subtle wave effect that implies sequential loading rather than a static block. |
| Gradient | `rgba(255, 255, 255, 0.03)` to `0.08` back to `0.03` | Subtle on the dark Oblivion background. High enough contrast to be visible, low enough to avoid flashing. |

---

### D-11: Integration in `MobileView` (`src/components/mobile/MobileView.tsx` -- modified)

Wires all pull-to-refresh and edge polish deliverables into the main mobile view component.

**New imports:**

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'
import { useConnectionToast } from '@/hooks/use-connection-toast'
import { createTabRefreshHandler, TAB_QUERY_KEYS } from '@/lib/mobile-query-keys'
import { MobilePullIndicator } from '@/components/mobile/MobilePullIndicator'
import { MobileConnectionToast } from '@/components/mobile/MobileConnectionToast'
import '@/styles/mobile-pull-to-refresh.css'
```

**Hook wiring:**

```typescript
// Scroll refs for each tab content area
const situationScrollRef = useRef<HTMLElement>(null)
const mapScrollRef = useRef<HTMLElement>(null)
const intelScrollRef = useRef<HTMLElement>(null)

const scrollRefForTab: Record<MobileTab, React.RefObject<HTMLElement | null>> = {
  situation: situationScrollRef,
  map: mapScrollRef,
  intel: intelScrollRef,
}

// TanStack Query client for invalidation
const queryClient = useQueryClient()

// Create a stable refresh handler for the active tab
const refreshHandler = useMemo(
  () => createTabRefreshHandler(queryClient, activeTab),
  [queryClient, activeTab],
)

// Pull-to-refresh on the active tab's scroll container
const { isPulling, pullDistance, isRefreshing } = usePullToRefresh({
  scrollRef: scrollRefForTab[activeTab],
  onRefresh: refreshHandler,
  enabled: !isSheetOpen, // Disable during bottom sheet interactions
})

// Connection restored toast
const { showToast } = useConnectionToast()

// Tab re-tap scroll-to-top
const handleActiveTabRetap = useCallback(() => {
  const ref = scrollRefForTab[activeTab]
  ref?.current?.scrollTo({ top: 0, behavior: 'smooth' })
}, [activeTab])
```

**Render integration:**

```tsx
<MobileShell
  activeTab={activeTab}
  onTabChange={handleTabChange}
  onActiveTabRetap={handleActiveTabRetap}
  situationContent={
    <div ref={situationScrollRef} className="mobile-shell-tab-content">
      <MobilePullIndicator
        pullDistance={activeTab === 'situation' ? pullDistance : 0}
        isRefreshing={activeTab === 'situation' && isRefreshing}
        threshold={60}
      />
      {/* ... existing situation tab content ... */}
    </div>
  }
  mapContent={
    <div ref={mapScrollRef} className="mobile-shell-tab-content">
      <MobilePullIndicator
        pullDistance={activeTab === 'map' ? pullDistance : 0}
        isRefreshing={activeTab === 'map' && isRefreshing}
        threshold={60}
      />
      {/* ... existing map tab content ... */}
    </div>
  }
  intelContent={
    <div ref={intelScrollRef} className="mobile-shell-tab-content">
      <MobilePullIndicator
        pullDistance={activeTab === 'intel' ? pullDistance : 0}
        isRefreshing={activeTab === 'intel' && isRefreshing}
        threshold={60}
      />
      {/* ... existing intel tab content ... */}
    </div>
  }
/>

{/* Connection toast (fixed position, outside MobileShell flow) */}
<MobileConnectionToast visible={showToast} />
```

**`isSheetOpen` derivation:** The `enabled` flag for `usePullToRefresh` is set to `false` when any bottom sheet is open (category detail morph active, map alert detail open, settings sheet open). This prevents the pull gesture from conflicting with the bottom sheet's drag-to-dismiss gesture.

```typescript
const isSheetOpen =
  useUIStore((s) => s.morph.phase !== 'idle') ||
  useCoverageStore((s) => s.selectedMapAlertId !== null) ||
  settingsSheetOpen
```

---

### D-12: Unit tests (`src/__tests__/pull-to-refresh.test.ts`)

**`usePullToRefresh` hook tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-1 | Does not activate when scrollTop > 0 | Create a div with scrollTop = 50. Attach hook. Simulate touchstart, touchmove (deltaY=80), touchend. | `onRefresh` NOT called. `isPulling` remains false. |
| T-2 | Activates when scrollTop === 0 and deltaY > 0 | Create a div with scrollTop = 0. Simulate touchstart (clientY=100), touchmove (clientY=130). | `isPulling === true`. `pullDistance === 30`. |
| T-3 | Triggers refresh when pullDistance >= threshold | Simulate pull to 70px (above 60px threshold). Release. | `onRefresh` called once. `isRefreshing === true` (until onRefresh resolves). |
| T-4 | Does not trigger refresh below threshold | Simulate pull to 40px (below 60px threshold). Release. | `onRefresh` NOT called. `pullDistance` snaps to 0. |
| T-5 | Rubber-band resistance past threshold | Simulate pull to 120px (60px past threshold). | `pullDistance` < 120 (diminished by 0.3 factor). Approximately 60 + (60 * 0.3) = 78. |
| T-6 | Cancels pull when scrollTop changes during gesture | Start pull at scrollTop = 0. During touchmove, set scrollTop = 10 (mock). | `isPulling` becomes false. `pullDistance` resets to 0. |
| T-7 | Does not activate when enabled = false | Set enabled = false. Simulate full pull gesture. | `onRefresh` NOT called. `isPulling` remains false. |
| T-8 | Does not activate during existing refresh | Set isRefreshing = true (by triggering a previous refresh with a slow-resolving promise). Attempt a second pull. | Second pull does not activate. |
| T-9 | Calls navigator.vibrate on successful release | Mock `navigator.vibrate`. Pull past threshold and release. | `navigator.vibrate` called with `10`. |
| T-10 | Handles missing navigator.vibrate gracefully | Delete `navigator.vibrate`. Pull past threshold and release. | No error thrown. `onRefresh` still called. |

**`useConnectionToast` hook tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-11 | `showToast` is false initially | Render hook. | `showToast === false`. |
| T-12 | Shows toast on offline-to-online transition | Set `navigator.onLine = false`. Render hook (wasOffline = true). Dispatch `online` event. | `showToast === true`. |
| T-13 | Does not show toast on initial online state | Set `navigator.onLine = true`. Render hook. | `showToast === false` (was never offline). |
| T-14 | Auto-dismisses toast after 3 seconds | Trigger offline-to-online transition. Advance timers by 3000ms. | `showToast === false`. |
| T-15 | Clears toast immediately on new offline event | Trigger offline-to-online (toast visible). Dispatch `offline` event before 3s timeout. | `showToast === false`. |
| T-16 | Cleans up event listeners on unmount | Render hook. Unmount. Dispatch `online` event. | No state updates (no errors). |

**Per-tab query key mapping tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-17 | `TAB_QUERY_KEYS.situation` includes threat-picture prefix | Direct assertion. | `TAB_QUERY_KEYS.situation` contains `['threat-picture']`. |
| T-18 | `TAB_QUERY_KEYS.map` includes coverage map-data prefix | Direct assertion. | `TAB_QUERY_KEYS.map` contains `['coverage', 'map-data']`. |
| T-19 | `TAB_QUERY_KEYS.intel` includes intel feed and geo-summary prefixes | Direct assertion. | `TAB_QUERY_KEYS.intel` contains `['intel', 'feed']` and `['geo-summary']`. |
| T-20 | `createTabRefreshHandler` invalidates correct queries | Mock `queryClient.invalidateQueries`. Create handler for `'situation'`. Call handler. | `invalidateQueries` called 3 times with correct query key prefixes. |
| T-21 | `createTabRefreshHandler` for `'map'` invalidates only map queries | Mock `queryClient`. Create handler for `'map'`. Call handler. | `invalidateQueries` called once with `{ queryKey: ['coverage', 'map-data'] }`. |

**Tab re-tap tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-22 | Tapping active tab calls `onActiveTabRetap` | Render `MobileBottomNav` with `activeTab='situation'`. Click the Situation tab button. | `onActiveTabRetap` called. `onTabChange` NOT called. |
| T-23 | Tapping inactive tab calls `onTabChange` | Render `MobileBottomNav` with `activeTab='situation'`. Click the Map tab button. | `onTabChange` called with `'map'`. `onActiveTabRetap` NOT called. |

**Test setup notes:**

- Use `vi.useFakeTimers()` for timeout-dependent tests (T-14, T-15).
- Mock touch events via `new TouchEvent('touchstart', { touches: [{ clientY: 100 }] })` or equivalent mock.
- Mock `navigator.vibrate` via `vi.spyOn(navigator, 'vibrate')`.
- Mock `navigator.onLine` via `Object.defineProperty(navigator, 'onLine', { writable: true, value: false })`.
- Use `@testing-library/react` `renderHook` for hook tests.
- Mock `queryClient.invalidateQueries` via `vi.fn(() => Promise.resolve())`.
- Create mock scroll container elements via `document.createElement('div')` with mocked `scrollTop` getter.

**File location:** `src/__tests__/pull-to-refresh.test.ts`

**Estimated size:** ~350 lines.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Pulling down from the top of the Situation tab content (scrollTop = 0) by 60px or more triggers a data refresh. The progress arc fills as the user pulls. On release, the scan line sweep animation plays while data refetches. | Manual: Open Situation tab. Scroll to top. Pull down slowly past the arc fill. Release. Verify scan line animation plays, then new data loads. |
| AC-2 | Pulling down on the Situation tab invalidates `useThreatPicture`, `usePriorityFeed`, and `useCoverageMetrics` queries only. Map and Intel queries are NOT invalidated. | DevTools: Open React Query DevTools. Pull-to-refresh on Situation tab. Verify only `['threat-picture', *]`, `['priority', *]`, and `['coverage', 'metrics']` queries show a refetch. Map-data and intel queries retain their previous `dataUpdatedAt`. |
| AC-3 | Pulling down on the Map tab invalidates `useCoverageMapData` only. | DevTools: Pull-to-refresh on Map tab. Verify only `['coverage', 'map-data', *]` queries refetch. |
| AC-4 | Pulling down on the Intel tab invalidates `useIntelFeed` and `useAllGeoSummaries` only. | DevTools: Pull-to-refresh on Intel tab. Verify only `['intel', 'feed']` and `['geo-summary', *]` queries refetch. |
| AC-5 | Pulling down less than 60px and releasing does NOT trigger a refresh. The progress arc snaps back to 0. | Manual: Pull down ~30px and release. Verify no refetch occurs. Arc resets. |
| AC-6 | Pulling down when scrollTop > 0 does not activate the pull gesture. Content scrolls normally. | Manual: Scroll the Situation tab content down. Pull down. Verify normal scroll behavior (content scrolls up), not pull-to-refresh. |
| AC-7 | The pull gesture shows rubber-band resistance past 60px (pull speed diminishes visually). | Manual: Pull slowly past the threshold. Observe that the indicator moves more slowly the further past 60px you pull. |
| AC-8 | `navigator.vibrate(10)` fires on successful pull release. On devices/browsers without vibrate support (iOS Safari), no error occurs and the refresh proceeds normally. | Manual on Android: feel the brief vibration on release. Manual on iOS: confirm no error, refresh works. |
| AC-9 | Pull-to-refresh is disabled when any bottom sheet is open (category detail, alert detail, settings). | Manual: Open a category detail sheet. Try to pull-to-refresh on the content behind the sheet. Verify the pull gesture does not activate. |
| AC-10 | Tapping the already-active tab in the bottom navigation smoothly scrolls the tab's content to the top. | Manual: Scroll Situation tab content down. Tap the Situation tab button. Verify smooth scroll-to-top animation. |
| AC-11 | Tapping an inactive tab still switches tabs (existing behavior unchanged). | Manual: Tap Map tab while on Situation. Verify tab switches as before. |
| AC-12 | Tapping the active Map tab (non-scrolling content) does nothing and causes no error. | Manual: Tap the Map tab while on the Map tab. Verify no error, no visual glitch. |
| AC-13 | When the device goes offline and then reconnects, a "Connection restored" toast appears at the bottom of the screen (above the tab bar) and auto-dismisses after approximately 3 seconds. | Manual: Enable airplane mode. Wait 2 seconds. Disable airplane mode. Verify toast appears and disappears. |
| AC-14 | The connection toast does not appear on initial page load when the device is online. | Manual: Load the page with connectivity. Verify no toast. |
| AC-15 | The connection toast has `role="status"` and `aria-live="polite"` for screen reader announcement. | Inspect DOM attributes on `.mobile-connection-toast`. |
| AC-16 | Loading skeleton shimmer animations are consistent across all tabs: 1.5s duration, left-to-right sweep, with 50ms stagger between rows. | Manual: Throttle network to slow 3G. Load each tab. Verify shimmer rows animate with staggered timing. |
| AC-17 | `overscroll-behavior: contain` is set on `.mobile-shell-tab-content` elements. Browser native pull-to-refresh does not activate on any tab. | Manual on Chrome Android: pull down quickly on the Situation tab. Verify no browser refresh spinner appears. Inspect computed styles for `overscroll-behavior: contain`. |
| AC-18 | All animations respect `prefers-reduced-motion: reduce`. Scan line does not animate (static position). Shimmer has no animation (solid subtle background). Toast transitions immediately without slide. | Chrome DevTools: enable "prefers-reduced-motion: reduce" in Rendering panel. Verify behaviors. |
| AC-19 | All 23 unit tests pass. | Run `pnpm test:unit -- --run src/__tests__/pull-to-refresh.test.ts`. |
| AC-20 | `pnpm typecheck` passes with zero errors after all changes. | Run `pnpm typecheck` from project root. |
| AC-21 | `pnpm lint` passes with zero errors. | Run `pnpm lint` from project root. |
| AC-22 | Desktop rendering is completely unaffected. No mobile-only files are imported by the desktop component tree. Pull-to-refresh CSS does not apply outside `.mobile-shell-tab-content` containers. | Load desktop view (viewport >= 768px). Verify no visual or behavioral changes. No pull gesture active. |

---

## 6. Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | Custom `touchstart`/`touchmove`/`touchend` handler over a pull-to-refresh library (e.g., `react-pull-to-refresh`, `pulltorefreshjs`). | The gesture logic is ~80 lines of straightforward touch event handling. Adding a library would introduce a dependency for minimal gain, and no library integrates the Oblivion scan line aesthetic or the per-tab query invalidation pattern. The custom hook also avoids DOM manipulation libraries that conflict with React's reconciler. |
| AD-2 | Per-tab query invalidation via `TAB_QUERY_KEYS` mapping (not global `queryClient.invalidateQueries()` with no filter). | Global invalidation would refetch all queries across all tabs -- wasteful when the user is refreshing only the visible tab. Per-tab mapping reduces API calls by 50-70% per refresh and avoids unnecessary re-renders in off-screen tabs. The mapping also gives fine-grained control: adding a new query to a tab requires only a one-line addition to the constant. |
| AD-3 | `overscroll-behavior: contain` at the shell level to suppress browser native pull-to-refresh. | Chrome Android and Safari iOS both implement native pull-to-refresh. Without suppression, the browser's refresh competes with the custom gesture, causing visual and behavioral conflicts. `overscroll-behavior: contain` is well-supported (Chrome 63+, Safari 16+, Firefox 59+) and is the standard approach for apps with custom pull-to-refresh. WS-C.1 already uses this property on bottom sheet scroll containers. |
| AD-4 | `useConnectionToast` monitors `navigator.onLine` events directly (not consuming `useDataFreshness` from WS-B.3). | The toast requires instantaneous transition detection (the `online` event fires the moment connectivity returns). `useDataFreshness` operates on a polling timescale (monitors `dataUpdatedAt` which updates after successful API calls, potentially seconds after connectivity returns). Using the raw browser event provides immediate feedback. Both hooks read the same underlying signal (`navigator.onLine`) but at different abstraction levels for different UI needs. |
| AD-5 | Tab re-tap scroll-to-top follows iOS convention (tap active tab bar item to scroll content to top). | This is the most common mobile interaction pattern for returning to the top of a list. iOS has shipped this behavior since the original iPhone. Android apps inconsistently implement it but users expect it. The implementation is trivial (`scrollTo({ top: 0, behavior: 'smooth' })`) and provides significant UX value for long scrollable lists (Intel feed, category grid). |
| AD-6 | Haptic feedback uses `navigator.vibrate(10)` with silent fallback, not AudioContext or Taptic Engine. | `navigator.vibrate` is the simplest cross-platform vibration API. A 10ms pulse is the minimum perceptible vibration -- enough to confirm the action without being intrusive. iOS Safari does not support `navigator.vibrate` at all (returns `undefined`), so the call uses optional chaining (`navigator.vibrate?.()`) and a try-catch. No AudioContext workaround is attempted because audio feedback for a pull gesture is unexpected and potentially disruptive. |
| AD-7 | Pull-to-refresh on the Map tab attaches to the tab content container (not the MapLibre canvas). | The Map tab has no scrollable content -- the entire area is a MapLibre GL canvas which consumes all touch events for pan/zoom. The pull gesture attaches to the `.mobile-shell-tab-content` wrapper div. Since this wrapper has `scrollTop === 0` (it is not scrollable), the pull gesture always activates on downward pull. This means pulling down on the map triggers refresh rather than map pan. The 60px threshold is high enough that intentional map panning (typically small, fast gestures) does not accidentally trigger refresh. |
| AD-8 | `MobilePullIndicator` uses `aria-hidden="true"` rather than live region announcements. | The pull indicator is a purely decorative animation. The meaningful outcome -- updated data -- is communicated via the data change itself (new alert counts, updated timestamps, etc.). Announcing "Refreshing..." and "Refresh complete" via screen reader would be redundant and noisy during a gesture that completes in under 2 seconds. |
| AD-9 | Shimmer stagger uses `data-shimmer-index` attributes and CSS selectors (not JavaScript animation orchestration). | CSS-only stagger avoids the overhead of JavaScript requestAnimationFrame or `motion/react` orchestration for what is a simple visual polish. The `data-shimmer-index` pattern keeps the stagger logic declarative and inspectable. Six index values (0-5) cover the maximum number of simultaneous skeleton rows displayed in any loading state. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the Map tab pull-to-refresh use a pull gesture (AD-7) or a floating refresh button? The pull gesture on a non-scrolling surface may feel unusual compared to the Situation and Intel tabs where it is triggered from within a scroll container. A floating refresh button in the map controls area would be more discoverable but breaks consistency across tabs. | world-class-ux-designer + react-developer | Phase F review gate |
| OQ-2 | Should `navigator.vibrate` be replaced with a different haptic feedback mechanism? iOS Safari does not support the Vibration API at all, leaving iOS users without haptic feedback. Possible alternatives: (a) No haptic on iOS (current approach -- silent fallback). (b) AudioContext micro-sound on iOS. (c) Accept the platform limitation since iOS pull-to-refresh conventions do not include haptic feedback. | world-class-ux-designer | Phase F review gate |
| OQ-3 | Should the "Connection restored" toast show additional context (e.g., "Connection restored -- refreshing data") and auto-trigger a pull-to-refresh on all tabs? Currently the toast is informational only. An automatic refresh on reconnect would ensure the user sees fresh data without manual action, but TanStack Query's `refetchOnReconnect` default behavior may already handle this. | react-developer | Phase F review gate |
| OQ-4 | Should skeleton shimmer rows match the height and spacing of the actual content they are replacing (e.g., `MobileAlertCard` = 80px, `MobileCategoryCard` = variable, `MobileRegionCard` = 80px)? Currently D-10 uses generic `skeletonRowHeight` as a prop with a 56px default. Context-aware skeletons look more polished but require per-component configuration. | world-class-ui-designer | Phase F review gate |

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `navigator.vibrate()` is not supported on iOS Safari. Users on iOS receive no haptic feedback on pull-to-refresh release. | Certain (iOS limitation) | Low | The visual feedback (arc fill + scan line sweep) provides sufficient confirmation without haptic. iOS's native pull-to-refresh (e.g., in Safari, Mail) also does not provide haptic feedback, so iOS users do not expect it. The API call uses optional chaining and try-catch to prevent runtime errors. |
| R-2 | `overscroll-behavior: contain` does not fully suppress native pull-to-refresh on iOS Safari 15 and earlier. The browser's refresh spinner may appear alongside the custom indicator. | Low (iOS 15 market share is declining; iOS 16+ supports the property correctly) | Medium | Target iOS Safari 16+ for full compatibility. On iOS 15, the native refresh may co-fire with the custom one -- both would refetch data, which is harmless (duplicate refetch). The visual conflict (two indicators) is suboptimal but not broken. Document iOS 15 as a known degradation in release notes. |
| R-3 | `touchmove` with `{ passive: false }` may cause scroll jank on older Android devices. Calling `e.preventDefault()` in `touchmove` disables the browser's scroll optimization, potentially causing janky scrolling during the pull gesture. | Low | Low | The `preventDefault()` is only called when `scrollTop === 0` and `deltaY > 0` (pulling down from top). During normal scrolling (`scrollTop > 0`), the handler returns early without calling `preventDefault()`, preserving passive scroll performance. The risk is limited to the first few pixels of the pull gesture at the top of the container. |
| R-4 | Pull-to-refresh on the Map tab (AD-7) may conflict with MapLibre's touch handlers. The map captures all touch events for pan/zoom within the canvas element. The pull gesture attached to the parent wrapper may not receive `touchstart` events that originate inside the MapLibre canvas. | Medium | Medium | Test on real devices. If the map canvas swallows touch events, the pull gesture will simply not activate on the Map tab (the map pans instead). This is an acceptable degradation -- Map data auto-refreshes every 30 seconds via `useCoverageMapData`'s `refetchInterval`. If pull-to-refresh on the Map tab is desired, add a floating "refresh" button in the map controls as a fallback (see OQ-1). |
| R-5 | `useConnectionToast` fires a false "Connection restored" toast on page load if the device briefly reports offline during initialization. Some browsers report `navigator.onLine = false` momentarily during page load before establishing connectivity. | Low | Low | The `wasOfflineRef` is initialized to `!navigator.onLine` on mount. If the browser reports online at mount time (the common case), `wasOfflineRef` starts as `false`, and a subsequent `online` event does not trigger the toast (because `wasOfflineRef` was false -- the device was never seen as offline). The toast only fires on a genuine offline-to-online transition observed after mount. |
| R-6 | The 60px pull threshold may feel too short on large phones (e.g., iPhone 15 Pro Max, 6.7") and too long on small phones (e.g., iPhone SE, 4.7"). A percentage-based threshold might adapt better to screen size. | Low | Low | 60px is used by most major apps (Twitter/X, Instagram, Gmail) regardless of screen size. It corresponds to approximately 8-12mm of physical movement, which is in the comfortable range for a single-finger downward swipe on all screen sizes. If user testing reveals issues, the threshold can be adjusted in a single constant. |
| R-7 | `e.preventDefault()` in `touchmove` on the tab content container prevents native scroll when the user starts a touch at `scrollTop === 0` and intends to scroll down rather than pull-to-refresh. If the user touches at the top and moves down less than 60px, content should begin scrolling -- but `preventDefault()` has already been called. | Medium | Medium | Introduce a "dead zone" of 10px: do not call `preventDefault()` until `deltaY > 10`. Within the first 10px of downward movement, the browser handles the event natively (allowing scroll). After 10px, the hook takes over and calls `preventDefault()`. This means the first 10px of a pull gesture may cause a tiny scroll, but the visual effect is negligible. Update the `handleTouchMove` implementation to include this guard. |
