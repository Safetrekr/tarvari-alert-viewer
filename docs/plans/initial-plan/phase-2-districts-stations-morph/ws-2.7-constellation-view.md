# WS-2.7: Constellation View (Z0)

> **Workstream ID:** WS-2.7
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-1.1 (ZUI engine, semantic zoom), WS-1.5 (telemetry data)
> **Blocks:** None
> **Resolves:** None

---

## 1. Objective

Deliver the Constellation View -- the Z0 representation of the Launch that activates when the user zooms far out (zoom < 0.27 per AD-2). Districts collapse from full capsules into luminous beacons: small colored dots with status-driven glow, compact two-letter district codes, and three global metrics that aggregate telemetry across all apps. The purpose is "find where attention is needed fast" -- a glanceable system health overview that a user can read in under two seconds.

**Success looks like:** When the user zooms out past the Z0 threshold, capsules smoothly transition to beacons. Each beacon's color and glow intensity communicates the district's health state without needing to read text. Three global metrics (Alert Count, Active Work, System Pulse) provide aggregate system posture. Zooming back in past the hysteresis exit threshold (zoom >= 0.30) restores the Z1 capsule representation. The entire view renders with zero layout shift and no perceptible delay.

---

## 2. Scope

### In Scope

- **ConstellationView** container component that renders when `useSemanticZoom()` returns `'Z0'`
- **DistrictBeacon** component (40x40px luminous dot with status color, glow, and 9px label)
- **GlobalMetrics** bar displaying 3 aggregated metrics: Alert Count, Active Work, System Pulse
- Beacon layout mirroring the capsule ring positions (same world-space coordinates, same 300px radius ring)
- Status-driven beacon coloring using VISUAL-DESIGN-SPEC.md status color tokens
- Glow intensity mapping: OPERATIONAL = pulsing glow, DEGRADED = steady amber, DOWN = flashing red, OFFLINE/UNKNOWN = no glow, dim
- Compact district codes rendered below each beacon (AB, CH, PR, CO, ER, CD)
- Aggregation logic for the three global metrics derived from the districts store (`SystemSnapshot`)
- `AnimatePresence` crossfade between Z1 (capsules) and Z0 (beacons) during semantic zoom transitions
- CSS `@keyframes` for beacon pulse animation (Ambient tier)
- `prefers-reduced-motion` compliance on all beacon animations
- TypeScript types for beacon data, global metrics, and district codes

### Out of Scope

- Capsule components or Z1 rendering (WS-1.2)
- Morph choreography or Z2/Z3 transitions (WS-2.1)
- Telemetry data fetching or store implementation (WS-1.5 -- consumed, not created)
- Navigation instruments (minimap, breadcrumb, zoom indicator -- WS-1.4)
- Ambient effects (particles, film grain -- WS-1.6)
- Camera store or semantic zoom logic (WS-1.1 -- consumed via `useSemanticZoom()`)
- Click-to-navigate from beacon to district (future enhancement; beacons are informational at Z0)

---

## 3. Input Dependencies

| Dependency         | Source      | What It Provides                                                                                                                                | Blocking?                      |
| ------------------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| Semantic zoom hook | WS-1.1      | `useSemanticZoom()` returning `SemanticZoomLevel` (`'Z0'`, `'Z1'`, `'Z2'`, `'Z3'`) with hysteresis                                              | Yes                            |
| Camera store       | WS-1.1      | `useCameraStore()` with `zoom`, `isPanning` state for panning optimization                                                                      | Yes                            |
| Districts store    | WS-1.5      | `useDistrictsStore()` with `Record<string, AppTelemetry>` per-app telemetry and `SystemSnapshot.summary` counts                                 | Yes                            |
| Design tokens      | WS-0.2      | Status color tokens (`--color-healthy`, `--color-warning`, `--color-error`, `--color-offline`), glow tokens, `--duration-ambient-*`, `--ease-*` | Soft -- can hardcode initially |
| Spatial constants  | WS-1.1      | `DISTRICTS` array with `ringIndex` and world-space positions, `RING_RADIUS` (300px)                                                             | Yes                            |
| @tarva/ui          | npm package | `Badge` component (for alert count badge styling)                                                                                               | Available                      |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  components/
    districts/
      constellation-view.tsx     # Z0 container: beacons + global metrics
      district-beacon.tsx        # Individual beacon dot with glow + label
      global-metrics.tsx         # 3 aggregate metrics bar
      index.ts                   # Updated barrel export (add new components)
    districts/
      __tests__/
        constellation-view.test.tsx
        district-beacon.test.tsx
        global-metrics.test.tsx
  styles/
    constellation.css            # @keyframes for beacon pulse (Ambient tier)
  types/
    district.ts                  # Extended with BeaconData, GlobalMetrics, DistrictCode
```

### 4.2 Type Definitions

**File:** `src/types/district.ts` (additions to existing types from WS-1.2)

```ts
/** Two-letter compact codes for Z0 beacon labels */
export type DistrictCode = 'AB' | 'CH' | 'PR' | 'CO' | 'ER' | 'CD'

/** Maps DistrictId to its compact code for Z0 display */
export const DISTRICT_CODES: Record<DistrictId, DistrictCode> = {
  'agent-builder': 'AB',
  'tarva-chat': 'CH',
  'project-room': 'PR',
  'tarva-core': 'CO',
  'tarva-erp': 'ER',
  'tarva-code': 'CD',
}

/** Data shape for a single beacon at Z0 */
export interface BeaconData {
  /** District identifier */
  id: DistrictId
  /** Compact two-letter code */
  code: DistrictCode
  /** Current health state (drives color + glow) */
  health: HealthState
  /** Number of active alerts for this district */
  alerts: number
  /** Ring position index (0-5, same as capsule positions) */
  ringIndex: number
}

/** Three aggregate metrics displayed at Z0 */
export interface ConstellationMetrics {
  /** Total alert count across all districts */
  alertCount: number
  /** Total active work items (sum of pulse counts) */
  activeWork: number
  /** Worst health state across all districts (worst-of-five) */
  systemPulse: HealthState
}
```

### 4.3 Component: ConstellationView

**File:** `src/components/districts/constellation-view.tsx`

```tsx
'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { DistrictBeacon } from './district-beacon'
import { GlobalMetrics } from './global-metrics'
import { useDistrictsStore } from '@/stores/districts.store'
import {
  DISTRICTS,
  DISTRICT_CODES,
  type BeaconData,
  type ConstellationMetrics,
  type HealthState,
} from '@/types/district'

export interface ConstellationViewProps {
  /** Whether the ZUI viewport is actively panning (disables glow effects) */
  isPanning?: boolean
}
```

**Aggregation logic:**

The component derives `BeaconData[]` and `ConstellationMetrics` from the districts store on each render. The three global metrics are computed as follows:

```ts
/** Health state severity for worst-of comparison */
const HEALTH_SEVERITY: Record<HealthState, number> = {
  OPERATIONAL: 0,
  DEGRADED: 1,
  DOWN: 2,
  OFFLINE: -1, // Excluded from "worst-of" — intentionally absent
  UNKNOWN: -1, // Excluded from "worst-of" — no data to judge
}

function computeMetrics(apps: Record<string, AppTelemetry>): ConstellationMetrics {
  let alertCount = 0
  let activeWork = 0
  let worstSeverity = 0
  let worstHealth: HealthState = 'OPERATIONAL'

  for (const app of Object.values(apps)) {
    alertCount += app.alertCount

    // Parse numeric prefix from pulse string (e.g., "3 runs active" → 3)
    const pulseMatch = app.pulse?.match(/^(\d+)/)
    if (pulseMatch) {
      activeWork += parseInt(pulseMatch[1], 10)
    }

    // Worst-of-five: only consider apps that are online
    const severity = HEALTH_SEVERITY[app.status]
    if (severity > worstSeverity) {
      worstSeverity = severity
      worstHealth = app.status
    }
  }

  return { alertCount, activeWork, systemPulse: worstHealth }
}
```

**Layout:** The constellation view occupies the same world-space container as the capsule ring. Beacons are positioned at the same trigonometric coordinates as capsules (same ring radius, same angles), so the spatial transition between Z1 and Z0 feels like the capsules are collapsing in place.

**Transition:** Uses `AnimatePresence` with `mode="wait"` in the parent (page-level or `DistrictNode` container) to crossfade between the capsule ring (Z1) and constellation view (Z0). The constellation fades in with opacity 0 -> 1 over 300ms.

```tsx
<motion.div
  key="constellation"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
  className="relative"
  data-panning={isPanning || undefined}
>
  {/* Beacons in ring layout */}
  {beacons.map((beacon) => (
    <DistrictBeacon
      key={beacon.id}
      data={beacon}
      style={computeBeaconPosition(beacon.ringIndex)}
      isPanning={isPanning}
    />
  ))}

  {/* Global metrics bar, centered below the ring */}
  <GlobalMetrics metrics={metrics} />
</motion.div>
```

### 4.4 Component: DistrictBeacon

**File:** `src/components/districts/district-beacon.tsx`

```tsx
'use client'

import type { BeaconData } from '@/types/district'
import { HEALTH_STATE_MAP } from '@/types/district'

export interface DistrictBeaconProps {
  /** Beacon data (id, code, health, alerts, ringIndex) */
  data: BeaconData
  /** Absolute position computed from ring layout */
  style: { left: number; top: number }
  /** Whether the parent canvas is panning (disable glow effects) */
  isPanning?: boolean
}
```

**Rendering:** Each beacon is a 40x40px container centered at the computed ring position. The beacon dot is a 12px circle with status-colored background and a multi-layer `box-shadow` glow. The district code label sits 4px below the dot.

**Beacon dimensions** (per VISUAL-DESIGN-SPEC.md Section 2.1, Z0 row):

- Container: 40 x 40px (includes label space)
- Dot: 12px diameter circle
- Label: 9px Geist Sans, weight 600, tracking 0.12em, uppercase, opacity 0.7

**DOM structure:**

```tsx
<div
  className="absolute flex flex-col items-center gap-1"
  style={{ left: style.left, top: style.top, width: 40, height: 40 }}
  data-district={data.id}
  data-health={data.health}
  aria-label={`${data.code} district -- ${data.health}${data.alerts > 0 ? `, ${data.alerts} alerts` : ''}`}
>
  {/* Beacon dot */}
  <div
    className={cn(
      'h-3 w-3 rounded-full',
      // Pulse animation class for OPERATIONAL and DOWN
      isAnimated && 'beacon-pulse',
      isDown && 'beacon-flash',
      isOffline && 'opacity-40'
    )}
    style={{
      backgroundColor: `var(${HEALTH_STATE_MAP[data.health].color})`,
      boxShadow: glowValue,
    }}
    data-health={data.health}
  />

  {/* District code label */}
  <span
    className={cn(
      'font-sans text-[9px] font-semibold tracking-[0.12em] uppercase',
      'leading-none text-[var(--color-text-primary)] select-none',
      isOffline ? 'opacity-40' : 'opacity-70'
    )}
  >
    {data.code}
  </span>
</div>
```

**Glow values by health state:**

| Health      | Beacon Glow (`box-shadow`)                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| OPERATIONAL | `0 0 8px var(--color-healthy-glow, rgba(74,222,128,0.35)), 0 0 3px var(--color-healthy, rgba(34,197,94,0.50))` |
| DEGRADED    | `0 0 8px var(--color-warning-glow, rgba(250,204,21,0.25)), 0 0 3px var(--color-warning, rgba(234,179,8,0.40))` |
| DOWN        | `0 0 12px var(--color-error-glow, rgba(248,113,113,0.40)), 0 0 4px var(--color-error, rgba(239,68,68,0.55))`   |
| OFFLINE     | none                                                                                                           |
| UNKNOWN     | none                                                                                                           |

**Panning optimization:** When `isPanning` is true, all glow box-shadows reduce to a single layer at 50% opacity for performance.

### 4.5 Component: GlobalMetrics

**File:** `src/components/districts/global-metrics.tsx`

```tsx
'use client'

import type { ConstellationMetrics, HealthState } from '@/types/district'
import { HEALTH_STATE_MAP } from '@/types/district'

export interface GlobalMetricsProps {
  /** Aggregated metrics from ConstellationView */
  metrics: ConstellationMetrics
}
```

**Rendering:** A horizontal bar centered below the beacon ring, displaying three key-value pairs. Designed for glanceability at Z0's zoomed-out scale.

**Layout:** The metrics bar is positioned at the center of the constellation container, offset below the ring. It uses a horizontal flex layout with 24px gaps between metric groups.

**DOM structure:**

```tsx
<div
  className={cn(
    'flex items-center justify-center gap-6',
    'absolute left-1/2 -translate-x-1/2',
    // Position below the beacon ring
    'top-[calc(50%+180px)]'
  )}
  role="status"
  aria-label="System overview"
>
  {/* Alert Count */}
  <MetricItem label="ALERTS" value={metrics.alertCount} isAlert={metrics.alertCount > 0} />

  {/* Separator */}
  <div className="h-4 w-px bg-white/[0.06]" aria-hidden="true" />

  {/* Active Work */}
  <MetricItem label="ACTIVE" value={metrics.activeWork} />

  {/* Separator */}
  <div className="h-4 w-px bg-white/[0.06]" aria-hidden="true" />

  {/* System Pulse */}
  <div className="flex items-center gap-1.5">
    <div
      className="h-2 w-2 rounded-full"
      style={{
        backgroundColor: `var(${HEALTH_STATE_MAP[metrics.systemPulse].color})`,
      }}
    />
    <span
      className={cn(
        'font-sans text-[9px] font-semibold tracking-[0.08em] uppercase',
        'leading-none text-[var(--color-text-secondary)]'
      )}
    >
      {HEALTH_STATE_MAP[metrics.systemPulse].label}
    </span>
  </div>
</div>
```

**MetricItem sub-component** (inline, not exported):

```tsx
function MetricItem({
  label,
  value,
  isAlert = false,
}: {
  label: string
  value: number
  isAlert?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={cn(
          'font-sans text-[8px] font-normal tracking-[0.08em] uppercase',
          'leading-none text-[var(--color-text-tertiary)]'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'font-mono text-[14px] leading-none font-medium tabular-nums',
          isAlert ? 'text-[var(--color-error)]' : 'text-[var(--color-text-primary)]'
        )}
      >
        {value}
      </span>
    </div>
  )
}
```

**Typography:** All text uses counter-scaling if needed at Z0's zoom level. At zoom < 0.27, the canvas is scaled down significantly. Since these components exist within the spatial canvas, their visual size is `specified size * zoom`. A 9px label at zoom 0.20 renders at ~1.8px visually -- too small. However, the beacons are designed as 40x40px luminous dots that remain recognizable at Z0 scales through their glow, not their text. The labels and metrics are supplementary information for users who zoom to the Z0/Z1 boundary (~0.25-0.27) where text becomes marginally readable. No counter-scaling is applied; readability at extreme zoom-out is accepted as reduced per VISUAL-DESIGN-SPEC.md Section 3.2 Z0 note and Risk #8.

### 4.6 Stylesheet: constellation.css

**File:** `src/styles/constellation.css`

```css
/* =============================================================
   CONSTELLATION AMBIENT ANIMATIONS
   Beacon pulse and flash animations for Z0 view.
   All animations are CSS @keyframes (Ambient tier).
   ============================================================= */

/* --- Beacon pulse (OPERATIONAL) --- */
@keyframes beacon-pulse {
  0%,
  100% {
    box-shadow:
      0 0 8px var(--beacon-glow-outer),
      0 0 3px var(--beacon-glow-inner);
  }
  50% {
    box-shadow:
      0 0 14px var(--beacon-glow-outer),
      0 0 6px var(--beacon-glow-inner);
  }
}

.beacon-pulse {
  animation: beacon-pulse 3s ease-in-out infinite;
}

/* --- Beacon flash (DOWN) --- */
@keyframes beacon-flash {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.beacon-flash {
  animation: beacon-flash 1.5s ease-in-out infinite;
}

/* --- Panning optimization: disable animations --- */
[data-panning='true'] .beacon-pulse,
[data-panning='true'] .beacon-flash {
  animation: none;
}

/* --- Reduced motion --- */
@media (prefers-reduced-motion: reduce) {
  .beacon-pulse,
  .beacon-flash {
    animation: none !important;
  }

  .beacon-pulse {
    box-shadow:
      0 0 10px var(--beacon-glow-outer),
      0 0 4px var(--beacon-glow-inner);
  }
}
```

### 4.7 Integration: Z0/Z1 Switching

The parent component (the ZUI page at `src/app/(launch)/page.tsx` or a `DistrictLayer` container) uses `useSemanticZoom()` from WS-1.1 to switch between capsule ring (Z1) and constellation view (Z0):

```tsx
import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { AnimatePresence } from 'motion/react'
import { CapsuleRing } from '@/components/districts/capsule-ring'
import { ConstellationView } from '@/components/districts/constellation-view'

function DistrictLayer({ isPanning }: { isPanning: boolean }) {
  const level = useSemanticZoom()

  return (
    <AnimatePresence mode="wait">
      {level === 'Z0' ? (
        <ConstellationView key="z0" isPanning={isPanning} />
      ) : (
        <CapsuleRing key="z1" /* ...capsule props */ />
      )}
    </AnimatePresence>
  )
}
```

The hysteresis from AD-2 (enter at zoom < 0.27, exit at zoom >= 0.30) prevents flickering at the boundary. The `useSemanticZoom()` hook handles this logic internally -- the constellation view simply renders when told it is Z0 and unmounts when it is not.

---

## 5. Acceptance Criteria

### Functional

| #   | Criterion                                                                                                      | Verification                                                         |
| --- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| F1  | ConstellationView renders when `useSemanticZoom()` returns `'Z0'` and unmounts when it returns any other level | Integration test mocking the semantic zoom hook                      |
| F2  | 6 beacons render at the same ring positions as capsules (300px radius, 60-degree spacing, first at 12 o'clock) | Unit test comparing computed positions against expected coordinates  |
| F3  | Each beacon displays a 12px colored dot with the correct status color from `HEALTH_STATE_MAP`                  | Unit test with each health state                                     |
| F4  | Compact district codes (AB, CH, PR, CO, ER, CD) render below each beacon at 9px, uppercase, 0.12em tracking    | Snapshot test of rendered DOM                                        |
| F5  | Alert Count metric displays the sum of all district `alertCount` values                                        | Unit test with known telemetry data                                  |
| F6  | Active Work metric displays the sum of parsed pulse count values                                               | Unit test with pulse strings like "3 runs active", "8 conversations" |
| F7  | System Pulse metric displays the worst health state across online districts (excludes OFFLINE/UNKNOWN)         | Unit test with mixed health states                                   |
| F8  | System Pulse shows "Operational" when all districts are OPERATIONAL or OFFLINE/UNKNOWN                         | Unit test edge case                                                  |
| F9  | OFFLINE/UNKNOWN beacons render at 0.40 opacity with no glow                                                    | Unit test with `health: 'OFFLINE'`                                   |
| F10 | Alert count renders in `--color-error` when > 0                                                                | Unit test with `alertCount: 5`                                       |

### Accessibility

| #   | Criterion                                                                      | Verification      |
| --- | ------------------------------------------------------------------------------ | ----------------- |
| A1  | Each beacon has an `aria-label` including the district code and health state   | DOM inspection    |
| A2  | GlobalMetrics container has `role="status"` and `aria-label="System overview"` | DOM inspection    |
| A3  | All beacon animations stop when `prefers-reduced-motion: reduce` is active     | Media query test  |
| A4  | Beacon pulse shows static glow when reduced motion is preferred                | Visual inspection |

### Performance

| #   | Criterion                                                                                             | Verification                                           |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| P1  | Z0/Z1 transition completes in under 300ms with no dropped frames                                      | Performance profiling                                  |
| P2  | During pan, beacon glow animations are disabled via `[data-panning]` CSS                              | CSS rule verification                                  |
| P3  | Aggregation logic (`computeMetrics`) does not cause unnecessary re-renders -- memoized with `useMemo` | Code review for `useMemo` with stable dependency array |
| P4  | Total constellation CSS under 2KB gzipped                                                             | Build analysis                                         |

### Design Fidelity

| #   | Criterion                                                                                         | Verification                    |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------- |
| D1  | Beacon dot is exactly 12px diameter with fully rounded corners                                    | DOM measurement                 |
| D2  | Beacon label matches Z0 typography spec: 9px, weight 600, tracking 0.12em, uppercase, opacity 0.7 | Computed style verification     |
| D3  | Beacon glow uses correct status colors from VISUAL-DESIGN-SPEC.md Section 1.6                     | CSS inspection                  |
| D4  | OPERATIONAL beacon pulses glow (3s cycle, ease-in-out)                                            | Animation timeline verification |
| D5  | DOWN beacon flashes opacity (1.5s cycle, 0.6-1.0 range)                                           | Animation timeline verification |
| D6  | Global metrics use Geist Mono with `tabular-nums` for numeric values                              | Computed style verification     |

---

## 6. Decisions Made

| #   | Decision                                                                                      | Rationale                                                                                                                                                                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Beacons occupy the same world-space positions as capsules**                                 | Ensures the Z0/Z1 transition reads as capsules collapsing to dots in place, not rearranging. Maintains spatial consistency per the ZUI design principle.                                                                                                                    |
| D2  | **System Pulse uses "worst-of" logic excluding OFFLINE and UNKNOWN**                          | OFFLINE means intentionally absent; UNKNOWN means no data. Neither should drag the pulse indicator to a bad state. An all-OFFLINE system with one OPERATIONAL app should show "Operational", not "Offline".                                                                 |
| D3  | **No click-to-navigate on beacons in this workstream**                                        | Z0 is an overview mode for glancing at system health. Navigation happens by zooming in (which transitions to Z1 where capsules are clickable). Adding click handlers to 12px dots creates a poor click target. A future enhancement could add click-to-flyTo.               |
| D4  | **No counter-scaling of beacon labels at Z0**                                                 | Per VISUAL-DESIGN-SPEC.md Section 3.2 and Risk #8, text at Z0 is expected to be barely readable. Beacons communicate through color and glow, not text. Counter-scaling would add complexity for minimal gain at a zoom level designed for spatial orientation, not reading. |
| D5  | **CSS custom properties (`--beacon-glow-outer`, `--beacon-glow-inner`) set per health state** | Allows the beacon pulse `@keyframes` animation to reference the correct glow colors without duplicating the keyframe for each health state. Set via inline `style` on the beacon dot element.                                                                               |
| D6  | **`AnimatePresence` with `mode="wait"` for Z0/Z1 crossfade**                                  | Ensures one view exits before the other enters, preventing overlapping renderers. The 300ms crossfade is fast enough to feel instant at the scale of a zoom gesture.                                                                                                        |
| D7  | **Active Work parsed from pulse string with regex**                                           | The `pulse` field in `AppTelemetry` is a human-readable string (e.g., "3 runs active"). Parsing the leading integer is a pragmatic approach. If no number prefix is found, the contribution is 0. This avoids needing a separate numeric field in the telemetry contract.   |

---

## 7. Open Questions

| #   | Question                                                                                                              | Impact                                    | Proposed Resolution                                                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Should beacons support click-to-flyTo (click a beacon to zoom into that district)?                                    | Low -- nice-to-have UX shortcut.          | Defer. The 12px dot is a poor click target at Z0 zoom levels. Revisit if users request it. If added, use `flyTo()` from the camera store to animate to the district center at Z1 zoom. |
| Q2  | What happens if the districts store is still loading when Z0 is active (initial page load at Z0 zoom via URL params)? | Low -- edge case for deep-linked Z0 URLs. | Render beacons in UNKNOWN state (gray, no glow) until telemetry data arrives. Metrics show 0/0/"Unknown".                                                                              |
| Q3  | Should the global metrics bar remain visible at the Z0/Z1 boundary during the crossfade transition?                   | Low -- subtle visual polish.              | No. The metrics bar fades out with the constellation view. Z1 has per-capsule telemetry which serves the same purpose.                                                                 |

---

## 8. Risk Register

| #   | Risk                                                                       | Likelihood | Impact | Mitigation                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Beacon glow invisible at extreme zoom-out** (zoom ~0.10-0.15)            | Medium     | Low    | Beacons are designed as colored dots, not glow-dependent. At extreme zoom, the dot color still communicates status. Glow is supplementary. Acceptable degradation at the far end of the Z0 range.               |
| R2  | **Z0/Z1 transition flickers if hysteresis thresholds are too narrow**      | Low        | Medium | Hysteresis is handled by `useSemanticZoom()` in WS-1.1 (10% band: enter < 0.27, exit >= 0.30). This SOW consumes the hook, not implements it. If flickering is observed, adjust thresholds in WS-1.1 constants. |
| R3  | **Active Work parsing breaks on non-English or non-numeric pulse strings** | Low        | Low    | The regex `^(\d+)` only matches leading digits. If no match, that app contributes 0. The aggregate still shows partial data. Log a warning if no apps produce parseable pulse values.                           |
| R4  | **Metric aggregation re-runs on every store update**                       | Low        | Low    | `useMemo` with the apps record as dependency. The districts store updates on each telemetry poll cycle (every 5-30s), so re-computation frequency is very low. No performance concern.                          |
| R5  | **AnimatePresence crossfade causes layout shift in the spatial canvas**    | Low        | Medium | Both Z0 and Z1 views occupy the same world-space container with the same dimensions. The crossfade is opacity-only -- no position or size changes. Test with Chrome DevTools Layout Shift measurement.          |
