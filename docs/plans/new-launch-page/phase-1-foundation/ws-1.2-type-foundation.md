# WS-1.2: Type Foundation

> **Workstream ID:** WS-1.2
> **Phase:** 1 -- Foundation
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Depends On:** None
> **Blocks:** WS-1.3 (Data Layer), WS-2.1 (Coverage Grid), WS-2.2 (Morph Adaptation), WS-3.1 (District View Adaptation), WS-3.2 (Chrome & Panels)
> **Resolves:** Decision 1 (Type Strategy: Generic NodeId), Decision 4 (Category List: Hybrid)

## 1. Objective

Widen the `DistrictId` type from a 6-member string literal union to a generic `string` alias (`NodeId`), create a new coverage type module defining category metadata for the 15 TarvaRI intel categories, and update all type annotations across the codebase so that the morph system, UI store, spatial actions, and all component/hook consumers accept arbitrary string node identifiers. This unlocks the Coverage Grid launch page (WS-2.1) and data layer (WS-1.3) by removing the hard constraint that limits the ZUI to exactly 6 Tarva product districts.

The gate criterion is: `pnpm typecheck` passes with zero errors after all changes.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| New file: coverage types | Create `src/lib/interfaces/coverage.ts` with `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES`, `CATEGORY_COLORS`, `CATEGORY_ICONS`, severity types, and source status types |
| Type widening: NodeId | Change `DistrictId` from a 6-member union to `type NodeId = string`, add a deprecated `DistrictId` alias for transition |
| Type widening: AppIdentifier | Align `AppIdentifier` in `types.ts` to `string` (or alias to `NodeId`) to eliminate the duplicate narrow union |
| Type annotation updates | Update `DistrictId`-typed parameters, return types, `Record<DistrictId, X>` patterns, and generic constraints in all 36 consuming files |
| Morph state machine types | Update `MorphState.targetId` and `MorphActions` signatures in `morph-types.ts` |
| UI store types | Update `UIState.selectedDistrictId` and `UIActions` signatures in `ui.store.ts` |
| Spatial action types | Update `flyToDistrict()` and `getDistrictById()` signatures in `spatial-actions.ts` |
| Typecheck gate | Verify `pnpm typecheck` passes with zero errors |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Component logic changes | Replacing ring layout with grid layout is WS-2.1 (Coverage Grid) |
| Morph animation changes | Changing morph behavior is WS-2.2 (Morph Adaptation) |
| Data fetching hooks | Creating TanStack Query hooks for intel data is WS-1.3 (Data Layer) |
| Coverage store (Zustand) | Creating `coverage.store.ts` with filter state is WS-1.3 (Data Layer) |
| District view scene replacement | Replacing per-district scenes with `CategoryDetailScene` is WS-3.1 |
| Chrome label updates | Changing telemetry bar text and health labels is WS-3.2 |
| Deleting/archiving old components | Archiving capsule ring, constellation view, etc. is WS-2.2 |
| Runtime behavior changes | This workstream changes only types and constants, not runtime logic |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/lib/interfaces/district.ts` | Current `DistrictId` 6-member union, `DistrictMeta`, `CapsuleData`, `BeaconData`, `DISTRICTS` array, `DISTRICT_CODES`, `HEALTH_STATE_MAP`, `MOCK_CAPSULE_DATA` (250 lines) | Available |
| `src/lib/interfaces/types.ts` | Current `AppIdentifier` duplicate union, `HealthState`, `SpatialLocation`, `CameraPosition`, `SemanticLevel` (172 lines) | Available |
| `docs/plans/new-launch-page/TYPESCRIPT-TYPES.md` | Spec for Supabase row types, derived display types, map types, severity/category constants | Available |
| `docs/plans/new-launch-page/COVERAGE-DATA-SPEC.md` | Category list (15 categories), severity levels (5), source statuses (4), table schemas | Available |
| `docs/plans/new-launch-page/combined-recommendations.md` | Decision 1 (Generic NodeId), Decision 4 (Hybrid Category List), Decision 7 (Separate Coverage Store -- types only) | Available |

## 4. Deliverables

### 4.1 Create `src/lib/interfaces/coverage.ts`

**Path:** `src/lib/interfaces/coverage.ts`

This new file defines all coverage-specific types consumed by WS-1.3 (data layer), WS-2.1 (grid), and WS-3.1 (district view). It is the authoritative module for category identity, metadata, display constants, severity levels, and source status types.

#### 4.1.1 CategoryId and CategoryMeta

```typescript
/**
 * Coverage category types and constants for the TarvaRI Alert Viewer.
 *
 * Defines the 15 known intel categories, their display metadata,
 * color mappings, icon mappings, and associated severity/source types.
 *
 * @module coverage
 * @see WS-1.2 Section 4.1
 */

// ---------------------------------------------------------------------------
// Category identity
// ---------------------------------------------------------------------------

/**
 * Category identifier string. Known categories are defined in KNOWN_CATEGORIES.
 * Unknown categories from the database fall back to 'other' styling.
 */
export type CategoryId = string

/** Static metadata for a single intel coverage category. */
export interface CategoryMeta {
  /** Category identifier (e.g. 'seismic', 'weather'). */
  id: CategoryId
  /** Human-readable display name (e.g. 'Seismic'). */
  displayName: string
  /** Short uppercase label for tight spaces (e.g. 'SEIS'). */
  shortName: string
  /** Lucide icon name for this category (e.g. 'activity', 'cloud'). */
  icon: string
  /** CSS color token or value for category identification. */
  color: string
  /** Descriptive one-liner for tooltips and card subtitles. */
  description: string
}
```

#### 4.1.2 KNOWN_CATEGORIES constant

```typescript
// ---------------------------------------------------------------------------
// Known categories (per COVERAGE-DATA-SPEC.md + Decision 4)
// ---------------------------------------------------------------------------

/**
 * The 15 known TarvaRI intel categories, ordered for grid display.
 * Categories not in this list fall back to the 'other' entry.
 */
export const KNOWN_CATEGORIES: readonly CategoryMeta[] = [
  { id: 'seismic',        displayName: 'Seismic',        shortName: 'SEIS', icon: 'activity',       color: 'var(--category-seismic, #ef4444)',        description: 'Earthquake and seismic activity' },
  { id: 'geological',     displayName: 'Geological',     shortName: 'GEO',  icon: 'mountain',       color: 'var(--category-geological, #f97316)',     description: 'Geological hazards and events' },
  { id: 'disaster',       displayName: 'Disaster',       shortName: 'DIS',  icon: 'alert-triangle', color: 'var(--category-disaster, #a855f7)',       description: 'Multi-type disaster events' },
  { id: 'humanitarian',   displayName: 'Humanitarian',   shortName: 'HUM',  icon: 'heart',          color: 'var(--category-humanitarian, #6366f1)',   description: 'Humanitarian crises and aid' },
  { id: 'health',         displayName: 'Health',         shortName: 'HLT',  icon: 'heart-pulse',    color: 'var(--category-health, #22c55e)',         description: 'Public health advisories' },
  { id: 'aviation',       displayName: 'Aviation',       shortName: 'AVN',  icon: 'plane',          color: 'var(--category-aviation, #06b6d4)',       description: 'Aviation safety notices' },
  { id: 'maritime',       displayName: 'Maritime',       shortName: 'MAR',  icon: 'ship',           color: 'var(--category-maritime, #14b8a6)',       description: 'Maritime safety and navigation' },
  { id: 'infrastructure', displayName: 'Infrastructure', shortName: 'INF',  icon: 'building-2',     color: 'var(--category-infrastructure, #eab308)', description: 'Infrastructure disruptions' },
  { id: 'weather',        displayName: 'Weather',        shortName: 'WX',   icon: 'cloud',          color: 'var(--category-weather, #3b82f6)',        description: 'Weather warnings and advisories' },
  { id: 'conflict',       displayName: 'Conflict',       shortName: 'CON',  icon: 'shield-alert',   color: 'var(--category-conflict, #dc2626)',       description: 'Armed conflict and security' },
  { id: 'fire',           displayName: 'Fire',           shortName: 'FIR',  icon: 'flame',          color: 'var(--category-fire, #ea580c)',           description: 'Wildfire and fire incidents' },
  { id: 'flood',          displayName: 'Flood',          shortName: 'FLD',  icon: 'waves',          color: 'var(--category-flood, #4f46e5)',          description: 'Flood warnings and events' },
  { id: 'storm',          displayName: 'Storm',          shortName: 'STM',  icon: 'cloud-lightning', color: 'var(--category-storm, #0ea5e9)',         description: 'Storm systems and warnings' },
  { id: 'multi-hazard',   displayName: 'Multi-Hazard',   shortName: 'MHZ',  icon: 'layers',         color: 'var(--category-multi-hazard, #6b7280)',  description: 'Multi-hazard compound events' },
  { id: 'other',          displayName: 'Other',          shortName: 'OTH',  icon: 'circle-dot',     color: 'var(--category-other, #9ca3af)',          description: 'Uncategorized intelligence' },
] as const
```

#### 4.1.3 CATEGORY_COLORS and lookup helpers

```typescript
// ---------------------------------------------------------------------------
// Color and icon lookup maps (derived from KNOWN_CATEGORIES)
// ---------------------------------------------------------------------------

/** Maps category ID to its display color. Falls back to 'other' color for unknown IDs. */
export const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  KNOWN_CATEGORIES.map((c) => [c.id, c.color]),
)

/** Maps category ID to its Lucide icon name. Falls back to 'circle-dot' for unknown IDs. */
export const CATEGORY_ICONS: Record<string, string> = Object.fromEntries(
  KNOWN_CATEGORIES.map((c) => [c.id, c.icon]),
)

/** Default color for unknown categories. */
export const DEFAULT_CATEGORY_COLOR = 'var(--category-other, #9ca3af)'

/** Default icon for unknown categories. */
export const DEFAULT_CATEGORY_ICON = 'circle-dot'

/**
 * Get the display color for a category ID.
 * Returns the default gray for unknown categories.
 */
export function getCategoryColor(categoryId: string): string {
  return CATEGORY_COLORS[categoryId] ?? DEFAULT_CATEGORY_COLOR
}

/**
 * Get the Lucide icon name for a category ID.
 * Returns 'circle-dot' for unknown categories.
 */
export function getCategoryIcon(categoryId: string): string {
  return CATEGORY_ICONS[categoryId] ?? DEFAULT_CATEGORY_ICON
}

/**
 * Get the full CategoryMeta for a category ID.
 * Returns the 'other' entry for unknown categories.
 */
export function getCategoryMeta(categoryId: string): CategoryMeta {
  return KNOWN_CATEGORIES.find((c) => c.id === categoryId)
    ?? KNOWN_CATEGORIES[KNOWN_CATEGORIES.length - 1] // 'other' is last
}
```

#### 4.1.4 Severity types

```typescript
// ---------------------------------------------------------------------------
// Severity levels (per COVERAGE-DATA-SPEC.md)
// ---------------------------------------------------------------------------

/** TarvaRI severity levels in descending order of urgency. */
export const SEVERITY_LEVELS = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'] as const

/** Severity level type. */
export type SeverityLevel = (typeof SEVERITY_LEVELS)[number]

/** Maps severity level to its display color. */
export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  Extreme:  'var(--severity-extreme, #ef4444)',
  Severe:   'var(--severity-severe, #f97316)',
  Moderate: 'var(--severity-moderate, #eab308)',
  Minor:    'var(--severity-minor, #3b82f6)',
  Unknown:  'var(--severity-unknown, #6b7280)',
}
```

#### 4.1.5 Source status types

```typescript
// ---------------------------------------------------------------------------
// Source status (per COVERAGE-DATA-SPEC.md)
// ---------------------------------------------------------------------------

/** Intel source operational statuses. */
export const SOURCE_STATUSES = ['active', 'staging', 'quarantine', 'disabled'] as const

/** Source status type. */
export type SourceStatus = (typeof SOURCE_STATUSES)[number]
```

---

### 4.2 Widen `DistrictId` to `NodeId` in `src/lib/interfaces/district.ts`

**Path:** `src/lib/interfaces/district.ts`

#### 4.2.1 Replace the `DistrictId` union with a `NodeId` alias

**Lines 15-22:** Replace the existing 6-member union:

```typescript
// BEFORE (lines 15-22):
/** Unique identifier for each Tarva district. */
export type DistrictId =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

// AFTER:
/**
 * Generic node identifier for the spatial ZUI.
 * Any string is valid -- the system is no longer constrained to 6 districts.
 * Known IDs for original Tarva districts are preserved in LEGACY_DISTRICT_IDS.
 * Coverage category IDs (e.g. 'seismic', 'weather') are defined in coverage.ts.
 */
export type NodeId = string

/**
 * @deprecated Use NodeId instead. This alias exists for transition compatibility
 * and will be removed once all downstream workstreams (WS-2.x, WS-3.x) are complete.
 */
export type DistrictId = NodeId
```

#### 4.2.2 Add legacy district ID constant

Add a constant below the type definition so downstream code that still needs to enumerate the original 6 districts (e.g., the archived page, enrichment cycle mock data) has an explicit list:

```typescript
/** The 6 original Tarva district identifiers. Used by legacy components during transition. */
export const LEGACY_DISTRICT_IDS = [
  'agent-builder',
  'tarva-chat',
  'project-room',
  'tarva-core',
  'tarva-erp',
  'tarva-code',
] as const

/** Type for the 6 original district IDs (narrower than NodeId). */
export type LegacyDistrictId = (typeof LEGACY_DISTRICT_IDS)[number]
```

#### 4.2.3 Update `DistrictMeta.id` field type

**Line 57:** The `id` field in `DistrictMeta` currently uses `DistrictId`. After widening, this becomes `NodeId` (via the alias). No code change is required because `DistrictId` is now `NodeId = string`. However, the JSDoc should be updated:

```typescript
// BEFORE (line 57):
  /** Unique district identifier. */
  id: DistrictId

// AFTER:
  /** Node identifier (district ID or category ID). */
  id: NodeId
```

#### 4.2.4 Update `DistrictCode` type and `DISTRICT_CODES` constant

**Lines 193-203:** The `DistrictCode` type is a 6-member union tied to legacy districts. The `DISTRICT_CODES` record is keyed by the old narrow `DistrictId`. After widening:

```typescript
// BEFORE (lines 193-203):
export type DistrictCode = 'AB' | 'CH' | 'PR' | 'CO' | 'ER' | 'CD'
export const DISTRICT_CODES: Record<DistrictId, DistrictCode> = { ... }

// AFTER:
export type DistrictCode = 'AB' | 'CH' | 'PR' | 'CO' | 'ER' | 'CD'

/**
 * Maps legacy district IDs to their compact two-letter codes for Z0 display.
 * @deprecated Legacy mapping. Coverage categories use shortName from CategoryMeta.
 */
export const DISTRICT_CODES: Partial<Record<NodeId, DistrictCode>> = {
  'agent-builder': 'AB',
  'tarva-chat': 'CH',
  'project-room': 'PR',
  'tarva-core': 'CO',
  'tarva-erp': 'ER',
  'tarva-code': 'CD',
} as const
```

The change from `Record<DistrictId, DistrictCode>` to `Partial<Record<NodeId, DistrictCode>>` means lookups like `DISTRICT_CODES[someId]` now return `DistrictCode | undefined`, which is correct because not every NodeId has a code. Consumers that access this constant are:

- `src/components/districts/constellation-view.tsx` (line 29, imports `DISTRICT_CODES`) -- used to build `BeaconData`. Will need optional chaining or a fallback.

#### 4.2.5 Update `BeaconData.id` field type

**Line 208:** Change from `DistrictId` to `NodeId`:

```typescript
// BEFORE:
  id: DistrictId
// AFTER:
  id: NodeId
```

#### 4.2.6 Keep `DISTRICTS` and `MOCK_CAPSULE_DATA` unchanged

The `DISTRICTS` array (lines 87-130) and `MOCK_CAPSULE_DATA` (lines 239-249) contain valid string literals that satisfy `NodeId = string`. Their runtime values do not change. The `as const` assertion is compatible with `string`. No changes needed.

---

### 4.3 Align `AppIdentifier` in `src/lib/interfaces/types.ts`

**Path:** `src/lib/interfaces/types.ts`

#### 4.3.1 Replace the `AppIdentifier` union with a `NodeId` re-export

**Lines 26-32:** The `AppIdentifier` type is identical to the old `DistrictId` union. Both should converge on `NodeId`.

```typescript
// BEFORE (lines 26-32):
export type AppIdentifier =
  | 'agent-builder'
  | 'tarva-chat'
  | 'project-room'
  | 'tarva-core'
  | 'tarva-erp'
  | 'tarva-code'

// AFTER:
import type { NodeId } from './district'

/**
 * @deprecated Use NodeId from district.ts instead.
 * Kept as alias for transition compatibility.
 */
export type AppIdentifier = NodeId
```

#### 4.3.2 Update `APP_DISPLAY_NAMES` and `APP_SHORT_CODES`

**Lines 35-52:** These `Record<AppIdentifier, string>` constants become `Partial<Record<string, string>>` or keep `Record<string, string>` since AppIdentifier is now string:

```typescript
// BEFORE:
export const APP_DISPLAY_NAMES: Readonly<Record<AppIdentifier, string>> = { ... }
export const APP_SHORT_CODES: Readonly<Record<AppIdentifier, string>> = { ... }

// AFTER:
/** @deprecated Legacy display names. Coverage categories use CategoryMeta.displayName. */
export const APP_DISPLAY_NAMES: Readonly<Record<string, string>> = { ... }

/** @deprecated Legacy short codes. Coverage categories use CategoryMeta.shortName. */
export const APP_SHORT_CODES: Readonly<Record<string, string>> = { ... }
```

The object literal bodies remain unchanged -- the 6 entries are still valid.

#### 4.3.3 Update `ALL_APP_IDS`

**Lines 55-62:**

```typescript
// BEFORE:
export const ALL_APP_IDS: readonly AppIdentifier[] = [ ... ]

// AFTER:
/** @deprecated Use LEGACY_DISTRICT_IDS from district.ts or KNOWN_CATEGORIES from coverage.ts. */
export const ALL_APP_IDS: readonly string[] = [ ... ]
```

#### 4.3.4 Update `SpatialLocation.district`

**Line 122:** The `district` field references `AppIdentifier`:

```typescript
// BEFORE:
  readonly district: AppIdentifier | null

// AFTER:
  readonly district: NodeId | null
```

This requires the `NodeId` import added in 4.3.1.

#### 4.3.5 Update `ReceiptSource`

**Line 158:**

```typescript
// BEFORE:
export type ReceiptSource = 'launch' | AppIdentifier

// AFTER:
export type ReceiptSource = 'launch' | string
```

Since `AppIdentifier = string`, this simplifies to just `string`. However, to preserve semantic intent:

```typescript
/** Receipt source: 'launch' for the hub itself, or any node ID. */
export type ReceiptSource = string
```

---

### 4.4 Update `src/lib/morph-types.ts`

**Path:** `src/lib/morph-types.ts`

#### 4.4.1 Update import

**Line 11:**

```typescript
// BEFORE:
import type { DistrictId } from '@/lib/interfaces/district'

// AFTER:
import type { NodeId } from '@/lib/interfaces/district'
```

#### 4.4.2 Update `MorphState.targetId`

**Line 82:**

```typescript
// BEFORE:
  targetId: DistrictId | null

// AFTER:
  /** Node being expanded (forward) or collapsed (reverse). Null when idle. */
  targetId: NodeId | null
```

#### 4.4.3 Update `MorphActions` signatures

**Lines 98 and 103:**

```typescript
// BEFORE:
  startMorph: (districtId: DistrictId) => void

// AFTER:
  startMorph: (nodeId: NodeId) => void
```

Note: The parameter name change from `districtId` to `nodeId` is a type-level documentation improvement. The implementation in `ui.store.ts` will be updated to match.

---

### 4.5 Update `src/stores/ui.store.ts`

**Path:** `src/stores/ui.store.ts`

#### 4.5.1 Update import

**Line 13:**

```typescript
// BEFORE:
import type { DistrictId } from '@/lib/interfaces/district'

// AFTER:
import type { NodeId } from '@/lib/interfaces/district'
```

#### 4.5.2 Update `UIState.selectedDistrictId` type

**Line 22:**

```typescript
// BEFORE:
  selectedDistrictId: DistrictId | null

// AFTER:
  selectedDistrictId: NodeId | null
```

#### 4.5.3 Update `UIActions` method signatures

**Lines 41 and 48:**

```typescript
// BEFORE:
  selectDistrict: (id: DistrictId | null) => void
  startMorph: (districtId: DistrictId) => void

// AFTER:
  selectDistrict: (id: NodeId | null) => void
  startMorph: (nodeId: NodeId) => void
```

#### 4.5.4 Update selector return type

**Line 180:**

```typescript
// BEFORE:
  morphTargetId: (state: UIStore): DistrictId | null => state.morph.targetId,

// AFTER:
  morphTargetId: (state: UIStore): NodeId | null => state.morph.targetId,
```

---

### 4.6 Update `src/lib/spatial-actions.ts`

**Path:** `src/lib/spatial-actions.ts`

#### 4.6.1 Update import

**Line 18:**

```typescript
// BEFORE:
import { DISTRICTS, type DistrictId, type DistrictMeta } from '@/lib/interfaces/district'

// AFTER:
import { DISTRICTS, type NodeId, type DistrictMeta } from '@/lib/interfaces/district'
```

#### 4.6.2 Update `getDistrictById` signature

**Lines 58-59:**

```typescript
// BEFORE:
export function getDistrictById(id: DistrictId): DistrictMeta | undefined {

// AFTER:
export function getDistrictById(id: NodeId): DistrictMeta | undefined {
```

#### 4.6.3 Update `flyToDistrict` signature

**Lines 97-98:**

```typescript
// BEFORE:
export function flyToDistrict(districtId: DistrictId): void {

// AFTER:
export function flyToDistrict(nodeId: NodeId): void {
  const district = getDistrictById(nodeId)
```

Note: The function body change on the next line (`getDistrictById(districtId)` becomes `getDistrictById(nodeId)`) matches the parameter rename.

---

### 4.7 Update component files with `DistrictId` type annotations

Each file below requires its `DistrictId` import to be changed to `NodeId` (or to use the `DistrictId` alias, which is now `NodeId`). Because `DistrictId` is preserved as a deprecated alias, these files will typecheck without any import changes. However, the recommended approach is to update imports to `NodeId` in files that are critical to the morph pipeline, and leave the alias for files that will be archived or heavily rewritten in later workstreams.

**Strategy:** Update to `NodeId` in morph-pipeline files (high priority). Leave `DistrictId` alias in files slated for archival/replacement (low priority).

#### 4.7.1 High priority -- Update to `NodeId` (morph pipeline)

These files form the morph pipeline and will persist through all future workstreams:

| File | Import Line | Type Usages | Change Required |
|------|-------------|-------------|-----------------|
| `src/hooks/use-morph-choreography.ts` | Line 40 | `DistrictId` in return type (line 55), `startMorph` param (line 59) | Change import to `NodeId`; update return interface `targetId: NodeId \| null` and `startMorph: (nodeId: NodeId) => void` |
| `src/components/districts/morph-orchestrator.tsx` | Line 31 | `CapsuleData, DistrictId` in `handleCapsuleSelect` param (line 54), `handleBeaconSelect` param (line 64) | Change `DistrictId` import to `NodeId`; update callback params |
| `src/components/districts/detail-panel.tsx` | Line 17 | `DistrictId` in `DetailPanelProps.districtId` (line 32) | Change import to `NodeId`; update prop type |
| `src/components/districts/capsule-ring.tsx` | Line 22 | `CapsuleData, DistrictId` in `CapsuleRingProps.selectedId` and `onSelect` callback | Change `DistrictId` to `NodeId` in props interface |

#### 4.7.2 Medium priority -- Update to `NodeId` (district view)

These files are modified in WS-3.1 but the type change is needed now:

| File | Import Line | Change Required |
|------|-------------|-----------------|
| `src/components/district-view/district-view-overlay.tsx` | Line 26 | Change import to `NodeId`. Update `DISTRICT_TINTS` type from `Record<DistrictId, string>` to `Record<string, string>` (line 36). Update `getPanelSideForDistrict` param type (line 49). Update cast on line 69 from `as DistrictId \| null` to `as NodeId \| null`. |
| `src/components/district-view/district-view-content.tsx` | Line 11 | Change import to `NodeId`. Update `SCENE_MAP` type from `Record<DistrictId, ...>` to `Record<string, ...>` (line 26). Update `DistrictViewContentProps.districtId` to `NodeId` (line 40). Add fallback for unknown IDs in the component body (line 49): `if (!Scene) return null`. |
| `src/components/district-view/district-view-header.tsx` | Line 19 | Change import to `NodeId`. Update `DistrictViewHeaderProps.districtId` to `NodeId` (line 27). |
| `src/components/district-view/district-view-dock.tsx` | Line 15 | Change import to `NodeId`. Update `STATION_CONFIG` type from `Record<DistrictId, StationConfig>` to `Record<string, StationConfig>` (line 28). |

#### 4.7.3 Low priority -- Leave `DistrictId` alias (archival candidates)

These files are slated for archival in WS-2.2 or heavy rewrite in WS-3.2. They can use the deprecated `DistrictId` alias without change. The alias ensures they compile:

| File | Reason to Leave |
|------|-----------------|
| `src/components/districts/district-capsule.tsx` | Archived in WS-2.2 |
| `src/components/districts/constellation-view.tsx` | Archived in WS-2.2 |
| `src/components/districts/district-beacon.tsx` | Archived in WS-2.2 |
| `src/components/districts/district-content.tsx` | Archived in WS-2.2 |
| `src/components/districts/district-shell.tsx` | Archived in WS-2.2 |
| `src/components/ambient/activity-ticker.tsx` | Rewritten in WS-3.2 |
| `src/components/ambient/orbital-readouts.tsx` | Rewritten in WS-3.2 |
| `src/components/ambient/connection-paths.tsx` | Rewritten in WS-3.2 |
| `src/components/ambient/system-status-panel.tsx` | Rewritten in WS-3.2 |

#### 4.7.4 Update `Record<DistrictId, X>` patterns to tolerate string keys

The following constant objects are keyed by the old narrow `DistrictId` union. When `DistrictId` becomes `string`, `Record<string, X>` claims all string keys exist (returning `X`, not `X | undefined`). This is semantically wrong since only 6 keys are populated. For objects that persist beyond WS-2.2, convert to `Partial<Record<string, X>>` or add a runtime fallback.

| File | Constant | Current Type | Action |
|------|----------|-------------|--------|
| `district-view-overlay.tsx` line 36 | `DISTRICT_TINTS` | `Record<DistrictId, string>` | Change to `Record<string, string>`. Add fallback in usage (line 101): `DISTRICT_TINTS[districtId] ?? 'rgba(255,255,255,0.04)'` |
| `district-view-content.tsx` line 26 | `SCENE_MAP` | `Record<DistrictId, ComponentType>` | Change to `Partial<Record<string, ComponentType>>`. Add null guard (line 49): `if (!Scene) return null` |
| `district-view-dock.tsx` line 28 | `STATION_CONFIG` | `Record<DistrictId, StationConfig>` | Change to `Record<string, StationConfig>`. Add optional chaining at usage site |
| `district-content.tsx` line 40 | `DISTRICT_CONFIG` | `Record<DistrictId, DistrictConfig>` | No change (archived in WS-2.2) |
| `bottom-status-strip.tsx` line 142 | `DISTRICT_HEALTH_LABELS` | `Record<DistrictId, readonly string[]>` | No change (rewritten in WS-3.2); alias covers it |
| `feed-panel.tsx` line 48 | `DISTRICT_SHORT_NAMES` | `Record<DistrictId, string>` | No change (rewritten in WS-3.2); alias covers it |
| `connection-paths.tsx` line 158 | `DISTRICT_RING_INDEX` | `Record<DistrictId, number>` | No change (archived in WS-2.2); alias covers it |
| `capsule-ring.tsx` line 114 | `refs` cast | `Record<DistrictId, RefObject>` | No change (archived in WS-2.2); alias covers it |

#### 4.7.5 Update ambient/chrome components (type-only changes)

| File | Change |
|------|--------|
| `src/components/ambient/bottom-status-strip.tsx` line 22 | Import stays as `DistrictId` (alias). No code change needed -- `targetId as DistrictId` on line 200 continues to work since `DistrictId = string`. |
| `src/components/ambient/top-telemetry-bar.tsx` line 20 | Uses `DISTRICTS` import (no `DistrictId` type import). No change needed. |
| `src/components/ambient/feed-panel.tsx` lines 30-31 | Import stays as `DistrictId` (alias). `DISTRICT_SHORT_NAMES` record continues to work. No change needed. |
| `src/components/spatial/Minimap.tsx` line 25 | Uses `DistrictMeta` (not `DistrictId` directly). Import stays. No change needed. |
| `src/components/ui/SpatialBreadcrumb.tsx` line 37 | Import stays as `DistrictId` (alias). No change needed. |

#### 4.7.6 Update AI/builder files that use `AppIdentifier`

These files import `AppIdentifier` from `types.ts`. Since `AppIdentifier` is now aliased to `NodeId = string`, they compile without changes. No modifications required for this workstream. The files are:

- `src/stores/ai.store.ts` (uses `AppIdentifier` for `targetDistrictId`)
- `src/stores/builder.store.ts` (uses `AppIdentifier` for session target)
- `src/lib/ai/builder-types.ts` (uses `AppIdentifier` in BuilderSession)
- `src/lib/ai/builder-receipt.ts` (references `targetDistrictId`)
- `src/lib/ai/attention-types.ts`, `narration-types.ts`, etc.
- `src/lib/interfaces/exception-triage.ts`, `receipt-store.ts`, `station-template-registry.ts`, etc.
- `src/hooks/use-builder-mode.ts`, `use-camera-director.ts`, etc.

All 42 files importing `AppIdentifier` continue to compile because the alias resolves to `string`.

#### 4.7.7 Update enrichment types and stores

| File | Import | Change |
|------|--------|--------|
| `src/lib/enrichment/enrichment-types.ts` line 14 | `import type { DistrictId, HealthState }` | Keep `DistrictId` (alias). `DistrictEnrichment.id: DistrictId` (line 23) and `EnrichmentSnapshot.districts: Record<DistrictId, DistrictEnrichment>` (line 117) remain valid. |
| `src/stores/enrichment.store.ts` line 18 | `import type { DistrictId, HealthState }` | Keep `DistrictId` (alias). `seedDistrict(id: DistrictId)` (line 50) and `seedDistricts(): Record<DistrictId, DistrictEnrichment>` (line 79-80) remain valid. |
| `src/hooks/use-enrichment-cycle.ts` line 31 | `import type { DistrictId, HealthState }` | Keep `DistrictId` (alias). All `Record<DistrictId, DistrictEnrichment>` usages (lines 194, 229, 250) remain valid. |

No changes required -- the deprecated alias ensures compilation.

---

### 4.8 Verify typecheck gate

After all changes above, run:

```bash
pnpm typecheck
```

Expected result: zero errors. If errors surface, they will be in one of these categories:

1. **Missing `NodeId` export:** Ensure `district.ts` exports both `NodeId` and `DistrictId`.
2. **`Partial<Record>` access:** Consumers of `DISTRICT_CODES` (now `Partial`) may need optional chaining. The only consumer is `constellation-view.tsx` (line 29), which accesses `DISTRICT_CODES[district.id]`. Add `?? ''` fallback.
3. **Exhaustive switch/if-else on DistrictId values:** Search for `=== 'agent-builder'` style exhaustive checks. These will still compile (string equality is valid) but may trigger `no-unsafe-member-access` lint warnings with `Record<string, X>`. Suppress per-line if needed.

---

### 4.9 Update barrel export (if applicable)

**Path:** `src/lib/interfaces/index.ts`

If this file re-exports from `district.ts` or `types.ts`, add re-export for the new coverage module:

```typescript
export * from './coverage'
```

And ensure `NodeId` is exported:

```typescript
export type { NodeId, DistrictId, DistrictMeta, ... } from './district'
```

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/lib/interfaces/coverage.ts` exists and exports `CategoryId`, `CategoryMeta`, `KNOWN_CATEGORIES` (15 entries), `CATEGORY_COLORS`, `CATEGORY_ICONS`, `getCategoryColor()`, `getCategoryIcon()`, `getCategoryMeta()`, `SeverityLevel`, `SEVERITY_LEVELS` (5 entries), `SEVERITY_COLORS`, `SourceStatus`, `SOURCE_STATUSES` (4 entries) | File existence; import each symbol in a test or ad-hoc TS file |
| AC-2 | `NodeId` is exported from `src/lib/interfaces/district.ts` and equals `string` | `type _check: NodeId = 'any-string'` compiles |
| AC-3 | `DistrictId` is exported as a deprecated alias for `NodeId` | Import compiles; JSDoc shows `@deprecated` |
| AC-4 | `LEGACY_DISTRICT_IDS` constant is exported with 6 entries | Import and verify `.length === 6` |
| AC-5 | `AppIdentifier` in `types.ts` is aliased to `NodeId` | Import compiles; `type _check: AppIdentifier = 'any-string'` works |
| AC-6 | `MorphState.targetId` accepts `string \| null` (not just 6 IDs) | Assigning `targetId: 'weather'` in a type test compiles |
| AC-7 | `UIState.selectedDistrictId` accepts `string \| null` | Assigning `selectedDistrictId: 'seismic'` compiles |
| AC-8 | `pnpm typecheck` passes with zero errors | Run `pnpm typecheck` in CI or locally |
| AC-9 | No runtime behavior changes | Dev server loads the existing launch page identically (visual smoke test) |
| AC-10 | `KNOWN_CATEGORIES` has exactly 15 entries matching the category list from COVERAGE-DATA-SPEC.md | Programmatic count check |
| AC-11 | All `Record<DistrictId, X>` patterns that persist beyond WS-2.2 have runtime fallbacks for unknown keys | Code review of `district-view-overlay.tsx`, `district-view-content.tsx`, `district-view-dock.tsx` |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | Widen `DistrictId` to `type NodeId = string` rather than a union of 15 category IDs | Categories are data-driven (queried from Supabase). A union would require code changes every time a new category appears in the database. `string` is the correct type for dynamic identifiers. | (a) `CategoryId = typeof KNOWN_CATEGORIES[number]['id']` -- loses dynamic categories from DB; (b) Branded `string & { __brand: 'NodeId' }` -- adds complexity without clear benefit since any string from the DB must be accepted |
| D-2 | Keep `DistrictId` as deprecated alias rather than find-and-replace all 36 files | Minimizes diff size and risk. Files slated for archival in WS-2.2 (9 files) and rewrite in WS-3.2 (4 files) will be deleted before the alias matters. Only 8 morph-pipeline files get the full `NodeId` update. | (a) Global rename all 36 files now -- high risk, touches code slated for deletion; (b) Leave as-is and only change the type definition -- valid but misses the chance to signal intent in persisting files |
| D-3 | Use `Partial<Record<string, X>>` for `DISTRICT_CODES` but `Record<string, X>` for tint/config maps | `DISTRICT_CODES` is consumed with bracket access (`DISTRICT_CODES[id]`) where `undefined` is a real possibility. Tint/config maps are used in controlled contexts where a fallback is added inline. `Partial` forces `undefined` handling at the call site. | (a) All `Partial` -- forces null checks everywhere, high churn; (b) All `Record` -- hides potential `undefined` access, but fallbacks are added explicitly |
| D-4 | `KNOWN_CATEGORIES` uses Lucide icon string names rather than imported icon components | Icon imports are a render-time concern. Storing component references in a constant breaks tree-shaking and couples the type module to React. The rendering layer (WS-2.1) maps icon names to components at render time. | (a) Import and store `LucideIcon` components -- breaks tree-shaking, couples types to React; (b) Use an enum -- no benefit over string for Lucide icons |
| D-5 | Use CSS custom properties (`var(--category-seismic, #ef4444)`) for category colors rather than raw hex | Enables future theming (dark/light mode, high contrast) without changing the constant. Fallback hex ensures colors work even without the custom properties defined. Consistent with the existing `HEALTH_STATE_MAP` pattern in `district.ts`. | (a) Raw hex only -- blocks theming; (b) Tailwind class names -- not usable in inline styles or canvas contexts |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `LEGACY_DISTRICT_IDS` and the `LegacyDistrictId` type be removed in WS-2.2 (when capsule ring components are archived), or kept until all legacy components are fully removed? | Planning Agent | Phase 2 |
| OQ-2 | Should `district-view-content.tsx`'s `SCENE_MAP` fallback render a generic placeholder scene for unknown IDs (before WS-3.1 creates `CategoryDetailScene`)? Or should it return `null` and let the parent handle the empty state? | react-developer | Phase 1 (this WS) -- recommendation: return `null`, let parent handle |
| OQ-3 | The `DistrictMeta.ringIndex` field (typed as `0 | 1 | 2 | 3 | 4 | 5`) is only meaningful for the 6-capsule ring layout. Should it be widened to `number` in this workstream, or left for WS-2.1 when the grid layout replaces the ring? | react-developer | Phase 2 (WS-2.1) |
| OQ-4 | Should CSS custom properties for the 15 category colors (e.g., `--category-seismic`) be defined in this workstream's scope (in a CSS file), or deferred to WS-2.1 when they are first visually consumed? | react-developer | Phase 2 (WS-2.1) -- recommendation: defer |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `DistrictId` type cascade causes typecheck failures in files not identified in the audit | Medium | High (blocks gate) | The deprecated `DistrictId` alias means all existing `import type { DistrictId }` statements continue to compile without changes. Only files explicitly updated to `NodeId` could break. Run `pnpm typecheck` incrementally after each deliverable group (4.2 + 4.3 first, then 4.4 + 4.5, then 4.6 + 4.7). |
| R-2 | `Record<string, X>` patterns hide runtime `undefined` access, causing downstream crashes | Medium | Medium (runtime errors in district view) | Add explicit fallbacks (nullish coalescing `??`) in all persistent `Record<string, X>` access sites. Documented in Deliverable 4.7.4. Verified by AC-11. |
| R-3 | Circular import between `district.ts` and `coverage.ts` | Low | Medium (compilation error) | `coverage.ts` does not import from `district.ts`. `district.ts` does not import from `coverage.ts`. They are independent modules. If shared types are needed, they go in `types.ts`. |
| R-4 | `DISTRICT_CODES` change to `Partial<Record>` causes null-check errors in `constellation-view.tsx` | High | Low (single file, archival candidate in WS-2.2) | Add `?? ''` fallback at the access site in `constellation-view.tsx`. This file is archived in WS-2.2 so the fix is temporary. |
| R-5 | `pnpm typecheck` reveals strict null checking issues in files that were previously masked by the narrow union type | Low | Medium (multiple files need fixes) | Run typecheck early and often. The `DistrictId` alias means most files are unaffected. Only files updated to `NodeId` or `Partial<Record>` could surface new strict null issues. |
| R-6 | Third-party or workspace dependency (`@tarva/ui`) has type expectations for `DistrictId` | Low | Medium (build failure) | Grep `@tarva/ui` source for `DistrictId` or `AppIdentifier` references. If found, the library needs a parallel type update. Initial grep of the codebase shows no `@tarva/ui` imports of these types. |
