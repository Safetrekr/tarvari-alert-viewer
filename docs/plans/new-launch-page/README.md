# New Launch Page — Coverage Grid Dashboard

Plan docs for rebuilding the tarvari-alert-viewer launch page. Replaces
the old tarva-launch capsule ring with a coverage-category card grid
backed by live TarvaRI intel data.

**Tracking:** Markdown files only (no Jira).

## Core Concept

**Launch → District** paradigm (same as the old capsule ring, but with real data):

```
Launch Page (coverage card grid) → click category → District View (deep detail)
```

## Files in This Plan

| File | What It Covers |
|------|---------------|
| `DISCOVERY-PROMPT.md` | **Discovery prompt** — 7-phase discovery protocol (filled in) |
| `DISCOVERY-LOG.md` | **Discovery log** — running log of all 7 discovery phases |
| `combined-recommendations.md` | **Discovery output** — 7 decisions, 8 work areas, risk mitigation |
| `agent-roster.md` | **Discovery output** — agent assignments per work area |
| `PLANNING-PROMPT.md` | **Planning prompt** — SOW generation pipeline (filled in) |
| `COVERAGE-DATA-SPEC.md` | Supabase tables, columns, queries, raw data shapes |
| `DERIVED-METRICS.md` | Client-side aggregation, category rollups, map markers |
| `TYPESCRIPT-TYPES.md` | Copy-paste types, constants, severity/category enums |
| `HOOKS-SPEC.md` | TanStack Query hooks with Supabase queries |
| `PAGE-LAYOUT.md` | Section-by-section layout from TarvaRI console (reference) |

## Key Decisions

- **Keep the spatial ZUI, ambient effects, header/footer** — the visual design is staying
- **Keep Launch → District drill-down** — clicking a category card opens a district
- **Direct Supabase queries** (not TarvaRI API) — client-side only, static export target
- **Client-side aggregation** — `intel_sources` is ~38 rows, no server rollups needed
- **Two queries total** — `useCoverageMetrics()` + `useCoverageMapData()`
- **Push data panels outward** — SystemStatusPanel, FeedPanel, etc. move further left/right
- **Archive old page** — `src/app/(launch)/page.archived.tsx` for reference

## Data Dependencies

Two Supabase tables (read-only, populated by TarvaRI workers):
1. `intel_sources` — source registry (~38 rows)
2. `intel_normalized` — parsed intel with geo data (up to 1000 rows for map)
