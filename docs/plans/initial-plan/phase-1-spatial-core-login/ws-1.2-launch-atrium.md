# WS-1.2: Launch Atrium

> **Workstream ID:** WS-1.2
> **Phase:** 1 -- Spatial Core + Login
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.1 (project scaffolding), WS-0.2 (design tokens), WS-0.3 (ZUI tech spike), WS-1.1 (ZUI engine)
> **Blocks:** WS-2.1 (morph choreography), WS-2.2--2.5 (district content)
> **Resolves:** None

---

## 1. Objective

Build the Launch Atrium -- the Z1 default view that every authenticated user lands on. Six district capsules arranged in a ring around a breathing hub glyph, rendered over an ambient dot grid with periodic radial pulse. Each capsule surfaces five universal telemetry fields with real-time health state. The atrium must feel alive at idle, respond instantly to hover, and initiate the selection lock-on sequence that hands off to WS-2.1 morph choreography.

---

## 2. Scope

### In Scope

- **CapsuleRing** layout component (6 capsules in a 300px-radius circle, 60-degree spacing, first capsule at 12 o'clock / 270 degrees)
- **DistrictCapsule** component (192 x 228px glass card with telemetry content, health bar, sparkline)
- **HubCenterGlyph** breathing animation component at the ring center
- **DotGrid** background with 48px spacing and radial pulse wave
- **ScanlineOverlay** triggered on capsule selection
- Hover, selection (lock-on pulse), and offline visual states per VISUAL-DESIGN-SPEC.md
- CSS `@keyframes` for all Ambient-tier animations (heartbeat, breathing, grid pulse)
- Framer Motion (`motion/react`) for all Choreography-tier animations (hover scale, selection pulse, scanline)
- `prefers-reduced-motion` compliance on every animation
- TypeScript interfaces for all props and telemetry data shapes
- Integration points for WS-1.5 telemetry aggregator data
- Integration points for WS-2.1 morph choreography (selection callback, capsule ref forwarding)

### Out of Scope

- Morph transition to district view (WS-2.1)
- District content inside expanded capsules (WS-2.2--2.5)
- Particle drift system (WS-1.6 ambient effects layer)
- Film grain / noise overlay (WS-1.6)
- HUD breadcrumbs, minimap, compass (WS-1.4 navigation instruments)
- Actual telemetry data fetching or WebSocket subscriptions (WS-1.5)
- Login/auth gating (WS-1.3)
- Z0 constellation view and Z2/Z3 zoom transitions (WS-1.1 ZUI engine)

---

## 3. Input Dependencies

| Dependency        | Source      | What It Provides                                                                                                                   |
| ----------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Design tokens CSS | WS-0.2      | All `--color-*`, `--glow-*`, `--duration-*`, `--ease-*`, `--capsule-*`, `--space-*` custom properties registered in `@theme` block |
| ZUI engine        | WS-1.1      | `<ZUIViewport>` container component, zoom-level context (`useZoomLevel()`), panning state (`data-panning` attribute on canvas)     |
| ZUI tech spike    | WS-0.3      | Confirmed pan/zoom library choice, transform coordinate system, `will-change: transform` layer promotion strategy                  |
| Project scaffold  | WS-0.1      | Next.js app router at `src/app/(launch)/`, Tailwind v4 config, `@tarva/ui` dependency, Framer Motion dependency                    |
| @tarva/ui         | npm package | `Card`, `Badge`, `StatusBadge`, `Sparkline`, `Tooltip` component APIs                                                              |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  components/
    districts/
      capsule-ring.tsx          # Ring layout + hub center
      district-capsule.tsx      # Individual capsule component
      capsule-health-bar.tsx    # 3px animated health indicator
      capsule-telemetry.tsx     # 3 key-value telemetry rows
      capsule-sparkline.tsx     # Decorative bottom sparkline
      hub-center-glyph.tsx      # Breathing center glyph
      dot-grid.tsx              # Background dot grid + pulse
      scanline-overlay.tsx      # Selection scanline sweep
      index.ts                  # Barrel export
    districts/
      __tests__/
        capsule-ring.test.tsx
        district-capsule.test.tsx
  styles/
    atrium.css                  # @keyframes for ambient animations
  types/
    district.ts                 # Shared types: DistrictId, CapsuleData, HealthState
```

### 4.2 Type Definitions

**File:** `src/types/district.ts`

```ts
/** The 6 canonical district identifiers */
export type DistrictId =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

/** Operational health state of a district */
export type HealthState = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'OFFLINE' | 'UNKNOWN'

/** Maps HealthState to design token and StatusBadge category */
export const HEALTH_STATE_MAP: Record<
  HealthState,
  {
    color: string // CSS custom property name
    glowToken: string // Glow box-shadow token name
    statusCategory: 'success' | 'warning' | 'danger' | 'neutral' | 'muted'
    dotAnimation: 'pulse' | 'none'
    label: string
  }
> = {
  OPERATIONAL: {
    color: '--color-healthy',
    glowToken: '--glow-healthy',
    statusCategory: 'success',
    dotAnimation: 'pulse',
    label: 'Operational',
  },
  DEGRADED: {
    color: '--color-warning',
    glowToken: '--glow-warning',
    statusCategory: 'warning',
    dotAnimation: 'none',
    label: 'Degraded',
  },
  DOWN: {
    color: '--color-error',
    glowToken: '--glow-error',
    statusCategory: 'danger',
    dotAnimation: 'pulse',
    label: 'Down',
  },
  OFFLINE: {
    color: '--color-offline',
    glowToken: '',
    statusCategory: 'neutral',
    dotAnimation: 'none',
    label: 'Offline',
  },
  UNKNOWN: {
    color: '--color-offline',
    glowToken: '',
    statusCategory: 'muted',
    dotAnimation: 'none',
    label: 'Unknown',
  },
}

/** Universal capsule telemetry fields (per Gap Resolution #8) */
export interface CapsuleTelemetry {
  /** Operational state */
  health: HealthState
  /** Primary activity metric, e.g. "3 runs active" */
  pulse: string
  /** Most recent significant event with relative timestamp */
  lastEvent: string
  /** Active alert count (0 = quiet, > 0 = attention needed) */
  alerts: number
  /** Time since last meaningful activity, e.g. "2m ago" */
  freshness: string
}

/** Static metadata for each district */
export interface DistrictMeta {
  id: DistrictId
  displayName: string
  /** Index 0-5, determines ring position (0 = 12 o'clock) */
  ringIndex: number
}

/** Full capsule data combining metadata + live telemetry */
export interface CapsuleData {
  district: DistrictMeta
  telemetry: CapsuleTelemetry
  /** Sparkline data points for the decorative chart (last 12 values) */
  sparklineData: number[]
}

/** The 6 districts in ring order (index 0 = 12 o'clock, clockwise) */
export const DISTRICTS: DistrictMeta[] = [
  { id: 'agent-builder', displayName: 'Agent Builder', ringIndex: 0 },
  { id: 'tarva-chat', displayName: 'Tarva Chat', ringIndex: 1 },
  { id: 'project-room', displayName: 'Project Room', ringIndex: 2 },
  { id: 'tarva-core', displayName: 'TarvaCORE', ringIndex: 3 },
  { id: 'tarva-erp', displayName: 'TarvaERP', ringIndex: 4 },
  { id: 'tarva-code', displayName: 'tarvaCODE', ringIndex: 5 },
]
```

### 4.3 Component: CapsuleRing

**File:** `src/components/districts/capsule-ring.tsx`

```tsx
'use client'

import { type RefObject } from 'react'
import { DistrictCapsule } from './district-capsule'
import { HubCenterGlyph } from './hub-center-glyph'
import type { CapsuleData, DistrictId } from '@/types/district'

export interface CapsuleRingProps {
  /** Array of exactly 6 capsule data objects, one per district */
  capsules: CapsuleData[]
  /** Currently selected district (null = none selected) */
  selectedId: DistrictId | null
  /** Callback when a capsule is clicked */
  onSelect: (id: DistrictId) => void
  /** Ref map for morph choreography hand-off (WS-2.1) */
  capsuleRefs?: Record<DistrictId, RefObject<HTMLDivElement>>
  /** Whether the ZUI viewport is actively panning */
  isPanning?: boolean
}
```

**Layout algorithm:**

The ring is a positioned container of fixed dimensions. Each capsule is absolutely positioned using trigonometric placement.

```
Container: relative, width = 2 * (RING_RADIUS + CAPSULE_WIDTH/2 + HOVER_OVERFLOW)
                             = 2 * (300 + 96 + 24) = 840px square

For each capsule i (0..5):
  angle = 270 + (i * 60) degrees  // 270deg = 12 o'clock in CSS coordinates
  angleRad = angle * (Math.PI / 180)

  centerX = RING_RADIUS * Math.cos(angleRad) + containerCenter
  centerY = RING_RADIUS * Math.sin(angleRad) + containerCenter

  left = centerX - CAPSULE_WIDTH / 2   // offset to capsule top-left
  top  = centerY - CAPSULE_HEIGHT / 2
```

Where:

- `RING_RADIUS` = `var(--space-ring-radius)` = `300px`
- `CAPSULE_WIDTH` = `var(--capsule-width)` = `192px`
- `CAPSULE_HEIGHT` = `var(--capsule-height)` = `228px`
- `HOVER_OVERFLOW` = `24px` (padding so hover scale does not clip)

The hub center glyph sits at the exact center of the container.

**CSS containment on ring container:**

```css
.capsule-ring {
  position: relative;
  width: 840px;
  height: 840px;
  contain: layout style;
}
```

**Panning optimization:** When `isPanning` is true, the container receives `data-panning="true"` which triggers simplified glow and disabled backdrop-filter on all children (per VISUAL-DESIGN-SPEC.md Section 4.3).

### 4.4 Component: DistrictCapsule

**File:** `src/components/districts/district-capsule.tsx`

```tsx
'use client'

import { forwardRef, useCallback, useId } from 'react'
import { motion, type Variants } from 'motion/react'
import { CapsuleHealthBar } from './capsule-health-bar'
import { CapsuleTelemetry } from './capsule-telemetry'
import { CapsuleSparkline } from './capsule-sparkline'
import { ScanlineOverlay } from './scanline-overlay'
import type { CapsuleData, DistrictId, HealthState } from '@/types/district'

export interface DistrictCapsuleProps {
  /** Full capsule data (metadata + telemetry + sparkline) */
  data: CapsuleData
  /** Whether this capsule is currently selected */
  isSelected: boolean
  /** Whether any capsule in the ring is selected (dims non-selected) */
  hasSelection: boolean
  /** Click handler */
  onSelect: (id: DistrictId) => void
  /** Absolute position from ring layout */
  style: { left: number; top: number }
  /** Whether the parent canvas is panning (disable effects) */
  isPanning?: boolean
}
```

**Framer Motion variants:**

```ts
const capsuleVariants: Variants = {
  idle: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: [0, 0, 0.2, 1], // --ease-hover
    },
  },
  hover: {
    scale: 1.12, // --capsule-hover-scale
    transition: {
      duration: 0.2, // --duration-hover
      ease: [0, 0, 0.2, 1], // --ease-hover
    },
  },
  selected: {
    scale: 1.05, // --capsule-select-scale
    transition: {
      duration: 0.2, // --duration-hover
      ease: [0.34, 1.56, 0.64, 1], // --ease-bounce
    },
  },
  dimmed: {
    scale: 1,
    opacity: 0.3,
    transition: {
      duration: 0.3, // --duration-transition
      ease: [0.4, 0, 0.2, 1], // --ease-default
    },
  },
}
```

**Resolved animation state logic:**

```ts
function resolveVariant(
  isSelected: boolean,
  hasSelection: boolean,
  isHovered: boolean,
  health: HealthState
): string {
  if (isSelected) return 'selected'
  if (hasSelection) return 'dimmed'
  if (isHovered) return 'hover'
  return 'idle'
}
```

**Visual states by health (section 2.5 of VISUAL-DESIGN-SPEC.md):**

| Health      | Glass BG                  | Border                           | Glow                       | Overall Opacity | Filter           | Hover Scale |
| ----------- | ------------------------- | -------------------------------- | -------------------------- | --------------- | ---------------- | ----------- |
| OPERATIONAL | `rgba(255,255,255,0.03)`  | `rgba(255,255,255,0.06)`         | `var(--glow-ember-subtle)` | 1.0             | none             | 1.12        |
| DEGRADED    | `rgba(255,255,255,0.03)`  | `rgba(255,255,255,0.06)`         | `var(--glow-ember-subtle)` | 1.0             | none             | 1.12        |
| DOWN        | `rgba(255,255,255,0.03)`  | `rgba(255,255,255,0.06)`         | `var(--glow-ember-subtle)` | 1.0             | none             | 1.12        |
| OFFLINE     | `rgba(255,255,255,0.015)` | `rgba(255,255,255,0.03)`         | none                       | 0.40            | `saturate(0.15)` | 1.06        |
| UNKNOWN     | `rgba(255,255,255,0.015)` | `rgba(255,255,255,0.03), dashed` | none                       | 0.40            | `saturate(0.15)` | 1.06        |

**Capsule DOM structure:**

```tsx
<motion.div
  ref={ref}
  role="button"
  tabIndex={0}
  aria-label={`${data.district.displayName} district -- ${data.telemetry.health}`}
  data-district={data.district.id}
  data-health={data.telemetry.health}
  variants={capsuleVariants}
  initial="idle"
  animate={resolvedVariant}
  whileHover={isOffline ? { scale: 1.06 } : 'hover'}
  onClick={() => onSelect(data.district.id)}
  onKeyDown={handleKeySelect}
  className={cn(
    // Dimensions
    'absolute h-[228px] w-[192px] rounded-[28px] p-5',
    // Glass material
    'bg-white/[0.03] backdrop-blur-[12px] backdrop-saturate-[120%]',
    'border border-white/[0.06]',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]',
    // Containment
    'contain-[layout_style_paint]',
    // Focus visible
    'focus-visible:outline-2 focus-visible:outline-offset-2',
    'focus-visible:outline-[var(--color-ember-bright)]',
    // Cursor
    'cursor-pointer'
  )}
  style={{
    left: style.left,
    top: style.top,
    boxShadow: glowValue, // computed from health + hover state
    filter: isOffline ? 'saturate(0.15)' : undefined,
    opacity: isOffline ? 0.4 : undefined,
  }}
>
  {/* Capsule content zones */}
  <div className="flex h-full flex-col">
    {/* Header zone: 36px */}
    <div className="flex h-9 flex-col items-center gap-2">
      {/* App name */}
      <span
        className={cn(
          'font-sans text-[11px] font-semibold tracking-[0.08em] uppercase',
          'leading-none text-[var(--color-text-primary)] opacity-90'
        )}
      >
        {data.district.displayName}
      </span>

      {/* Health bar */}
      <CapsuleHealthBar health={data.telemetry.health} capsuleIndex={data.district.ringIndex} />
    </div>

    {/* Telemetry zone: 120px, starts 44px below health bar */}
    <div className="mt-[44px] flex-1">
      <CapsuleTelemetry telemetry={data.telemetry} isOffline={isOffline} />
    </div>

    {/* Ambient sparkline zone: 32px */}
    <div className="mt-auto h-8">
      <CapsuleSparkline data={data.sparklineData} isOffline={isOffline} />
    </div>
  </div>

  {/* Scanline overlay (rendered on selection) */}
  {isSelected && <ScanlineOverlay />}
</motion.div>
```

**Hover glow transition (CSS class applied dynamically):**

```css
/* Resting state */
.district-capsule {
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.03),
    0 0 12px rgba(224, 82, 0, 0.08),
    0 0 4px rgba(224, 82, 0, 0.12);
  transition:
    box-shadow var(--duration-hover) var(--ease-hover),
    background var(--duration-hover) ease-out,
    border-color var(--duration-hover) ease-out;
}

/* Hover state */
.district-capsule:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.03),
    0 0 20px rgba(224, 82, 0, 0.12),
    0 0 8px rgba(255, 119, 60, 0.22),
    0 0 2px rgba(255, 170, 112, 0.35);
  z-index: 10;
}

/* Selected state (lock-on) */
.district-capsule[data-selected='true'] {
  border-color: rgba(255, 119, 60, 0.35);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.03),
    0 0 40px rgba(224, 82, 0, 0.18),
    0 0 16px rgba(255, 119, 60, 0.3),
    0 0 4px rgba(255, 170, 112, 0.5);
}

/* Panning optimization */
[data-panning='true'] .district-capsule {
  box-shadow: 0 0 8px rgba(224, 82, 0, 0.1);
  backdrop-filter: none;
}
```

**Hover text opacity transitions:**

```css
.district-capsule [data-slot='telemetry-label'] {
  opacity: 0.4;
  transition: opacity var(--duration-hover) ease-out;
}
.district-capsule:hover [data-slot='telemetry-label'] {
  opacity: 0.7;
}

.district-capsule [data-slot='telemetry-value'] {
  opacity: 0.7;
  transition: opacity var(--duration-hover) ease-out;
}
.district-capsule:hover [data-slot='telemetry-value'],
.district-capsule:focus-visible [data-slot='telemetry-value'] {
  opacity: 1;
}
```

### 4.5 Component: CapsuleHealthBar

**File:** `src/components/districts/capsule-health-bar.tsx`

```tsx
export interface CapsuleHealthBarProps {
  /** Current health state */
  health: HealthState
  /** Index 0-5 for stagger delay (1.2s per capsule) */
  capsuleIndex: number
}
```

**Rendering:** A single `<div>` element, full-width of the content area (152px), 3px tall, 1.5px border-radius. Background color is the status color mapped from `HealthState`:

| HealthState | CSS Color              |
| ----------- | ---------------------- |
| OPERATIONAL | `var(--color-healthy)` |
| DEGRADED    | `var(--color-warning)` |
| DOWN        | `var(--color-error)`   |
| OFFLINE     | `var(--color-offline)` |
| UNKNOWN     | `var(--color-offline)` |

**Heartbeat animation (CSS @keyframes, Ambient tier):**

Defined in `src/styles/atrium.css`:

```css
@keyframes heartbeat {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(1);
  }
  12% {
    opacity: 0.55;
    transform: scaleY(1.8);
  }
  30% {
    opacity: 0.4;
    transform: scaleY(1.1);
  }
}

.capsule-health-bar {
  width: 100%;
  height: 3px;
  border-radius: 1.5px;
  transform-origin: center center;
  animation: heartbeat var(--duration-ambient-heart) var(--heartbeat-delay, 0s) infinite;
}

/* Stagger: 1.2s per capsule */
.capsule-health-bar[data-index='0'] {
  --heartbeat-delay: 0s;
}
.capsule-health-bar[data-index='1'] {
  --heartbeat-delay: 1.2s;
}
.capsule-health-bar[data-index='2'] {
  --heartbeat-delay: 2.4s;
}
.capsule-health-bar[data-index='3'] {
  --heartbeat-delay: 3.6s;
}
.capsule-health-bar[data-index='4'] {
  --heartbeat-delay: 4.8s;
}
.capsule-health-bar[data-index='5'] {
  --heartbeat-delay: 6s;
}

/* Offline: no heartbeat, reduced opacity */
.capsule-health-bar[data-health='OFFLINE'],
.capsule-health-bar[data-health='UNKNOWN'] {
  animation: none;
  opacity: 0.25;
}

/* DOWN state: flashing variant */
.capsule-health-bar[data-health='DOWN'] {
  animation:
    heartbeat var(--duration-ambient-heart) var(--heartbeat-delay, 0s) infinite,
    flash-error 2s ease-in-out infinite;
}

@keyframes flash-error {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.7;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .capsule-health-bar {
    animation: none !important;
    opacity: 0.45;
  }
}
```

### 4.6 Component: CapsuleTelemetry

**File:** `src/components/districts/capsule-telemetry.tsx`

```tsx
export interface CapsuleTelemetryProps {
  /** Live telemetry data */
  telemetry: CapsuleTelemetry
  /** Whether district is offline (show placeholder values) */
  isOffline: boolean
}
```

Renders the 3 visible key-value pairs selected from the 5 universal fields. The visible subset for the atrium capsule is: **Pulse**, **Last Event**, and **Alerts**.

Health and Freshness are communicated via the health bar color and can be shown in tooltip on hover, but are not rendered as telemetry rows to preserve the capsule's information density budget.

**Telemetry row layout (repeated 3 times, 24px spacing between):**

```tsx
<div className="flex flex-col gap-6">
  {/* Row: Pulse */}
  <div className="flex flex-col gap-0.5">
    <span
      data-slot="telemetry-label"
      className={cn(
        'font-sans text-[10px] font-normal tracking-[0.06em] uppercase',
        'leading-none text-[var(--color-text-tertiary)]'
      )}
    >
      PULSE
    </span>
    <span
      data-slot="telemetry-value"
      className={cn(
        'font-mono text-[16px] font-medium tabular-nums',
        'leading-none text-[var(--color-text-primary)]',
        'font-[font-feature-settings:_"tnum"_1]'
      )}
    >
      {isOffline ? '--' : telemetry.pulse}
    </span>
  </div>

  {/* Row: Last Event */}
  <div className="flex flex-col gap-0.5">
    <span data-slot="telemetry-label" className="...">
      LAST EVENT
    </span>
    <span data-slot="telemetry-value" className="...">
      {isOffline ? '--' : telemetry.lastEvent}
    </span>
  </div>

  {/* Row: Alerts */}
  <div className="flex flex-col gap-0.5">
    <span data-slot="telemetry-label" className="...">
      ALERTS
    </span>
    <span
      data-slot="telemetry-value"
      className={cn('...', telemetry.alerts > 0 && !isOffline && 'text-[var(--color-error)]')}
    >
      {isOffline ? '--' : telemetry.alerts}
    </span>
  </div>
</div>
```

**Alert badge:** When `telemetry.alerts > 0`, render a small red dot badge (using `@tarva/ui Badge` with `variant="destructive"` or a manual 6px circle) next to the alerts value:

```tsx
{
  telemetry.alerts > 0 && !isOffline && (
    <span
      className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-error)]"
      aria-label={`${telemetry.alerts} active alerts`}
    />
  )
}
```

**Offline state:** All telemetry values render as `--` in `var(--color-text-ghost)`. Labels remain visible but at reduced opacity.

### 4.7 Component: CapsuleSparkline

**File:** `src/components/districts/capsule-sparkline.tsx`

```tsx
export interface CapsuleSparklineProps {
  /** Array of 12 numeric data points */
  data: number[]
  /** Whether district is offline */
  isOffline: boolean
}
```

**Online state:** Uses `@tarva/ui Sparkline` component:

```tsx
<Sparkline
  data={data}
  width={152} // content area width (192 - 2*20 padding)
  height={24}
  strokeWidth={1}
  variant="neutral" // teal-tinted via CSS override
  showFill={false}
  animated={false} // decorative, no mount animation needed
  aria-hidden="true" // purely decorative
  className="opacity-30"
  style={
    {
      '--trend-neutral': 'var(--color-teal)',
    } as React.CSSProperties
  }
/>
```

The sparkline is purely decorative (aria-hidden). Stroke color uses `var(--color-teal)` via CSS variable override on the Sparkline's `--trend-neutral` token. Opacity is 0.30 at rest, rising to 0.50 on capsule hover (controlled by parent hover state CSS).

**Offline state:** Replace sparkline with a static noise texture:

```tsx
<div
  className="h-6 w-full rounded bg-white/[0.02] opacity-[0.05]"
  style={{ backgroundImage: 'url(/textures/noise-1px.png)', backgroundSize: '100px 100px' }}
  aria-hidden="true"
/>
```

### 4.8 Component: HubCenterGlyph

**File:** `src/components/districts/hub-center-glyph.tsx`

```tsx
export interface HubCenterGlyphProps {
  /** Optional label below glyph */
  label?: string
  /** Whether any capsule is selected (affects glow intensity) */
  hasSelection?: boolean
}
```

**Rendering:** Positioned at the center of the CapsuleRing container. The glyph is a Tarva logomark SVG (or a placeholder geometric shape until the asset is provided), wrapped in a breathing glow container.

**Breathing animation (CSS @keyframes, Ambient tier):**

```css
@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(224, 82, 0, 0.06),
      0 0 8px rgba(224, 82, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 48px rgba(224, 82, 0, 0.14),
      0 0 16px rgba(224, 82, 0, 0.22);
  }
}

.hub-center-glyph {
  animation: breathe var(--duration-ambient-breathe) ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .hub-center-glyph {
    animation: none;
    box-shadow:
      0 0 30px rgba(224, 82, 0, 0.1),
      0 0 12px rgba(224, 82, 0, 0.16);
  }
}
```

**Glyph dimensions:** 64 x 64px container, centered at (420, 420) within the 840px ring container.

**Label (optional):** 12px, Geist Sans, font-weight 500, tracking 0.04em, uppercase, `var(--color-text-secondary)`, opacity 0.6, positioned 12px below the glyph center.

### 4.9 Component: DotGrid

**File:** `src/components/districts/dot-grid.tsx`

```tsx
export interface DotGridProps {
  /** Center point for radial pulse (defaults to container center) */
  pulseOrigin?: { x: string; y: string }
  /** Whether to show the radial pulse animation */
  showPulse?: boolean
}
```

**Implementation:** A CSS-only background using `radial-gradient` for dots and a separate overlay div for the pulse wave.

**Dot grid base:**

```css
.dot-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.015) 1px,
    transparent 1px
  );
  background-size: 48px 48px;
}
```

**Radial pulse wave overlay:**

```css
.dot-grid-pulse {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(
    circle at var(--pulse-x, 50%) var(--pulse-y, 50%),
    rgba(255, 255, 255, 0.04) 0%,
    rgba(255, 255, 255, 0.015) 30%,
    rgba(255, 255, 255, 0.015) 100%
  );
  animation: grid-pulse var(--duration-ambient-grid) ease-out infinite;
  opacity: 0;
}

@keyframes grid-pulse {
  0% {
    opacity: 0;
    background-size: 0% 0%;
  }
  5% {
    opacity: 1;
    background-size: 10% 10%;
  }
  40% {
    opacity: 0.6;
    background-size: 200% 200%;
  }
  100% {
    opacity: 0;
    background-size: 400% 400%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dot-grid-pulse {
    animation: none;
    opacity: 0;
  }
}
```

### 4.10 Component: ScanlineOverlay

**File:** `src/components/districts/scanline-overlay.tsx`

Renders inside the selected capsule (scoped by the capsule's `overflow: hidden` via `rounded-[28px]` and explicit `overflow-hidden`).

```tsx
export interface ScanlineOverlayProps {
  /** Height of the parent container for scan distance */
  scanHeight?: number
}
```

**Three scan lines:** 1 primary + 2 trailing ghosts, using Framer Motion for the Choreography-tier sweep:

```tsx
<motion.div className="pointer-events-none absolute inset-0 overflow-hidden">
  {/* Primary scanline */}
  <motion.div
    className={cn(
      'absolute right-0 left-0 h-px',
      'bg-[var(--color-ember)] opacity-[0.12]',
      'shadow-[0_0_4px_rgba(224,82,0,0.10)]'
    )}
    initial={{ y: -2 }}
    animate={{ y: 228 }}
    transition={{ duration: 0.35, ease: 'easeOut' }}
  />
  {/* Ghost 1 */}
  <motion.div
    className="absolute right-0 left-0 h-px bg-[var(--color-ember)] opacity-[0.06]"
    initial={{ y: -2 }}
    animate={{ y: 228 }}
    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.03 }}
  />
  {/* Ghost 2 */}
  <motion.div
    className="absolute right-0 left-0 h-px bg-[var(--color-ember)] opacity-[0.03]"
    initial={{ y: -2 }}
    animate={{ y: 228 }}
    transition={{ duration: 0.35, ease: 'easeOut', delay: 0.06 }}
  />
</motion.div>
```

**Scanline duration:** 350ms (`var(--duration-scanline)`), ease-out. Ghost lines trail by 30ms and 60ms respectively.

### 4.11 Stylesheet: atrium.css

**File:** `src/styles/atrium.css`

Consolidates all CSS `@keyframes` for Ambient-tier animations to keep them separate from Choreography-tier Framer Motion code:

```css
/* =============================================================
   ATRIUM AMBIENT ANIMATIONS
   All animations in this file are CSS @keyframes (Ambient tier).
   Choreography-tier animations use Framer Motion in components.
   ============================================================= */

/* --- Health Bar Heartbeat --- */
@keyframes heartbeat {
  0%,
  100% {
    opacity: 0.35;
    transform: scaleY(1);
  }
  12% {
    opacity: 0.55;
    transform: scaleY(1.8);
  }
  30% {
    opacity: 0.4;
    transform: scaleY(1.1);
  }
}

/* --- Hub Center Breathing --- */
@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(224, 82, 0, 0.06),
      0 0 8px rgba(224, 82, 0, 0.1);
  }
  50% {
    box-shadow:
      0 0 48px rgba(224, 82, 0, 0.14),
      0 0 16px rgba(224, 82, 0, 0.22);
  }
}

/* --- Dot Grid Radial Pulse --- */
@keyframes grid-pulse {
  0% {
    opacity: 0;
    background-size: 0% 0%;
  }
  5% {
    opacity: 1;
    background-size: 10% 10%;
  }
  40% {
    opacity: 0.6;
    background-size: 200% 200%;
  }
  100% {
    opacity: 0;
    background-size: 400% 400%;
  }
}

/* --- DOWN State Flashing Health Bar --- */
@keyframes flash-error {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.7;
  }
}

/* --- Reduced Motion: disable all ambient animations --- */
@media (prefers-reduced-motion: reduce) {
  .capsule-health-bar,
  .hub-center-glyph,
  .dot-grid-pulse {
    animation: none !important;
  }

  .hub-center-glyph {
    box-shadow:
      0 0 30px rgba(224, 82, 0, 0.1),
      0 0 12px rgba(224, 82, 0, 0.16);
  }

  .capsule-health-bar {
    opacity: 0.45;
  }
}
```

---

## 5. Acceptance Criteria

### Functional

| #   | Criterion                                                                                                                                   | Verification                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| F1  | 6 capsules render in a ring at 300px radius, 60-degree spacing, first capsule at 12 o'clock                                                 | Visual inspection + unit test measuring computed positions |
| F2  | Each capsule displays district name (11px, uppercase, 0.08em tracking), health bar (3px), 3 telemetry rows (Geist Mono 16px), and sparkline | Snapshot test of rendered DOM structure                    |
| F3  | Capsule hover scales to 1.12 within 200ms, glow transitions from subtle to medium, text opacity rises                                       | Framer Motion variant assertion + visual regression        |
| F4  | Capsule selection triggers lock-on pulse (1.05 scale, bounce easing) and scanline sweep (350ms, top-to-bottom)                              | Integration test triggering click, asserting motion state  |
| F5  | Clicking a selected capsule fires `onSelect` callback with the correct `DistrictId`                                                         | Unit test                                                  |
| F6  | Hub center glyph renders at ring center with 5s breathing glow animation                                                                    | Visual inspection                                          |
| F7  | Dot grid renders at 48px spacing with base opacity 0.015 and radial pulse wave every 12s                                                    | Visual inspection                                          |
| F8  | Offline capsules render at 0.40 opacity, saturate(0.15), no glow, telemetry shows `--`, sparkline replaced with noise texture               | Unit test with `health: 'OFFLINE'` data                    |
| F9  | UNKNOWN state renders same as OFFLINE but with dashed border                                                                                | Unit test with `health: 'UNKNOWN'` data                    |
| F10 | Alerts > 0 renders red dot badge next to alert count                                                                                        | Unit test with `alerts: 3`                                 |

### Accessibility

| #   | Criterion                                                                                                               | Verification                    |
| --- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| A1  | Each capsule has `role="button"`, `tabIndex={0}`, and descriptive `aria-label` including district name and health state | DOM inspection                  |
| A2  | Capsules are keyboard-navigable: Enter/Space triggers selection                                                         | Keyboard test                   |
| A3  | `focus-visible` outline renders at 2px offset in `--color-ember-bright`                                                 | Visual test with keyboard focus |
| A4  | All ambient animations stop when `prefers-reduced-motion: reduce` is active                                             | Media query test                |
| A5  | Decorative sparkline is `aria-hidden="true"`                                                                            | DOM inspection                  |
| A6  | Alert count badges have `aria-label` announcing the count                                                               | DOM inspection                  |

### Performance

| #   | Criterion                                                                                               | Verification          |
| --- | ------------------------------------------------------------------------------------------------------- | --------------------- |
| P1  | All capsules use `contain: layout style paint` for isolation                                            | CSS inspection        |
| P2  | During pan (`data-panning="true"`), backdrop-filter is disabled and glows reduce to single-layer shadow | CSS rule verification |
| P3  | All position/scale changes use `transform` only, never `top`/`left`/`width`/`height` animation          | Code review           |
| P4  | Health bar animations use CSS @keyframes (GPU-composited), not JS-driven Framer Motion                  | Code review           |
| P5  | Total CSS for atrium components under 8KB gzipped                                                       | Build analysis        |
| P6  | No layout thrashing during hover (verify with Chrome DevTools Layout Shift)                             | Performance audit     |

### Design Fidelity

| #   | Criterion                                                                                                                                                                                                                | Verification                          |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------- |
| D1  | Glass material matches VISUAL-DESIGN-SPEC.md Section 1.7: `rgba(255,255,255,0.03)` bg, `blur(12px)`, `saturate(120%)`, `1px solid rgba(255,255,255,0.06)` border, `inset 0 1px 0 0 rgba(255,255,255,0.03)` top highlight | CSS inspection                        |
| D2  | Glow levels match Section 1.8: subtle (2-layer), medium (3-layer), bright (3-layer) with exact RGBA values                                                                                                               | CSS inspection                        |
| D3  | Capsule dimensions are exactly 192 x 228px with 28px border-radius                                                                                                                                                       | DOM measurement                       |
| D4  | Typography matches Section 3.2 Z1 specs: app name 11px/600/0.08em, telemetry label 10px/400/0.06em, telemetry value 16px/500/mono                                                                                        | Computed style verification           |
| D5  | Heartbeat animation: 7s cycle, scaleY 1.0->1.8->1.0, opacity 0.35->0.55->0.35, staggered 1.2s per capsule                                                                                                                | Animation timeline verification       |
| D6  | Breathing animation: 5s cycle, glow oscillates between 20px/8px (dim) and 48px/16px (bright), ease-in-out                                                                                                                | Animation timeline verification       |
| D7  | Grid pulse: 12s cycle, radial expansion from center, ease-out                                                                                                                                                            | Visual inspection                     |
| D8  | Scanline: 3 lines (primary 0.12 opacity + two ghosts at 0.06 and 0.03), 350ms traverse, trailing by 30ms and 60ms                                                                                                        | Animation test                        |
| D9  | Hover transitions use `--ease-hover: cubic-bezier(0, 0, 0.2, 1)` and `--duration-hover: 200ms`                                                                                                                           | Computed style verification           |
| D10 | Selection bounce uses `--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)`                                                                                                                                                 | Framer Motion transition verification |

---

## 6. Decisions Made

| #   | Decision                                                                           | Rationale                                                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **3 telemetry rows visible** (Pulse, Last Event, Alerts), not all 5 fields         | The 192x228px capsule at Z1 has a 120px telemetry zone. Three rows at 24px spacing fit cleanly. Health is communicated by the health bar color. Freshness can be shown on hover tooltip or at Z2.                                                                                                                             |
| D2  | **Framer Motion for Choreography, CSS @keyframes for Ambient**                     | Per tech-decisions.md: Framer Motion handles user-triggered animations (hover, selection, morph hand-off) that need imperative control and variant composition. CSS @keyframes handle always-running ambient loops (heartbeat, breathing, grid pulse) at zero JS overhead.                                                    |
| D3  | **Absolute positioning for ring layout**, not CSS grid or flex                     | Trigonometric placement with transforms is the only way to get pixel-perfect circular arrangement. CSS containment on each capsule isolates repaint.                                                                                                                                                                          |
| D4  | **No `@tarva/ui Card` wrapper for capsules**                                       | The capsule glass material, glow, and animation requirements diverge significantly from `Card`'s default styling (which uses `bg-card`, solid border, standard shadow). Building a custom capsule shell avoids fighting Card's defaults. We still import `Badge`, `StatusBadge`, `Sparkline`, and `Tooltip` where they match. |
| D5  | **Sparkline uses `@tarva/ui Sparkline`** with CSS variable override for teal color | Reuses existing component. The `--trend-neutral` variable is overridden locally to point to `var(--color-teal)`, keeping the sparkline decoratively cool-toned against the warm ember capsule glow.                                                                                                                           |
| D6  | **UNKNOWN health state uses dashed border**                                        | Differentiates "we know it is offline" (OFFLINE, solid border) from "we have no data" (UNKNOWN, dashed border). Both share the same dimmed visual treatment otherwise.                                                                                                                                                        |
| D7  | **Ring container is 840px square**                                                 | `2 * (300 + 96 + 24) = 840px`. The 24px overflow accommodates the 1.12 hover scale (capsule grows ~23px in each direction at max) without clipping.                                                                                                                                                                           |
| D8  | **`onSelect` callback, not direct router navigation**                              | The capsule ring does not own navigation. It fires a selection event that the parent page or WS-2.1 morph choreography consumes to orchestrate the zoom transition.                                                                                                                                                           |
| D9  | **`data-district` and `data-health` attributes on capsule DOM**                    | Enables CSS-based state styling without JS class toggling, and provides test hooks for integration tests.                                                                                                                                                                                                                     |
| D10 | **Capsule refs forwarded via `capsuleRefs` prop map**                              | WS-2.1 morph choreography needs direct DOM references to measure capsule positions and animate the layout transition. A `Record<DistrictId, RefObject>` map is the cleanest contract.                                                                                                                                         |

---

## 7. Open Questions

| #   | Question                                                                                     | Impact                                                                                          | Proposed Resolution                                                                                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | What is the Tarva logomark SVG for the hub center glyph?                                     | Low -- can use a geometric placeholder (circle with inner ring) until brand asset is delivered. | Proceed with placeholder. Replace when asset is available.                                                                                                                                                                                            |
| Q2  | Should capsule ring positions animate when the viewport resizes?                             | Medium -- affects responsive behavior.                                                          | The ZUI engine (WS-1.1) handles viewport scaling via canvas transform, not by reflowing the ring. Capsule positions are fixed in canvas-space coordinates. No responsive reflow needed.                                                               |
| Q3  | How does WS-1.5 telemetry aggregator deliver data?                                           | Medium -- affects data flow into capsule props.                                                 | Assume a React context provider (`TelemetryProvider`) that exposes a `useCapsuleData(districtId)` hook returning `CapsuleTelemetry`. Build capsules as controlled components receiving data via props. WS-1.5 will provide the actual implementation. |
| Q4  | Should capsules show a loading skeleton state before telemetry data arrives?                 | Low -- improves perceived performance.                                                          | Yes. Add a `loading` state to `DistrictCapsule` that renders `@tarva/ui Skeleton` placeholders for each telemetry value while data is pending.                                                                                                        |
| Q5  | What is the noise texture PNG for offline sparkline replacement?                             | Low -- a 200x200px static noise texture.                                                        | Generate a 1-channel noise PNG during WS-0.1 scaffold or commit a pre-generated asset to `public/textures/noise-1px.png`.                                                                                                                             |
| Q6  | Should the ring layout support fewer than 6 capsules (e.g., during feature-flagged rollout)? | Low.                                                                                            | Design for exactly 6. If a district is not available, show it in OFFLINE state with "Coming Soon" as the pulse telemetry value.                                                                                                                       |

---

## 8. Risk Register

| #   | Risk                                                                               | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                |
| --- | ---------------------------------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **Backdrop-filter jank during pan/zoom**                                           | High       | Medium | Implement the `[data-panning="true"]` CSS override from VISUAL-DESIGN-SPEC.md Section 4.3: disable `backdrop-filter` and simplify glow to single-layer during active pan. Use `contain: layout style paint` on every capsule.                             |
| R2  | **Box-shadow animation performance** with 6 capsules each having 3-layer glow      | Medium     | Medium | Glow transitions use CSS `transition` on `box-shadow` (GPU-composited). During pan, reduce to single-layer. Profile early with Chrome DevTools Performance panel targeting 60fps.                                                                         |
| R3  | **Framer Motion bundle size** adds to initial load                                 | Medium     | Low    | Framer Motion is tree-shakeable. Import only `motion`, `Variants`, and `AnimatePresence` from `motion/react`. Verify with `next build --analyze` that the atrium chunk stays under 25KB gzipped.                                                          |
| R4  | **Health bar stagger drift** -- CSS animation delays may desync over long sessions | Low        | Low    | CSS `@keyframes` with `animation-delay` is stable in modern browsers. The visual effect is subtle enough that minor drift is imperceptible. No mitigation needed unless observed.                                                                         |
| R5  | **Capsule ref hand-off to WS-2.1 breaks during morph**                             | Medium     | High   | Define the ref contract (`Record<DistrictId, RefObject<HTMLDivElement>>`) as a shared type in `src/types/district.ts`. Write a unit test asserting all 6 refs are populated. Coordinate with WS-2.1 on the exact ref usage pattern before implementation. |
| R6  | **Circular ring layout breaks at small viewports**                                 | Low        | Low    | The ZUI engine scales the entire canvas, not individual components. At browser widths below the ring diameter, the ZUI will zoom out to fit. No capsule-level responsive adaptation is needed.                                                            |
| R7  | **Text rendering at small sizes (10-11px) may be blurry on low-DPI displays**      | Medium     | Low    | Use `text-rendering: optimizeLegibility` and `-webkit-font-smoothing: antialiased` on capsule text. Test on both Retina and 1x displays.                                                                                                                  |
| R8  | **Scanline animation may fire multiple times on rapid clicks**                     | Low        | Low    | Use Framer Motion's `AnimatePresence` with `mode="wait"` to ensure only one scanline instance runs at a time. Gate selection in state to prevent re-selection of an already-selected capsule.                                                             |
