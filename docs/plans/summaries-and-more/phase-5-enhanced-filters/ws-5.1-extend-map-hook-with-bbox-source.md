# WS-5.1: Extend Map Data Hook with bbox/source Params

> **Workstream ID:** WS-5.1
> **Phase:** 5 -- Enhanced Filters
> **Assigned Agent:** `react-developer`
> **Status:** Draft
> **Created:** 2026-03-05
> **Last Updated:** 2026-03-05
> **Depends On:** WS-0.2
> **Blocks:** WS-5.2
> **Resolves:** None

## 1. Objective

Extend the `useCoverageMapData` hook to accept optional `bbox` (bounding box) and `sourceKey` filter parameters, passing them through to the `GET /console/coverage/map-data` backend endpoint as `bbox` and `source_key` query parameters. This is pure data plumbing -- no UI components, no visual changes, no new files.

The bounding box enables geographic viewport-scoped queries: when a user enables bbox filtering in the district view (WS-5.2), only intel items within the current map viewport are fetched. The `bbox` is a 4-tuple of `[west, south, east, north]` representing longitude/latitude bounds, derived from the MapLibre GL `mapRef.current.getBounds()` API that is already available in `CoverageMap.tsx` via `react-map-gl`'s `MapRef`.

The `sourceKey` filter enables single-source queries: when a user selects a specific intel source in the district view filter panel (WS-5.2), only items from that source are fetched.

Both parameters are optional and additive to the existing `category`, `categories`, `severity`, `startDate`, and `endDate` filters already supported by `CoverageMapFilters`.

Backend Phase B.3 adds `bbox` and `source_key` support to `/console/coverage/map-data`. This workstream prepares the frontend to consume those parameters. The hook can be built and merged before the backend is ready -- unsupported query parameters are ignored by the existing endpoint (standard HTTP behavior for query strings).

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| `BBox` type alias | 4-tuple type `[west: number, south: number, east: number, north: number]` representing geographic bounds in WGS84 longitude/latitude. Added to `CoverageMapFilters` interface in `use-coverage-map-data.ts`. |
| `bbox` field on `CoverageMapFilters` | Optional `BBox` field. When provided, serialized to the `bbox` query parameter as a comma-separated string (e.g., `bbox=-74.01,40.70,-73.97,40.78`). |
| `sourceKey` field on `CoverageMapFilters` | Optional `string` field. When provided, passed as `source_key` query parameter to the API. |
| `fetchCoverageMapData` update | Extend the existing param-building logic to serialize `bbox` and `source_key` from the new filter fields. |
| Query key update | The existing query key `['coverage', 'map-data', filters]` already includes the full filters object. Because TanStack Query uses structural comparison for key equality, adding new fields to `CoverageMapFilters` automatically creates distinct cache entries for different bbox/source combinations. No query key structure change needed. |
| `BBox` type export | Export the `BBox` type for consumption by WS-5.2's filter UI and any component that needs to extract viewport bounds from a `MapRef`. |
| JSDoc updates | Update module-level and interface-level documentation to describe the new parameters. |

### Out of Scope

| Area | Rationale |
|------|-----------|
| District view filter UI | WS-5.2 builds the "Filters" toggle button, source selector dropdown, and bbox toggle. This workstream provides the hook parameters they will use. |
| Viewport bounds extraction logic | The `MapRef.getBounds()` call and its conversion to a `BBox` tuple are the responsibility of the consuming component (WS-5.2 or `CoverageMap`). This workstream defines the type contract, not the extraction mechanism. |
| `useCategoryIntel` bbox/source support | The category intel hook (`use-category-intel.ts`) uses `/console/intel` not `/console/coverage/map-data`. If bbox filtering is needed there, it is a separate workstream. |
| Coverage store changes for bbox/source state | If WS-5.2 needs to persist bbox-enabled state or selected source in the coverage store, that is WS-5.2 scope (or a Phase 5 store extension workstream). This workstream touches only the hook and its types. |
| Backend endpoint implementation | Backend Phase B.3 adds `bbox` and `source_key` query parameter support to `/console/coverage/map-data`. This workstream consumes it. |
| Debouncing bbox updates on map pan/zoom | A performance concern for WS-5.2. The hook is stateless -- it accepts whatever filters are passed. Debouncing is the caller's responsibility. |
| URL synchronization for bbox/source filters | If needed, handled by WS-5.2 or a coverage store extension. This hook has no URL sync interaction. |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/hooks/use-coverage-map-data.ts` | Existing hook with `CoverageMapFilters` interface and `fetchCoverageMapData` function (lines 23-109) | Available [CODEBASE] |
| `src/lib/tarvari-api.ts` | `tarvariGet<T>(endpoint, params?)` typed fetch wrapper. `params` accepts `Record<string, string \| number \| undefined>`. Key observation: `bbox` must be serialized to a string before passing, since the function calls `String(value)` on each param value. | Available [CODEBASE] |
| `react-map-gl` `MapRef` type | `MapRef.getBounds()` returns a `LngLatBounds` object with `.getWest()`, `.getSouth()`, `.getEast()`, `.getNorth()` methods. These return `number` values. This is how WS-5.2 will produce the `BBox` tuple. | Available [CODEBASE, CoverageMap.tsx line 22] |
| Backend Phase B.3 | `GET /console/coverage/map-data?bbox=west,south,east,north&source_key=nws-alerts` query parameter support | Pending (backend work) |
| WS-0.2 | No direct type dependency. Listed in "Depends On" because Phase 5 assumes Phase 0 deliverables are complete (foundational types in place). The `BBox` type defined here is independent of priority types, but the overall build order requires Phase 0 first. | Pending (Phase 0) |

## 4. Deliverables

### 4.1 Type -- `BBox`

**File:** `src/hooks/use-coverage-map-data.ts`

A 4-tuple type alias representing a geographic bounding box in WGS84 coordinates.

```
type BBox = [west: number, south: number, east: number, north: number]
```

Named tuple elements provide self-documenting parameter order. The order follows the GeoJSON/OGC convention (min-longitude, min-latitude, max-longitude, max-latitude) which matches the `bbox` query parameter format expected by spatial APIs.

Exported for use by WS-5.2's filter components, which will construct the tuple from `MapRef.getBounds()`:

```
// Example usage in WS-5.2 (not part of this workstream):
const bounds = mapRef.current.getBounds()
const bbox: BBox = [
  bounds.getWest(),
  bounds.getSouth(),
  bounds.getEast(),
  bounds.getNorth(),
]
```

---

### 4.2 Extended `CoverageMapFilters` interface

**File:** `src/hooks/use-coverage-map-data.ts`

Add two optional fields to the existing interface:

```
export interface CoverageMapFilters {
  category?: string
  categories?: string[]
  severity?: string
  startDate?: string              // ISO 8601
  endDate?: string                // ISO 8601
  bbox?: BBox                     // [west, south, east, north]
  sourceKey?: string              // Intel source identifier (e.g., 'nws-alerts')
}
```

- `bbox` is optional. When omitted, the query returns all geo-located items regardless of viewport (current behavior).
- `sourceKey` is optional. When omitted, items from all sources are returned (current behavior).
- Both fields are additive: they combine with existing category, severity, and date filters via logical AND.

---

### 4.3 Updated `fetchCoverageMapData` query function

**File:** `src/hooks/use-coverage-map-data.ts`

Extend the existing param-building block (lines 54-65) to serialize the two new filter fields.

Current param-building logic:

```
async function fetchCoverageMapData(filters?: CoverageMapFilters): Promise<MapMarker[]> {
  const params: Record<string, string | undefined> = {}

  if (filters?.categories && filters.categories.length > 0) {
    params.category = filters.categories[0]
  } else if (filters?.category) {
    params.category = filters.category
  }
  if (filters?.severity) params.severity = filters.severity
  if (filters?.startDate) params.start_date = filters.startDate
  if (filters?.endDate) params.end_date = filters.endDate
  // ... rest unchanged
```

Add after the `endDate` line:

```
  if (filters?.bbox) {
    params.bbox = filters.bbox.join(',')
  }
  if (filters?.sourceKey) {
    params.source_key = filters.sourceKey
  }
```

**Serialization details:**

- **`bbox`**: Serialized as a comma-separated string of 4 numbers: `"west,south,east,north"` (e.g., `"-74.01,40.70,-73.97,40.78"`). This is the standard bbox query parameter format used by OGC, GeoJSON, and most spatial APIs. `tarvariGet` sets it as `url.searchParams.set('bbox', '...')`, producing `?bbox=-74.01,40.70,-73.97,40.78`.
- **`source_key`**: Passed as a plain string. `tarvariGet` handles `String(value)` conversion, but `sourceKey` is already a string.

**No changes** to the GeoJSON parsing, Point filtering, or `MapMarker` mapping logic (lines 66-89). The response shape is identical regardless of filter parameters.

---

### 4.4 Query key -- no structural change needed

The existing query key is:

```
queryKey: ['coverage', 'map-data', filters]
```

TanStack Query performs deep structural comparison on the `filters` object. When `bbox` or `sourceKey` fields are added to the filters object, queries with different bbox/source values automatically get separate cache entries. A query with `{ category: 'seismic', bbox: [-74, 40, -73, 41] }` is cached separately from `{ category: 'seismic' }`.

**Important consideration for WS-5.2:** Because `bbox` values change on every pan/zoom gesture, each new viewport position creates a new cache entry. WS-5.2 must debounce bbox updates (recommended: 300-500ms after pan/zoom gesture ends) to avoid excessive cache entries and API requests. This is a WS-5.2 concern, not a hook concern -- the hook is stateless.

---

### 4.5 Updated JSDoc

**File header** -- update the module docstring to mention the new parameters:

```
/**
 * TanStack Query hook for coverage map data.
 *
 * Fetches geo-located intel items from the TarvaRI backend API
 * (`/console/coverage/map-data`) and transforms them into `MapMarker[]`
 * for map rendering. Supports optional filtering by category, severity,
 * date range, bounding box, and intel source.
 *
 * @module use-coverage-map-data
 */
```

**`CoverageMapFilters` interface** -- add JSDoc to the new fields:

```
/** Geographic bounding box filter. When provided, only items within this
 *  viewport are returned. Format: [west, south, east, north] in WGS84. */
bbox?: BBox

/** Intel source identifier filter. When provided, only items from this
 *  source are returned (e.g., 'nws-alerts', 'gdacs-rss'). */
sourceKey?: string
```

**`BBox` type** -- add JSDoc:

```
/**
 * Geographic bounding box as a 4-tuple: [west, south, east, north].
 * Coordinates are WGS84 longitude/latitude.
 * Serialized to a comma-separated query parameter for API calls.
 */
export type BBox = [west: number, south: number, east: number, north: number]
```

---

### 4.6 Summary of all exports

| Export | Type | Consumers |
|--------|------|-----------|
| `BBox` | type alias | WS-5.2 (filter UI constructs bbox from MapRef bounds), any component converting viewport bounds to a filter |
| `CoverageMapFilters` | interface (updated) | `page.tsx` (main page map filters), `CategoryDetailScene.tsx` (district view map), WS-5.2 (adds bbox/source fields to filter construction) |
| `useCoverageMapData` | function (hook, unchanged signature) | Same consumers as before -- no signature change, only the `CoverageMapFilters` type is widened |

### 4.7 Changed lines summary

| File | Lines Changed | Nature |
|------|---------------|--------|
| `src/hooks/use-coverage-map-data.ts` | ~12 lines added, 2 lines modified | Type addition (`BBox`), 2 fields on `CoverageMapFilters`, 2 param lines in `fetchCoverageMapData`, JSDoc updates |

No new files. No deleted files. No changes to any other module.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `BBox` type alias is exported from `src/hooks/use-coverage-map-data.ts` as `[west: number, south: number, east: number, north: number]`. | Code review; TypeScript compilation confirms tuple shape. |
| AC-2 | `CoverageMapFilters` interface includes optional `bbox?: BBox` field. | Code review. |
| AC-3 | `CoverageMapFilters` interface includes optional `sourceKey?: string` field. | Code review. |
| AC-4 | When `filters.bbox` is `[-74.01, 40.70, -73.97, 40.78]`, the API request URL includes `bbox=-74.01%2C40.7%2C-73.97%2C40.78` (comma-separated, URL-encoded). | Manual test: add `console.log(url.toString())` temporarily in `tarvariGet`, pass bbox filter, verify URL. |
| AC-5 | When `filters.sourceKey` is `'nws-alerts'`, the API request URL includes `source_key=nws-alerts`. | Manual test: same as AC-4. |
| AC-6 | When `filters.bbox` is `undefined`, no `bbox` query parameter is present in the request URL (existing behavior preserved). | Code review of the `if (filters?.bbox)` guard. |
| AC-7 | When `filters.sourceKey` is `undefined`, no `source_key` query parameter is present in the request URL (existing behavior preserved). | Code review of the `if (filters?.sourceKey)` guard. |
| AC-8 | Existing consumers (`page.tsx` line 191, `CategoryDetailScene.tsx` line 613) continue to work without changes. The new fields are optional and do not affect callers that omit them. | `pnpm typecheck` passes; manual smoke test of main page and district view. |
| AC-9 | `pnpm typecheck` passes with zero errors across the full project. | Run `pnpm typecheck`. |
| AC-10 | `pnpm build` succeeds. | Run `pnpm build`. |
| AC-11 | No existing UI behavior changes. The main page map, category cards, district view, and all overlays function identically. | Manual smoke test. |
| AC-12 | Query key `['coverage', 'map-data', filters]` produces distinct cache entries when `bbox` or `sourceKey` values differ. | Verify by TanStack Query DevTools (if installed) or by confirming separate network requests for different filter combinations. |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|-------------------------|
| D-1 | `BBox` type defined as a named tuple `[west: number, south: number, east: number, north: number]`, not an object `{ west, south, east, north }`. | Tuples serialize naturally with `.join(',')` to produce the comma-separated bbox query parameter format expected by spatial APIs. An object would require explicit field ordering during serialization (`.west + ',' + .south + ...`), which is more verbose and error-prone if field order drifts. The tuple's positional semantics also match the GeoJSON bbox convention (`[minLng, minLat, maxLng, maxLat]`). Named tuple elements (`west:`, `south:`, etc.) provide IDE documentation without the overhead of an object interface. | Object type `{ west: number; south: number; east: number; north: number }` -- rejected because it adds serialization complexity and does not match the wire format. Plain `number[]` -- rejected because it loses the 4-element length constraint and parameter labeling. `[number, number, number, number]` without named elements -- rejected because the coordinate order is ambiguous without labels. |
| D-2 | `BBox` type defined in the hook file (`use-coverage-map-data.ts`), not in `interfaces/coverage.ts`. | Follows the established pattern: types live with their producing/consuming hook. `CoverageMapFilters` is already defined in this file (line 23). `BBox` is a component of that interface. If `BBox` is later needed by multiple unrelated modules, it can be extracted to `interfaces/` in a follow-up. Currently, only this hook and WS-5.2's filter component need it. | Move to `interfaces/coverage.ts` -- rejected because that file manages category, severity, and source types (domain-level taxonomy), not API query parameter shapes. `interfaces/map.ts` (new file) -- rejected because a single type alias does not warrant a new file. |
| D-3 | Serialize bbox as `filters.bbox.join(',')` producing a single `bbox` query parameter, not as 4 separate parameters (`west`, `south`, `east`, `north`). | The single-parameter `bbox=west,south,east,north` format is the de facto standard for spatial APIs (OGC WFS, Mapbox, PostGIS `ST_MakeEnvelope`). It matches the expected backend Phase B.3 contract. A single parameter is also simpler to log, debug, and reproduce in curl commands. | Four separate parameters (`west`, `south`, `east`, `north`) -- rejected because it diverges from spatial API conventions and makes URL construction more verbose. GeoJSON `geometry` object in the request body -- rejected because this is a GET endpoint with query parameters, not a POST. |
| D-4 | `sourceKey` field uses camelCase on the client type, mapped to snake_case `source_key` for the API parameter. | Consistent with every other camelCase-to-snake_case mapping in the codebase: `startDate` maps to `start_date` (line 63), `endDate` to `end_date` (line 64), `sourceKey` in `MapMarker` comes from `source_key` in GeoJSON properties (line 86). The frontend convention is camelCase; the API convention is snake_case. | Use `source_key` on the client type to match the API -- rejected because it violates the camelCase convention used by every other field in `CoverageMapFilters` and `MapMarker`. |
| D-5 | No changes to the query key structure. Rely on TanStack Query's structural comparison of the `filters` object. | The existing key `['coverage', 'map-data', filters]` already handles varying filter combinations (different categories, date ranges). Adding `bbox` and `sourceKey` to the filters object is handled identically by TanStack Query's deep comparison. Creating explicit key segments like `['coverage', 'map-data', { category }, { bbox }, { sourceKey }]` would be a structural change that forces updates to any code that invalidates or prefetches this query. | Explicit key segments -- rejected because it is a breaking change to existing invalidation patterns and adds complexity without benefit. Separate query key for bbox-filtered queries -- rejected because it would require maintaining two parallel query configurations. |
| D-6 | No debouncing logic in the hook. Callers are responsible for debouncing bbox updates. | The hook is a stateless data-fetching primitive. Debouncing is a UI concern that depends on the specific UX context (e.g., debounce on pan end vs. throttle during pan). Embedding debounce logic in the hook would couple it to a single interaction pattern and prevent callers from implementing their own strategy. WS-5.2 will debounce bbox updates before passing them as filter props. | Built-in debounce with configurable delay -- rejected because it couples the hook to a UI interaction pattern and adds state management complexity (debounced vs. actual filters). TanStack Query's `keepPreviousData` option -- complementary to debouncing but does not replace it; WS-5.2 may use both. |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| OQ-1 | What is the exact bbox query parameter format expected by backend Phase B.3? This SOW assumes `bbox=west,south,east,north` as a single comma-separated parameter (OGC convention). The backend may expect a different format (e.g., `bbox[]=west&bbox[]=south...`, or `min_lng=&min_lat=&max_lng=&max_lat=`). Confirm before implementation. | Backend team | Phase B.3 |
| OQ-2 | Does the backend accept `source_key` as a query parameter on `/console/coverage/map-data`? Currently the endpoint may only support `category`, `severity`, `start_date`, `end_date`. Backend Phase B.3 needs to confirm that `source_key` filtering is supported on this specific endpoint (not just on `/console/intel`). | Backend team | Phase B.3 |
| OQ-3 | Should the hook accept multiple `sourceKey` values (array) for filtering by multiple sources simultaneously? The current design supports a single source. WS-5.2's source selector is described as a "dropdown of known sources" (singular selection). If multi-select is needed later, the field type would change from `string` to `string[]` and the serialization would change to `source_key=a,b` or repeated params. | react-developer | WS-5.2 design |
| OQ-4 | Does the backend validate bbox coordinate ranges (longitude -180 to 180, latitude -90 to 90)? If not, should the frontend clamp or validate before sending? MapLibre's `getBounds()` can return longitudes outside -180/180 for maps that have been panned across the antimeridian. A wrapping normalization step may be needed. | Backend team / react-developer | WS-5.2 implementation |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Backend Phase B.3 is not ready when this workstream is implemented. The frontend sends `bbox` and `source_key` query parameters that the backend does not yet recognize. | High | None | Unrecognized query parameters are silently ignored by standard HTTP query string handling. The hook will work exactly as before (returning unfiltered data). When backend B.3 lands, the filters will "just work" without any frontend changes. This is the same zero-risk pattern used by every other hook that was built before its backend endpoint was fully implemented. |
| R-2 | Backend bbox format differs from the assumed `west,south,east,north` comma-separated string. | Medium | Low | The serialization logic is a single line (`filters.bbox.join(',')`) in the query function. Changing the format (e.g., to separate parameters, or to `south,west,north,east` order) is a 1-3 line change localized to `fetchCoverageMapData`. No downstream consumers are affected because they pass a `BBox` tuple, not a serialized string. |
| R-3 | Excessive cache entries from rapidly changing bbox values during map pan/zoom. Each unique bbox creates a TanStack Query cache entry. Rapid panning could create hundreds of stale entries. | Medium | Low | TanStack Query's `gcTime` (default 5 minutes) automatically evicts unused entries. Additionally, WS-5.2 must debounce bbox updates (D-6). If cache size becomes a concern, `queryClient.removeQueries({ queryKey: ['coverage', 'map-data'] })` can prune old entries on pan end. This is a WS-5.2 implementation concern, not a hook concern. |
| R-4 | MapLibre returns longitude values outside -180/180 when the map is panned across the antimeridian (e.g., `west: 170, east: -170` representing a span across the Pacific). The backend may not handle wrapped coordinates. | Low | Medium | `MapRef.getBounds()` from react-map-gl returns an `LngLatBounds` object that normalizes coordinates. However, the `.getWest()` / `.getEast()` values may still produce `west > east` when spanning the antimeridian. The backend must handle this case (or the frontend must split the query into two non-wrapping boxes). Flag for WS-5.2 implementation. |
| R-5 | Adding `bbox` and `sourceKey` to `CoverageMapFilters` causes type errors in existing consumers that spread or destructure the interface. | Very Low | Low | Both fields are optional (`?`). TypeScript does not require optional fields to be provided. Existing consumers (`page.tsx`, `CategoryDetailScene.tsx`) pass partial filter objects or `undefined` -- neither will be affected by widening the interface. `pnpm typecheck` will verify. |
