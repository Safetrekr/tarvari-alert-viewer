# WS-4.6: Coverage Store Extensions

> **Workstream ID:** WS-4.6
> **Phase:** 4 -- Geographic Intelligence
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** None (within Phase 4)
> **Blocks:** WS-4.3 (GeoSummaryPanel), WS-4.5 (Entry Point in Stats/HUD)
> **Resolves:** R10 mutual exclusion concern between GeoSummaryPanel and DistrictViewOverlay

---

## 1. Objective

Extend `coverage.store.ts` with the state fields, actions, and selectors that WS-4.3 (GeoSummaryPanel) and WS-4.5 (entry point button) depend on to manage the geographic intelligence slide-over panel. This workstream provides the open/close lifecycle, geographic drill-down navigation state, and summary type selection for the three-level geographic hierarchy (World > Region > Country) described in AD-7.

Critically, this workstream also implements the **mutual exclusion logic** between the geo summary panel (z-42) and the district view overlay (z-30), as identified in risk R10 of the combined recommendations. The geo summary panel must close when a district morph begins, and the morph system must not start while the geo panel is animating closed. This cross-store coordination is the primary architectural concern of this workstream.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| State fields in `coverage.store.ts` | Add `geoSummaryOpen`, `summaryGeoLevel`, `summaryGeoKey`, and `summaryType` to `CoverageState`. These are transient view state -- same category as `selectedBundleId` and `priorityFeedExpanded`. No persistence, no URL sync. |
| Actions in `coverage.store.ts` | Add `openGeoSummary`, `closeGeoSummary`, and `drillDownGeo` to `CoverageActions`. |
| Selectors in `coverageSelectors` | Add selectors for panel open state, current geo level, current geo key, and a computed `geoSummaryBreadcrumb` selector for the header breadcrumb trail. |
| Mutual exclusion with district overlay | `openGeoSummary` is a no-op when the morph state machine is not in `idle` phase. When `startMorph` is called in `ui.store.ts` while the geo panel is open, the panel must close first. The coordination mechanism is defined here; the wiring is implemented in the consuming component (WS-4.3) or morph orchestrator (documented as an integration contract). |
| Geographic region key validation | The 11 region keys from AD-7 are defined as a const array and type. `openGeoSummary` and `drillDownGeo` validate incoming keys against the known set. |
| Type exports | Export `GeoLevel`, `GeoRegionKey`, and `SummaryType` types for downstream consumers. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| GeoSummaryPanel component | WS-4.3 builds the visual panel. This workstream provides the state it reads and writes. |
| Entry point button ("THREAT PICTURE") | WS-4.5 provides the button that calls `openGeoSummary`. This workstream provides the action it calls. |
| `useThreatPicture` and `useGeoSummaries` hooks | WS-4.1 and WS-4.2 respectively. This workstream provides state for panel visibility and navigation; data fetching is separate. |
| Trend indicators on CategoryCard | WS-4.4. Driven by threat picture data, not by the geo summary panel state. |
| URL sync for geo panel state | The geo summary panel is an ephemeral overlay. Deep-linking to an open geo panel with a specific drill-down path has limited user value. Unlike category filters and view modes (which represent meaningful data views), the panel state is navigational context that does not warrant URL persistence. If needed later, it can be added without changing the store shape. |
| Slide-over animation | Handled by `motion/react` in WS-4.3. The store provides the boolean; the component animates. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|---------------|--------|
| `src/stores/coverage.store.ts` | Existing store file to extend with geo summary state | Available -- reviewed (290 lines, Immer + Zustand) |
| `src/stores/ui.store.ts` | Morph phase state for mutual exclusion reads. The geo panel checks `morph.phase` before opening. | Available -- reviewed |
| AD-7 (combined recommendations) | The 11 geographic region keys and their names | Available -- defined in combined-recommendations.md |
| R10 (combined recommendations) | Mutual exclusion requirement: close geo panel when district opens | Available -- documented |
| AD-3 (combined recommendations) | Panel specification: 560px slide-over, z-42, Escape to dismiss | Available -- documented |

---

## 4. Deliverables

### 4.1. Geographic Region Constants (in `src/lib/interfaces/coverage.ts`)

The 11 regions from AD-7 need to be defined as a typed constant for runtime validation and display. These constants are placed in the existing coverage interfaces file alongside `KNOWN_CATEGORIES` and `SEVERITY_LEVELS`.

#### Types

```typescript
/** Geographic hierarchy levels for intel summaries. */
export type GeoLevel = 'world' | 'region' | 'country'

/** Summary period types. */
export type SummaryType = 'hourly' | 'daily'

/**
 * The 11 travel-security geographic region keys (AD-7).
 * These are URL-safe, kebab-case identifiers used as the `summaryGeoKey`
 * when `summaryGeoLevel` is `'region'`.
 */
export const GEO_REGION_KEYS = [
  'north-america',
  'central-america-caribbean',
  'south-america',
  'western-europe',
  'eastern-europe',
  'middle-east',
  'north-africa',
  'sub-saharan-africa',
  'south-central-asia',
  'east-southeast-asia',
  'oceania',
] as const

export type GeoRegionKey = (typeof GEO_REGION_KEYS)[number]

/** Display metadata for each geographic region. */
export const GEO_REGION_META: Record<GeoRegionKey, { displayName: string; shortName: string }> = {
  'north-america':              { displayName: 'North America',              shortName: 'N. AMERICA' },
  'central-america-caribbean':  { displayName: 'Central America & Caribbean', shortName: 'C. AMERICA' },
  'south-america':              { displayName: 'South America',              shortName: 'S. AMERICA' },
  'western-europe':             { displayName: 'Western Europe',             shortName: 'W. EUROPE' },
  'eastern-europe':             { displayName: 'Eastern Europe',             shortName: 'E. EUROPE' },
  'middle-east':                { displayName: 'Middle East',                shortName: 'MID EAST' },
  'north-africa':               { displayName: 'North Africa',              shortName: 'N. AFRICA' },
  'sub-saharan-africa':         { displayName: 'Sub-Saharan Africa',        shortName: 'SS. AFRICA' },
  'south-central-asia':         { displayName: 'South & Central Asia',      shortName: 'S/C ASIA' },
  'east-southeast-asia':        { displayName: 'East & Southeast Asia',     shortName: 'E/SE ASIA' },
  'oceania':                    { displayName: 'Oceania',                    shortName: 'OCEANIA' },
}
```

#### Helpers

```typescript
/** Check whether a string is a valid GeoRegionKey. */
export function isValidGeoRegionKey(key: string): key is GeoRegionKey {
  return (GEO_REGION_KEYS as readonly string[]).includes(key)
}

/** Get the display name for a geo key at any level. */
export function getGeoDisplayName(level: GeoLevel, key: string): string {
  if (level === 'world') return 'World'
  if (level === 'region' && isValidGeoRegionKey(key)) {
    return GEO_REGION_META[key].displayName
  }
  // Country level: key is an ISO 3166-1 alpha-2 code (e.g., "TR").
  // Display name resolution is a downstream concern (WS-4.3 can use
  // a lightweight country name map or receive the name from the API).
  return key.toUpperCase()
}
```

### 4.2. Coverage Store State Additions (in `src/stores/coverage.store.ts`)

**Rationale for placement:** The geo summary panel state is transient view state that controls which geographic summary is displayed. It follows the same pattern as `selectedBundleId` (transient, no localStorage, no URL sync) and `priorityFeedExpanded` (panel open/closed). It is not animation state (which belongs in `ui.store.ts`) and it is not a user preference (which belongs in `settings.store.ts`). The CLAUDE.md documents `coverage.store.ts` as managing "data filtering & view modes" -- the geo summary panel is a data view mode.

#### State fields

Add to `CoverageState`:

```typescript
/** Whether the geographic summary slide-over panel is open. */
geoSummaryOpen: boolean

/**
 * Current geographic hierarchy level being viewed.
 * 'world' = global overview, 'region' = one of 11 AD-7 regions, 'country' = single country.
 */
summaryGeoLevel: GeoLevel

/**
 * Key identifying the current geographic scope.
 * - When summaryGeoLevel is 'world': always 'world'
 * - When summaryGeoLevel is 'region': a GeoRegionKey (e.g., 'middle-east')
 * - When summaryGeoLevel is 'country': an ISO 3166-1 alpha-2 code (e.g., 'TR')
 */
summaryGeoKey: string

/** Whether to display hourly delta summaries or the daily comprehensive brief. */
summaryType: SummaryType
```

Defaults:

```typescript
geoSummaryOpen: false,
summaryGeoLevel: 'world',
summaryGeoKey: 'world',
summaryType: 'daily',
```

#### Interface updates

Add the four fields to `CoverageState` and the three actions (Section 4.3) to `CoverageActions`. Update `CoverageStore` type alias (already `CoverageState & CoverageActions`, no change needed).

### 4.3. Store Actions

Add three actions to `CoverageActions`:

| Action | Signature | Behavior |
|--------|-----------|----------|
| `openGeoSummary` | `(level?: GeoLevel, key?: string) => void` | Open the panel. When called with explicit `level`/`key` arguments, navigates to that geographic scope and resets `summaryType` to `'daily'`. When called without arguments, resumes at the previously-viewed level/key/type (preserving the user's navigation context per D-2/D-4). Validates region keys against `GEO_REGION_KEYS`. If the morph phase is not `'idle'` (checked via `useUIStore.getState().morph.phase`), the action is a no-op -- the panel cannot open while a district morph is in progress. |
| `closeGeoSummary` | `() => void` | Close the panel. Resets `geoSummaryOpen` to `false`. Does NOT reset `summaryGeoLevel`, `summaryGeoKey`, or `summaryType` -- these are preserved so that reopening the panel returns to the user's last position in the hierarchy (same pattern as how `preFlyCamera` preserves camera position). |
| `drillDownGeo` | `(level: GeoLevel, key: string) => void` | Navigate within the open panel to a new geographic level and key. Only valid when `geoSummaryOpen` is `true` (no-op otherwise). Validates region keys against `GEO_REGION_KEYS` when `level` is `'region'`. Sets `summaryGeoLevel` and `summaryGeoKey`. Does not change `summaryType` (the user's hourly/daily toggle persists across drill-downs). |

Implementation details:

```typescript
openGeoSummary: (level?: GeoLevel, key?: string) =>
  set((state) => {
    // R10 mutual exclusion: do not open during morph
    const morphPhase = useUIStore.getState().morph.phase
    if (morphPhase !== 'idle') return

    // When called with explicit args, navigate to that level/key.
    // When called with no args, resume at the previously-viewed level/key (D-2/D-4).
    if (level !== undefined) {
      // Validate region keys
      if (level === 'region' && (!key || !isValidGeoRegionKey(key))) return

      state.summaryGeoLevel = level
      state.summaryGeoKey = level === 'world' ? 'world' : key!
      state.summaryType = 'daily'
    }

    state.geoSummaryOpen = true
  }),

closeGeoSummary: () =>
  set((state) => {
    state.geoSummaryOpen = false
    // Preserve level/key/type for reopen
  }),

drillDownGeo: (level, key) =>
  set((state) => {
    if (!state.geoSummaryOpen) return

    // Validate region keys
    if (level === 'region' && !isValidGeoRegionKey(key)) return

    state.summaryGeoLevel = level
    state.summaryGeoKey = level === 'world' ? 'world' : key
  }),
```

### 4.4. Store Selectors

Add to `coverageSelectors`:

```typescript
/** Whether the geographic summary panel is open. */
isGeoSummaryOpen: (state: CoverageStore): boolean => state.geoSummaryOpen,

/** The current geographic hierarchy level. */
summaryGeoLevel: (state: CoverageStore): GeoLevel => state.summaryGeoLevel,

/** The current geographic scope key. */
summaryGeoKey: (state: CoverageStore): string => state.summaryGeoKey,

/** The current summary type (hourly or daily). */
summaryType: (state: CoverageStore): SummaryType => state.summaryType,
```

### 4.5. Summary Type Toggle Action

Add one additional action for toggling between hourly and daily views within the open panel:

```typescript
/** Switch between hourly delta and daily comprehensive summary views. */
setSummaryType: (type: SummaryType) => void
```

Implementation:

```typescript
setSummaryType: (type) =>
  set((state) => {
    state.summaryType = type
  }),
```

This is a simple setter rather than a toggle because the panel UI will likely present two distinct buttons ("Hourly" / "Daily") where the caller knows the intended state. This matches the `setPriorityFeedExpanded(open: boolean)` pattern (D-3 from WS-2.6) and avoids race conditions inherent in toggle semantics.

### 4.6. Mutual Exclusion with District Overlay (R10)

This is the primary architectural concern of this workstream. The geo summary panel (z-42) and the district view overlay (z-30) are both slide-over surfaces that occupy the right side of the viewport. If both are open simultaneously, the geo panel visually sits on top of the district overlay, creating a confusing layered state.

**Rule:** The geo summary panel and the district view overlay are mutually exclusive. Only one can be open at a time.

#### Direction 1: Morph starts while geo panel is open

When `startMorph` is called in `ui.store.ts` (transitioning to district view), the geo summary panel must close. There are two implementation strategies:

**Strategy A -- Cross-store call in `startMorph` (rejected):**
Modify `startMorph` in `ui.store.ts` to import and call `useCoverageStore.getState().closeGeoSummary()`. This creates a cross-store dependency that violates the two-store boundary documented in the CLAUDE.md ("animation state and data filtering are deliberately separate stores"). The morph system should not know about or depend on the coverage store's internal shape.

**Strategy B -- Reactive close in the consuming component (selected):**
The `GeoSummaryPanel` component (WS-4.3) subscribes to the morph phase via `useUIStore(uiSelectors.morphPhase)`. When the phase transitions away from `'idle'`, the component calls `closeGeoSummary()`. This keeps the cross-store coordination at the component layer (where both stores are already consumed) rather than coupling the stores directly.

The integration contract for WS-4.3:

```typescript
// Inside GeoSummaryPanel component (WS-4.3 responsibility):
const morphPhase = useUIStore(uiSelectors.morphPhase)
const closeGeoSummary = useCoverageStore((s) => s.closeGeoSummary)

useEffect(() => {
  if (morphPhase !== 'idle') {
    closeGeoSummary()
  }
}, [morphPhase, closeGeoSummary])
```

This workstream documents this contract. WS-4.3 implements it.

#### Direction 2: Geo panel opens while morph is active

The `openGeoSummary` action checks `useUIStore.getState().morph.phase` and is a no-op when the phase is not `'idle'`. This is a read-only cross-store access (not a write), which is an acceptable pattern -- the coverage store reads morph phase as a guard condition, the same way `selectMapAlert` reads camera state from `useCameraStore` (line 181 of the current `coverage.store.ts`).

This cross-store read is already precedented in the codebase. On line 181, `selectMapAlert` calls `useCameraStore.getState()` to snapshot the camera position before flying. The `openGeoSummary` guard follows the same pattern: a synchronous `getState()` read of another store, used as a precondition check.

#### Direction 3: Geo panel opens while INSPECT alert panel is active

The INSPECT detail panel (`AlertDetailPanel`) uses `selectedMapAlertId` in the coverage store. The geo panel and INSPECT panel are at different z-levels (z-42 vs z-45 for triage rationale) and serve different purposes. They are NOT mutually exclusive -- an analyst may want to view the geographic threat picture alongside a specific alert's triage rationale. No mutual exclusion is needed for this combination.

#### Direction 4: Priority feed panel expands while geo panel is open

`priorityFeedExpanded` (from WS-2.6) controls a feed panel that drops down from the priority strip in world-space. The geo panel is a viewport-fixed slide-over. They do not spatially conflict. No mutual exclusion is needed.

### 4.7. No New Store Files

This workstream does not create any new store files. All additions extend the existing `coverage.store.ts` at its current path, plus type definitions in `src/lib/interfaces/coverage.ts`.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `useCoverageStore` exposes `geoSummaryOpen` field with default value `false` | Unit test: create store, assert initial `geoSummaryOpen === false` |
| AC-2 | `useCoverageStore` exposes `summaryGeoLevel` field with default value `'world'` | Unit test: assert initial value |
| AC-3 | `useCoverageStore` exposes `summaryGeoKey` field with default value `'world'` | Unit test: assert initial value |
| AC-4 | `useCoverageStore` exposes `summaryType` field with default value `'daily'` | Unit test: assert initial value |
| AC-5 | `openGeoSummary()` (no args) sets `geoSummaryOpen` to `true`, `summaryGeoLevel` to `'world'`, `summaryGeoKey` to `'world'`, `summaryType` to `'daily'` | Unit test: call action, assert state |
| AC-6 | `openGeoSummary('region', 'middle-east')` sets `summaryGeoLevel` to `'region'` and `summaryGeoKey` to `'middle-east'` | Unit test: call action, assert state |
| AC-7 | `openGeoSummary('region', 'invalid-key')` is a no-op -- `geoSummaryOpen` remains `false` | Unit test: call with invalid key, assert state unchanged |
| AC-8 | `openGeoSummary()` is a no-op when `ui.store` morph phase is not `'idle'` | Unit test: set morph phase to `'expanding'` via `useUIStore`, call `openGeoSummary()`, assert `geoSummaryOpen === false` |
| AC-9 | `closeGeoSummary()` sets `geoSummaryOpen` to `false` but preserves `summaryGeoLevel`, `summaryGeoKey`, and `summaryType` values | Unit test: open panel at a specific level/key, close it, assert level/key/type preserved |
| AC-10 | Reopening the panel after close returns to the previously-navigated level/key | Unit test: open at `('region', 'eastern-europe')`, close, reopen with no args -- assert level is still `'region'` and key is `'eastern-europe'` |
| AC-11 | `drillDownGeo('region', 'north-africa')` updates `summaryGeoLevel` and `summaryGeoKey` when the panel is open | Unit test: open panel, call drillDown, assert state |
| AC-12 | `drillDownGeo` is a no-op when `geoSummaryOpen` is `false` | Unit test: call drillDown without opening, assert level/key unchanged |
| AC-13 | `drillDownGeo('region', 'fake-region')` is a no-op -- key is not updated | Unit test: open panel, call with invalid key, assert key unchanged |
| AC-14 | `drillDownGeo('country', 'TR')` sets level to `'country'` and key to `'TR'` (no region validation for country-level keys) | Unit test: open panel, drill to country, assert state |
| AC-15 | `drillDownGeo` does not reset `summaryType` -- if the user was viewing `'hourly'`, it stays `'hourly'` after drill-down | Unit test: set summaryType to 'hourly', drill down, assert summaryType unchanged |
| AC-16 | `setSummaryType('hourly')` changes `summaryType` to `'hourly'` | Unit test: call action, assert state |
| AC-17 | `GeoLevel`, `GeoRegionKey`, and `SummaryType` types are exported and importable | TypeScript compilation: import types in a test file, `pnpm typecheck` passes |
| AC-18 | `GEO_REGION_KEYS` const array contains exactly 11 entries matching the AD-7 regions | Unit test: assert `GEO_REGION_KEYS.length === 11` and spot-check known keys |
| AC-19 | `GEO_REGION_META` provides `displayName` and `shortName` for all 11 regions | Unit test: iterate `GEO_REGION_KEYS`, assert each has a `GEO_REGION_META` entry with both fields |
| AC-20 | `isValidGeoRegionKey('middle-east')` returns `true`; `isValidGeoRegionKey('narnia')` returns `false` | Unit test |
| AC-21 | `getGeoDisplayName('world', 'world')` returns `'World'`; `getGeoDisplayName('region', 'middle-east')` returns `'Middle East'`; `getGeoDisplayName('country', 'TR')` returns `'TR'` | Unit test |
| AC-22 | Existing coverage store functionality is unaffected -- all existing fields, actions, selectors, and URL sync functions work identically | Existing tests pass; manual smoke test of category selection, view mode switching, map alert selection |
| AC-23 | `pnpm typecheck` passes with zero errors | CI verification |
| AC-24 | `pnpm lint` passes with zero new warnings | CI verification |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-1 | **All geo summary state in `coverage.store.ts`, not `ui.store.ts`** | The geo summary panel is a data view surface (like the bundle detail or priority feed panel), not an animation/navigation construct. The CLAUDE.md documents `coverage.store.ts` as handling "data filtering & view modes" and `ui.store.ts` as handling "animation & navigation state." The panel's open/close and drill-down state is analogous to `selectedBundleId` and `priorityFeedExpanded` -- transient view mode state. | (1) `ui.store.ts` -- rejected because the panel is not part of the morph animation system. It's a data display overlay. (2) New `geo.store.ts` -- rejected because four state fields and three actions do not justify a separate store. The coverage store already manages similar panel state. |
| D-2 | **`openGeoSummary` defaults to `('world', 'world')` but preserves prior state on reopen** | When the user clicks "THREAT PICTURE" (WS-4.5), the first open should show the World overview. But if the user had drilled into "Eastern Europe," closed the panel, and reopens it, they should return to Eastern Europe. The default parameters in `openGeoSummary` handle the first-open case. The preservation of `summaryGeoLevel`/`summaryGeoKey` on close (D-4) handles the reopen case. The caller (WS-4.5) decides: pass no args to resume, or pass explicit args to reset to World. | (1) Always reset to World on open -- rejected because it forces the user to re-navigate after every close, which is friction when toggling the panel while working. (2) Always resume -- rejected because the first-ever open should show World, not whatever stale state was left from a previous session (no persistence). The optional-args approach handles both cases. |
| D-3 | **Reactive mutual exclusion at the component layer (Strategy B), not cross-store calls (Strategy A)** | The two-store architecture is a deliberate boundary documented in the CLAUDE.md. Strategy A (cross-store write in `startMorph`) would make `ui.store.ts` depend on `coverage.store.ts`, coupling animation control to data view state. Strategy B (reactive `useEffect` in `GeoSummaryPanel`) keeps the stores independent and places the coordination where both stores are already consumed -- the React component tree. This is the same pattern used for other cross-concern coordination in React: components orchestrate, stores own their domain. | (1) Strategy A (cross-store call) -- rejected because it violates the store boundary and creates a write-direction dependency from ui.store to coverage.store. (2) Zustand `subscribe` middleware -- considered acceptable but adds invisible side-effect coupling between stores that is harder to trace than an explicit `useEffect` in a component. |
| D-4 | **`closeGeoSummary` preserves level/key/type** | Closing the panel is not the same as resetting the navigation state. The user's position in the geo hierarchy is their working context. Preserving it on close means reopening is a resume, not a restart. This matches the `preFlyCamera` pattern where camera position is preserved across operations. | (1) Reset all fields on close -- rejected because it destroys the user's navigation context. (2) Separate "reset" action -- over-engineered; if a caller wants to reset, they call `openGeoSummary('world', 'world')` explicitly. |
| D-5 | **`openGeoSummary` guards against non-idle morph phase via `useUIStore.getState()` read** | This is a read-only cross-store access for a guard condition, not a write. The pattern is already precedented in the codebase: `selectMapAlert` on line 181 reads `useCameraStore.getState()` to snapshot camera position. A synchronous `getState()` read is the lightest possible cross-store interaction and does not create a subscription or re-render dependency. | (1) No guard -- rejected because it allows the panel to open during a morph, creating the visual overlap that R10 identifies. (2) Pass morph phase as an argument -- rejected because it pushes the coordination burden to every caller of `openGeoSummary`, which is worse than a self-contained guard. |
| D-6 | **Region keys are kebab-case strings, not numeric IDs** | Kebab-case keys like `'middle-east'` are human-readable in logs, URL params (if ever synced), and API calls. They are self-documenting in code. Numeric IDs would require a lookup table for every reference. The API endpoint parameter `geo_key` is a string, so no conversion is needed. | (1) Numeric IDs (1-11) -- rejected because they're opaque and require a mapping layer. (2) Camel case (`middleEast`) -- would work but kebab-case is the standard for URL-safe identifiers and matches the API convention. |
| D-7 | **Country-level keys are ISO 3166-1 alpha-2 codes, validated by the API not the store** | The store accepts any string as a country key. Validating against a full ISO 3166-1 list in the client would require bundling 249 country codes. The API returns country keys in its drill-down responses; the store trusts API-provided values. Region keys are validated client-side because the 11-entry list is small and fixed. | (1) Validate country keys client-side -- rejected because of bundle size cost for the country code list. (2) No validation at any level -- rejected because region keys are a small fixed set that's cheap to validate, and catching invalid keys early prevents meaningless API calls. |
| D-8 | **`setSummaryType` is an explicit setter, not a toggle** | The panel will likely show "Hourly" and "Daily" as two distinct buttons or tabs. The caller knows the target state. This matches `setPriorityFeedExpanded(open: boolean)` (WS-2.6, D-3) and avoids race conditions inherent in toggle semantics. | (1) `toggleSummaryType()` -- rejected for the same reasons as `togglePriorityFeedExpanded` was rejected in WS-2.6: callers always know their intent, and explicit setters are safer. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-4.6.1 | Should `openGeoSummary` also close the `priorityFeedExpanded` panel to avoid visual competition? The priority feed strip is in world-space and the geo panel is viewport-fixed, so they operate in different spatial layers. Current decision: no mutual exclusion between them. Revisit if the visual overlap is problematic during WS-4.3 implementation. | react-developer | WS-4.3 implementation |
| OQ-4.6.2 | When the morph system triggers the reactive close (Direction 1 in Section 4.6), should the panel animate closed (300ms slide-out) or snap closed immediately? If it animates, the morph's `expanding` phase (400ms) overlaps with the panel exit. The component could delay `closeGeoSummary()` until after its exit animation completes using `onAnimationComplete` from `motion/react`. This is a WS-4.3 implementation detail, but the timing interaction should be validated. | react-developer | WS-4.3 implementation |
| OQ-4.6.3 | Should `drillDownGeo('world', 'world')` be the canonical way to navigate "up" in the hierarchy, or should there be a dedicated `drillUpGeo()` action that infers the parent level? A dedicated action would need to know the parent of a country (which region contains "TR"), which requires country-to-region mapping data. For now, the panel component can compute this and call `drillDownGeo` with the appropriate parent. | react-developer | WS-4.3 implementation |
| OQ-4.6.4 | The `openGeoSummary` action accepts optional `(level, key)` arguments. When called with no args after a previous close, it preserves the prior level/key (D-4). But when called with explicit args, it resets to those args. WS-4.5 needs to decide: should the "THREAT PICTURE" button always reset to World, or should it resume? Current recommendation: the button calls `openGeoSummary()` with no args (resume behavior). If a "reset to World" gesture is needed, it can call `openGeoSummary('world', 'world')` explicitly. | react-developer | WS-4.5 implementation |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | The `useUIStore.getState()` read in `openGeoSummary` creates a timing dependency -- if the morph phase changes between the guard check and the state update, the panel could open during a morph | Very Low | Low | Zustand state updates via Immer are synchronous within a single `set()` call. The `getState()` read and the subsequent `set()` happen in the same synchronous tick. React's batching does not interleave Zustand store updates. The race window is effectively zero. |
| R-2 | The reactive close in WS-4.3 (`useEffect` on morph phase change) fires asynchronously, meaning there is a brief render frame where both the geo panel and the district overlay are "open" in state | Low | Low | The geo panel's `AnimatePresence` exit animation handles the visual transition gracefully. The panel animates out while the morph expands in. The visual overlap is a z-index stack (z-42 above z-30), so the panel slides away on top -- visually clean. The state inconsistency lasts one render frame and is not user-perceptible. |
| R-3 | Adding 4 new state fields and 4 new actions to `coverage.store.ts` increases the store's surface area, potentially making it a "god object" | Medium | Low | The store is already 290 lines with 11 state fields and 8 actions. This workstream adds 4 fields and 4 actions (total: 15 fields, 12 actions). The store remains focused on its domain (data filtering and view modes). If the store grows further in future phases, consider extracting a `geo.store.ts` -- but do not pre-optimize. The current additions are cohesive with the store's documented purpose. |
| R-4 | The `GEO_REGION_KEYS` array may drift from the backend's region taxonomy if the backend changes its region definitions | Low | Medium | The 11-region taxonomy is an architecture decision (AD-7), not an API response shape. Changes to the region list require coordinated updates across frontend and backend. If the backend adds a region, the frontend update is adding one entry to `GEO_REGION_KEYS` and `GEO_REGION_META`. The const array makes the drift immediately visible as a TypeScript error if any consumer references a removed key. |
| R-5 | `openGeoSummary` resets `summaryType` to `'daily'` on every open, which could surprise users who prefer the hourly view | Low | Low | The reset-on-open behavior ensures a consistent starting point. The daily comprehensive is the more complete brief and the natural default for the "THREAT PICTURE" entry point. Hourly deltas are a secondary view within the panel. If user testing reveals a preference for resuming the prior type, change D-2 to also preserve `summaryType` on close -- a one-line change. |
