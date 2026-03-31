# WS-E.3: Cross-Tab Links

> **Workstream ID:** WS-E.3
> **Phase:** E -- Intel Tab + Search
> **Assigned Agent:** `react-developer`
> **Size:** M
> **Status:** Draft
> **Created:** 2026-03-06
> **Last Updated:** 2026-03-06
> **Depends On:** WS-D.2 (`MobileAlertDetail` action button props: `onShowOnMap`, `onViewCategory`, `onShare`, `canShowOnMap`), WS-D.3 (`navigateToCategory` and `navigateToMap` handler patterns defined in `MobileView`, `useMobileMorphBridge` hook, tab switch morph guard), WS-E.1 (Intel tab content: `MobileIntelTab` with priority feed rendering `MobileAlertCard` instances, geographic summary cards), WS-E.2 (region detail "Show on Map" action: `MobileRegionDetail` with `onShowOnMap` prop), WS-C.3 (`MobileMapView` with `externalMapRef` for `flyTo` calls), WS-A.2 (`MobileShell` tab state management: `activeTab`, `setActiveTab`, `handleTabChange` with morph guard)
> **Blocks:** WS-F.4 (protective ops hooks consume cross-tab context to navigate from P1 banner to alert detail), WS-F.5 (pull-to-refresh uses active tab context to determine refetch targets)
> **Resolves:** OVERVIEW task 5.8 (cross-tab navigation links), `information-architecture.md` Section 9.2 (cross-tab navigation table), `protective-ops-review.md` C3 ("Show on Map" from all alert contexts: P1 banner, category detail, Intel tab alert cards)

---

> **Review Fixes Applied (Phase E Review):**
>
> - **H-2 (REGION_CENTROIDS keys):** Rewrote `REGION_CENTROIDS` to use exactly the 11 keys from `GEO_REGION_KEYS` in `coverage.ts` (was using 14 fabricated keys that don't exist in the codebase). Updated unit tests T-10, T-11 to use valid keys.
> - **M-1 (MobileIntelTab props):** Added `onSearchPress`, `onRegionTap`, `scrollRef` to integration code for `MobileIntelTab`.

---

## 1. Objective

Wire all cross-tab navigation actions into `MobileView` as concrete handler functions and thread them to every component that triggers a cross-tab transition. WS-D.3 established the `navigateToCategory` and `navigateToMap` handler patterns and connected them to the category detail and map-context alert detail. This workstream extends those handlers to reach all remaining contexts -- Intel tab alert cards, Intel tab geographic summaries, P1 banner alert detail, and search result alert detail -- and adds two new handlers (`handleShareAlert` for clipboard deep links, `handleViewRegionOnMap` for geographic summary "Show on Map"). It also implements URL deep linking (read `?tab`, `?category`, `?alert` on mount; write them on navigation actions) and extends the tab switch cleanup to dismiss open bottom sheets and clear transient selections.

After this workstream, a user can tap "Show on Map" or "View Category" from any alert surface in the application and arrive at the correct tab with full context. Sharing an alert produces a URL that, when opened, restores the tab, category, and alert selection.

---

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| **Prop threading to Intel tab** | Pass `navigateToCategory`, `navigateToMap`, and `handleShareAlert` down to `MobileIntelTab` so that `MobileAlertCard` instances in the priority feed can trigger cross-tab actions via their `MobileAlertDetail` sheets. |
| **Prop threading to P1 banner** | Pass the same handlers to `MobileThreatIndicator` (WS-B.1) so that P1 banner tap -> alert detail -> "Show on Map" / "View Category" works end-to-end. |
| **Prop threading to search results** | Pass handlers to `MobileSearchOverlay` (WS-E.2) so that search result -> alert detail -> cross-tab actions work. |
| **`handleShareAlert` handler** | New handler in `MobileView`: constructs a deep link URL (`?tab=situation&category={cat}&alert={id}`), copies it to the clipboard via `navigator.clipboard.writeText()`, and provides visual feedback via a transient toast or button state change. |
| **`handleViewRegionOnMap` handler** | New handler in `MobileView`: closes any open sheet, switches to the Map tab, and flies the map to the region centroid. Uses the `GEO_REGION_META` lookup from `src/lib/interfaces/coverage.ts` combined with a `REGION_CENTROIDS` constant for fly-to coordinates. |
| **URL deep linking -- read** | On `MobileView` mount, read `?tab=`, `?category=`, `?alert=` from the URL. Set the active tab, open the category detail (via `startMorph`), and pre-select the alert (via `setDistrictPreselectedAlertId`). Extends the existing `syncCoverageFromUrl()` pattern without modifying it. |
| **URL deep linking -- write** | When `navigateToCategory`, `navigateToMap`, or `handleShareAlert` executes, update the URL via `history.replaceState` to reflect the current navigation state. Uses the same `replaceState` pattern as `syncCategoriesToUrl()`. |
| **Tab switch cleanup extension** | Extend `handleTabChange` (from WS-A.2) to also: clear `selectedMapAlertId` via `clearMapAlert()`, clear `districtPreselectedAlertId` via `setDistrictPreselectedAlertId(null)`, and close the geo summary panel via `closeGeoSummary()`. These supplement the existing `resetMorph()` call. |
| **`syncMobileUrlParams` utility** | New function in `src/stores/coverage.store.ts` (or a new mobile-specific URL util) that writes `?tab=`, `?category=`, `?alert=` to the URL using `history.replaceState`. Follows the same pattern as `syncCategoriesToUrl()`. |
| **Unit tests** | Tests for all handlers, URL sync on mount, URL write on navigation, tab cleanup, and prop threading verification. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| `MobileAlertDetail` component internals | WS-D.2 scope. This WS threads props to it; it does not modify its rendering or internal logic. |
| `navigateToCategory` / `navigateToMap` handler logic | WS-D.3 scope. This WS uses those handlers as-is. D.3 defines the implementation; E.3 extends their reach. |
| Intel tab content components (`MobileIntelTab`, priority feed, geo summaries) | WS-E.1 scope. This WS passes handler props to those components. |
| Region detail component (`MobileRegionDetail`) | WS-E.2 scope. This WS defines the `onShowOnMap` callback that E.2 receives as a prop. |
| Search overlay component (`MobileSearchOverlay`) | WS-E.2 scope. This WS passes handler props. |
| `MobileBottomSheet` dismiss mechanics | WS-C.1/C.2 scope. Sheet dismissal fires `onDismiss` which existing handlers process. |
| Map component modifications | WS-C.3 scope. The `externalMapRef` and `flyTo` API are used as-is. |
| Store action implementations | All store actions used by this WS already exist in `coverage.store.ts` and `ui.store.ts`. No new store actions are required. |
| Push notifications or background deep links | Phase F scope. This WS handles in-app URL params only. |
| Browser history stack management (`pushState` / `popstate`) | WS-C.2 scope. E.3 uses `replaceState` only (no history entries created by navigation actions). |

---

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/stores/coverage.store.ts` (line 129) | `selectMapAlert(id: string, category: string, basic: { title: string; severity: string; ingestedAt: string })` action | Exists |
| `src/stores/coverage.store.ts` (line 131) | `clearMapAlert()` action | Exists |
| `src/stores/coverage.store.ts` (line 117) | `toggleCategory(id: string)` action | Exists |
| `src/stores/coverage.store.ts` (line 119) | `clearSelection()` action | Exists |
| `src/stores/coverage.store.ts` (line 133) | `setDistrictPreselectedAlertId(id: string | null)` action | Exists |
| `src/stores/coverage.store.ts` (line 143) | `closeGeoSummary()` action | Exists |
| `src/stores/coverage.store.ts` (line 153) | `clearDistrictFilters()` action | Exists |
| `src/stores/coverage.store.ts` (lines 419-430) | `syncCategoriesToUrl(categories: string[])` utility (pattern reference for URL sync) | Exists |
| `src/stores/coverage.store.ts` (lines 386-410) | `syncCoverageFromUrl()` utility (pattern reference for mount-time URL read) | Exists |
| `src/stores/ui.store.ts` (line 48) | `startMorph(nodeId: NodeId, options?: StartMorphOptions)` action | Exists |
| `src/stores/ui.store.ts` (line 67) | `resetMorph()` action | Exists |
| `src/stores/ui.store.ts` (line 169) | `uiSelectors.morphPhase` selector | Exists |
| `src/lib/interfaces/coverage.ts` (line 45) | `KNOWN_CATEGORIES` array for category ID validation | Exists |
| `src/lib/interfaces/coverage.ts` (lines 281, 290-304) | `GeoLevel`, `GeoRegionKey`, `GEO_REGION_KEYS`, `GEO_REGION_META` for region validation and display | Exists |
| `src/lib/morph-types.ts` (lines 106-114) | `StartMorphOptions` type (`{ fast?: boolean }`) | Exists |
| `react-map-gl/maplibre` | `MapRef` type for `mapRef.current.flyTo()` | Exists (dependency) |
| WS-D.3 D-5 | `navigateToCategory(categoryId: string)` handler defined in `MobileView` | Pending (Phase D) |
| WS-D.3 D-6 | `navigateToMap(alertId, coords, category, basic)` handler defined in `MobileView` | Pending (Phase D) |
| WS-D.3 D-3 | `useMobileMorphBridge` hook providing `isOpen`, `categoryId`, `onDismiss` | Pending (Phase D) |
| WS-D.2 D-2 | `MobileAlertDetail` with props: `onShowOnMap`, `onViewCategory`, `onShare`, `canShowOnMap` | Pending (Phase D) |
| WS-A.2 D-2 | `MobileShell` with `activeTab` state, `handleTabChange`, `setActiveTab` | Pending (Phase A) |
| WS-A.2 D-1 | `MobileTab` type from `src/lib/interfaces/mobile.ts`: `'situation' \| 'map' \| 'intel'` | Pending (Phase A) |
| WS-A.2 D-1 | `MOBILE_TABS` constant for URL param validation | Pending (Phase A) |
| WS-E.1 | `MobileIntelTab` component accepting `onAlertTap`, `onViewCategory`, `onShowOnMap`, `onShareAlert` props | Pending (Phase E) |
| WS-E.2 | `MobileRegionDetail` component accepting `onShowOnMap(regionKey: string)` prop | Pending (Phase E) |
| WS-C.3 D-1 | `MobileMapView` accepting `externalMapRef` ref object for external `flyTo` calls | Pending (Phase C) |
| WS-D.2 D-4 | `COUNTRY_CENTROIDS` static map at `src/lib/country-centroids.ts` | Pending (Phase D) |

---

## 4. Deliverables

### D-1: `handleShareAlert` handler (`src/components/mobile/MobileView.tsx` -- modified)

New handler that constructs a deep link URL and copies it to the clipboard. This is the only handler in E.3 that is wholly new (the others extend D.3's patterns).

**Type signature:**

```typescript
/**
 * Construct a shareable deep link for an alert and copy it to the clipboard.
 *
 * Flow:
 * 1. Read the current alert's category from coverage.store.
 * 2. Build a URL with ?tab=situation&category={cat}&alert={alertId}.
 * 3. Copy to clipboard via navigator.clipboard.writeText().
 * 4. Set a transient "copied" state for visual feedback (1.5s).
 *
 * @param alertId - The alert ID to encode in the deep link.
 */
const handleShareAlert: (alertId: string) => void
```

**Implementation:**

```typescript
const [shareConfirmId, setShareConfirmId] = useState<string | null>(null)
const shareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const handleShareAlert = useCallback((alertId: string) => {
  const store = useCoverageStore.getState()
  const category = store.selectedMapAlertCategory
  if (!category) return

  // Build deep link URL
  const url = new URL(window.location.href)
  url.searchParams.set('tab', 'situation')
  url.searchParams.set('category', category)
  url.searchParams.set('alert', alertId)

  // Copy to clipboard
  navigator.clipboard.writeText(url.toString()).then(() => {
    // Set transient confirmation state
    setShareConfirmId(alertId)
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
    shareTimeoutRef.current = setTimeout(() => {
      setShareConfirmId(null)
    }, 1500)
  }).catch(() => {
    // Fallback: clipboard API not available (insecure context, denied permission).
    // Silently fail -- no toast system exists yet. WS-F.4 can add error feedback.
  })
}, [])
```

**Cleanup:** Clear the timeout ref on unmount via a `useEffect` cleanup to prevent state updates after unmount.

```typescript
useEffect(() => {
  return () => {
    if (shareTimeoutRef.current) clearTimeout(shareTimeoutRef.current)
  }
}, [])
```

**`shareConfirmId` usage:** Passed to `MobileAlertDetail` as a prop (or via a context) so the "Share" button can show a brief "Copied" label swap when `shareConfirmId === alertId`. The visual feedback is a text change on the button label: `SHARE` -> `COPIED` for 1.5 seconds. No toast or snackbar component is required.

---

### D-2: `handleViewRegionOnMap` handler (`src/components/mobile/MobileView.tsx` -- modified)

New handler that navigates from a geographic summary card on the Intel tab to the Map tab, centered on the region.

**Type signature:**

```typescript
/**
 * Navigate from a geographic summary to the Map tab centered on a region.
 *
 * Flow:
 * 1. If morph is active, reset it instantly.
 * 2. Clear any existing map alert selection.
 * 3. Clear category filters (region view shows all categories).
 * 4. Switch to the Map tab.
 * 5. After the map mounts, fly to the region centroid.
 *
 * @param regionKey - A GeoRegionKey from coverage.ts (e.g., 'sub-saharan-africa', 'south-central-asia').
 */
const handleViewRegionOnMap: (regionKey: string) => void
```

**Implementation:**

```typescript
const handleViewRegionOnMap = useCallback((regionKey: string) => {
  // Validate region key
  if (!isValidGeoRegionKey(regionKey)) return

  const coverageStore = useCoverageStore.getState()
  const uiState = useUIStore.getState()

  // 1. Reset active morph
  if (uiState.morph.phase !== 'idle') {
    coverageStore.clearDistrictFilters()
    uiState.resetMorph()
  }

  // 2. Clear any existing map alert
  coverageStore.clearMapAlert()

  // 3. Clear category filters (region view is cross-category)
  if (coverageStore.selectedCategories.length > 0) {
    coverageStore.clearSelection()
  }

  // 4. Close geo summary if open
  coverageStore.closeGeoSummary()

  // 5. Switch to Map tab
  setActiveTab('map')

  // 6. Fly to region centroid after map mounts
  setTimeout(() => {
    if (mapRef.current) {
      const centroid = REGION_CENTROIDS[regionKey]
      if (centroid) {
        mapRef.current.flyTo({
          center: [centroid.lng, centroid.lat],
          zoom: centroid.zoom,
          duration: 1000,
        })
      }
    }
  }, 100) // Same delay as navigateToMap -- allows React commit + MapLibre init
}, [setActiveTab])
```

**`REGION_CENTROIDS` constant:** A new static map delivered as part of this workstream (see D-4). Maps `GeoRegionKey` values to `{ lat, lng, zoom }` centroids.

---

### D-3: `REGION_CENTROIDS` constant (`src/lib/region-centroids.ts`)

New file providing geographic centroid coordinates and default zoom levels for each `GeoRegionKey` defined in `src/lib/interfaces/coverage.ts` (lines 290-304).

```typescript
/**
 * Geographic centroid coordinates and default zoom for each GEO_REGION_KEY.
 *
 * Used by handleViewRegionOnMap to fly the map to a region.
 * Coordinates are approximate geographic centers suitable for
 * a regional overview at the specified zoom level.
 *
 * @module region-centroids
 * @see GEO_REGION_KEYS in src/lib/interfaces/coverage.ts
 */

import type { GeoRegionKey } from '@/lib/interfaces/coverage'

interface RegionCentroid {
  readonly lat: number
  readonly lng: number
  /** Default zoom level for this region (fits most of the region in viewport). */
  readonly zoom: number
}

export const REGION_CENTROIDS: Record<GeoRegionKey, RegionCentroid> = {
  'north-america':             { lat: 40.0,   lng: -100.0, zoom: 3 },
  'central-america-caribbean': { lat: 15.0,   lng: -80.0,  zoom: 4 },
  'south-america':             { lat: -15.0,  lng: -55.0,  zoom: 3 },
  'western-europe':            { lat: 48.0,   lng: 5.0,    zoom: 4 },
  'eastern-europe':            { lat: 50.0,   lng: 30.0,   zoom: 4 },
  'middle-east':               { lat: 30.0,   lng: 45.0,   zoom: 4 },
  'north-africa':              { lat: 28.0,   lng: 10.0,   zoom: 4 },
  'sub-saharan-africa':        { lat: -5.0,   lng: 25.0,   zoom: 3 },
  'south-central-asia':        { lat: 30.0,   lng: 70.0,   zoom: 4 },
  'east-southeast-asia':       { lat: 15.0,   lng: 110.0,  zoom: 3 },
  'oceania':                   { lat: -15.0,  lng: 150.0,  zoom: 3 },
} as const
```

**Size:** ~50 lines, <1KB. Static data, no runtime dependencies beyond the `GeoRegionKey` type import.

**Validation:** The `GEO_REGION_KEYS` array in `coverage.ts` (lines 290-302) defines 11 region keys. This map has an entry for each. TypeScript's `Record<GeoRegionKey, RegionCentroid>` enforces exhaustiveness at compile time -- a missing key produces a type error.

---

### D-4: `syncMobileUrlParams` utility (`src/lib/mobile-url-sync.ts`)

New file providing URL read/write utilities for mobile-specific parameters (`?tab=`, `?category=`, `?alert=`). Follows the same `history.replaceState` pattern established by `syncCategoriesToUrl()` in `coverage.store.ts`.

```typescript
/**
 * Mobile URL parameter synchronization utilities.
 *
 * Reads and writes ?tab=, ?category=, and ?alert= URL parameters
 * for deep linking. Uses history.replaceState to avoid creating
 * browser history entries (consistent with syncCategoriesToUrl pattern).
 *
 * @module mobile-url-sync
 * @see syncCategoriesToUrl in coverage.store.ts (pattern reference)
 */

import type { MobileTab } from '@/lib/interfaces/mobile'
import { MOBILE_TABS, DEFAULT_MOBILE_TAB } from '@/lib/interfaces/mobile'
import { KNOWN_CATEGORIES } from '@/lib/interfaces/coverage'

// ============================================================================
// Read URL params (called once on mount)
// ============================================================================

export interface MobileDeepLinkParams {
  /** Initial tab to display. Null if no valid ?tab= param. */
  tab: MobileTab | null
  /** Category to open in detail view. Null if no valid ?category= param. */
  category: string | null
  /** Alert to pre-select within the category. Null if no valid ?alert= param. */
  alert: string | null
}

/**
 * Parse mobile deep link parameters from the current URL.
 *
 * Validates each parameter:
 * - ?tab= must be one of MOBILE_TABS
 * - ?category= must be a known category ID from KNOWN_CATEGORIES
 * - ?alert= is accepted as-is (validated against API data at render time)
 *
 * Returns null values for invalid or missing parameters.
 * No-op on the server (SSR guard).
 */
export function readMobileDeepLink(): MobileDeepLinkParams {
  if (typeof window === 'undefined') {
    return { tab: null, category: null, alert: null }
  }

  const params = new URLSearchParams(window.location.search)

  // Parse tab
  const tabParam = params.get('tab')
  const tab = tabParam && (MOBILE_TABS as readonly string[]).includes(tabParam)
    ? (tabParam as MobileTab)
    : null

  // Parse category (validate against known categories)
  const categoryParam = params.get('category')
  const category = categoryParam && KNOWN_CATEGORIES.some((c) => c.id === categoryParam)
    ? categoryParam
    : null

  // Parse alert (no validation -- checked against live data at render time)
  const alert = params.get('alert') ?? null

  return { tab, category, alert }
}

// ============================================================================
// Write URL params (called on navigation actions)
// ============================================================================

/**
 * Write the active tab to the URL. Omits ?tab= for the default tab
 * (situation) to keep URLs clean.
 *
 * Uses replaceState -- does not create a browser history entry.
 */
export function syncTabToUrl(tab: MobileTab): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  if (tab === DEFAULT_MOBILE_TAB) {
    url.searchParams.delete('tab')
  } else {
    url.searchParams.set('tab', tab)
  }

  window.history.replaceState({}, '', url.toString())
}

/**
 * Write the active alert to the URL. Pass null to remove the param.
 *
 * Uses replaceState -- does not create a browser history entry.
 */
export function syncAlertToUrl(alertId: string | null): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  if (alertId) {
    url.searchParams.set('alert', alertId)
  } else {
    url.searchParams.delete('alert')
  }

  window.history.replaceState({}, '', url.toString())
}

/**
 * Write a complete navigation state to the URL in a single replaceState call.
 * Used by cross-tab handlers that change multiple params at once.
 *
 * Omits default values: tab=situation is omitted, null values remove the param.
 */
export function syncMobileNavToUrl(params: {
  tab?: MobileTab
  category?: string | null
  alert?: string | null
}): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)

  // Tab
  if (params.tab !== undefined) {
    if (params.tab === DEFAULT_MOBILE_TAB) {
      url.searchParams.delete('tab')
    } else {
      url.searchParams.set('tab', params.tab)
    }
  }

  // Category -- use existing syncCategoriesToUrl pattern
  if (params.category !== undefined) {
    if (params.category) {
      url.searchParams.delete('category')
      url.searchParams.append('category', params.category)
    } else {
      url.searchParams.delete('category')
    }
  }

  // Alert
  if (params.alert !== undefined) {
    if (params.alert) {
      url.searchParams.set('alert', params.alert)
    } else {
      url.searchParams.delete('alert')
    }
  }

  window.history.replaceState({}, '', url.toString())
}

/**
 * Clear all mobile-specific URL params. Called on tab switch cleanup
 * to prevent stale deep links.
 */
export function clearMobileUrlParams(): void {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  url.searchParams.delete('tab')
  url.searchParams.delete('alert')
  // Note: ?category= is NOT cleared here because it is managed by
  // syncCategoriesToUrl in coverage.store.ts and may reflect filter state
  // that survives tab switches.

  window.history.replaceState({}, '', url.toString())
}
```

**Size:** ~140 lines. No runtime dependencies beyond the type and constant imports.

**Relationship to `syncCoverageFromUrl`:** That function reads `?category=` and `?view=` for the desktop coverage grid. It is called on the desktop page mount. `readMobileDeepLink()` reads `?tab=`, `?category=`, and `?alert=` for mobile. The `?category=` param has dual meaning: on desktop, it sets the category filter; on mobile, it opens the category detail sheet. Both functions can coexist because they are called from different component trees (desktop `page.tsx` vs. mobile `MobileView`).

---

### D-5: `useMobileDeepLinks` hook (`src/hooks/use-mobile-deep-links.ts`)

A mount-time hook that reads URL deep link parameters and applies them to the mobile UI state. Called once in `MobileView` on mount.

```typescript
/**
 * Read URL deep link parameters on mount and apply them to mobile state.
 *
 * Handles three parameters:
 * - ?tab={situation|map|intel} -> sets active tab
 * - ?category={id} -> opens category detail via startMorph (on situation tab)
 * - ?alert={id} -> pre-selects alert via setDistrictPreselectedAlertId
 *
 * Only runs once on mount. Subsequent URL changes are driven by
 * navigation handlers (D-1, D-2, D-6, D-7), not by re-reading the URL.
 *
 * @module use-mobile-deep-links
 * @see WS-E.3 D-4 (syncMobileUrlParams)
 */

'use client'

import { useEffect, useRef } from 'react'
import type { MobileTab } from '@/lib/interfaces/mobile'
import { readMobileDeepLink } from '@/lib/mobile-url-sync'
import { useUIStore } from '@/stores/ui.store'
import { useCoverageStore } from '@/stores/coverage.store'

interface UseMobileDeepLinksOptions {
  /** Setter for the active tab (from MobileShell state). */
  setActiveTab: (tab: MobileTab) => void
}

export function useMobileDeepLinks({ setActiveTab }: UseMobileDeepLinksOptions): void {
  const hasApplied = useRef(false)

  useEffect(() => {
    // Run once on mount only
    if (hasApplied.current) return
    hasApplied.current = true

    const params = readMobileDeepLink()

    // 1. Set tab (if specified and not default)
    if (params.tab) {
      setActiveTab(params.tab)
    }

    // 2. Open category detail (if on situation tab or no tab specified)
    if (params.category) {
      const effectiveTab = params.tab ?? 'situation'
      if (effectiveTab === 'situation') {
        // Pre-select alert before morph so the category detail can highlight it
        if (params.alert) {
          useCoverageStore.getState().setDistrictPreselectedAlertId(params.alert)
        }

        // Schedule morph after React commits the tab state
        queueMicrotask(() => {
          useUIStore.getState().startMorph(params.category!, { fast: true })
        })
      }
    }
  }, [setActiveTab])
}
```

**Why a separate hook:** Isolates the mount-time URL parsing logic from `MobileView`'s render body. Keeps the deep link logic testable in isolation. Follows the pattern of `syncCoverageFromUrl()` being a separate function called in `page.tsx`'s `useEffect`.

**`hasApplied` ref guard:** Prevents double-execution in React 19's development-mode strict mode double-mount. The ref persists across the strict mode unmount/remount cycle because the component identity is preserved.

---

### D-6: Tab switch cleanup extension (`src/components/mobile/MobileView.tsx` -- modified)

Extends the existing `handleTabChange` function (from WS-A.2) to clear all transient state when switching tabs.

**Current behavior (from WS-A.2):**

```typescript
const handleTabChange = useCallback((newTab: MobileTab) => {
  // Morph guard (Gap 6)
  if (useUIStore.getState().morph.phase !== 'idle') {
    useUIStore.getState().resetMorph()
  }
  setActiveTab(newTab)
}, [])
```

**Extended behavior (this workstream):**

```typescript
const handleTabChange = useCallback((newTab: MobileTab) => {
  const uiState = useUIStore.getState()
  const coverageState = useCoverageStore.getState()

  // 1. Reset active morph (Gap 6 -- from WS-A.2)
  if (uiState.morph.phase !== 'idle') {
    coverageState.clearDistrictFilters()
    uiState.resetMorph()
  }

  // 2. Clear map alert selection (dismiss any open alert detail sheet)
  if (coverageState.selectedMapAlertId) {
    coverageState.clearMapAlert()
  }

  // 3. Clear district pre-selected alert (prevents stale selection on next morph)
  if (coverageState.districtPreselectedAlertId) {
    coverageState.setDistrictPreselectedAlertId(null)
  }

  // 4. Close geo summary panel if open
  if (coverageState.geoSummaryOpen) {
    coverageState.closeGeoSummary()
  }

  // 5. Update URL to reflect new tab (clear stale alert param)
  syncMobileNavToUrl({ tab: newTab, alert: null })

  // 6. Switch tab
  setActiveTab(newTab)
}, [setActiveTab])
```

**Rationale for each cleanup step:**

| Step | Why |
|------|-----|
| Reset morph | Prevents orphaned morph animations (Gap 6, established in WS-A.2). |
| Clear map alert | Dismisses the map alert detail bottom sheet. Without this, switching from Map to Intel and back would show a stale alert detail sheet. |
| Clear pre-selected alert | Prevents a stale `districtPreselectedAlertId` from highlighting the wrong alert when the user next opens a category detail. |
| Close geo summary | The geo summary panel is tab-agnostic but contextually tied to the Intel tab. Switching away should close it. |
| Update URL | Removes stale `?alert=` param. Updates `?tab=` to reflect the new tab. `?category=` is preserved because it reflects the filter state which persists across tabs. |

---

### D-7: URL write integration in existing handlers (`src/components/mobile/MobileView.tsx` -- modified)

Adds `syncMobileNavToUrl` calls to the existing `navigateToCategory` and `navigateToMap` handlers from WS-D.3.

**`navigateToCategory` -- add URL sync after step 3:**

```typescript
const navigateToCategory = useCallback((categoryId: string) => {
  // ... existing steps 1-3 from D.3 D-5 ...

  // NEW: Update URL to reflect category navigation
  syncMobileNavToUrl({ tab: 'situation', category: categoryId, alert: null })

  // 4. Schedule morph (existing from D.3 D-5)
  queueMicrotask(() => {
    useUIStore.getState().startMorph(categoryId, { fast: true })
  })
}, [setActiveTab])
```

**`navigateToMap` -- add URL sync after step 4:**

```typescript
const navigateToMap = useCallback((
  alertId: string,
  coords: { lat: number; lng: number },
  category: string,
  basic: { title: string; severity: string; ingestedAt: string },
) => {
  // ... existing steps 1-4 from D.3 D-6 ...

  // NEW: Update URL to reflect map navigation
  syncMobileNavToUrl({ tab: 'map', alert: alertId })

  // 5. Fly + select (existing from D.3 D-6)
  setTimeout(() => {
    // ... existing flyTo + selectMapAlert logic ...
  }, 100)
}, [setActiveTab])
```

**Note:** These are modifications to the handlers D.3 delivers, not replacements. The modifications add a single `syncMobileNavToUrl()` call at the appropriate point in each handler's flow.

---

### D-8: MobileView integration -- complete prop threading (`src/components/mobile/MobileView.tsx` -- modified)

The central integration deliverable. Shows how all handlers are wired into `MobileView` and threaded to child components.

**Handler inventory in MobileView:**

| Handler | Defined In | Threaded To |
|---------|-----------|-------------|
| `navigateToCategory` | WS-D.3 D-5 | `MobileCategoryDetail` (via morph bridge sheet), `MobileAlertDetail` (all contexts), `MobileIntelTab`, `MobileSearchOverlay` |
| `navigateToMap` | WS-D.3 D-6 | `MobileAlertDetail` (all contexts), `MobileIntelTab`, `MobileSearchOverlay` |
| `handleShareAlert` | WS-E.3 D-1 | `MobileAlertDetail` (all contexts) |
| `handleViewRegionOnMap` | WS-E.3 D-2 | `MobileIntelTab` (geo summary cards) |
| `handleTabChange` | WS-A.2 (extended in D-6) | `MobileBottomNav` |

**Prop threading map:**

```
MobileView
  |
  +-- useMobileDeepLinks({ setActiveTab })              [D-5]
  +-- useMobileMorphBridge()                             [D.3]
  +-- navigateToCategory = useCallback(...)              [D.3 D-5 + D-7 URL sync]
  +-- navigateToMap = useCallback(...)                   [D.3 D-6 + D-7 URL sync]
  +-- handleShareAlert = useCallback(...)                [D-1]
  +-- handleViewRegionOnMap = useCallback(...)            [D-2]
  +-- handleTabChange = useCallback(...)                 [D-6]
  |
  +-- <MobileShell
  |     activeTab={activeTab}
  |     onTabChange={handleTabChange}
  |     situationContent={
  |       <>
  |         <MobileCategoryGrid onCardTap={...} />       [WS-B.2]
  |         <MobileBottomSheet ...morphBridge>             [Category detail sheet]
  |           <MobileCategoryDetail
  |             onAlertTap={handleAlertTap}                [opens alert detail]
  |             onBack={morphBridge.onDismiss}
  |             ...
  |           >
  |             <MobileBottomSheet ...alertSheet>          [Nested alert detail]
  |               <MobileAlertDetail
  |                 onShowOnMap={navigateToMap}
  |                 onViewCategory={navigateToCategory}
  |                 onShare={handleShareAlert}
  |                 shareConfirmId={shareConfirmId}
  |               />
  |             </MobileBottomSheet>
  |           </MobileCategoryDetail>
  |         </MobileBottomSheet>
  |       </>
  |     }
  |     mapContent={
  |       <>
  |         <MobileMapView
  |           externalMapRef={mapRef}
  |           markers={markers}
  |           selectedMarkerId={selectedMapAlertId}
  |           ...
  |         />
  |         <MobileBottomSheet ...alertSheet>               [Map alert detail]
  |           <MobileAlertDetail
  |             onShowOnMap={navigateToMap}
  |             onViewCategory={navigateToCategory}
  |             onShare={handleShareAlert}
  |             shareConfirmId={shareConfirmId}
  |           />
  |         </MobileBottomSheet>
  |       </>
  |     }
  |     intelContent={
  |       <MobileIntelTab
  |         onAlertTap={handleIntelAlertTap}
  |         onViewCategory={navigateToCategory}
  |         onShowOnMap={navigateToMap}
  |         onShareAlert={handleShareAlert}
  |         onViewRegionOnMap={handleViewRegionOnMap}
  |         shareConfirmId={shareConfirmId}
  |       >
  |         <MobileBottomSheet ...alertSheet>               [Intel alert detail]
  |           <MobileAlertDetail
  |             onShowOnMap={navigateToMap}
  |             onViewCategory={navigateToCategory}
  |             onShare={handleShareAlert}
  |             shareConfirmId={shareConfirmId}
  |           />
  |         </MobileBottomSheet>
  |       </MobileIntelTab>
  |     }
  |   />
```

**`handleIntelAlertTap` -- adapter for Intel tab context:**

When an alert card is tapped in the Intel tab (outside of a category detail morph), the flow differs from the Situation tab. There is no morph to open -- the Intel tab uses a direct bottom sheet open.

```typescript
const handleIntelAlertTap = useCallback((item: CategoryIntelItem) => {
  // Write the alert into the coverage store so MobileAlertDetail can read it
  useCoverageStore.getState().selectMapAlert(
    item.id,
    item.category,
    { title: item.title, severity: item.severity, ingestedAt: item.ingestedAt },
  )

  // Update URL
  syncAlertToUrl(item.id)
}, [])
```

This opens the Intel tab's alert detail bottom sheet (which reads `selectedMapAlertId` from coverage.store). The sheet's `onDismiss` calls `clearMapAlert()` and `syncAlertToUrl(null)`.

---

### D-9: Unit tests (`src/__tests__/cross-tab-links.test.ts`)

Test file covering all new handlers and the deep link hook.

**`handleShareAlert` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-1 | Copies deep link URL to clipboard | Set `selectedMapAlertCategory = 'seismic'`. Mock `navigator.clipboard.writeText`. Call `handleShareAlert('alert-1')`. | `clipboard.writeText` called with URL containing `?tab=situation&category=seismic&alert=alert-1`. |
| T-2 | Sets shareConfirmId on success | Set category. Mock clipboard (resolves). Call handler. Flush promises. | `shareConfirmId === 'alert-1'`. |
| T-3 | Clears shareConfirmId after 1.5s | After T-2 setup, advance timers by 1500ms. | `shareConfirmId === null`. |
| T-4 | Does nothing when no category in store | Set `selectedMapAlertCategory = null`. Call handler. | `clipboard.writeText` NOT called. |
| T-5 | Handles clipboard rejection gracefully | Mock clipboard (rejects). Call handler. | No error thrown. `shareConfirmId` remains null. |

**`handleViewRegionOnMap` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-6 | Resets morph if active | Set `morph.phase = 'district'`. Call `handleViewRegionOnMap('sub-saharan-africa')`. | `morph.phase === 'idle'`. |
| T-7 | Clears map alert selection | Set `selectedMapAlertId = 'x'`. Call handler. | `selectedMapAlertId === null`. |
| T-8 | Clears category filters | Set `selectedCategories = ['seismic']`. Call handler. | `selectedCategories.length === 0`. |
| T-9 | Switches to Map tab | Call handler with valid region. | `setActiveTab` called with `'map'`. |
| T-10 | Flies to region centroid after timeout | Mock `setTimeout`, `mapRef`. Call handler with `'sub-saharan-africa'`. Advance timers 100ms. | `flyTo` called with `{ center: [37.0, -1.5], zoom: 4, duration: 1000 }`. |
| T-11 | Rejects invalid region key | Call handler with `'invalid-region'`. | No `setActiveTab` call. No `flyTo`. |
| T-12 | Closes geo summary panel | Set `geoSummaryOpen = true`. Call handler. | `geoSummaryOpen === false`. |

**`handleTabChange` cleanup tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-13 | Clears map alert on tab switch | Set `selectedMapAlertId = 'alert-1'`. Call `handleTabChange('intel')`. | `selectedMapAlertId === null`. |
| T-14 | Clears pre-selected alert on tab switch | Set `districtPreselectedAlertId = 'alert-2'`. Call handler. | `districtPreselectedAlertId === null`. |
| T-15 | Closes geo summary on tab switch | Set `geoSummaryOpen = true`. Call handler. | `geoSummaryOpen === false`. |
| T-16 | Updates URL with new tab | Call `handleTabChange('map')`. | URL contains `?tab=map`. |
| T-17 | Removes stale alert param from URL | Set URL to `?alert=old`. Call `handleTabChange('intel')`. | URL does NOT contain `?alert=`. |

**`useMobileDeepLinks` tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-18 | Sets tab from URL | Set URL `?tab=map`. Render hook. | `setActiveTab` called with `'map'`. |
| T-19 | Opens category detail from URL | Set URL `?category=seismic`. Render hook. Flush microtasks. | `startMorph` called with `('seismic', { fast: true })`. |
| T-20 | Pre-selects alert from URL | Set URL `?category=seismic&alert=alert-1`. Render hook. | `setDistrictPreselectedAlertId` called with `'alert-1'` BEFORE `startMorph`. |
| T-21 | Ignores invalid tab | Set URL `?tab=invalid`. Render hook. | `setActiveTab` NOT called. |
| T-22 | Ignores invalid category | Set URL `?category=nonexistent`. Render hook. | `startMorph` NOT called. |
| T-23 | Runs only once (strict mode guard) | Render hook twice (simulating strict mode). | `setActiveTab` called exactly once. |

**URL sync tests:**

| # | Test | Setup | Assertion |
|---|------|-------|-----------|
| T-24 | `syncTabToUrl` omits default tab | Call `syncTabToUrl('situation')`. | URL does NOT contain `?tab=`. |
| T-25 | `syncTabToUrl` writes non-default tab | Call `syncTabToUrl('map')`. | URL contains `?tab=map`. |
| T-26 | `syncAlertToUrl` writes alert ID | Call `syncAlertToUrl('abc')`. | URL contains `?alert=abc`. |
| T-27 | `syncAlertToUrl(null)` removes param | Set URL `?alert=abc`. Call `syncAlertToUrl(null)`. | URL does NOT contain `?alert=`. |
| T-28 | `syncMobileNavToUrl` writes multiple params | Call with `{ tab: 'map', alert: 'abc' }`. | URL contains `?tab=map&alert=abc`. |
| T-29 | `clearMobileUrlParams` clears tab and alert but preserves category | Set URL `?tab=map&alert=abc&category=seismic`. Call `clearMobileUrlParams()`. | URL contains `?category=seismic` but NOT `?tab=` or `?alert=`. |

**Test setup notes:**
- Use `vi.spyOn(navigator.clipboard, 'writeText')` with `mockResolvedValue(undefined)` for clipboard tests.
- Use `vi.useFakeTimers()` for timeout-dependent tests (share confirmation, flyTo delay).
- Mock `mapRef.current` with `{ flyTo: vi.fn(), getZoom: vi.fn(() => 4) }`.
- Reset Zustand stores between tests via direct `setState` calls.
- Mock `window.location` via `vi.stubGlobal` for URL tests.
- Use `@testing-library/react` `renderHook` for `useMobileDeepLinks`.

**File location:** `src/__tests__/cross-tab-links.test.ts`

**Estimated size:** ~350 lines.

---

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | Tapping "Show on Map" from an alert detail on the Intel tab switches to the Map tab, flies to the marker location, highlights the marker, and opens the map alert detail sheet. | Manual: Open Intel tab, tap an alert, tap "Show on Map". Verify Map tab is active, map is centered on marker, marker has selection ring, alert detail sheet is open. |
| AC-2 | Tapping "View Category" from an alert detail on the Map tab switches to the Situation tab and opens the correct category detail bottom sheet. | Manual: Open Map tab, tap a marker to open alert detail, tap "View Category: SEIS". Verify Situation tab is active, Seismic category detail sheet is open. |
| AC-3 | Tapping "Share" from any alert detail copies a deep link URL to the clipboard. The URL contains `?tab=situation&category={cat}&alert={id}`. | Manual: Tap "Share" on an alert. Paste clipboard contents. Verify URL format. |
| AC-4 | After tapping "Share", the button label briefly changes to "COPIED" for approximately 1.5 seconds before reverting to "SHARE". | Manual: Observe the button label change. Verify it reverts after ~1.5s. |
| AC-5 | Tapping "View on Map" from a geographic summary card on the Intel tab switches to the Map tab and flies to the region centroid with all categories visible (no category filter). | Manual: Open Intel tab, find a geo summary card (e.g., "East Africa"), tap "View on Map". Verify Map tab active, map centered on East Africa region, no category filter chips active. |
| AC-6 | Opening the URL `?tab=map` directly sets the Map tab as the initial active tab. | Navigate to `localhost:3000/?tab=map`. Verify Map tab is active. |
| AC-7 | Opening the URL `?category=seismic` opens the Situation tab with the Seismic category detail sheet. | Navigate to `localhost:3000/?category=seismic`. Verify Situation tab active, Seismic detail sheet open. |
| AC-8 | Opening the URL `?category=seismic&alert=alert-123` opens the Seismic category detail with the specified alert pre-selected (highlighted) in the alert list. | Navigate to `localhost:3000/?category=seismic&alert=alert-123`. Verify alert is highlighted in the list (if it exists in the data). |
| AC-9 | Opening the URL `?tab=intel` opens the Intel tab. No category detail sheet opens. | Navigate to `localhost:3000/?tab=intel`. Verify Intel tab active, no sheet open. |
| AC-10 | Switching tabs while a map alert detail sheet is open dismisses the sheet. The alert is no longer selected when switching back to the Map tab. | Manual: Open alert detail on Map tab, switch to Intel tab, switch back to Map tab. Verify no alert detail sheet is open, no marker has selection ring. |
| AC-11 | Switching tabs while a category detail sheet is open (morph active) resets the morph and closes the sheet instantly. | Manual: Open category detail on Situation tab, switch to Map tab. Verify no sheet, morph phase is idle. |
| AC-12 | Switching tabs clears the `?alert=` URL parameter but preserves `?category=` if a category filter is active. | Manual: Set `?alert=abc&category=seismic` in URL. Switch tabs. Verify `?alert=` is gone, `?category=seismic` remains. |
| AC-13 | An invalid `?tab=garbage` URL parameter is ignored; the default Situation tab loads. | Navigate to `localhost:3000/?tab=garbage`. Verify Situation tab active. |
| AC-14 | An invalid `?category=nonexistent` URL parameter is ignored; no category detail sheet opens. | Navigate to `localhost:3000/?category=nonexistent`. Verify no sheet opens. |
| AC-15 | All 29 unit tests pass. | Run `pnpm test:unit -- --run src/__tests__/cross-tab-links.test.ts`. |
| AC-16 | `pnpm typecheck` passes with zero errors after all changes. | Run `pnpm typecheck` from project root. |
| AC-17 | Desktop rendering is completely unaffected. New mobile-only files are not imported by the desktop component tree. | Load desktop view (viewport >= 768px). Verify no visual or behavioral changes. |
| AC-18 | The "Show on Map" button works from all three alert contexts: Situation tab (category detail -> alert detail), Map tab (marker -> alert detail), and Intel tab (feed -> alert detail). | Manual: Test "Show on Map" from each of the three contexts. Verify consistent behavior. |

---

## 6. Architectural Decisions

| ID | Decision | Rationale |
|----|----------|-----------|
| AD-1 | URL sync uses `history.replaceState` exclusively (never `pushState`). | Cross-tab navigation actions are lateral movements, not forward navigation. Creating history entries for every "Show on Map" or "View Category" tap would pollute the browser history stack and conflict with WS-C.2's sheet history management. The `replaceState` pattern is established by `syncCategoriesToUrl()` (coverage.store.ts line 429). |
| AD-2 | `handleShareAlert` constructs a URL with `?tab=situation&category={cat}&alert={id}` rather than encoding all view state (filters, time range, view mode). | Share links should be stable and minimal. Including transient filter state makes URLs fragile (they break as the user's session changes) and long (bad for messaging). The situation tab + category + alert is the minimum context needed to deep link to a specific alert. |
| AD-3 | `handleViewRegionOnMap` clears all category filters (unlike `navigateToMap` which is additive). | Region views are inherently cross-category. Showing only a single category would defeat the purpose of the geographic overview. Clearing filters gives the user a "clean slate" view of the region. This differs from `navigateToMap`'s additive approach (AD-6 in WS-D.3) because the intent is different: "show me this region" vs. "show me this specific alert's location." |
| AD-4 | `REGION_CENTROIDS` is a separate file from `COUNTRY_CENTROIDS` (WS-D.2). | They serve different purposes: `COUNTRY_CENTROIDS` maps ISO 3166-1 alpha-2 codes to lat/lng for single-country centroid fallback. `REGION_CENTROIDS` maps `GeoRegionKey` strings to lat/lng/zoom for multi-country regional overview. The zoom levels differ (country: user's current zoom or 6; region: fixed 3-5). Merging them into one file would conflate two distinct geographic reference systems. |
| AD-5 | `shareConfirmId` state lives in `MobileView` (not in Zustand store). | This is purely ephemeral UI feedback state (a 1.5-second visual confirmation). It has no persistence, no cross-component consumption outside the `MobileAlertDetail` prop, and no URL representation. Zustand would be over-engineering for a timer-based UI flash. |
| AD-6 | The `useMobileDeepLinks` hook runs once via a `useRef` guard rather than using an empty dependency array alone. | React 19's strict mode double-mounts effects in development. A bare `useEffect(fn, [])` would run the deep link logic twice, potentially calling `startMorph` twice. The `hasApplied` ref prevents this. In production (no strict mode), the ref guard is redundant but harmless. |
| AD-7 | `clearMobileUrlParams` does NOT clear `?category=` from the URL. | The `?category=` param serves dual purpose: it reflects both category detail navigation (mobile) and category filter state (desktop). The existing `syncCategoriesToUrl()` manages this param. Tab switches should not clear filter state. The `?category=` param is only cleared when the morph resets (handled by `useMorphChoreography`'s existing URL sync in D.3). |
| AD-8 | No new Zustand store actions are introduced. All cross-tab wiring uses existing store actions. | The coverage and UI stores already expose all the primitives needed (selectMapAlert, clearMapAlert, toggleCategory, clearSelection, startMorph, resetMorph, clearDistrictFilters, closeGeoSummary, setDistrictPreselectedAlertId). Adding wrapper actions would create indirection without benefit. The handlers in MobileView compose these primitives into cross-tab flows. |

---

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | Should `handleShareAlert` use the Web Share API (`navigator.share()`) on supported devices instead of (or in addition to) clipboard copy? The Web Share API opens the native share sheet on iOS/Android, which is more idiomatic for mobile. However, it requires HTTPS and user activation, and falls back to nothing on desktop. Decision: start with clipboard only; add Web Share API as an enhancement in Phase F if user testing indicates demand. | react-developer + world-class-ux-designer | Phase F review gate |
| OQ-2 | Should the deep link URL include a `?view=` parameter to restore the view mode (triaged/all-bundles/raw) when the link is opened? Currently omitted per AD-2 (minimal stable URLs). If analysts frequently share links that need a specific view mode, this could be added. | information-architect | Phase E review gate |
| OQ-3 | The `?category=seismic` deep link on mobile opens the category detail sheet. On desktop, the same param sets the category filter. If a user shares a mobile deep link and the recipient opens it on desktop, the behavior differs. Is this acceptable? Desktop would show the coverage grid filtered to seismic; mobile would open the seismic detail sheet. Both surface seismic data, just in different presentations. | planning-coordinator | Phase E review gate |
| OQ-4 | Should `handleViewRegionOnMap` also set a visual boundary overlay (polygon) on the map to indicate the region extent, or is flying to the centroid sufficient? The existing `CoverageMap` does not have a region boundary rendering capability, so this would require new map layer work. Decision: centroid fly-to only for E.3; region boundaries deferred to future enhancement. | react-developer | Phase F |

---

## 8. Risks

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | `navigator.clipboard.writeText()` fails on insecure contexts (HTTP) or when clipboard permission is denied by the browser. The "Share" button appears to do nothing. | Medium | Low | The `.catch()` handler silently absorbs the error. In the current dev environment (HTTP localhost), clipboard access works in Chrome and Safari. In production (GitHub Pages, HTTPS), the API is fully supported. A future enhancement can add a fallback (e.g., `document.execCommand('copy')` with a hidden textarea) or a toast notification on failure. |
| R-2 | Deep link URL with `?category=seismic&alert=alert-123` is opened, but the alert no longer exists in the API response (deleted, aged out, or different time window). The category detail opens but the alert is not found. | Medium | Low | `setDistrictPreselectedAlertId` sets a hint that the category detail list uses to highlight a row. If no matching row exists, the hint is silently ignored (no error, no empty state). The user sees the category detail without a pre-selected alert. |
| R-3 | `REGION_CENTROIDS` zoom levels produce an unintuitive map view on small mobile screens. A zoom of 4 may show too little context for large regions (e.g., Oceania) or too much for small ones (e.g., Caribbean). | Low | Low | The zoom values are initial estimates. They can be tuned during Phase F polish based on testing across device sizes. The `flyTo` duration (1000ms) provides a smooth transition that gives the user spatial context regardless of the exact zoom level. |
| R-4 | Race condition between `handleTabChange` cleanup and D.3's `navigateToMap`/`navigateToCategory` when both fire in rapid succession (e.g., user taps "Show on Map" and then immediately taps a tab button). The tab change cleanup could clear the map alert that `navigateToMap` just set. | Very Low | Medium | `navigateToMap` uses `setTimeout(100)` to set the map alert after the tab switch. If `handleTabChange` fires after `navigateToMap` but before the 100ms timeout, the cleanup clears the old state, and the timeout then sets the new state -- the final state is correct. If `handleTabChange` fires after the timeout, it clears the new state -- the user sees a brief flash then empty. This edge case requires sub-100ms sequential taps on two different targets, which is improbable in normal use. |
| R-5 | The `useMobileDeepLinks` hook's `queueMicrotask` fires `startMorph` before React has rendered the Situation tab content (since `setActiveTab` is a state update that triggers an async re-render). The morph opens but the sheet renders in an empty tab. | Very Low | Low | Zustand state updates are synchronous. `setActiveTab('situation')` runs, then `queueMicrotask` fires `startMorph`. React batches both state changes into a single render. The sheet content (`MobileCategoryDetail`) mounts in the same render pass as the tab content. Even if there is a timing gap, the sheet renders above the tab content (z-30) with its own background, so a momentary empty tab beneath it is invisible to the user. |
| R-6 | Dual deep link processing: both `syncCoverageFromUrl()` (called on desktop page mount) and `useMobileDeepLinks` could both run if the code-splitting gate fails and both desktop and mobile trees mount. | Very Low | Medium | The desktop and mobile trees are mutually exclusive, gated by `useIsMobile()` and `next/dynamic` code splitting (WS-A.1). If this invariant breaks, both would process `?category=`, resulting in both a category filter AND a morph start. Defense: `useMobileDeepLinks` checks `hasApplied` ref. The two functions read different params (`syncCoverageFromUrl` reads `?category=` as a filter; `useMobileDeepLinks` reads it as a morph trigger). |
