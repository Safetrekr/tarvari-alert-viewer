# WS-2.6: Station Panel Framework

> **Workstream ID:** WS-2.6
> **Phase:** 2 -- Districts + Stations + Morph
> **Assigned Agent:** `world-class-ui-designer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-0.2 (design tokens), WS-1.7 (StationTemplateRegistry interface)
> **Blocks:** WS-2.2-2.5 (all district content uses this framework), WS-3.5 (station template selection)
> **Resolves:** None

---

## 1. Objective

Build the reusable station panel component framework that every district station (WS-2.2 through WS-2.5) renders inside. The framework enforces a strict 3-zone layout -- Header, Body, Actions -- wrapped in the Oblivion glass material with luminous ember borders. Every action button pressed inside a station triggers a receipt stamp ritual (trace ID, timestamp, result summary) that feeds the Evidence Ledger in Phase 3.

This workstream is the visual and structural contract between the `StationTemplate` configuration objects (defined in WS-1.7) and the React components that render station content. It answers the question: "Given a `StationTemplate`, how does a station look and behave?" The rendering layer maps `bodyType` to the appropriate body component, wraps actions in receipt-generating callbacks, and applies the glass + glow material system from VISUAL-DESIGN-SPEC.md Sections 1.7, 4.1, and 4.4.

**Success looks like:** A district implementer (WS-2.2-2.5) imports `<StationPanel>`, passes a `StationTemplate` and domain-specific body content, and gets a fully styled Z3 panel with glass material, luminous border, correct typography, and receipt-stamped actions -- without writing any glass/glow/receipt CSS or logic.

**Traceability:** VISUAL-DESIGN-SPEC.md Sections 1.7, 3.2 (Z3 typography), 4.1, 4.4; combined-recommendations.md "Station Panels (Z3)"; AD-7 interface #4 (StationTemplateRegistry); AD-8 (Station Content per District); AD-6 (Receipt System -- stub only in Phase 2).

---

## 2. Scope

### In Scope

- **`StationPanel` root component** -- Renders the 3-zone layout with glass material, luminous border, and CSS containment. Accepts a `StationTemplate` to drive header title, icon, body type, and action buttons. Provides the receipt stamp trigger to all child components via context.
- **`StationHeader` component** -- Top zone: district display name + station title + optional Lucide icon. Typography per VISUAL-DESIGN-SPEC.md Z3 type scale (16px/600 panel heading). Glass-panel top-edge highlight (1px inset shadow).
- **`StationBody` component** -- Middle zone: renders the appropriate body variant based on `StationLayout.bodyType`. Provides 5 body type slots: `table`, `list`, `metrics`, `launch`, `custom`. Each slot is a render prop or children pattern that district workstreams fill with domain content.
- **`StationActions` component** -- Bottom zone: 1-3 `@tarva/ui` Button components mapped from `StationAction[]`. Every button click is wrapped in a receipt-generating callback before executing the action command.
- **Glass material CSS utility classes** -- `.station-glass`, `.station-glass-active`, `.station-glass-hover` implementing the exact recipes from VISUAL-DESIGN-SPEC.md Section 1.7 with the "Active Glass Panel" treatment as the station default (stations are always focused at Z3).
- **Luminous border CSS** -- 3-layer glow technique from VISUAL-DESIGN-SPEC.md Section 4.4 using ember accent tokens, plus a `glowColor` prop for status-colored borders (healthy, warning, error).
- **Receipt stub hook** -- `useReceiptStamp()` hook that creates a `ReceiptInput` object (from WS-1.7's `ReceiptStore` interface), fires a visual stamp animation, and calls the `ReceiptStore.record()` method. Phase 2 uses the `InMemoryReceiptStore`; Phase 3 swaps to Supabase.
- **Receipt stamp animation component** -- `ReceiptStamp` overlay that renders the trace ID + timestamp + result readout with the receipt typography from VISUAL-DESIGN-SPEC.md Section 3.4, fading in/out over 600ms.
- **Station panel entrance animation** -- Framer Motion `motion.div` with staggered fade-in + translateY for the unfurl sequence initiated by WS-2.1 morph choreography.
- **Pan-state performance optimization** -- Detect `[data-panning="true"]` from the ZUI canvas and swap glass `backdrop-filter` to a solid fallback background during pan/zoom per VISUAL-DESIGN-SPEC.md Section 4.3.
- **`prefers-reduced-motion` compliance** -- Disable all animations (receipt stamp, entrance, glow pulse); show static versions.
- **TypeScript prop interfaces** for all components with full JSDoc documentation.
- **Barrel export** from `src/components/stations/index.ts`.

### Out of Scope

- **District-specific station body content** -- Agent Builder Pipeline body, Tarva Chat Conversations body, etc. are implemented in WS-2.2 through WS-2.5. This workstream provides the body type slots they render into.
- **Station template definitions** -- The `StaticStationTemplateRegistry` with all AD-8 station entries is defined in WS-1.7. This workstream consumes those templates, not creates them.
- **Morph choreography** -- The capsule-to-district-to-station transition state machine is WS-2.1. This workstream provides the entrance animation that WS-2.1 triggers after the "unfurling" phase.
- **Receipt persistence to Supabase** -- Phase 3 (WS-3.1). This workstream uses the `InMemoryReceiptStore` from WS-1.7.
- **Dynamic station template selection** -- Phase 3 (WS-3.5). This workstream renders whatever template it receives.
- **Station-to-station navigation** -- Handled by the camera controller and breadcrumb (WS-1.4).
- **Constellation (Z0) and Atrium (Z1) rendering** -- Those are WS-2.7 and WS-1.2 respectively.

---

## 3. Input Dependencies

| Dependency                    | Source         | What It Provides                                                                                                                                                              | Status    |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Design tokens CSS             | WS-0.2         | All `--color-*`, `--glow-ember-*`, `--duration-*`, `--ease-*`, `--blur-*`, `--space-station-*` custom properties; `@theme` utilities for Tailwind                             | Required  |
| StationTemplateRegistry types | WS-1.7         | `StationTemplate`, `StationLayout`, `StationAction`, `StationLayout.bodyType` union type                                                                                      | Required  |
| ReceiptStore interface        | WS-1.7         | `ReceiptStore.record()`, `ReceiptInput`, `LaunchReceipt` types; `InMemoryReceiptStore` Phase 1 implementation                                                                 | Required  |
| Shared domain types           | WS-1.7         | `AppIdentifier`, `APP_DISPLAY_NAMES`, `SpatialLocation`, `EventType`, `Severity`, `Actor`, `ISOTimestamp`                                                                     | Required  |
| @tarva/ui components          | npm package    | `Card`, `CardHeader`, `CardContent`, `CardFooter`, `Button` (variant prop), `Tooltip`                                                                                         | Required  |
| ZUI canvas panning state      | WS-1.1         | `[data-panning="true"]` attribute on canvas container for glass performance fallback                                                                                          | Required  |
| VISUAL-DESIGN-SPEC.md         | Discovery docs | Glass recipes (Section 1.7, 4.1), luminous border recipe (Section 4.4), Z3 typography scale (Section 3.2), receipt stamp typography (Section 3.4), glow recipes (Section 1.8) | Reference |
| Framer Motion                 | npm package    | `motion/react` for entrance animations, `AnimatePresence` for receipt stamp overlay                                                                                           | Required  |
| Lucide React                  | npm package    | Icon components referenced by `StationAction.icon` and `StationLayout.header.icon`                                                                                            | Required  |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  components/
    stations/
      station-panel.tsx           # Root 3-zone layout with glass material
      station-header.tsx          # Header zone (district name + station title + icon)
      station-body.tsx            # Body zone with bodyType slot routing
      station-actions.tsx         # Actions zone (receipt-wrapped buttons)
      receipt-stamp.tsx           # Visual receipt stamp overlay animation
      station-panel.css           # Glass material, luminous border, and receipt CSS
      use-receipt-stamp.ts        # Hook: creates receipt + fires stamp animation
      station-context.tsx         # React context for station-level shared state
      index.ts                    # Barrel export
    stations/
      __tests__/
        station-panel.test.tsx
        station-actions.test.tsx
        use-receipt-stamp.test.ts
```

### 4.2 Glass Material CSS -- `src/components/stations/station-panel.css`

All glass recipes are defined as utility classes for composability. Values are taken verbatim from VISUAL-DESIGN-SPEC.md Sections 1.7 and 4.1. Station panels use the "Active Glass" tier because they are always the focused element at Z3.

```css
/* =================================================================
   Station Panel -- Glass Material + Luminous Border
   Source: VISUAL-DESIGN-SPEC.md Sections 1.7, 4.1, 4.4
   ================================================================= */

/* -----------------------------------------------------------------
   Glass: Standard (Z2 unfurled, resting)
   VISUAL-DESIGN-SPEC.md Section 1.7 "Standard Glass Panel"
   ----------------------------------------------------------------- */
.station-glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px) saturate(120%);
  -webkit-backdrop-filter: blur(12px) saturate(120%);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.03);
}

/* -----------------------------------------------------------------
   Glass: Active (Z3 focused station -- the primary station style)
   VISUAL-DESIGN-SPEC.md Section 1.7 "Active Glass Panel"
   ----------------------------------------------------------------- */
.station-glass-active {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 1px 0 rgba(224, 82, 0, 0.3);
}

/* -----------------------------------------------------------------
   Glass: Hover (station hovered at Z2/Z3)
   Blend between standard and active with brighter border.
   ----------------------------------------------------------------- */
.station-glass-hover {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    0 0 1px 0 rgba(224, 82, 0, 0.3);
}

/* -----------------------------------------------------------------
   Luminous Border: Ember (default station glow)
   VISUAL-DESIGN-SPEC.md Section 4.4 — 3-layer technique.
   "The border color must match the glow color exactly
   (same hue/saturation, only opacity differs)."
   ----------------------------------------------------------------- */
.station-luminous-border {
  border: 1px solid rgba(224, 82, 0, 0.25);
  box-shadow:
    /* Layer 1: Outer glow bleed past the border */
    0 0 10px rgba(224, 82, 0, 0.1),
    /* Layer 2: Tight outer glow */ 0 0 3px rgba(224, 82, 0, 0.18),
    /* Layer 3: Inner glow bleed inward from the border */ inset 0 0 10px rgba(224, 82, 0, 0.04),
    /* Layer 4: Tight inner glow */ inset 0 0 2px rgba(224, 82, 0, 0.08);
}

/* -----------------------------------------------------------------
   Luminous Border: Status color variants.
   Same 3-layer technique, color-shifted per status.
   ----------------------------------------------------------------- */
.station-luminous-border-healthy {
  border: 1px solid rgba(34, 197, 94, 0.25);
  box-shadow:
    0 0 10px rgba(34, 197, 94, 0.1),
    0 0 3px rgba(34, 197, 94, 0.18),
    inset 0 0 10px rgba(34, 197, 94, 0.04),
    inset 0 0 2px rgba(34, 197, 94, 0.08);
}

.station-luminous-border-warning {
  border: 1px solid rgba(234, 179, 8, 0.25);
  box-shadow:
    0 0 10px rgba(234, 179, 8, 0.1),
    0 0 3px rgba(234, 179, 8, 0.18),
    inset 0 0 10px rgba(234, 179, 8, 0.04),
    inset 0 0 2px rgba(234, 179, 8, 0.08);
}

.station-luminous-border-error {
  border: 1px solid rgba(239, 68, 68, 0.25);
  box-shadow:
    0 0 10px rgba(239, 68, 68, 0.1),
    0 0 3px rgba(239, 68, 68, 0.18),
    inset 0 0 10px rgba(239, 68, 68, 0.04),
    inset 0 0 2px rgba(239, 68, 68, 0.08);
}

.station-luminous-border-offline {
  border: 1px solid rgba(107, 114, 128, 0.15);
  box-shadow:
    0 0 10px rgba(107, 114, 128, 0.06),
    0 0 3px rgba(107, 114, 128, 0.1),
    inset 0 0 10px rgba(107, 114, 128, 0.02),
    inset 0 0 2px rgba(107, 114, 128, 0.04);
}

/* -----------------------------------------------------------------
   Combined: Glass + Luminous Border (the full station treatment).
   Applied when a station is at Z3 and is the focused panel.
   Merges the active glass background with the luminous border glow.
   ----------------------------------------------------------------- */
.station-panel {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(16px) saturate(130%);
  -webkit-backdrop-filter: blur(16px) saturate(130%);
  border: 1px solid rgba(224, 82, 0, 0.25);
  box-shadow:
    /* Top-edge highlight (glass) */
    inset 0 1px 0 0 rgba(255, 255, 255, 0.05),
    /* Luminous border outer bleed */ 0 0 10px rgba(224, 82, 0, 0.1),
    /* Luminous border tight outer */ 0 0 3px rgba(224, 82, 0, 0.18),
    /* Luminous border inner bleed */ inset 0 0 10px rgba(224, 82, 0, 0.04),
    /* Luminous border tight inner */ inset 0 0 2px rgba(224, 82, 0, 0.08);
  border-radius: 16px;
  contain: layout style paint;
}

/* -----------------------------------------------------------------
   Pan/Zoom Performance Fallback
   VISUAL-DESIGN-SPEC.md Section 4.3 rule #2:
   "Avoid backdrop-filter on moving elements."
   When canvas is panning, swap glass to opaque dark background.
   ----------------------------------------------------------------- */
[data-panning='true'] .station-panel,
[data-panning='true'] .station-glass,
[data-panning='true'] .station-glass-active {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--color-deep); /* #0f161f — matches --card */
  box-shadow: 0 0 8px rgba(224, 82, 0, 0.1); /* single-layer glow */
}

/* -----------------------------------------------------------------
   Reduced Motion: Disable glow pulse, simplify to static border.
   ----------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .station-panel {
    box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
    transition: none;
  }
}

/* -----------------------------------------------------------------
   Receipt Stamp Overlay
   VISUAL-DESIGN-SPEC.md Section 3.4 Receipt Stamp Typography
   ----------------------------------------------------------------- */
.receipt-stamp-overlay {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-ember-bright);
  opacity: 0.75;
}

.receipt-stamp-overlay .separator {
  opacity: 0.35;
  margin: 0 0.4em;
}

.receipt-stamp-overlay .trace-id {
  color: var(--color-ember-glow);
  opacity: 0.9;
}

.receipt-stamp-overlay .timestamp {
  color: var(--color-text-secondary);
  opacity: 0.6;
}
```

### 4.3 Station Context -- `src/components/stations/station-context.tsx`

Provides station-level shared state (district identity, receipt stamper, template reference) to all child components without prop drilling.

```tsx
'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { AppIdentifier } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'

// ============================================================================
// Context Shape
// ============================================================================

export interface StationContextValue {
  /** Which district this station belongs to. */
  readonly districtId: AppIdentifier
  /** The template driving this station's layout. */
  readonly template: StationTemplate
  /** The receipt store for recording actions. */
  readonly receiptStore: ReceiptStore
  /**
   * Trigger a receipt stamp for a station action.
   * Returns the generated trace ID (4-char hex, e.g., "7F2A").
   *
   * @param actionId - The StationAction.id that was triggered.
   * @param result - Human-readable result summary (max 120 chars).
   */
  readonly stampReceipt: (actionId: string, result: string) => string
}

// ============================================================================
// Context
// ============================================================================

const StationContext = createContext<StationContextValue | null>(null)

/** Read station context. Throws if used outside a StationPanel. */
export function useStationContext(): StationContextValue {
  const ctx = useContext(StationContext)
  if (!ctx) {
    throw new Error(
      'useStationContext must be used within a <StationPanel>. ' +
        'Ensure the component is rendered inside a StationPanel.'
    )
  }
  return ctx
}

// ============================================================================
// Provider
// ============================================================================

export interface StationProviderProps {
  readonly value: StationContextValue
  readonly children: ReactNode
}

export function StationProvider({ value, children }: StationProviderProps) {
  return <StationContext.Provider value={value}>{children}</StationContext.Provider>
}
```

### 4.4 Receipt Stamp Hook -- `src/components/stations/use-receipt-stamp.ts`

Generates receipt records for station actions. Phase 2 uses `InMemoryReceiptStore` from WS-1.7. The hook returns a `stampReceipt` function and manages the stamp animation visibility state.

````ts
'use client'

import { useCallback, useState } from 'react'
import type { ReceiptStore, ReceiptInput } from '@/lib/interfaces/receipt-store'
import type { AppIdentifier, SpatialLocation } from '@/lib/interfaces/types'

// ============================================================================
// Types
// ============================================================================

export interface ReceiptStampState {
  /** Whether the stamp overlay is currently visible. */
  readonly isVisible: boolean
  /** Trace ID of the most recent stamp (4-char uppercase hex). */
  readonly traceId: string | null
  /** Timestamp of the most recent stamp (ISO 8601). */
  readonly timestamp: string | null
  /** Result summary of the most recent stamp. */
  readonly result: string | null
}

export interface UseReceiptStampReturn {
  /** Current stamp animation state. */
  readonly stampState: ReceiptStampState
  /**
   * Record an action receipt and trigger the stamp animation.
   *
   * @param actionId - The StationAction.id that was triggered.
   * @param result - Human-readable result summary (max 120 chars).
   * @returns The generated 4-char trace ID.
   */
  readonly stampReceipt: (actionId: string, result: string) => string
}

// ============================================================================
// Helpers
// ============================================================================

/** Generate a 4-character uppercase hex trace ID. */
function generateTraceId(): string {
  return Math.random().toString(16).slice(2, 6).toUpperCase()
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for creating receipt records and managing the stamp animation.
 *
 * Usage:
 * ```tsx
 * const { stampState, stampReceipt } = useReceiptStamp({
 *   receiptStore,
 *   districtId: 'agent-builder',
 *   stationName: 'Pipeline',
 * })
 *
 * // In an action handler:
 * stampReceipt('refresh-runs', 'Refreshed 12 pipeline runs')
 * ```
 *
 * The stamp animation auto-hides after 2000ms.
 *
 * @param receiptStore - The ReceiptStore to record receipts to.
 * @param districtId - The district this station belongs to.
 * @param stationName - The station name for the receipt summary.
 */
export function useReceiptStamp({
  receiptStore,
  districtId,
  stationName,
}: {
  receiptStore: ReceiptStore
  districtId: AppIdentifier
  stationName: string
}): UseReceiptStampReturn {
  const [stampState, setStampState] = useState<ReceiptStampState>({
    isVisible: false,
    traceId: null,
    timestamp: null,
    result: null,
  })

  const stampReceipt = useCallback(
    (actionId: string, result: string): string => {
      const traceId = generateTraceId()
      const timestamp = new Date().toISOString()

      // Build the receipt input per WS-1.7 ReceiptInput shape.
      const receiptInput: ReceiptInput = {
        source: 'launch',
        eventType: 'action',
        severity: 'info',
        summary: `${stationName}: ${result}`.slice(0, 120),
        detail: `Action "${actionId}" executed in ${stationName} station of district "${districtId}".`,
        actor: 'human',
        location: {
          semanticLevel: 'Z3',
          district: districtId,
          station: stationName,
        },
        target: {
          type: 'station',
          districtId,
          stationId: stationName.toLowerCase(),
        },
        tags: [districtId, stationName.toLowerCase(), actionId],
      }

      // Record to the store (InMemoryReceiptStore in Phase 2).
      receiptStore.record(receiptInput)

      // Show the stamp animation.
      setStampState({
        isVisible: true,
        traceId,
        timestamp,
        result,
      })

      // Auto-hide after 2000ms.
      setTimeout(() => {
        setStampState((prev) => ({ ...prev, isVisible: false }))
      }, 2000)

      return traceId
    },
    [receiptStore, districtId, stationName]
  )

  return { stampState, stampReceipt }
}
````

### 4.5 Receipt Stamp Component -- `src/components/stations/receipt-stamp.tsx`

Visual overlay that renders the receipt trace ID + timestamp + result readout using the VISUAL-DESIGN-SPEC.md Section 3.4 receipt typography. Fades in/out with Framer Motion.

```tsx
'use client'

import { AnimatePresence, motion } from 'motion/react'
import type { ReceiptStampState } from './use-receipt-stamp'
import './station-panel.css'

// ============================================================================
// Props
// ============================================================================

export interface ReceiptStampProps {
  /** Current stamp state from useReceiptStamp(). */
  readonly state: ReceiptStampState
}

// ============================================================================
// Component
// ============================================================================

/**
 * Receipt stamp overlay.
 *
 * Renders a brief readout when a station action is executed:
 * `ACTION OK / TRACE: 7F2A / 2026-02-25T15:42:18Z`
 *
 * Typography follows VISUAL-DESIGN-SPEC.md Section 3.4:
 * - Font: Geist Mono, 10px, 500 weight, 0.12em tracking, uppercase
 * - Trace ID in --color-ember-glow (brightest)
 * - Separators at 0.35 opacity
 * - Timestamp in --color-text-secondary at 0.6 opacity
 *
 * Animation: fade-in from opacity 0 + translateY(4px), hold 1400ms, fade-out.
 * Total visibility: 2000ms (matches useReceiptStamp auto-hide timer).
 */
export function ReceiptStamp({ state }: ReceiptStampProps) {
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <AnimatePresence>
      {state.isVisible && state.traceId && (
        <motion.div
          className="receipt-stamp-overlay pointer-events-none absolute right-0 bottom-3 left-0 flex items-center justify-center"
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -2 }}
          transition={{
            duration: reducedMotion ? 0 : 0.3,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Result label */}
          <span>ACTION OK</span>

          {/* Separator */}
          <span className="separator">/</span>

          {/* Trace ID (brightest) */}
          <span className="trace-id">TRACE: {state.traceId}</span>

          {/* Separator */}
          <span className="separator">/</span>

          {/* Timestamp (most muted) */}
          <span className="timestamp">{formatStampTime(state.timestamp)}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// Helpers
// ============================================================================

/** Format an ISO timestamp to a compact HH:MM:SS display. */
function formatStampTime(iso: string | null): string {
  if (!iso) return '--:--:--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return '--:--:--'
  }
}
```

### 4.6 Station Header -- `src/components/stations/station-header.tsx`

```tsx
'use client'

import { type ComponentProps, type ReactNode } from 'react'
import { CardHeader, CardTitle } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import { useStationContext } from './station-context'

// ============================================================================
// Props
// ============================================================================

export interface StationHeaderProps extends ComponentProps<'div'> {
  /**
   * Optional override for the station title.
   * Defaults to `template.layout.header.title` from context.
   */
  readonly title?: string
  /**
   * Optional Lucide icon element rendered before the title.
   * Defaults to resolving `template.layout.header.icon` from context.
   */
  readonly icon?: ReactNode
  /**
   * Optional trailing element (e.g., status badge, close button).
   */
  readonly trailing?: ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station header zone (Zone 1 of 3).
 *
 * Renders the district display name as a subtle context label above the
 * station title. Typography follows VISUAL-DESIGN-SPEC.md Z3 scale:
 *
 * - District label: 11px, Geist Sans, 400 weight, 0.04em tracking,
 *   uppercase, --color-text-tertiary, opacity 0.5
 * - Station title: 16px, Geist Sans, 600 weight, 0.02em tracking,
 *   --color-text-primary, opacity 1.0
 */
export function StationHeader({ title, icon, trailing, className, ...props }: StationHeaderProps) {
  const { districtId, template } = useStationContext()

  const displayTitle = title ?? template.layout.header.title
  const districtName = APP_DISPLAY_NAMES[districtId]

  return (
    <CardHeader className={cn('border-b border-white/[0.04] px-5 pt-4 pb-3', className)} {...props}>
      {/* District context label */}
      <span
        className="font-sans text-[11px] font-normal tracking-[0.04em] uppercase opacity-50"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {districtName}
      </span>

      {/* Station title row */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          {icon && (
            <span className="shrink-0 opacity-70" style={{ color: 'var(--color-ember-bright)' }}>
              {icon}
            </span>
          )}
          <span
            className="font-sans text-[16px] font-semibold tracking-[0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {displayTitle}
          </span>
        </CardTitle>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </div>
    </CardHeader>
  )
}
```

### 4.7 Station Body -- `src/components/stations/station-body.tsx`

```tsx
'use client'

import { type ComponentProps, type ReactNode } from 'react'
import { CardContent } from '@tarva/ui'
import { ScrollArea } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { useStationContext } from './station-context'

// ============================================================================
// Body Type Slots
// ============================================================================

/**
 * Mapping from `StationLayout.bodyType` to the render slot name.
 * District workstreams (WS-2.2-2.5) provide content for these slots.
 *
 * | bodyType   | Expected content                                          |
 * |------------|-----------------------------------------------------------|
 * | 'table'    | Data table: runs, artifacts, conversations, dependencies  |
 * | 'list'     | Vertical list: alerts, errors, dependencies               |
 * | 'metrics'  | Key-value metric grid: status dashboard, health overview  |
 * | 'launch'   | App launch panel: URL, version, launch + copy buttons     |
 * | 'custom'   | Free-form content: anything the district needs            |
 */
export type BodyTypeSlot = 'table' | 'list' | 'metrics' | 'launch' | 'custom'

// ============================================================================
// Props
// ============================================================================

export interface StationBodyProps extends ComponentProps<'div'> {
  /**
   * The station body content.
   *
   * District workstreams render their domain-specific content here.
   * The body type from the template determines scrolling behavior:
   * - 'table' and 'list' get ScrollArea wrapping for overflow
   * - 'metrics' and 'launch' are non-scrollable (fixed height)
   * - 'custom' is passed through without modification
   */
  readonly children: ReactNode
  /**
   * Optional max-height for the scrollable body area.
   * Defaults to 280px. Set to 'none' to disable scroll constraint.
   */
  readonly maxHeight?: number | 'none'
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station body zone (Zone 2 of 3).
 *
 * Typography follows VISUAL-DESIGN-SPEC.md Z3 scale:
 * - Body text: 14px, Geist Sans, 400 weight, --color-text-primary, opacity 0.85, line-height 1.6
 * - Table header: 11px, Geist Sans, 600 weight, 0.04em tracking, uppercase, opacity 0.6
 * - Table data: 13px, Geist Mono, 400 weight, opacity 0.8, line-height 1.4
 * - Table number: 13px, Geist Mono, 500 weight, tabular-nums, opacity 0.85
 *
 * Scrollable body types ('table', 'list') are wrapped in @tarva/ui ScrollArea.
 */
export function StationBody({ children, maxHeight = 280, className, ...props }: StationBodyProps) {
  const { template } = useStationContext()
  const { bodyType } = template.layout

  const isScrollable = bodyType === 'table' || bodyType === 'list'

  const bodyContent = (
    <CardContent
      className={cn('px-5 py-3', 'font-sans text-[14px] leading-[1.6] font-normal', className)}
      style={{
        color: 'var(--color-text-primary)',
        opacity: 0.85,
      }}
      {...props}
    >
      {children}
    </CardContent>
  )

  if (isScrollable && maxHeight !== 'none') {
    return (
      <ScrollArea
        className="flex-1"
        style={{ maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : undefined }}
      >
        {bodyContent}
      </ScrollArea>
    )
  }

  return <div className="flex-1">{bodyContent}</div>
}
```

### 4.8 Station Actions -- `src/components/stations/station-actions.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { CardFooter } from '@tarva/ui'
import { Button } from '@tarva/ui'
import { cn } from '@/lib/utils'
import { useStationContext } from './station-context'
import type { StationAction } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Props
// ============================================================================

export interface StationActionsProps extends ComponentProps<'div'> {
  /**
   * Optional override for the actions to render.
   * Defaults to `template.layout.actions` from context.
   */
  readonly actions?: readonly StationAction[]
  /**
   * Callback invoked when an action command is executed.
   * The station framework calls `stampReceipt` before this callback.
   *
   * @param command - The resolved command string from StationAction.command.
   * @param actionId - The StationAction.id that was triggered.
   */
  readonly onCommand?: (command: string, actionId: string) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Station actions zone (Zone 3 of 3).
 *
 * Renders 1-3 @tarva/ui Button components from the template's action list.
 * Every button click:
 * 1. Calls `stampReceipt(actionId, label)` to generate a receipt record
 * 2. Fires the receipt stamp animation overlay
 * 3. Resolves template variables in the command string (e.g., `${districtId}`)
 * 4. Calls `onCommand(resolvedCommand, actionId)` for the consumer to handle
 *
 * Button typography follows VISUAL-DESIGN-SPEC.md Z3:
 * - Label: 13px, Geist Sans, 500 weight, 0.01em tracking
 */
export function StationActions({
  actions: actionsProp,
  onCommand,
  className,
  ...props
}: StationActionsProps) {
  const { districtId, template, stampReceipt } = useStationContext()

  const actions = actionsProp ?? template.layout.actions

  if (actions.length === 0) return null

  /**
   * Resolve template variables in a command string.
   * Supported variables:
   * - ${districtId} -> the current district identifier
   * - ${stationId} -> the current station name (lowercase)
   *
   * Per WS-1.7 Design Decision D-9: "StationAction.command uses
   * template syntax that is resolved at runtime by the station component."
   */
  function resolveCommand(command: string): string {
    return command
      .replace(/\$\{districtId\}/g, districtId)
      .replace(/\$\{stationId\}/g, template.name)
  }

  function handleAction(action: StationAction): void {
    // Step 1: Receipt stamp (trace + timestamp + result summary).
    stampReceipt(action.id, action.label)

    // Step 2: Resolve template variables and fire the command.
    const resolved = resolveCommand(action.command)
    onCommand?.(resolved, action.id)
  }

  return (
    <CardFooter
      className={cn(
        'flex items-center gap-2 border-t border-white/[0.04] px-5 pt-3 pb-4',
        className
      )}
      {...props}
    >
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant}
          size="sm"
          onClick={() => handleAction(action)}
          className="font-sans text-[13px] font-medium tracking-[0.01em]"
        >
          {action.label}
        </Button>
      ))}
    </CardFooter>
  )
}
```

### 4.9 Station Panel (Root) -- `src/components/stations/station-panel.tsx`

The primary export. Composes all zones into the 3-zone glass panel with luminous border, receipt stamp overlay, and entrance animation.

````tsx
'use client'

import { type ComponentProps, type ReactNode, useMemo } from 'react'
import { motion } from 'motion/react'
import { Card } from '@tarva/ui'
import { cn } from '@/lib/utils'
import type { AppIdentifier, HealthState } from '@/lib/interfaces/types'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import { StationProvider, type StationContextValue } from './station-context'
import { useReceiptStamp } from './use-receipt-stamp'
import { ReceiptStamp } from './receipt-stamp'
import { StationHeader } from './station-header'
import { StationBody } from './station-body'
import { StationActions } from './station-actions'
import './station-panel.css'

// ============================================================================
// Luminous Border Color Map
// ============================================================================

const BORDER_CLASS_MAP: Record<string, string> = {
  ember: 'station-luminous-border',
  healthy: 'station-luminous-border-healthy',
  warning: 'station-luminous-border-warning',
  error: 'station-luminous-border-error',
  offline: 'station-luminous-border-offline',
}

// ============================================================================
// Props
// ============================================================================

export interface StationPanelProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The district this station belongs to. */
  readonly districtId: AppIdentifier
  /** The template driving this station's layout and actions. */
  readonly template: StationTemplate
  /** The receipt store instance for recording action receipts. */
  readonly receiptStore: ReceiptStore
  /**
   * Luminous border color. Defaults to 'ember' (primary accent).
   * Use status colors to indicate station-level health:
   * - 'ember': default, primary accent
   * - 'healthy': station is operational (green glow)
   * - 'warning': station has degraded data (amber glow)
   * - 'error': station is reporting errors (red glow)
   * - 'offline': station's app is offline (dim gray glow)
   */
  readonly glowColor?: 'ember' | 'healthy' | 'warning' | 'error' | 'offline'
  /**
   * Callback invoked when an action command is executed.
   * Receives the resolved command string (template variables replaced)
   * and the action ID.
   */
  readonly onCommand?: (command: string, actionId: string) => void
  /**
   * Entrance animation stagger index.
   * Controls the delay for the staggered unfurl animation.
   * 0 = first station (no delay), 1 = second (100ms delay), etc.
   */
  readonly staggerIndex?: number
  /**
   * Whether to animate the entrance. Set to false to skip entrance
   * animation (e.g., when the station is already visible).
   */
  readonly animateEntrance?: boolean
  /**
   * Station body content. Rendered inside the StationBody zone.
   * District workstreams provide domain-specific content here.
   */
  readonly children: ReactNode
  /**
   * Optional header props override (icon, trailing element, title).
   */
  readonly headerProps?: {
    readonly title?: string
    readonly icon?: ReactNode
    readonly trailing?: ReactNode
  }
  /**
   * Optional override for the body max scroll height.
   */
  readonly bodyMaxHeight?: number | 'none'
  /**
   * Override which actions to render. Defaults to template.layout.actions.
   */
  readonly actions?: StationTemplate['layout']['actions']
}

// ============================================================================
// Component
// ============================================================================

/**
 * StationPanel -- The reusable 3-zone station framework.
 *
 * Layout:
 * ```
 * +-------------------------------------------+
 * | HEADER: District Name / Station Title     | <- Zone 1
 * |-------------------------------------------|
 * | BODY: Domain-specific content             | <- Zone 2
 * |   (table | list | metrics | launch | custom)
 * |-------------------------------------------|
 * | ACTIONS: [Button 1] [Button 2]            | <- Zone 3
 * +-------------------------------------------+
 * | RECEIPT STAMP: ACTION OK / TRACE: 7F2A    | <- Overlay
 * +-------------------------------------------+
 * ```
 *
 * Glass material: Active Glass (VISUAL-DESIGN-SPEC.md Section 1.7)
 * - background: rgba(255, 255, 255, 0.06)
 * - backdrop-filter: blur(16px) saturate(130%)
 * - border: ember luminous (3-layer glow per Section 4.4)
 * - top-edge highlight: inset 0 1px rgba(255,255,255,0.05)
 *
 * Every action triggers the receipt stamp ritual (AD-6):
 * trace ID (4-char hex) + timestamp + result summary.
 *
 * Performance: backdrop-filter disabled during canvas pan
 * via [data-panning="true"] selector (Section 4.3).
 *
 * Entrance animation: Framer Motion fade-in + translateY(12px),
 * staggered by 100ms per station index. Skipped when
 * prefers-reduced-motion is set.
 */
export function StationPanel({
  districtId,
  template,
  receiptStore,
  glowColor = 'ember',
  onCommand,
  staggerIndex = 0,
  animateEntrance = true,
  children,
  headerProps,
  bodyMaxHeight,
  actions,
  className,
  ...props
}: StationPanelProps) {
  // Receipt stamp hook.
  const { stampState, stampReceipt } = useReceiptStamp({
    receiptStore,
    districtId,
    stationName: template.displayName,
  })

  // Station context value (memoized to prevent re-renders).
  const contextValue = useMemo<StationContextValue>(
    () => ({
      districtId,
      template,
      receiptStore,
      stampReceipt,
    }),
    [districtId, template, receiptStore, stampReceipt]
  )

  // Resolve luminous border class.
  const borderClass = BORDER_CLASS_MAP[glowColor] ?? BORDER_CLASS_MAP.ember

  // Detect reduced motion preference.
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Entrance animation variants.
  const entranceDelay = staggerIndex * 0.1 // 100ms stagger per station

  const panelContent = (
    <Card
      className={cn(
        'station-panel',
        borderClass,
        'relative flex flex-col overflow-hidden',
        'min-h-[200px] w-full',
        className
      )}
      {...props}
    >
      {/* Zone 1: Header */}
      <StationHeader {...headerProps} />

      {/* Zone 2: Body */}
      <StationBody maxHeight={bodyMaxHeight}>{children}</StationBody>

      {/* Zone 3: Actions */}
      <StationActions actions={actions} onCommand={onCommand} />

      {/* Receipt stamp overlay (absolute positioned at bottom) */}
      <ReceiptStamp state={stampState} />
    </Card>
  )

  // Wrap in motion.div for entrance animation.
  if (animateEntrance && !reducedMotion) {
    return (
      <StationProvider value={contextValue}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            delay: entranceDelay,
            ease: [0.22, 1, 0.36, 1], // --ease-morph
          }}
        >
          {panelContent}
        </motion.div>
      </StationProvider>
    )
  }

  return <StationProvider value={contextValue}>{panelContent}</StationProvider>
}
````

### 4.10 Barrel Export -- `src/components/stations/index.ts`

```ts
// Station Panel Framework — Public API
// All district workstreams (WS-2.2-2.5) import from this barrel.

// Components
export { StationPanel } from './station-panel'
export { StationHeader } from './station-header'
export { StationBody } from './station-body'
export { StationActions } from './station-actions'
export { ReceiptStamp } from './receipt-stamp'

// Context
export { StationProvider, useStationContext } from './station-context'

// Hooks
export { useReceiptStamp } from './use-receipt-stamp'

// Types (re-exported for convenience)
export type { StationPanelProps } from './station-panel'
export type { StationHeaderProps } from './station-header'
export type { StationBodyProps, BodyTypeSlot } from './station-body'
export type { StationActionsProps } from './station-actions'
export type { ReceiptStampProps } from './receipt-stamp'
export type { StationContextValue } from './station-context'
export type { ReceiptStampState, UseReceiptStampReturn } from './use-receipt-stamp'
```

### 4.11 Usage Example (for WS-2.2-2.5 implementers)

This example shows how a district workstream (e.g., Agent Builder WS-2.2) uses the station framework to render a Pipeline station.

```tsx
// src/components/districts/agent-builder/pipeline-station.tsx
import { StationPanel } from '@/components/stations'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'

interface PipelineStationProps {
  template: StationTemplate
  receiptStore: ReceiptStore
}

export function PipelineStation({ template, receiptStore }: PipelineStationProps) {
  return (
    <StationPanel
      districtId="agent-builder"
      template={template}
      receiptStore={receiptStore}
      glowColor="healthy"
      staggerIndex={2}
      onCommand={(command, actionId) => {
        // Handle resolved commands (e.g., "refresh agent-builder")
        console.log(`[Pipeline] ${actionId}: ${command}`)
      }}
    >
      {/* Domain-specific body content */}
      <table className="w-full">
        <thead>
          <tr>
            <th className="pb-2 text-left font-sans text-[11px] font-semibold tracking-[0.04em] uppercase opacity-60">
              Run
            </th>
            <th className="pb-2 text-left font-sans text-[11px] font-semibold tracking-[0.04em] uppercase opacity-60">
              Status
            </th>
            <th className="pb-2 text-right font-sans text-[11px] font-semibold tracking-[0.04em] uppercase opacity-60">
              Duration
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 font-mono text-[13px] leading-[1.4] font-normal opacity-80">
              skill-extractor-v2
            </td>
            <td className="py-1 font-mono text-[13px] leading-[1.4] font-medium tabular-nums opacity-85">
              ACTIVE
            </td>
            <td className="py-1 text-right font-mono text-[13px] leading-[1.4] font-medium tabular-nums opacity-85">
              4m 23s
            </td>
          </tr>
        </tbody>
      </table>
    </StationPanel>
  )
}
```

---

## 5. Acceptance Criteria

| ID    | Criterion                                                                                                                                                                                                          | Verification Method                                                                                                                                                                      |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | `StationPanel` renders a 3-zone layout (header, body, actions) with visible zone boundaries (border separators)                                                                                                    | Visual inspection in Storybook; snapshot test confirms 3 `data-slot` regions                                                                                                             |
| AC-2  | Glass material matches VISUAL-DESIGN-SPEC.md "Active Glass Panel" recipe: `background: rgba(255,255,255,0.06)`, `backdrop-filter: blur(16px) saturate(130%)`, `box-shadow: inset 0 1px 0 0 rgba(255,255,255,0.05)` | Computed style assertion in unit test                                                                                                                                                    |
| AC-3  | Luminous border (ember) renders the 4-shadow-layer technique: outer bleed (10px, 0.10), tight outer (3px, 0.18), inner bleed (10px, 0.04), tight inner (2px, 0.08), with `border: 1px solid rgba(224,82,0,0.25)`   | Computed style assertion                                                                                                                                                                 |
| AC-4  | `glowColor` prop switches border glow to healthy (green), warning (amber), error (red), or offline (gray) using matching RGB values at matching opacity levels                                                     | Visual test with all 5 color states; CSS class assertion                                                                                                                                 |
| AC-5  | Every action button click triggers `useReceiptStamp`: creates a `ReceiptInput`, calls `receiptStore.record()`, displays a receipt stamp overlay with trace ID and timestamp                                        | Unit test: mock `ReceiptStore`, click action, verify `record()` called with correct `ReceiptInput` shape; verify stamp overlay renders with trace ID                                     |
| AC-6  | Receipt stamp overlay renders with VISUAL-DESIGN-SPEC.md Section 3.4 typography: Geist Mono, 10px, 500 weight, 0.12em tracking, uppercase, `--color-ember-bright` at 0.75 opacity                                  | Computed style assertion on stamp overlay element                                                                                                                                        |
| AC-7  | Receipt stamp auto-hides after 2000ms                                                                                                                                                                              | Unit test with fake timers: verify stamp `isVisible` transitions from true to false after 2000ms                                                                                         |
| AC-8  | `StationHeader` renders district display name (from `APP_DISPLAY_NAMES`) as a context label and station title from template                                                                                        | Render test: verify district name text content matches `APP_DISPLAY_NAMES[districtId]`; verify title text matches `template.layout.header.title`                                         |
| AC-9  | `StationBody` wraps 'table' and 'list' body types in `ScrollArea` with default 280px max-height; 'metrics', 'launch', and 'custom' types are not wrapped                                                           | Render test: verify ScrollArea presence for table body type; verify absence for metrics body type                                                                                        |
| AC-10 | `StationActions` resolves template variables in command strings: `${districtId}` and `${stationId}` are replaced before `onCommand` is called                                                                      | Unit test: mock `onCommand`, click action with `command: "open ${districtId}"`, verify callback receives `"open agent-builder"`                                                          |
| AC-11 | When `[data-panning="true"]` is set on a parent element, `backdrop-filter` is removed and background changes to `var(--color-deep)`                                                                                | CSS specificity test: set data attribute, verify computed `backdrop-filter` is `none`                                                                                                    |
| AC-12 | When `prefers-reduced-motion: reduce` is active, entrance animation is skipped (no Framer Motion wrapper) and receipt stamp transitions are instant                                                                | Unit test with `matchMedia` mock; verify no `motion.div` wrapper; verify stamp appears/disappears without animation                                                                      |
| AC-13 | Entrance animation uses `--ease-morph` curve `(0.22, 1, 0.36, 1)` with 400ms duration and 100ms stagger per station index                                                                                          | Framer Motion props assertion: verify `transition.ease` matches the curve; verify `transition.delay` equals `staggerIndex * 0.1`                                                         |
| AC-14 | All component props have TypeScript interfaces with JSDoc comments                                                                                                                                                 | TypeScript compilation check; no `any` types in public API                                                                                                                               |
| AC-15 | Barrel export (`index.ts`) re-exports all components, hooks, context, and type interfaces                                                                                                                          | Import test: `import { StationPanel, StationHeader, StationBody, StationActions, ReceiptStamp, useReceiptStamp, useStationContext } from '@/components/stations'` compiles without error |

---

## 6. Design Decisions

| ID   | Decision                                                                                        | Rationale                                                                                                                                                                                                                                                                                                                                               | Reference                                                                                      |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| D-1  | Use `@tarva/ui` Card as the structural base, override all visual styles with station-panel CSS  | Card provides the semantic `data-slot` pattern, flex column layout, and slot components (CardHeader, CardContent, CardFooter) that map to our 3-zone layout. We override `bg-card`, `border`, `shadow-sm` with glass material + luminous border. This avoids reimplementing the slot/composition pattern while achieving the Oblivion aesthetic.        | @tarva/ui Card source; VISUAL-DESIGN-SPEC.md Section 1.7                                       |
| D-2  | Glass material at "Active" tier for all Z3 station panels (not "Standard")                      | At Z3, the station IS the focused element. The Active Glass recipe (`blur(16px)`, `saturate(130%)`, ember tint in border shadow) provides the correct visual weight for the primary interaction surface. Standard Glass is reserved for Z2 unfurled stations that are not yet focused.                                                                  | VISUAL-DESIGN-SPEC.md Section 4.1 (Active glass: focused/selected)                             |
| D-3  | Luminous border uses CSS classes, not inline styles or Tailwind utilities                       | The 4-layer `box-shadow` values are too complex for Tailwind arbitrary values (`shadow-[...]`) and would create unreadable markup. CSS classes also enable the `[data-panning]` performance selector to override them cleanly. Status color variants are pre-defined classes rather than runtime-computed, avoiding `style` prop calculations.          | VISUAL-DESIGN-SPEC.md Section 4.4; performance Section 4.3                                     |
| D-4  | Receipt stamp fires on EVERY action button, not selectively                                     | Per combined-recommendations.md: "Every user action triggers receipt stamp ritual." The receipt is the audit trail -- no action should escape it. District workstreams do not choose which actions generate receipts; the framework enforces it. Phase 3 filtering (e.g., debouncing rapid clicks) is the Evidence Ledger's concern, not the station's. | AD-6 "Mutations-only receipts"; combined-recommendations.md "Station Panels (Z3)"              |
| D-5  | Receipt stamp is a visual overlay inside the station panel, not a toast/snackbar                | The stamp is part of the station's visual language -- a "receipt printed" effect that reinforces the audit trail metaphor. A toast would feel disconnected from the action context. The overlay is absolute-positioned at the panel bottom, inside `overflow: hidden`, so it never escapes the panel bounds.                                            | VISUAL-DESIGN-SPEC.md Section 3.4; storyboard frames 8-10                                      |
| D-6  | `useReceiptStamp` uses `setTimeout` for auto-hide (not Framer Motion `onAnimationComplete`)     | The stamp visibility is a state concern, not an animation concern. `setTimeout(2000)` is simpler, testable with fake timers, and decoupled from the animation library. The Framer Motion `exit` animation handles the visual fade-out; the timeout controls when `isVisible` flips to `false`.                                                          | Testability; separation of concerns                                                            |
| D-7  | Template variable resolution (`${districtId}`) happens in `StationActions`, not in the registry | Per WS-1.7 D-9: "Action commands reference context variables resolved at runtime by the station component." The registry stores templates as static configuration. Variable resolution is a rendering-time concern because the same template might render in different contexts (e.g., a universal template rendered in different districts).           | WS-1.7 Design Decision D-9                                                                     |
| D-8  | Body type routing uses `children` prop (not render props or component registry)                 | District workstreams know their own body content. The `StationBody` component provides the scroll wrapping and typography context; the district passes its table/list/metrics JSX as `children`. A component registry would add indirection without benefit -- there is no runtime body-type switching in Phase 2.                                      | Simplicity; Phase 3 can add a registry if dynamic body selection is needed                     |
| D-9  | Station context (`StationProvider`) is used instead of prop drilling                            | Three nested components (Header, Body, Actions) all need `districtId`, `template`, and `stampReceipt`. Prop drilling through three levels creates brittle coupling and noisy prop interfaces. Context is the standard React solution for this pattern.                                                                                                  | React best practices; component composition                                                    |
| D-10 | `border-radius: 16px` on the station panel (not matching capsule's 28px)                        | At Z3, stations are larger than capsules and sit in a different visual context. 28px radius at station scale would look overly rounded. 16px provides the "squircle feel" from the design spec while maintaining data density. Capsule radius is 28px at 192x228px; stations are wider and need tighter corners.                                        | VISUAL-DESIGN-SPEC.md Section 2.1 (capsule radius rationale applies inversely at larger scale) |

---

## 7. Risks

| ID  | Risk                                                                                                              | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R-1 | `backdrop-filter` compositing cost at Z3 with 3-5 station panels visible simultaneously                           | Medium     | Medium | Medium   | CSS `contain: layout style paint` on each panel isolates compositing work. The `[data-panning]` fallback removes `backdrop-filter` during motion. If static performance is still poor, reduce to `blur(12px)` or replace with semi-opaque `--color-deep` background.                                                                 |
| R-2 | Receipt stamp `setTimeout(2000)` may fire after component unmount (memory leak, setState on unmounted)            | Low        | Low    | Low      | Use `useEffect` cleanup to clear the timeout on unmount. React 19's automatic cleanup may handle this, but explicit cleanup is safer.                                                                                                                                                                                                |
| R-3 | Luminous border 4-layer `box-shadow` renders differently across browsers (Safari vs Chrome glow spread)           | Medium     | Low    | Low      | The opacity values are conservative (0.04-0.18). Cross-browser visual test in Chrome and Safari. Fallback: reduce to 2-layer glow if Safari diverges visually.                                                                                                                                                                       |
| R-4 | `@tarva/ui` Card component updates in a future version break the slot pattern or className override               | Low        | High   | Medium   | Pin `@tarva/ui` version in `package.json`. The Card component is simple (pure className composition); breaking changes are unlikely. If Card changes, the station CSS overrides are isolated in `station-panel.css`.                                                                                                                 |
| R-5 | District workstreams (WS-2.2-2.5) find the `children` body pattern too restrictive for complex content            | Medium     | Medium | Medium   | The `StationBody` is intentionally minimal -- it provides scroll wrapping and typography context. Districts can render any JSX inside. If a district needs to break out of the body constraints, `bodyMaxHeight="none"` removes scroll limits. Phase 3 can add a body component registry if dynamic body selection proves necessary. |
| R-6 | Receipt stamp animation overlaps with action side effects (e.g., opening a new tab) when both fire simultaneously | Low        | Low    | Low      | The stamp is purely visual (opacity overlay). It does not block interaction. The action `onCommand` callback fires synchronously before the stamp animation starts, so the tab opens immediately while the stamp fades in.                                                                                                           |
| R-7 | `ReceiptInput` shape from WS-1.7 changes before WS-2.6 implementation begins                                      | Low        | Medium | Low      | `ReceiptInput` is defined in WS-1.7 with a stable 12-field schema from the AIA assessment. The `useReceiptStamp` hook constructs the input object in one place; any schema change requires updating only this hook.                                                                                                                  |

---

## 8. Implementation Checklist

Ordered by dependency. Each item should be a single, testable commit.

- [ ] 1. Create file structure: `src/components/stations/` with all files listed in Section 4.1.
- [ ] 2. Write `station-panel.css` with all glass material classes, luminous border classes (ember + 4 status variants), combined `.station-panel` class, `[data-panning]` performance fallback, `prefers-reduced-motion` override, and receipt stamp typography classes. (Deliverable 4.2)
- [ ] 3. Implement `station-context.tsx` with `StationContextValue`, `StationProvider`, and `useStationContext` hook. (Deliverable 4.3)
- [ ] 4. Implement `use-receipt-stamp.ts` with `generateTraceId()`, `ReceiptStampState`, and `useReceiptStamp()` hook including auto-hide timeout and cleanup. (Deliverable 4.4)
- [ ] 5. Implement `receipt-stamp.tsx` with Framer Motion `AnimatePresence`, receipt typography, `formatStampTime()` helper, and `prefers-reduced-motion` detection. (Deliverable 4.5)
- [ ] 6. Implement `station-header.tsx` using `@tarva/ui` `CardHeader` and `CardTitle`, rendering district context label and station title with Z3 typography. (Deliverable 4.6)
- [ ] 7. Implement `station-body.tsx` using `@tarva/ui` `CardContent` and `ScrollArea`, with body type scroll routing and `maxHeight` prop. (Deliverable 4.7)
- [ ] 8. Implement `station-actions.tsx` using `@tarva/ui` `CardFooter` and `Button`, with template variable resolution (`${districtId}`, `${stationId}`) and receipt-stamped click handlers. (Deliverable 4.8)
- [ ] 9. Implement `station-panel.tsx` root component composing all zones, glass + luminous border application, entrance animation with stagger, and `StationProvider` wrapper. (Deliverable 4.9)
- [ ] 10. Write `index.ts` barrel export with all components, hooks, context, and types. (Deliverable 4.10)
- [ ] 11. Write unit test: `station-panel.test.tsx` -- render with mock template, verify 3-zone structure, verify glass CSS class applied, verify luminous border class matches `glowColor` prop.
- [ ] 12. Write unit test: `station-actions.test.tsx` -- mock `ReceiptStore`, click action button, verify `record()` called with correct `ReceiptInput` shape, verify `onCommand` receives resolved command string.
- [ ] 13. Write unit test: `use-receipt-stamp.test.ts` -- verify `stampReceipt` returns 4-char hex trace ID, verify `isVisible` state transitions, verify auto-hide after 2000ms with fake timers, verify cleanup on unmount.
- [ ] 14. Verify AC-1 through AC-15 pass.
- [ ] 15. Run `pnpm lint` and `pnpm typecheck` with zero errors.
