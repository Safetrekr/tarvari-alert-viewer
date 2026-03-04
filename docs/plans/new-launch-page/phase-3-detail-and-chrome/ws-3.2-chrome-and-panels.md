# WS-3.2: Chrome & Panels

> **Workstream ID:** WS-3.2
> **Phase:** 3 -- Detail + Chrome
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-04
> **Last Updated:** 2026-03-04
> **Depends On:** WS-1.2 (Type Foundation)
> **Blocks:** None
> **Resolves:** None (cosmetic + positioning updates)

## 1. Objective

Update the viewport-fixed chrome elements (top telemetry bar, bottom status strip) and world-space ambient panels (Minimap, SystemStatusPanel, FeedPanel, SignalPulseMonitor, ActivityTicker) so they reflect the TarvaRI Coverage Monitor identity and accommodate the wider 1500x400px coverage grid from WS-2.1. This involves replacing legacy "Tarva Launch" branding with "TarvaRI" labels, swapping district-specific health labels with intel-pipeline labels, adapting the Minimap from 6 district dots on a ring to up to 15 category dots on a grid, pushing all four world-space ambient panels outward to clear the wider grid, and updating the `APP_NAME` and `APP_DESCRIPTION` constants.

The gate criterion is: visual verification that all label text reads "TarvaRI" (not "Tarva Launch"), the bottom strip shows intel labels (not district labels), the Minimap renders category dots at grid positions with wider world bounds, and all four ambient panels are positioned with adequate clearance from the 1500px grid.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Top telemetry bar center label | Replace `'TARVA LAUNCH // MISSION CONTROL'` with `'TARVARI // COVERAGE MONITOR'`. Replace district-name morph label with category display name from `getCategoryMeta()`. |
| Bottom status strip health labels | Replace `DEFAULT_HEALTH_LABELS` and `DISTRICT_HEALTH_LABELS` with intel-pipeline labels. Remove the `Record<DistrictId, ...>` mapping entirely. |
| Minimap adaptation | Replace `DISTRICTS` iteration and `getDistrictWorldPosition()` ring-based positioning with `KNOWN_CATEGORIES` grid-based positioning. Widen world bounds from +/-600 to +/-1800. Remove hub center dot. |
| Panel position adjustments | Push `SystemStatusPanel` and `SignalPulseMonitor` further left; push `FeedPanel` and `ActivityTicker` further right. Exact old-to-new x-coordinates specified in Deliverable 4.4. |
| Feed panel district references | Replace `DISTRICT_SHORT_NAMES` lookup with category-aware display (or remove district-specific formatting from activity events). |
| Constants update | Change `APP_NAME` to `'TarvaRI Alert Viewer'` and `APP_DESCRIPTION` to `'Spatial coverage monitor for TarvaRI intelligence'` in `src/lib/constants.ts`. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| SystemStatusPanel content rewrite | Replacing district list, resource bars, and uptime with coverage metrics is a larger effort. This workstream only repositions the panel. Content rewrite deferred to a future workstream. |
| FeedPanel content rewrite | Replacing activity events, sensor readouts, and circuit diagram with coverage-specific feeds is deferred. This workstream repositions the panel and removes hard district-name references. |
| ActivityTicker event content | The static fallback events still reference district IDs (`'project-room'`, `'agent-builder'`). Replacing these with intel event types is deferred. This workstream repositions the panel. |
| SignalPulseMonitor content changes | The waveform visualization is content-agnostic. This workstream only repositions it. |
| Minimap click-to-navigate for category nodes | Click navigation targets grid positions. Full implementation deferred until morph-from-minimap is wired. |
| Morph choreography changes | WS-2.2 handles morph adaptation. |
| District view scene replacement | WS-3.1 creates `CategoryDetailScene`. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/coverage.ts` (WS-1.2) | `KNOWN_CATEGORIES` array (15 entries), `getCategoryMeta()`, `CategoryMeta` type with `.displayName`, `.shortName`, `.color` fields | Created by WS-1.2 |
| `src/lib/interfaces/district.ts` (WS-1.2) | `NodeId` type (widened from `DistrictId`). `DistrictId` deprecated alias still available for files not yet migrated. | Modified by WS-1.2 |
| `src/components/coverage/CoverageGrid.tsx` (WS-2.1) | `GRID_WIDTH = 1500`, `GRID_HEIGHT = 400` constants defining the coverage grid world-space footprint | Created by WS-2.1 |
| `src/stores/ui.store.ts` | `uiSelectors.isDistrictView`, `uiSelectors.morphTargetId` -- used by top telemetry bar and bottom status strip to detect morph state | Available |
| `src/stores/camera.store.ts` | Camera position and zoom for Minimap viewport rectangle calculation | Available |
| `src/stores/districts.store.ts` | Currently used by Minimap for district telemetry dot colors. Will be replaced with category-based coloring. | Available (to be replaced) |
| `src/lib/spatial-actions.ts` | `getDistrictWorldPosition()` -- currently used by Minimap. Will be replaced with grid-position calculation. | Available (to be replaced) |

## 4. Deliverables

### 4.1 Update Top Telemetry Bar Labels

**Path:** `src/components/ambient/top-telemetry-bar.tsx`

#### 4.1.1 Replace center label default text

**Lines 191-195** -- the `centerLabel` computed value:

```typescript
// BEFORE (lines 191-195):
const centerLabel = (() => {
  if (!isDistrictView || !targetId) return 'TARVA LAUNCH // MISSION CONTROL'
  const district = DISTRICTS.find((d) => d.id === targetId)
  return `TARVA LAUNCH // ${district?.displayName?.toUpperCase() ?? targetId.toUpperCase()}`
})()

// AFTER:
const centerLabel = (() => {
  if (!isDistrictView || !targetId) return 'TARVARI // COVERAGE MONITOR'
  const meta = getCategoryMeta(targetId)
  return `TARVARI // ${meta.displayName.toUpperCase()}`
})()
```

#### 4.1.2 Update imports

**Line 20** -- replace `DISTRICTS` import:

```typescript
// BEFORE (line 20):
import { DISTRICTS } from '@/lib/interfaces/district'

// AFTER:
import { getCategoryMeta } from '@/lib/interfaces/coverage'
```

The `DISTRICTS` import is no longer needed in this file. The `getCategoryMeta()` function handles unknown category IDs by falling back to the `'other'` entry, so the label never shows `undefined`.

#### 4.1.3 No other changes

The telemetry readouts (FREQ, TRACE, EPOCH, UPLINK), signal dots, and frame sync bars are content-agnostic decorations. They remain unchanged.

---

### 4.2 Update Bottom Status Strip Labels

**Path:** `src/components/ambient/bottom-status-strip.tsx`

#### 4.2.1 Replace health label constants

**Lines 140-149** -- replace `DEFAULT_HEALTH_LABELS` and `DISTRICT_HEALTH_LABELS`:

```typescript
// BEFORE (lines 140-149):
const DEFAULT_HEALTH_LABELS = ['AGT', 'SYS', 'NET', 'DB', 'API', 'MEM'] as const

const DISTRICT_HEALTH_LABELS: Record<DistrictId, readonly string[]> = {
  'agent-builder': ['SDK', 'CLI', 'MCP', 'DB', 'TST', 'BLD'],
  'tarva-chat': ['MSG', 'RTR', 'MCP', 'WSS', 'CTX', 'STR'],
  'project-room': ['ORC', 'RUN', 'DAG', 'ART', 'QUE', 'LOG'],
  'tarva-core': ['LLM', 'RSN', 'MEM', 'CTX', 'EMB', 'GPU'],
  'tarva-erp': ['INV', 'MFG', 'BOM', 'QTY', 'WMS', 'RPT'],
  'tarva-code': ['IDX', 'EMB', 'KNW', 'SRC', 'TAG', 'VEC'],
}

// AFTER:
/**
 * Intel pipeline health labels representing TarvaRI processing stages.
 * Displayed in the bottom status strip as health dots.
 *
 * SRC = Sources, ING = Ingest, NRM = Normalize, BND = Bundle, TRI = Triage, RTR = Router
 */
const INTEL_HEALTH_LABELS = ['SRC', 'ING', 'NRM', 'BND', 'TRI', 'RTR'] as const
```

#### 4.2.2 Simplify health label selection logic

**Lines 199-201** -- remove district-conditional logic:

```typescript
// BEFORE (lines 199-201):
const healthLabels = isDistrictView && targetId
  ? (DISTRICT_HEALTH_LABELS[targetId as DistrictId] ?? DEFAULT_HEALTH_LABELS)
  : DEFAULT_HEALTH_LABELS

// AFTER:
const healthLabels = INTEL_HEALTH_LABELS
```

The `isDistrictView` and `targetId` selectors (lines 196-197) become unused after this change. Remove them:

```typescript
// BEFORE (lines 196-197):
const isDistrictView = useUIStore(uiSelectors.isDistrictView)
const targetId = useUIStore(uiSelectors.morphTargetId)

// AFTER:
// (remove both lines -- no longer needed)
```

#### 4.2.3 Update imports

**Lines 21-22** -- remove `DistrictId` and UI store imports:

```typescript
// BEFORE (lines 21-22):
import { useUIStore, uiSelectors } from '@/stores/ui.store'
import type { DistrictId } from '@/lib/interfaces/district'

// AFTER:
// (remove both imports -- no longer needed)
```

#### 4.2.4 No other changes

The throughput metric (`PKT/s`), packet counter, latency readout, mini waveforms, and "STREAM ACTIVE" indicator are content-agnostic. They remain unchanged.

---

### 4.3 Minimap Adaptation

**Path:** `src/components/spatial/Minimap.tsx`

#### 4.3.1 Widen world bounds

**Lines 41-46** -- expand from +/-600 to +/-1800 to encompass the wider coverage grid (1500px) plus outward-pushed ambient panels (left panels at x:-1400, right panels at x:+1100, with panel widths up to 480px):

```typescript
// BEFORE (lines 41-46):
const WORLD_MIN_X = -600
const WORLD_MAX_X = 600
const WORLD_MIN_Y = -600
const WORLD_MAX_Y = 600

// AFTER:
const WORLD_MIN_X = -1800
const WORLD_MAX_X = 1800
const WORLD_MIN_Y = -800
const WORLD_MAX_Y = 800
```

**Rationale for bounds:**
- X-axis: Left-most element is `SignalPulseMonitor` at x:-1400, width 480 = extends to x:-920. With the new position (Deliverable 4.4) at x:-1400, the left edge is -1400. Add 400px margin = -1800. Symmetrical on right: `FeedPanel` at x:+1100, width 320 = extends to x:+1420. Add margin = +1800.
- Y-axis: Grid top at y:-200, stats bar above at ~y:-360. Panels extend to y:+730 (`SignalPulseMonitor` at y:520 + 120h = y:640; `ActivityTicker` at y:490 + 240h = y:730). Range -400 to +750, expanded to +/-800 with margin.

#### 4.3.2 Replace district dots with category dots

Remove the `DistrictDot` sub-component (lines 119-178) and the `DISTRICTS` iteration (lines 285-293). Replace with a `CategoryDot` sub-component that positions dots based on grid column/row derived from the category's index in `KNOWN_CATEGORIES`.

**New imports:**

```typescript
// BEFORE (lines 25-29):
import { useDistrictsStore } from '@/stores/districts.store'
import type { AppTelemetry, AppStatus } from '@/lib/telemetry-types'
import { DISTRICTS, type DistrictMeta } from '@/lib/interfaces/district'
import {
  getDistrictWorldPosition,
  flyToWorldPoint,
} from '@/lib/spatial-actions'

// AFTER:
import { KNOWN_CATEGORIES, type CategoryMeta } from '@/lib/interfaces/coverage'
import { GRID_WIDTH, GRID_HEIGHT, GRID_COLUMNS } from '@/components/coverage/CoverageGrid'
import { flyToWorldPoint } from '@/lib/spatial-actions'
```

**Remove:** `useDistrictsStore`, `AppTelemetry`, `AppStatus`, `DISTRICTS`, `DistrictMeta`, `getDistrictWorldPosition` imports.

**Remove:** `STATUS_COLORS` mapping (lines 55-61), `DEFAULT_DOT_COLOR` (line 64), `EMBER_COLOR` for hub dot (line 67). Hub center dot is no longer rendered (no "hub" concept in coverage grid).

**New constants:**

```typescript
/** Dot color for category indicators on the minimap. */
const CATEGORY_DOT_COLOR = 'var(--color-ember, #f97316)'
```

**New `CategoryDot` sub-component:**

```typescript
interface CategoryDotProps {
  category: CategoryMeta
  index: number
  minimapWidth: number
  minimapHeight: number
}

function CategoryDot({ category, index, minimapWidth, minimapHeight }: CategoryDotProps) {
  // Derive world position from grid index
  const col = index % GRID_COLUMNS  // 0-7
  const row = Math.floor(index / GRID_COLUMNS)  // 0 or 1
  const cellWidth = GRID_WIDTH / GRID_COLUMNS
  const cellHeight = GRID_HEIGHT / 2  // 2 rows max

  // Grid is centered at world origin
  const worldX = -(GRID_WIDTH / 2) + col * cellWidth + cellWidth / 2
  const worldY = -(GRID_HEIGHT / 2) + row * cellHeight + cellHeight / 2

  const { mx, my } = worldToMinimap(worldX, worldY, minimapWidth, minimapHeight)

  return (
    <g>
      <circle
        cx={mx}
        cy={my}
        r={DOT_RADIUS}
        fill={category.color}
        aria-label={`${category.displayName} category`}
      >
        <title>{category.displayName}</title>
      </circle>
      <text
        x={mx}
        y={my + DOT_RADIUS + 9}
        textAnchor="middle"
        fill="var(--color-text-tertiary, #9ca3af)"
        style={{
          fontSize: '6px',
          fontFamily: 'var(--font-geist-mono, monospace)',
          fontWeight: 500,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          opacity: 0.5,
        }}
      >
        {category.shortName}
      </text>
    </g>
  )
}
```

**Note:** The font size for minimap category labels is reduced from `8px` (district labels) to `6px` because there are up to 15 labels (vs 6 districts) in a denser grid arrangement.

**Replace iteration in the main SVG:**

```typescript
// BEFORE (lines 284-293):
{/* Hub center dot */}
<circle cx={hubPos.mx} cy={hubPos.my} r={HUB_DOT_RADIUS} fill={EMBER_COLOR} ... />

{/* District dots */}
{DISTRICTS.map((district) => (
  <DistrictDot key={district.id} district={district} telemetry={districts[district.id]} ... />
))}

// AFTER:
{/* Category dots at grid positions */}
{KNOWN_CATEGORIES.map((category, index) => (
  <CategoryDot
    key={category.id}
    category={category}
    index={index}
    minimapWidth={width}
    minimapHeight={height}
  />
))}
```

**Remove:** `hubPos` computation (lines 205-208) and `districts` store selector (line 202). The hub center dot is removed because the coverage grid has no central hub concept.

#### 4.3.3 Keep click-to-navigate and viewport rectangle

The `handleClick` callback (lines 237-252) and viewport rectangle rendering (lines 296-321) use camera store values and `worldToMinimap`/`minimapToWorld` helpers. These are content-agnostic and remain unchanged. The wider world bounds automatically adjust the minimap's coordinate mapping.

---

### 4.4 Panel Position Adjustments

Push all four world-space ambient panels outward to provide adequate visual clearance from the wider 1500x400px coverage grid (whose edges extend to x:+/-750).

#### 4.4.1 SystemStatusPanel

**Path:** `src/components/ambient/system-status-panel.tsx`

**Line 38** -- update x-coordinate:

| Property | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `PANEL_X` | `-1200` | `-1400` | Panel right edge moves from x:-880 to x:-1080. Clearance from grid left edge (x:-750) increases from 130px to 330px. |
| `PANEL_Y` | `-340` | `-340` | No change. |

```typescript
// BEFORE (line 38):
const PANEL_X = -1200

// AFTER:
const PANEL_X = -1400
```

#### 4.4.2 SignalPulseMonitor

**Path:** `src/components/ambient/signal-pulse-monitor.tsx`

**Line 35** -- update x-coordinate:

| Property | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `PANEL_X` | `-1200` | `-1400` | Panel right edge moves from x:-720 to x:-920. Clearance from grid left edge (x:-750) increases from 30px to 170px. Aligns left edge with SystemStatusPanel above. |
| `PANEL_Y` | `520` | `520` | No change. |

```typescript
// BEFORE (line 35):
const PANEL_X = -1200

// AFTER:
const PANEL_X = -1400
```

#### 4.4.3 FeedPanel

**Path:** `src/components/ambient/feed-panel.tsx`

**Line 38** -- update x-coordinate:

| Property | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `PANEL_X` | `880` | `1100` | Panel left edge moves from x:880 to x:1100. Clearance from grid right edge (x:+750) increases from 130px to 350px. |
| `PANEL_Y` | `-290` | `-290` | No change. |

```typescript
// BEFORE (line 38):
const PANEL_X = 880

// AFTER:
const PANEL_X = 1100
```

#### 4.4.4 ActivityTicker

**Path:** `src/components/ambient/activity-ticker.tsx`

**Line 40** -- update x-coordinate:

| Property | Old Value | New Value | Rationale |
|----------|-----------|-----------|-----------|
| `PANEL_X` | `880` | `1100` | Panel left edge moves from x:880 to x:1100. Clearance from grid right edge (x:+750) increases from 130px to 350px. Aligns left edge with FeedPanel above. |
| `PANEL_Y` | `490` | `490` | No change. |

```typescript
// BEFORE (line 40):
const PANEL_X = 880

// AFTER:
const PANEL_X = 1100
```

#### 4.4.5 Position Summary Table

| Panel | Dimensions (WxH) | Old Position (x, y) | New Position (x, y) | Delta | Old Clearance to Grid | New Clearance to Grid |
|-------|-------------------|----------------------|----------------------|-------|------------------------|------------------------|
| SystemStatusPanel | 320x680 | (-1200, -340) | (-1400, -340) | x:-200 | 130px (right edge at -880 vs grid left at -750) | 330px (right edge at -1080) |
| SignalPulseMonitor | 480x120 | (-1200, 520) | (-1400, 520) | x:-200 | 30px (right edge at -720 vs grid left at -750) | 170px (right edge at -920) |
| FeedPanel | 320x580 | (880, -290) | (1100, -290) | x:+220 | 130px (left edge at 880 vs grid right at +750) | 350px (left edge at 1100) |
| ActivityTicker | 260x240 | (880, 490) | (1100, 490) | x:+220 | 130px (left edge at 880 vs grid right at +750) | 350px (left edge at 1100) |

---

### 4.5 Constants Update

**Path:** `src/lib/constants.ts`

**Lines 15-16** -- update application identity:

```typescript
// BEFORE (lines 15-16):
export const APP_NAME = 'Tarva Launch'
export const APP_DESCRIPTION = 'Spatial mission control for the Tarva ecosystem'

// AFTER:
export const APP_NAME = 'TarvaRI Alert Viewer'
export const APP_DESCRIPTION = 'Spatial coverage monitor for TarvaRI intelligence'
```

**Consuming locations to verify after change:**
- Login page title/branding (if it reads `APP_NAME`)
- HTML `<title>` in layout metadata (if it reads `APP_NAME`)
- Any `aria-label` or announcement that includes `APP_NAME`

Search pattern: `grep -r 'APP_NAME\|APP_DESCRIPTION' src/` to identify all consumers.

---

### 4.6 Feed Panel District Reference Cleanup

**Path:** `src/components/ambient/feed-panel.tsx`

#### 4.6.1 Replace `DISTRICT_SHORT_NAMES` with category-aware lookup

**Lines 48-50** -- the `DISTRICT_SHORT_NAMES` record is built from `DISTRICTS` (the old 6-district array). Activity events use it to resolve `evt.target` (a `DistrictId`) to a short display name. After WS-1.2, `DistrictId` is aliased to `string`, but the record still contains only 6 legacy entries.

```typescript
// BEFORE (lines 48-50):
const DISTRICT_SHORT_NAMES: Record<DistrictId, string> = Object.fromEntries(
  DISTRICTS.map((d) => [d.id, d.shortName]),
) as Record<DistrictId, string>

// AFTER:
import { getCategoryMeta } from '@/lib/interfaces/coverage'

/**
 * Resolve a target ID to a short display name.
 * Tries KNOWN_CATEGORIES first, then falls back to DISTRICTS for legacy events,
 * and finally to the raw ID uppercased.
 */
function resolveTargetName(targetId: string): string {
  // Try category lookup first
  const catMeta = getCategoryMeta(targetId)
  if (catMeta.id === targetId) return catMeta.shortName

  // Fall back to legacy district names
  const district = DISTRICTS.find((d) => d.id === targetId)
  if (district) return district.shortName

  // Last resort: uppercase the raw ID
  return targetId.toUpperCase()
}
```

**Line 362** -- update the usage site:

```typescript
// BEFORE (line 362):
&rarr; {DISTRICT_SHORT_NAMES[evt.target] ?? evt.target}

// AFTER:
&rarr; {resolveTargetName(evt.target)}
```

This change is forward-compatible: when activity events start using category IDs as targets (from the coverage data layer), the names will resolve correctly. Legacy district IDs in existing events continue to display their short names.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Top telemetry bar displays `'TARVARI // COVERAGE MONITOR'` as the center label when no category is selected | Visual inspection in browser at any zoom level |
| AC-2 | Top telemetry bar displays `'TARVARI // {CATEGORY_NAME}'` (e.g., `'TARVARI // SEISMIC'`) when viewing a category detail via morph | Trigger a morph to a category and verify center label updates. If morph is not yet functional (WS-2.2 pending), verify by temporarily setting `morphTargetId` in the UI store via DevTools. |
| AC-3 | Top telemetry bar no longer imports `DISTRICTS` from `district.ts` | Grep `top-telemetry-bar.tsx` for `DISTRICTS` import returns zero matches |
| AC-4 | Bottom status strip displays `['SRC', 'ING', 'NRM', 'BND', 'TRI', 'RTR']` as health dot labels | Visual inspection; verify 6 labels with health dots |
| AC-5 | Bottom status strip no longer contains `DISTRICT_HEALTH_LABELS` or any `Record<DistrictId, ...>` mapping | Grep `bottom-status-strip.tsx` for `DISTRICT_HEALTH_LABELS` returns zero matches |
| AC-6 | Bottom status strip no longer imports from `ui.store` or `district.ts` | Grep for those import paths in the file returns zero matches |
| AC-7 | Minimap renders up to 15 category dots positioned in an 8-column grid pattern matching the coverage grid's world-space layout | Visual inspection of minimap; dots should form a 2-row grid (8 top, 7 bottom for 15 categories) |
| AC-8 | Minimap world bounds are +/-1800 x-axis and +/-800 y-axis | Code review of `WORLD_MIN_X`, `WORLD_MAX_X`, `WORLD_MIN_Y`, `WORLD_MAX_Y` |
| AC-9 | Minimap no longer renders a hub center dot | Visual inspection; code review confirms hub dot SVG element is removed |
| AC-10 | Minimap category dot labels use the `shortName` from `KNOWN_CATEGORIES` (e.g., "SEIS", "WX", "CON") | Visual inspection at sufficient zoom level |
| AC-11 | SystemStatusPanel is positioned at x:-1400 (previously x:-1200) | Code review of `PANEL_X` constant; DevTools measurement at zoom 1.0 |
| AC-12 | SignalPulseMonitor is positioned at x:-1400 (previously x:-1200) | Code review of `PANEL_X` constant |
| AC-13 | FeedPanel is positioned at x:+1100 (previously x:+880) | Code review of `PANEL_X` constant |
| AC-14 | ActivityTicker is positioned at x:+1100 (previously x:+880) | Code review of `PANEL_X` constant |
| AC-15 | No ambient panel overlaps the 1500x400px coverage grid (grid edges at x:+/-750) | Visual inspection at Z1 default zoom (0.5); all panels have visible gap from grid edges |
| AC-16 | `APP_NAME` in `src/lib/constants.ts` is `'TarvaRI Alert Viewer'` | Code review |
| AC-17 | `APP_DESCRIPTION` in `src/lib/constants.ts` is `'Spatial coverage monitor for TarvaRI intelligence'` | Code review |
| AC-18 | `pnpm typecheck` passes with zero errors | Run `pnpm typecheck` |
| AC-19 | No runtime errors in the browser console after all changes | Open DevTools console, navigate the spatial canvas, verify no errors |
| AC-20 | FeedPanel activity event targets resolve to category short names for category IDs and legacy district names for district IDs | Verify in DevTools or visual inspection that event targets display readable short names |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Use `'TARVARI // COVERAGE MONITOR'` as the center label (not `'TARVARI ALERT VIEWER // COVERAGE MONITOR'`) | The top bar has very limited horizontal space (7px font size). Shorter text reads better at the small scale. `APP_NAME` in constants is the full name for metadata/title usage; the top bar uses a condensed version. | (a) `'TARVARI ALERT VIEWER // COVERAGE MONITOR'` -- too long for the 7px label space; (b) `'COVERAGE MONITOR'` alone -- loses TarvaRI branding |
| D-2 | Replace `DISTRICT_HEALTH_LABELS` with a single `INTEL_HEALTH_LABELS` array (`['SRC', 'ING', 'NRM', 'BND', 'TRI', 'RTR']`) rather than per-category label sets | The coverage monitor views intel pipeline stages, not individual district subsystems. All categories share the same pipeline (ingest, normalize, bundle, triage, route). Per-category subsystem labels (like the old per-district labels) have no meaningful equivalent in the coverage domain. | (a) Per-category label sets (e.g., `seismic: ['USGS', 'EMSC', ...]`) -- source names are dynamic and vary in count, not suitable for a fixed 6-dot display; (b) Remove health dots entirely -- loses the ambient instrumentation aesthetic |
| D-3 | Push left panels by x:-200 and right panels by x:+220 (asymmetric) | The right-side panels were originally closer to the grid (130px) than desired. The +220 shift creates 350px clearance on the right. Left panels get -200 for 330px clearance (SystemStatusPanel) and 170px clearance (SignalPulseMonitor, which is wider at 480px). The slight asymmetry reflects the different panel widths. | (a) Symmetric +/-200 -- right panels would only have 130+200=330px clearance, but left panels would have 330px clearance on SystemStatusPanel yet only 30+200=230px on SignalPulseMonitor; (b) Larger shift +/-300 -- pushes panels too far from the grid, making them feel disconnected; (c) Move panels closer to grid but layer behind with z-index -- breaks the spatial metaphor of discrete panels |
| D-4 | Widen Minimap world bounds to +/-1800 x +/-800 rather than computing dynamically from panel positions | Static bounds are simple, predictable, and consistent with the existing hardcoded approach (current bounds are +/-600). Dynamic computation from panel positions adds complexity for minimal benefit since panel positions change rarely. | (a) Dynamic world bounds computed from all world-space element positions -- over-engineering for a layout that changes once per workstream; (b) Keep +/-600 -- too narrow, panels would be clipped or scaled to tiny dots on the minimap |
| D-5 | Remove the hub center dot from Minimap rather than replacing it with a grid center marker | The coverage grid does not have a central hub concept. The capsule ring had a literal center point (world origin) that the hub dot represented. The grid is a rectangular layout centered at origin but has no semantic "center node". Adding an arbitrary center marker would be decorative without meaning. | (a) Replace with a small grid outline rectangle on the minimap -- adds visual complexity for minimal navigation value; (b) Keep the hub dot at origin as a reference point -- misleading since there is no hub to fly to |
| D-6 | Feed panel `resolveTargetName()` uses a two-step lookup (category first, then legacy district) rather than removing district support entirely | Activity events in the enrichment store may still carry legacy district IDs as targets (from the mock activity cycle created by the enrichment engine). Removing district support would cause those events to display raw IDs. The two-step lookup is forward-compatible: new events with category IDs resolve via `getCategoryMeta()`, and legacy events continue to work via `DISTRICTS.find()`. | (a) Remove all district references -- breaks existing mock activity events; (b) Keep only district lookup -- new category-based events would not resolve |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should the Minimap category dots use the actual `color` from `CategoryMeta` (e.g., red for seismic, blue for weather) or a uniform color? The current district dots use health-state colors (green/yellow/red). Category dots do not have health state; each category has its own branding color. Using per-category colors makes the minimap more informative but busier. | react-developer | Phase 3 (this WS) -- recommendation: use per-category `CategoryMeta.color` values. The minimap is small enough that the color variety provides useful identification without being overwhelming. |
| OQ-2 | Should `SystemStatusPanel` content (district list, resource bars, uptime) be stubbed or left as-is in this workstream? Currently it reads from the enrichment store which seeds 6 district entries. If WS-1.2 has widened types but the enrichment store still seeds district data, the panel renders stale district names. | Planning Agent | Phase 3 -- recommendation: leave content as-is. The panel is decorative ambient instrumentation. Content rewrite is a separate future workstream. |
| OQ-3 | The `ActivityTicker` static fallback events (lines 69-78 in `activity-ticker.tsx`) reference legacy district IDs (`'project-room'`, `'agent-builder'`, etc.) as targets. Should these be replaced with category IDs (e.g., `'seismic'`, `'weather'`) to match the new identity? | react-developer | Phase 3 (this WS) -- recommendation: defer. The static events are fallback data for when the enrichment store is empty. They are cosmetic and will be replaced when the enrichment engine generates coverage-aware events. |
| OQ-4 | Multiple files import `APP_NAME` (search needed). If any of them display it to the user (e.g., login page title, HTML meta title), should those display contexts be verified as part of this workstream's gate? | react-developer | Phase 3 (this WS) -- recommendation: yes, verify all `APP_NAME` consumers compile and display correctly. Add a grep-based check to the gate. |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | WS-1.2 `coverage.ts` not yet created when this workstream starts, making `getCategoryMeta` and `KNOWN_CATEGORIES` imports fail | Medium | High (blocks Deliverables 4.1, 4.2, 4.3, 4.6) | WS-1.2 is the only hard dependency. If delayed, stub the imports: create a temporary `getCategoryMeta()` that returns a fallback `{ displayName: id, shortName: id.slice(0,3).toUpperCase(), color: '#9ca3af' }`. Replace with real import when WS-1.2 completes. |
| R-2 | Minimap category dot labels overlap at the smaller 6px font size due to 15 labels in a tight grid | Medium | Low (visual clutter on minimap, non-functional impact) | The minimap is 200x150px and labels are at 6px. At this scale, some overlap is expected and acceptable for a decorative element. If overlap is severe, reduce to showing dots only (remove text labels from minimap) and rely on color for identification. |
| R-3 | Panel position changes break the `ViewportCuller` bounds, causing panels to be culled (hidden) at certain zoom levels | Low | Medium (panels invisible at some zooms) | `ViewportCuller` uses `VIEWPORT_CULL_MARGIN = 200` (from `constants.ts`). At Z1 default zoom (0.5), the visible world width is viewport / zoom ~= 1440 / 0.5 = 2880px. Panels at x:+/-1400 are within +/-1440 of center, well within the visible + margin range. Test at Z0 (0.08) where the visible world is ~18000px wide -- all elements visible. |
| R-4 | Changing `APP_NAME` breaks a consumer that uses it in a way that expects the old value (e.g., string comparison, regex match) | Low | Low (cosmetic or minor functional) | `APP_NAME` is typically used in display contexts (titles, labels, metadata). String comparisons against `APP_NAME` would be an anti-pattern. Grep for `APP_NAME` usages and verify all are display-only before making the change. |
| R-5 | Bottom status strip loses its district-aware label switching, but a future workstream expects that capability for category-aware switching | Low | Low (future workstream can re-add) | The current implementation replaces conditional labels with a single static array. This is intentional simplification: the intel pipeline labels are the same for all categories. If a future workstream needs per-category labels, it can re-introduce a conditional lookup using `getCategoryMeta()` and a `CATEGORY_HEALTH_LABELS` map. The architecture supports this. |
| R-6 | `GRID_WIDTH`, `GRID_HEIGHT`, `GRID_COLUMNS` imports from `CoverageGrid.tsx` (WS-2.1) are not available if WS-2.1 is incomplete | Low | Medium (Minimap category dot positioning is wrong) | If WS-2.1 constants are unavailable, inline the values directly: `const GRID_WIDTH = 1500; const GRID_HEIGHT = 400; const GRID_COLUMNS = 8;`. These values are stable (Decision 2 from the planning phase). Replace with imports when WS-2.1 completes. |
