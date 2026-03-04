# Discovery Log — TarvaRI Alert Viewer: Coverage Grid

> **Started:** 2026-03-03
> **Last Updated:** 2026-03-03
> **Current Phase:** COMPLETE
> **Discovery Depth:** STANDARD

## Phase Status

| Phase | Status | Key Findings |
|-------|--------|--------------|
| 1. Understand Intent | COMPLETE | 14 stated goals, 11 implicit goals, 10 ambiguities, 5 blocking items |
| 2. Explore Codebase | COMPLETE | 3 parallel explorations: @tarva/ui (60+ components), morph system (6 hardcoded files), spatial engine + data layer |
| 3. Assess Current State | COMPLETE | 4 EXISTS, 14 PARTIAL, 7 MISSING — project is ~2-3x larger than signal implies |
| 4. Identify Gaps & Decisions | COMPLETE | 7 technical decisions with recommendations, 3 gap tiers identified |
| 5. Decompose into Work Areas | COMPLETE | 8 work areas, 4-phase execution order, ~16 new + ~18 modified + ~14 archived files |
| 6. Select Agents | COMPLETE | react-developer primary for 7/8 WAs, chief-technology-architect backup |
| 7. Validate & Synthesize | COMPLETE | 2 deliverables produced: combined-recommendations.md + agent-roster.md |

## Key Findings (running log)

### Phase 1
- 14 stated goals identified, core paradigm is Launch → District drill-down with live data
- 11 implicit goals surfaced, most critical: type system overhaul (DistrictId → dynamic categories), new navigation state machine, district view scene routing, loading/error/empty states
- 10 ambiguities identified — 5 are blocking: map library selection, signal vs plan docs precedence, grid spatial layout spec, morph replacement mechanism, @tarva/ui availability
- 8 risks identified — top 3: map library gap (HIGH), morph surgery scope (HIGH), Category District View underestimated (HIGH)
- Scope calibration: STANDARD (4 phases, ~8-10 features, 2 domains: frontend + data layer)

### Phase 2

**Exploration 1: @tarva/ui Library** (`/Users/jessetms/Sites/tarva-ui-library`)
- 60+ components available: Card (CardHeader/Content/Footer), KpiCard (sparklines + glow), StatusBadge, Sparkline (6 variants), CapacityBar, Badge, Button, Dialog, Drawer, Sheet, FullScreenSheet, Table, Tabs, Command, EmptyState, ErrorState, LoadingState, Skeleton
- Motion system: `@tarva/ui/motion` (DURATION, EASING, ANIMATION_PRESETS, useReducedMotion)
- Design tokens: `@tarva/ui/tokens` (COLORS with light/dark/status/chart, TYPOGRAPHY, SPACING, RADIUS)
- Theme provider + utilities (cn, formatNumber, formatPercent, formatDate)
- No dedicated "glass card" but Card + `bg-black/70 backdrop-blur-sm` achieves the look
- **Verdict:** Has everything we need for coverage cards and district detail panels

**Exploration 2: Morph System Architecture**
- `ui.store.ts` morph state machine — **completely generic** (phases, direction, targetId as string)
- `use-morph-choreography.ts` — **completely generic** (phase timing, URL sync, keyboard Escape)
- `morph-orchestrator.tsx` — **data-driven** (accepts `CapsuleData[]`, routes selection)
- `morph.css` — **generic** (data-attribute driven, no hardcoded IDs)
- `detail-panel.tsx` — **generic** (receives districtId, ringIndex, onClose, dockSide)
- `connector-lines.tsx` — **generic** (pure geometry)
- **6 files with hardcoded 6-district assumptions:**
  1. `lib/interfaces/district.ts` — DistrictId is 6-member union type, DISTRICTS array, DISTRICT_CODES
  2. `components/districts/capsule-ring.tsx` — 60° angular spacing hardcoded (360/6)
  3. `lib/morph-types.ts` — ring geometry helpers assume 60° spacing
  4. `components/district-view/district-view-content.tsx` — SCENE_MAP hardcoded to 6 React components
  5. `components/district-view/district-view-overlay.tsx` — DISTRICT_TINTS hardcoded to 6 colors
  6. `lib/spatial-actions.ts` — ring positions assume 6 slots
- **Verdict:** ~80% of morph system is generic. Adapting to dynamic categories requires changes to those 6 files only.

**Exploration 3: Spatial Engine + Data Layer**
- Camera store: offsetX/Y, zoom 0.08–3.0 (default 0.5), spring physics (stiffness: 120, damping: 20)
- SpatialCanvas uses `useCameraStore.subscribe()` for direct DOM writes (bypasses React reconciliation)
- Semantic zoom: Z0 (<0.27), Z1 (0.30–0.79), Z2 (0.80–1.49), Z3 (1.50+) with 10% hysteresis
- Data panel world-space positions:
  - SystemStatusPanel: left: -1200, top: -340 (320×680)
  - FeedPanel: left: 880, top: -290 (320×580)
  - SignalPulseMonitor: left: -1200, top: 520 (480×120)
  - ActivityTicker: left: 880, top: 490 (260×240)
- Supabase client: singleton browser client, `persistSession: false`
- Current types.ts only defines `launch_receipts` and `launch_snapshots` — needs `intel_sources` and `intel_normalized`
- TanStack Query configured and working
- **Verdict:** Spatial engine and data layer are ready. Need new Supabase types + hooks + push panels outward.

**Blocking Items Resolved (by user):**
1. Map library → free, open-source, vector-capable (MapLibre GL JS likely)
2. Source detail tables → go in districts (drill-down), not launch page
3. Morph system → KEEP and ADAPT (not remove)
4. Grid layout → rows of 8 cards, category icon only at Z0
5. @tarva/ui → confirmed at /Users/jessetms/Sites/tarva-ui-library with 60+ components

### Phase 3
- **25 goals assessed:** 4 EXISTS (16%), 14 PARTIAL (56%), 7 MISSING (28%)
- **Effort is ~2-3x larger than input signal implies** — what reads as "swap ring for grid + hook up data" actually involves type system overhaul (15+ files), new map feature, district view content replacement, and new data layer from scratch
- **Top 3 risks:** (1) DistrictId type cascade across 15+ files, (2) map library coexistence with CSS transforms ZUI, (3) morph orchestrator ring→grid rewrite
- **5 work clusters identified:** Types+Data → Grid+Morph → District View → Chrome+Panels (parallel) → Map (independent)
- Estimated: ~16 new files, ~18 existing files modified

### Phase 4 — Decisions (with recommendations)
1. **DistrictId strategy** → Replace with generic `NodeId = string` + new `CategoryMeta` interface
2. **Grid dimensions** → 1500×400px container centered at world origin, fits between existing panels
3. **Morph animation** → Selected card scales 1.0→1.2x, siblings fade to 0.3 opacity, panel slides in right
4. **Category list** → Hybrid: `KNOWN_CATEGORIES` constant + dynamic counts from `intel_sources`
5. **Map library** → MapLibre GL JS via `react-map-gl` (free, vector, ~200KB). Place map in district view overlay only (avoids WebGL-in-CSS-transform issues)
6. **District view content** → Single generic `CategoryDetailScene` (data-driven, not per-category scenes)
7. **Filter state** → New `coverage.store.ts` Zustand store, separate from morph state

### Phase 5 — Work Areas
8 work areas decomposed across 4 execution phases:
- **Phase 1 Foundation:** WA8 Archive (trivial) → WA1 Types → WA2 Data Layer
- **Phase 2 Core UI:** WA3 Coverage Grid → WA4 Morph Adaptation
- **Phase 3 Detail+Chrome:** WA5 District View + WA6 Chrome & Panels (parallel)
- **Phase 4 Map:** WA7 Map Feature (independent)
- Totals: ~16 new files, ~18 modified, ~14 archived/removed

## Unresolved Questions
- Map library: MapLibre GL JS recommended, awaiting confirmation
- Category detail scene content: recommended single generic scene, awaiting confirmation
- Grid dimensions: 1500×400px recommended, awaiting confirmation

### Phase 6 — Agent Selection
- `react-developer` selected as primary for 7 of 8 work areas (this is overwhelmingly React/TypeScript frontend work)
- `general-purpose` for WA8 (archive — trivial)
- Backup/consultation agents: `chief-technology-architect`, `database-architect`, `world-class-ui-designer`

### Phase 7 — Deliverables
Two files produced:
1. **`combined-recommendations.md`** — 7 technical decisions, 8 work areas with file-level detail, dependency graph, risk mitigation, quality gates
2. **`agent-roster.md`** — Work area → agent mapping with rationale

## Specialist Consultations
| Agent | Question | Response Summary |
|-------|----------|-----------------|
| every-time | Phase 1 intent analysis | 14 stated goals, 11 implicit, 10 ambiguities, 8 risks identified |
| every-time | Phase 3 gap assessment | 4 EXISTS, 14 PARTIAL, 7 MISSING; effort ~2-3x larger than signal implies |
| every-time | Phase 4-5 decisions + decomposition | 7 decisions, 8 work areas, 4-phase execution order |
| tarvacode-agent-selector | Phase 6 agent matching | react-developer matched for all frontend work areas |
