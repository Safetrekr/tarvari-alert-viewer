# Implementation Notes — Canonical Values

> **IMPORTANT:** This document is the single source of truth for all implementation decisions.
> When any specialist plan (AIA, UX, UI, DATA) conflicts with this document, THIS document wins.
> See `validation-report.md` for the full list of cross-plan conflicts.

## ViewMode Type

```typescript
type ViewMode = 'triaged' | 'all-bundles' | 'raw'
```

**DO NOT USE:** `'bundles'` (AIA), `'all_bundles'` (UI), `'raw_alerts'` (UI)

## URL Parameters

| Mode | URL Parameter | Notes |
|------|--------------|-------|
| Triaged | _(no parameter, default)_ | Omit `?view=` entirely |
| All Bundles | `?view=all-bundles` | Hyphenated, not underscored |
| Raw Alerts | `?view=raw` | Not `raw_alerts` |

Compose with existing: `?view=all-bundles&category=weather&category=seismic`

## State Management

**Extend `coverage.store.ts`** — do NOT create a separate `viewmode.store.ts`.

New fields:
- `viewMode: ViewMode` (default: `'triaged'`)
- `selectedBundleId: string | null` (default: `null`)

## Database Column: Coordinates

- **Column name:** `representative_coordinates` (NOT `geo_centroid`)
- **Format:** `{ lat: number | null, lon: number | null }` (NOT GeoJSON Point)
- **Note:** Both existing bundles have null coordinates

## risk_score Type

- **TypeScript type:** `string | null`
- **Reason:** PostgreSQL `numeric` is returned as `string` by Supabase PostgREST
- **Usage:** Parse with `parseFloat(row.risk_score)` for display/comparison

## confidence_aggregate Type

- **TypeScript type:** `string | null`
- **Same reason:** PostgreSQL `numeric` → string

## Confidence Thresholds (3-tier)

| Tier | Range | Color | Label |
|------|-------|-------|-------|
| LOW | 0–59 | Red `rgba(239, 68, 68, 0.7)` | LOW |
| MODERATE | 60–79 | Amber `rgba(234, 179, 8, 0.6)` | MODERATE |
| HIGH | 80–100 | Green `rgba(34, 197, 94, 0.7)` | HIGH |

## Hook Design Pattern

Hooks accept `viewMode` as a **parameter**, not read from store internally.

```typescript
// CORRECT
function useIntelBundles(viewMode: ViewMode) { ... }

// WRONG — do not read from store inside hooks
function useIntelBundles() {
  const viewMode = useCoverageStore(s => s.viewMode) // NO
}
```

## Plan Reading Order

1. **This file** — canonical values
2. **00-overview.md** — arbiter of cross-plan conflicts
3. **data-layer-architecture.md** — types, queries, hooks (most accurate)
4. **ui-component-design.md** — visual specs (substitute canonical ViewMode values)
5. **ux-experience-design.md** — personas, edge cases, accessibility
6. **aia-interface-architecture.md** — choreography only (Sections 3-4 superseded)
