# WS-1.1: Archive Current Page

> **Workstream ID:** WS-1.1
> **Phase:** 1 — Foundation
> **Assigned Agent:** `general-purpose`
> **Status:** Draft
> **Created:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Depends On:** None
> **Blocks:** None (all other WS can proceed independently)
> **Resolves:** None

## 1. Objective

Create a preserved copy of the current `src/app/(launch)/page.tsx` before any modifications begin for the Coverage Grid Launch Page project. The archived file serves as a reference for the original tarva-launch spatial ZUI implementation — including the capsule ring layout, morph orchestration, ambient enrichment layers, navigation HUD composition, and evidence ledger placement — so that developers working on subsequent workstreams (WS-1.2 through WS-4.1) can consult the original patterns without relying on git history.

## 2. Scope

### In Scope

| Area | Description |
|------|-------------|
| File copy | Copy `src/app/(launch)/page.tsx` to `src/app/(launch)/page.archived.tsx` verbatim |
| Content verification | Confirm the archived file is a byte-identical copy of the original at time of archival |
| Export removal | Remove the `export default` from the archived file so Next.js does not treat it as a routable page |

### Out of Scope

| Area | Rationale |
|------|-----------|
| Modifying the original `page.tsx` | That is the concern of WS-2.1 (Coverage Grid) and other downstream workstreams |
| Archiving dependent components | Components in `spatial/`, `districts/`, `ambient/`, etc. remain in-place and are not duplicated; only the page-level composition is archived |
| Archiving CSS modules | The imported stylesheets (`atrium.css`, `morph.css`, `constellation.css`, `enrichment.css`, `district-view.css`) are not copied; they remain at their current paths |
| Archiving stores or hooks | Zustand stores and custom hooks are not duplicated; they will be adapted in-place by later workstreams |
| Git branching or tagging | The archive is a file-level copy, not a git tag or branch snapshot |

## 3. Input Dependencies

| Source | What Is Needed | Status |
|--------|----------------|--------|
| `src/app/(launch)/page.tsx` | The current launch page file (375 lines) containing the spatial ZUI composition with SpatialViewport, SpatialCanvas, MorphOrchestrator, EnrichmentLayer, NavigationHUD, CommandPalette, DistrictViewOverlay, EvidenceLedgerDistrict, and Phase3Effects | Available |

## 4. Deliverables

| # | Deliverable | Path |
|---|-------------|------|
| 1 | Archived launch page | `src/app/(launch)/page.archived.tsx` |

The archived file preserves the complete original implementation:

- **Component composition:** `LaunchPage` default export with `SpatialViewport` > `SpatialCanvas` nesting, including DotGrid background (20000x20000 world-space), SectorGrid, EnrichmentLayer with HaloGlow/RangeRings/CoordinateOverlays/ConnectionPaths, MorphOrchestrator with MOCK_CAPSULE_DATA, OrbitalReadouts, RadialGaugeCluster, SystemStatusPanel, FeedPanel, SignalPulseMonitor, ActivityTicker, DeepZoomDetails, EdgeFragments, and EvidenceLedgerDistrict.
- **Fixed overlays:** DistrictViewOverlay, NavigationHUD (with logo, SpatialBreadcrumb, Minimap, logout button), ColorSchemeSwitcher, ZoomIndicator, HorizonScanLine, SessionTimecode, CalibrationMarks, TopTelemetryBar, BottomStatusStrip, and CommandPalette.
- **Hooks and effects:** `usePanPause`, `usePrefersReducedMotion`, `useInitialDistrictFromUrl` (URL query param `?district={id}`), `useKeyboardShortcuts` (Home, Cmd+K, Escape), and `Phase3Effects` (narration cycle, attention choreography, enrichment cycle).
- **State wiring:** Selectors from `useUIStore`, `useAuthStore`, `useSettingsStore` for morph phase, logout, minimap/breadcrumb visibility, and command palette toggling.
- **Style imports:** `atrium.css`, `morph.css`, `constellation.css`, `enrichment.css`, `district-view.css`.

The file will have its `export default` removed (or converted to a non-default export) and a header comment added indicating it is an archive, so Next.js does not route to it.

## 5. Acceptance Criteria

| ID | Criterion | Verification Method |
|----|-----------|---------------------|
| AC-1 | `src/app/(launch)/page.archived.tsx` exists and contains the full original page implementation | File existence check; diff against original (excluding archive header comment and export change) shows no content differences |
| AC-2 | The archived file is not treated as a Next.js route | `pnpm build` succeeds without a duplicate route error; navigating to the launch route still renders the original (or modified) `page.tsx` |
| AC-3 | The original `page.tsx` is unmodified by this workstream | `git diff src/app/(launch)/page.tsx` shows no changes attributable to WS-1.1 |
| AC-4 | TypeScript compilation passes | `pnpm typecheck` completes without errors related to the archived file |

## 6. Decisions Made

| ID | Decision | Rationale | Alternatives Considered |
|----|----------|-----------|------------------------|
| D-14 | Archive to `src/app/(launch)/page.archived.tsx` | Keeps the archive co-located with the file it preserves; the `.archived.tsx` suffix is not a Next.js route convention so it won't create a conflicting route | (a) Git tag — harder to reference inline during development; (b) `docs/` copy — loses IDE import resolution and syntax highlighting context; (c) `page.backup.tsx` — `.archived` is more semantically clear |
| D-1.1a | Remove `export default` from archived file | Prevents Next.js App Router from treating the file as a second page component for the `(launch)` route, which would cause a build error | (a) Leave as-is and rely on filename convention — risky, Next.js may still pick it up; (b) Move outside `app/` — loses co-location benefit |

## 7. Open Questions

| ID | Question | Assigned To | Target Phase |
|----|----------|-------------|--------------|
| — | None | — | — |

## 8. Risk Register

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|------------|--------|------------|
| R-1 | Next.js treats `.archived.tsx` as a routable page | Low | Medium (build failure or duplicate route) | Remove `export default`; verify with `pnpm build` (AC-2) |
| R-2 | Archived file drifts from original if `page.tsx` is modified before WS-1.1 executes | Low | Low (archive would capture a slightly different version) | Execute WS-1.1 first, before any other workstream touches `page.tsx` |
| R-3 | Import statements in archived file cause TypeScript errors if referenced components are later renamed or removed by downstream workstreams | Medium | Low (archived file is reference-only, not imported anywhere) | If typecheck fails on the archived file in later phases, add `// @ts-nocheck` at the top or exclude it via `tsconfig.json` |
