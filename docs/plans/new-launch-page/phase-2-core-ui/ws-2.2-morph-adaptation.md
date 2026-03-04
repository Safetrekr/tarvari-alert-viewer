# WS-2.2: Morph Adaptation

> **Workstream ID:** WS-2.2
> **Phase:** 2 -- Core UI
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-04
> **Depends On:** WS-1.2, WS-2.1
> **Blocks:** WS-3.1 (district view needs working morph to test)
> **Resolves:** Decision 3 (Morph Animation: Scale + Fade)

## 1. Objective

Make the morph drill-down functional for the coverage grid. WS-2.1 replaced the capsule ring with a CSS Grid of `CategoryCard` items but left the morph drill-down non-functional (WS-2.1 AC-17) because all positioning and animation logic was ring-specific (rotation, ring shift, capsule center computation). This workstream rewires the morph orchestrator, choreography hook, detail panel, connector lines, and morph CSS so that clicking a `CategoryCard` triggers the scale+fade animation from Decision 3, positions the detail panel correctly relative to the grid, and syncs the URL with `?category=` instead of `?district=`. It also archives the 8 ring/capsule-era component files that are no longer imported.

The gate criterion is: click a category card, observe the morph animation (selected card scales to 1.2x, siblings fade to 0.3 opacity, detail panel slides in from the right), press Escape to reverse, and confirm the URL updates to `?category={id}` on settle and clears on reverse.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Rewrite: `morph-orchestrator.tsx` | Remove ring rotation logic (`computeRingRotation`, `RING_SHIFT`, `selectedRingIndex`, `selectedCapsuleCenter`, `ringShift` computations). Replace with grid-aware card selection that computes panel position from the grid container, not ring geometry. Panel always docks to the right of the viewport. |
| Update: `use-morph-choreography.ts` | Replace `?district=` URL param with `?category=` in `syncUrlDistrict()`. Rename function to `syncUrlCategory()`. Keep morph phase state machine, timing constants, and keyboard Escape handler unchanged. |
| Reposition: `detail-panel.tsx` | Remove `ringIndex` prop and ring-relative positioning (`getPanelSide`, `computePanelPosition`, `RING_CENTER` import). Replace with grid-relative fixed-right positioning. The panel slides in from the right at a fixed viewport position during non-promoted mode. |
| Simplify: `connector-lines.tsx` | Remove ring rotation matrix math (`radians`, `rotatedRelX/Y`, `scale`, `shiftX`). Replace with a simple horizontal dashed line from the selected card's right edge to the panel's left edge, or remove entirely if the spatial relationship is self-evident in the grid layout. |
| Add: grid morph CSS to `morph.css` | New selectors targeting `[data-category-card]` for scale+fade during morph phases. Replace `.district-capsule` selectors. Add `@keyframes` for selected card glow pulse. Keep `morph-panels-scatter` and `morph-ambient-fade` CSS classes unchanged. |
| Clean up: `morph-types.ts` | Remove ring-specific geometry helpers (`computeRingRotation`, `normalizeAngle`, `getPanelSide`, `computePanelPosition`, `RING_SHIFT`, `CAPSULE_DIMENSIONS`). Add grid-aware panel positioning function and grid card dimension constant. Keep morph state machine types, timing configs, `DETAIL_PANEL_DIMENSIONS`, and station entrance config. |
| Update: `use-morph-variants.ts` | Change variant values per Decision 3: `selected` becomes `{ scale: 1.2, opacity: 1 }` (was `{ opacity: 0.25, scale: 1 }`); `dimmed` becomes `{ opacity: 0.3, scale: 1 }` (was `{ opacity: 0.5, scale: 1 }`). Keep `idle` and `hover` variants. |
| Archive: 8 capsule/ring-era component files | Move to `src/components/districts/_archived/`. Remove all active-code imports. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| District view scene content (`CategoryDetailScene`) | WS-3.1 creates the data-driven detail scene that renders inside the district view overlay |
| District view overlay transitions (`entering-district`, `district`, `leaving-district` phases) | The phase machine stays identical; WS-3.1 changes what renders inside the overlay |
| Chrome label updates (top telemetry bar, bottom status strip) | WS-3.2 updates these |
| Map rendering | WS-4.1 adds MapLibre |
| `CoverageGrid` or `CategoryCard` component internals | Created by WS-2.1; this workstream only changes how the orchestrator interacts with them |
| `coverage.store.ts` filter state sync | WS-1.3 created the store; the morph choreography hook syncs the URL param but does not write to the coverage store directly |
| Type widening (`DistrictId` to `NodeId`) | Completed by WS-1.2 |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/district.ts` (WS-1.2) | `NodeId = string` type replacing `DistrictId`; `MorphState.targetId` typed as `string` | Completed by WS-1.2 |
| `src/components/coverage/CoverageGrid.tsx` (WS-2.1) | `CoverageGrid` component with `selectedId`, `onSelect`, `morphPhase`, `children` props; exports `GRID_WIDTH` (1500), `GRID_HEIGHT` (400), `CARD_WIDTH` (160), `CARD_HEIGHT` (180), `GRID_GAP` (16), `GRID_COLUMNS` (8) | Completed by WS-2.1 |
| `src/components/coverage/CategoryCard.tsx` (WS-2.1) | `CategoryCard` with `data-category-card` attribute, `motion/react` `variants` prop consuming `capsuleStateVariants`, `isSelected`/`hasSelection` state resolution | Completed by WS-2.1 |
| `src/components/coverage/CategoryIconGrid.tsx` (WS-2.1) | `CategoryIconGrid` with `onIconSelect` callback accepting `NodeId` | Completed by WS-2.1 |
| `src/stores/ui.store.ts` | `useUIStore` with `startMorph`, `reverseMorph`, `setMorphPhase`, `resetMorph` actions; `uiSelectors.morphPhase`, `uiSelectors.morphTargetId`, `uiSelectors.isMorphing` selectors | Available (unchanged) |
| `src/hooks/use-semantic-zoom.ts` | `useSemanticZoom()` returning `{ isConstellation }` for Z0/Z1+ gating | Available (unchanged) |
| `src/lib/morph-types.ts` | `MorphPhase`, `MorphDirection`, `MorphState`, `MORPH_TIMING` (expanding: 400, settledHold: 200), `MORPH_TIMING_REDUCED`, `DETAIL_PANEL_DIMENSIONS` (width: 900, height: 680) | Available (this WS modifies it) |
| `src/stores/camera.store.ts` | `useCameraStore.getState().flyTo()`, `viewportWidth`, `viewportHeight` | Available (unchanged) |

## 4. Deliverables

### 4.1 Rewrite `morph-orchestrator.tsx` -- Remove Ring Geometry, Add Grid Selection

**Path:** `src/components/districts/morph-orchestrator.tsx`

#### 4.1.1 Imports to Remove

```typescript
// REMOVE these imports (lines 26-28, 31):
import { computeRingRotation, RING_SHIFT } from '@/lib/morph-types'
import { CapsuleRing, computeCapsuleCenter, RING_CENTER } from './capsule-ring'
import { ConstellationView } from './constellation-view'
import type { CapsuleData, DistrictId } from '@/lib/interfaces/district'
```

After WS-2.1, the `CapsuleRing` and `ConstellationView` imports should already be replaced with `CoverageGrid` and `CategoryIconGrid`. The remaining ring-geometry imports (`computeRingRotation`, `RING_SHIFT`, `computeCapsuleCenter`, `RING_CENTER`) must now be removed.

#### 4.1.2 Imports to Add

```typescript
import { GRID_WIDTH } from '@/components/coverage/CoverageGrid'
import { GRID_PANEL_POSITION, DETAIL_PANEL_DIMENSIONS } from '@/lib/morph-types'
```

#### 4.1.3 Remove Ring-Specific Computations

Remove the following `useMemo` blocks (current lines 86-114):

1. **`selectedRingIndex`** (lines 86-90): `getDistrictById(targetId)?.ringIndex` -- returns `null` for category IDs, making the entire panel chain fail. Remove entirely.

2. **`selectedCapsuleCenter`** (lines 92-95): `computeCapsuleCenter(selectedRingIndex)` -- depends on removed `selectedRingIndex`. Remove entirely.

3. **`ringRotation` / `panelSide`** (lines 98-104): `computeRingRotation(selectedRingIndex)` -- ring-rotation geometry that has no grid equivalent. Remove entirely.

4. **`ringShift`** (lines 107-114): `RING_SHIFT.offset`, `RING_SHIFT.scale` -- the grid does not shift or scale during morph. Remove entirely.

#### 4.1.4 Replace with Grid-Aware Panel Logic

The detail panel always appears on the right side of the viewport for the grid layout. No left/right decision is needed because the grid is centered at world origin and the panel docks to a fixed viewport position.

```typescript
// Panel visibility: show when morphing forward or settled
const showPanel =
  targetId !== null &&
  (phase === 'expanding' && direction === 'forward' ||
   phase === 'settled' ||
   phase === 'entering-district' ||
   phase === 'district')

// Panel is "promoted" to fixed viewport-centered during district view
const isDistrictView = phase === 'entering-district' || phase === 'district'

// Connector lines hidden during district view overlay
const showConnector = showPanel && !isDistrictView
```

Key difference from current code: the `showPanel` guard no longer requires `selectedCapsuleCenter !== null` or `selectedRingIndex !== null`. The panel renders whenever there is a valid `targetId` and the phase is appropriate. Panel positioning is computed in `detail-panel.tsx` using grid-aware constants, not ring geometry.

#### 4.1.5 Update Portalled Panel Render

Replace the portalled `DetailPanel` render (current lines 180-195):

```typescript
// BEFORE:
<DetailPanel
  key="promoted-panel"
  districtId={targetId!}
  ringIndex={selectedRingIndex!}
  onClose={reverseMorph}
  promoted
  dockSide={panelSide ?? 'right'}
/>

// AFTER:
<DetailPanel
  key="promoted-panel"
  categoryId={targetId!}
  onClose={reverseMorph}
  promoted={isDistrictView}
/>
```

Props changes: `districtId` renamed to `categoryId`; `ringIndex` removed; `dockSide` removed (always right); `promoted` passes the computed boolean directly instead of always `true`.

#### 4.1.6 Update `handleBeaconSelect` for Grid Z0 Click

The Z0 icon click handler (current lines 63-83) calls `getDistrictWorldPosition(district.ringIndex)` to fly the camera to the ring position, then starts the morph after 350ms. For the grid layout, the target is always the world origin (0, 0) since the grid is centered there.

```typescript
const handleIconSelect = useCallback(
  (id: NodeId) => {
    if (phase !== 'idle') return

    const { viewportWidth, viewportHeight, flyTo } = useCameraStore.getState()
    const targetZoom = 1.0
    const targetOffsetX = viewportWidth / 2
    const targetOffsetY = viewportHeight / 2
    flyTo(targetOffsetX, targetOffsetY, targetZoom)

    setTimeout(() => {
      startMorph(id)
    }, 350)
  },
  [phase, startMorph],
)
```

Rename `handleBeaconSelect` to `handleIconSelect` (matches `CategoryIconGrid`'s `onIconSelect` prop name).

#### 4.1.7 Update ConnectorLines Render

Replace the current `ConnectorLines` render (current lines 165-173) with the simplified grid connector:

```typescript
<AnimatePresence>
  {showConnector && targetId !== null && (
    <GridConnectorLine
      key="connector"
      targetId={targetId}
      gridWidth={GRID_WIDTH}
    />
  )}
</AnimatePresence>
```

Or remove the connector lines entirely (see Open Question OQ-1).

#### 4.1.8 Remove Click-Outside Backdrop Ring Guards

The click-outside backdrop (current lines 153-163) is currently inside the `CapsuleRing` children. After WS-2.1 it moved inside `CoverageGrid` children. No ring-specific changes needed, but verify the `!isDistrictView` guard still works correctly.

---

### 4.2 Update `use-morph-choreography.ts` -- URL Param `district` to `category`

**Path:** `src/hooks/use-morph-choreography.ts`

#### 4.2.1 Rename and Update `syncUrlDistrict`

Current function (lines 206-215):

```typescript
// BEFORE:
function syncUrlDistrict(districtId: DistrictId | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (districtId) {
    url.searchParams.set('district', districtId)
  } else {
    url.searchParams.delete('district')
  }
  window.history.replaceState({}, '', url.toString())
}
```

Replace with:

```typescript
// AFTER:
function syncUrlCategory(categoryId: string | null): void {
  if (typeof window === 'undefined') return
  const url = new URL(window.location.href)
  if (categoryId) {
    url.searchParams.set('category', categoryId)
  } else {
    url.searchParams.delete('category')
  }
  window.history.replaceState({}, '', url.toString())
}
```

Changes:
- Function name: `syncUrlDistrict` to `syncUrlCategory`
- Parameter name: `districtId` to `categoryId`
- Parameter type: `DistrictId | null` to `string | null` (uses `NodeId` which is `string` after WS-1.2)
- URL param key: `'district'` to `'category'` (3 occurrences: set, delete, and JSDoc)

#### 4.2.2 Update Call Sites

Two call sites in the choreography hook:

1. **Forward flow settled phase** (line 118): `syncUrlDistrict(targetId)` becomes `syncUrlCategory(targetId)`
2. **Reverse flow** (lines 143-144, 152-153): `syncUrlDistrict(null)` becomes `syncUrlCategory(null)` (2 occurrences)

#### 4.2.3 Update Module JSDoc

Update the module docblock (lines 1-33) to reference "category" instead of "district" in the phase descriptions:

- Line 8: `-> startMorph(districtId)` becomes `-> startMorph(categoryId)`
- Line 15: `URL updated with ?district={id}` becomes `URL updated with ?category={id}`
- Line 26: `URL district param removed` becomes `URL category param removed`

#### 4.2.4 No Changes to Phase Machine

The following must remain unchanged:
- `MORPH_TIMING.expanding` = 400ms (line 56-57 of `morph-types.ts`)
- `MORPH_TIMING.settledHold` = 200ms (line 58)
- Forward flow: `idle` -> `expanding` (400ms) -> `settled` (200ms hold) -> `entering-district` (600ms) -> `district`
- Reverse flow: `settled` -> `expanding` (300ms = 400 * 0.75) -> `idle`; or `district` -> `leaving-district` (400ms) -> `idle`
- Keyboard Escape handler (lines 161-170)
- Timer cleanup on unmount (lines 97-101)

---

### 4.3 Reposition `detail-panel.tsx` -- Grid-Relative Fixed-Right

**Path:** `src/components/districts/detail-panel.tsx`

#### 4.3.1 Remove Ring-Specific Imports

```typescript
// REMOVE (lines 19-24):
import {
  DETAIL_PANEL_DIMENSIONS,
  getPanelSide,
  computePanelPosition,
} from '@/lib/morph-types'
import { RING_CENTER } from './capsule-ring'
import { DistrictContent } from './district-content'

// KEEP:
import { DETAIL_PANEL_DIMENSIONS } from '@/lib/morph-types'

// ADD:
import type { NodeId } from '@/lib/interfaces/district'
```

Also remove `getDistrictById` import from `@/lib/spatial-actions` (line 18).

#### 4.3.2 Simplify Props Interface

```typescript
// BEFORE (lines 31-40):
interface DetailPanelProps {
  districtId: DistrictId
  ringIndex: number
  onClose: () => void
  promoted?: boolean
  dockSide?: 'left' | 'right'
}

// AFTER:
interface DetailPanelProps {
  /** Category ID being expanded. */
  categoryId: NodeId
  /** Close handler (triggers reverse morph). */
  onClose: () => void
  /** When true, panel is promoted to viewport-centered overlay (district view). */
  promoted?: boolean
}
```

Removed: `ringIndex` (no ring), `dockSide` (always right).

#### 4.3.3 Remove Ring-Based Position Computation

Remove these lines from the component body (current lines 53-58):

```typescript
// REMOVE:
const district = getDistrictById(districtId)
const displayName = district?.displayName ?? districtId
const side = getPanelSide(ringIndex)
const position = computePanelPosition(ringIndex, RING_CENTER)
const slideDirection = side === 'right' ? 40 : -40
```

Replace with:

```typescript
// AFTER:
const displayName = categoryId  // WS-3.1 will resolve to category display name
const slideDirection = 40       // Always slides in from the right
```

The `displayName` will show the raw category ID string (e.g., `'seismic'`) until WS-3.1 provides `getCategoryMeta(categoryId).displayName`. This is acceptable for the morph gate criterion (the animation works; the content is WS-3.1's scope).

#### 4.3.4 Replace Positioning Styles

The non-promoted panel currently uses absolute positioning within the ring container (lines 77-83). Replace with fixed-right viewport positioning:

```typescript
// BEFORE (non-promoted):
{
  position: 'absolute' as const,
  left: position.left,
  top: position.top,
  width: DETAIL_PANEL_DIMENSIONS.width,
  height: DETAIL_PANEL_DIMENSIONS.height,
  zIndex: 20,
  pointerEvents: 'auto',
}

// AFTER (non-promoted):
{
  position: 'fixed' as const,
  right: 40,
  top: '50%',
  transform: 'translateY(-50%)',
  width: DETAIL_PANEL_DIMENSIONS.width,
  height: DETAIL_PANEL_DIMENSIONS.height,
  zIndex: 20,
  pointerEvents: 'auto',
}
```

The promoted style (lines 64-75) simplifies because `dockSide` is removed:

```typescript
// BEFORE (promoted):
{
  position: 'fixed',
  top: '22%',
  left: dockSide === 'right'
    ? 'calc((100vw - 360px) / 2 - 340px)'
    : 'calc(360px + (100vw - 360px) / 2 - 440px)',
  width: Math.min(DETAIL_PANEL_DIMENSIONS.width, 800),
  height: 'min(80vh, 680px)',
  zIndex: 33,
  pointerEvents: 'auto',
}

// AFTER (promoted):
{
  position: 'fixed',
  top: '22%',
  left: 'calc((100vw - 360px) / 2 - 340px)',
  width: Math.min(DETAIL_PANEL_DIMENSIONS.width, 800),
  height: 'min(80vh, 680px)',
  zIndex: 33,
  pointerEvents: 'auto',
}
```

#### 4.3.5 Update Motion Props

The `initial`/`animate`/`exit` motion props currently use `slideDirection` which was `+40` or `-40` depending on `side`. With the panel always on the right, `slideDirection` is always `+40`:

```typescript
initial={{ opacity: 0, x: 40, scale: 0.96 }}
animate={{ opacity: 1, x: 0, scale: 1 }}
exit={{
  opacity: 0,
  x: 27,           // 40 * 0.67
  scale: 0.96,
  transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
}}
```

The promoted motion props remain unchanged (they do not depend on ring geometry).

#### 4.3.6 Update `aria-label`

```typescript
// BEFORE:
aria-label={`Close ${displayName} district`}

// AFTER:
aria-label={`Close ${displayName} category`}
```

---

### 4.4 Simplify `connector-lines.tsx` for Grid Layout

**Path:** `src/components/districts/connector-lines.tsx`

#### 4.4.1 Assessment

The current `ConnectorLines` component (113 lines) performs ring rotation matrix math to transform the capsule center through the ring's `rotate(deg) + scale(s) + translate(shiftX, 0)` transform, then draws a dashed SVG line from the shifted capsule edge to the panel edge. This is tightly coupled to `RING_CENTER`, `RING_SIZE`, `CAPSULE_DIMENSIONS`, ring rotation, and ring shift.

For the grid layout, the connector concept is simpler: a horizontal dashed line from the selected card's right edge to the detail panel's left edge. However, since the card is in world-space (CSS-transformed canvas) and the panel is in viewport-space (fixed position), calculating a cross-coordinate-system connector is non-trivial and fragile.

#### 4.4.2 Recommended Approach: Remove Connector Lines

Remove the `ConnectorLines` component from the render tree in `morph-orchestrator.tsx`. The spatial relationship between a highlighted card (scaled 1.2x, full opacity) and a panel (sliding in from the right) is self-evident without a drawn connector, especially since the ring layout's complexity (6 capsules in a circle with rotation) was the original motivation for the connector.

If a visual connector is desired later, it can be added as a viewport-space SVG overlay in a separate workstream. The connector is not part of Decision 3's specification.

#### 4.4.3 Implementation

1. Remove `<ConnectorLines>` render from `morph-orchestrator.tsx` (and its `AnimatePresence` wrapper).
2. Remove `showConnector` variable computation.
3. Remove `ConnectorLines` import from `morph-orchestrator.tsx`.
4. Move `connector-lines.tsx` to the archive directory with the other ring-era files.

#### 4.4.4 Alternative: Simplified Grid Connector (if connector is desired)

If a visual connector is required, create a `GridConnectorLine` component that:

- Renders as a viewport-fixed SVG overlay (not in world-space)
- Draws a horizontal dashed line from the selected card's screen-space right edge to the panel's left edge
- Uses `getBoundingClientRect()` on the `[data-category-card][data-selected='true']` element and the `[data-detail-panel]` element
- Animates with `pathLength` draw-in (same as current: duration 0.4s, delay 0.05s, ease `[0.16, 1, 0.3, 1]`)
- Uses `ember-rgb` color: `rgba(var(--ember-rgb), 0.5)`, stroke width 2, dash `8 6`

This is documented as a fallback. The primary recommendation is removal.

---

### 4.5 Add Grid Morph CSS to `morph.css`

**Path:** `src/styles/morph.css`

#### 4.5.1 Replace `.district-capsule` Selectors

The current morph CSS targets `.district-capsule` (the class on `DistrictCapsule` components, line 121 of `district-capsule.tsx`). Replace with `[data-category-card]` (the attribute `CategoryCard` sets on its root element per WS-2.1).

```css
/* BEFORE (lines 10-17): */
[data-morph-phase='expanding'] .district-capsule,
[data-morph-phase='settled'] .district-capsule,
...

/* AFTER: */
[data-morph-phase='expanding'] [data-category-card],
[data-morph-phase='settled'] [data-category-card],
[data-morph-phase='entering-district'] [data-category-card],
[data-morph-phase='district'] [data-category-card],
[data-morph-phase='leaving-district'] [data-category-card] {
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
}
```

#### 4.5.2 Update Selected/Sibling Glow Selectors

Replace `[data-selected='true']` / `[data-selected='false']` selectors (lines 20-33) to work with `[data-category-card]`:

```css
/* --- Selected card glow during expanding/settled --- */
[data-morph-phase='expanding'] [data-category-card][data-selected='true'],
[data-morph-phase='settled'] [data-category-card][data-selected='true'] {
  box-shadow:
    inset 0 1px 0 0 rgba(var(--ambient-ink-rgb), 0.03),
    0 0 20px rgba(var(--ember-rgb), 0.12);
  transition: box-shadow 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* --- Sibling card glow removal during morph --- */
[data-morph-phase='expanding'] [data-category-card][data-selected='false'],
[data-morph-phase='settled'] [data-category-card][data-selected='false'] {
  box-shadow: none;
  transition: box-shadow 400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

Timing change: 300ms to 400ms to match `MORPH_TIMING.expanding` (400ms).

#### 4.5.3 Keep Panel Settle Pulse and Morph-Aware Ambient

The following CSS blocks remain unchanged:

- `@keyframes panel-settle-pulse` (lines 36-56) -- still applies to `[data-detail-panel]`
- `[data-morph-phase='settled'] [data-detail-panel]` animation (lines 58-61)
- `[data-panning='true'] [data-detail-panel]` disable (lines 64-70)
- `.morph-ambient-fade` class (lines 80-91) -- used by ambient elements, not capsule-specific
- `.morph-panels-scatter` class (lines 94-108) -- used by data panels, not capsule-specific
- `@media (prefers-reduced-motion: reduce)` block (lines 111-134) -- update `.district-capsule` references inside to `[data-category-card]`

#### 4.5.4 Update Reduced Motion Block

Inside the `@media (prefers-reduced-motion: reduce)` block (lines 116-119), update the selector:

```css
/* BEFORE: */
[data-morph-phase] [data-selected='true'],
[data-morph-phase] [data-selected='false'] {
  transition: none !important;
}

/* AFTER: */
[data-morph-phase] [data-category-card][data-selected='true'],
[data-morph-phase] [data-category-card][data-selected='false'] {
  transition: none !important;
}
```

---

### 4.6 Clean Up `morph-types.ts` -- Remove Ring Geometry

**Path:** `src/lib/morph-types.ts`

#### 4.6.1 Remove Ring-Specific Exports

Remove the following from `morph-types.ts`:

| Export | Lines | Reason |
|--------|-------|--------|
| `CAPSULE_DIMENSIONS` | 123-129 | Capsule sizing, no longer needed |
| `RING_SHIFT` | 140-145 | Ring shift during split-screen morph, no grid equivalent |
| `computeRingRotation()` | 165-186 | Ring rotation math |
| `normalizeAngle()` | 191-195 | Internal helper for ring rotation |
| `getPanelSide()` (deprecated) | 201-203 | Ring-relative panel side |
| `computePanelPosition()` | 216-233 | Ring-relative panel coordinates |

#### 4.6.2 Keep Unchanged

| Export | Lines | Reason |
|--------|-------|--------|
| `MorphPhase` type | 26-32 | State machine type, used everywhere |
| `MorphDirection` type | 38-39 | Forward/reverse, unchanged |
| `MorphTimingConfig` interface | 44-53 | Timing shape |
| `MORPH_TIMING` | 56-61 | expanding: 400, settledHold: 200, enteringDistrict: 600, leavingDistrict: 400 |
| `MORPH_TIMING_REDUCED` | 66-71 | All zeros for reduced motion |
| `MorphState` interface | 76-88 | Store state shape |
| `MorphActions` interface | 93-108 | Store action signatures |
| `DETAIL_PANEL_DIMENSIONS` | 115-121 | width: 900, height: 680, borderRadius: 32, padding: 40, gap: 140 |
| `PanelSide` type | 151 | Kept for backward compatibility; may be narrowed to `'right'` only |
| `StationEntranceConfig` | 242-255 | Station entrance animation config |

#### 4.6.3 Add Grid-Aware Panel Position

Add a simple function and constant for the grid layout panel position:

```typescript
// ============================================================
// GRID PANEL POSITIONING
// ============================================================

/** Fixed-right panel offset from viewport edge (px). */
export const GRID_PANEL_RIGHT_OFFSET = 40

/**
 * Compute the detail panel's fixed-position style for the grid layout.
 * Panel is vertically centered on the right side of the viewport.
 */
export const GRID_PANEL_POSITION = {
  right: GRID_PANEL_RIGHT_OFFSET,
  top: '50%',
  transform: 'translateY(-50%)',
} as const
```

This replaces the ring-relative `computePanelPosition()` and is consumed by `detail-panel.tsx`.

---

### 4.7 Update `use-morph-variants.ts` -- Scale + Fade Per Decision 3

**Path:** `src/hooks/use-morph-variants.ts`

#### 4.7.1 Update `capsuleStateVariants`

```typescript
// BEFORE (lines 34-54):
export const capsuleStateVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  hover: {
    scale: 1.06,
    transition: { type: 'spring', stiffness: 200, damping: 15, mass: 0.6 },
  },
  selected: {
    opacity: 0.25,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.5,
    scale: 1,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
}

// AFTER:
export const capsuleStateVariants: Variants = {
  idle: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 120, damping: 20, mass: 0.8 },
  },
  hover: {
    scale: 1.04,
    transition: { type: 'spring', stiffness: 200, damping: 15, mass: 0.6 },
  },
  selected: {
    opacity: 1,
    scale: 1.2,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
  dimmed: {
    opacity: 0.3,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
}
```

Changes per Decision 3:

| Variant | Property | Before | After | Rationale |
|---------|----------|--------|-------|-----------|
| `hover` | `scale` | 1.06 | 1.04 | Subtler hover for grid cards (160x180 is smaller than 192x228 capsules) |
| `selected` | `opacity` | 0.25 | 1 | Selected card stays fully visible (it scales up to draw attention, not dims) |
| `selected` | `scale` | 1 | 1.2 | Card scales up to indicate selection (Decision 3) |
| `selected` | `duration` | 0.35s | 0.4s | Match `MORPH_TIMING.expanding` (400ms) |
| `dimmed` | `opacity` | 0.5 | 0.3 | Stronger dimming for siblings (Decision 3: "fade to 0.3") |
| `dimmed` | `duration` | 0.35s | 0.4s | Match `MORPH_TIMING.expanding` (400ms) |

#### 4.7.2 No Change to `resolveMorphVariant()`

The `resolveMorphVariant()` function (lines 68-75) remains identical -- its logic is variant-name-based, not value-based:

```typescript
export function resolveMorphVariant(
  isSelected: boolean,
  phase: MorphPhase,
): string {
  if (phase === 'idle') return 'idle'
  if (isSelected) return 'selected'
  return 'dimmed'
}
```

#### 4.7.3 Rename Export (Optional)

Consider renaming `capsuleStateVariants` to `cardStateVariants` since the capsule terminology is obsolete. This is a low-priority rename -- the name is a cosmetic issue and does not affect functionality. If renamed, update the import in `CategoryCard.tsx` (WS-2.1 component) and any other consumers.

#### 4.7.4 Update Module JSDoc

Update the module docblock (lines 1-16) to reference "category cards" instead of "capsules":

```
- * Morph variant definitions -- simplified capsule state variants
+ * Morph variant definitions -- card state variants
- * for the panel-offset morph interaction.
+ * for the grid selection morph interaction.
- * Capsules have 3 visual states:
+ * Cards have 3 visual states:
- * - idle: full opacity, normal scale
+ * - idle: full opacity, scale 1.0
- * - selected: dimmed (the clicked capsule)
+ * - selected: scale 1.2x (the clicked card scales up)
- * - dimmed: slightly dimmed (sibling capsules)
+ * - dimmed: opacity 0.3 (sibling cards fade out)
```

---

### 4.8 Archive Capsule/Ring-Era Component Files

**Target directory:** `src/components/districts/_archived/`

Create the `_archived/` directory and move the following 9 files:

| File | Lines | What It Did |
|------|-------|-------------|
| `capsule-ring.tsx` | 191 | Circular 840x840px layout for 6 district capsules with ring rotation and shift animation |
| `constellation-view.tsx` | 197 | Z0 zoomed-out beacon layout with aggregate `GlobalMetrics` |
| `district-capsule.tsx` | 157 | Glass card for a single district with health bar, telemetry rows, sparkline |
| `capsule-telemetry.tsx` | 97 | 3 key-value telemetry rows (Pulse, Last Event, Alerts) |
| `capsule-sparkline.tsx` | 51 | @tarva/ui Sparkline wrapper for capsule bottom strip |
| `capsule-health-bar.tsx` | 37 | 3px animated status bar with health-color mapping |
| `district-beacon.tsx` | 150 | 12px luminous dot with glow for Z0 constellation view |
| `global-metrics.tsx` | 116 | 3 aggregate metrics bar (Alerts, Active, System Pulse) for Z0 |
| `connector-lines.tsx` | 113 | SVG dashed connector from shifted capsule to detail panel |

**Total:** 9 files, ~1109 lines

#### 4.8.1 Verification: No Active Imports

After archival, verify that no files in the active source tree import from these archived files. Run:

```bash
grep -rn "from.*capsule-ring\|from.*constellation-view\|from.*district-capsule\|from.*capsule-telemetry\|from.*capsule-sparkline\|from.*capsule-health-bar\|from.*district-beacon\|from.*global-metrics\|from.*connector-lines" src/ --include="*.ts" --include="*.tsx" | grep -v "_archived"
```

Expected result: zero matches. If any match, the import must be removed or redirected as part of this deliverable.

#### 4.8.2 Exports Barrel Update

If `src/components/districts/index.ts` exists and re-exports any of the archived components, remove those re-exports.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Click a `CategoryCard` at Z1+ zoom triggers forward morph: phase transitions `idle` -> `expanding` -> `settled` | Inspect `useUIStore.getState().morph.phase` in React DevTools during click |
| AC-2 | Selected card scales to 1.2x during `expanding` phase (400ms duration) | Visual inspection; inspect motion.div computed `transform: scale(1.2)` in DevTools |
| AC-3 | Sibling cards fade to opacity 0.3 during `expanding` phase | Visual inspection; inspect motion.div computed `opacity: 0.3` on unselected cards |
| AC-4 | Detail panel slides in from the right side of the viewport with spring animation (`stiffness: 140, damping: 22, mass: 1`) | Visual inspection; verify panel appears right-aligned with `right: 40px`, vertically centered |
| AC-5 | `morph-panels-scatter` CSS still pushes ambient data panels outward during morph (blur + scale 1.08 + opacity 0.15) | Confirm ambient panels (SystemStatusPanel, FeedPanel) scatter when a card is selected |
| AC-6 | After `expanding` (400ms) + `settledHold` (200ms), phase advances to `entering-district` | Time the transition with DevTools Performance tab or console log timestamps |
| AC-7 | Press Escape while panel is visible triggers reverse morph back to `idle` | Press Escape; verify selected card returns to scale 1.0, siblings to opacity 1.0, panel exits |
| AC-8 | Click outside the panel (click-outside backdrop) triggers reverse morph | Click on the backdrop area; verify morph reverses |
| AC-9 | URL updates to `?category={id}` when morph reaches `settled` phase | Check browser URL bar after card click; confirm param name is `category`, not `district` |
| AC-10 | URL clears `?category` param when morph reverses to `idle` | Press Escape; confirm `?category=` is removed from URL |
| AC-11 | Reduced motion: all morph animations resolve immediately (0ms timing per `MORPH_TIMING_REDUCED`) | Enable "Reduce motion" in OS accessibility settings; click a card; verify instant state change without animation |
| AC-12 | `pnpm typecheck` passes with zero errors after all changes | Run `pnpm typecheck` |
| AC-13 | No console errors during a full forward+reverse morph cycle | Open browser console; click card, wait for settle, press Escape; confirm zero errors |
| AC-14 | All 9 archived files exist in `src/components/districts/_archived/` | `ls src/components/districts/_archived/` lists all 9 files |
| AC-15 | No active source file imports from any archived file | `grep -rn` search (per 4.8.1) returns zero matches |
| AC-16 | `morph-types.ts` no longer exports `computeRingRotation`, `RING_SHIFT`, `getPanelSide`, `computePanelPosition`, `CAPSULE_DIMENSIONS` | `grep` for these identifiers in `morph-types.ts` returns zero matches |
| AC-17 | `use-morph-choreography.ts` does not reference `district` as a URL param (only `category`) | `grep "district" src/hooks/use-morph-choreography.ts` returns zero matches (excluding comments referencing the old behavior) |
| AC-18 | `detail-panel.tsx` does not import from `./capsule-ring` or call `getPanelSide`/`computePanelPosition` | Code review; `grep` for removed imports |
| AC-19 | Z0 icon click (from `CategoryIconGrid`) zooms camera to world origin and triggers morph after 350ms delay | Zoom to Z0, click an icon, verify camera flies to center then morph starts |
| AC-20 | `morph.css` uses `[data-category-card]` selectors (not `.district-capsule`) | Code review of `morph.css` |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Detail panel always docks to the right side of the viewport (`right: 40px`, vertically centered) -- no left/right decision | The capsule ring needed left/right panel placement because ring rotation could land the clicked capsule at 3 o'clock (right panel) or 9 o'clock (left panel). The CSS Grid is a static rectangular layout where all cards are left-of-center relative to the viewport, so the panel naturally sits on the right. This eliminates `computeRingRotation`, `PanelSide` branching, and `dockSide` prop. | (a) Context-aware left/right based on card column position -- adds complexity for marginal benefit since the grid is centered; (b) Panel overlays the grid (centered) -- obscures sibling cards |
| D-2 | Remove connector lines entirely rather than simplifying for the grid layout | The ring layout's connector line solved a real spatial comprehension problem: which of 6 rotating capsules was connected to the offset panel. In the grid layout, the selected card scales up (1.2x) while siblings fade (0.3 opacity), making the selection unambiguous without a drawn connector. Additionally, the connector would need to bridge world-space (CSS-transformed canvas) and viewport-space (fixed-position panel), which is fragile. Decision 3 does not mention connector lines. | (a) Simplified horizontal line via `getBoundingClientRect` -- fragile cross-coordinate-system math; (b) Keep connector but re-implement -- ~100 lines of new code for minimal visual benefit; (c) Defer to future workstream -- keeps a TODO but avoids over-building |
| D-3 | Archive `connector-lines.tsx` alongside the other 8 ring-era files (9 total) rather than deleting | Archival (move to `_archived/`) preserves the code for reference during future spatial connector work or rollback. Consistent with WS-1.1's archive pattern. | (a) Delete files -- loses reference code; (b) Keep `connector-lines.tsx` active but unused -- dead code in the source tree |
| D-4 | Selected card variant uses `scale: 1.2` and `opacity: 1` (not dimming the selected card) | Decision 3 states "Selected card scales to 1.2x" -- the emphasis is on scaling up, not dimming down. The previous ring morph dimmed the selected capsule to 0.25 because the detail panel was the focus. In the grid morph, the scaled card provides a visual anchor for the panel. | (a) Dim to 0.25 like before -- conflicts with Decision 3's "scale to 1.2x" language; (b) Scale 1.2 + dim to 0.5 -- ambiguous intent; (c) Scale 1.2 + emit glow -- explored but glow without opacity was sufficient |
| D-5 | Variant transition duration changed from 0.35s to 0.4s to match `MORPH_TIMING.expanding` (400ms) | Aligns motion.js animation with the phase timer so the visual transition completes exactly when the phase advances from `expanding` to `settled`. The 0.35s value was tuned for the ring morph; 0.4s matches the grid morph's phase boundary. | (a) Keep 0.35s -- 50ms mismatch between visual and phase; (b) Change MORPH_TIMING.expanding to 350ms -- cascading timing changes across the system |
| D-6 | Rename `syncUrlDistrict` to `syncUrlCategory` and param from `district` to `category` in a single step | Clean break from the district terminology. The function is private to `use-morph-choreography.ts` (not exported), so the rename has no external API impact. Decision 7 from combined-recommendations specifies `?category={id}`. | (a) Keep `syncUrlDistrict` name but change param -- confusing code; (b) Add both params for backward compatibility -- over-engineering for an internal-only function |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the `displayName` in `detail-panel.tsx` resolve the category's display name (e.g., "Seismic" instead of raw `"seismic"` ID string)? This requires importing `getCategoryMeta` from `coverage.ts` (WS-1.2). Alternatively, WS-3.1 can handle this when it creates `CategoryDetailScene` which replaces the panel content. | react-developer | Phase 2 (this WS) -- recommendation: resolve display name now using `getCategoryMeta(categoryId).displayName` since it is a one-line import and avoids shipping raw IDs in the header. |
| OQ-2 | The `entering-district` / `district` phase transitions render a full-screen district view overlay (`district-view-overlay.tsx`). This overlay currently looks up district metadata via `getDistrictById()`. Should this workstream stub the overlay to show a generic "loading detail view" state for category IDs, or leave it broken (it will show nothing) until WS-3.1 fixes it? | react-developer | Phase 2 (this WS) -- recommendation: leave the district view overlay untouched. The morph gate criterion is "click card, morph animation, detail panel appears." The district overlay is WS-3.1's scope. The `settled` phase hold (200ms) before `entering-district` gives enough time to see the panel before the overlay takes over. |
| OQ-3 | The `morph-orchestrator.tsx` currently renders the `DetailPanel` via `createPortal` to `document.body` (lines 180-195). With the panel in fixed-right viewport position, the portal is still appropriate (fixed positioning works from any DOM position, but portal avoids z-index conflicts with the CSS-transformed canvas). Should the portal target remain `document.body` or change to a dedicated portal container? | react-developer | Phase 2 (this WS) -- recommendation: keep `document.body` portal. It works correctly and matches the existing pattern. |
| OQ-4 | `capsuleStateVariants` is currently consumed by `CategoryCard` (via WS-2.1). Should this export be renamed to `cardStateVariants`? If so, `CategoryCard.tsx` must also be updated. | react-developer | Phase 2 (this WS) -- recommendation: rename. It is a 2-line change (export name + import in CategoryCard). The "capsule" terminology is obsolete and the rename improves code clarity for the next developer. |
| OQ-5 | The `handleBeaconSelect` / `handleIconSelect` currently calls `flyTo` to zoom the camera to Z1 before starting the morph. The Z0-to-Z1 zoom takes ~350ms (setTimeout delay). Should the morph also wait for the `AnimatePresence` crossfade (300ms, per `CategoryIconGrid` exit animation) to complete before starting, or is the 350ms delay sufficient to cover both? | react-developer | Phase 2 (this WS) -- recommendation: the 350ms delay is sufficient. The `AnimatePresence mode="wait"` exit animation (300ms) starts immediately on zoom level change and completes within the 350ms window. The morph starts after both animations have settled. |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-2.1 `CategoryCard` does not set `data-category-card` attribute, breaking all morph CSS selectors in 4.5 | Medium | High (morph CSS has no effect) | Verify `CategoryCard` implementation from WS-2.1 includes `data-category-card` on its root motion.div. If missing, add it as a sub-task of this workstream (one-line change). |
| R-2 | WS-2.1 `CategoryCard` does not consume `capsuleStateVariants` from `use-morph-variants.ts`, meaning the scale+fade variants from 4.7 have no effect | Medium | High (cards do not animate) | Verify `CategoryCard` imports and uses `capsuleStateVariants` as its `variants` prop and drives `animate` from `resolveMorphVariant()`. WS-2.1 Section 4.3.3 specifies this pattern. If not wired, add as sub-task. |
| R-3 | Detail panel fixed-right positioning (`right: 40px`) overlaps with `FeedPanel` ambient panel at world x:+880 | Low | Medium (visual overlap at certain zoom levels) | The `FeedPanel` is in world-space and subject to CSS transforms + culling. The detail panel is in viewport-space (fixed position). At Z1 default zoom (0.5), the FeedPanel renders at ~440px from viewport center, leaving space for the 900px-wide detail panel (which starts at `right: 40px` = viewport right minus 40px). The `morph-panels-scatter` CSS pushes the FeedPanel outward by `scale(1.08)` + `opacity: 0.15` during morph, further reducing overlap risk. Test at Z1 (0.5), Z2 (0.8-1.5) zoom ranges. |
| R-4 | Archiving 9 files breaks imports in files not identified in this SOW (e.g., Storybook stories, test files, or barrel exports) | Medium | Medium (build failure) | Run the grep verification command from 4.8.1 before and after archival. Also check `*.stories.tsx`, `*.test.tsx`, and `index.ts` barrel files in the `districts/` directory. |
| R-5 | The `morph-orchestrator.tsx` rewrite from WS-2.1 (4.8) may have already removed some ring-specific code, meaning the line numbers and code blocks referenced in this SOW are stale | High | Low (SOW references wrong line numbers, but logic is correct) | All code references in this SOW cite current (pre-WS-2.1) line numbers. The implementing agent should use function/variable names (not line numbers) to locate code. The SOW describes what to remove by semantic meaning, not by line. |
| R-6 | The `?category=` URL param conflicts with `syncCoverageFromUrl` in `coverage.store.ts` (WS-1.3), which also reads `?category=` to set the coverage store's `selectedCategory` | Medium | Medium (double-write to URL or race condition) | The choreography hook writes the URL param via `history.replaceState` (no navigation). The coverage store reads it on mount. These are sequential, not concurrent. However, verify that `syncCoverageFromUrl` is called only once on page load (in `page.tsx` useEffect), and the choreography hook's URL write does not trigger a re-read. If both write to the same param, add a guard: choreography hook owns the URL write during morph; coverage store only reads on initial mount. |
| R-7 | Removing `computeRingRotation` and `RING_SHIFT` from `morph-types.ts` breaks imports in `capsule-ring.tsx` | None | None | `capsule-ring.tsx` is archived (4.8), so its imports are no longer active. The archival step runs before or concurrently with the `morph-types.ts` cleanup. |
| R-8 | The `entering-district` / `district` phases render a district view overlay that calls `getDistrictById(targetId)` which returns `undefined` for category IDs, causing a blank or broken overlay | High | Low (expected -- overlay content is WS-3.1's scope) | This is a known limitation, not a bug. The morph gate criterion for this workstream is the animation cycle through `settled` phase. The overlay appearing blank during `entering-district`/`district` phases is acceptable and documented. WS-3.1 replaces the overlay content with `CategoryDetailScene`. |
