# WS-C.4: Map Interactions

> **Workstream ID:** WS-C.4
> **Phase:** C -- Map Tab + Bottom Sheet
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-C.1 (MobileBottomSheet component, snap points API, onClose callback), WS-C.3 (MobileMapView wrapper, MobileFilterChips component, floating ViewModeToggle + TimeRangeSelector integration, `mapRef` forwarding)
> **Blocks:** WS-D.2 (alert detail content renders inside the bottom sheet opened by this WS), WS-E.3 (cross-tab "Show on Map" reuses the fly-to + filter pattern established here)
> **Resolves:** OVERVIEW Section 4.2 marker tap flow, OVERVIEW Section 4.2 filter chip flow

---

> **Review Fixes Applied (Phase C Review):**
>
> - **H-1 (API mismatch):** All bottom sheet usage must conform to WS-C.1's authoritative API: use `config={SHEET_CONFIGS.alertDetail}` (not inline `snapPoints`), use `onDismiss` (not `onClose`), use `isOpen={!!selectedMapAlertId}` (not conditional rendering), and pass `ariaLabel="Alert detail"`.
> - **H-2 (snap format):** Use integer percentages `[70, 100]` or named config `SHEET_CONFIGS.alertDetail`. Never decimal fractions.
> - **M-3 (fly-to offset):** Add `padding: { bottom: window.innerHeight * 0.7 }` to `flyTo` call so marker centers in visible area above the sheet.

---

## 1. Objective

Wire the three interactive data flows on the mobile Map tab: marker tap to alert detail bottom sheet, filter chip toggle to category filtering, and view mode toggle to data mode switching. These flows connect existing shared components (`CoverageMap`, `MapMarkerLayer`, `ViewModeToggle`, `TimeRangeSelector`) and mobile-new components (`MobileFilterChips`, `MobileBottomSheet`) to the shared `coverage.store` Zustand store, creating the reactive data pipeline that keeps the map, filters, and detail sheet synchronized.

This workstream introduces no new visual components. It delivers handler functions, store wiring, a minimal alert detail stub (placeholder for WS-D.2), and the reactive rendering logic in `MobileView` that opens the bottom sheet when a marker is selected. The marker tap flow is the novel mobile-specific interaction; filter and view mode wiring reuse the same store actions and URL sync functions already used by the desktop view.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| Marker tap handler | `handleMobileMarkerTap(markerId)`: resolves marker ID to full `MapMarker` data from the display markers array, calls `coverage.store.selectMapAlert()`, and flies the MapLibre map to center on the selected marker. |
| Alert detail bottom sheet trigger | Reactive rendering: when `coverage.store.selectedMapAlertId` is non-null and the active tab is `map`, render `MobileBottomSheet` at the alert detail half-height snap point (70%) with stub content. |
| Alert detail sheet dismiss | `handleCloseMapAlert()`: calls `coverage.store.clearMapAlert()`, which clears `selectedMapAlertId`, `selectedMapAlertCategory`, and `selectedMapAlertBasic`. Sheet closes reactively. |
| `MobileAlertDetailStub` | Minimal placeholder component rendered inside the bottom sheet. Shows title, severity badge, category short code, and relative timestamp from `selectedMapAlertBasic`. Replaced by `MobileAlertDetail` in WS-D.2. |
| Filter chip toggle handler | `handleFilterChipToggle(categoryId)`: calls `coverage.store.toggleCategory()` then `syncCategoriesToUrl()` with the fresh state. Passed to `MobileFilterChips` as `onToggle` prop. |
| View mode change handler | `handleViewModeChange(mode)`: calls `coverage.store.setViewMode()` then `syncViewModeToUrl()`. Passed to floating `ViewModeToggle` as `onChange` prop. |
| Time range change handler | `handleTimePresetChange(preset)`: calls `coverage.store.setMapTimePreset()`. Passed to `TimeRangeSelector` as `onPresetChange` prop. Custom range handler similarly wired. |
| Map fly-to on marker selection | When a marker is tapped, fly the MapLibre map to center on the marker's coordinates using `mapRef.current.flyTo()`. Provides geographic context. |
| Selected marker highlight | Pass `selectedMapAlertId` from coverage.store to `CoverageMap` as `selectedMarkerId` prop. The existing `MapMarkerLayer` selection ring renders around the active marker. |
| Reactive marker filtering | Document the existing reactive data flow: `selectedCategories` change in store -> `mapFilters` memo recalculates in MobileView -> `useCoverageMapData(mapFilters)` re-fetches -> `displayMarkers` updates -> `CoverageMap` re-renders with filtered GeoJSON. |
| `MobileView` integration | Update `MobileView.tsx` to wire all handlers into the map tab rendering section. |
| Unit tests | Tests for marker tap handler, filter toggle, view mode change, sheet open/close reactivity, and stub rendering. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileBottomSheet` component implementation | WS-C.1 scope. This WS consumes it as a dependency. |
| `MobileFilterChips` component implementation | WS-C.3 scope. This WS wires the `onToggle` callback. |
| `MobileMapView` wrapper component | WS-C.3 scope. This WS wires handlers into it via props. |
| `MobileAlertDetail` full content | WS-D.2 scope. This WS delivers a stub placeholder. |
| MapPopup suppression on mobile | `CoverageMap` is a shared component (zero modification). The popup renders internally on marker click. Accepted behavior: popup appears briefly behind the bottom sheet. See DM-1. |
| Cross-tab "Show on Map" navigation | WS-E.3 scope. This WS establishes the filter + fly-to pattern that WS-E.3 reuses. |
| Landscape layout adjustments | WS-F.1 scope. |
| GPS center-on-me button | WS-C.3 scope. |
| Desktop rendering changes | All wiring is within `MobileView.tsx`. Desktop is unaffected. |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/stores/coverage.store.ts` | `selectMapAlert(id, category, basic)`, `clearMapAlert()`, `selectedMapAlertId`, `selectedMapAlertCategory`, `selectedMapAlertBasic`, `toggleCategory(id)`, `setViewMode(mode)`, `setMapTimePreset(preset)`, `setCustomTimeRange(start, end)`, `selectedCategories`, `viewMode`, `mapTimePreset`, `customTimeStart`, `customTimeEnd` | Exists |
| `src/stores/coverage.store.ts` | `syncCategoriesToUrl()`, `syncViewModeToUrl()`, `timePresetToStartDate()` | Exists |
| `src/lib/coverage-utils.ts` | `MapMarker` type (id, lat, lng, title, severity, category, sourceId, ingestedAt, operationalPriority) | Exists |
| `src/components/coverage/CoverageMap.tsx` | `CoverageMap` shared component with props: `onMarkerClick`, `onInspect`, `selectedMarkerId`, `markers`, `isLoading`, `overview`, `categoryId`, `categoryName`, `externalMapRef` | Exists |
| `src/components/coverage/MapMarkerLayer.tsx` | `MapMarkerLayer` with `selectedMarkerId` prop for selection ring highlight | Exists |
| `src/hooks/use-coverage-map-data.ts` | `useCoverageMapData(filters?)` returning `MapMarker[]` with polling | Exists |
| `src/hooks/use-intel-bundles.ts` | `useIntelBundles(viewMode)` returning bundle data for triaged/all-bundles modes | Exists |
| `src/lib/interfaces/coverage.ts` | `KNOWN_CATEGORIES`, `getCategoryMeta()`, `getCategoryColor()`, `SEVERITY_COLORS` | Exists |
| `src/lib/interfaces/intel-bundles.ts` | `ViewMode` type (`'triaged' \| 'all-bundles' \| 'raw'`) | Exists |
| `src/components/coverage/map-utils.ts` | `formatRelativeTime()`, `SEVERITY_MAP_COLORS` | Exists |
| WS-C.1 | `MobileBottomSheet` component with props: `snapPoints: number[]`, `initialSnap: number`, `onClose: () => void`, `children: ReactNode`. Supports half-height and full-height snap points. | Pending |
| WS-C.3 | `MobileMapView` component wrapping `CoverageMap` with `next/dynamic` lazy loading. Accepts `onMarkerClick`, `onInspect`, `selectedMarkerId`, `markers`, `isLoading`, `mapRef`. Renders full-bleed within the map tab content area. | Pending |
| WS-C.3 | `MobileFilterChips` component with prop: `onToggle: (categoryId: string) => void`, `selectedCategories: string[]`, `categories: Array<{ id, shortName, color }>`. Renders horizontal scrollable chip strip. | Pending |
| WS-A.1 | `MobileView.tsx` orchestrator with tab state, data hooks, and content slot rendering | Pending |
| WS-A.3 | Mobile design tokens: `--glass-sheet-bg`, `--glass-sheet-blur`, `--text-body`, `--text-label`, `--text-caption`, `--text-ghost`, severity tokens | Pending |
| `react-map-gl/maplibre` | `MapRef` type for `externalMapRef` forwarding | Exists (dependency) |

---

## 4. Deliverables

### D-1: Marker tap handler (`handleMobileMarkerTap`)

Handler function defined in `MobileView.tsx` (or in an extracted `useMobileMapHandlers` hook if MobileView grows unwieldy). Wires `CoverageMap.onMarkerClick` to the bottom sheet opening flow.

**Data flow:**

```
User taps marker on MapLibre map
  -> CoverageMap.handleClick (internal)
       -> sets internal popup state (shows MapPopup -- accepted on mobile, see DM-1)
       -> calls onMarkerClick(markerId)
  -> MobileView.handleMobileMarkerTap(markerId)
       -> finds marker in displayMarkers array by ID
       -> if not found, returns early (guard)
       -> calls coverage.store.selectMapAlert(id, category, { title, severity, ingestedAt })
       -> calls mapRef.current.flyTo() to center on marker coordinates
  -> React re-render: selectedMapAlertId is non-null
       -> MobileBottomSheet renders at half-height snap with MobileAlertDetailStub
       -> MapMarkerLayer receives selectedMarkerId -> renders selection ring
```

**Implementation:**

```typescript
/**
 * Handle marker tap on the mobile map.
 *
 * Resolves the marker ID to full marker data from the display array,
 * writes selection state to coverage.store (which drives the bottom
 * sheet and selection ring), and flies the map to center on the marker.
 *
 * The MapPopup will appear internally in CoverageMap (shared component,
 * zero modification). This is accepted -- the bottom sheet slides over
 * the lower portion of the screen while the popup provides a brief
 * contextual preview near the marker location.
 */
const handleMobileMarkerTap = useCallback(
  (markerId: string) => {
    // Resolve marker ID to full data from the current display array
    const marker = displayMarkers.find((m) => m.id === markerId)
    if (!marker) return

    // Write to coverage.store -- drives sheet open + selection ring
    selectMapAlert(markerId, marker.category, {
      title: marker.title,
      severity: marker.severity,
      ingestedAt: marker.ingestedAt,
    })

    // Fly map to center on the tapped marker
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [marker.lng, marker.lat],
        zoom: Math.max(mapRef.current.getZoom(), 6),
        duration: 500,
      })
    }
  },
  [displayMarkers, selectMapAlert],
)
```

**Guard clauses:**
- `displayMarkers.find()` returns `undefined` if the marker was removed between the tap and the handler execution (e.g., a background data refresh removed it). The handler returns silently.
- `mapRef.current` null check prevents errors when the map has not finished loading.
- `Math.max(currentZoom, 6)` ensures the fly-to zooms in to at least level 6 for geographic context, but does not zoom out if the user is already closer.

**Store interaction:** `selectMapAlert(id, category, basic)` internally reads `useCameraStore.getState()` to save `preFlyCamera`. On mobile, the camera store contains default values (no spatial viewport). The stored camera position is unused on mobile -- the mobile equivalent is simply dismissing the sheet (no return flight needed). This is acceptable and requires no store modification.

---

### D-2: Alert detail sheet dismiss handler (`handleCloseMapAlert`)

Handler function that clears the map alert selection, causing the bottom sheet to close reactively.

```typescript
/**
 * Close the alert detail bottom sheet opened from a marker tap.
 * Clears the store selection state; the sheet unmounts reactively.
 */
const handleCloseMapAlert = useCallback(() => {
  clearMapAlert()
}, [clearMapAlert])
```

Where `clearMapAlert` is `useCoverageStore((s) => s.clearMapAlert)`.

**Reactive close:** The bottom sheet's visibility is driven by `selectedMapAlertId !== null`. When `clearMapAlert()` sets `selectedMapAlertId` to null, the conditional rendering in MobileView unmounts the `MobileBottomSheet`. The sheet's exit animation (spring or fade, defined in WS-C.1) handles the visual transition.

---

### D-3: `MobileAlertDetailStub` component (`src/components/mobile/MobileAlertDetailStub.tsx`)

Minimal placeholder component rendered inside the bottom sheet when a map marker is tapped. Displays the basic alert information available from the marker data (stored in `coverage.store.selectedMapAlertBasic`). This stub is replaced by `MobileAlertDetail` in WS-D.2.

```typescript
/**
 * Stub alert detail content for the map marker bottom sheet.
 *
 * Renders basic marker data (title, severity, category, timestamp)
 * as a placeholder until WS-D.2 delivers the full MobileAlertDetail
 * component with complete intel data, metadata rows, and actions.
 *
 * @module MobileAlertDetailStub
 * @see WS-C.4
 * @see WS-D.2 (replacement)
 */

'use client'

import { useCoverageStore } from '@/stores/coverage.store'
import {
  getCategoryMeta,
  SEVERITY_COLORS,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'
import { formatRelativeTime } from '@/components/coverage/map-utils'

export function MobileAlertDetailStub() {
  const alertId = useCoverageStore((s) => s.selectedMapAlertId)
  const category = useCoverageStore((s) => s.selectedMapAlertCategory)
  const basic = useCoverageStore((s) => s.selectedMapAlertBasic)

  if (!alertId || !basic) return null

  const categoryMeta = category ? getCategoryMeta(category) : null
  const severityColor =
    SEVERITY_COLORS[basic.severity as SeverityLevel] ?? 'rgba(107, 114, 128, 0.8)'

  return (
    <div
      style={{
        padding: 'var(--space-card-padding, 14px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Severity badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: severityColor,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 'var(--text-caption, 10px)',
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: severityColor,
          }}
        >
          {basic.severity}
        </span>
        {categoryMeta && (
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 'var(--text-caption, 10px)',
              fontWeight: 500,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'rgba(255, 255, 255, 0.30)',
            }}
          >
            {categoryMeta.shortName}
          </span>
        )}
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-body, 13px)',
          lineHeight: 1.5,
          color: 'rgba(255, 255, 255, 0.55)',
        }}
      >
        {basic.title}
      </div>

      {/* Timestamp */}
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-caption, 10px)',
          color: 'rgba(255, 255, 255, 0.25)',
          letterSpacing: '0.04em',
        }}
      >
        {formatRelativeTime(basic.ingestedAt)}
      </div>

      {/* Stub indicator */}
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 'var(--text-ghost, 10px)',
          color: 'rgba(255, 255, 255, 0.12)',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
          paddingTop: 16,
        }}
      >
        FULL DETAIL LOADING...
      </div>
    </div>
  )
}
```

**Lifecycle:** This component is mounted inside the `MobileBottomSheet` when `selectedMapAlertId` is non-null. It reads directly from `coverage.store` to get its data. WS-D.2 will replace it with `MobileAlertDetail`, which fetches the full intel record via `useCategoryIntel` and renders the complete detail view (summary, metadata rows, confidence bar, geographic scope, timestamps, action buttons).

---

### D-4: Filter chip toggle handler (`handleFilterChipToggle`)

Handler function that connects `MobileFilterChips.onToggle` to the coverage store and URL sync.

```typescript
/**
 * Toggle a category filter from the mobile filter chip strip.
 * Updates the coverage store and syncs the selection to URL params.
 */
const handleFilterChipToggle = useCallback(
  (categoryId: string) => {
    toggleCategory(categoryId)
    // Read fresh state after the synchronous Zustand update
    const next = useCoverageStore.getState().selectedCategories
    syncCategoriesToUrl(next)
  },
  [toggleCategory],
)
```

Where `toggleCategory` is `useCoverageStore((s) => s.toggleCategory)`.

**Reactive data flow (already implemented by shared data hooks):**

```
handleFilterChipToggle(categoryId)
  -> coverage.store.toggleCategory(categoryId)
       -> selectedCategories updated (add or remove)
  -> syncCategoriesToUrl(next)
       -> URL ?category= params updated via replaceState
  -> MobileView re-renders (useStore subscription)
       -> mapFilters memo recalculates:
            { categories: selectedCategories } or undefined
       -> useCoverageMapData(mapFilters) query key changes
            -> TanStack Query refetches with new filter params
       -> displayMarkers updates with filtered results
       -> CoverageMap re-renders with new GeoJSON
       -> MobileFilterChips re-renders with updated selectedCategories
```

**Clear all filters:** The `MobileFilterChips` component (WS-C.3) includes an "All" chip that clears category selection. This calls a separate handler:

```typescript
const handleClearFilters = useCallback(() => {
  clearSelection()
  syncCategoriesToUrl([])
}, [clearSelection])
```

Where `clearSelection` is `useCoverageStore((s) => s.clearSelection)`.

---

### D-5: View mode and time range handlers

Handler functions that connect the floating `ViewModeToggle` and `TimeRangeSelector` to the coverage store and URL sync.

**View mode:**

```typescript
/**
 * Change the data view mode (triaged / all-bundles / raw).
 * Updates store and URL, which triggers a data refetch via
 * useIntelBundles or useCoverageMapData.
 */
const handleViewModeChange = useCallback(
  (mode: ViewMode) => {
    setViewMode(mode)
    syncViewModeToUrl(mode)
  },
  [setViewMode],
)
```

**Time range preset:**

```typescript
/**
 * Change the map time range filter preset.
 * Updates store, which recalculates mapFilters and triggers
 * a useCoverageMapData refetch.
 */
const handleTimePresetChange = useCallback(
  (preset: TimePreset) => {
    setMapTimePreset(preset)
  },
  [setMapTimePreset],
)
```

**Custom time range:**

```typescript
/**
 * Set a custom time range (start/end dates).
 * Switches the store to 'custom' mode.
 */
const handleCustomTimeChange = useCallback(
  (start: string | null, end: string | null) => {
    setCustomTimeRange(start, end)
  },
  [setCustomTimeRange],
)
```

**Display markers computation:** The view mode affects which markers display on the map. This logic is identical to the desktop implementation in `page.tsx`:

```typescript
const displayMarkers: MapMarker[] = useMemo(() => {
  if (viewMode === 'raw') return mapMarkers

  // Bundle modes: convert bundle representative_coordinates to MapMarker[]
  const bundleMarkers: MapMarker[] = []
  for (const b of bundles) {
    const coords = b.bundle.representative_coordinates
    if (!coords || coords.lat == null || coords.lon == null) continue
    bundleMarkers.push({
      id: b.bundle.id,
      lat: coords.lat,
      lng: coords.lon,
      title: b.bundle.title ?? `${b.bundle.final_severity} Bundle`,
      severity: b.bundle.final_severity,
      category: b.bundle.categories?.[0] ?? 'bundle',
      sourceId: '',
      ingestedAt: b.bundle.created_at,
      operationalPriority: b.operationalPriority,
    })
  }
  return bundleMarkers
}, [viewMode, mapMarkers, bundles])
```

This memo is already present in `page.tsx` (lines 224-245) and will be extracted to `MobileView.tsx` during WS-A.1 code splitting, or defined directly in MobileView. This WS ensures the mobile view includes this computation.

---

### D-6: MobileView map tab integration

The complete wiring of all handlers into the map tab section of `MobileView.tsx`. Shows how the components compose.

**Store reads (at MobileView level):**

```typescript
// Coverage store reads for map tab
const selectedCategories = useCoverageStore((s) => s.selectedCategories)
const toggleCategory = useCoverageStore((s) => s.toggleCategory)
const clearSelection = useCoverageStore((s) => s.clearSelection)
const viewMode = useCoverageStore((s) => s.viewMode)
const setViewMode = useCoverageStore((s) => s.setViewMode)
const mapTimePreset = useCoverageStore((s) => s.mapTimePreset)
const setMapTimePreset = useCoverageStore((s) => s.setMapTimePreset)
const customTimeStart = useCoverageStore((s) => s.customTimeStart)
const customTimeEnd = useCoverageStore((s) => s.customTimeEnd)
const setCustomTimeRange = useCoverageStore((s) => s.setCustomTimeRange)
const selectedMapAlertId = useCoverageStore((s) => s.selectedMapAlertId)
const selectMapAlert = useCoverageStore((s) => s.selectMapAlert)
const clearMapAlert = useCoverageStore((s) => s.clearMapAlert)
```

**Data hooks:**

```typescript
// Compute filter parameters for the map data query
const mapFilters = useMemo(() => {
  const f: { categories?: string[]; startDate?: string; endDate?: string } = {}
  if (selectedCategories.length > 0) f.categories = selectedCategories
  if (mapTimePreset === 'custom') {
    if (customTimeStart) f.startDate = customTimeStart
    if (customTimeEnd) f.endDate = customTimeEnd
  } else if (mapTimePreset !== 'all') {
    f.startDate = timePresetToStartDate(mapTimePreset)
  }
  return Object.keys(f).length > 0 ? f : undefined
}, [selectedCategories, mapTimePreset, customTimeStart, customTimeEnd])

const { data: mapMarkers = [], isLoading: isMapLoading } =
  useCoverageMapData(mapFilters)
const { data: bundles = [], isLoading: isBundlesLoading } =
  useIntelBundles(viewMode)
```

**Map ref for fly-to:**

```typescript
const mapRef = useRef<MapRef>(null)
```

**Map tab rendering (within MobileShell content area):**

```tsx
{/* Map tab content */}
{activeTab === 'map' && (
  <>
    {/* Filter chips at top of map */}
    <MobileFilterChips
      categories={KNOWN_CATEGORIES.map((c) => ({
        id: c.id,
        shortName: c.shortName,
        color: getCategoryColor(c.id),
      }))}
      selectedCategories={selectedCategories}
      onToggle={handleFilterChipToggle}
      onClearAll={handleClearFilters}
    />

    {/* Full-bleed map */}
    <MobileMapView
      markers={displayMarkers}
      isLoading={isDisplayLoading}
      selectedMarkerId={selectedMapAlertId}
      onMarkerClick={handleMobileMarkerTap}
      mapRef={mapRef}
    />

    {/* Floating controls (positioned by MobileMapView or absolutely here) */}
    <ViewModeToggle
      value={viewMode}
      onChange={handleViewModeChange}
      counts={viewModeCounts}
    />
    <TimeRangeSelector
      value={mapTimePreset}
      customStart={customTimeStart}
      customEnd={customTimeEnd}
      onPresetChange={handleTimePresetChange}
      onCustomChange={handleCustomTimeChange}
    />

    {/* Alert detail bottom sheet -- opens when a marker is selected */}
    {selectedMapAlertId && (
      <MobileBottomSheet
        snapPoints={[0.7, 1.0]}
        initialSnap={0}
        onClose={handleCloseMapAlert}
        ariaLabel="Alert detail"
      >
        <MobileAlertDetailStub />
      </MobileBottomSheet>
    )}
  </>
)}
```

**Notes on component composition:**
- `MobileMapView` (WS-C.3) wraps `CoverageMap` with `next/dynamic` and handles the full-bleed layout sizing (`height: calc(100vh - header - chips - controls - nav - safe-area)`). It forwards `onMarkerClick`, `selectedMarkerId`, and `mapRef` to the inner `CoverageMap`.
- `ViewModeToggle` and `TimeRangeSelector` are shared components. Their positioning (floating, bottom of map area) is handled by WS-C.3's layout. This WS provides only the handler props.
- The `MobileBottomSheet` renders via a portal (per WS-C.1) so it overlays the map correctly.
- The `selectedMapAlertId` conditional rendering means the sheet mounts/unmounts reactively. WS-C.1's `MobileBottomSheet` handles the enter/exit spring animation.

---

### D-7: Unit tests

**`src/components/mobile/__tests__/MobileAlertDetailStub.test.tsx`:**

| Test | Description |
|------|-------------|
| `renders nothing when selectedMapAlertId is null` | Set store `selectedMapAlertId: null`. Render `MobileAlertDetailStub`. Assert: nothing in the DOM (returns null). |
| `renders basic alert info when store has selection` | Set store `selectedMapAlertId: 'abc'`, `selectedMapAlertCategory: 'seismic'`, `selectedMapAlertBasic: { title: '7.2 Earthquake', severity: 'Extreme', ingestedAt: '2026-03-06T12:00:00Z' }`. Assert: title text "7.2 Earthquake" visible, severity text "EXTREME" visible, category short code "SEIS" visible. |
| `renders severity dot with correct color` | Set store with severity: 'Severe'. Assert: dot element has `backgroundColor: 'rgba(249, 115, 22, 0.8)'` (orange, from SEVERITY_COLORS). |
| `renders relative timestamp` | Set store with `ingestedAt` 5 minutes ago. Assert: text matches `formatRelativeTime` output (e.g., "5m ago"). |

**`src/views/__tests__/MobileView.map-interactions.test.tsx`:**

| Test | Description |
|------|-------------|
| `handleMobileMarkerTap writes selection to coverage store` | Render MobileView in test harness. Mock `displayMarkers` with a known marker. Call the handler with the marker's ID. Assert: `useCoverageStore.getState().selectedMapAlertId` equals the marker ID, `selectedMapAlertCategory` equals the marker's category, `selectedMapAlertBasic` has the marker's title/severity/ingestedAt. |
| `handleMobileMarkerTap no-ops when marker not found` | Call handler with an unknown ID. Assert: store state unchanged (`selectedMapAlertId` remains null). |
| `handleFilterChipToggle adds category to store and syncs URL` | Call handler with `'seismic'`. Assert: `useCoverageStore.getState().selectedCategories` includes `'seismic'`. Assert: `window.location.search` contains `category=seismic`. |
| `handleFilterChipToggle removes category on second call` | Toggle 'seismic' twice. Assert: `selectedCategories` is empty after second call. Assert: URL has no `category=` param. |
| `handleClearFilters empties selection and syncs URL` | Toggle two categories, then call clear handler. Assert: `selectedCategories` is empty. Assert: URL has no `category=` params. |
| `handleViewModeChange updates store and syncs URL` | Call with `'raw'`. Assert: `useCoverageStore.getState().viewMode` equals `'raw'`. Assert: URL contains `view=raw`. |
| `handleViewModeChange omits URL param for default mode` | Call with `'triaged'` (default). Assert: URL does NOT contain `view=`. |
| `bottom sheet renders when selectedMapAlertId is set` | Set store `selectedMapAlertId` to a non-null value. Render map tab. Assert: `MobileBottomSheet` is in the DOM with `MobileAlertDetailStub` inside it. |
| `bottom sheet unmounts when clearMapAlert is called` | Set a marker selection, then call `clearMapAlert()`. Assert: `MobileBottomSheet` is removed from the DOM. |
| `map fly-to is called on marker tap` | Mock `mapRef.current.flyTo`. Call marker tap handler. Assert: `flyTo` was called with `center: [marker.lng, marker.lat]` and `duration: 500`. |

**Test setup notes:**
- Use `@testing-library/react` with a Zustand test wrapper that provides fresh store state per test. Reset store between tests via `useCoverageStore.setState({ selectedMapAlertId: null, selectedCategories: [], viewMode: 'triaged', ... })`.
- Mock `window.history.replaceState` to capture URL sync calls.
- Mock `mapRef.current` with a minimal object: `{ flyTo: vi.fn(), getZoom: () => 4 }`.
- Mock `MobileBottomSheet` and `MobileMapView` as simple `div` pass-throughs (their implementations are tested in WS-C.1 and WS-C.3 respectively).

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Tapping an unclustered marker on the mobile map opens the alert detail bottom sheet at the half-height snap point (70% viewport height). The map remains visible above the sheet. | On a 375x812 viewport: tap a marker. Verify bottom sheet slides up to ~70%. Verify map tiles and markers are visible in the top ~30%. |
| AC-2 | The bottom sheet displays the tapped marker's title, severity badge (color-coded), category short code, and relative timestamp. | Tap a marker with known data. Cross-reference displayed text against the marker's properties in the `displayMarkers` array. |
| AC-3 | Tapping a cluster circle on the mobile map zooms into the cluster (same behavior as desktop). No bottom sheet opens. | Tap a cluster. Verify map zooms to expand the cluster. Verify no bottom sheet appears. |
| AC-4 | The tapped marker receives a selection ring highlight (existing `MapMarkerLayer` selection ring). The ring appears immediately on tap. | Tap a marker. Verify a colored ring appears around the tapped dot. Ring color matches the marker's severity. |
| AC-5 | The map flies to center on the tapped marker's coordinates after tap. Fly-to duration is 500ms. Zoom level is at least 6. | Tap a marker that is near the edge of the visible map. Verify the map pans/zooms to center on the marker within ~500ms. |
| AC-6 | Dismissing the bottom sheet (drag down past threshold, or tap backdrop) clears the selection. The selection ring disappears. `selectedMapAlertId` in coverage.store returns to null. | Open a sheet via marker tap. Dismiss it. Verify: no selection ring on map, store shows `selectedMapAlertId: null`. |
| AC-7 | Tapping a category filter chip toggles that category in `coverage.store.selectedCategories`. The chip visual state updates (active/inactive). | Tap the "SEIS" chip. Verify chip shows active state. Verify `useCoverageStore.getState().selectedCategories` contains `'seismic'`. Tap again. Verify chip deactivates and store array no longer contains `'seismic'`. |
| AC-8 | Toggling a filter chip causes the map markers to update reactively. Only markers matching the selected categories remain visible. | With no filters: count visible markers. Tap "SEIS" chip. Verify only seismic markers remain. Tap "SEIS" again (deselect). Verify all markers return. |
| AC-9 | The URL updates reactively when filter chips are toggled. Multiple selected categories produce multiple `?category=` params. | Tap "SEIS" then "CON". Verify URL contains `?category=seismic&category=conflict`. Deselect both. Verify URL has no `category=` params. |
| AC-10 | Tapping the "All" chip in MobileFilterChips clears all category filters. All markers reappear. URL `category=` params are removed. | Select 3 categories. Tap "All". Verify all markers visible, store `selectedCategories` is empty, URL has no `category=` params. |
| AC-11 | Changing the view mode via ViewModeToggle updates `coverage.store.viewMode` and the URL. Map markers switch between raw, triaged bundles, and all bundles. | Switch to "Raw". Verify store `viewMode: 'raw'`, URL contains `view=raw`, markers reflect raw alert data. Switch to "Triaged". Verify store, URL (no `view=` param for default), markers reflect bundles. |
| AC-12 | Changing the time range preset via TimeRangeSelector updates `coverage.store.mapTimePreset`. Map markers update to reflect the time window. | Select "1h". Verify `mapTimePreset: '1h'` in store. Verify markers only include alerts from the last hour (compare count with "All" preset). |
| AC-13 | `MobileAlertDetailStub` renders nothing (returns null) when `selectedMapAlertId` is null. No empty sheet or error. | With no marker selected: verify no stub content in the DOM. |
| AC-14 | All unit tests (D-7) pass. | Run `pnpm test:unit`. All tests in `MobileAlertDetailStub.test.tsx` and `MobileView.map-interactions.test.tsx` pass. |
| AC-15 | `pnpm typecheck` passes with zero errors after all deliverables are complete. | Run `pnpm typecheck`. |
| AC-16 | Desktop view is completely unaffected. No modifications to `CoverageMap.tsx`, `MapMarkerLayer.tsx`, `MapPopup.tsx`, `coverage.store.ts`, or `map-utils.ts`. | Diff check: only files in `src/components/mobile/` and `src/views/MobileView.tsx` are modified/created. |

---

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| DM-1 | Accept the MapPopup appearing briefly on mobile marker tap rather than suppressing it. | `CoverageMap` is a shared component with zero-modification constraint (OVERVIEW Section 3.2). The popup is internal state set in `handleClick` before `onMarkerClick` fires. Suppressing it would require either (a) modifying `CoverageMap` to accept a `suppressPopup` prop, or (b) forking the component for mobile. The popup appears at the marker location in the upper portion of the screen while the bottom sheet slides up from below -- they do not visually conflict. The popup provides useful contextual information (title + severity + time) near the geographic location. If the popup is undesirable, WS-C.3 can pass an `onInspect` callback that immediately closes the popup by triggering the same code path as the INSPECT button (which calls `onClose` internally). | (a) Add `suppressPopup` prop to CoverageMap. Rejected: violates zero-modification constraint. (b) Fork CoverageMap for mobile. Rejected: creates maintenance burden, 536 lines of duplicate code. (c) Intercept and close popup via MapLibre API. Rejected: the popup is managed by react-map-gl's `<Popup>` component, not directly accessible from outside CoverageMap. |
| DM-2 | Use `coverage.store.selectMapAlert()` on mobile (same as desktop) rather than introducing a mobile-specific store action. | The store action sets `selectedMapAlertId`, `selectedMapAlertCategory`, and `selectedMapAlertBasic`, which is exactly the data the mobile bottom sheet needs. It also sets `preFlyCamera` by reading `useCameraStore`, which stores default values on mobile (camera store is desktop-only). These default values are harmless -- mobile never reads `preFlyCamera`. Using the same action avoids duplicating state management logic and keeps the store API surface small. | (a) New `selectMobileMapAlert` action without camera save. Rejected: adds store surface area for negligible benefit. The camera store read is a no-op on mobile. (b) Local `useState` in MobileView for selected alert. Rejected: the `selectedMapAlertId` is needed by MapMarkerLayer for the selection ring (passed via CoverageMap's `selectedMarkerId` prop), requiring it to be in shared state anyway. |
| DM-3 | Fly the MapLibre map to center on the tapped marker, rather than leaving the map viewport unchanged. | Centering on the marker provides geographic context: the user sees the marker's location relative to surrounding features. The 500ms duration is short enough to feel responsive. The minimum zoom of 6 ensures the location is identifiable without zooming past the user's current view if they are already close. This matches the UX strategy ("tap to investigate" flow from `ux-strategy.md` Section 4.1). | (a) No fly-to -- leave map as-is. Rejected: if the tapped marker is near the edge of the viewport, it may be partially obscured by the bottom sheet (which covers the bottom ~70%). Centering ensures visibility. (b) Fly-to with offset to account for bottom sheet. Rejected: adds complexity (calculating the visible map portion above the sheet). The half-height sheet leaves sufficient map area for the centered marker. |
| DM-4 | The marker tap handler uses `displayMarkers.find()` to resolve the marker ID, rather than reading from the GeoJSON source or MapLibre feature properties. | `displayMarkers` is the authoritative data array already computed in MobileView (merging raw markers and bundle markers based on view mode). It contains all fields needed for the store action (`title`, `severity`, `category`, `ingestedAt`). Reading from MapLibre feature properties would require parsing stringified properties and handling cluster features. The `find()` operation on the markers array is O(n) but the array is typically <500 items (bounded by API response limits), making it negligibly fast. | (a) Read from MapLibre feature properties in the click event. Rejected: the `MapLayerMouseEvent` feature properties are the GeoJSON properties (which include `id`, `title`, `severity`, `category`, `ingestedAt`), but they are passed as `onMarkerClick(markerId)` without the full feature. `CoverageMap` only exposes the ID through `onMarkerClick`. We would need to modify CoverageMap to pass the full feature, violating the zero-modification constraint. (b) Build a `Map<string, MapMarker>` lookup for O(1) access. Acceptable optimization if marker counts grow, but unnecessary at current scale. |
| DM-5 | `MobileAlertDetailStub` is a separate component file rather than an inline anonymous function in MobileView. | Even though it is a temporary stub replaced by WS-D.2, giving it a file makes it (a) independently testable, (b) visible in code review as a distinct deliverable, and (c) easy for WS-D.2 to locate and replace. The file is ~80 lines -- small enough that its lifecycle cost is minimal. | (a) Inline JSX in MobileView's bottom sheet children. Rejected: harder to test in isolation, and the stub logic (reading from store, looking up category meta, formatting time) is non-trivial enough to warrant its own component. (b) Skip the stub entirely and render an empty sheet. Rejected: an empty sheet provides no feedback to the tester that the marker tap flow is working. The stub confirms the data pipeline (tap -> store -> render) is functional. |
| DM-6 | Filter chip, view mode, and time range handlers are defined as `useCallback` functions in MobileView rather than extracted into a custom hook. | The handlers are thin wrappers around store actions + URL sync, totaling ~15 lines each. Extracting them into a custom hook would add indirection without reducing complexity. If MobileView grows past ~400 lines (which may happen as more tabs are wired), a `useMobileMapHandlers()` extraction can be done as a refactor. This decision is revisitable. | (a) `useMobileMapHandlers()` hook. Acceptable but premature: the handlers have no shared state or lifecycle behavior that would benefit from hook encapsulation. (b) Define handlers outside the component as plain functions. Rejected: they close over `displayMarkers` and store actions from the component scope. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should tapping a marker on mobile also pass `onInspect` to CoverageMap, providing a two-path flow (direct sheet via `onMarkerClick` + fallback via popup INSPECT button)? Currently this WS uses `onMarkerClick` only. If `onInspect` is also wired, the user could tap a marker, see the popup, then tap INSPECT for the same result. This is harmless but adds a second entry point. Confirm single-path (onMarkerClick only) is preferred. | planning-coordinator | Phase C review gate |
| OQ-2 | When the bottom sheet is open and the user taps a DIFFERENT marker on the visible portion of the map, should the sheet content update to show the new marker's data (swap in place), or should the sheet close and reopen? The current implementation swaps in place because `selectMapAlert` overwrites the store state, causing the stub to re-render with new data. Confirm swap-in-place is the intended UX. | world-class-ux-designer | Phase C review gate |
| OQ-3 | The `CoverageMap` internal popup will appear on marker tap (DM-1). Should WS-C.3's `MobileMapView` apply a CSS override to hide the `.maplibregl-popup` element on mobile viewports? This would suppress the popup without modifying CoverageMap. Example: `@media (max-width: 767px) { .maplibregl-popup { display: none; } }`. This is a zero-modification approach but uses a global CSS override on a third-party component. | world-class-ui-designer | Phase C review gate |
| OQ-4 | Should the map fly-to on marker tap use an offset to account for the bottom sheet covering the lower ~70% of the viewport? Currently the fly-to centers the marker in the full viewport, meaning it may end up behind the sheet. Offsetting by `sheet_height / 2` pixels upward would center the marker in the visible map area above the sheet. This adds ~5 lines of complexity. | world-class-ux-designer | Phase C |

---

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `displayMarkers.find(m => m.id === markerId)` returns `undefined` because a background data refresh removed the marker between the MapLibre render and the tap handler execution. The bottom sheet would not open, and the user sees no feedback. | Low | Low -- user can tap another marker | The guard clause returns silently. The `useCoverageMapData` polling interval is 30s, and the user's tap latency is <1s, so the window for this race condition is narrow. If it becomes an issue, the handler can fall back to reading the marker's basic properties from the MapLibre click event feature (available in `CoverageMap.handleClick` but not currently forwarded via `onMarkerClick`). |
| R-2 | `coverage.store.selectMapAlert()` reads `useCameraStore.getState()` on mobile, where the camera store contains default values (offsetX: 0, offsetY: 0, zoom: 1). The `preFlyCamera` field stores these meaningless defaults. | Very Low | None | The `preFlyCamera` value is never read on mobile. The mobile dismiss flow calls `clearMapAlert()`, which does not use `preFlyCamera`. The desktop `returnFromAlertDetail` function is never called on mobile. No store modification needed. |
| R-3 | The MapLibre `flyTo()` on marker tap conflicts with the bottom sheet spring animation, causing visual jank (map panning while sheet slides up simultaneously). | Medium | Low -- cosmetic only | Both animations are GPU-accelerated (MapLibre uses WebGL, bottom sheet uses CSS transforms via `motion/react`). They operate on different layers and do not compete for main-thread time. If jank is observed on low-end devices, the fly-to can be delayed by 200ms (after sheet animation begins) using `requestAnimationFrame`. |
| R-4 | The shared `CoverageMap` popup appearing behind the bottom sheet on mobile creates a confusing visual: the user sees a popup AND a sheet with the same alert information. | Medium | Low -- cosmetic | See DM-1 and OQ-3. The popup appears near the marker (upper screen) while the sheet covers the bottom. If the overlap is distracting, a CSS-only suppression via `.maplibregl-popup { display: none }` in mobile media query (proposed in OQ-3) resolves it without modifying shared code. |
| R-5 | WS-C.1 (MobileBottomSheet) delays delivery, blocking the sheet-opening portion of this workstream. Filter chip and view mode wiring can proceed independently. | Medium | Medium -- partial delivery | Develop and test the marker tap -> store write flow independently of the sheet. Use a temporary `console.log` or `window.alert` to verify the handler fires correctly. The sheet rendering (conditional on `selectedMapAlertId`) can be added as soon as WS-C.1 delivers. All unit tests for store interactions can run without the sheet component. |
| R-6 | The URL sync via `syncCategoriesToUrl` causes a `history.replaceState` call on every filter chip toggle, which may interfere with WS-C.2's `history.pushState` for bottom sheet back-button support. | Low | Medium -- broken back navigation | `replaceState` does not create a new history entry (it overwrites the current one). `pushState` (used by WS-C.2 for sheet open) creates a new entry. These are complementary: filter changes replace the current entry's URL params while sheet open/close push/pop entries. No conflict expected. Verify during integration testing. |
| R-7 | The `MobileAlertDetailStub` becomes permanent because WS-D.2 does not replace it, leaving users with a minimal detail view. | Low | Medium -- reduced functionality | The stub is clearly marked with a "FULL DETAIL LOADING..." indicator and a JSDoc comment referencing WS-D.2 as the replacement. The planning log tracks WS-D.2 status. The stub is functional (shows basic data) so it degrades gracefully if WS-D.2 is delayed. |
