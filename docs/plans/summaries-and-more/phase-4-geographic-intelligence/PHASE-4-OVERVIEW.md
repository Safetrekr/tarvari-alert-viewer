# Phase 4 Overview -- Geographic Intelligence

> **Synthesized by:** CTA + SPO + STW + PMO
> **Date:** 2026-03-05
> **Workstreams:** WS-4.1 through WS-4.6
> **Phase prerequisite:** Phase 0 (WS-0.1 simplified stats, WS-0.2 OperationalPriority type) complete
> **Backend dependency:** Phase D (D.6 -- `/console/threat-picture` and `/console/summaries` endpoints, estimated 7-10 days into backend work)

---

## 1. Executive Summary

Phase 4 delivers the TarvaRI Alert Viewer's geographic intelligence surface: a three-level hierarchical threat summary panel (World > Region > Country) with supporting data hooks, trend indicators on category cards, and discovery entry points from both the stats column and the command palette. It is the largest phase in the project plan (6 workstreams: 3S + 2M + 1L) and the first to depend on backend endpoints that do not yet exist.

The phase produces six deliverables across two tracks. The **data track** introduces two new TanStack Query hooks: `useThreatPicture` (WS-4.1) for aggregated threat intelligence (category counts, severity/priority distributions, regional breakdowns, trend directions) and `useGeoSummaries` (WS-4.2) for AI-generated periodic geographic summaries at each hierarchy level. The **UI track** builds the GeoSummaryPanel slide-over (WS-4.3, the phase's largest workstream), trend arrows on CategoryCard (WS-4.4), the "THREAT PICTURE" entry point button (WS-4.5), and the coverage store extensions that manage panel lifecycle and drill-down navigation (WS-4.6).

Six cross-workstream conflicts were identified during synthesis (Section 3). Five involve type duplication -- `TrendDirection`, `GeoLevel`, `ThreatLevel`, geographic region constants, and risk trend vocabulary -- where multiple SOWs define overlapping types in different files without referencing each other. The sixth is an API shape assumption mismatch where WS-4.3 references field names from WS-4.1 and WS-4.2 that do not match the actual type definitions. All six are specification inconsistencies, not design disagreements. Each has a clear resolution that the implementer can apply at build time.

The phase's primary architectural concern is mutual exclusion between the GeoSummaryPanel (z-42) and the DistrictViewOverlay (z-30), documented as R10 in the combined recommendations. WS-4.6 designs a two-direction solution: Direction 1 (morph starts while geo panel is open) uses a reactive `useEffect` in the panel component; Direction 2 (geo panel opens while morph is active) uses a synchronous guard in the `openGeoSummary` store action. This keeps the two-store boundary intact -- no cross-store writes, only a read-only `getState()` check.

Estimated total effort: 4-6 developer-days for a single React developer. WS-4.6 (coverage store extensions) has no intra-phase dependencies and should be built first. WS-4.1 and WS-4.2 (data hooks) follow in parallel, then WS-4.4 and WS-4.5 (lightweight UI), and finally WS-4.3 (the panel) which consumes all other workstreams. Backend Phase D endpoints are a soft dependency -- all six frontend workstreams can be built with mock data and connected when the endpoints land.

---

## 2. Key Findings

Findings are grouped by theme, not by workstream.

### Data Architecture

- **Two separate data hooks for two distinct data domains.** `useThreatPicture` (WS-4.1) fetches a single aggregated snapshot from `/console/threat-picture` (counts, distributions, trends). `useGeoSummaries` (WS-4.2) fetches AI-generated natural language summaries from `/console/summaries` parameterized by geo level, geo key, and summary type. These serve fundamentally different purposes: the threat picture drives quantitative displays (charts, trend arrows), while geo summaries drive qualitative displays (executive summaries, recommendations, key events). Keeping them as separate hooks with separate query keys prevents unnecessary refetches when only one data domain changes.

- **Parameterized query keys are a new pattern.** WS-4.2 introduces `GEO_SUMMARY_QUERY_KEYS`, a factory producing keys like `['geo-summary', 'latest', level, key, type]` and `['geo-summary', 'history', level, key, type]`. This is the first parameterized query key factory in the codebase -- existing hooks use static keys (`['threat-picture']`, `['coverage', 'metrics']`, `['intel', 'feed']`). The pattern is sound (enables targeted invalidation and cache lookup), but introduces a precedent that may influence future hook design.

- **Defensive JSON parsing for structured breakdown.** WS-4.2 calls out that the `structured_breakdown` field from `/console/summaries` may arrive as a JSON string (if stored as `text` or `jsonb::text` in PostgreSQL) or as a parsed object (if the API serializes it). The normalizer wraps a `typeof === 'string' ? JSON.parse(raw) : raw` check. This defensiveness is warranted -- the field's shape is complex (category counts, severity distribution, key events, recommendations) and a parse failure would break the entire panel.

- **Poll intervals follow the slow-data pattern.** `useThreatPicture` polls at 120s (staleTime 90s), `useGeoSummaries` polls at 120s (staleTime 60s). These are the longest intervals in the codebase, reflecting the pre-aggregated nature of geographic intelligence data. For comparison: `useIntelFeed` polls at 30s, `useCoverageMetrics` at 60s. The staleTime/refetchInterval ratios maintain the project convention of ~75% stale-to-poll ratio.

- **`keepPreviousData` is used for geo summary drill-downs.** WS-4.2 configures `placeholderData: keepPreviousData` on `useLatestGeoSummary`, which means when the user drills from World to a Region, the World summary remains visible until the Region summary loads. This prevents a jarring flash-to-loading-state during navigation and is a deliberate TanStack Query v5 feature usage.

### Visual & Interaction Design

- **560px panel with spring animation.** The GeoSummaryPanel is a right-edge fixed slide-over at z-42, animated with motion/react spring physics (stiffness: 300, damping: 30). It is wider than the TriageRationalePanel (380px) and the BuilderModePanel (480px) because it contains structured data visualizations (bar charts, event lists, 2-column region grids) that need horizontal space. At 560px on a 1440px viewport, ~61% of the spatial canvas remains visible.

- **Three-level geographic hierarchy.** World (global overview, 11 region drill-down tiles) > Region (region-specific summary, country drill-down tiles) > Country (country-specific summary, no further drill-down). Breadcrumb navigation enables upward traversal. The hierarchy follows AD-7's 11 travel-security regions, not the UN M.49 statistical regions.

- **Trend arrows use a third visual channel.** WS-4.4 introduces colored trend arrows on CategoryCard: red for increasing, green for decreasing, gray for stable. This is intentionally separate from the severity color channel (per-alert) and the priority shape channel (AD-1). Trend is a category-level temporal comparison, not a per-alert property. The three-channel separation (severity=color, priority=shape, trend=colored directional icon) avoids perceptual conflicts by encoding different data types at different scopes.

- **Entry point uses amber accent.** The "THREAT PICTURE" button in CoverageOverviewStats uses a muted amber left border accent (`rgba(255, 179, 71, 0.3)`) to visually associate with the threat/intelligence domain without competing with the severity color system. This differentiates it from the "All" filter button's teal accent and the stat rows' neutral borders.

- **Escape key priority chain extended.** The panel inserts into the existing Escape dismissal priority: INSPECT > Triage > **Geo Panel** > Command Palette. This positions the geo panel as a reference surface (less specific than triage detail, more substantial than the command palette).

### State Architecture

- **All geo summary state lives in `coverage.store.ts`.** Four new fields (`geoSummaryOpen`, `summaryGeoLevel`, `summaryGeoKey`, `summaryType`) and four new actions (`openGeoSummary`, `closeGeoSummary`, `drillDownGeo`, `setSummaryType`) extend the existing coverage store. This follows the project convention: the coverage store manages "data filtering & view modes" (transient panel state like `selectedBundleId`), while the UI store manages "animation & navigation state" (morph state machine).

- **Panel state preserves navigation context on close.** `closeGeoSummary()` sets `geoSummaryOpen` to `false` but retains `summaryGeoLevel`, `summaryGeoKey`, and `summaryType`. Reopening the panel returns to the user's last position in the hierarchy. This matches the `preFlyCamera` pattern where camera position is preserved across operations.

- **Mutual exclusion is bidirectional.** Direction 1: morph starts while geo panel is open -- a `useEffect` in GeoSummaryPanel reactively calls `closeGeoSummary()` when `morphPhase` leaves `'idle'`. Direction 2: geo panel opens during morph -- `openGeoSummary` reads `useUIStore.getState().morph.phase` and is a no-op when not `'idle'`. Direction 1 uses reactive component-level coordination (Strategy B); Direction 2 uses a synchronous guard in the store action. Neither creates a cross-store write dependency.

- **No URL sync for geo panel state.** Unlike category filters and view modes, the geo panel's drill-down state is not synced to URL parameters. This is a deliberate decision: the panel is an ephemeral overlay, and deep-linking to a specific geo level has limited user value. This can be revisited without changing the store shape.

---

## 3. Cross-Workstream Conflicts

Six conflicts identified. All are specification inconsistencies resolvable at implementation time without architectural changes.

### Conflict 1: `TrendDirection` type defined in two locations

**SOWs involved:** WS-4.1, WS-4.4

**WS-4.1 specifies (Section 4.1):**
> `TrendDirection = 'up' | 'down' | 'stable'` defined in `src/hooks/use-threat-picture.ts` and exported for downstream consumption.

**WS-4.4 specifies (Section 4.1):**
> `TrendDirection = 'up' | 'down' | 'stable'` defined in `src/lib/interfaces/coverage.ts` alongside `SeverityLevel` and `CategoryMeta`.

**Nature of conflict:** Two SOWs define the identical type in different files. If both are implemented literally, there would be two `TrendDirection` exports, and consumers would need to choose which to import. TypeScript would treat them as structurally identical but nominally distinct.

**Resolution:** Define `TrendDirection` in `src/lib/interfaces/coverage.ts` (WS-4.4's location). This is the canonical location for shared foundation types used across multiple hooks and components. WS-4.1's hook file should `import type { TrendDirection } from '@/lib/interfaces/coverage'` rather than re-declaring it. This is consistent with how `SeverityLevel` and `OperationalPriority` live in `interfaces/coverage.ts` and are imported by hooks.

**Owner:** react-developer, resolved at WS-4.1 implementation time (since WS-4.4 depends on WS-4.1, the type must exist before either completes).

---

### Conflict 2: `GeoLevel` type defined in two locations

**SOWs involved:** WS-4.2, WS-4.6

**WS-4.2 specifies (Section 4.1):**
> `GeoLevel = 'world' | 'region' | 'country'` defined in `src/hooks/use-geo-summaries.ts` as a local type.

**WS-4.6 specifies (Section 4.1):**
> `GeoLevel = 'world' | 'region' | 'country'` defined in `src/lib/interfaces/coverage.ts` alongside `GEO_REGION_KEYS` and `GEO_REGION_META`.

**Nature of conflict:** Same type, two files. WS-4.2 uses `GeoLevel` for query key parameterization; WS-4.6 uses it for store field typing. Both need the same type.

**Resolution:** Define `GeoLevel` in `src/lib/interfaces/coverage.ts` (WS-4.6's location). This is the authoritative location for the geographic type system (it also houses `GeoRegionKey`, `SummaryType`, `GEO_REGION_KEYS`). WS-4.2 imports it from there.

**Owner:** react-developer. Since WS-4.6 has no intra-phase dependencies and should be built first, the type will exist in `interfaces/coverage.ts` before WS-4.2 begins.

---

### Conflict 3: `ThreatLevel` type defined in two locations

**SOWs involved:** WS-4.2, WS-4.3

**WS-4.2 specifies (Section 4.1):**
> `ThreatLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL'` defined in `src/hooks/use-geo-summaries.ts` as part of the `GeoSummary` type system.

**WS-4.3 specifies (Section 4.5 -- THREAT_LEVEL_CONFIG):**
> `ThreatLevel` defined within `src/components/coverage/GeoSummaryPanel.tsx` as part of `THREAT_LEVEL_CONFIG` constant with color mappings for each level.

**Nature of conflict:** WS-4.2 defines the type for data representation; WS-4.3 defines it for visual rendering configuration. Both use the same five-member union but in different files.

**Resolution:** Define `ThreatLevel` in `src/lib/interfaces/coverage.ts` (following the pattern established by Conflicts 1 and 2). Both WS-4.2 and WS-4.3 import from there. WS-4.3's `THREAT_LEVEL_CONFIG` can remain component-local (it maps `ThreatLevel` to visual properties, which is a rendering concern), but the type itself should be shared.

**Owner:** react-developer. Add `ThreatLevel` to `interfaces/coverage.ts` during WS-4.6 (the first workstream to modify that file).

---

### Conflict 4: Geographic region constants duplicated with different structures

**SOWs involved:** WS-4.3, WS-4.6

**WS-4.6 specifies (Section 4.1):**
> `GEO_REGION_KEYS` (11-entry `as const` array) and `GEO_REGION_META` (Record with `displayName` and `shortName` per region) defined in `src/lib/interfaces/coverage.ts`.

**WS-4.3 specifies (Section 4.3 -- GEO_REGIONS):**
> `GEO_REGIONS` constant defined inside `GeoSummaryPanel.tsx` as an array of `{ key, name, notableCountries: string[] }` objects. The `notableCountries` field does not appear in WS-4.6.

**Nature of conflict:** Two different constant structures for the same 11 regions. WS-4.6 uses a `Record<GeoRegionKey, { displayName, shortName }>` without country data. WS-4.3 uses an array with `notableCountries` for fallback country tile rendering. The region key strings and display names may also have minor inconsistencies (e.g., `'sub-saharan-africa'` in WS-4.6 vs potential naming differences in WS-4.3).

**Resolution:** Use WS-4.6's `GEO_REGION_KEYS` and `GEO_REGION_META` as the single source of truth for region identity and display names (defined in `interfaces/coverage.ts`). For WS-4.3's `notableCountries` need, extend `GEO_REGION_META` with an optional `notableCountries?: string[]` field, or define a panel-local `REGION_NOTABLE_COUNTRIES: Record<GeoRegionKey, string[]>` map that references the shared keys. The second approach is cleaner -- country lists are a rendering concern specific to the panel's drill-down tiles, not a shared data contract.

**Owner:** react-developer, resolved during WS-4.3 implementation (WS-4.6 delivers the base constants first).

---

### Conflict 5: `RiskTrend` vs `TrendDirection` -- two different trend vocabularies

**SOWs involved:** WS-4.1, WS-4.2

**WS-4.1 specifies:**
> `TrendDirection = 'up' | 'down' | 'stable'` -- used for category, region, and overall trends in the threat picture.

**WS-4.2 specifies (Section 4.1 -- `RiskTrend`):**
> `RiskTrend = 'increasing' | 'stable' | 'decreasing'` -- used in `GeoSummary.riskTrend` for the geo summary's overall risk trajectory.

**Nature of conflict:** Two different string unions represent the same concept (directional trend comparison). `'up'` vs `'increasing'`, `'down'` vs `'decreasing'` -- semantically identical but lexically different. If both types coexist, converting between them requires mapping logic, and consumers must know which vocabulary a given data source uses.

**Resolution:** Standardize on one vocabulary. `TrendDirection` (`'up' | 'down' | 'stable'`) from WS-4.1 is the simpler, more compact form and has wider usage (3 interfaces in WS-4.1, plus WS-4.4). WS-4.2's `RiskTrend` should be renamed to `TrendDirection` and use `'up' | 'down' | 'stable'`. If the backend `/console/summaries` endpoint returns `'increasing'`/`'decreasing'`, the normalizer in `useGeoSummaries` should map those strings to `'up'`/`'down'` during normalization, following the established snake_case-to-camelCase transform pattern.

**Owner:** react-developer, resolved during WS-4.2 implementation. If the backend vocabulary is `'increasing'`/`'decreasing'`, add a mapping step in the normalizer.

---

### Conflict 6: WS-4.3 references WS-4.1/WS-4.2 fields that do not match their actual definitions

**SOWs involved:** WS-4.1, WS-4.2, WS-4.3

**WS-4.3 references (Section 4.10 -- CategoryBreakdownChart):**
> Renders "threats by category" using data that it accesses as `countsByCategory` or similar field names from the threat picture or geo summary.

**WS-4.1 defines (Section 4.6 -- ThreatPicture):**
> The field is `byCategory: ThreatCategoryCount[]` -- an array of `{ category, count, trend }` objects.

**WS-4.2 defines (Section 4.1 -- StructuredBreakdown):**
> `StructuredBreakdown` uses `Record<string, number>` for category counts and `Record<string, number>` for severity distribution. WS-4.3 assumes these are arrays.

**Nature of conflict:** WS-4.3 was written with assumed field names and structures from WS-4.1 and WS-4.2. The actual type definitions differ in both naming and shape. For example, WS-4.3 may reference `countsByCategory` where WS-4.1 provides `byCategory`, and WS-4.3 assumes arrays for structured breakdown data where WS-4.2 provides `Record` types.

**Resolution:** WS-4.3 must adapt to the actual types defined by WS-4.1 and WS-4.2 at implementation time. Since WS-4.3 depends on both hooks, the implementer will have the real type definitions available and can adjust field access accordingly. The panel's sub-components (CategoryBreakdownChart, SeverityDistributionBar, etc.) accept narrow props interfaces -- only the data mapping layer in the main component needs to change. This is a specification-time assumption mismatch, not an architectural conflict.

**Owner:** react-developer, resolved during WS-4.3 implementation.

---

## 4. Architecture Decisions

Consolidated from all six workstreams. Decisions are grouped thematically.

| ID | Decision | Source | Rationale |
|----|----------|--------|-----------|
| **Data Layer** | | | |
| WS-4.1 D-1 | All threat picture types defined in the hook file, not in `interfaces/coverage.ts`. | WS-4.1 | Follows established pattern: `IntelFeedItem` in `use-intel-feed.ts`, `CategoryIntelItem` in `use-category-intel.ts`. Types live with their producing hook. Only shared foundation types live in interfaces. *(Cross-ref Conflict 1: `TrendDirection` is the exception -- it is a shared foundation type.)* |
| WS-4.1 D-2 | Single `queryKey: ['threat-picture']` without nested segments. | WS-4.1 | Endpoint takes no parameters. No parameterized variants exist. Flat key avoids false namespace hierarchy. |
| WS-4.1 D-3 | `staleTime: 90_000` (90s) with `refetchInterval: 120_000` (120s). | WS-4.1 | 75% stale-to-poll ratio: remounts within 90s get cached data instantly; after 90s, stale data + background refetch. Consistent with `useCoverageMetrics` (45s/60s) and `useIntelFeed` (20s/30s). |
| WS-4.1 D-5 | `TrendDirection` is a standalone exported type, not inlined. | WS-4.1 | Reused by 3 interfaces and WS-4.4's trend arrow. Named type enables `switch` exhaustiveness checks. |
| WS-4.1 D-6 | Region field is `string`, not a union of 11 region identifiers. | WS-4.1 | Region list may evolve on the backend. Hardcoding creates deployment coupling. `getCategoryMeta()`-style fallback pattern is established. |
| WS-4.1 D-7 | Use `as TrendDirection`/`as SeverityLevel`/`as OperationalPriority` casts (no runtime validation). | WS-4.1 | Follows WS-1.1 D-4 convention. All existing normalizers use casts. Zod would be inconsistent. |
| WS-4.2 D-1 | Parameterized query key factory `GEO_SUMMARY_QUERY_KEYS`. | WS-4.2 | Enables targeted cache lookup (`['geo-summary', 'latest', level, key, type]`) and broad invalidation (`['geo-summary']`). New pattern in codebase but well-established in TanStack Query ecosystem. |
| WS-4.2 D-2 | `placeholderData: keepPreviousData` for geo summary hook. | WS-4.2 | Prevents flash-to-loading during hierarchy drill-down. Previous summary remains visible until new data loads. |
| WS-4.2 D-3 | Defensive `JSON.parse` for `structured_breakdown` field. | WS-4.2 | Field may arrive as string or parsed object depending on PostgreSQL column type and API serialization. `typeof` guard handles both. |
| **Visual Design** | | | |
| WS-4.3 D-1 | Panel width is 560px (wider than triage 380px, narrower than full-screen). | WS-4.3 | Accommodates 2-column region grid and category bar charts. Leaves ~61% of viewport visible at 1440px. |
| WS-4.3 D-2 | Sub-components defined in the same file. | WS-4.3 | ThreatLevelBadge, GeoBreadcrumb, CategoryBreakdownChart, etc. share types and constants. Single file keeps colocation tight. Extract to directory if >1000 lines. |
| WS-4.3 D-3 | Native `<details>`/`<summary>` for "What's Changed" collapsible. | WS-4.3 | Free keyboard support, screen reader state announcement, zero JS cost. CSS transitions provide subtle animation. |
| WS-4.3 D-4 | Plain `<div>` elements with percentage widths for charts. | WS-4.3 | Two simple bar charts do not justify a charting library (50-200KB). Full styling control for monospace/glass aesthetic. |
| WS-4.3 D-5 | Focus trapped within panel while open (`aria-modal="false"`). | WS-4.3 | Prevents Tab from escaping into spatial canvas. `aria-modal="false"` is truthful -- underlying content is not inert and remains mouse-interactive. |
| WS-4.3 D-6 | Panel auto-closes when district view opens. | WS-4.3 | z-42 panel on top of z-30 full-screen district would obscure district dock panel (same right edge). Different information needs -- user should focus on one at a time. |
| WS-4.3 D-7 | Geo panel Escape priority between triage and command palette. | WS-4.3 | INSPECT and triage panels are more focused/specific -- close them first. Geo panel is broader reference. |
| WS-4.3 D-8 | 11 geographic regions hardcoded as client constant. | WS-4.3 | Region taxonomy is a product decision (AD-7), not data. Ensures panel renders region tiles even during backend outage. |
| WS-4.3 D-9 | Summary type toggle in the fixed header, not content area. | WS-4.3 | Toggle changes entire panel content (hourly/daily). Must be visible regardless of scroll position. |
| WS-4.4 D-1 | `TrendingUp`/`TrendingDown`/`Minus` icons for trend arrows. | WS-4.4 | Trending icons communicate "over time" semantically. `Minus` avoids conflicting with `ArrowRight` (existing navigation affordance on same card). Minor deviation from combined recommendations that improves clarity. |
| WS-4.4 D-2 | Colored trend arrows as third visual channel. | WS-4.4 | Trend is category-level temporal comparison (different scope than per-alert severity/priority). Three-channel separation: severity=color, priority=shape, trend=colored directional icon. |
| WS-4.4 D-3 | `trend` on `CategoryGridItem` (display type), not `CoverageByCategory` (data type). | WS-4.4 | Preserves separation of data sources. Coverage metrics and trend data come from different endpoints. `buildAllGridItems()` is the join point. |
| WS-4.5 D-1 | Primary placement in CoverageOverviewStats, not NavigationHUD. | WS-4.5 | Stats column is spatially adjacent to map/grid. Zoom-gated to Z1+ (appropriate context for threat briefing). HUD is already dense. |
| WS-4.5 D-2 | CommandPalette secondary entry point, not dedicated keyboard shortcut. | WS-4.5 | Cmd+K is the established keyboard navigation mechanism. Adding Ctrl+T increases shortcut surface without proportional benefit. Synonym ring makes it discoverable. |
| WS-4.5 D-3 | Callback prop `onOpenThreatPicture` rather than direct store call. | WS-4.5 | CoverageOverviewStats is a presentational component with callback props (`onClearFilter`). Direct store call would break this pattern. |
| WS-4.5 D-4 | Amber left border accent for THREAT PICTURE button. | WS-4.5 | Differentiates from "All" button's teal accent. Amber connotes advisory/intelligence in the design system. |
| **State Architecture** | | | |
| WS-4.6 D-1 | All geo summary state in `coverage.store.ts`, not `ui.store.ts`. | WS-4.6 | Geo panel is a data view surface (like bundle detail or priority feed), not an animation construct. Two-store boundary preserved. |
| WS-4.6 D-2 | `openGeoSummary` defaults to `('world', 'world')` but preserves prior state on reopen. | WS-4.6 | First open shows World overview. Subsequent reopens resume the user's last position. Caller decides: no args to resume, explicit args to reset. |
| WS-4.6 D-3 | Reactive mutual exclusion at component layer (Strategy B). | WS-4.6 | Strategy A (cross-store write in `startMorph`) violates store boundary. Strategy B (`useEffect` in GeoSummaryPanel) coordinates at the component layer where both stores are already consumed. |
| WS-4.6 D-4 | `closeGeoSummary` preserves level/key/type. | WS-4.6 | Closing is not resetting. User's position in geo hierarchy is working context. Matches `preFlyCamera` preservation pattern. |
| WS-4.6 D-5 | `openGeoSummary` guards via `useUIStore.getState()` read. | WS-4.6 | Read-only cross-store access for guard condition. Precedented by `selectMapAlert` reading `useCameraStore.getState()`. |
| WS-4.6 D-6 | Region keys are kebab-case strings, not numeric IDs. | WS-4.6 | Human-readable in logs and API calls. Self-documenting in code. |
| WS-4.6 D-7 | Country-level keys are ISO 3166-1 alpha-2 codes, validated by API not store. | WS-4.6 | 249 country codes is too large for client-side bundle validation. 11 region keys are cheap to validate. |
| WS-4.6 D-8 | `setSummaryType` is an explicit setter, not a toggle. | WS-4.6 | Matches `setPriorityFeedExpanded(open)` pattern (WS-2.6 D-3). Callers know their intent. Avoids race conditions. |

---

## 5. Cross-Workstream Dependencies

```
Phase 0 Deliverables
  WS-0.1 (simplified stats) ──────────────────┐
  WS-0.2 (OperationalPriority type) ─────────┐|
                                              ||
Backend Phase D ─────────────────────────┐    ||
  D.6 (/console/threat-picture)          |    ||
  D.? (/console/summaries)               |    ||
                                         |    ||
                                         v    vv
  WS-4.6 (Coverage Store Extensions)   WS-4.1 (useThreatPicture Hook)
    |                                    |  \
    |                              WS-4.2 (useGeoSummaries Hook)
    |                                |   |
    |                                |   v
    |                                | WS-4.4 (Trend Indicators)
    |                                |
    v                                v
  WS-4.5 (Entry Point)            WS-4.3 (GeoSummaryPanel)
    |                                ^
    +--------------------------------+
```

**Detailed dependency table:**

| Upstream | Downstream | What Is Needed | Nature |
|----------|-----------|----------------|--------|
| WS-0.1 | WS-4.5 | Simplified CoverageOverviewStats with vertical space for THREAT PICTURE button | Hard -- button placement depends on post-WS-0.1 layout |
| WS-0.2 | WS-4.1 | `OperationalPriority` type for `PriorityBreakdown.priority` field | Hard -- imported in the hook file |
| Backend D.6 | WS-4.1 | `GET /console/threat-picture` endpoint returning aggregated threat data | Soft -- hook can be built against mock data; connect when endpoint lands |
| Backend D.? | WS-4.2 | `GET /console/summaries` endpoint with geo-parameterized summary data | Soft -- hook can be built against mock data |
| WS-4.1 | WS-4.3 | `ThreatPicture` type, `useThreatPicture` hook, `emptyThreatPicture` utility | Hard -- panel displays threat picture data in charts |
| WS-4.1 | WS-4.4 | `ThreatCategoryCount` type with per-category `trend` field | Hard -- trend arrows driven by threat picture data |
| WS-4.2 | WS-4.3 | `GeoSummary` type, `useLatestGeoSummary`/`useGeoSummaryHistory` hooks | Hard -- panel displays AI-generated summaries |
| WS-4.6 | WS-4.3 | `geoSummaryOpen`, `summaryGeoLevel`, `summaryGeoKey`, `summaryType` state; `closeGeoSummary`, `drillDownGeo`, `setSummaryType` actions | Hard -- panel reads state, calls actions for navigation |
| WS-4.6 | WS-4.5 | `openGeoSummary` action for the THREAT PICTURE button click handler | Hard -- button calls the action to open the panel |

**Critical path:** WS-4.6 -> WS-4.3 (store must exist before panel can read it)

**Secondary critical path:** WS-4.1 -> WS-4.3 (threat picture data for charts) and WS-4.2 -> WS-4.3 (geo summary data for narrative content)

**Independent tracks:**
- WS-4.6 has no intra-phase dependencies. Start first.
- WS-4.1 and WS-4.2 depend only on Phase 0 and backend Phase D (soft). Build in parallel after WS-4.6.
- WS-4.4 depends only on WS-4.1. Can be built as soon as WS-4.1 completes.
- WS-4.5 depends on WS-0.1 and WS-4.6. Can be built after WS-4.6 completes.
- WS-4.3 depends on WS-4.1, WS-4.2, and WS-4.6. Build last.

**External dependencies:**

| Dependency | Required By | Status | Risk |
|------------|-------------|--------|------|
| `OperationalPriority` type (WS-0.2) | WS-4.1 | Phase 0 deliverable | LOW -- Phase 4 starts after Phase 0 per sequencing |
| Simplified stats (WS-0.1) | WS-4.5 | Phase 0 deliverable | LOW -- button can be added to pre-WS-0.1 component with layout adjustment |
| `/console/threat-picture` endpoint (D.6) | WS-4.1 | Backend Phase D, ~7-10 days | HIGH -- WS-4.1 R-1. Build with mock data, connect when endpoint lands |
| `/console/summaries` endpoint | WS-4.2 | Backend Phase D | HIGH -- WS-4.2 has 7 open questions about endpoint behavior |

---

## 6. Consolidated Open Questions

Questions from all six workstreams, deduplicated and grouped. Blocking questions are flagged.

### BLOCKING -- must be resolved before implementation begins

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-B1 | What is the exact JSON shape of `GET /console/threat-picture`? The API type in WS-4.1 deliverable 4.7 is a best-guess. Confirm field names (especially `by_category`, `by_severity`, `by_priority`, `by_region`), nesting, and whether trend strings are lowercase. | WS-4.1 OQ-1 + OQ-6 | Backend team |
| OQ-B2 | What is the exact JSON shape of `GET /console/summaries`? Confirm: (a) endpoint path and query parameters (`geo_level`, `geo_key`, `summary_type`), (b) `structured_breakdown` field type (JSON object vs string), (c) whether `risk_trend` values are `'increasing'`/`'decreasing'` or `'up'`/`'down'`, (d) whether delta/changes data is a separate field or derived from comparing two summaries. | WS-4.2 OQ-1 through OQ-7 | Backend team |

### NON-BLOCKING -- can be resolved during or after implementation

**Data shape questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-1 | Does `by_severity` in the threat picture include all 5 severity levels even when count is 0, or only non-zero levels? | WS-4.1 OQ-2 | Backend team |
| OQ-2 | Does `by_priority` include all 4 priority levels (P1-P4) even when count is 0? | WS-4.1 OQ-3 | Backend team |
| OQ-3 | What time window does the backend use for trend comparison (e.g., last 24h vs previous 24h)? Are `period_start`/`period_end` included in the response? | WS-4.1 OQ-4 | Backend team |
| OQ-4 | Should the `useThreatPicture` hook accept an `enabled` flag? It is always fetched when any consumer mounts (120s poll, single GET). | WS-4.1 OQ-5 | react-developer |
| OQ-5 | What is the exact field name for per-category trend data? WS-4.4 assumes `trendByCategory` but WS-4.1 defines `byCategory` with trend embedded in each entry. | WS-4.4 Q-1 (linked to Conflict 6) | react-developer |

**Geo panel behavior questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-6 | How should the panel handle regions with no country-level summary data? Show `notableCountries` with "No summary available" badges, or show only countries with data? | WS-4.3 Q-2 | UX advisory |
| OQ-7 | Should the panel maintain navigation state across open/close cycles? (Currently specified: yes, per WS-4.6 D-4.) | WS-4.3 Q-3 | UX advisory |
| OQ-8 | "What's Changed" empty state: show "No changes in the last hour" message, or hide the section entirely? (Currently specified: show the message.) | WS-4.3 Q-4 | UX advisory |
| OQ-9 | Should the threats-by-category chart use geo-filtered counts or global threat picture counts? At region/country level, the chart should presumably show only local counts. | WS-4.3 Q-5 | WS-4.2 implementer |
| OQ-10 | Focus trap implementation: add `focus-trap-react` (~4KB) or custom implementation? No focus trap library is currently in the dependency tree. | WS-4.3 Q-6 | react-developer |
| OQ-11 | Should `openGeoSummary` close the `priorityFeedExpanded` panel? They are in different spatial layers (viewport-fixed vs world-space). Current decision: no mutual exclusion. | WS-4.6 OQ-4.6.1 | react-developer |
| OQ-12 | When morph triggers reactive close, should the panel animate closed (300ms slide-out) or snap closed immediately? | WS-4.6 OQ-4.6.2 | react-developer |
| OQ-13 | Should `drillDownGeo('world', 'world')` be the canonical "navigate up" pattern, or should there be a dedicated `drillUpGeo()` action? | WS-4.6 OQ-4.6.3 | react-developer |
| OQ-14 | Should the THREAT PICTURE button always reset to World, or resume the user's last position? (Current recommendation: no-arg call to resume.) | WS-4.6 OQ-4.6.4 | react-developer |

**Entry point questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-15 | Should the THREAT PICTURE button show a loading indicator while threat picture data is fetching? The button has no data dependency -- it only triggers panel open. | WS-4.5 Q-1 | UX / react-developer |
| OQ-16 | Should the CommandPalette "Threat Picture" command be available when the panel is already open? | WS-4.5 Q-2 | react-developer |
| OQ-17 | Does the 4-row stats layout (3 existing rows + separator + button) make the column too tall? | WS-4.5 Q-3 | IA specialist |

**Trend indicator questions:**

| ID | Question | Source | Assigned To |
|----|----------|--------|-------------|
| OQ-18 | Should trend arrows include a tooltip showing magnitude of change (e.g., "+4 from previous period")? | WS-4.4 Q-2 | Product / IA specialist |
| OQ-19 | What time window defines "previous period" for trend comparison? | WS-4.4 Q-3 | Backend / WS-4.1 |

**Deferred questions:**

| ID | Question | Source | Target |
|----|----------|--------|--------|
| OQ-D1 | Should the country-level panel include a small inline map? | WS-4.3 Q-7 | Post-Phase 4 |

**Summary:** Two blocking questions (OQ-B1 and OQ-B2) require backend team confirmation of API response shapes before implementation can be fully validated. All other questions are non-blocking -- the SOWs provide default answers that can be adjusted during implementation or integration testing.

---

## 7. Phase Exit Criteria

All criteria must pass before Phase 4 is considered complete.

| ID | Criterion | Verification |
|----|-----------|-------------|
| PE-1 | `useThreatPicture` hook exists at `src/hooks/use-threat-picture.ts` with `'use client'` directive, `queryKey: ['threat-picture']`, `refetchInterval: 120_000`, `staleTime: 90_000`. | Code review + `pnpm typecheck`. |
| PE-2 | `useThreatPicture` returns a normalized `ThreatPicture` with `totalActiveAlerts`, `byCategory`, `bySeverity`, `byPriority`, `byRegion`, `overallTrend`, `generatedAt`, `periodStart`, `periodEnd`. All snake_case API fields mapped to camelCase. | Code review of `fetchThreatPicture` normalizer. |
| PE-3 | `emptyThreatPicture()` returns a valid zero-valued `ThreatPicture` for loading/error fallback. | TypeScript assignability check. |
| PE-4 | `useLatestGeoSummary(level, key)` hook exists at `src/hooks/use-geo-summaries.ts` with parameterized query key factory, `refetchInterval: 120_000`, `staleTime: 60_000`, `placeholderData: keepPreviousData`. | Code review + `pnpm typecheck`. |
| PE-5 | `useGeoSummaryHistory(level, key, type)` hook exists for on-demand history fetching (no polling). | Code review. |
| PE-6 | `GeoSummaryPanel` renders as a 560px-wide slide-over from the right edge at `z-index: 42`, with spring animation (stiffness: 300, damping: 30). | DOM inspection + visual verification. |
| PE-7 | `prefers-reduced-motion: reduce` disables the slide animation. | Enable reduced motion; panel opens/closes instantly. |
| PE-8 | Geo breadcrumb displays correctly for all three levels: "World", "World > Middle East", "World > Middle East > Turkey". Clicking ancestor segments navigates up. | Manual navigation test at each level. |
| PE-9 | Threat level badge (LOW/MODERATE/ELEVATED/HIGH/CRITICAL) renders with correct color coding. Screen reader announces "Current threat level: [LEVEL]". | Visual + screen reader verification. |
| PE-10 | Summary type toggle switches between "hourly" and "daily" views, triggering data refetch. | Toggle switch; verify content changes; network tab confirms new API request. |
| PE-11 | At world level, 11 region drill-down tiles display in a 2-column grid. Clicking a tile navigates to region-level summary. | Count tiles (11); verify 2-column layout; click a tile. |
| PE-12 | At region level, country drill-down tiles display. Clicking a tile navigates to country-level summary. | Click a country tile; breadcrumb shows three levels. |
| PE-13 | Pressing Escape closes the panel. Escape priority: INSPECT > triage > **geo panel** > command palette. | Open geo panel + triage; Escape closes triage first, second Escape closes geo panel. |
| PE-14 | Geo panel and district overlay are mutually exclusive. Opening district view auto-closes geo panel. Opening geo panel during morph is blocked. | Open geo panel, click category card -- panel closes. During morph, THREAT PICTURE button is inert. |
| PE-15 | Loading state shows skeleton UI with shimmer animation. | Observe panel opening before data loads. |
| PE-16 | Error state shows error message with functional "Retry" button. | Simulate API error; verify error UI; click Retry. |
| PE-17 | Empty state shows "No summary available" with explanatory text. | Test with backend returning empty summary. |
| PE-18 | Focus moves to close button on panel open. Tab cycles through panel elements. Focus trapped within panel. | Open panel; verify focus on close button; Tab through all elements; Tab wraps. |
| PE-19 | CategoryCard trend arrows display: red `TrendingUp` for `'up'`, green `TrendingDown` for `'down'`, gray `Minus` for `'stable'`. No arrow when threat picture data is unavailable. | Visual inspection with threat picture data; visual inspection without data. |
| PE-20 | Trend arrows are 14px, vertically centered with alert count, with `aria-hidden="true"`. Card `aria-label` includes trend text when available. | DOM inspection + screen reader verification. |
| PE-21 | "THREAT PICTURE" button renders in CoverageOverviewStats below the Categories row, with Globe icon, amber left border accent, and ChevronRight affordance. | Visual inspection at Z1+ zoom. |
| PE-22 | Clicking THREAT PICTURE button calls `openGeoSummary()` and opens the GeoSummaryPanel at World level. | Click button; panel opens with World summary. |
| PE-23 | CommandPalette includes "Threat Picture" entry in Navigation group, findable via synonyms ("geo summary", "briefing", "sitrep"). | Cmd+K, type each synonym; command appears. |
| PE-24 | `coverage.store.ts` exposes `geoSummaryOpen`, `summaryGeoLevel`, `summaryGeoKey`, `summaryType` with correct defaults (`false`, `'world'`, `'world'`, `'daily'`). | Store inspection or unit test. |
| PE-25 | `openGeoSummary('region', 'invalid-key')` is a no-op. `openGeoSummary()` during non-idle morph is a no-op. | Unit test or manual verification. |
| PE-26 | `GeoLevel`, `GeoRegionKey`, `SummaryType`, and `TrendDirection` types are exported from `src/lib/interfaces/coverage.ts`. `GEO_REGION_KEYS` contains exactly 11 entries. | `pnpm typecheck` + code review. |
| PE-27 | Panel root has `role="dialog"` and `aria-label="Geographic threat summary"`. Breadcrumb uses `<nav aria-label="Geographic breadcrumb">` with `<ol>`/`<li>`. | DOM inspection. |
| PE-28 | `pnpm typecheck` passes with zero errors. | CLI verification. |
| PE-29 | `pnpm build` completes without errors. | CLI verification. |

---

## 8. Inputs Required by Next Phase

These artifacts or decisions must be finalized during Phase 4 to unblock subsequent work.

| Input | Produced By | Consumed By | Description |
|-------|-------------|-------------|-------------|
| `ThreatPicture` type | WS-4.1 | Future geographic intelligence surfaces (region overlays, country detail pages) | Stable type contract for aggregated threat data. |
| `TrendDirection` type | WS-4.4 (canonical in interfaces) | Any component needing directional trend display. | Foundation type for temporal comparisons. |
| `GeoLevel` / `GeoRegionKey` / `SummaryType` types | WS-4.6 | Any geographic navigation or filtering feature. | Foundation types for the geographic hierarchy. |
| `GEO_REGION_KEYS` / `GEO_REGION_META` constants | WS-4.6 | Map region overlays (Phase 6), region-specific alert filtering, geographic search scoping. | Canonical source for the 11 travel-security regions. |
| `isValidGeoRegionKey()` / `getGeoDisplayName()` helpers | WS-4.6 | Any component displaying region names or validating region input. | Utility functions for the geographic type system. |
| `openGeoSummary()` / `closeGeoSummary()` store actions | WS-4.6 | Future entry points (e.g., map region click -> open panel for that region, alert detail -> "View region summary" link). | Store interface for programmatic panel control. |
| `GEO_SUMMARY_QUERY_KEYS` factory | WS-4.2 | Any future hook that invalidates geo summary caches. | Query key factory for cross-hook cache coordination. |
| `ThreatLevel` type + `THREAT_LEVEL_CONFIG` | WS-4.2/WS-4.3 | Any component displaying threat level badges or colors. | Shared type and visual config for 5-level threat assessment. |
| `GeoSummaryPanel` component interface | WS-4.3 | Page-level integration, future contexts where geo panel is needed. | Component contract: props, z-index, animation behavior. |
| Validated backend API contracts | WS-4.1 + WS-4.2 | Phase 5 (notifications), Phase 6 (maps), future geographic features. | Confirmed endpoint shapes for `/console/threat-picture` and `/console/summaries`. |

---

## 9. Gaps and Recommendations

### Gap 1: No single canonical location for shared Phase 4 types

**Description:** Conflicts 1-3 reveal that `TrendDirection`, `GeoLevel`, and `ThreatLevel` are each defined in two SOWs in different files. No SOW explicitly coordinates with others on where shared types should live. The combined-recommendations document does not prescribe a type placement strategy for Phase 4.

**Recommendation (CTA):** Establish `src/lib/interfaces/coverage.ts` as the canonical location for all Phase 4 foundation types: `TrendDirection`, `GeoLevel`, `GeoRegionKey`, `SummaryType`, and `ThreatLevel`. Add all five during the WS-4.6 implementation (the first workstream to modify this file). WS-4.1 and WS-4.2 import from there rather than defining locally. This consolidation should be done as the first act of Phase 4 implementation.

**Priority:** HIGH -- without this, the implementer must resolve three type duplication conflicts ad hoc.

### Gap 2: Region constant structure mismatch between WS-4.3 and WS-4.6

**Description:** Conflict 4 identifies that WS-4.6 defines `GEO_REGION_META` with `displayName` and `shortName`, while WS-4.3 assumes a `GEO_REGIONS` constant with `notableCountries`. Neither SOW references the other's constant. The panel's country drill-down fallback (when backend returns no countries for a region) depends on having a `notableCountries` list per region.

**Recommendation (CTA):** The `notableCountries` data is a rendering concern specific to WS-4.3, not a shared data contract. Define a panel-local `REGION_NOTABLE_COUNTRIES: Record<GeoRegionKey, string[]>` in `GeoSummaryPanel.tsx` that uses the shared `GeoRegionKey` type from `interfaces/coverage.ts`. This keeps the shared constants lean (identity + display names) while giving the panel the fallback data it needs. If country lists become needed elsewhere, promote to the shared location.

**Priority:** MEDIUM -- affects WS-4.3 implementation only.

### Gap 3: Trend vocabulary conflict between threat picture and geo summaries

**Description:** Conflict 5 identifies that WS-4.1 uses `'up'`/`'down'`/`'stable'` while WS-4.2 uses `'increasing'`/`'decreasing'`/`'stable'` for semantically identical trend data. The backend endpoints may use different vocabularies, creating a normalization need.

**Recommendation (CTA):** Standardize on `TrendDirection = 'up' | 'down' | 'stable'` as the single frontend vocabulary (it is more compact and has wider usage). If the `/console/summaries` backend returns `'increasing'`/`'decreasing'`, the WS-4.2 normalizer maps them during the snake_case-to-camelCase transform -- this is exactly what the normalization layer is for. Document the mapping explicitly in the `fetchLatestGeoSummary` function.

**Priority:** MEDIUM -- a normalization concern, not an architectural one.

### Gap 4: WS-4.3 API shape assumptions are not verified against WS-4.1/WS-4.2 definitions

**Description:** Conflict 6 identifies that WS-4.3's visual specifications reference field names and data structures that do not precisely match WS-4.1's `ThreatPicture` or WS-4.2's `GeoSummary` type definitions. For example, WS-4.3 assumes array-based structured breakdown data where WS-4.2 may use Records, and field names like `countsByCategory` where WS-4.1 has `byCategory`.

**Recommendation (SPO):** This is expected in multi-SOW phases where specifications are written in parallel. The WS-4.3 implementer should treat WS-4.1 and WS-4.2's type definitions as authoritative and adapt the panel's data-mapping layer accordingly. The panel's sub-components accept narrow props interfaces (bar width, count number, event object), so the adaptation is localized to the main component's render function. No architectural change is needed.

**Priority:** LOW -- expected specification-time gap that resolves naturally at implementation time.

### Gap 5: No test infrastructure for Phase 4 deliverables

**Description:** Consistent with Phases 1-3, no SOW includes a test plan. WS-4.6 defines 24 acceptance criteria with verification methods including "unit test" references, but `pnpm test:unit` is not confirmed as configured. The coverage store extensions (WS-4.6) are particularly amenable to unit testing -- pure state mutations with deterministic inputs and outputs.

**Recommendation (PMO):** If Vitest was set up during Phase 0, write targeted tests for:
- **WS-4.6:** Store action behavior (open/close/drill-down), region key validation, mutual exclusion guard, state preservation on close.
- **WS-4.1:** Normalizer field mapping, `emptyThreatPicture()` validity.
- **WS-4.2:** Query key factory output, defensive JSON.parse for structured_breakdown.

If Vitest is not available, verification is via `pnpm typecheck`, `pnpm build`, and manual testing -- adequate but suboptimal for a phase with 29 exit criteria.

**Priority:** MEDIUM -- WS-4.6's store actions are the best candidates for unit testing in the entire project.

### Gap 6: Backend Phase D timeline risk

**Description:** WS-4.1 and WS-4.2 depend on backend endpoints that are estimated at 7-10 days into backend Phase D work. If Phase 4 frontend begins on Day 10 per the combined-recommendations schedule, the backend endpoints may not be ready. Both SOWs acknowledge this risk (WS-4.1 R-1, WS-4.2 R-1) and propose building with mock data.

**Recommendation (PMO):** Sequence frontend Phase 4 to start with WS-4.6 (no backend dependency) and WS-4.4/WS-4.5 (no data hook dependency on backend -- they depend on WS-4.1 types, not live data). WS-4.1 and WS-4.2 can be built with `emptyThreatPicture()` and mock `GeoSummary` data. WS-4.3 can be built with static mock data for all visual states (loading, error, empty, populated). The entire phase can be completed without a live backend, then validated during integration testing when Phase D endpoints land. This eliminates the backend timing risk from the frontend critical path.

**Priority:** HIGH -- the combined-recommendations schedule assumes backend Phase D is partially complete by Day 10.

### Gap 7: No specification for mobile/narrow viewport behavior

**Description:** WS-4.3 D-1 notes that at 1280px viewport width, the 560px panel consumes ~44% of the viewport. No SOW addresses behavior below 1280px or on mobile viewports. The panel is viewport-fixed (`position: fixed`), so it will overlay most of the spatial canvas on narrow screens.

**Recommendation (CTA):** This viewer targets desktop/tablet analyst workstations (spatial ZUI with pan/zoom is not a mobile-first pattern). Document a minimum supported viewport width of 1280px for the geo panel. If the panel is opened on a viewport narrower than 1280px, consider reducing width to 480px or going full-width. This is a polish concern, not a Phase 4 blocker.

**Priority:** LOW -- desktop-first product with known target audience.

---

## 10. Effort & Sequencing Assessment (PMO)

### Effort Estimates

| Workstream | Size | Estimate | Complexity Drivers |
|------------|------|----------|--------------------|
| WS-4.6 | S | 0.5 days | Extends existing store with 4 fields, 4 actions, 4 selectors. Region constants in interfaces file. Mutual exclusion guard logic. Well-defined scope. No UI. |
| WS-4.1 | S | 0.5 days | Single new file. Follows established hook pattern. Types, normalizer, hook, utility function. Blocked on backend endpoint for live data but buildable against mocks. |
| WS-4.2 | S | 0.5 days | Single new file. Two hooks (`useLatestGeoSummary`, `useGeoSummaryHistory`) with parameterized query keys. Defensive JSON parsing. Blocked on backend endpoint. |
| WS-4.4 | S | 0.5 days | Modify three files. `TrendDirection` type, `CategoryGridItem` extension, `TrendArrow` sub-component, page wiring. Small blast radius. |
| WS-4.5 | M | 0.5-1.0 days | Modify three files. Button component, CommandPalette entry, page wiring. Five interaction states. Depends on WS-0.1 layout. |
| WS-4.3 | L | 2.0-3.0 days | Large new component (~600-800 lines). 10+ sub-components. Three-level hierarchy navigation. Loading/error/empty states. Focus trap. Accessibility. Mutual exclusion wiring. Spring animation. This is the phase's largest and most complex workstream. |

**Total estimate:** 4.5-6.0 developer-days (single developer).

This aligns with the combined-recommendations estimate of "4-6 days" for Phase 4.

### Recommended Sequencing

```
Prerequisite: Phase 0 complete (WS-0.1 + WS-0.2) + OQ-B1/OQ-B2 answered (or mocks prepared)

Day 1:
  1. WS-4.6 -- Coverage store extensions (no dependencies)
     - interfaces/coverage.ts: GeoLevel, GeoRegionKey, SummaryType, TrendDirection,
       ThreatLevel, GEO_REGION_KEYS, GEO_REGION_META, helpers
     - coverage.store.ts: state fields, actions, selectors
     - pnpm typecheck + pnpm build

  2. WS-4.1 -- useThreatPicture hook (depends on WS-0.2 only)
     - src/hooks/use-threat-picture.ts (single new file)
     - Types, normalizer, hook, emptyThreatPicture utility
     - pnpm typecheck + manual verification

Day 2 (morning):
  3. WS-4.2 -- useGeoSummaries hook (depends on WS-0.2 only)
     - src/hooks/use-geo-summaries.ts (single new file)
     - Query key factory, two hooks, normalizer
     - pnpm typecheck + manual verification

Day 2 (afternoon):
  4. WS-4.4 -- Trend indicators on CategoryCard (depends on WS-4.1)
     - CategoryCard.tsx: TrendArrow sub-component, JSX modification
     - interfaces/coverage.ts: CategoryGridItem.trend field
     - page.tsx: trendMap derivation, buildAllGridItems update
     - pnpm typecheck + visual verification

  5. WS-4.5 -- Entry point in stats/HUD (depends on WS-0.1, WS-4.6)
     - CoverageOverviewStats.tsx: THREAT PICTURE button
     - CommandPalette.tsx: Threat Picture command entry
     - page.tsx: handler wiring
     - pnpm typecheck + visual verification

Days 3-5:
  6. WS-4.3 -- GeoSummaryPanel (depends on WS-4.1, WS-4.2, WS-4.6)
     - GeoSummaryPanel.tsx: main component + sub-components
     - Page integration in page.tsx
     - Mutual exclusion useEffect + Escape handler update
     - Loading/error/empty states
     - Focus trap + accessibility
     - Visual verification of all states and drill-down paths

Day 5 (afternoon) or Day 6:
  7. Integration verification
     - Full panel lifecycle: open -> drill down -> drill up -> close -> reopen
     - Mutual exclusion: open panel, start morph -> panel closes
     - Trend arrows on category cards (all three states)
     - THREAT PICTURE button + CommandPalette entry
     - Keyboard navigation: Tab through panel, Escape priority chain
     - Phase exit criteria checklist (29 items)
```

### Parallelization Opportunities

If two developers are available:

- **Developer A:** WS-4.6 -> WS-4.1 -> WS-4.2 (store + data track)
- **Developer B:** (waits for WS-4.6) -> WS-4.5 -> WS-4.4 -> WS-4.3 (UI track)

Developer B can start WS-4.5 as soon as WS-4.6 merges (day 1 afternoon). WS-4.4 can start once WS-4.1 provides the `ThreatPicture` type. WS-4.3 requires both tracks to be complete but is the largest workstream, so Developer B should have it ready by day 4.

This reduces wall-clock time to ~4 days. The handoff points are: `GeoLevel`/`GeoRegionKey` types and `openGeoSummary` action from WS-4.6, `ThreatPicture` type from WS-4.1, and `GeoSummary` type + hooks from WS-4.2.

### Risk-Adjusted Timeline

| Risk | Impact on Timeline | Mitigation |
|------|-------------------|------------|
| Backend `/console/threat-picture` not ready | +0 days (build with mock data) | All hooks are self-contained. Connect when endpoint lands. |
| Backend `/console/summaries` shape differs from assumed types | +0.5 days (normalizer adjustment + WS-4.3 data-mapping fix) | Normalizers and panel sub-components have narrow interfaces. |
| WS-4.3 exceeds 1000 lines, requiring directory extraction | +0.25 days (mechanical refactoring) | Plan for extraction from the start. Use comment headers for sub-components. |
| Focus trap implementation takes longer than expected | +0.25 days | Try custom implementation first (Tab/Shift+Tab interception). Fall back to `focus-trap-react` if edge cases appear. |
| WS-0.1 simplified stats not yet complete | +0.25 days | Build WS-4.5 button against current stats layout. Adjust positioning when WS-0.1 lands. |
| Mutual exclusion timing creates visual glitch | +0.25 days | Test morph + geo panel close timing during WS-4.3. Adjust reactive close to animate or snap based on visual result. |

**Worst-case total:** 6.5 developer-days.

### Resource Conflicts

Phase 4 is independent of Phases 1, 2, and 3. It can execute in parallel with any of those phases if backend dependencies (D.6 and summaries endpoint) are met independently. The only shared resource is the `react-developer` agent. If a single developer is working all phases sequentially, Phase 4 begins after Phases 0-3 complete (approximately day 10-11 per the combined-recommendations schedule).

Phase 4 shares a backend dependency (Phase D) with no other frontend phase. Phase D is estimated to begin after backend Phases A-C, so the timing is independent of frontend progress.

### Definition of Done

Phase 4 is complete when:
1. All 29 Phase Exit Criteria (Section 7) pass.
2. All 6 Cross-Workstream Conflicts (Section 3) are resolved in code.
3. Both BLOCKING Open Questions (Section 6) have been answered by the backend team (or mocks are in place with documented assumptions).
4. `pnpm typecheck` and `pnpm build` pass with zero errors.
5. Gap 1 (type consolidation) is implemented: all shared types live in `interfaces/coverage.ts`.
6. Mutual exclusion between GeoSummaryPanel and DistrictViewOverlay works in both directions.
7. Normal morph regression test confirms no behavioral changes to existing grid-click navigation.
8. Existing UI functionality (grid, map, feed, district view, triage, INSPECT) is unaffected.

---

*End of Phase 4 Overview.*
