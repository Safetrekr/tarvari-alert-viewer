# WS-B.1: Threat Banner + Priority

> **Workstream ID:** WS-B.1
> **Phase:** B -- Situation Tab
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-A.1 (mobile component directory, `useIsMobile` hook), WS-A.2 (MobileShell `situationContent` slot, MobileHeader `threatIndicator` slot, `MobileStateView` component, `MobileTab` type), WS-A.3 (spacing tokens, typography tokens, severity tokens, touch target tokens, corner bracket tokens, glass tokens, posture tokens, `--color-data-stale-bg`), WS-A.4 (safe area tokens, viewport meta)
> **Blocks:** WS-D.2 (MobileAlertCard pattern established here for P1 strip pills), WS-E.1 (Intel tab priority section may reuse MobilePriorityStrip)
> **Resolves:** Persistent P1 banner requirement (protective-ops-review C2)

---

> **Review Fixes Applied (Phase B Review):**
>
> - **H-1 (staleness duplication):** `useDataStaleness` (D-2) and `MobileDataStaleBanner` (D-8) are REMOVED from this SOW. Staleness detection and banner are owned by WS-B.3 (`useDataFreshness` + `DataStaleBanner` at MobileShell level). Remove staleness rendering from `MobileSituationTab` (D-9). Remove AC-16, AC-17, AC-18 (staleness ACs). Remove OQ-3 (staleness query scope).
> - **H-2 (posture duplication):** `derivePosture` (D-1) remains here as the single source. WS-B.3's `deriveThreatLevel` is removed. WS-B.3's `ThreatPulseBackground` receives posture level as a prop.
> - **H-3 (ThreatLevel vocabulary):** Replace all `ThreatLevel` references with the existing `ThreatLevel` type from `src/lib/interfaces/coverage.ts`. Replace `MODERATE` with `MODERATE` throughout. This ensures compatibility with WS-A.3's `--posture-moderate-*` tokens.
> - **M-1 (thresholds):** Use thresholds from this SOW (matching desktop `ThreatPictureCard.tsx`) as the authoritative values.
> - **H-4 (Resolves header):** Updated above -- C1 belongs to WS-B.3.

---

## 1. Objective

Build the five threat-awareness components that occupy the top portion of the Situation tab and the MobileHeader threat slot. Together these components form the mobile operator's primary situational awareness surface: a posture-level banner summarizing the global threat picture, a persistent P1 alert banner that demands acknowledgment, a header glow badge providing at-a-glance posture indication, a horizontally-scrolling priority strip showing individual P1/P2 alert pills, and a data staleness/offline banner that warns when information may be unreliable.

All five components wire directly to existing TanStack Query hooks (`useThreatPicture`, `usePriorityFeed`) and introduce no new API endpoints. The data staleness check uses TanStack Query's built-in `dataUpdatedAt` property combined with `navigator.onLine` to determine display state.

This workstream establishes the `MobileAlertPill` sub-component pattern that WS-D.2 (Alert Detail + Card) and WS-E.1 (Intel Tab) reuse for priority alert rendering in other contexts.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `MobileThreatBanner` component | 56px banner showing posture level badge (color-coded), active alert count, P1/P2 counts, trend indicator. Data: `useThreatPicture()`. |
| `MobileP1Banner` component | 64px conditional banner (renders only when P1 count > 0). Shows most recent P1 alert headline with category + severity + relative time. Persists until tapped or superseded. No auto-dismiss. |
| `MobileThreatIndicator` component | 8px glow badge placed in MobileHeader's `threatIndicator` slot. Reflects current posture level via color and optional pulse animation. |
| `MobilePriorityStrip` component | 44px sticky horizontal scroll strip with `scroll-snap-type: x mandatory`. Renders P1/P2 alert pills sorted by priority then recency. |
| `MobileAlertPill` sub-component | Reusable pill rendering a single P1/P2 alert (category short code + severity dot + truncated title). Used inside MobilePriorityStrip and exported for WS-D.2 / WS-E.1 reuse. |
| `MobileDataStaleBanner` component | Persistent banner below MobileHeader when any monitored query's `dataUpdatedAt` > 3 minutes stale OR `navigator.onLine === false`. Shows "DATA STALE" or "OFFLINE" text. |
| `useDataStaleness` hook | Custom hook that monitors `dataUpdatedAt` from `useThreatPicture` and `usePriorityFeed` queries, combined with `navigator.onLine`, to derive staleness state. |
| `derivePosture` utility function | Extract posture derivation logic from `ThreatPictureCard.tsx` into a shared pure function in `src/lib/threat-utils.ts` for reuse by both desktop and mobile. |
| CSS file for threat components | `src/styles/mobile-threat.css` with keyframes, scroll-snap styles, and P1 pulse animation. |
| Situation tab integration | Wire all five components into MobileShell's `situationContent` slot via `MobileView.tsx` (or an intermediate `MobileSituationTab.tsx` orchestrator). |
| Unit tests | Tests for `derivePosture`, `useDataStaleness`, P1 banner acknowledgment, priority strip rendering. |
| Touch target compliance | All interactive elements meet `var(--touch-target-min)` (44px). |
| Reduced motion support | All pulse/glow animations respect `prefers-reduced-motion: reduce`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Category grid (below the priority strip) | WS-B.2 scope. |
| `ThreatPulseBackground` ambient animation | WS-B.3 scope. This WS provides the posture level; WS-B.3 uses it for the background pulse. |
| Connectivity dot logic in MobileHeader | WS-B.3 scope. `MobileThreatIndicator` is a separate slot from the connectivity dot. |
| Alert detail bottom sheet (tapped from P1 banner) | WS-C.1 / WS-D.2 scope. This WS provides the `onTapP1` callback; the sheet is built later. |
| Intel tab switching logic | WS-A.2 owns `handleTabChange`. This WS passes a callback prop that calls it. |
| Pull-to-refresh for data refresh | WS-F.5 scope. |
| Desktop rendering changes | All new components are mobile-only. Desktop is unaffected. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-threat-picture.ts` | `useThreatPicture()` returning `UseQueryResult<ThreatPicture>` with `dataUpdatedAt`, `totalActiveAlerts`, `byPriority`, `bySeverity`, `overallTrend`, `trendDetail` | Exists (275 lines, staleTime 90s, refetch 120s) |
| `src/hooks/use-priority-feed.ts` | `usePriorityFeed()` returning `UseQueryResult<PriorityFeedSummary>` with `dataUpdatedAt`, `items`, `p1Count`, `p2Count`, `mostRecentP1`, `mostRecentP2` | Exists (157 lines, staleTime 10s, refetch 15s) |
| `src/lib/interfaces/coverage.ts` | `ThreatLevel`, `THREAT_LEVELS`, `SeverityLevel`, `SEVERITY_COLORS`, `OperationalPriority`, `PRIORITY_META`, `PriorityMeta`, `TrendDirection`, `getCategoryMeta`, `getCategoryColor` | Exists |
| `src/lib/coverage-utils.ts` | `CoverageMetrics`, `CoverageByCategory` types | Exists |
| `src/components/coverage/ThreatPictureCard.tsx` | Posture derivation logic (lines 139-148) and `POSTURE_CONFIG` (lines 54-60) to extract into shared utility | Exists (425 lines) |
| `src/components/coverage/PriorityFeedStrip.tsx` | Desktop priority strip reference implementation for visual parity and data flow patterns | Exists (348 lines) |
| `src/hooks/use-priority-feed.ts` | `PriorityFeedItem` type (id, title, severity, category, operationalPriority, shortSummary, ingestedAt) | Exists (line 59-72) |
| `src/lib/time-utils.ts` | `relativeTimeAgo()` for displaying relative timestamps | Exists (used by PriorityFeedStrip) |
| WS-A.2 | `MobileShell` with `situationContent` slot, `MobileHeader` with `threatIndicator` slot, `MobileStateView` component, `MobileTab` type in `src/lib/interfaces/mobile.ts` | Pending |
| WS-A.3 | All mobile tokens: `--space-threat-banner-height` (56px), `--space-p1-banner-height` (64px), `--space-priority-strip-height` (44px), `--space-card-padding` (14px), `--space-content-padding` (12px), `--space-section-gap` (16px), `--space-inline-gap` (8px), `--touch-target-min` (44px), `--touch-target-comfortable` (48px), `--text-card-metric` (22px), `--text-body` (13px), `--text-label` (11px), `--text-caption` (10px), `--text-ghost` (10px), `--line-height-label` (1.3), `--tracking-label-mobile` (0.14em), `--glass-card-bg`, `--glass-card-blur`, `--corner-bracket-size`, `--corner-bracket-offset`, `--corner-bracket-thickness`, `--corner-bracket-color`, `--color-data-stale-bg` (rgba(234,179,8,0.15)), `--severity-*`, posture-level tokens | Pending |
| WS-A.4 | `--safe-area-top`, `--safe-area-bottom` tokens | Pending |
| `src/styles/spatial-tokens.css` | `--color-void`, `--color-text-primary`, `--color-text-secondary`, `--color-text-tertiary`, `--color-border-subtle`, `--font-mono`, `--duration-fast`, `--duration-hover`, `--ease-default`, `--glow-error` | Exists |
| `lucide-react` | `Shield`, `TrendingUp`, `TrendingDown`, `Minus`, `AlertTriangle`, `ChevronRight`, `WifiOff`, `Clock` | Available via existing dependency |

---

## 4. Deliverables

### D-1: `derivePosture` utility (`src/lib/threat-utils.ts`)

New shared module extracting posture derivation from `ThreatPictureCard.tsx` (lines 139-148) and the posture color/border configuration (lines 54-60) into reusable pure functions.

```typescript
/**
 * Shared threat posture derivation and display metadata.
 *
 * Extracted from ThreatPictureCard for reuse by both
 * desktop (ThreatPictureCard) and mobile (MobileThreatBanner,
 * MobileThreatIndicator, ThreatPulseBackground).
 *
 * @module threat-utils
 * @see WS-B.1
 * @see WS-4.5 (ThreatPictureCard -- original location)
 */

import type { SeverityDistribution } from '@/hooks/use-threat-picture'

/** Threat posture levels in descending urgency. */
// Use existing ThreatLevel from src/lib/interfaces/coverage.ts (per Phase B Review H-3)
// type ThreatLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW'
import type { ThreatLevel } from '@/lib/interfaces/coverage'

/** Display metadata for a single posture level. */
export interface PostureConfig {
  /** Primary color at rest opacity. */
  color: string
  /** Tinted background. */
  bg: string
  /** Border color. */
  border: string
  /** Human-readable label. */
  label: string
}

/** Posture-to-display-metadata lookup. */
export const POSTURE_CONFIG: Record<ThreatLevel, PostureConfig> = {
  CRITICAL: {
    color: 'rgba(220, 38, 38, 0.9)',
    bg: 'rgba(220, 38, 38, 0.10)',
    border: 'rgba(220, 38, 38, 0.25)',
    label: 'Critical',
  },
  HIGH: {
    color: 'rgba(239, 68, 68, 0.8)',
    bg: 'rgba(239, 68, 68, 0.08)',
    border: 'rgba(239, 68, 68, 0.20)',
    label: 'High',
  },
  ELEVATED: {
    color: 'rgba(249, 115, 22, 0.8)',
    bg: 'rgba(249, 115, 22, 0.08)',
    border: 'rgba(249, 115, 22, 0.20)',
    label: 'Elevated',
  },
  MODERATE: {
    color: 'rgba(234, 179, 8, 0.8)',
    bg: 'rgba(234, 179, 8, 0.06)',
    border: 'rgba(234, 179, 8, 0.15)',
    label: 'Guarded',
  },
  LOW: {
    color: 'rgba(34, 197, 94, 0.7)',
    bg: 'rgba(34, 197, 94, 0.06)',
    border: 'rgba(34, 197, 94, 0.15)',
    label: 'Low',
  },
}

/**
 * Derive the threat posture level from severity distribution data.
 *
 * Rules (matching ThreatPictureCard lines 139-148):
 * - extreme >= 10 -> CRITICAL
 * - extreme > 0 || severe >= 50 -> HIGH
 * - severe > 0 -> ELEVATED
 * - totalActiveAlerts > 0 -> MODERATE
 * - otherwise -> LOW
 *
 * @param bySeverity - Array of severity distribution objects.
 * @param totalActiveAlerts - Total number of active alerts.
 * @returns The derived ThreatLevel.
 */
export function derivePosture(
  bySeverity: SeverityDistribution[],
  totalActiveAlerts: number,
): ThreatLevel {
  const extreme = bySeverity.find((s) => s.severity === 'Extreme')?.count ?? 0
  const severe = bySeverity.find((s) => s.severity === 'Severe')?.count ?? 0
  if (extreme >= 10) return 'CRITICAL'
  if (extreme > 0 || severe >= 50) return 'HIGH'
  if (severe > 0) return 'ELEVATED'
  if (totalActiveAlerts > 0) return 'MODERATE'
  return 'LOW'
}
```

After creation, update `ThreatPictureCard.tsx` to import `derivePosture` and `POSTURE_CONFIG` from `src/lib/threat-utils.ts` instead of defining them locally. This is a mechanical refactor that does not change any behavior.

---

### D-2: `useDataStaleness` hook (`src/hooks/use-data-staleness.ts`)

Custom hook that monitors TanStack Query `dataUpdatedAt` timestamps and `navigator.onLine` to derive a staleness state for the mobile banner.

```typescript
/**
 * Monitors data freshness across multiple TanStack Query results
 * and navigator.onLine to derive a staleness state.
 *
 * @module use-data-staleness
 * @see WS-B.1
 * @see protective-ops-review C1
 */

import { useState, useEffect, useMemo } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

/** Staleness display state. */
export type StalenessState = 'fresh' | 'stale' | 'offline'

/** Configuration for the staleness hook. */
export interface UseDataStalenessOptions {
  /** TanStack Query results to monitor for dataUpdatedAt. */
  queries: UseQueryResult<unknown, Error>[]
  /** Staleness threshold in milliseconds. Default: 180_000 (3 minutes). */
  staleThresholdMs?: number
  /** How often to re-evaluate staleness in milliseconds. Default: 15_000 (15s). */
  checkIntervalMs?: number
}

/** Hook return value. */
export interface UseDataStalenessReturn {
  /** Current staleness state. */
  state: StalenessState
  /** Human-readable label for display. */
  label: 'DATA STALE' | 'OFFLINE' | null
  /** Whether the banner should be visible. */
  isVisible: boolean
  /** The oldest dataUpdatedAt timestamp across all queries, or null. */
  oldestUpdateAt: number | null
}

export function useDataStaleness(
  options: UseDataStalenessOptions,
): UseDataStalenessReturn {
  const {
    queries,
    staleThresholdMs = 180_000,
    checkIntervalMs = 15_000,
  } = options

  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [tick, setTick] = useState(0)

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Periodic re-evaluation of time-based staleness
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), checkIntervalMs)
    return () => clearInterval(interval)
  }, [checkIntervalMs])

  return useMemo(() => {
    // Force recalculation on tick
    void tick

    if (!isOnline) {
      return {
        state: 'offline' as const,
        label: 'OFFLINE' as const,
        isVisible: true,
        oldestUpdateAt: null,
      }
    }

    // Find the oldest dataUpdatedAt across all monitored queries
    const now = Date.now()
    let oldestUpdateAt: number | null = null

    for (const query of queries) {
      if (query.dataUpdatedAt > 0) {
        if (oldestUpdateAt === null || query.dataUpdatedAt < oldestUpdateAt) {
          oldestUpdateAt = query.dataUpdatedAt
        }
      }
    }

    if (oldestUpdateAt !== null && now - oldestUpdateAt > staleThresholdMs) {
      return {
        state: 'stale' as const,
        label: 'DATA STALE' as const,
        isVisible: true,
        oldestUpdateAt,
      }
    }

    return {
      state: 'fresh' as const,
      label: null,
      isVisible: false,
      oldestUpdateAt,
    }
  }, [isOnline, queries, staleThresholdMs, tick])
}
```

---

### D-3: `MobileThreatBanner` component (`src/components/mobile/MobileThreatBanner.tsx`)

56px banner at the top of the Situation tab content area. Shows the global threat posture at a glance.

**Structure:**

```
<div class="mobile-threat-banner" data-posture="{CRITICAL|HIGH|ELEVATED|MODERATE|LOW}">
  <div class="mobile-threat-banner-left">
    <Shield size={14} />                        <!-- posture icon -->
    <span class="posture-badge">{POSTURE}</span> <!-- color-coded badge -->
  </div>
  <div class="mobile-threat-banner-center">
    <span class="active-count">{N}</span>        <!-- totalActiveAlerts, large metric -->
    <span class="active-label">ACTIVE</span>
    <TrendIndicator direction={trend} />
  </div>
  <div class="mobile-threat-banner-right">
    <button class="priority-count" data-priority="P1" aria-label="N P1 alerts, tap to view Intel">
      <span>P1</span><span>{N}</span>
    </button>
    <button class="priority-count" data-priority="P2" aria-label="N P2 alerts, tap to view Intel">
      <span>P2</span><span>{N}</span>
    </button>
  </div>
</div>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 56px | `var(--space-threat-banner-height)` |
| Background | Posture-tinted, from `POSTURE_CONFIG[posture].bg` | -- |
| Border | `1px solid ${POSTURE_CONFIG[posture].border}` | -- |
| Border radius | 12px | -- |
| Margin | `0 var(--space-content-padding)` (12px horizontal) | `--space-content-padding` |
| Padding | `0 var(--space-card-padding)` (14px) | `--space-card-padding` |
| Display | `flex`, `align-items: center`, `gap: 10px` | -- |
| Font family | `var(--font-mono)` | -- |

**Posture badge:** Inline `<span>` with posture level text (e.g., "CRITICAL", "HIGH"). Font size `var(--text-caption)` (10px). Font weight 700. Letter spacing `0.10em`. Color from `POSTURE_CONFIG[posture].color`. Background from `POSTURE_CONFIG[posture].bg`. Border from `POSTURE_CONFIG[posture].border`. Padding `2px 7px`. Border radius 4px.

**Active count:** Font size `var(--text-card-metric)` (22px). Font weight 700. Color `rgba(255, 255, 255, 0.6)`. Line height 1. Tabular nums. The "ACTIVE" label is `var(--text-ghost)` (10px), color `rgba(255, 255, 255, 0.2)`, letter-spacing `0.06em`.

**Trend indicator:** Inline element showing `TrendingUp` (red, 11px), `TrendingDown` (green, 11px), or `Minus` (gray, 11px) icon next to the active count. Matches `ThreatPictureCard` pattern (lines 158-162). If `trendDetail` is available, shows delta text (e.g., "+5 (+12%)").

**P1/P2 count buttons:** Each is a tappable region (min 44px tall, `var(--touch-target-min)`) that calls `onSwitchTab('intel')` when tapped. P1 uses bold weight (700), P2 medium (600). Count numbers use `var(--text-label)` (11px), tabular nums. P1 count highlighted when > 0 (`rgba(255, 255, 255, 0.55)`), dimmed when 0 (`rgba(255, 255, 255, 0.15)`). P2 same pattern at lower opacity. Priority badges follow `PRIORITY_META` achromatic rules (shape/weight, no color -- per AD-1).

**Props interface:**

```typescript
import type { ThreatPicture } from '@/hooks/use-threat-picture'
import type { PriorityFeedSummary } from '@/hooks/use-priority-feed'
import type { ThreatLevel } from '@/lib/threat-utils'

export interface MobileThreatBannerProps {
  /** Threat picture data. Null during loading. */
  threatPicture: ThreatPicture | null
  /** Derived posture level. */
  posture: ThreatLevel
  /** Priority feed summary for P1/P2 counts. Null during loading. */
  priorityFeed: PriorityFeedSummary | null
  /** Whether data is still loading (initial load, no cached data). */
  isLoading: boolean
  /** Callback to switch to Intel tab when P1/P2 count is tapped. */
  onSwitchToIntel: () => void
}
```

**Loading state:** When `isLoading` is true and no cached data exists, show skeleton: posture badge as "---", counts as "--", trend as `Minus` icon. Uses the same shimmer pattern as `PriorityFeedStrip` loading state.

**Error/empty handling:** The parent (`MobileSituationTab`) uses `MobileStateView` (AD-7) to handle query-level errors. `MobileThreatBanner` receives pre-validated data or null; it never shows error UI itself.

---

### D-4: `MobileP1Banner` component (`src/components/mobile/MobileP1Banner.tsx`)

64px conditional banner that renders only when `p1Count > 0`. Shows the most recent P1 alert headline. Persists until tapped/acknowledged or superseded by a newer P1 alert.

**Structure:**

```
<AnimatePresence>
  {isVisible && (
    <motion.div class="mobile-p1-banner" ...enter/exit>
      <div class="p1-banner-indicator" />         <!-- 3px left bar, pulsing -->
      <div class="p1-banner-content">
        <span class="p1-badge">P1</span>
        <span class="p1-category">{SHORT_NAME}</span>
        <span class="p1-severity-dot" />           <!-- severity color -->
        <span class="p1-headline">{title}</span>   <!-- truncated, single line -->
      </div>
      <div class="p1-banner-meta">
        <Clock size={10} />
        <span class="p1-time">{relativeTimeAgo}</span>
      </div>
      <ChevronRight size={14} />
    </motion.div>
  )}
</AnimatePresence>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 64px | `var(--space-p1-banner-height)` |
| Background | `rgba(239, 68, 68, 0.06)` | Matches P1 active state from `PriorityFeedStrip` |
| Border | `1px solid rgba(239, 68, 68, 0.25)` | Same |
| Border radius | 12px | -- |
| Margin | `0 var(--space-content-padding)` (12px horizontal) | `--space-content-padding` |
| Left indicator bar | 3px wide, full height, `rgba(239, 68, 68, 0.7)`, border-radius `12px 0 0 12px`, pulsing animation | `@keyframes p1-banner-pulse` |
| Padding | `0 12px 0 0` (right only, left bar is the visual edge) | -- |
| Display | `flex`, `align-items: center`, `gap: 8px` | -- |
| Touch target | Entire banner is tappable (min-height 64px > 48px requirement) | `--touch-target-comfortable` |

**P1 badge:** Uses `PRIORITY_META.P1` achromatic rules: diamond shape indicator, bold weight (700), font size 9px. Text "P1" with border `1px solid rgba(239, 68, 68, 0.3)`. Background `rgba(239, 68, 68, 0.08)`. Padding `2px 5px`. Border-radius 3px.

**Category short code:** `getCategoryMeta(category).shortName` in `var(--text-caption)` (10px), color `rgba(255, 255, 255, 0.3)`, letter-spacing `0.06em`.

**Severity dot:** 6px circle colored by `SEVERITY_COLORS[severity]` (the mobile-overridden values from WS-A.3).

**Headline:** `var(--text-body)` (13px), color `rgba(255, 255, 255, 0.45)`, `text-overflow: ellipsis`, `white-space: nowrap`, `overflow: hidden`, `flex: 1`, `min-width: 0`.

**Relative time:** `relativeTimeAgo(ingestedAt)`, font size `var(--text-caption)` (10px), color `rgba(255, 255, 255, 0.25)`, letter-spacing `0.04em`.

**P1 banner pulse animation (`@keyframes p1-banner-pulse`):**

```css
@keyframes p1-banner-pulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 0.3; }
}
```

Duration: 2.5s. Timing: `ease-in-out`. Iteration: infinite. Applied to the 3px left indicator bar. Disabled when `prefers-reduced-motion: reduce`.

**Persistence / acknowledgment logic:**

The P1 banner tracks the `id` of the currently displayed P1 alert. The banner is visible when:
1. `mostRecentP1 !== null` AND
2. The `mostRecentP1.id` has not been acknowledged.

Acknowledgment is tracked via local component state (`acknowledgedP1Id: string | null`). When the user taps the banner, `acknowledgedP1Id` is set to `mostRecentP1.id`. If a new P1 alert arrives (different `id`), the banner reappears (superseding the acknowledgment).

State flow:
- Initial: `acknowledgedP1Id = null`, banner visible if `mostRecentP1` exists.
- User taps: `acknowledgedP1Id = mostRecentP1.id`, banner hides. Also fires `onTapP1(mostRecentP1)`.
- New P1 arrives: `mostRecentP1.id !== acknowledgedP1Id`, banner reappears.

The acknowledgment state is intentionally ephemeral (not persisted to sessionStorage or Zustand). On page reload, any active P1 alert will display again. This is the correct behavior for a safety-critical indicator.

**Enter/exit animation:** Uses `motion/react` `AnimatePresence`:
- Enter: `opacity: 0, height: 0` to `opacity: 1, height: 64px`. Duration 250ms. Easing: `var(--ease-default)`.
- Exit: reverse. Duration 200ms.
- Reduced motion: instant show/hide (no height animation).

**Props interface:**

```typescript
import type { PriorityFeedItem } from '@/hooks/use-priority-feed'

export interface MobileP1BannerProps {
  /** Most recent P1 alert, or null if no P1 alerts exist. */
  mostRecentP1: PriorityFeedItem | null
  /** Called when the banner is tapped. Receives the displayed P1 item. */
  onTapP1: (item: PriorityFeedItem) => void
}
```

---

### D-5: `MobileThreatIndicator` component (`src/components/mobile/MobileThreatIndicator.tsx`)

Small glow badge rendered in MobileHeader's `threatIndicator` slot. Provides an always-visible posture-level indicator even when the user scrolls down in the Situation tab or switches to another tab.

**Structure:**

```
<div class="mobile-threat-indicator" data-posture="{posture}">
  <div class="threat-indicator-dot" />
</div>
```

**Visual specification:**

| Property | Value | Notes |
|----------|-------|-------|
| Container size | 20px x 20px | Fits within header right cluster 8px gap |
| Dot size | 8px x 8px | Centered within container |
| Dot border-radius | 50% | Circle |
| Dot background | `POSTURE_CONFIG[posture].color` | Matches banner posture color |
| Dot box-shadow | `0 0 8px {posture_color_at_30%_alpha}` | Glow effect matching posture |
| Pulse animation | When posture is CRITICAL or HIGH: `@keyframes threat-indicator-pulse` (opacity 1 to 0.4, 2s cycle) | Draws attention without being distracting |
| Reduced motion | No pulse, static dot | -- |

**`@keyframes threat-indicator-pulse`:**
```css
@keyframes threat-indicator-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}
```

Duration: 2s. Timing: `ease-in-out`. Iteration: infinite. Applied only when `data-posture="CRITICAL"` or `data-posture="HIGH"`.

**Props interface:**

```typescript
import type { ThreatLevel } from '@/lib/threat-utils'

export interface MobileThreatIndicatorProps {
  /** Current threat posture level. */
  posture: ThreatLevel
  /** Whether data is still loading. Shows neutral gray dot. */
  isLoading?: boolean
}
```

**Loading state:** Gray dot (`var(--color-offline)`, `#6b7280`), no glow, no pulse.

---

### D-6: `MobilePriorityStrip` component (`src/components/mobile/MobilePriorityStrip.tsx`)

44px sticky horizontal scroll strip showing individual P1/P2 alert pills. Sticks to the top of the scroll area within the Situation tab (below the threat banner and P1 banner, above the category grid from WS-B.2).

**Structure:**

```
<div class="mobile-priority-strip" role="list" aria-label="Priority alerts">
  <div class="priority-strip-scroll">
    {sortedItems.map(item => (
      <MobileAlertPill key={item.id} item={item} onTap={onTapAlert} />
    ))}
    {sortedItems.length === 0 && (
      <span class="priority-strip-empty">NO PRIORITY ALERTS</span>
    )}
  </div>
</div>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 44px | `var(--space-priority-strip-height)` |
| Position | `sticky`, `top: 0` within scroll container | Sticks when Situation tab scrolls |
| z-index | 5 | Above category grid, below header (z-40) |
| Background | `var(--glass-card-bg)` with `var(--glass-card-blur)` | WS-A.3 glass tier 2 |
| Border bottom | `1px solid var(--color-border-subtle)` | `rgba(255, 255, 255, 0.06)` |
| Padding | `0 var(--space-content-padding)` (12px) | -- |

**Scroll container (`.priority-strip-scroll`):**

| Property | Value |
|----------|-------|
| Display | `flex`, `align-items: center`, `gap: var(--space-inline-gap)` (8px) |
| Overflow-x | `auto` |
| Scroll-snap-type | `x mandatory` |
| Scroll-padding | `0 var(--space-content-padding)` |
| Scrollbar | Hidden (`scrollbar-width: none`, `::-webkit-scrollbar { display: none }`) |
| `-webkit-overflow-scrolling` | `touch` |

**Empty state:** When `sortedItems.length === 0`, render centered text "NO PRIORITY ALERTS" in `var(--text-ghost)` (10px), color `rgba(255, 255, 255, 0.15)`, letter-spacing `0.15em`, uppercase.

**Sorting:** Items are sorted by `operationalPriority` (P1 before P2), then by `ingestedAt` descending (most recent first).

**Props interface:**

```typescript
import type { PriorityFeedItem } from '@/hooks/use-priority-feed'

export interface MobilePriorityStripProps {
  /** P1/P2 priority feed items. Empty array shows empty state. */
  items: PriorityFeedItem[]
  /** Called when an alert pill is tapped. */
  onTapAlert: (item: PriorityFeedItem) => void
  /** Whether data is loading (shows shimmer placeholders). */
  isLoading?: boolean
}
```

**Loading state:** When `isLoading` is true and `items` is empty, render 3 shimmer placeholder pills (rectangular, 120x28px each, shimmer animation from `PriorityFeedStrip`).

---

### D-7: `MobileAlertPill` sub-component (`src/components/mobile/MobileAlertPill.tsx`)

Reusable pill component for rendering a single P1/P2 alert inside the priority strip (and later in WS-D.2 / WS-E.1).

**Structure:**

```
<button class="mobile-alert-pill" role="listitem"
        data-priority="{P1|P2}" scroll-snap-align="start"
        aria-label="{priority} {category}: {title}">
  <span class="pill-priority">{P1|P2}</span>
  <span class="pill-severity-dot" />
  <span class="pill-category">{SHORT_CODE}</span>
  <span class="pill-title">{truncated title}</span>
</button>
```

**Visual specification:**

| Property | Value | Notes |
|----------|-------|-------|
| Height | 28px | Compact pill within 44px strip (padded by strip container) |
| Min-width | 140px | Enough for "P1 . SEIS Title..." |
| Max-width | 220px | Prevents one pill from dominating scroll area |
| Padding | `0 10px` | -- |
| Border-radius | 6px | -- |
| Background (P1) | `rgba(239, 68, 68, 0.06)` | Faint red tint |
| Background (P2) | `rgba(249, 115, 22, 0.04)` | Faint orange tint |
| Border (P1) | `1px solid rgba(239, 68, 68, 0.15)` | -- |
| Border (P2) | `1px solid rgba(249, 115, 22, 0.10)` | -- |
| Font family | `var(--font-mono)` | -- |
| Scroll-snap-align | `start` | Per `scroll-snap-type: x mandatory` on parent |
| Touch target | Meets 44px via strip height padding (28px pill + 8px top + 8px bottom = 44px) | `--touch-target-min` |
| Press feedback | `transform: scale(0.97)` for `var(--duration-card-press)` (100ms) | WS-A.3 token |

**Priority badge:** Text "P1" or "P2". Font size 8px. Weight per `PRIORITY_META` (P1: bold 700, P2: medium 600). Letter-spacing `0.06em`.

**Severity dot:** 5px circle, `SEVERITY_COLORS[item.severity]`.

**Category short code:** `getCategoryMeta(item.category).shortName`. Font size 8px. Color `rgba(255, 255, 255, 0.3)`.

**Title:** Font size 10px. Color `rgba(255, 255, 255, 0.4)`. Truncated with ellipsis. `flex: 1`, `min-width: 0`.

**Props interface:**

```typescript
import type { PriorityFeedItem } from '@/hooks/use-priority-feed'

export interface MobileAlertPillProps {
  /** The priority feed item to display. */
  item: PriorityFeedItem
  /** Called when the pill is tapped. */
  onTap: (item: PriorityFeedItem) => void
}
```

---

### D-8: `MobileDataStaleBanner` component (`src/components/mobile/MobileDataStaleBanner.tsx`)

Persistent banner rendered below MobileHeader when data is stale or the device is offline.

**Structure:**

```
<AnimatePresence>
  {staleness.isVisible && (
    <motion.div class="mobile-stale-banner" role="alert" ...enter/exit>
      {staleness.state === 'offline' ? <WifiOff size={12} /> : <AlertTriangle size={12} />}
      <span>{staleness.label}</span>
    </motion.div>
  )}
</AnimatePresence>
```

**Visual specification:**

| Property | Value | Token Reference |
|----------|-------|----------------|
| Height | 28px | Compact warning strip |
| Position | Rendered at top of Situation tab content, before MobileThreatBanner | -- |
| Background | `var(--color-data-stale-bg)` = `rgba(234, 179, 8, 0.15)` | WS-A.3 token |
| Border | `1px solid rgba(234, 179, 8, 0.25)` | -- |
| Border radius | 8px | -- |
| Margin | `0 var(--space-content-padding)` (12px horizontal), bottom `var(--space-inline-gap)` (8px) | -- |
| Padding | `0 12px` | -- |
| Display | `flex`, `align-items: center`, `justify-content: center`, `gap: 8px` | -- |
| Font family | `var(--font-mono)` | -- |
| Font size | `var(--text-caption)` (10px) | -- |
| Font weight | 700 | -- |
| Letter spacing | `0.14em` | `--tracking-label-mobile` |
| Text transform | `uppercase` | -- |
| Icon + text color | `rgba(234, 179, 8, 0.8)` | Amber warning |

**Enter/exit animation:** `opacity: 0` to `opacity: 1`. Duration 200ms. Reduced motion: instant.

**Props interface:**

```typescript
import type { StalenessState } from '@/hooks/use-data-staleness'

export interface MobileDataStaleBannerProps {
  /** Current staleness state. */
  state: StalenessState
  /** Display label ("DATA STALE" | "OFFLINE"). */
  label: string | null
  /** Whether the banner should be visible. */
  isVisible: boolean
}
```

---

### D-9: `MobileSituationTab` orchestrator (`src/components/mobile/MobileSituationTab.tsx`)

Intermediate component that wires all WS-B.1 deliverables together and is passed as `situationContent` to `MobileShell`. This component handles data fetching at the tab level and distributes data to child components.

**Structure:**

```
<div class="mobile-situation-tab">
  <MobileStateView query={threatQuery} skeletonComponent={<ThreatBannerSkeleton />}>
    {/* Rendered when data is available */}
  </MobileStateView>
  <MobileDataStaleBanner {...staleness} />
  <MobileThreatBanner ... />
  <MobileP1Banner ... />
  <MobilePriorityStrip ... />
  {/* WS-B.2 inserts category grid here */}
  {children}
</div>
```

**Data wiring:**

```typescript
export interface MobileSituationTabProps {
  /** Callback to switch the active tab in MobileShell. */
  onSwitchTab: (tab: MobileTab) => void
  /** Callback when an alert is tapped (opens detail sheet in WS-C.1/WS-D.2). */
  onTapAlert: (item: PriorityFeedItem) => void
  /** Additional content rendered below the priority strip (WS-B.2 category grid). */
  children?: React.ReactNode
}

// Inside the component:
const threatQuery = useThreatPicture()
const priorityQuery = usePriorityFeed()

const posture = useMemo(
  () => derivePosture(
    threatQuery.data?.bySeverity ?? [],
    threatQuery.data?.totalActiveAlerts ?? 0,
  ),
  [threatQuery.data],
)

const staleness = useDataStaleness({
  queries: [threatQuery, priorityQuery],
})
```

**Layout CSS:**

```css
.mobile-situation-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);   /* 16px between major sections */
  padding-top: var(--space-section-gap);
  padding-bottom: var(--space-section-gap);
}
```

---

### D-10: CSS file (`src/styles/mobile-threat.css`)

Dedicated CSS file for WS-B.1 components. Imported by `MobileSituationTab.tsx`.

**Contents:**

```css
/* WS-B.1: Threat Banner + Priority -- mobile-only component styles.
   Scoped inside @media (max-width: 767px) to prevent desktop bleed. */

/* ============================================================
   KEYFRAMES (global, gated by class usage)
   ============================================================ */

@keyframes p1-banner-pulse {
  0%, 100% { opacity: 0.7; }
  50%      { opacity: 0.3; }
}

@keyframes threat-indicator-pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.4; }
}

@keyframes pill-shimmer {
  0%   { background-position: -120px 0; }
  100% { background-position: 120px 0; }
}

/* ============================================================
   MOBILE SCOPED STYLES
   ============================================================ */

@media (max-width: 767px) {
  /* Priority strip scroll container */
  .priority-strip-scroll {
    display: flex;
    align-items: center;
    gap: var(--space-inline-gap, 8px);
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 var(--space-content-padding, 12px);
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .priority-strip-scroll::-webkit-scrollbar {
    display: none;
  }

  /* Alert pill scroll snap */
  .mobile-alert-pill {
    scroll-snap-align: start;
    flex-shrink: 0;
  }

  /* P1 banner left indicator pulse */
  .p1-banner-indicator {
    width: 3px;
    align-self: stretch;
    border-radius: 12px 0 0 12px;
    background: rgba(239, 68, 68, 0.7);
    animation: p1-banner-pulse 2.5s ease-in-out infinite;
  }

  /* Threat indicator pulse for CRITICAL/HIGH */
  .mobile-threat-indicator[data-posture="CRITICAL"] .threat-indicator-dot,
  .mobile-threat-indicator[data-posture="HIGH"] .threat-indicator-dot {
    animation: threat-indicator-pulse 2s ease-in-out infinite;
  }

  /* Shimmer placeholder pill */
  .pill-shimmer {
    background: linear-gradient(
      90deg,
      rgba(var(--ambient-ink-rgb), 0.04) 25%,
      rgba(var(--ambient-ink-rgb), 0.08) 50%,
      rgba(var(--ambient-ink-rgb), 0.04) 75%
    );
    background-size: 120px 100%;
    animation: pill-shimmer 1.5s infinite;
    border-radius: 6px;
  }

  /* Priority strip sticky positioning */
  .mobile-priority-strip {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--glass-card-bg, rgba(255, 255, 255, 0.03));
    backdrop-filter: var(--glass-card-blur, blur(8px) saturate(120%));
    -webkit-backdrop-filter: var(--glass-card-blur, blur(8px) saturate(120%));
    border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
  }
}

/* ============================================================
   REDUCED MOTION
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  .p1-banner-indicator,
  .threat-indicator-dot,
  .pill-shimmer {
    animation: none !important;
  }
}
```

---

### D-11: MobileHeader integration update

Update the `MobileView.tsx` (or wherever MobileShell is rendered) to pass `MobileThreatIndicator` into MobileShell's `threatIndicator` slot:

```typescript
import { MobileThreatIndicator } from '@/components/mobile/MobileThreatIndicator'
import { MobileSituationTab } from '@/components/mobile/MobileSituationTab'

// Inside MobileView:
const { data: threatPicture } = useThreatPicture()
const posture = useMemo(
  () => derivePosture(
    threatPicture?.bySeverity ?? [],
    threatPicture?.totalActiveAlerts ?? 0,
  ),
  [threatPicture],
)

<MobileShell
  threatIndicator={<MobileThreatIndicator posture={posture} />}
  situationContent={
    <MobileSituationTab
      onSwitchTab={handleTabChange}
      onTapAlert={handleTapAlert}
    />
  }
/>
```

Note: `handleTapAlert` is a placeholder callback in this workstream. WS-C.1 (Bottom Sheet Core) and WS-D.2 (Alert Detail) will wire it to open the alert detail bottom sheet. For WS-B.1, the callback is typed but performs no action beyond logging to console in development.

---

### D-12: `ThreatPictureCard.tsx` refactor (desktop)

Update the existing `ThreatPictureCard.tsx` to import `derivePosture`, `ThreatLevel`, and `POSTURE_CONFIG` from `src/lib/threat-utils.ts`. Remove the local definitions (lines 52-60 `POSTURE_CONFIG`, lines 139-148 posture derivation logic). No visual or behavioral changes to the desktop component.

**Changed lines:**
- Remove local `ThreatLevel` type (line 52)
- Remove local `POSTURE_CONFIG` (lines 54-60)
- Remove inline `useMemo` posture derivation (lines 139-148)
- Add import: `import { derivePosture, POSTURE_CONFIG, type ThreatLevel } from '@/lib/threat-utils'`
- Replace posture memo: `const posture = useMemo(() => derivePosture(tp?.bySeverity ?? [], tp?.totalActiveAlerts ?? 0), [tp])`

---

### D-13: Unit tests

**`src/lib/__tests__/threat-utils.test.ts`:**

| Test | Description |
|------|-------------|
| `derivePosture returns LOW when no alerts` | Input: empty `bySeverity`, `totalActiveAlerts: 0`. Assert: `'LOW'`. |
| `derivePosture returns MODERATE with alerts but no severe/extreme` | Input: `totalActiveAlerts: 15`, no Extreme/Severe in bySeverity. Assert: `'MODERATE'`. |
| `derivePosture returns ELEVATED with severe < 50` | Input: `Severe: 10`. Assert: `'ELEVATED'`. |
| `derivePosture returns HIGH with extreme > 0` | Input: `Extreme: 3`. Assert: `'HIGH'`. |
| `derivePosture returns HIGH with severe >= 50` | Input: `Severe: 50`. Assert: `'HIGH'`. |
| `derivePosture returns CRITICAL with extreme >= 10` | Input: `Extreme: 10`. Assert: `'CRITICAL'`. |

**`src/hooks/__tests__/use-data-staleness.test.ts`:**

| Test | Description |
|------|-------------|
| `returns fresh when all queries updated recently` | Mock queries with `dataUpdatedAt` = now. Assert: `state: 'fresh'`, `isVisible: false`. |
| `returns stale when oldest query exceeds threshold` | Mock query with `dataUpdatedAt` = 4 minutes ago. Assert: `state: 'stale'`, `label: 'DATA STALE'`. |
| `returns offline when navigator.onLine is false` | Mock `navigator.onLine = false`. Assert: `state: 'offline'`, `label: 'OFFLINE'`. |
| `offline takes precedence over stale` | Mock offline + stale query. Assert: `state: 'offline'`. |

**`src/components/mobile/__tests__/MobileP1Banner.test.tsx`:**

| Test | Description |
|------|-------------|
| `does not render when mostRecentP1 is null` | Pass `mostRecentP1: null`. Assert: no banner in DOM. |
| `renders banner when mostRecentP1 exists` | Pass a P1 item. Assert: banner visible with title text. |
| `hides banner after tap and fires onTapP1` | Tap banner. Assert: `onTapP1` called with item, banner hides. |
| `reappears when new P1 arrives after acknowledgment` | Acknowledge item A. Update prop to item B (different id). Assert: banner reappears. |

**`src/components/mobile/__tests__/MobilePriorityStrip.test.tsx`:**

| Test | Description |
|------|-------------|
| `renders empty state when items array is empty` | Pass `items: []`. Assert: "NO PRIORITY ALERTS" text visible. |
| `renders shimmer placeholders when loading` | Pass `isLoading: true, items: []`. Assert: 3 shimmer elements visible. |
| `renders pills sorted P1-first, then by recency` | Pass mixed P1/P2 items. Assert: first pill is P1, ordered by newest `ingestedAt`. |
| `calls onTapAlert when pill is tapped` | Tap first pill. Assert: `onTapAlert` called with correct item. |

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `MobileThreatBanner` renders at 56px height with correct posture-level badge coloring (CRITICAL=deep red, HIGH=red, ELEVATED=orange, MODERATE=amber, LOW=green). | Visual inspection at 375x812 (iPhone 14 responsive mode). Compare badge colors against `POSTURE_CONFIG` values. |
| AC-2 | Active alert count displays as large metric (`var(--text-card-metric)`, 22px) with tabular nums and trend direction icon. | Visual inspection. Verify font-variant-numeric and icon direction matches `useThreatPicture().overallTrend`. |
| AC-3 | Tapping P1 count in MobileThreatBanner calls `onSwitchTab('intel')`. | Tap P1 count. Verify tab switches to Intel (checked by inspecting `MobileShell` active tab). |
| AC-4 | Tapping P2 count in MobileThreatBanner calls `onSwitchTab('intel')`. | Tap P2 count. Verify tab switches to Intel. |
| AC-5 | `MobileP1Banner` renders only when `p1Count > 0`. When P1 count is 0, no banner element is in the DOM. | With zero P1 alerts: inspect DOM, confirm no `.mobile-p1-banner` element. Add a P1 alert: confirm banner appears. |
| AC-6 | `MobileP1Banner` shows most recent P1 alert's headline, category short name, severity dot color, and relative time. | Visual inspection. Cross-reference displayed text with `usePriorityFeed().mostRecentP1` properties. |
| AC-7 | `MobileP1Banner` persists after scroll. Does not auto-dismiss. Only hides when tapped or when a new P1 alert supersedes the displayed one. | Scroll the Situation tab. Verify banner remains visible. Wait 60 seconds without tapping. Verify banner still visible. Tap banner: verify it hides. |
| AC-8 | After tapping P1 banner (acknowledging), if a new P1 alert arrives with a different `id`, the banner reappears. | Tap to dismiss. Trigger a new P1 alert (via API or TanStack Query invalidation). Verify banner reappears with new headline. |
| AC-9 | `MobileThreatIndicator` renders in MobileHeader's `threatIndicator` slot as an 8px colored dot matching the current posture level. | Visual inspection of header. Verify dot color matches `POSTURE_CONFIG[posture].color`. |
| AC-10 | `MobileThreatIndicator` pulses when posture is CRITICAL or HIGH. No pulse for ELEVATED, MODERATE, LOW. | Set posture to CRITICAL (via threat data): verify animation. Set to MODERATE: verify static dot. |
| AC-11 | `MobilePriorityStrip` renders at 44px height with horizontal scroll and scroll-snap behavior. | Swipe horizontally on the strip. Verify pills snap to alignment. Inspect `scroll-snap-type: x mandatory` on scroll container. |
| AC-12 | `MobilePriorityStrip` shows "NO PRIORITY ALERTS" when `items` array is empty. | With zero P1/P2 alerts: verify centered empty-state text. |
| AC-13 | `MobilePriorityStrip` items are sorted: P1 before P2, then by `ingestedAt` descending within each group. | With mixed P1/P2 data: verify visual order matches sort spec. |
| AC-14 | `MobileAlertPill` displays priority badge, severity dot, category short code, and truncated title. | Visual inspection of individual pills. Verify all four elements present. |
| AC-15 | `MobileAlertPill` calls `onTapAlert` when tapped. | Tap a pill. Verify callback fires with correct `PriorityFeedItem`. |
| AC-16 | `MobileDataStaleBanner` appears when `dataUpdatedAt` exceeds 3 minutes for any monitored query. Shows "DATA STALE" in amber. | Disconnect TarvaRI backend (stop API server). Wait > 3 minutes. Verify banner appears. |
| AC-17 | `MobileDataStaleBanner` appears immediately when device goes offline. Shows "OFFLINE". | Toggle airplane mode in device/simulator. Verify banner appears with "OFFLINE" text. |
| AC-18 | `MobileDataStaleBanner` disappears when data is refreshed (query succeeds) or device comes back online. | Reconnect backend / disable airplane mode. Verify banner hides. |
| AC-19 | Loading state: `MobileThreatBanner` shows "---" posture badge and "--" counts during initial load. `MobilePriorityStrip` shows 3 shimmer placeholders. | Clear TanStack Query cache and reload. Verify skeleton states render before data arrives. |
| AC-20 | Error state: `MobileSituationTab` renders `MobileStateView` error card with retry button when `useThreatPicture` fails. | Mock API failure. Verify error card with message and retry button. Tap retry: verify `refetch()` is called. |
| AC-21 | Empty state: `MobileThreatBanner` shows LOW posture with 0 active, 0 P1, 0 P2 when API returns empty data. | Mock empty response. Verify LOW posture badge, all counts at 0. |
| AC-22 | All interactive elements (P1/P2 count buttons, P1 banner, alert pills) meet `var(--touch-target-min)` (44px) minimum touch target. | Chrome DevTools: inspect computed `min-height` or total tappable area on each interactive element. |
| AC-23 | All pulse animations (`p1-banner-pulse`, `threat-indicator-pulse`) are disabled when `prefers-reduced-motion: reduce` is active. | Enable reduced motion in OS settings. Verify no animations. |
| AC-24 | `pnpm typecheck` passes with zero errors after all deliverables are complete. | Run `pnpm typecheck`. |
| AC-25 | Desktop view is completely unaffected. `ThreatPictureCard` renders identically after refactoring to use shared `derivePosture`. | Visual comparison of desktop page at 1920x1080 before and after changes. |
| AC-26 | `MobileSituationTab` renders all components in correct vertical order: DataStaleBanner (conditional) -> ThreatBanner -> P1Banner (conditional) -> PriorityStrip -> children (WS-B.2 grid). | Visual inspection of component order in Situation tab. |
| AC-27 | Unit tests for `derivePosture`, `useDataStaleness`, `MobileP1Banner`, and `MobilePriorityStrip` all pass. | Run `pnpm test:unit`. |
| AC-28 | CSS animations are scoped inside `@media (max-width: 767px)` or gated by mobile-only CSS classes. Desktop styles are not affected. | Grep `mobile-threat.css` for unguarded `:root` or global class definitions. Only `@keyframes` should be outside the media query. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Extract `derivePosture` and `POSTURE_CONFIG` into a shared `src/lib/threat-utils.ts` module rather than duplicating in mobile components. | The posture derivation logic (5 rules based on severity distribution) is identical between desktop `ThreatPictureCard` and mobile `MobileThreatBanner` + `MobileThreatIndicator`. A single source of truth prevents drift. The refactor of `ThreatPictureCard.tsx` is mechanical (import swap, no behavioral change). | (a) Duplicate logic in each mobile component. Rejected: maintenance burden, drift risk. (b) Import directly from `ThreatPictureCard.tsx`. Rejected: creates a dependency from mobile to a desktop component, breaking the code-splitting boundary. |
| DM-2 | P1 banner acknowledgment uses local `useState` in `MobileP1Banner` rather than Zustand or sessionStorage. | The acknowledgment is intentionally ephemeral: on page reload, any active P1 alert should display again. This is correct for a safety-critical indicator where the operator should re-confirm awareness after a session restart. Local state is the simplest implementation that achieves this behavior. The state is contained within a single component, so Zustand's cross-component sharing is unnecessary. | (a) Zustand store with `acknowledgedP1Ids: Set<string>`. Rejected: over-engineered for single-component state, and would persist across tab switches (P1 banner is Situation-tab-only). (b) sessionStorage persistence. Rejected: safety concern -- reloading the page should re-show critical alerts. |
| DM-3 | `MobileSituationTab` orchestrator calls `useThreatPicture()` and `usePriorityFeed()` at the tab level, then passes data as props to child components, rather than each child calling hooks independently. | Prevents duplicate TanStack Query subscriptions. Both hooks are already deduplicated by query key, but passing props makes the data flow explicit and testable. The orchestrator also centralizes the `useDataStaleness` check that spans both queries. Child components become pure presentation components, simplifying unit testing. | Each child component calls its own hook. Rejected: harder to test (requires TanStack Query test harness for every component), and the `useDataStaleness` hook needs access to both query results in one place. |
| DM-4 | `MobileDataStaleBanner` uses a custom `useDataStaleness` hook with a 15-second check interval rather than relying on TanStack Query's `isStale` property. | TanStack Query's `isStale` only reflects whether the cache entry is past its `staleTime`, not whether a refetch has actually succeeded. A query can be "stale" but still showing recent data if the refetch just hasn't triggered yet. The `dataUpdatedAt` timestamp provides the actual last-successful-fetch time, which is what operators need for data reliability assessment. The 3-minute threshold (from protective-ops-review C1) is independent of any individual query's `staleTime`. | (a) Use `query.isStale`. Rejected: `isStale` means "eligible for refetch", not "data is old". A 90s staleTime query becomes "stale" at 91s even if data was just fetched. (b) Check `dataUpdatedAt` inline in each component. Rejected: duplicates the staleness check across 5+ components; the `useDataStaleness` hook centralizes it. |
| DM-5 | `MobileAlertPill` is extracted as a separate exported component rather than being inlined in `MobilePriorityStrip`. | The pill pattern is explicitly called out as reusable by WS-D.2 (MobileAlertCard) and WS-E.1 (Intel tab priority section). Exporting it as a standalone component with its own props interface enables clean reuse without duplicating the pill rendering logic. | Inline rendering within `MobilePriorityStrip` with no separate component. Rejected: forces WS-D.2 and WS-E.1 to reimplement the pill visual, causing drift. |
| DM-6 | The priority strip uses CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: start` on each pill, rather than a JS-based carousel library. | Native scroll-snap is performant, requires zero JavaScript, works with inertia scrolling on iOS/Android, and matches the spec requirement. No library dependency is added. The mandatory snap type ensures pills always settle at a defined alignment point. | (a) Embla Carousel or Swiper.js. Rejected: adds a dependency, increases bundle size, and native scroll-snap already meets the spec. (b) `scroll-snap-type: x proximity`. Rejected: proximity allows pills to settle between snap points, creating an unpolished feel. |
| DM-7 | The staleness banner renders at the top of `MobileSituationTab` content rather than as a fixed overlay below the header. | Rendering inline within the scroll area keeps it contextual to the data it describes. If the user scrolls down, the staleness banner scrolls away -- this is acceptable because the `MobileThreatIndicator` in the header provides persistent posture awareness. A fixed overlay would consume 28px of always-visible screen real estate on mobile, which is costly. | (a) Fixed overlay at z-35, below header. Rejected: 28px of fixed vertical space is expensive on 568px content area. The indicator dot in the header serves as persistent fallback. (b) Toast/snackbar. Rejected: staleness is persistent, not transient. A toast would auto-dismiss, violating the "persistent" requirement from protective-ops-review C1. |
| DM-8 | The threat banner P1/P2 count buttons switch directly to the Intel tab via `onSwitchTab('intel')` rather than opening a bottom sheet. | The spec states "Tap P1/P2 count -> switch to Intel tab" (from information-architecture Section 8.1). The Intel tab (WS-E.1) will have a dedicated priority section at the top. This maintains the tab-based navigation model rather than introducing a competing panel pattern within the Situation tab. | Open a priority feed bottom sheet within the Situation tab. Rejected: this is the desktop pattern (PriorityFeedPanel). The mobile architecture uses tabs for top-level navigation and bottom sheets for detail views. Cross-tab navigation (Situation -> Intel) is the intended mobile flow. |
| DM-9 | CSS is in a dedicated `mobile-threat.css` file rather than being added to `mobile-tokens.css` or individual component inline styles. | Follows the codebase pattern of separating token definitions (in `mobile-tokens.css`) from component styles (in feature-specific CSS files like `morph.css`, `coverage.css`, `enrichment.css`). The token file defines values; this CSS file defines how components use them. Inline styles cannot express `@keyframes`, media queries, or `::-webkit-scrollbar` pseudo-elements. | (a) Add all styles to `mobile-tokens.css`. Rejected: conflates tokens (values) with component styles (usage). (b) Inline styles for everything. Rejected: cannot express keyframes, media queries, scrollbar hiding, or `data-posture` attribute selectors inline. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should tapping the P1 banner open an alert detail bottom sheet directly (WS-D.2), or should it navigate to the Intel tab filtered to P1 alerts? The spec says "Tap -> alert detail bottom sheet" (protective-ops-review C2). This WS types the callback as `onTapP1(item: PriorityFeedItem)` and defers the handler implementation to WS-D.2. Confirm this is the intended flow. | planning-coordinator | Phase B review gate |
| OQ-2 | The `MobilePriorityStrip` is specified as sticky (`position: sticky, top: 0`). When the user scrolls the Situation tab, should the strip stick below the header (at `top: 48px` to account for the fixed header) or at `top: 0` within the scrollable content area? Since `.mobile-content` has `padding-top: 48px`, the scroll container starts below the header, so `top: 0` within it is correct. Confirm this assumption. | world-class-ui-designer | Phase B review gate |
| OQ-3 | The `MobileDataStaleBanner` currently monitors only `useThreatPicture` and `usePriorityFeed`. Should it also monitor `useCoverageMetrics` (60s refetch) and `useCoverageMapData` (30s refetch) for a more comprehensive staleness picture? Adding more queries lowers the threshold effectively since any stale query triggers the banner. | planning-coordinator | Phase B |
| OQ-4 | Should the `MobileThreatIndicator` dot in the header show a different visual state when data is stale (e.g., blinking amber instead of posture color), effectively doubling as a staleness indicator? The spec separates these (threat indicator vs. staleness banner), but combining them could save screen space. | world-class-ux-designer | Phase F (polish) |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `useThreatPicture` returns 404 or timeout because the `/console/threat-picture` endpoint is unavailable in some TarvaRI deployments. The entire Situation tab threat section would fail. | Medium | High -- blank Situation tab top | `MobileSituationTab` uses `MobileStateView` (AD-7) to catch query errors and show a retry card. `MobileThreatBanner` gracefully handles `null` data by showing LOW posture with zero counts. The threat indicator dot shows neutral gray during loading/error. |
| R-2 | P1 banner acknowledgment state is lost on React hot-reload during development, causing the banner to reappear unexpectedly. | High (dev only) | Very Low | This is the intended behavior (ephemeral state). Document this in the component JSDoc. No production impact. |
| R-3 | `scroll-snap-type: x mandatory` causes janky behavior on older Android WebView (pre-Chromium 91). | Low | Low | Graceful degradation: without scroll-snap, the strip scrolls freely. Pills remain visible and tappable. The visual polish of snapping is lost but functionality is preserved. |
| R-4 | The 3-minute staleness threshold triggers frequently on slow networks where API responses take > 3 minutes to return, causing a "DATA STALE" banner to flash between successful fetches. | Low | Medium -- distracting banner flicker | The `useDataStaleness` hook checks `dataUpdatedAt`, which is set on successful fetch completion. If fetches succeed (even slowly), the timestamp resets. The banner only appears if no successful fetch has occurred in 3 minutes. On very slow networks, TanStack Query's retry logic will attempt multiple fetches before the 3-minute window expires. |
| R-5 | Extracting `derivePosture` into `threat-utils.ts` and refactoring `ThreatPictureCard.tsx` introduces a regression in the desktop posture calculation. | Very Low | High -- incorrect desktop posture | The refactor is a mechanical extraction (copy function, add import, remove local copy). Unit tests for `derivePosture` (D-13) verify all 6 posture derivation rules. AC-25 requires visual verification that the desktop `ThreatPictureCard` renders identically before and after. |
| R-6 | WS-A.2 delays delivery of the `situationContent` slot, blocking integration of `MobileSituationTab`. | Medium | Medium | Begin development with a temporary test harness: create a `/test-b1` route that renders `MobileSituationTab` directly within a minimal shell wrapper. Remove the test route when WS-A.2 delivers. All components can be developed and tested independently of the shell. |
| R-7 | The `MobileAlertPill` max-width of 220px causes excessive truncation of long alert titles, making pills uninformative. | Medium | Low -- cosmetic | The pill is a summary indicator, not the primary reading surface. Tapping the pill opens the full alert detail (WS-D.2). The truncated title serves as a recognition cue, not the complete information. If user testing reveals this is a problem, the max-width can be increased to 260px or removed entirely. |
| R-8 | The `MobileThreatIndicator` 8px dot is too small to convey posture level effectively, especially on high-DPI screens where 8px is physically tiny. | Medium | Low -- reduced awareness | The dot is supplementary to the MobileThreatBanner (which is the primary posture indicator). The glow shadow around the dot adds visual size (total perceived diameter ~14px with glow). If user testing reveals the dot is ineffective, increase to 10px and consider adding a faint ring around it. |
