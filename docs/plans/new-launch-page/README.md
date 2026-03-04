# New Launch Page — Coverage Viewer

Plan docs for adding a Coverage Viewer page to tarvari-alert-viewer that mirrors the TarvaRI console's coverage screen.

## What This Page Shows

A spatial dashboard of all ~38 TarvaRI intelligence sources — their categories, geographic coverage, health status, and a map of recent intel locations.

## Files in This Plan

| File | What It Covers |
|------|---------------|
| `COVERAGE-DATA-SPEC.md` | Supabase tables, columns, queries, and raw data shapes |
| `DERIVED-METRICS.md` | How to compute the stats, category rollups, and map markers client-side |
| `TYPESCRIPT-TYPES.md` | Copy-paste ready types, constants, severity/category enums |
| `HOOKS-SPEC.md` | Complete TanStack Query hooks with Supabase queries |
| `PAGE-LAYOUT.md` | Section-by-section layout, interaction flow, and UI states |

## Key Decisions

- **Direct Supabase queries** (not TarvaRI API) — the app already has a Supabase client and shares the same instance
- **Client-side aggregation** — the `intel_sources` table is ~38 rows, no need for server-side rollups
- **Two queries total** — one for source metadata, one for map pins
- **Category filter** — clicking a category card filters both the map and the source table

## Data Dependencies

Only two Supabase tables:
1. `intel_sources` — source registry (~38 rows)
2. `intel_normalized` — parsed intel with geo data (up to 1000 rows for map)

Both are populated by TarvaRI backend workers. This app is read-only.
