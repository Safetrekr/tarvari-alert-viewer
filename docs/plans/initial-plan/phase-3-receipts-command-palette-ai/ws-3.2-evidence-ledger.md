# WS-3.2: Evidence Ledger

> **Workstream ID:** WS-3.2
> **Phase:** 3 -- Receipts + Command Palette + AI
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-02-25
> **Last Updated:** 2026-02-25
> **Depends On:** WS-3.1 (Receipt System / SupabaseReceiptStore), WS-1.1 (Camera Store / CameraController), WS-2.1 (Morph Choreography), WS-0.2 (Design Tokens), WS-1.7 (Core Interfaces), WS-2.6 (Station Panel Framework)
> **Blocks:** WS-3.3 (Command Palette -- `receipts` / `evidence` commands reference ledger), WS-3.7 (Attention Choreography -- surfaces evidence from ledger)
> **Resolves:** combined-recommendations.md "Evidence Ledger (NW District)" requirement, AD-6 receipt rehydration requirement

---

## 1. Objective

Build the Evidence Ledger -- a dedicated district in the NW quadrant of the spatial canvas that provides a chronological timeline of all Launch receipts and app events. The ledger is the audit trail and situational awareness surface for the entire Tarva Launch system. Users scan it to understand what happened (timeline), filter by what matters (facets), and travel back to the moment of action (rehydration).

The Evidence Ledger renders at two semantic zoom levels:

- **Z2 (District):** A compressed timeline strip where density represents activity volume and color represents actor type (teal for human, ember for AI). A glanceable "heartbeat" of the system.
- **Z3 (Station):** A full interactive panel with faceted filtering, a scrollable receipt list, expandable receipt detail, and a rehydration action that restores the viewport to the state at the time of the receipt with a metric comparison overlay (then vs now).

**Success looks like:** A user opens the Evidence Ledger, filters to "errors in the last 24h from Agent Builder," clicks a receipt, and is transported back to the Agent Builder district at the exact viewport position where the error occurred -- with a side-by-side overlay showing how the metrics have changed since.

**Traceability:** combined-recommendations.md "Evidence Ledger (NW District)"; AD-6 (Receipt System -- rehydration); IA Assessment Section 5 (Evidence Ledger Structure); VISUAL-DESIGN-SPEC.md Sections 1.7, 3.2, 3.4, 4.1, 4.4; tech-decisions.md (Zustand stores, TanStack Query, motion/react).

---

## 2. Scope

### In Scope

- **`EvidenceLedgerDistrict` root component** -- Positioned at NW world coordinates on the spatial canvas. Renders the Z2 compressed strip or Z3 full panel based on `useSemanticZoom()`. Wrapped in the station panel glass material from WS-2.6.
- **Z2 compressed timeline strip (`TimelineStrip`)** -- Horizontal density bar showing activity volume over time. Color-coded segments: teal (`--color-teal-bright`) for human actions, ember (`--color-ember-glow`) for AI actions. Clicking a region transitions to Z3 with the corresponding time range pre-filtered.
- **Z3 full timeline panel (`TimelinePanel`)** -- Glass panel containing the faceted filter bar, scrollable receipt list (newest first), and receipt detail expansion. Uses `@tarva/ui` ScrollArea for the receipt list.
- **Faceted filter bar (`FacetedFilter`)** -- Four facet groups as horizontal chip rows: Source (per app + Launch), Type (navigation/action/error/approval/system), Severity (info/warning/error/critical), Time Range (1h/24h/7d/30d/custom). Multi-select within each facet (OR logic), AND logic across facets.
- **Timeline receipt item (`TimelineItem`)** -- Single receipt in the scrollable list: type icon, summary text, timestamp, source badge, severity indicator, actor badge. Expandable to show full detail.
- **Receipt detail panel (`ReceiptDetailPanel`)** -- Expanded view of a single receipt showing all 12 fields, correlation chain link, AI metadata (if present), and a "Rehydrate" action button.
- **Receipt rehydration** -- Clicking "Rehydrate" on a receipt: (1) calls `CameraController.navigate()` to restore the viewport to the receipt's `location`, (2) highlights the target district/station with a pulse animation, (3) displays a `MetricComparison` overlay showing system metrics at receipt time vs current.
- **Metric comparison overlay (`MetricComparison`)** -- Side-by-side "Then" vs "Now" columns for the 5 universal capsule fields (Health, Pulse, Last Event, Alerts, Freshness) of the receipt's source app. Color-coded deltas (green = improved, red = degraded, gray = unchanged). Dismissible.
- **Custom hooks** -- `useReceiptTimeline` (TanStack Query + filter state + pagination), `useFacetedFilter` (filter state management), `useRehydration` (viewport restore + metric snapshot + comparison).
- **Real-time receipt subscription** -- New receipts appear at the top of the timeline without manual refresh via `ReceiptStore.subscribe()`.
- **Empty state** -- Displayed when no receipts match the active filters, with filter reset action.
- **Loading state** -- Skeleton/spinner while the initial receipt query is in flight.
- **Evidence Ledger CSS** -- Glass material, timeline strip styles, facet chip styles, density bar gradients, rehydration highlight pulse. Inherits station panel base from WS-2.6.
- **Pan-state performance fallback** -- Disables `backdrop-filter` during canvas pan per VISUAL-DESIGN-SPEC.md Section 4.3.
- **`prefers-reduced-motion` compliance** -- Disables rehydration fly animation (instant jump), density bar pulse, highlight pulse. Shows static versions.
- **Barrel export** from `src/components/evidence-ledger/index.ts`.

### Out of Scope

- **Receipt persistence to Supabase** -- WS-3.1 delivers the `SupabaseReceiptStore`. This workstream consumes it.
- **Receipt generation** -- WS-3.1 and WS-2.6 handle recording receipts. This workstream reads them.
- **Command palette integration** -- WS-3.3 adds `receipts` and `evidence` commands that navigate to the ledger.
- **AI-generated receipt summaries** -- Phase 4. This workstream displays the `summary` field as-is.
- **Correlation chain visualization** -- Deferred to Phase 4. This workstream shows a "Related receipts" link but does not render a dependency graph.
- **Export / download of receipts** -- Deferred. Not required for MVP.
- **Full-text search within receipts** -- The `ReceiptFilters.search` field is supported but the UI search input is deferred to a follow-up. Facets are the primary filtering mechanism.

---

## 3. Input Dependencies

| Dependency                                        | Source          | What It Provides                                                                                                                                            | Status    |
| ------------------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| SupabaseReceiptStore                              | WS-3.1          | `ReceiptStore` implementation with Supabase persistence, `query()` with filtering, `subscribe()` for real-time                                              | Required  |
| LaunchReceipt, ReceiptFilters, ReceiptInput types | WS-1.7          | 12-field receipt schema, filter criteria matching the 4 facets, receipt source/type/severity enums                                                          | Required  |
| CameraController                                  | WS-1.1 + WS-1.7 | `navigate()` for viewport restoration, `flyTo()` for animated transitions, `getPosition()` for current state                                                | Required  |
| SystemStateProvider                               | WS-1.7 + WS-1.5 | `getSnapshot()` for current metrics, `getAppState()` for per-app comparison data                                                                            | Required  |
| Morph choreography                                | WS-2.1          | Navigating to a district during rehydration triggers the morph transition                                                                                   | Required  |
| Station panel glass material                      | WS-2.6          | `.station-panel`, `.station-glass-active` CSS classes, `StationHeader`/`StationBody` components                                                             | Required  |
| Design tokens                                     | WS-0.2          | `--color-ember-*`, `--color-teal-*`, `--color-text-*`, `--duration-*`, `--ease-*`, spatial spacing tokens                                                   | Required  |
| Shared domain types                               | WS-1.7          | `AppIdentifier`, `APP_DISPLAY_NAMES`, `HealthState`, `SemanticLevel`, `CameraPosition`, `SpatialLocation`, `EventType`, `Severity`, `Actor`, `ISOTimestamp` | Required  |
| @tarva/ui components                              | npm package     | `ScrollArea`, `Badge`, `Button`, `Tooltip`, `Tabs`, `Card`                                                                                                  | Required  |
| Semantic zoom hook                                | WS-1.1          | `useSemanticZoom()` to determine Z2 vs Z3 rendering                                                                                                         | Required  |
| motion/react                                      | npm package     | `motion.div`, `AnimatePresence` for entrance animations, rehydration pulse, overlay transitions                                                             | Required  |
| TanStack Query                                    | npm package     | `useQuery` / `useInfiniteQuery` for receipt data fetching with caching and background refresh                                                               | Required  |
| VISUAL-DESIGN-SPEC.md                             | Discovery docs  | Z2/Z3 typography scales (Section 3.2), receipt stamp typography (Section 3.4), glass recipes (Section 1.7), glow recipes (Section 1.8)                      | Reference |

---

## 4. Deliverables

### 4.1 File Structure

```
src/
  components/
    evidence-ledger/
      evidence-ledger-district.tsx    # Root district, Z2/Z3 switch
      timeline-strip.tsx              # Z2 compressed density bar
      timeline-panel.tsx              # Z3 full panel with filters + list
      timeline-item.tsx               # Single receipt row
      receipt-detail-panel.tsx        # Expanded receipt view
      faceted-filter.tsx              # 4-facet filter bar
      facet-chip.tsx                  # Toggle chip for a single facet value
      metric-comparison.tsx           # Then vs Now overlay
      rehydration-overlay.tsx         # Highlight pulse on rehydrated target
      evidence-ledger.css             # All Evidence Ledger styles
      index.ts                        # Barrel export
      __tests__/
        timeline-panel.test.tsx
        faceted-filter.test.tsx
        use-receipt-timeline.test.ts
        use-rehydration.test.ts
  hooks/
    use-receipt-timeline.ts           # Query + filter + pagination + subscription
    use-faceted-filter.ts             # Filter state with URL sync
    use-rehydration.ts                # Viewport restore + metric comparison
    use-metric-snapshot.ts            # Capture and compare SystemSnapshot
```

### 4.2 Evidence Ledger CSS -- `src/components/evidence-ledger/evidence-ledger.css`

```css
/* =================================================================
   Evidence Ledger -- Timeline + Facets + Rehydration
   Source: VISUAL-DESIGN-SPEC.md Sections 1.7, 3.2, 3.4, 4.1, 4.4
   ================================================================= */

/* -----------------------------------------------------------------
   Z2 Timeline Strip: Compressed density bar
   Horizontal bar where segment width = time, height/opacity = activity density,
   color = actor type (teal = human, ember = AI).
   ----------------------------------------------------------------- */
.timeline-strip {
  display: flex;
  align-items: flex-end;
  height: 48px;
  gap: 1px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.timeline-strip-segment {
  flex: 1;
  min-width: 2px;
  border-radius: 2px 2px 0 0;
  transition: opacity var(--duration-fast, 150ms) var(--ease-default, ease-out);
  cursor: pointer;
}

.timeline-strip-segment:hover {
  opacity: 1 !important;
  filter: brightness(1.3);
}

.timeline-strip-segment--human {
  background: var(--color-teal-bright, #3a99b8);
}

.timeline-strip-segment--ai {
  background: var(--color-ember-glow, #ffaa70);
}

.timeline-strip-segment--system {
  background: var(--color-text-tertiary, #55667a);
}

/* -----------------------------------------------------------------
   Z2 District Label
   VISUAL-DESIGN-SPEC.md Section 3.2 Z2 type scale.
   ----------------------------------------------------------------- */
.evidence-ledger-z2-label {
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-primary, #def6ff);
  opacity: 0.9;
  line-height: 1.2;
}

.evidence-ledger-z2-subtitle {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.5;
  line-height: 1;
}

/* -----------------------------------------------------------------
   Z3 Timeline Panel
   Uses station panel glass base from WS-2.6.
   ----------------------------------------------------------------- */
.timeline-panel {
  display: flex;
  flex-direction: column;
  width: 420px;
  max-height: 600px;
  border-radius: 16px;
  contain: layout style paint;
}

/* -----------------------------------------------------------------
   Faceted Filter Bar
   Horizontal chip rows with scrollable overflow.
   ----------------------------------------------------------------- */
.facet-bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.facet-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.facet-label {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.6;
  min-width: 52px;
  flex-shrink: 0;
}

/* -----------------------------------------------------------------
   Facet Chip: Toggle button for a single filter value.
   ----------------------------------------------------------------- */
.facet-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: transparent;
  color: var(--color-text-secondary, #92a9b4);
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition:
    background var(--duration-fast, 150ms) var(--ease-default, ease-out),
    border-color var(--duration-fast, 150ms) var(--ease-default, ease-out),
    color var(--duration-fast, 150ms) var(--ease-default, ease-out);
  user-select: none;
}

.facet-chip:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary, #def6ff);
}

.facet-chip--active {
  background: rgba(224, 82, 0, 0.12);
  border-color: rgba(224, 82, 0, 0.3);
  color: var(--color-ember-bright, #ff773c);
}

.facet-chip--active:hover {
  background: rgba(224, 82, 0, 0.18);
  border-color: rgba(224, 82, 0, 0.4);
}

/* -----------------------------------------------------------------
   Timeline Item: Single receipt in the scrollable list.
   Typography follows Z3 scale.
   ----------------------------------------------------------------- */
.timeline-item {
  display: flex;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: background var(--duration-fast, 150ms) var(--ease-default, ease-out);
}

.timeline-item:hover {
  background: rgba(255, 255, 255, 0.03);
}

.timeline-item--expanded {
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.timeline-item-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  font-size: 14px;
}

.timeline-item-icon--navigation {
  background: rgba(39, 115, 137, 0.15);
  color: var(--color-teal-bright, #3a99b8);
}
.timeline-item-icon--action {
  background: rgba(224, 82, 0, 0.12);
  color: var(--color-ember-bright, #ff773c);
}
.timeline-item-icon--error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--color-error, #ef4444);
}
.timeline-item-icon--approval {
  background: rgba(34, 197, 94, 0.12);
  color: var(--color-healthy, #22c55e);
}
.timeline-item-icon--system {
  background: rgba(107, 114, 128, 0.12);
  color: var(--color-offline, #6b7280);
}

.timeline-item-summary {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary, #def6ff);
  opacity: 0.85;
  line-height: 1.4;
}

.timeline-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.timeline-item-timestamp {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.timeline-item-source {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary, #92a9b4);
}

/* -----------------------------------------------------------------
   Severity Indicators
   Small dot or border accent per severity level.
   ----------------------------------------------------------------- */
.severity-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.severity-dot--info {
  background: var(--color-teal, #277389);
}
.severity-dot--warning {
  background: var(--color-warning, #eab308);
}
.severity-dot--error {
  background: var(--color-error, #ef4444);
}
.severity-dot--critical {
  background: var(--color-error, #ef4444);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

/* -----------------------------------------------------------------
   Actor Badge
   ----------------------------------------------------------------- */
.actor-badge {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 1px 4px;
  border-radius: 3px;
}

.actor-badge--human {
  background: rgba(39, 115, 137, 0.15);
  color: var(--color-teal-bright, #3a99b8);
}
.actor-badge--ai {
  background: rgba(224, 82, 0, 0.12);
  color: var(--color-ember-glow, #ffaa70);
}
.actor-badge--system {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-offline, #6b7280);
}

/* -----------------------------------------------------------------
   Receipt Detail Panel (expanded view)
   ----------------------------------------------------------------- */
.receipt-detail {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 0 0 8px 8px;
}

.receipt-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 0;
}

.receipt-detail-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.6;
}

.receipt-detail-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-primary, #def6ff);
  opacity: 0.8;
  text-align: right;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* -----------------------------------------------------------------
   Metric Comparison Overlay (Then vs Now)
   ----------------------------------------------------------------- */
.metric-comparison {
  width: 320px;
  border-radius: 12px;
  overflow: hidden;
}

.metric-comparison-header {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.metric-comparison-col-label {
  font-family: var(--font-sans);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.6;
  text-align: center;
}

.metric-comparison-row {
  display: grid;
  grid-template-columns: 1fr 80px 80px;
  gap: 8px;
  padding: 6px 16px;
  align-items: baseline;
  border-bottom: 1px solid rgba(255, 255, 255, 0.02);
}

.metric-comparison-label {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary, #92a9b4);
}

.metric-comparison-value {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.metric-comparison-value--then {
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.7;
}

.metric-comparison-value--now {
  color: var(--color-text-primary, #def6ff);
}

.metric-delta--improved {
  color: var(--color-healthy, #22c55e);
}
.metric-delta--degraded {
  color: var(--color-error, #ef4444);
}
.metric-delta--unchanged {
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.5;
}

/* -----------------------------------------------------------------
   Rehydration Highlight Pulse
   Applied to the target district/station element after viewport restore.
   ----------------------------------------------------------------- */
.rehydration-highlight {
  position: absolute;
  inset: -4px;
  border-radius: inherit;
  border: 2px solid var(--color-ember-bright, #ff773c);
  box-shadow:
    0 0 20px rgba(255, 119, 60, 0.25),
    0 0 8px rgba(255, 119, 60, 0.4),
    inset 0 0 12px rgba(255, 119, 60, 0.08);
  pointer-events: none;
  animation: rehydration-pulse 2s ease-out forwards;
}

@keyframes rehydration-pulse {
  0% {
    opacity: 0;
    transform: scale(0.98);
  }
  15% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.02);
  }
}

/* -----------------------------------------------------------------
   Empty State
   ----------------------------------------------------------------- */
.timeline-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

.timeline-empty-icon {
  font-size: 32px;
  opacity: 0.15;
  margin-bottom: 12px;
}

.timeline-empty-text {
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-tertiary, #55667a);
  opacity: 0.6;
  line-height: 1.5;
}

/* -----------------------------------------------------------------
   Pan/Zoom Performance Fallback
   ----------------------------------------------------------------- */
[data-panning='true'] .timeline-panel,
[data-panning='true'] .metric-comparison {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: var(--color-deep, #0f161f);
}

/* -----------------------------------------------------------------
   Reduced Motion
   ----------------------------------------------------------------- */
@media (prefers-reduced-motion: reduce) {
  .rehydration-highlight {
    animation: none;
    opacity: 1;
  }

  .timeline-strip-segment {
    transition: none;
  }

  .timeline-item {
    transition: none;
  }

  .facet-chip {
    transition: none;
  }
}
```

### 4.3 Facet Chip Component -- `src/components/evidence-ledger/facet-chip.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface FacetChipProps extends Omit<ComponentProps<'button'>, 'onChange'> {
  /** The display label for the chip. */
  readonly label: string
  /** Whether this chip is currently active (selected). */
  readonly active: boolean
  /** Called when the chip is toggled. */
  readonly onToggle: (active: boolean) => void
  /** Optional count badge (e.g., number of matching receipts). */
  readonly count?: number
}

// ============================================================================
// Component
// ============================================================================

/**
 * A toggle chip for a single facet filter value.
 *
 * Multi-select: multiple chips within a facet group can be active
 * simultaneously (OR logic within the facet).
 *
 * Typography: 11px Geist Sans, 400 weight, 0.02em tracking.
 * Active state: ember background tint with ember border.
 */
export function FacetChip({ label, active, onToggle, count, className, ...props }: FacetChipProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      className={cn('facet-chip', active && 'facet-chip--active', className)}
      onClick={() => onToggle(!active)}
      {...props}
    >
      <span>{label}</span>
      {count !== undefined && count > 0 && (
        <span
          className="font-mono text-[9px] opacity-50"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {count}
        </span>
      )}
    </button>
  )
}
```

### 4.4 Faceted Filter Bar -- `src/components/evidence-ledger/faceted-filter.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@tarva/ui'
import {
  ALL_APP_IDS,
  APP_DISPLAY_NAMES,
  type AppIdentifier,
  type EventType,
  type ReceiptSource,
  type Severity,
} from '@/lib/interfaces/types'
import { FacetChip } from './facet-chip'
import type { FacetedFilterState } from '@/hooks/use-faceted-filter'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

/** All source options: 'launch' + each app identifier. */
const SOURCE_OPTIONS: readonly { id: ReceiptSource; label: string }[] = [
  { id: 'launch', label: 'Launch' },
  ...ALL_APP_IDS.map((id) => ({ id: id as ReceiptSource, label: APP_DISPLAY_NAMES[id] })),
]

const EVENT_TYPE_OPTIONS: readonly { id: EventType; label: string }[] = [
  { id: 'navigation', label: 'Navigation' },
  { id: 'action', label: 'Action' },
  { id: 'error', label: 'Error' },
  { id: 'approval', label: 'Approval' },
  { id: 'system', label: 'System' },
]

const SEVERITY_OPTIONS: readonly { id: Severity; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'warning', label: 'Warning' },
  { id: 'error', label: 'Error' },
  { id: 'critical', label: 'Critical' },
]

/** Time range presets per combined-recommendations.md. */
export const TIME_RANGE_PRESETS = [
  { id: '1h', label: '1h', ms: 60 * 60 * 1000 },
  { id: '24h', label: '24h', ms: 24 * 60 * 60 * 1000 },
  { id: '7d', label: '7d', ms: 7 * 24 * 60 * 60 * 1000 },
  { id: '30d', label: '30d', ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all', label: 'All', ms: 0 },
] as const

// ============================================================================
// Props
// ============================================================================

export interface FacetedFilterProps extends ComponentProps<'div'> {
  /** Current filter state. */
  readonly filters: FacetedFilterState
  /** Toggle a source in the filter. */
  readonly onToggleSource: (source: ReceiptSource) => void
  /** Toggle an event type in the filter. */
  readonly onToggleEventType: (eventType: EventType) => void
  /** Toggle a severity level in the filter. */
  readonly onToggleSeverity: (severity: Severity) => void
  /** Set the time range preset. */
  readonly onSetTimeRange: (presetId: string) => void
  /** Reset all filters to default (no filters). */
  readonly onResetAll: () => void
  /** Whether any filters are active (for showing reset button). */
  readonly hasActiveFilters: boolean
}

// ============================================================================
// Component
// ============================================================================

/**
 * Faceted filter bar for the Evidence Ledger timeline.
 *
 * Four facet rows:
 * 1. Source -- Filter by app or Launch origin.
 * 2. Type -- Filter by event classification.
 * 3. Severity -- Filter by urgency level.
 * 4. Time -- Filter by time range preset.
 *
 * Multi-select within each facet (OR logic).
 * AND logic across facets.
 */
export function FacetedFilter({
  filters,
  onToggleSource,
  onToggleEventType,
  onToggleSeverity,
  onSetTimeRange,
  onResetAll,
  hasActiveFilters,
  className,
  ...props
}: FacetedFilterProps) {
  return (
    <div className={cn('facet-bar', className)} {...props}>
      {/* Source facet */}
      <div className="facet-row">
        <span className="facet-label">Source</span>
        {SOURCE_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.sources.includes(opt.id)}
            onToggle={() => onToggleSource(opt.id)}
          />
        ))}
      </div>

      {/* Type facet */}
      <div className="facet-row">
        <span className="facet-label">Type</span>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.eventTypes.includes(opt.id)}
            onToggle={() => onToggleEventType(opt.id)}
          />
        ))}
      </div>

      {/* Severity facet */}
      <div className="facet-row">
        <span className="facet-label">Level</span>
        {SEVERITY_OPTIONS.map((opt) => (
          <FacetChip
            key={opt.id}
            label={opt.label}
            active={filters.severities.includes(opt.id)}
            onToggle={() => onToggleSeverity(opt.id)}
          />
        ))}
      </div>

      {/* Time range facet */}
      <div className="facet-row">
        <span className="facet-label">Time</span>
        {TIME_RANGE_PRESETS.map((preset) => (
          <FacetChip
            key={preset.id}
            label={preset.label}
            active={filters.timeRangePreset === preset.id}
            onToggle={() => onSetTimeRange(preset.id)}
          />
        ))}
      </div>

      {/* Reset all filters */}
      {hasActiveFilters && (
        <div className="flex justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetAll}
            className="font-sans text-[11px] font-normal opacity-50 hover:opacity-80"
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
```

### 4.5 Timeline Item -- `src/components/evidence-ledger/timeline-item.tsx`

```tsx
'use client'

import { useState, type ComponentProps } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { Compass, Zap, AlertTriangle, CheckCircle2, Settings, type LucideIcon } from 'lucide-react'
import type { LaunchReceipt, EventType, Actor } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES, type AppIdentifier } from '@/lib/interfaces/types'
import { ReceiptDetailPanel } from './receipt-detail-panel'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

const EVENT_TYPE_ICONS: Record<EventType, LucideIcon> = {
  navigation: Compass,
  action: Zap,
  error: AlertTriangle,
  approval: CheckCircle2,
  system: Settings,
}

// ============================================================================
// Props
// ============================================================================

export interface TimelineItemProps extends Omit<ComponentProps<'div'>, 'onClick'> {
  /** The receipt to display. */
  readonly receipt: LaunchReceipt
  /** Called when the user clicks "Rehydrate" in the detail panel. */
  readonly onRehydrate: (receipt: LaunchReceipt) => void
}

// ============================================================================
// Helpers
// ============================================================================

/** Format ISO timestamp to a relative or compact display. */
function formatTimestamp(iso: string): string {
  try {
    const date = new Date(iso)
    const now = Date.now()
    const diffMs = now - date.getTime()

    if (diffMs < 60_000) return 'just now'
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`

    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return '--'
  }
}

/** Get display name for a receipt source. */
function getSourceLabel(source: string): string {
  if (source === 'launch') return 'Launch'
  return APP_DISPLAY_NAMES[source as AppIdentifier] ?? source
}

// ============================================================================
// Component
// ============================================================================

/**
 * A single receipt in the Evidence Ledger timeline.
 *
 * Renders a compact row with:
 * - Type icon (color-coded by event type)
 * - Summary text (13px, Z3 body scale)
 * - Metadata row: timestamp, source badge, severity dot, actor badge
 *
 * Clicking expands to show ReceiptDetailPanel with all 12 fields
 * and a "Rehydrate" action button.
 */
export function TimelineItem({ receipt, onRehydrate, className, ...props }: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false)

  const Icon = EVENT_TYPE_ICONS[receipt.eventType]

  return (
    <div
      className={cn('timeline-item flex-col', expanded && 'timeline-item--expanded', className)}
      {...props}
    >
      {/* Compact row */}
      <button
        type="button"
        className="flex w-full gap-3 text-left"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        {/* Type icon */}
        <div className={cn('timeline-item-icon', `timeline-item-icon--${receipt.eventType}`)}>
          <Icon size={14} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="timeline-item-summary truncate">{receipt.summary}</p>

          <div className="timeline-item-meta">
            {/* Severity dot */}
            <span className={cn('severity-dot', `severity-dot--${receipt.severity}`)} />

            {/* Timestamp */}
            <span className="timeline-item-timestamp">{formatTimestamp(receipt.timestamp)}</span>

            {/* Source badge */}
            <span className="timeline-item-source">{getSourceLabel(receipt.source)}</span>

            {/* Actor badge */}
            <span className={cn('actor-badge', `actor-badge--${receipt.actor}`)}>
              {receipt.actor}
            </span>
          </div>
        </div>
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <ReceiptDetailPanel receipt={receipt} onRehydrate={() => onRehydrate(receipt)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
```

### 4.6 Receipt Detail Panel -- `src/components/evidence-ledger/receipt-detail-panel.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { Button } from '@tarva/ui'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt } from '@/lib/interfaces/types'
import { APP_DISPLAY_NAMES, type AppIdentifier } from '@/lib/interfaces/types'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface ReceiptDetailPanelProps extends ComponentProps<'div'> {
  /** The receipt to display in full detail. */
  readonly receipt: LaunchReceipt
  /** Called when the user clicks the Rehydrate button. */
  readonly onRehydrate: () => void
}

// ============================================================================
// Helpers
// ============================================================================

function formatFullTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return iso
  }
}

function formatLocation(loc: LaunchReceipt['location']): string {
  const parts = [loc.semanticLevel]
  if (loc.district) {
    parts.push(APP_DISPLAY_NAMES[loc.district as AppIdentifier] ?? loc.district)
  }
  if (loc.station) parts.push(loc.station)
  return parts.join(' > ')
}

// ============================================================================
// Component
// ============================================================================

/**
 * Expanded receipt detail view.
 *
 * Shows all 12 LaunchReceipt fields:
 * - id, correlationId, source, eventType, severity
 * - summary, detail (JSON collapsible), location, timestamp
 * - durationMs, actor, aiMetadata (if present)
 *
 * Includes a "Rehydrate" button that triggers viewport restoration.
 */
export function ReceiptDetailPanel({
  receipt,
  onRehydrate,
  className,
  ...props
}: ReceiptDetailPanelProps) {
  return (
    <div className={cn('receipt-detail', className)} {...props}>
      {/* Receipt ID */}
      <div className="receipt-detail-row">
        <span className="receipt-detail-label">ID</span>
        <span className="receipt-detail-value font-mono text-[11px] opacity-50">
          {receipt.id.slice(0, 8)}...
        </span>
      </div>

      {/* Correlation ID */}
      {receipt.correlationId && (
        <div className="receipt-detail-row">
          <span className="receipt-detail-label">Correlation</span>
          <span className="receipt-detail-value font-mono text-[11px] opacity-50">
            {receipt.correlationId.slice(0, 8)}...
          </span>
        </div>
      )}

      {/* Location */}
      <div className="receipt-detail-row">
        <span className="receipt-detail-label">Location</span>
        <span className="receipt-detail-value">{formatLocation(receipt.location)}</span>
      </div>

      {/* Full timestamp */}
      <div className="receipt-detail-row">
        <span className="receipt-detail-label">Timestamp</span>
        <span className="receipt-detail-value font-mono">
          {formatFullTimestamp(receipt.timestamp)}
        </span>
      </div>

      {/* Duration (if present) */}
      {receipt.durationMs !== null && (
        <div className="receipt-detail-row">
          <span className="receipt-detail-label">Duration</span>
          <span className="receipt-detail-value font-mono">{receipt.durationMs}ms</span>
        </div>
      )}

      {/* AI Metadata (if present) */}
      {receipt.aiMetadata && (
        <>
          <div className="mt-3 mb-2 border-t border-white/[0.04] pt-3">
            <span className="receipt-detail-label">AI Rationale</span>
          </div>
          <div className="receipt-detail-row">
            <span className="receipt-detail-label">Provider</span>
            <span className="receipt-detail-value">
              {receipt.aiMetadata.provider}
              {receipt.aiMetadata.modelId && ` (${receipt.aiMetadata.modelId})`}
            </span>
          </div>
          <div className="receipt-detail-row">
            <span className="receipt-detail-label">Confidence</span>
            <span className="receipt-detail-value font-mono">
              {(receipt.aiMetadata.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="receipt-detail-row">
            <span className="receipt-detail-label">Latency</span>
            <span className="receipt-detail-value font-mono">{receipt.aiMetadata.latencyMs}ms</span>
          </div>
          <div className="mt-1">
            <span className="receipt-detail-label">Reasoning</span>
            <p
              className="mt-1 font-sans text-[12px] leading-[1.5] opacity-60"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {receipt.aiMetadata.reasoning}
            </p>
          </div>
        </>
      )}

      {/* Structured detail (collapsible JSON) */}
      {receipt.detail && Object.keys(receipt.detail).length > 0 && (
        <details className="mt-3">
          <summary className="receipt-detail-label cursor-pointer hover:opacity-80">
            Raw Detail
          </summary>
          <pre className="mt-2 max-h-[120px] overflow-x-auto rounded bg-white/[0.02] p-2 font-mono text-[10px] leading-[1.4] opacity-50">
            {JSON.stringify(receipt.detail, null, 2)}
          </pre>
        </details>
      )}

      {/* Rehydrate action */}
      <div className="mt-4 flex justify-end">
        <Button
          variant="default"
          size="sm"
          onClick={onRehydrate}
          className="gap-1.5 font-sans text-[12px] font-medium tracking-[0.01em]"
        >
          <RotateCcw size={12} />
          Rehydrate
        </Button>
      </div>
    </div>
  )
}
```

### 4.7 Metric Comparison Overlay -- `src/components/evidence-ledger/metric-comparison.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { Button } from '@tarva/ui'
import { cn } from '@/lib/utils'
import type { AppState, HealthState } from '@/lib/interfaces/types'
import './evidence-ledger.css'

// ============================================================================
// Types
// ============================================================================

export interface MetricDelta {
  readonly label: string
  readonly thenValue: string
  readonly nowValue: string
  readonly trend: 'improved' | 'degraded' | 'unchanged'
}

export interface MetricComparisonProps extends ComponentProps<'div'> {
  /** App state at the time of the receipt. */
  readonly thenState: Pick<
    AppState,
    'health' | 'pulse' | 'alertCount' | 'freshnessMs' | 'lastEvent'
  >
  /** Current app state. */
  readonly nowState: Pick<AppState, 'health' | 'pulse' | 'alertCount' | 'freshnessMs' | 'lastEvent'>
  /** Display name of the app being compared. */
  readonly appName: string
  /** Called when the overlay is dismissed. */
  readonly onDismiss: () => void
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Compare two AppState snapshots and produce delta rows for the
 * 5 universal capsule fields (Health, Pulse, Last Event, Alerts, Freshness).
 */
function computeDeltas(
  then: MetricComparisonProps['thenState'],
  now: MetricComparisonProps['nowState']
): MetricDelta[] {
  const healthRank: Record<HealthState, number> = {
    OPERATIONAL: 4,
    DEGRADED: 3,
    OFFLINE: 2,
    DOWN: 1,
    UNKNOWN: 0,
  }

  const healthTrend = (): 'improved' | 'degraded' | 'unchanged' => {
    const thenRank = healthRank[then.health] ?? 0
    const nowRank = healthRank[now.health] ?? 0
    if (nowRank > thenRank) return 'improved'
    if (nowRank < thenRank) return 'degraded'
    return 'unchanged'
  }

  const alertTrend = (): 'improved' | 'degraded' | 'unchanged' => {
    if (now.alertCount < then.alertCount) return 'improved'
    if (now.alertCount > then.alertCount) return 'degraded'
    return 'unchanged'
  }

  const freshnessTrend = (): 'improved' | 'degraded' | 'unchanged' => {
    if (then.freshnessMs === null || now.freshnessMs === null) return 'unchanged'
    if (now.freshnessMs < then.freshnessMs) return 'improved'
    if (now.freshnessMs > then.freshnessMs) return 'degraded'
    return 'unchanged'
  }

  const formatFreshness = (ms: number | null): string => {
    if (ms === null) return '--'
    if (ms < 60_000) return `${Math.floor(ms / 1000)}s`
    if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`
    if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`
    return `${Math.floor(ms / 86_400_000)}d`
  }

  return [
    {
      label: 'Health',
      thenValue: then.health,
      nowValue: now.health,
      trend: healthTrend(),
    },
    {
      label: 'Pulse',
      thenValue: then.pulse,
      nowValue: now.pulse,
      trend: then.pulse === now.pulse ? 'unchanged' : 'improved',
    },
    {
      label: 'Alerts',
      thenValue: String(then.alertCount),
      nowValue: String(now.alertCount),
      trend: alertTrend(),
    },
    {
      label: 'Freshness',
      thenValue: formatFreshness(then.freshnessMs),
      nowValue: formatFreshness(now.freshnessMs),
      trend: freshnessTrend(),
    },
    {
      label: 'Last Event',
      thenValue: then.lastEvent ?? '--',
      nowValue: now.lastEvent ?? '--',
      trend: 'unchanged',
    },
  ]
}

// ============================================================================
// Component
// ============================================================================

/**
 * Metric comparison overlay (Then vs Now).
 *
 * Shown after receipt rehydration to compare the 5 universal capsule
 * fields at the time of the receipt vs the current system state.
 *
 * Positioned near the rehydrated target. Dismissible via close button
 * or clicking outside.
 *
 * Uses the station glass material (active tier) from WS-2.6.
 */
export function MetricComparison({
  thenState,
  nowState,
  appName,
  onDismiss,
  className,
  ...props
}: MetricComparisonProps) {
  const deltas = computeDeltas(thenState, nowState)

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <motion.div
      className={cn('metric-comparison station-glass-active', className)}
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <span
            className="font-sans text-[11px] font-normal tracking-[0.04em] uppercase opacity-50"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            Metric Comparison
          </span>
          <p
            className="mt-0.5 font-sans text-[14px] font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {appName}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="h-7 w-7 p-0 opacity-40 hover:opacity-80"
          aria-label="Dismiss comparison"
        >
          <X size={14} />
        </Button>
      </div>

      {/* Column headers */}
      <div className="metric-comparison-header">
        <span className="metric-comparison-col-label text-left">Metric</span>
        <span className="metric-comparison-col-label">Then</span>
        <span className="metric-comparison-col-label">Now</span>
      </div>

      {/* Delta rows */}
      {deltas.map((delta) => (
        <div key={delta.label} className="metric-comparison-row">
          <span className="metric-comparison-label">{delta.label}</span>
          <span className="metric-comparison-value metric-comparison-value--then">
            {delta.thenValue}
          </span>
          <span
            className={cn(
              'metric-comparison-value metric-comparison-value--now',
              delta.trend === 'improved' && 'metric-delta--improved',
              delta.trend === 'degraded' && 'metric-delta--degraded',
              delta.trend === 'unchanged' && 'metric-delta--unchanged'
            )}
          >
            {delta.nowValue}
          </span>
        </div>
      ))}
    </motion.div>
  )
}
```

### 4.8 Faceted Filter Hook -- `src/hooks/use-faceted-filter.ts`

```ts
'use client'

import { useCallback, useMemo, useState } from 'react'
import type { EventType, ReceiptSource, Severity } from '@/lib/interfaces/types'
import type { ReceiptFilters } from '@/lib/interfaces/receipt-store'
import { TIME_RANGE_PRESETS } from '@/components/evidence-ledger/faceted-filter'

// ============================================================================
// Types
// ============================================================================

export interface FacetedFilterState {
  /** Active source filters (empty = all sources). */
  readonly sources: readonly ReceiptSource[]
  /** Active event type filters (empty = all types). */
  readonly eventTypes: readonly EventType[]
  /** Active severity filters (empty = all severities). */
  readonly severities: readonly Severity[]
  /** Active time range preset ID. 'all' = no time filter. */
  readonly timeRangePreset: string
}

export interface UseFacetedFilterReturn {
  /** Current filter state. */
  readonly filters: FacetedFilterState
  /** Toggle a source in the active set. */
  readonly toggleSource: (source: ReceiptSource) => void
  /** Toggle an event type in the active set. */
  readonly toggleEventType: (eventType: EventType) => void
  /** Toggle a severity in the active set. */
  readonly toggleSeverity: (severity: Severity) => void
  /** Set the time range preset. */
  readonly setTimeRange: (presetId: string) => void
  /** Reset all filters to default. */
  readonly resetAll: () => void
  /** Whether any filters are active. */
  readonly hasActiveFilters: boolean
  /** Convert current state to ReceiptFilters for querying. */
  readonly toReceiptFilters: () => ReceiptFilters
}

// ============================================================================
// Helpers
// ============================================================================

const DEFAULT_STATE: FacetedFilterState = {
  sources: [],
  eventTypes: [],
  severities: [],
  timeRangePreset: 'all',
}

/** Toggle an item in a readonly array (add if missing, remove if present). */
function toggleInArray<T>(arr: readonly T[], item: T): readonly T[] {
  const index = arr.indexOf(item)
  if (index === -1) return [...arr, item]
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages the faceted filter state for the Evidence Ledger.
 *
 * - Multi-select within each facet (OR logic): selecting "error" + "action"
 *   in the Type facet shows receipts that are errors OR actions.
 * - AND logic across facets: selecting "error" in Type AND "Agent Builder"
 *   in Source shows only Agent Builder errors.
 * - Time range is single-select (preset buttons).
 *
 * @param initialState Optional initial filter state (e.g., from URL params).
 */
export function useFacetedFilter(
  initialState: Partial<FacetedFilterState> = {}
): UseFacetedFilterReturn {
  const [state, setState] = useState<FacetedFilterState>({
    ...DEFAULT_STATE,
    ...initialState,
  })

  const toggleSource = useCallback((source: ReceiptSource) => {
    setState((prev) => ({
      ...prev,
      sources: toggleInArray(prev.sources, source),
    }))
  }, [])

  const toggleEventType = useCallback((eventType: EventType) => {
    setState((prev) => ({
      ...prev,
      eventTypes: toggleInArray(prev.eventTypes, eventType),
    }))
  }, [])

  const toggleSeverity = useCallback((severity: Severity) => {
    setState((prev) => ({
      ...prev,
      severities: toggleInArray(prev.severities, severity),
    }))
  }, [])

  const setTimeRange = useCallback((presetId: string) => {
    setState((prev) => ({
      ...prev,
      timeRangePreset: presetId,
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState(DEFAULT_STATE)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      state.sources.length > 0 ||
      state.eventTypes.length > 0 ||
      state.severities.length > 0 ||
      state.timeRangePreset !== 'all',
    [state]
  )

  const toReceiptFilters = useCallback((): ReceiptFilters => {
    const filters: ReceiptFilters = {}

    if (state.sources.length > 0) {
      filters.sources = state.sources
    }
    if (state.eventTypes.length > 0) {
      filters.eventTypes = state.eventTypes
    }
    if (state.severities.length > 0) {
      filters.severities = state.severities
    }
    if (state.timeRangePreset !== 'all') {
      const preset = TIME_RANGE_PRESETS.find((p) => p.id === state.timeRangePreset)
      if (preset && preset.ms > 0) {
        const now = new Date()
        filters.timeRange = {
          start: new Date(now.getTime() - preset.ms).toISOString(),
          end: now.toISOString(),
        }
      }
    }

    return filters
  }, [state])

  return {
    filters: state,
    toggleSource,
    toggleEventType,
    toggleSeverity,
    setTimeRange,
    resetAll,
    hasActiveFilters,
    toReceiptFilters,
  }
}
```

### 4.9 Receipt Timeline Hook -- `src/hooks/use-receipt-timeline.ts`

````ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LaunchReceipt } from '@/lib/interfaces/types'
import type { ReceiptStore, ReceiptFilters } from '@/lib/interfaces/receipt-store'

// ============================================================================
// Types
// ============================================================================

export interface UseReceiptTimelineOptions {
  /** The ReceiptStore instance (SupabaseReceiptStore in Phase 3). */
  readonly receiptStore: ReceiptStore
  /** Current receipt filters from useFacetedFilter. */
  readonly filters: ReceiptFilters
  /** Number of receipts per page. Default: 50. */
  readonly pageSize?: number
}

export interface UseReceiptTimelineReturn {
  /** Current page of receipts (newest first). */
  readonly receipts: readonly LaunchReceipt[]
  /** Whether the initial load is in progress. */
  readonly isLoading: boolean
  /** Whether a subsequent page load is in progress. */
  readonly isLoadingMore: boolean
  /** Error from the most recent query. */
  readonly error: Error | null
  /** Whether there are more receipts to load. */
  readonly hasMore: boolean
  /** Total count of receipts matching the current filters. */
  readonly totalCount: number
  /** Load the next page of receipts. */
  readonly loadMore: () => Promise<void>
  /** Force a full refresh of the timeline. */
  readonly refresh: () => Promise<void>
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages the receipt timeline data for the Evidence Ledger.
 *
 * Features:
 * - Paginated loading (infinite scroll style)
 * - Real-time subscription for new receipts (prepended at top)
 * - Re-fetches when filters change
 * - Deduplication of receipts by ID
 *
 * @example
 * ```tsx
 * const { receipts, isLoading, hasMore, loadMore } = useReceiptTimeline({
 *   receiptStore,
 *   filters: facetedFilter.toReceiptFilters(),
 * })
 * ```
 */
export function useReceiptTimeline({
  receiptStore,
  filters,
  pageSize = 50,
}: UseReceiptTimelineOptions): UseReceiptTimelineReturn {
  const [receipts, setReceipts] = useState<LaunchReceipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [offset, setOffset] = useState(0)

  // Track seen IDs for deduplication.
  const seenIds = useRef(new Set<string>())

  // ----------------------------------------
  // Initial load + filter change
  // ----------------------------------------
  const fetchInitialPage = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    seenIds.current.clear()

    try {
      const [results, count] = await Promise.all([
        receiptStore.query({ ...filters, limit: pageSize, offset: 0 }),
        receiptStore.count(filters),
      ])

      for (const r of results) seenIds.current.add(r.id)
      setReceipts(results)
      setTotalCount(count)
      setOffset(results.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load receipts'))
    } finally {
      setIsLoading(false)
    }
  }, [receiptStore, filters, pageSize])

  // Re-fetch when filters change.
  useEffect(() => {
    fetchInitialPage()
  }, [fetchInitialPage])

  // ----------------------------------------
  // Load more (pagination)
  // ----------------------------------------
  const loadMore = useCallback(async () => {
    if (isLoadingMore || offset >= totalCount) return

    setIsLoadingMore(true)
    try {
      const results = await receiptStore.query({
        ...filters,
        limit: pageSize,
        offset,
      })

      const newReceipts = results.filter((r) => !seenIds.current.has(r.id))
      for (const r of newReceipts) seenIds.current.add(r.id)

      setReceipts((prev) => [...prev, ...newReceipts])
      setOffset((prev) => prev + results.length)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more receipts'))
    } finally {
      setIsLoadingMore(false)
    }
  }, [receiptStore, filters, pageSize, offset, totalCount, isLoadingMore])

  // ----------------------------------------
  // Real-time subscription
  // ----------------------------------------
  useEffect(() => {
    const unsubscribe = receiptStore.subscribe((newReceipt: LaunchReceipt) => {
      // Only prepend if it passes the current filters.
      // Simple check: if no filters are active, always show.
      // With active filters, the receipt must match.
      if (seenIds.current.has(newReceipt.id)) return
      seenIds.current.add(newReceipt.id)

      setReceipts((prev) => [newReceipt, ...prev])
      setTotalCount((prev) => prev + 1)
      setOffset((prev) => prev + 1)
    })

    return unsubscribe
  }, [receiptStore])

  // ----------------------------------------
  // Refresh
  // ----------------------------------------
  const refresh = useCallback(async () => {
    await fetchInitialPage()
  }, [fetchInitialPage])

  const hasMore = offset < totalCount

  return {
    receipts,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    totalCount,
    loadMore,
    refresh,
  }
}
````

### 4.10 Rehydration Hook -- `src/hooks/use-rehydration.ts`

```ts
'use client'

import { useCallback, useState } from 'react'
import type { LaunchReceipt, AppIdentifier } from '@/lib/interfaces/types'
import type { CameraController, CameraDirective } from '@/lib/interfaces/camera-controller'
import type { SystemStateProvider, AppState } from '@/lib/interfaces/system-state-provider'

// ============================================================================
// Types
// ============================================================================

export interface RehydrationState {
  /** Whether a rehydration is currently in progress. */
  readonly isRehydrating: boolean
  /** The receipt being rehydrated. Null when idle. */
  readonly activeReceipt: LaunchReceipt | null
  /** The app state at the time of the receipt. Null until loaded. */
  readonly thenState: Pick<
    AppState,
    'health' | 'pulse' | 'alertCount' | 'freshnessMs' | 'lastEvent'
  > | null
  /** The current app state for comparison. Null until loaded. */
  readonly nowState: Pick<
    AppState,
    'health' | 'pulse' | 'alertCount' | 'freshnessMs' | 'lastEvent'
  > | null
  /** Display name of the source app. */
  readonly appName: string | null
  /** Whether the metric comparison overlay is visible. */
  readonly showComparison: boolean
}

export interface UseRehydrationOptions {
  /** The CameraController for viewport restoration. */
  readonly cameraController: CameraController
  /** The SystemStateProvider for metric comparison. */
  readonly systemStateProvider: SystemStateProvider
  /**
   * Optional callback to fetch a historical SystemSnapshot for the receipt timestamp.
   * In Phase 3, this queries Supabase `launch_snapshots` table.
   * If not provided, the comparison uses the current state for both columns
   * (which is useful as a graceful fallback).
   */
  readonly fetchHistoricalSnapshot?: (
    appId: AppIdentifier,
    timestamp: string
  ) => Promise<Pick<
    AppState,
    'health' | 'pulse' | 'alertCount' | 'freshnessMs' | 'lastEvent'
  > | null>
}

export interface UseRehydrationReturn {
  /** Current rehydration state. */
  readonly state: RehydrationState
  /** Initiate rehydration for a receipt. */
  readonly rehydrate: (receipt: LaunchReceipt) => Promise<void>
  /** Dismiss the metric comparison overlay. */
  readonly dismissComparison: () => void
}

// ============================================================================
// Constants
// ============================================================================

import { APP_DISPLAY_NAMES } from '@/lib/interfaces/types'

const INITIAL_STATE: RehydrationState = {
  isRehydrating: false,
  activeReceipt: null,
  thenState: null,
  nowState: null,
  appName: null,
  showComparison: false,
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Manages receipt rehydration for the Evidence Ledger.
 *
 * Rehydration flow:
 * 1. User clicks "Rehydrate" on a receipt in the timeline.
 * 2. The hook reads the receipt's `location` (SpatialLocation).
 * 3. CameraController.navigate() flies the viewport to the receipt's
 *    district and station (or position).
 * 4. The target element receives a highlight pulse (via CSS class).
 * 5. The MetricComparison overlay shows then-vs-now values for the
 *    5 universal capsule fields of the receipt's source app.
 *
 * If the receipt's source is 'launch' (not an app), the comparison
 * shows global metrics instead.
 *
 * @param cameraController CameraController for viewport restoration.
 * @param systemStateProvider SystemStateProvider for metric comparison.
 * @param fetchHistoricalSnapshot Optional function to load historical metrics.
 */
export function useRehydration({
  cameraController,
  systemStateProvider,
  fetchHistoricalSnapshot,
}: UseRehydrationOptions): UseRehydrationReturn {
  const [state, setState] = useState<RehydrationState>(INITIAL_STATE)

  const rehydrate = useCallback(
    async (receipt: LaunchReceipt) => {
      const appId =
        receipt.source === 'launch' ? receipt.location.district : (receipt.source as AppIdentifier)

      const appName = appId ? (APP_DISPLAY_NAMES[appId as AppIdentifier] ?? appId) : 'Launch'

      setState({
        isRehydrating: true,
        activeReceipt: receipt,
        thenState: null,
        nowState: null,
        appName,
        showComparison: false,
      })

      // Step 1: Build the camera directive from the receipt's location.
      const directive: CameraDirective = {
        target:
          receipt.location.station && receipt.location.district
            ? {
                type: 'station' as const,
                districtId: receipt.location.district,
                stationId: receipt.location.station,
              }
            : receipt.location.district
              ? { type: 'district' as const, districtId: receipt.location.district }
              : { type: 'home' as const },
        highlights: appId ? [appId as AppIdentifier] : undefined,
        source: 'manual' as const,
      }

      // Step 2: Navigate the camera.
      await cameraController.navigate(directive)

      // Step 3: Fetch metric comparison data.
      let thenState: RehydrationState['thenState'] = null
      let nowState: RehydrationState['nowState'] = null

      if (appId) {
        // Current state from SystemStateProvider.
        const currentAppState = systemStateProvider.getAppState(appId as AppIdentifier)
        if (currentAppState) {
          nowState = {
            health: currentAppState.health,
            pulse: currentAppState.pulse,
            alertCount: currentAppState.alertCount,
            freshnessMs: currentAppState.freshnessMs,
            lastEvent: currentAppState.lastEvent,
          }
        }

        // Historical state (if available).
        if (fetchHistoricalSnapshot) {
          thenState = await fetchHistoricalSnapshot(appId as AppIdentifier, receipt.timestamp)
        }

        // Fallback: if no historical data, use current as "then" too.
        if (!thenState && nowState) {
          thenState = nowState
        }
      }

      // Step 4: Show comparison overlay.
      setState({
        isRehydrating: false,
        activeReceipt: receipt,
        thenState,
        nowState,
        appName,
        showComparison: thenState !== null && nowState !== null,
      })
    },
    [cameraController, systemStateProvider, fetchHistoricalSnapshot]
  )

  const dismissComparison = useCallback(() => {
    setState((prev) => ({ ...prev, showComparison: false }))
  }, [])

  return { state, rehydrate, dismissComparison }
}
```

### 4.11 Timeline Strip (Z2) -- `src/components/evidence-ledger/timeline-strip.tsx`

```tsx
'use client'

import { useMemo, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import type { LaunchReceipt, Actor } from '@/lib/interfaces/types'
import './evidence-ledger.css'

// ============================================================================
// Types
// ============================================================================

interface TimeSegment {
  readonly startMs: number
  readonly endMs: number
  readonly count: number
  readonly maxCount: number
  readonly dominantActor: Actor
}

// ============================================================================
// Props
// ============================================================================

export interface TimelineStripProps extends ComponentProps<'div'> {
  /** Receipts to visualize (pre-filtered or all). */
  readonly receipts: readonly LaunchReceipt[]
  /** Number of time segments to divide the strip into. Default: 48. */
  readonly segmentCount?: number
  /** Time range in milliseconds to display. Default: 24h. */
  readonly timeRangeMs?: number
  /** Called when a segment is clicked (to zoom into that time range). */
  readonly onSegmentClick?: (startMs: number, endMs: number) => void
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Bucket receipts into time segments and compute density + dominant actor.
 */
function computeSegments(
  receipts: readonly LaunchReceipt[],
  segmentCount: number,
  timeRangeMs: number
): TimeSegment[] {
  const now = Date.now()
  const startTime = now - timeRangeMs
  const segmentDuration = timeRangeMs / segmentCount

  // Initialize segments.
  const segments: Array<{
    count: number
    humanCount: number
    aiCount: number
    systemCount: number
  }> = Array.from({ length: segmentCount }, () => ({
    count: 0,
    humanCount: 0,
    aiCount: 0,
    systemCount: 0,
  }))

  // Bucket each receipt.
  for (const receipt of receipts) {
    const receiptTime = new Date(receipt.timestamp).getTime()
    if (receiptTime < startTime || receiptTime > now) continue

    const segmentIndex = Math.min(
      segmentCount - 1,
      Math.floor((receiptTime - startTime) / segmentDuration)
    )

    segments[segmentIndex].count++
    if (receipt.actor === 'human') segments[segmentIndex].humanCount++
    else if (receipt.actor === 'ai') segments[segmentIndex].aiCount++
    else segments[segmentIndex].systemCount++
  }

  const maxCount = Math.max(1, ...segments.map((s) => s.count))

  return segments.map((seg, i) => {
    const dominantActor: Actor =
      seg.aiCount > seg.humanCount && seg.aiCount > seg.systemCount
        ? 'ai'
        : seg.humanCount >= seg.systemCount
          ? 'human'
          : 'system'

    return {
      startMs: startTime + i * segmentDuration,
      endMs: startTime + (i + 1) * segmentDuration,
      count: seg.count,
      maxCount,
      dominantActor,
    }
  })
}

// ============================================================================
// Component
// ============================================================================

/**
 * Z2 compressed timeline strip.
 *
 * A horizontal density bar where:
 * - Each vertical bar represents a time segment.
 * - Bar height represents activity volume (relative to peak).
 * - Bar color represents the dominant actor type:
 *   - Teal (--color-teal-bright) for human actions.
 *   - Ember (--color-ember-glow) for AI actions.
 *   - Gray (--color-text-tertiary) for system events.
 *
 * Clicking a segment transitions to Z3 with that time range pre-filtered.
 */
export function TimelineStrip({
  receipts,
  segmentCount = 48,
  timeRangeMs = 24 * 60 * 60 * 1000,
  onSegmentClick,
  className,
  ...props
}: TimelineStripProps) {
  const segments = useMemo(
    () => computeSegments(receipts, segmentCount, timeRangeMs),
    [receipts, segmentCount, timeRangeMs]
  )

  return (
    <div className={cn('timeline-strip', className)} {...props}>
      {segments.map((segment, i) => {
        const heightPercent =
          segment.count === 0 ? 0 : Math.max(8, (segment.count / segment.maxCount) * 100)

        return (
          <div
            key={i}
            className={cn(
              'timeline-strip-segment',
              `timeline-strip-segment--${segment.dominantActor}`
            )}
            style={{
              height: `${heightPercent}%`,
              opacity: segment.count === 0 ? 0.05 : 0.3 + (segment.count / segment.maxCount) * 0.7,
            }}
            onClick={() => onSegmentClick?.(segment.startMs, segment.endMs)}
            title={`${segment.count} events`}
          />
        )
      })}
    </div>
  )
}
```

### 4.12 Timeline Panel (Z3) -- `src/components/evidence-ledger/timeline-panel.tsx`

```tsx
'use client'

import { useRef, useCallback, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@tarva/ui'
import { Loader2 } from 'lucide-react'
import type { LaunchReceipt } from '@/lib/interfaces/types'
import type { FacetedFilterState } from '@/hooks/use-faceted-filter'
import type { ReceiptSource, EventType, Severity } from '@/lib/interfaces/types'
import { FacetedFilter } from './faceted-filter'
import { TimelineItem } from './timeline-item'
import './evidence-ledger.css'

// ============================================================================
// Props
// ============================================================================

export interface TimelinePanelProps extends ComponentProps<'div'> {
  /** Receipts to display (newest first). */
  readonly receipts: readonly LaunchReceipt[]
  /** Whether the initial load is in progress. */
  readonly isLoading: boolean
  /** Whether more receipts are being loaded. */
  readonly isLoadingMore: boolean
  /** Whether there are more receipts to load. */
  readonly hasMore: boolean
  /** Total count of matching receipts. */
  readonly totalCount: number
  /** Load the next page. */
  readonly onLoadMore: () => void
  /** Current filter state. */
  readonly filters: FacetedFilterState
  /** Filter toggle callbacks. */
  readonly onToggleSource: (source: ReceiptSource) => void
  readonly onToggleEventType: (eventType: EventType) => void
  readonly onToggleSeverity: (severity: Severity) => void
  readonly onSetTimeRange: (presetId: string) => void
  readonly onResetFilters: () => void
  readonly hasActiveFilters: boolean
  /** Called when user clicks Rehydrate on a receipt. */
  readonly onRehydrate: (receipt: LaunchReceipt) => void
}

// ============================================================================
// Component
// ============================================================================

/**
 * Z3 full Evidence Ledger panel.
 *
 * Layout:
 * 1. Panel header ("Evidence Ledger" + receipt count)
 * 2. Faceted filter bar (4 facet rows)
 * 3. Scrollable receipt list (newest first, infinite scroll)
 * 4. Empty state when no receipts match
 *
 * Glass material: station-panel class from WS-2.6.
 */
export function TimelinePanel({
  receipts,
  isLoading,
  isLoadingMore,
  hasMore,
  totalCount,
  onLoadMore,
  filters,
  onToggleSource,
  onToggleEventType,
  onToggleSeverity,
  onSetTimeRange,
  onResetFilters,
  hasActiveFilters,
  onRehydrate,
  className,
  ...props
}: TimelinePanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Infinite scroll: load more when near the bottom.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || isLoadingMore || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 200) {
      onLoadMore()
    }
  }, [isLoadingMore, hasMore, onLoadMore])

  return (
    <div className={cn('timeline-panel station-panel', className)} {...props}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <span
          className="font-sans text-[11px] font-normal tracking-[0.04em] uppercase opacity-50"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Evidence Ledger
        </span>
        <div className="mt-1 flex items-baseline justify-between">
          <h2
            className="font-sans text-[16px] font-semibold tracking-[0.02em]"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Receipt Timeline
          </h2>
          <span
            className="font-mono text-[11px] opacity-40"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {totalCount} receipts
          </span>
        </div>
      </div>

      {/* Faceted filters */}
      <FacetedFilter
        filters={filters}
        onToggleSource={onToggleSource}
        onToggleEventType={onToggleEventType}
        onToggleSeverity={onToggleSeverity}
        onSetTimeRange={onSetTimeRange}
        onResetAll={onResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Receipt list */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} onScroll={handleScroll} className="max-h-[400px] overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin opacity-30" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && receipts.length === 0 && (
            <div className="timeline-empty">
              <div className="timeline-empty-icon">--</div>
              <p className="timeline-empty-text">
                {hasActiveFilters
                  ? 'No receipts match the active filters.'
                  : 'No receipts recorded yet. Actions in the Launch generate receipts automatically.'}
              </p>
            </div>
          )}

          {/* Receipt items */}
          {!isLoading &&
            receipts.map((receipt) => (
              <TimelineItem key={receipt.id} receipt={receipt} onRehydrate={onRehydrate} />
            ))}

          {/* Loading more indicator */}
          {isLoadingMore && (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={14} className="animate-spin opacity-20" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

### 4.13 Evidence Ledger District (Root) -- `src/components/evidence-ledger/evidence-ledger-district.tsx`

```tsx
'use client'

import { type ComponentProps } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import type { SemanticLevel } from '@/lib/interfaces/types'
import type { ReceiptStore } from '@/lib/interfaces/receipt-store'
import type { CameraController } from '@/lib/interfaces/camera-controller'
import type { SystemStateProvider } from '@/lib/interfaces/system-state-provider'
import { useFacetedFilter } from '@/hooks/use-faceted-filter'
import { useReceiptTimeline } from '@/hooks/use-receipt-timeline'
import { useRehydration } from '@/hooks/use-rehydration'
import { TimelineStrip } from './timeline-strip'
import { TimelinePanel } from './timeline-panel'
import { MetricComparison } from './metric-comparison'
import './evidence-ledger.css'

// ============================================================================
// Constants
// ============================================================================

/**
 * NW quadrant position in world coordinates.
 * Positioned above-left of the capsule ring.
 * These values should align with the spatial layout defined in WS-1.1.
 */
export const EVIDENCE_LEDGER_POSITION = {
  x: -480,
  y: -400,
} as const

// ============================================================================
// Props
// ============================================================================

export interface EvidenceLedgerDistrictProps extends ComponentProps<'div'> {
  /** Current semantic zoom level from useSemanticZoom(). */
  readonly semanticLevel: SemanticLevel
  /** The ReceiptStore for querying receipts. */
  readonly receiptStore: ReceiptStore
  /** The CameraController for rehydration viewport restore. */
  readonly cameraController: CameraController
  /** The SystemStateProvider for metric comparison. */
  readonly systemStateProvider: SystemStateProvider
}

// ============================================================================
// Component
// ============================================================================

/**
 * Evidence Ledger -- NW district on the spatial canvas.
 *
 * Renders at two semantic zoom levels:
 * - Z2: Compressed timeline strip (density bar + label).
 * - Z3: Full interactive panel (facets + receipt list + detail + rehydration).
 *
 * Positioned at EVIDENCE_LEDGER_POSITION in world coordinates using
 * `position: absolute` inside the SpatialCanvas container.
 *
 * Not rendered at Z0 or Z1 (too zoomed out for detail).
 */
export function EvidenceLedgerDistrict({
  semanticLevel,
  receiptStore,
  cameraController,
  systemStateProvider,
  className,
  style,
  ...props
}: EvidenceLedgerDistrictProps) {
  // Filter state.
  const {
    filters,
    toggleSource,
    toggleEventType,
    toggleSeverity,
    setTimeRange,
    resetAll,
    hasActiveFilters,
    toReceiptFilters,
  } = useFacetedFilter()

  // Receipt timeline data.
  const {
    receipts,
    isLoading,
    isLoadingMore,
    hasMore,
    totalCount,
    loadMore,
    // refresh is available but not wired to a UI element yet.
  } = useReceiptTimeline({
    receiptStore,
    filters: toReceiptFilters(),
  })

  // Rehydration state.
  const {
    state: rehydrationState,
    rehydrate,
    dismissComparison,
  } = useRehydration({
    cameraController,
    systemStateProvider,
  })

  // Only render at Z2 and Z3.
  const isVisible = semanticLevel === 'Z2' || semanticLevel === 'Z3'

  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div
      className={cn('absolute', className)}
      style={{
        left: EVIDENCE_LEDGER_POSITION.x,
        top: EVIDENCE_LEDGER_POSITION.y,
        ...style,
      }}
      data-district="evidence-ledger"
      {...props}
    >
      <AnimatePresence mode="wait">
        {/* Z2: Compressed strip */}
        {semanticLevel === 'Z2' && (
          <motion.div
            key="z2-strip"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: reducedMotion ? 0 : 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-[360px]"
          >
            <div className="mb-2">
              <span className="evidence-ledger-z2-label">Evidence Ledger</span>
              <span className="evidence-ledger-z2-subtitle ml-3">{totalCount} receipts</span>
            </div>
            <TimelineStrip
              receipts={receipts}
              segmentCount={48}
              timeRangeMs={24 * 60 * 60 * 1000}
            />
          </motion.div>
        )}

        {/* Z3: Full panel */}
        {semanticLevel === 'Z3' && (
          <motion.div
            key="z3-panel"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            <TimelinePanel
              receipts={receipts}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              totalCount={totalCount}
              onLoadMore={loadMore}
              filters={filters}
              onToggleSource={toggleSource}
              onToggleEventType={toggleEventType}
              onToggleSeverity={toggleSeverity}
              onSetTimeRange={setTimeRange}
              onResetFilters={resetAll}
              hasActiveFilters={hasActiveFilters}
              onRehydrate={rehydrate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric comparison overlay (shown after rehydration) */}
      <AnimatePresence>
        {rehydrationState.showComparison &&
          rehydrationState.thenState &&
          rehydrationState.nowState &&
          rehydrationState.appName && (
            <motion.div
              key="metric-comparison"
              className="fixed right-6 bottom-6 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <MetricComparison
                thenState={rehydrationState.thenState}
                nowState={rehydrationState.nowState}
                appName={rehydrationState.appName}
                onDismiss={dismissComparison}
              />
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  )
}
```

### 4.14 Barrel Export -- `src/components/evidence-ledger/index.ts`

```ts
// Evidence Ledger -- NW district components and hooks.
// WS-3.2: Chronological timeline of Launch receipts and app events.

export { EvidenceLedgerDistrict, EVIDENCE_LEDGER_POSITION } from './evidence-ledger-district'
export type { EvidenceLedgerDistrictProps } from './evidence-ledger-district'

export { TimelineStrip } from './timeline-strip'
export type { TimelineStripProps } from './timeline-strip'

export { TimelinePanel } from './timeline-panel'
export type { TimelinePanelProps } from './timeline-panel'

export { TimelineItem } from './timeline-item'
export type { TimelineItemProps } from './timeline-item'

export { ReceiptDetailPanel } from './receipt-detail-panel'
export type { ReceiptDetailPanelProps } from './receipt-detail-panel'

export { FacetedFilter, TIME_RANGE_PRESETS } from './faceted-filter'
export type { FacetedFilterProps } from './faceted-filter'

export { FacetChip } from './facet-chip'
export type { FacetChipProps } from './facet-chip'

export { MetricComparison } from './metric-comparison'
export type { MetricComparisonProps, MetricDelta } from './metric-comparison'
```

---

## 5. Acceptance Criteria

| #     | Criterion                                                                                    | Verification                                                                                                                 |
| ----- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | Timeline displays receipts in reverse chronological order (newest first)                     | Manual: create 5 receipts, verify order in timeline                                                                          |
| AC-2  | All 4 facets filter receipts independently (Source, Type, Severity, Time Range)              | Manual: activate each facet, verify filtered results                                                                         |
| AC-3  | Facets combine with AND logic across groups and OR logic within groups                       | Manual: select "error" + "action" in Type AND "Agent Builder" in Source; verify only Agent Builder errors and actions appear |
| AC-4  | Z2 renders compressed timeline strip with density bars                                       | Visual: zoom to Z2, verify horizontal density bar appears with colored segments                                              |
| AC-5  | Z3 renders full timeline panel with faceted filter bar and scrollable receipt list           | Visual: zoom to Z3, verify panel with all 4 facet rows and receipt list                                                      |
| AC-6  | Z2 actor color coding: teal for human, ember for AI, gray for system                         | Visual: create receipts with different actors, verify strip segment colors                                                   |
| AC-7  | Clicking "Rehydrate" on a receipt navigates the viewport to the receipt's location           | Manual: create a receipt at Z3 Agent Builder > Pipeline, navigate away, click Rehydrate, verify camera flies back            |
| AC-8  | Metric comparison overlay shows after rehydration with Then vs Now values                    | Manual: verify overlay appears after rehydration with 5 metric rows                                                          |
| AC-9  | Metric comparison overlay is dismissible via close button                                    | Manual: click X, verify overlay disappears                                                                                   |
| AC-10 | New receipts appear at the top of the timeline in real-time (no refresh needed)              | Manual: trigger an action in another district, verify receipt appears in ledger                                              |
| AC-11 | Empty state is displayed when no receipts match active filters                               | Manual: apply filters that match nothing, verify empty state message and "Clear filters" button                              |
| AC-12 | Loading state (spinner) is shown while initial receipt query is in flight                    | Manual: verify spinner on first load                                                                                         |
| AC-13 | Infinite scroll loads more receipts when scrolling near the bottom                           | Manual: create >50 receipts, scroll to bottom, verify more load                                                              |
| AC-14 | Evidence Ledger is positioned in the NW quadrant of the spatial canvas                       | Visual: zoom out, verify ledger is above-left of the capsule ring                                                            |
| AC-15 | Glass material matches WS-2.6 station panel treatment (station-panel CSS class)              | Visual: compare glass appearance with a station panel                                                                        |
| AC-16 | Typography follows VISUAL-DESIGN-SPEC.md Z2/Z3 scales                                        | Visual: verify font sizes, weights, tracking, opacity values                                                                 |
| AC-17 | `prefers-reduced-motion` disables all animations (rehydration fly, density pulse, highlight) | Manual: enable reduced motion in OS, verify instant transitions                                                              |
| AC-18 | Pan-state performance fallback disables `backdrop-filter` during canvas pan                  | Performance: pan the canvas, verify no frame drops from glass blur                                                           |
| AC-19 | Receipt detail expansion shows all 12 fields including AI metadata when present              | Manual: create an AI-initiated receipt, expand it, verify all fields visible                                                 |
| AC-20 | "Clear filters" button resets all facets to default (no filters)                             | Manual: activate filters, click "Clear filters," verify all chips deselected                                                 |

---

## 6. Decisions Made

| #   | Decision                                                                                                                                   | Rationale                                                                                                                                                                            | Alternatives Considered                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Evidence Ledger uses the station panel glass material (`.station-panel` CSS class) from WS-2.6                                             | Visual consistency with station panels; reuse existing CSS; matches VISUAL-DESIGN-SPEC.md glass recipes                                                                              | Custom glass treatment (rejected: visual drift from the rest of the ZUI)                                                           |
| D-2 | Z2 strip uses a horizontal density bar, not a vertical timeline                                                                            | Horizontal aligns with the spatial canvas left-to-right reading direction; density bars are glanceable; vertical timelines require too much vertical space at Z2                     | Vertical timeline strip (rejected: too tall for Z2 district), sparkline (rejected: less information density)                       |
| D-3 | Facets use multi-select within each group (OR logic) and AND across groups                                                                 | Standard faceted search UX pattern; users expect to select "error OR warning" within severity but "errors from Agent Builder" across facets                                          | Single-select per facet (rejected: too restrictive), free-text only (rejected: not discoverable)                                   |
| D-4 | Time range presets: 1h, 24h, 7d, 30d, All (per combined-recommendations.md)                                                                | Covers common monitoring windows; "custom" deferred to reduce initial scope; "All" is the default                                                                                    | Date picker (deferred to Open Question), sliding window (rejected: complex UX)                                                     |
| D-5 | Metric comparison uses SystemStateProvider.getAppState() for current data; historical data via optional `fetchHistoricalSnapshot` callback | Graceful degradation: comparison works even without historical snapshots (shows current vs current as fallback); Phase 3 WS-3.1 provides snapshot storage                            | Always require historical snapshot (rejected: blocks functionality on WS-3.1 snapshot storage completion)                          |
| D-6 | Rehydration navigates via CameraController.navigate() with spring animation                                                                | Uses the existing CameraController contract; consistent with all other navigation in the Launch; generates a receipt for the navigation itself                                       | Direct camera store mutation (rejected: bypasses receipt generation), instant jump (rejected: disorienting)                        |
| D-7 | Timeline pagination loads 50 receipts per page via infinite scroll                                                                         | Expected volume is 5-15 receipts per session (AD-6), but historical data may accumulate; 50 is a safe initial page size; infinite scroll avoids explicit pagination controls         | Offset/limit buttons (rejected: dated UX), load all (rejected: could be slow with accumulated history)                             |
| D-8 | Actor color coding uses teal-bright for human, ember-glow for AI, text-tertiary for system                                                 | Dual-accent system from VISUAL-DESIGN-SPEC.md: teal is the "data/information" accent, ember is the "action/AI" accent; system is neutral                                             | Blue/orange (rejected: not aligned with design token system), single color with badges only (rejected: less glanceable)            |
| D-9 | Evidence Ledger is not rendered at Z0 or Z1 (only Z2 and Z3)                                                                               | At Z0, the ledger would be too small to read; at Z1, the capsule ring is the focus and adding a side panel would clutter the atrium; Z2/Z3 are the natural "investigate" zoom levels | Always visible as HUD overlay (rejected: occludes capsules), Z1 as a miniature badge (rejected: adds complexity for minimal value) |

---

## 7. Open Questions

| #    | Question                                                                                                                       | Impact                                                                                                                                                                 | Owner                         | Proposed Resolution                                                                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OQ-1 | Should the Evidence Ledger have a beacon glyph at Z0/Z1, like the app district capsules?                                       | Low -- a glyph would provide a navigation target, but the ledger is not a monitored app. Without a glyph, users reach the ledger by panning NW or via command palette. | UX Designer                   | Add a subtle NW beacon at Z0 (dim teal glyph, no health bar), and a compact "Evidence" label at Z1. Defer implementation until after Z2/Z3 panel is proven.        |
| OQ-2 | Which telemetry metrics should the metric comparison show beyond the 5 universal capsule fields?                               | Medium -- app-specific metrics (pipeline queue depth, conversation count) would enrich the comparison but require per-app mapping logic.                               | Product Owner                 | Start with the 5 universal fields (Health, Pulse, Last Event, Alerts, Freshness). Add app-specific rows in a fast-follow if users request them.                    |
| OQ-3 | Should receipt rehydration auto-scroll the timeline to show the rehydrated receipt when the user navigates back to the ledger? | Low -- usability convenience.                                                                                                                                          | UX Designer                   | Yes, store the rehydrated receipt ID and scroll to it when the ledger regains focus. Implement as an enhancement after core rehydration works.                     |
| OQ-4 | Custom time range: date picker or text input for the "custom" time facet?                                                      | Low -- the 4 presets (1h/24h/7d/30d) cover most cases.                                                                                                                 | UX Designer                   | Defer custom time range UI to a fast-follow. Ship with presets + "All" only. Add the `custom` preset when a date picker component is available from @tarva/ui.     |
| OQ-5 | Should correlation chains be visually connected in the timeline (e.g., a vertical connector line between correlated receipts)? | Medium -- improves causal understanding but adds rendering complexity.                                                                                                 | React Developer               | Defer to Phase 4. For now, the receipt detail panel shows the correlation ID, and users can mentally connect related events. Phase 4 adds a "show related" action. |
| OQ-6 | What are the exact NW world coordinates for the Evidence Ledger district?                                                      | High -- affects spatial layout collision with capsule ring and other districts.                                                                                        | UX Designer + React Developer | Proposed: `(-480, -400)` in world coordinates, placing the ledger above-left of the capsule ring at Z1. Validate during integration with WS-1.1 spatial layout.    |

---

## 8. Risk Register

| #   | Risk                                                                                                                                      | Likelihood | Impact | Severity | Mitigation                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1 | Receipt volume from accumulated sessions makes timeline queries slow (>500ms)                                                             | Medium     | Medium | Medium   | Pagination limits queries to 50 receipts. TanStack Query caching prevents redundant fetches. Add Supabase indexes on `timestamp`, `source`, `event_type`, `severity` in WS-3.1. If needed, add client-side virtualization (TanStack Virtual) for the timeline list.                                      |
| R-2 | Historical metric snapshots are not available for rehydration comparison (WS-3.1 snapshot storage not implemented yet)                    | High       | Low    | Low      | The `useRehydration` hook gracefully degrades: if `fetchHistoricalSnapshot` is not provided or returns null, the comparison uses current state for both columns. Users still get viewport restoration and target highlighting. Metric comparison becomes accurate once WS-3.1 delivers snapshot storage. |
| R-3 | Rehydration navigates to a district/station that has been restructured since the receipt was created (e.g., station renamed, app offline) | Low        | Medium | Low      | CameraController.navigate() falls back to district center if station is not found (per ManualCameraController in WS-1.7). If district is also invalid, falls back to home. Show a toast notification: "Original location no longer available. Showing closest match."                                    |
| R-4 | Faceted filter combinations result in zero matches frequently, causing user confusion                                                     | Medium     | Low    | Low      | Empty state includes specific messaging ("No receipts match the active filters") and a prominent "Clear filters" button. Each facet chip could show a count badge (enhancement) to preview the number of matching receipts before selecting.                                                             |
| R-5 | Z2 timeline strip density bar is not visually legible with low receipt counts (<10 receipts in 24h)                                       | Medium     | Low    | Low      | Minimum segment height of 8% ensures even single-receipt segments are visible. For very low counts, the strip shows a sparse pattern that reads as "quiet system" -- which is accurate. Add a "No recent activity" label if all segments are empty.                                                      |
| R-6 | Glass `backdrop-filter` on the timeline panel causes frame drops during Z2-to-Z3 zoom transition                                          | Medium     | Medium | Medium   | Pan-state performance fallback (inherited from WS-2.6) disables `backdrop-filter` during zoom transitions. The panel uses `contain: layout style paint` for browser compositing optimization. If insufficient, add a `will-change: transform` hint during the entrance animation only.                   |
| R-7 | Real-time receipt subscription causes excessive re-renders in the timeline list                                                           | Low        | Medium | Low      | New receipts are prepended via `setReceipts(prev => [newReceipt, ...prev])` which triggers a single state update. React's reconciliation handles the prepend efficiently. If volume spikes, batch subscription updates with a 100ms debounce.                                                            |
