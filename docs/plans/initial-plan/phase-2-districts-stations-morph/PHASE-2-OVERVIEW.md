# Phase 2 Overview: Districts + Stations + Morph

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation)
> **Phase Objective:** Deliver the capsule-to-district morph transition, 6 district implementations with live station panels, a reusable station panel framework, and the Z0 Constellation View.
> **Estimated Complexity:** XL (6-8 weeks)
> **Workstreams:** WS-2.1 (Morph Choreography), WS-2.2 (Agent Builder District), WS-2.3 (Project Room District), WS-2.4 (Tarva Chat District), WS-2.5 (TarvaCORE + TarvaERP + tarvaCODE Districts), WS-2.6 (Station Panel Framework), WS-2.7 (Constellation View)
> **Agents:** `react-developer` (WS-2.1, WS-2.2, WS-2.3, WS-2.4, WS-2.5, WS-2.7), `world-class-ui-designer` (WS-2.6)
> **Date:** 2026-02-25

---

## 1. Executive Summary

Phase 2 transforms the passive Launch Atrium from Phase 1 into an interactive spatial workspace. It delivers seven workstreams across two agents: a 4-phase morph choreography that transitions capsules into expanded district containers, four district content implementations surfacing live data from each Tarva platform app, a reusable station panel framework with glass material and receipt stamp integration, and a Constellation View (Z0) that collapses the entire system into glanceable beacon dots with three global metrics.

The seven SOWs are architecturally coherent in their macro design -- all align on the `motion/react` animation library (not `framer-motion`), the five-state health model (OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN), the 3-zone station panel layout (Header, Body, Actions), TanStack Query for data fetching with adaptive polling, and Next.js Route Handlers for server-side API proxying. However, **six specific cross-workstream conflicts** are identified in Section 3, of which two are high-severity: a **port collision** between WS-2.3 (Project Room) and WS-2.4 (Tarva Chat) both targeting `localhost:3005`, and **continued use of `src/types/` for type definitions** (WS-2.1, WS-2.2, WS-2.5, WS-2.7) despite Phase 1 Gap 1 explicitly recommending its removal per WS-1.7 D-10 (`D-IFACE-7`). Both require resolution before execution begins.

The most significant planning risk is the **react-developer bottleneck**: this single agent owns six of seven workstreams (WS-2.1, WS-2.2, WS-2.3, WS-2.4, WS-2.5, WS-2.7), representing approximately 90% of the implementation surface area. WS-2.6 (Station Panel Framework) is assigned to the `world-class-ui-designer`, but it **blocks all four district content workstreams** (WS-2.2 through WS-2.5) -- creating a cross-agent serialization dependency that makes it the critical path's primary gate. If WS-2.6 delivery is delayed, the react-developer has no district content work to start.

The "XL (6-8 weeks)" estimate is achievable if: (1) WS-2.6 (Station Panel Framework) and WS-2.1 (Morph Choreography) start in parallel on Day 1 since they have no cross-dependency; (2) WS-2.7 (Constellation View) runs concurrently with WS-2.1 since it depends only on Phase 1 outputs (WS-1.1, WS-1.5); (3) the four district content workstreams (WS-2.2 through WS-2.5) begin after both WS-2.1 and WS-2.6 deliver, with WS-2.2 and WS-2.3 prioritized as the most complex districts; and (4) at least one week of integration buffer is reserved for the cross-workstream composition test (all 6 districts rendering inside the morph container with live data at 60fps).

Phase 2 produces the most user-visible transformation in the project lifecycle. At Phase 1 completion, the Launch shows passive capsules with telemetry. At Phase 2 completion, users click any capsule to fly into a fully interactive district with live data panels, receipt-stamped actions, and station-level detail -- then zoom all the way out to see the entire system as a constellation of health beacons.

---

## 2. Key Findings (grouped by theme)

### Morph Choreography & Spatial Transitions

- **4-phase state machine is well-specified with clear phase boundaries.** WS-2.1 defines `idle -> focusing -> morphing -> unfurling -> settled` with explicit timing for each phase: focusing 300ms, morphing 200ms, unfurling 400ms (per `MORPH_TIMING` constants in `src/types/morph.ts`). The reverse flow runs the same phases in reverse order with a 75% duration multiplier for exit animations. All transitions use `setTimeout` chaining (not `requestAnimationFrame`) because phase durations are design-intentional values; the camera `flyTo` animation uses rAF internally via the camera store.
- **Morph state lives in the UI store, not a separate store.** WS-2.1 evolves the WS-0.1 `ui.store.ts` skeleton by adding `MorphState` (`phase`, `direction`, `targetId`, `phaseStartedAt`) and five new actions: `startMorph()`, `reverseMorph()`, `setMorphPhase()`, `resetMorph()`, plus four selectors (`morphPhase`, `isMorphing`, `isDistrictSettled`, `isReversing`). This is architecturally sound -- morph state is UI concern, not domain data.
- **Capsule-to-district transition uses `scale` transforms exclusively, not width/height changes.** Per AD-3 and VISUAL-DESIGN-SPEC.md Section 4.3, the selected capsule scales from 1.0 to 1.3 (focusing) to 2.0 (morphing/unfurling/settled). The 2.0 scale factor maps capsule dimensions (192x228px) to district shell dimensions (380x460px). Sibling capsules drift radially outward by 120px and fade to 0.15 opacity via `siblingCapsuleVariants`.
- **URL sync uses `history.replaceState`, not Next.js router.** WS-2.1's `syncUrlDistrict()` helper writes `?district={id}` via `window.history.replaceState({}, '', url.toString())` to avoid triggering React re-renders from Next.js router state changes. On initial page load with `?district={id}`, the morph skips animation and renders directly in `settled` state.
- **Reverse morph has four triggers.** Escape key, breadcrumb "Launch" click, clicking the district shell close button, or programmatic `reverseMorph()` call. The hub center glyph also triggers reverse morph when clicked during the `settled` state.
- **`prefers-reduced-motion` compliance is thorough.** WS-2.1 provides `MORPH_TIMING_REDUCED` (all durations set to 0ms) that the `useMorphChoreography` hook selects based on the `prefersReducedMotion` option. Selection immediately places the camera, renders the district container, and enters `settled` without animation.

### Station Panel Framework

- **WS-2.6 is assigned to the `world-class-ui-designer` -- the only non-react-developer workstream in Phase 2.** This creates a cross-agent coordination dependency since WS-2.6 blocks WS-2.2, WS-2.3, WS-2.4, and WS-2.5. The designer must deliver the framework before the react-developer can populate any district with station content.
- **Glass material CSS is precisely specified with three tiers.** `.station-glass` (standard: `rgba(255,255,255,0.03)`, `blur(12px) saturate(120%)`), `.station-glass-active` (active: `rgba(255,255,255,0.06)`, `blur(16px) saturate(130%)`), `.station-glass-hover` (hover: same blur as active with brighter border at `rgba(255,255,255,0.12)`). All defined in `src/components/stations/station-panel.css` per VISUAL-DESIGN-SPEC.md Sections 1.7 and 4.1.
- **Luminous border uses a 4-layer box-shadow technique** (not the 3-layer stated in the WS-2.6 scope section -- the actual CSS has 4 layers). The default ember border: `0 0 10px rgba(224,82,0,0.10)` (outer bleed) + `0 0 3px rgba(224,82,0,0.18)` (tight outer) + `inset 0 0 10px rgba(224,82,0,0.04)` (inner bleed) + `inset 0 0 2px rgba(224,82,0,0.08)` (tight inner). Status variants provided for healthy (green), warning (amber), error (red), and offline.
- **Receipt stamp system generates 4-character hex trace IDs.** `useReceiptStamp()` hook at `src/components/stations/use-receipt-stamp.ts` creates a `ReceiptInput` per WS-1.7's `ReceiptStore` interface, fires a visual overlay animation (fade-in from `opacity: 0` + `translateY(4px)`, hold 1400ms, fade-out; total 2000ms auto-hide), and calls `receiptStore.record()`. Phase 2 uses `InMemoryReceiptStore`; Phase 3 (WS-3.1) swaps to Supabase.
- **Pan-state performance optimization is correctly implemented.** `[data-panning="true"]` CSS selector (set on the ZUI canvas by WS-1.1) disables `backdrop-filter` on station panels during pan/zoom, replacing it with `var(--color-deep)` opaque fallback. This prevents the known performance bottleneck of blurring during 60fps camera motion (WS-1.1 R-1.1.2).
- **5 body type slots cover all district needs.** `StationBody` component routes on `template.layout.bodyType`: `table` (scrollable data tables for runs, artifacts, conversations), `list` (scrollable vertical lists for alerts, errors, dependencies), `metrics` (fixed-height key-value grids for status dashboards), `launch` (app launch panels with URL and buttons), `custom` (free-form content). Scrollable types wrap in `@tarva/ui ScrollArea` with 280px default max-height.

### District Content Architecture

- **All six districts follow the same structural pattern.** Each has: (1) a dedicated Route Handler at `src/app/api/districts/{district-name}/route.ts` that proxies the upstream app's APIs; (2) district-specific types; (3) a TanStack Query hook for data fetching; (4) 2-5 station components rendering inside the WS-2.6 `<StationPanel>` framework. This consistency is a strength -- the pattern is established once and replicated.
- **Agent Builder (WS-2.2) is unique: it has TWO launchable items.** Per Gap Resolution #4, the Agent Builder Launch station surfaces both the Web UI at `localhost:3000` and the AgentGen CLI terminal process. It also has the most specialized stations: Pipeline (7-segment phase progress bar via `PipelinePhaseBar` component) and Library (installed agents list with Tarva vs. third-party distinction).
- **Project Room (WS-2.3) is the richest district with 5 stations.** Launch, Status, Runs, Artifacts, and Governance. The Runs station maps to the spine "Activity" supertype (Gap 2 resolution), and Artifacts maps to the "Artifact" supertype. The Governance station is the only place in the Launch where the demoted "Approval" concept surfaces -- validating the IA's decision to keep it app-specific rather than spine-level.
- **TarvaCORE, TarvaERP, and tarvaCODE are bundled in WS-2.5.** TarvaCORE is an Electron desktop app with no HTTP API -- its Status station consumes TCP port check data from WS-1.5 (port 11435). TarvaERP has a working frontend (5 modules, 52 pages) at `localhost:3010`. tarvaCODE is planning-stage and renders permanently OFFLINE/UNKNOWN with a "Coming Soon" placeholder. This bundling is appropriate given their simpler data requirements (2-3 stations each vs. 4-5 for Agent Builder/Chat/Project Room).
- **District data hooks use different polling strategies.** WS-2.3 (`useProjectRoom()`) uses a fixed 30-second `refetchInterval` with `staleTime: 15_000` since district data changes less frequently than health status. WS-2.4 (`useTarvaChatData()`) uses adaptive polling from `POLLING_INTERVALS` constants that adjust based on connection state. Both hooks are enabled only when the respective district is active (Z2/Z3 with the district selected), avoiding unnecessary background fetching.

### Constellation View (Z0)

- **Constellation View activates at zoom < 0.27 with hysteresis exit at zoom >= 0.30.** WS-2.7 consumes `useSemanticZoom()` from WS-1.1, which handles the hysteresis logic internally. The 10% band (enter at 0.27, exit at 0.30) prevents flickering at the Z0/Z1 boundary.
- **Beacon layout mirrors capsule ring positions exactly.** Same 300px radius, 60-degree spacing, first beacon at 12 o'clock (270 degrees). This ensures the Z0/Z1 crossfade reads as capsules collapsing to dots in place, not rearranging.
- **Three global metrics aggregate telemetry across all districts.** Alert Count (sum of all `alertCount` values), Active Work (parsed from pulse strings via regex `^(\d+)`), and System Pulse (worst-of-five health states excluding OFFLINE/UNKNOWN). The `HEALTH_SEVERITY` map assigns numeric priorities: OPERATIONAL=0, DEGRADED=1, DOWN=2, OFFLINE=-1, UNKNOWN=-1.
- **No click-to-navigate on beacons.** Decision D3 in WS-2.7 explicitly defers this: "Z0 is an overview mode for glancing at system health. Adding click handlers to 12px dots creates a poor click target." Navigation happens by zooming in to Z1 where capsules are clickable.

### Animation Architecture Compliance

- **All SOWs consistently use `motion/react` import path, not `framer-motion`.** This aligns with the Phase 1 lesson learned. WS-2.1 imports `motion`, `AnimatePresence`, `useAnimate`, `useMotionValue`, `useTransform`, `type Variants`, `type Transition` from `motion/react`. WS-2.6 imports `AnimatePresence`, `motion` from `motion/react`. WS-2.7 imports `AnimatePresence` from `motion/react`. No SOW references the `framer-motion` package name.
- **Three-tier animation architecture (AD-3) is consistently applied.** Physics tier: camera `flyTo` spring animation in WS-2.1 (rAF via camera store). Choreography tier: morph variants, station entrance stagger, receipt stamp overlay in WS-2.1 and WS-2.6 (`motion/react`). Ambient tier: beacon pulse and flash CSS `@keyframes` in WS-2.7.

---

## 3. Cross-Workstream Conflicts

### Conflict 1: Port Collision -- WS-2.3 and WS-2.4 Both Target `localhost:3005` (HIGH)

**Description:** WS-2.3 (Project Room) Route Handler at `src/app/api/districts/project-room/route.ts` fetches from `http://localhost:3005` (Section 4.2: `const PROJECT_ROOM_BASE_URL = process.env.PROJECT_ROOM_URL ?? 'http://localhost:3005'`). WS-2.4 (Tarva Chat) Route Handler at `src/app/api/districts/tarva-chat/route.ts` also fetches from `http://localhost:3005` (Section 4.3: `const TARVA_CHAT_BASE_URL = process.env.TARVA_CHAT_URL ?? 'http://localhost:3005'`).

**Impact:** Both Route Handlers will contact the same application during development. If Project Room runs on port 3005, Tarva Chat's route handler will receive Project Room data (and vice versa). This is a data integrity issue that would surface immediately at runtime.

**Resolution:** One of the apps must use a different port. Based on the TARVA-SYSTEM-OVERVIEW.md, Project Room likely runs on port 3005 (it is the more established app with 40+ API routes). Tarva Chat should use a different port. **Recommended: WS-2.4 should target `localhost:3006` or whatever port Tarva Chat actually runs on.** Both SOWs correctly use environment variable overrides (`PROJECT_ROOM_URL`, `TARVA_CHAT_URL`), so the fix can also be a `.env.local` configuration change. However, the SOW default values must be corrected before execution.

### Conflict 2: `src/types/` Directory Usage Despite Phase 1 Gap 1 Recommendation (HIGH)

**Description:** Phase 1 PHASE-1-OVERVIEW.md Gap 1 states: "WS-1.2 creates `src/types/district.ts` with `DistrictId`, `HealthState`, `CapsuleTelemetry`, and related types. This directory is not part of the AD-9 project structure... WS-1.7 D-10 (`D-IFACE-7`) explicitly states that shared types go in `src/lib/interfaces/types.ts`, NOT `src/types/`." The recommendation was to **remove `src/types/`** entirely.

Despite this, Phase 2 workstreams proliferate `src/types/` usage:

- WS-2.1 creates `src/types/morph.ts` (morph state machine types)
- WS-2.2 creates `src/types/districts/agent-builder.ts` (Agent Builder district types)
- WS-2.5 creates `src/types/districts/tarva-core.ts`, `src/types/districts/tarva-erp.ts`, `src/types/districts/tarva-code.ts`
- WS-2.7 adds `BeaconData`, `ConstellationMetrics`, `DistrictCode`, `DISTRICT_CODES` to `src/types/district.ts`

**Impact:** If Phase 1 executes Gap 1's recommendation (removing `src/types/`), every Phase 2 workstream that references this directory will have broken imports. If Phase 1 does NOT execute Gap 1, then `src/types/` becomes an established convention, contradicting D-IFACE-7 and creating a dual-location ambiguity (types in both `src/types/` and `src/lib/interfaces/`).

**Resolution:** The project must make a definitive decision before Phase 2 execution begins. Two options:

_Option A (Recommended):_ Accept `src/types/` as the canonical location for domain-specific types. Redefine `src/lib/interfaces/types.ts` as the location for **interface contracts** only (the 6 interfaces from WS-1.7). Update D-IFACE-7 to reflect this split: interface contracts in `src/lib/interfaces/`, domain types in `src/types/`. This aligns with how the SOW authors naturally organized their types and avoids fighting the established pattern.

_Option B:_ Enforce D-IFACE-7 strictly. Move all Phase 2 types into `src/lib/` subdirectories. WS-2.1 types go to `src/lib/morph/types.ts`, WS-2.2 types go to `src/lib/districts/agent-builder-types.ts`, etc. This requires updating every Phase 2 SOW's file structure section.

### Conflict 3: Type File Location Inconsistency Across Districts (MEDIUM)

**Description:** District-specific type definitions are placed in three different directory patterns:

- WS-2.3 (Project Room): `src/types/districts/project-room.ts`
- WS-2.4 (Tarva Chat): `src/types/districts/tarva-chat.ts`
- WS-2.2 (Agent Builder): `src/types/districts/agent-builder.ts`
- WS-2.5 (TarvaCORE/ERP/CODE): `src/types/districts/tarva-core.ts`, `src/types/districts/tarva-erp.ts`, `src/types/districts/tarva-code.ts`

**Impact:** Four different type location patterns across six districts create navigation friction for developers. Finding the types for a given district requires checking three directories (`src/types/`, `src/lib/`, `src/lib/districts/`). This violates the "single source of truth" principle for project structure.

**Resolution:** Establish a single canonical pattern. If Conflict 2 is resolved with Option A (`src/types/` accepted), all district types should go to `src/types/{district-name}.ts`. If Option B, all should go to `src/lib/districts/{district-name}-types.ts`. WS-2.3 and WS-2.4 must be updated to match whichever convention is chosen. **Recommended pattern:** `src/types/districts/{district-name}.ts` (e.g., `src/types/districts/project-room.ts`, `src/types/districts/tarva-chat.ts`).

### Conflict 4: Status Enum Divergence Across Districts (MEDIUM)

**Description:** Different workstreams define different status enum shapes for conceptually similar data:

- WS-2.3 (Project Room) dependency status: `'ok' | 'degraded' | 'error' | 'unreachable'` (in `ProjectRoomDependency.status`)
- WS-2.4 (Tarva Chat) connection status: `'connected' | 'degraded' | 'disconnected' | 'unknown'` (in `ChatConnection.status`)
- WS-1.5 (Phase 1, system-level): `OPERATIONAL | DEGRADED | DOWN | OFFLINE | UNKNOWN` (five-state `HealthState`)

**Impact:** Three different status vocabularies describe essentially the same concept: "is this dependency healthy?" The naming inconsistency (`ok` vs. `connected` vs. `OPERATIONAL`, `unreachable` vs. `disconnected` vs. `OFFLINE`) means station components cannot share status rendering logic. A `StatusBadge` component that handles `'ok'` will not work for `'connected'`.

**Resolution:** Define a **`DependencyStatus`** type alias that maps district-specific statuses to the canonical `HealthState` five-state model. Each district's Route Handler should translate its upstream app's status vocabulary to the canonical form. Station components then use `HealthState` consistently, and the `HealthBadge` component from WS-1.5 works everywhere without adaptation. Example mapping: `ok/connected -> OPERATIONAL`, `degraded -> DEGRADED`, `error/disconnected -> DOWN`, `unreachable/unknown -> OFFLINE/UNKNOWN`.

### Conflict 5: District Container Component Nesting (LOW)

**Description:** WS-2.5 places district container components inside `src/components/stations/` (e.g., `src/components/stations/tarva-core/core-district.tsx`, `src/components/stations/tarva-erp/erp-district.tsx`). WS-2.1 places district-level components inside `src/components/districts/` (e.g., `src/components/districts/morph-orchestrator.tsx`, `src/components/districts/district-shell.tsx`). WS-2.7 also places components inside `src/components/districts/` (`constellation-view.tsx`, `district-beacon.tsx`).

**Impact:** The "district container" concept lives in two directories. A developer looking for "the TarvaCORE district" would logically look in `src/components/districts/` but find it in `src/components/stations/tarva-core/`. The `stations/` directory conflates two levels of the spatial hierarchy: stations are contained within districts, not siblings of them.

**Resolution:** Move all district container components (`core-district.tsx`, `erp-district.tsx`, `code-district.tsx`) from `src/components/stations/` to `src/components/districts/`. Keep station-level components (the individual station panel implementations) in `src/components/stations/{district-name}/`. This preserves the spatial hierarchy: `districts/` holds district containers, `stations/` holds station content within those districts.

### Conflict 6: Fetch Timeout Inconsistency (LOW)

**Description:** WS-2.3 (Project Room) Route Handler uses a 5000ms fetch timeout via `AbortSignal.timeout(5000)`. WS-2.4 (Tarva Chat) Route Handler uses a 3000ms fetch timeout. WS-2.2 (Agent Builder) uses a 3000ms timeout.

**Impact:** Inconsistent timeout behavior means that the same network condition (e.g., a slow response at 4 seconds) produces different results across districts: Project Room returns data, while Tarva Chat and Agent Builder return a timeout error. This inconsistency would be confusing during debugging.

**Resolution:** Standardize on a single fetch timeout for all district Route Handlers. **Recommended: 5000ms** for district-specific proxied data (Route Handlers are server-side and not on the user's critical rendering path). The WS-1.5 telemetry aggregator already uses a separate, shorter timeout for health checks. Define a shared constant `DISTRICT_FETCH_TIMEOUT_MS = 5000` in `src/lib/constants.ts` and import it in all district Route Handlers.

---

## 4. Gaps Identified

### Gap 1: No Testing Framework Inherited from Phase 1

**Impact:** Phase 1 Gap 2 identified the absence of a test runner (Vitest). Phase 2 now adds ~120 acceptance criteria across 7 workstreams, including unit tests explicitly specified for station components (WS-2.2 through WS-2.5 all include `__tests__/` directories in their file structure). Without Vitest configured, these tests cannot be written or run.

**Recommendation:** If not resolved during Phase 1 execution, add a Phase 2 pre-execution task to configure Vitest (2-4 hours). Phase 2's station components with their mock-data-driven rendering logic are ideal unit test candidates. The test debt compounds significantly if deferred to Phase 3.

### Gap 2: WS-2.6 Does Not Specify the `StationContext` Provider Mounting Location

**Impact:** WS-2.6 defines `StationContext` at `src/components/stations/station-context.tsx` with `StationContextValue` interface (providing `districtId`, `template`, `receiptStore`, `healthState`). All child components (`StationHeader`, `StationBody`, `StationActions`) consume this context via `useStationContext()`. However, the SOW does not specify where the context provider is mounted. Is it inside `<StationPanel>` (each panel provides its own context), or inside `<DistrictShell>` from WS-2.1 (all stations in a district share a single context)? The answer affects whether `districtId` and `receiptStore` are shared across stations or duplicated per-station.

**Recommendation:** The `StationContext.Provider` should be rendered inside `<StationPanel>` itself, since each station has its own `template` and `healthState`. The `districtId` and `receiptStore` should be passed as props to `<StationPanel>` and threaded through context to children. This makes each `<StationPanel>` self-contained -- district workstreams only need to provide props, not wrap in providers.

### Gap 3: WS-2.1 `DISTRICT_WORLD_POSITIONS` Is Duplicated from WS-1.7

**Impact:** WS-2.1's `useMorphChoreography` hook hardcodes `DISTRICT_WORLD_POSITIONS` as a local constant (line 481-491 in WS-2.1), and `useDistrictPosition` hook also hardcodes `DISTRICT_POSITIONS` (line 1379-1386). Both duplicate values that WS-1.7's `ManualCameraController.DISTRICT_POSITIONS` defines canonically. Phase 1 Gap 3 already identified this exact issue: "Three workstreams need district positions... There is no single constant file that all three reference."

**Recommendation:** If Phase 1 resolves Gap 3 by exporting `DISTRICT_POSITIONS` from `src/lib/constants.ts`, WS-2.1 should import from there instead of defining its own constants. If Phase 1 does not resolve it, Phase 2 must create the canonical constant during pre-execution. The duplication across two hooks within the same workstream (WS-2.1) compounds the risk of positional drift.

### Gap 4: Morph-to-Station Composition Handoff Not Specified

**Impact:** WS-2.1 renders district content via a `renderDistrictContent?: (districtId: DistrictId) => React.ReactNode` render prop on `MorphOrchestrator`. WS-2.2 through WS-2.5 each export station components. But no workstream specifies the **mapping layer** that connects district IDs to their station component compositions. Who writes the function that maps `'agent-builder'` to `<AgentBuilderDistrict />` containing `<LaunchStation />`, `<StatusStation />`, `<PipelineStation />`, `<LibraryStation />`? This integration layer sits between WS-2.1 and WS-2.2-2.5 with no clear owner.

**Recommendation:** Create a `src/components/districts/district-content-map.tsx` file that exports a `renderDistrictContent(districtId)` function. This file imports from all district workstreams (WS-2.2 through WS-2.5) and returns the composed station layout for each district. Assign ownership to the react-developer as part of the integration buffer. This is a thin mapping layer (~50-80 lines) but is architecturally necessary.

### Gap 5: WS-2.5 District Registration Pattern Not Used by Other Districts

**Impact:** WS-2.5 specifies a `src/components/districts/district-registry.ts` file that registers TarvaCORE, TarvaERP, and tarvaCODE with metadata (display name, stations, health source). No other district workstream (WS-2.2, WS-2.3, WS-2.4) references a district registry or registers their district. This creates an inconsistency: three districts have registry entries, three do not.

**Recommendation:** Either extend the district registry to include all 6 districts (requiring updates to WS-2.2, WS-2.3, WS-2.4), or remove the registry from WS-2.5 and use the `DISTRICTS` constant from WS-1.2 (which already contains display names and ring positions) as the single source of district metadata. The registry adds value only if it is comprehensive.

### Gap 6: No Specification for Loading/Error/Empty States in Route Handlers

**Impact:** All five district Route Handlers (WS-2.2 through WS-2.5, with WS-2.5 having no dedicated handler since it uses WS-1.5 telemetry) describe fallback behavior when upstream apps are unreachable ("returns empty/stale data with status flags"). However, the exact HTTP response shape during error conditions is not standardized. Does a Route Handler return `200` with `{ status: 'offline', data: null }`? Or `503`? Or `200` with empty arrays? Each SOW describes this differently.

**Recommendation:** Define a standard district Route Handler response envelope:

```typescript
interface DistrictRouteResponse<T> {
  status: 'ok' | 'partial' | 'offline'
  data: T | null
  lastFetchedAt: string // ISO timestamp
  errors: string[] // Array of error messages for partial failures
}
```

All Route Handlers should return `200` with this envelope. The `status` field tells the client whether data is fresh (`ok`), partially available (`partial` -- some endpoints succeeded), or unavailable (`offline` -- all endpoints failed). This enables consistent client-side handling in the TanStack Query hooks.

### Gap 7: WS-2.7 Adds CSS @keyframes to `src/styles/constellation.css` -- Potential Ambient Tier Conflict

**Impact:** Phase 1 Decision D-AMBIENT-2 specifies: "Single `ambient-effects.css` for all @keyframes. Enables single `prefers-reduced-motion` block. Easier auditing of animation timings." WS-2.7 creates a separate `src/styles/constellation.css` with `@keyframes beacon-pulse` and `@keyframes beacon-flash`. This fragments the ambient animation CSS across two files, undermining the single-file policy.

**Recommendation:** Move `beacon-pulse` and `beacon-flash` @keyframes into `src/styles/ambient-effects.css` (the Phase 1 canonical ambient animation file from WS-1.6). Keep the `.beacon-pulse` and `.beacon-flash` class definitions in `constellation.css` since they are component-specific styles, but the @keyframes themselves should be centralized. This maintains the single `prefers-reduced-motion` block and single audit point for all ambient animations.

---

## 5. Cross-Workstream Dependencies

```
WS-2.6 (Station Panel Framework)         WS-2.1 (Morph Choreography)
  [ui-designer]                             [react-developer]
  [depends on WS-0.2, WS-1.7]              [depends on WS-1.1, WS-1.2, WS-1.7]
  [CRITICAL: blocks WS-2.2-2.5]            [CRITICAL: blocks WS-2.2-2.5]
  |                                          |
  v                                          v
  +---------+---+---+---+---------+----------+
            |   |   |   |
            v   v   v   v
          WS-2.2  WS-2.3  WS-2.4  WS-2.5
          (Agent  (Project (Tarva  (CORE/
          Builder) Room)   Chat)   ERP/CODE)
          [depends on WS-2.1, WS-2.6, WS-1.5]
          [react-developer for all four]

WS-2.7 (Constellation View)
  [react-developer]
  [depends on WS-1.1, WS-1.5 ONLY]
  [NO dependency on WS-2.1 or WS-2.6]
  [can run in parallel from Day 1]
```

**Key dependency facts:**

- **WS-2.1 and WS-2.6 have NO cross-dependency** and can start in parallel on Day 1. WS-2.1 depends on Phase 1 outputs (WS-1.1, WS-1.2, WS-1.7). WS-2.6 depends on Phase 0 (WS-0.2) and Phase 1 (WS-1.7). They share no artifacts.
- **WS-2.7 is fully independent of all other Phase 2 workstreams.** It depends only on WS-1.1 (`useSemanticZoom()`, camera store) and WS-1.5 (districts store, telemetry data). It can start on Day 1 and run concurrently with WS-2.1 -- but since both are assigned to the react-developer, they must be serialized or time-sliced.
- **WS-2.2 through WS-2.5 have a dual gate.** They require BOTH WS-2.1 (morph container to render inside) AND WS-2.6 (station panel framework to compose with). Neither gate is sufficient alone. The district content cannot begin until both are delivered.
- **WS-2.2 through WS-2.5 are independent of each other.** Agent Builder does not depend on Project Room; Tarva Chat does not depend on TarvaCORE. All four can run in parallel (or any order) once the dual gate is cleared. However, all four are assigned to the same agent (react-developer), so they must be sequenced.
- **WS-2.5 bundles three districts** (TarvaCORE, TarvaERP, tarvaCODE) into a single workstream. This is efficient since all three are simpler than the other districts, but it means the react-developer must implement 8 station components (3+3+2) in one workstream.

**External dependencies (outside Phase 2):**

- Phase 1 deliverables: ZUI engine with camera store and `flyTo` (WS-1.1), capsule ring with `capsuleRefs` and ring layout (WS-1.2), auth gate (WS-1.3), telemetry aggregator with districts store and `useTelemetry()` hook (WS-1.5), ambient effects layer (WS-1.6), 6 interface contracts including `StationTemplate`, `ReceiptStore`, `CameraController` (WS-1.7).
- Phase 0 deliverables: design tokens CSS (WS-0.2), project scaffolding with TanStack Query provider and Zustand stores (WS-0.1).
- `motion/react` v12+ for morph choreography and station entrance animations.
- `@tarva/ui` components: Card, CardHeader, CardContent, CardFooter, Button, Badge, StatusBadge, Sparkline, ScrollArea, Tooltip, Skeleton.
- Upstream apps running locally: Agent Builder (localhost:3000), Project Room (localhost:3005), Tarva Chat (localhost:3005 -- **conflict, see Conflict 1**), TarvaERP (localhost:3010), TarvaCORE (TCP port 11435).

---

## 6. Risk Assessment

### High-Impact Risks

| #     | Risk                                                                                                                                                                                                                                                                                                                                                            | SOW                   | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-2.1 | **react-developer bottleneck**: One agent owns 6 of 7 workstreams. Total serial effort is 5-7 weeks. Any delay cascades.                                                                                                                                                                                                                                        | All Phase 2           | High       | High   | Prioritize WS-2.1 and WS-2.7 first (they unblock the most work). Consider splitting WS-2.5 (simpler districts) to a second developer if available. Time-box each district to 1 week maximum.                                                                                                                                    |
| R-2.2 | **WS-2.6 delivery blocks all district content**: If the ui-designer falls behind, the react-developer has no district work to start after WS-2.1 and WS-2.7.                                                                                                                                                                                                    | WS-2.6                | Medium     | High   | Start WS-2.6 on Day 1. The ui-designer has no other Phase 2 work -- full focus. If WS-2.6 slips, the react-developer can mock the `<StationPanel>` interface with a minimal stub and build district content against the stub, then swap when WS-2.6 delivers.                                                                   |
| R-2.3 | **60fps morph transition under load**: The morph transitions capsule scale + camera spring + sibling drift + AnimatePresence swap + station entrance stagger simultaneously. Composing all these during a single 900ms transition window (300+200+400ms) may exceed the GPU budget, especially with `backdrop-filter: blur(16px)` active on the district shell. | WS-2.1                | Medium     | High   | Pan-state optimization (WS-2.6: `[data-panning="true"]` disabling backdrop-filter) should be extended to the morph animation: disable backdrop-filter during `focusing` and `morphing` phases, re-enable only at `unfurling` when the camera has settled. Fall back to solid semi-transparent background if FPS drops below 45. |
| R-2.4 | **Port 3005 collision**: Both Project Room and Tarva Chat Route Handlers target the same port. Data integrity failure during development.                                                                                                                                                                                                                       | WS-2.3, WS-2.4        | High       | Medium | Resolve before execution. See Conflict 1. One line change per SOW.                                                                                                                                                                                                                                                              |
| R-2.5 | **Type location ambiguity causes import confusion**: With types in `src/types/`, `src/lib/`, and `src/lib/districts/`, developers will waste time locating the correct import path.                                                                                                                                                                             | WS-2.2-WS-2.5, WS-2.7 | High       | Medium | Resolve Conflicts 2 and 3 during pre-execution. Establish a single canonical pattern and update all SOW file structures.                                                                                                                                                                                                        |

### Medium-Impact Risks

| #      | Risk                                                                                                                                                                                                                                                                      | SOW                    | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-2.6  | **Upstream apps lack expected API endpoints**: District Route Handlers proxy specific endpoints (e.g., Agent Builder's `/api/agents/installed`, Tarva Chat's `/api/conversations`). If these endpoints do not exist, the Route Handlers will fail.                        | WS-2.2, WS-2.3, WS-2.4 | Medium     | Medium | All Route Handlers are designed with graceful degradation -- they return null/empty data when upstream endpoints fail. WS-2.4 explicitly flags this as OQ-2.4.1: "Do the required Tarva Chat API endpoints exist?" Verify during pre-execution by running each upstream app and testing endpoint availability with `curl`.                                                                                                                                                                                                                   |
| R-2.7  | **`InMemoryReceiptStore` loses all receipts on page refresh**: Phase 2 uses the WS-1.7 in-memory implementation. Users performing actions (opening apps, refreshing data) will see receipt stamps but lose the audit trail on refresh.                                    | WS-2.6                 | Medium     | Low    | This is by design (Phase 3 WS-3.1 adds Supabase persistence). The UX impact is minimal since the receipt stamp is a visual ritual, not a data retrieval feature in Phase 2.                                                                                                                                                                                                                                                                                                                                                                  |
| R-2.8  | **AnimatePresence crossfade between Z0/Z1 causes layout shift**: The constellation view (Z0) and capsule ring (Z1) share the same world-space container. If their root element sizes differ, the crossfade may cause visible position jumps.                              | WS-2.7                 | Low        | Medium | Both views render at the same ring positions and container dimensions. WS-2.7 D6 specifies `mode="wait"` on AnimatePresence to ensure sequential enter/exit (not overlapping). Test with Chrome DevTools Layout Shift measurement.                                                                                                                                                                                                                                                                                                           |
| R-2.9  | **Morph orchestration timer leak on rapid selection/deselection**: If the user clicks a capsule, then immediately presses Escape, then clicks another capsule -- overlapping `setTimeout` timers from the first morph may advance phases incorrectly in the second morph. | WS-2.1                 | Medium     | Medium | WS-2.1 handles this with `phaseTimerRef` cleanup: `clearTimeout(phaseTimerRef.current)` on each new phase transition and on unmount. The `startMorph()` guard `if (phase !== 'idle') return` prevents initiating a new morph during an active one. The `cancelAnimation()` call stops any active camera spring. However, the reverse flow sets `phase` back to `idle` asynchronously -- if the user clicks a capsule during the final `focusing` phase of reverse, the guard may not catch it. Add an `isReversing` guard to `startMorph()`. |
| R-2.10 | **TarvaCORE TCP check false positives**: WS-1.5's TCP check to port 11435 may succeed even when TarvaCORE is not fully initialized (port bound but app not ready).                                                                                                        | WS-2.5                 | Low        | Medium | The TCP check validates port availability, not app readiness. WS-2.5's Status station should display "Connecting..." during the first 30 seconds after initial TCP success, then promote to OPERATIONAL only if subsequent checks remain stable.                                                                                                                                                                                                                                                                                             |

### Low-Impact Risks

| #      | Risk                                                                                                                                                                                                                                                     | SOW            | Likelihood | Impact | Mitigation                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-2.11 | **Beacon text unreadable at extreme Z0 zoom**: WS-2.7 beacon labels are 9px. At zoom 0.15, they render at ~1.4px visually.                                                                                                                               | WS-2.7         | High       | Low    | Acceptable per WS-2.7 D4 and VISUAL-DESIGN-SPEC.md Z0 note. Beacons communicate through color and glow, not text. Labels are supplementary for users at the Z0/Z1 boundary. |
| R-2.12 | **Active Work metric parsing fragility**: WS-2.7 parses pulse strings (e.g., "3 runs active") with regex `^(\d+)`. Non-English or non-numeric pulse strings contribute 0.                                                                                | WS-2.7         | Low        | Low    | Accepted. The aggregate shows partial data. If no apps produce parseable values, Active Work displays 0. Log a warning for unparseable pulse strings.                       |
| R-2.13 | **Station entrance stagger timing feels slow with 5+ stations**: WS-2.3 (Project Room) has 5 stations. At 80ms stagger + 50ms delay, the last station appears 420ms after the first. Combined with the 400ms unfurling phase, the total unfurl is 820ms. | WS-2.1, WS-2.3 | Medium     | Low    | Reduce stagger to 60ms for districts with 5+ stations. Alternatively, stagger only the first 3 stations and batch the remaining ones. Tunable during integration.           |

---

## 7. Effort & Sequencing Assessment (PMO)

### Execution Order

```
Week 1:    WS-2.1 (react-developer)    -- Morph Choreography [depends on Phase 1, starts Day 1]
           WS-2.6 (ui-designer)        -- Station Panel Framework [depends on Phase 0/1, starts Day 1]
           WS-2.7 (react-developer)    -- Constellation View [depends on Phase 1, parallel with WS-2.1]

Week 2:    WS-2.1 (react-developer)    -- Morph Choreography continues/completes
           WS-2.6 (ui-designer)        -- Station Panel Framework completes
           WS-2.7 (react-developer)    -- Constellation View completes (if not done in Week 1)

Week 3:    WS-2.2 (react-developer)    -- Agent Builder District [after WS-2.1 + WS-2.6]
           WS-2.3 (react-developer)    -- Project Room District [after WS-2.1 + WS-2.6, can overlap WS-2.2]

Week 4:    WS-2.2 (react-developer)    -- Agent Builder continues/completes
           WS-2.3 (react-developer)    -- Project Room continues/completes

Week 5:    WS-2.4 (react-developer)    -- Tarva Chat District
           WS-2.5 (react-developer)    -- TarvaCORE/ERP/CODE Districts (can overlap WS-2.4)

Week 6:    WS-2.4 (react-developer)    -- Tarva Chat completes
           WS-2.5 (react-developer)    -- TarvaCORE/ERP/CODE completes

Week 7-8:  Integration testing, performance tuning, conflict resolution buffer
           Cross-district composition test (all 6 districts rendering at 60fps)
           Morph + station + constellation view end-to-end validation
```

### Resource Loading

| Agent                     | WS-2.1   | WS-2.2   | WS-2.3   | WS-2.4 | WS-2.5   | WS-2.6   | WS-2.7   | Total Load             |
| ------------------------- | -------- | -------- | -------- | ------ | -------- | -------- | -------- | ---------------------- |
| `react-developer`         | 1.5-2 wk | 1-1.5 wk | 1-1.5 wk | 1 wk   | 1-1.5 wk | --       | 0.5-1 wk | **6-8 weeks (serial)** |
| `world-class-ui-designer` | --       | --       | --       | --     | --       | 1-1.5 wk | --       | **1-1.5 weeks**        |

### Effort Estimates vs. Complexity

| Workstream                     | Files                   | AC Count (est.)    | Realistic Estimate | Assessment                                                                                                                                                                                                                                                                                                                            |
| ------------------------------ | ----------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-2.1 Morph Choreography      | 9 files (create/modify) | ~25                | 1.5-2 weeks        | **Tight but achievable.** Core state machine + orchestration hook + 3 variant factories + 3 render components + URL sync. The morph is the hardest animation engineering in the project. Spring physics + setTimeout coordination + reverse flow + reduced-motion variants.                                                           |
| WS-2.2 Agent Builder           | 12 files (create)       | ~20                | 1-1.5 weeks        | **Achievable.** Route Handler + 4 stations + data hook + types + shared sub-components (PipelinePhaseBar, AgentListItem, DualLaunchTarget). Dual-launch target and 7-segment pipeline bar are the main engineering challenges.                                                                                                        |
| WS-2.3 Project Room            | 12 files (create)       | ~22                | 1-1.5 weeks        | **Tight.** 5 stations (most of any district) + Route Handler with 4 parallel upstream fetches + complex types (8 interfaces). Governance station with phase gates and truth entries is the most complex station body.                                                                                                                 |
| WS-2.4 Tarva Chat              | 9 files (create)        | ~18                | 1 week             | **Achievable.** 4 stations + Route Handler + data hook + types. Conversations table and agents list are straightforward data display components. Adaptive polling adds moderate complexity.                                                                                                                                           |
| WS-2.5 CORE/ERP/CODE           | 14 files (create)       | ~20                | 1-1.5 weeks        | **Achievable but breadth-heavy.** Three districts bundled: TarvaCORE (3 stations), TarvaERP (3 stations), tarvaCODE (2 stations) = 8 station components total. Each is simpler than Agent Builder or Project Room stations. tarvaCODE is mostly static placeholder content.                                                           |
| WS-2.6 Station Panel Framework | 10 files (create)       | ~22                | 1-1.5 weeks        | **Achievable.** Core components (StationPanel, StationHeader, StationBody, StationActions) + glass material CSS + luminous border CSS + receipt stamp hook + receipt stamp component + station context. Glass material recipes are well-specified from VISUAL-DESIGN-SPEC.md. Receipt stamp animation is the main creative challenge. |
| WS-2.7 Constellation View      | 8 files (create)        | ~24 (F10+A4+P4+D6) | 0.5-1 week         | **Achievable.** 3 components (ConstellationView, DistrictBeacon, GlobalMetrics) + CSS + types. Beacon rendering is simple (colored dots with glow). Metric aggregation is straightforward. The smallest workstream by implementation volume.                                                                                          |

**Total estimated acceptance criteria: ~151** across 7 workstreams.

### Parallel Execution Opportunities

1. **WS-2.1 (react-developer) and WS-2.6 (ui-designer) start Day 1.** No cross-dependency. Different agents. Full parallelism.
2. **WS-2.7 can interleave with WS-2.1** since both are assigned to the react-developer and have no mutual dependency. The react-developer could time-slice: morph choreography in the morning, constellation view in the afternoon. Alternatively, complete WS-2.7 first (smaller scope) then focus on WS-2.1.
3. **WS-2.2 and WS-2.3 can overlap** if the react-developer splits attention, but serial execution is safer for quality. Prioritize WS-2.2 first (Agent Builder is the reference district for the pattern; Project Room is the most complex).
4. **WS-2.4 and WS-2.5 can overlap** -- WS-2.5 includes mostly simpler stations that can be built alongside WS-2.4's more complex ones.

### Bottleneck Analysis

| Risk                                                               | Likelihood | Impact | Mitigation                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------ | ---------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **react-developer saturated** (6 workstreams, 6-8 weeks serial)    | High       | High   | The react-developer is the critical path for the entire phase. No other agent can absorb overflow. Mitigation: strict time-boxing per workstream, defer non-essential polish to Phase 3, prioritize WS-2.1 (blocks everything) and the two most complex districts (WS-2.2, WS-2.3).                                                                                                                 |
| **WS-2.6 delayed beyond Week 2**                                   | Medium     | High   | If the ui-designer takes longer than 1.5 weeks, the react-developer runs out of unblocked work after WS-2.1 + WS-2.7. Mitigation: the react-developer builds district content against a `<StationPanel>` interface stub (accepting props, rendering children, no glass/glow styling). Real styling swaps in when WS-2.6 delivers.                                                                   |
| **Performance regression when all 6 districts compose with morph** | Medium     | Medium | Individual districts may meet FPS targets, but composing 6 districts (with their Route Handlers, TanStack Query hooks, and station components) into the morph container may exceed memory or CPU budgets. Mitigation: viewport culling from WS-1.1 should prevent rendering off-screen districts. Only the selected district's stations are mounted. Reserve Week 7-8 for integration perf testing. |
| **Upstream app API changes during Phase 2 execution**              | Low        | Medium | District Route Handlers are built against current API surfaces. If an upstream app (Agent Builder, Project Room, Tarva Chat) changes its API, the Route Handler breaks silently (returns null data). Mitigation: each Route Handler logs warnings for unexpected response shapes. Pin upstream apps to known-good versions during Phase 2.                                                          |

### Critical Path Summary

```
Day 1 -----> WS-2.6 (1-1.5wk) -------> [off critical path after delivery]
Day 1 -----> WS-2.1 (1.5-2wk) --+
                                  |
Day 1 -----> WS-2.7 (0.5-1wk) --+  [off critical path]
                                  |
             [GATE: WS-2.1 + WS-2.6 both complete]
                                  |
                                  +---> WS-2.2 (1-1.5wk)
                                  +---> WS-2.3 (1-1.5wk)
                                  +---> WS-2.4 (1wk)
                                  +---> WS-2.5 (1-1.5wk)
                                  |
                                  +---> Integration buffer (1-2wk)

Critical path: WS-2.1 (2wk) -> WS-2.2 (1.5wk) -> WS-2.3 (1.5wk) -> WS-2.4 (1wk) -> WS-2.5 (1.5wk) + buffer (1wk) = 8.5 weeks
Optimistic path: WS-2.1 (1.5wk) -> WS-2.2+WS-2.3 overlap (2wk) -> WS-2.4+WS-2.5 overlap (1.5wk) + buffer (1wk) = 6 weeks
```

The "XL (6-8 weeks)" estimate is **achievable** with the following conditions:

1. WS-2.6 and WS-2.1 start Day 1, with WS-2.6 completing by end of Week 2.
2. WS-2.7 completes within Week 1 (it is the smallest workstream and frees the react-developer to focus on WS-2.1).
3. The react-developer time-slices WS-2.2+WS-2.3 in Weeks 3-4 and WS-2.4+WS-2.5 in Weeks 5-6.
4. At least 5 working days are reserved for cross-district integration testing and morph performance tuning.
5. All blocking conflicts (Conflict 1: port collision, Conflict 2: `src/types/` decision) are resolved before Day 1.

---

## 8. Consolidated Open Questions

### Blocking (must resolve before execution)

| ID       | Question                                                                                                                                                                                        | SOW                            | Impact                                                                                                                 | Recommended Owner          |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| OQ-2.0.1 | **Port 3005 collision**: Which port does Tarva Chat actually run on? WS-2.3 and WS-2.4 both default to `localhost:3005`.                                                                        | WS-2.3, WS-2.4                 | Blocks both district Route Handlers from returning correct data during development.                                    | Project Lead               |
| OQ-2.0.2 | **`src/types/` decision**: Should Phase 2 use `src/types/` for domain types (contradicting Phase 1 Gap 1 / D-IFACE-7), or relocate all types to `src/lib/`? See Conflict 2 for options A and B. | WS-2.1, WS-2.2, WS-2.5, WS-2.7 | Blocks all Phase 2 workstreams that create type files. Incorrect resolution requires rework of 5+ SOW file structures. | chief-technology-architect |
| OQ-2.0.3 | **District type file location pattern**: Once OQ-2.0.2 is resolved, which specific pattern should all districts follow? See Conflict 3 for the four current patterns.                           | WS-2.2, WS-2.3, WS-2.4, WS-2.5 | Blocks consistent file structure across district workstreams.                                                          | chief-technology-architect |

### Should Resolve Before Execution

| ID       | Question                                                                                                                                                    | SOW    | Impact                                                                                                                                       | Recommended Owner             |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| OQ-2.4.1 | Do the required Tarva Chat API endpoints (`/api/conversations`, `/api/agents`) exist in the current Tarva Chat codebase?                                    | WS-2.4 | If endpoints do not exist, the Route Handler will always return null data. The Conversations and Agents stations would be permanently empty. | react-developer (investigate) |
| OQ-2.5.1 | Does TarvaERP expose a `/api/health` endpoint that returns module-level health? WS-2.5 specifies per-module health dots but the data source is unconfirmed. | WS-2.5 | If no health endpoint exists, TarvaERP's Manufacturing Dashboard station will show static/stub data only.                                    | react-developer (investigate) |
| OQ-2.0.4 | Should the `StationContext.Provider` be mounted inside `<StationPanel>` or inside `<DistrictShell>`? See Gap 2.                                             | WS-2.6 | Affects how district workstreams compose station components. Must be decided before WS-2.2-2.5 begin.                                        | world-class-ui-designer       |
| OQ-2.0.5 | Should the district-to-station content mapping (Gap 4) be owned by WS-2.1 or be a separate integration task?                                                | WS-2.1 | Small task (~50-80 lines) but architecturally necessary. Must exist before any district content renders inside the morph container.          | react-developer               |

### Can Resolve During Execution

| ID       | Question                                                                                                                                                    | SOW    | Impact                                                                                                                                                        | Resolved By        |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| OQ-2.7.1 | Should beacons support click-to-flyTo (click a beacon to zoom into that district)?                                                                          | WS-2.7 | Low -- nice-to-have UX shortcut. Deferred by WS-2.7 D3 because 12px dots are poor click targets at Z0 zoom.                                                   | Future enhancement |
| OQ-2.7.2 | What happens if the districts store is still loading when Z0 is active (initial page load at Z0 zoom via URL params)?                                       | WS-2.7 | Low -- edge case for deep-linked Z0 URLs. Render beacons in UNKNOWN state until telemetry arrives.                                                            | WS-2.7 execution   |
| OQ-2.7.3 | Should the global metrics bar remain visible at the Z0/Z1 boundary during the crossfade?                                                                    | WS-2.7 | Low -- subtle visual polish. Metrics bar fades out with constellation view per WS-2.7 Q3.                                                                     | WS-2.7 execution   |
| OQ-2.1.1 | Should the morph transition disable backdrop-filter during the `focusing` and `morphing` phases (extending the pan-state optimization to morph)? See R-2.3. | WS-2.1 | Medium -- affects morph FPS. Can be tested during execution and enabled if needed.                                                                            | WS-2.1 execution   |
| OQ-2.3.1 | Should the Governance station's "Cancel Run" action directly call the Project Room cancellation API, or only open the Project Room UI?                      | WS-2.3 | Low -- scope clarification. WS-2.3 out-of-scope section says "all Launch interactions are read-only." Recommend opening Project Room UI.                      | WS-2.3 execution   |
| OQ-2.2.1 | Should the Agent Builder's AgentGen CLI status be determined by checking a PID file, a process listing, or a health endpoint?                               | WS-2.2 | Low -- affects CLI process status display. The CLI may not have a discoverable status mechanism. Default to "Status Unknown" if no detection method is found. | WS-2.2 execution   |

---

## 9. Phase Exit Criteria

| #       | Criterion                                                                                                                                                                                                                                                                                                                                           | Met?    | Evidence                                                         |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| EC-2.1  | **Morph choreography functional**: Clicking any capsule triggers the 4-phase forward morph (focusing -> morphing -> unfurling -> settled) with camera flyTo, capsule scale-up, sibling drift/fade, district shell appearance, and staggered station entrance. Reverse morph via Escape, breadcrumb, close button, or hub glyph restores the atrium. | Pending | WS-2.1 AC (all functional criteria)                              |
| EC-2.2  | **URL sync works**: `?district={id}` appears when a district is settled. Removing the param or pressing back returns to atrium. Loading a URL with `?district={id}` renders the district directly in settled state (no animation).                                                                                                                  | Pending | WS-2.1 URL sync + browser navigation test                        |
| EC-2.3  | **Station panel framework renders**: `<StationPanel>` produces a 3-zone layout (header, body, actions) with glass material, luminous border, and correct Z3 typography. All 5 body types (table, list, metrics, launch, custom) render correctly.                                                                                                   | Pending | WS-2.6 AC                                                        |
| EC-2.4  | **Receipt stamp fires**: Every station action button triggers a visual receipt stamp (trace ID, timestamp, result) that auto-hides after 2000ms. Receipt is recorded to `InMemoryReceiptStore`.                                                                                                                                                     | Pending | WS-2.6 receipt stamp AC                                          |
| EC-2.5  | **Agent Builder district renders**: 4 stations (Launch, Status, Pipeline, Library) display live data from Agent Builder at localhost:3000. Dual launch targets visible. Pipeline shows generation runs with phase progress. Library shows installed agents. Offline state handled gracefully.                                                       | Pending | WS-2.2 AC                                                        |
| EC-2.6  | **Project Room district renders**: 5 stations (Launch, Status, Runs, Artifacts, Governance) display live data from Project Room. Runs station shows active executions with progress. Governance station shows pending approvals and phase gates. Offline state handled gracefully.                                                                  | Pending | WS-2.3 AC                                                        |
| EC-2.7  | **Tarva Chat district renders**: 4 stations (Launch, Status, Conversations, Agents) display live data from Tarva Chat. Conversations station shows recent conversations with agent names and message counts. Agents station shows loaded agent roster. Offline state handled gracefully.                                                            | Pending | WS-2.4 AC                                                        |
| EC-2.8  | **TarvaCORE/TarvaERP/tarvaCODE districts render**: TarvaCORE shows TCP health status and Sessions stub. TarvaERP shows HTTP health and Manufacturing Dashboard with 5 module indicators. tarvaCODE shows permanent OFFLINE placeholder with "Coming Soon" description.                                                                              | Pending | WS-2.5 AC                                                        |
| EC-2.9  | **Constellation View (Z0) renders**: Zooming out past Z0 threshold (zoom < 0.27) shows 6 beacons with status-driven colors/glow, compact district codes, and 3 global metrics (Alert Count, Active Work, System Pulse). Zooming back in past 0.30 restores Z1.                                                                                      | Pending | WS-2.7 AC F1-F10, A1-A4, P1-P4, D1-D6                            |
| EC-2.10 | **Performance target met**: Morph transition (forward and reverse) sustains >= 55 avg FPS. Constellation Z0/Z1 crossfade completes in under 300ms with no dropped frames. Pan/zoom with a settled district and active station panels maintains >= 55 avg FPS.                                                                                       | Pending | Chrome DevTools Performance trace                                |
| EC-2.11 | **`prefers-reduced-motion` compliance**: All morph animations, station entrance stagger, beacon pulse/flash, and receipt stamp animations are disabled when reduced motion is active. Functional behavior (district selection, data display, receipt recording) is unchanged.                                                                       | Pending | WS-2.1 reduced motion AC, WS-2.6 reduced motion AC, WS-2.7 A3-A4 |
| EC-2.12 | **Zero TypeScript errors**: `pnpm typecheck` passes with zero errors across all Phase 2 files. No `any` types, no `@ts-ignore`.                                                                                                                                                                                                                     | Pending | `pnpm typecheck`                                                 |
| EC-2.13 | **All blocking open questions resolved** (OQ-2.0.1 through OQ-2.0.3 at minimum)                                                                                                                                                                                                                                                                     | Pending | Pre-execution resolution confirmed                               |
| EC-2.14 | **All districts use consistent type file locations and status enums** per Conflict 2, 3, and 4 resolutions                                                                                                                                                                                                                                          | Pending | Code review of import paths and type definitions                 |

**Phase 2 is COMPLETE when:** EC-2.1 through EC-2.12 are all met, AND EC-2.13 and EC-2.14 confirm structural consistency. Performance criterion EC-2.10 is the most likely to require iteration -- the morph transition (EC-2.1) combined with glass material `backdrop-filter` (EC-2.3) during camera animation is the highest-risk performance scenario. The pan-state optimization (`[data-panning="true"]`) and viewport culling (only the selected district is mounted) are the primary mitigations.

---

## 10. Appendices

### Appendix A: Risk Register (Consolidated from All SOWs)

| ID     | Risk                                              | SOW                    | Likelihood | Impact | Mitigation                                                                   |
| ------ | ------------------------------------------------- | ---------------------- | ---------- | ------ | ---------------------------------------------------------------------------- |
| R-2.1  | react-developer bottleneck (6/7 workstreams)      | All                    | High       | High   | Prioritize WS-2.1 + WS-2.7 first; time-box districts to 1 week each          |
| R-2.2  | WS-2.6 delivery blocks all district content       | WS-2.6                 | Medium     | High   | Start Day 1; stub interface if delayed                                       |
| R-2.3  | 60fps morph transition under load                 | WS-2.1                 | Medium     | High   | Extend pan-state optimization to morph phases; fallback to solid backgrounds |
| R-2.4  | Port 3005 collision (Project Room vs. Tarva Chat) | WS-2.3, WS-2.4         | High       | Medium | Resolve before execution; change Tarva Chat port                             |
| R-2.5  | Type location ambiguity                           | WS-2.2-2.5, WS-2.7     | High       | Medium | Establish canonical pattern before Day 1                                     |
| R-2.6  | Upstream app API endpoints missing                | WS-2.2, WS-2.3, WS-2.4 | Medium     | Medium | Graceful degradation built in; verify with curl pre-execution                |
| R-2.7  | InMemoryReceiptStore loses data on refresh        | WS-2.6                 | Medium     | Low    | By design; Phase 3 adds Supabase persistence                                 |
| R-2.8  | Z0/Z1 crossfade layout shift                      | WS-2.7                 | Low        | Medium | Same container dimensions + mode="wait"                                      |
| R-2.9  | Morph timer leak on rapid selection/deselection   | WS-2.1                 | Medium     | Medium | Timer cleanup + phase guards                                                 |
| R-2.10 | TarvaCORE TCP false positives                     | WS-2.5                 | Low        | Medium | Wait for stable checks before promoting to OPERATIONAL                       |
| R-2.11 | Beacon text unreadable at extreme Z0 zoom         | WS-2.7                 | High       | Low    | By design; beacons communicate through color/glow, not text                  |
| R-2.12 | Active Work metric parsing fragility              | WS-2.7                 | Low        | Low    | Partial data is acceptable; log warnings                                     |
| R-2.13 | Station stagger timing slow with 5+ stations      | WS-2.1, WS-2.3         | Medium     | Low    | Reduce stagger interval or batch; tunable during integration                 |

### Appendix B: Acceptance Criteria Summary

| SOW                            | # Criteria (est.) | Key Verification Methods                                                                                                                          |
| ------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-2.1 Morph Choreography      | ~25               | Performance profiling, state machine assertions, camera position verification, reduced-motion tests, URL sync verification                        |
| WS-2.2 Agent Builder           | ~20               | Mock data rendering, Route Handler curl tests, pipeline progress bar assertions, dual-launch target rendering                                     |
| WS-2.3 Project Room            | ~22               | Mock data rendering, Route Handler curl tests, 5-station composition, governance item display, spine object mapping                               |
| WS-2.4 Tarva Chat              | ~18               | Mock data rendering, Route Handler curl tests, conversation list display, agent roster, adaptive polling verification                             |
| WS-2.5 CORE/ERP/CODE           | ~20               | 3 districts x health state matrix (OPERATIONAL/DEGRADED/DOWN/OFFLINE/UNKNOWN), tarvaCODE permanent offline, ERP module grid                       |
| WS-2.6 Station Panel Framework | ~22               | Glass material CSS inspection, luminous border color variants, receipt stamp animation timing, 5 body type slot rendering, pan-state optimization |
| WS-2.7 Constellation View      | ~24               | Beacon position verification, health-to-color mapping, metric aggregation, Z0/Z1 crossfade, hysteresis boundary test                              |
| **Total**                      | **~151**          |                                                                                                                                                   |

### Appendix C: File Manifest (All Workstreams)

| File                                                                | WS  | Action | Description                                                                                             |
| ------------------------------------------------------------------- | --- | ------ | ------------------------------------------------------------------------------------------------------- |
| `src/stores/ui.store.ts`                                            | 2.1 | Modify | Add MorphState, morph actions, morph selectors                                                          |
| `src/types/morph.ts`                                                | 2.1 | Create | MorphPhase, MorphDirection, MorphState, MorphTimingConfig, spring configs, dimension constants          |
| `src/hooks/use-morph-choreography.ts`                               | 2.1 | Create | Central orchestration hook: 4-phase state machine, camera flyTo coordination, timer management          |
| `src/hooks/use-morph-variants.ts`                                   | 2.1 | Create | Framer Motion variant factory: selected capsule, sibling capsule, district shell, station card variants |
| `src/hooks/use-district-position.ts`                                | 2.1 | Create | Compute district shell world-space geometry from capsule ref                                            |
| `src/components/districts/morph-orchestrator.tsx`                   | 2.1 | Create | Render-tree component wiring hooks to capsule ring and district shell                                   |
| `src/components/districts/district-shell.tsx`                       | 2.1 | Create | Expanded district container (380x460px, active glass, luminous border)                                  |
| `src/components/districts/station-entrance.tsx`                     | 2.1 | Create | Staggered station card entrance/exit animation wrapper                                                  |
| `src/app/api/districts/agent-builder/route.ts`                      | 2.2 | Create | Route Handler proxying Agent Builder APIs                                                               |
| `src/hooks/use-agent-builder-district.ts`                           | 2.2 | Create | TanStack Query hook for Agent Builder district data                                                     |
| `src/types/districts/agent-builder.ts`                              | 2.2 | Create | Agent Builder district type definitions                                                                 |
| `src/components/stations/agent-builder/launch-station.tsx`          | 2.2 | Create | Dual-target launch panel (Web UI + CLI)                                                                 |
| `src/components/stations/agent-builder/status-station.tsx`          | 2.2 | Create | Universal health dashboard                                                                              |
| `src/components/stations/agent-builder/pipeline-station.tsx`        | 2.2 | Create | Generation runs table with phase progress                                                               |
| `src/components/stations/agent-builder/library-station.tsx`         | 2.2 | Create | Installed agents list                                                                                   |
| `src/components/stations/agent-builder/pipeline-phase-bar.tsx`      | 2.2 | Create | 7-segment pipeline progress indicator                                                                   |
| `src/components/stations/agent-builder/agent-list-item.tsx`         | 2.2 | Create | Single agent row in library list                                                                        |
| `src/components/stations/agent-builder/dual-launch-target.tsx`      | 2.2 | Create | Launch target card sub-component                                                                        |
| `src/components/stations/agent-builder/index.ts`                    | 2.2 | Create | Barrel export                                                                                           |
| `src/app/api/districts/project-room/route.ts`                       | 2.3 | Create | Route Handler proxying Project Room APIs (4 parallel fetches)                                           |
| `src/hooks/use-project-room.ts`                                     | 2.3 | Create | TanStack Query hook with 30s refetchInterval                                                            |
| `src/types/districts/project-room.ts`                               | 2.3 | Create | ProjectRoomSnapshot, ProjectRoomRun, ProjectRoomArtifact, ProjectRoomGovernanceItem, etc.               |
| `src/components/stations/project-room/launch-station.tsx`           | 2.3 | Create | App launcher panel                                                                                      |
| `src/components/stations/project-room/status-station.tsx`           | 2.3 | Create | Dependency health dashboard                                                                             |
| `src/components/stations/project-room/runs-station.tsx`             | 2.3 | Create | Active executions table                                                                                 |
| `src/components/stations/project-room/artifacts-station.tsx`        | 2.3 | Create | Recent artifacts list                                                                                   |
| `src/components/stations/project-room/governance-station.tsx`       | 2.3 | Create | Pending approvals + phase gates                                                                         |
| `src/components/stations/project-room/index.ts`                     | 2.3 | Create | Barrel export                                                                                           |
| `src/app/api/districts/tarva-chat/route.ts`                         | 2.4 | Create | Route Handler proxying Tarva Chat APIs                                                                  |
| `src/hooks/use-tarva-chat-data.ts`                                  | 2.4 | Create | TanStack Query hook with adaptive polling                                                               |
| `src/types/districts/tarva-chat.ts`                                 | 2.4 | Create | TarvaChatSnapshot, ChatConnection, McpHealthSummary, ChatConversation, ChatAgent, etc.                  |
| `src/components/stations/tarva-chat/chat-launch-station.tsx`        | 2.4 | Create | App launcher panel                                                                                      |
| `src/components/stations/tarva-chat/chat-status-station.tsx`        | 2.4 | Create | Connection health + MCP server summary                                                                  |
| `src/components/stations/tarva-chat/chat-conversations-station.tsx` | 2.4 | Create | Recent conversations table + throughput sparkline                                                       |
| `src/components/stations/tarva-chat/chat-agents-station.tsx`        | 2.4 | Create | Loaded agent roster + skill metrics                                                                     |
| `src/components/stations/tarva-chat/index.ts`                       | 2.4 | Create | Barrel export                                                                                           |
| `src/components/stations/tarva-core/core-district.tsx`              | 2.5 | Create | TarvaCORE district container                                                                            |
| `src/components/stations/tarva-core/core-status-station.tsx`        | 2.5 | Create | TCP health status display                                                                               |
| `src/components/stations/tarva-core/core-sessions-station.tsx`      | 2.5 | Create | Stub placeholder for future reasoning sessions                                                          |
| `src/components/stations/tarva-core/index.ts`                       | 2.5 | Create | Barrel export                                                                                           |
| `src/components/stations/tarva-erp/erp-district.tsx`                | 2.5 | Create | TarvaERP district container                                                                             |
| `src/components/stations/tarva-erp/erp-status-station.tsx`          | 2.5 | Create | HTTP health with module checks                                                                          |
| `src/components/stations/tarva-erp/erp-manufacturing-station.tsx`   | 2.5 | Create | Module health grid (5 modules)                                                                          |
| `src/components/stations/tarva-erp/index.ts`                        | 2.5 | Create | Barrel export                                                                                           |
| `src/components/stations/tarva-code/code-district.tsx`              | 2.5 | Create | Permanently dimmed district container                                                                   |
| `src/components/stations/tarva-code/code-status-station.tsx`        | 2.5 | Create | UNKNOWN placeholder with description                                                                    |
| `src/components/stations/tarva-code/index.ts`                       | 2.5 | Create | Barrel export                                                                                           |
| `src/types/districts/tarva-core.ts`                                 | 2.5 | Create | TarvaCORE-specific type extensions                                                                      |
| `src/types/districts/tarva-erp.ts`                                  | 2.5 | Create | TarvaERP-specific type extensions                                                                       |
| `src/types/districts/tarva-code.ts`                                 | 2.5 | Create | tarvaCODE-specific type extensions                                                                      |
| `src/components/districts/district-registry.ts`                     | 2.5 | Create | District registration (TarvaCORE, TarvaERP, tarvaCODE)                                                  |
| `src/components/stations/station-panel.tsx`                         | 2.6 | Create | Root 3-zone layout component with glass material                                                        |
| `src/components/stations/station-header.tsx`                        | 2.6 | Create | Header zone: district label + station title + icon                                                      |
| `src/components/stations/station-body.tsx`                          | 2.6 | Create | Body zone with 5 bodyType slot routing                                                                  |
| `src/components/stations/station-actions.tsx`                       | 2.6 | Create | Actions zone with receipt-wrapped buttons                                                               |
| `src/components/stations/receipt-stamp.tsx`                         | 2.6 | Create | Visual receipt stamp overlay animation                                                                  |
| `src/components/stations/station-panel.css`                         | 2.6 | Create | Glass material, luminous border, receipt CSS                                                            |
| `src/components/stations/use-receipt-stamp.ts`                      | 2.6 | Create | Hook: create receipt + fire stamp animation                                                             |
| `src/components/stations/station-context.tsx`                       | 2.6 | Create | StationContext for station-level shared state                                                           |
| `src/components/stations/index.ts`                                  | 2.6 | Create | Barrel export for framework components                                                                  |
| `src/components/districts/constellation-view.tsx`                   | 2.7 | Create | Z0 container: beacons + global metrics                                                                  |
| `src/components/districts/district-beacon.tsx`                      | 2.7 | Create | Individual beacon dot with glow + label                                                                 |
| `src/components/districts/global-metrics.tsx`                       | 2.7 | Create | 3 aggregate metrics bar                                                                                 |
| `src/types/district.ts`                                             | 2.7 | Modify | Add BeaconData, ConstellationMetrics, DistrictCode, DISTRICT_CODES                                      |
| `src/styles/constellation.css`                                      | 2.7 | Create | Beacon pulse/flash @keyframes, panning optimization, reduced-motion                                     |

**Total new files: ~62** (create) + **2** (modify: `ui.store.ts`, `src/types/district.ts`).

### Appendix D: Inputs Required by Next Phase

Phase 3 (Evidence Ledger + AI Integrations) requires the following outputs from Phase 2:

| Input                                                              | Source     | Consumed By                                                                                 |
| ------------------------------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------- |
| Morph state machine and `MorphOrchestrator` component              | WS-2.1     | WS-3.7 (Attention Choreography -- adjusts ambient effects based on `morphPhase`)            |
| `useReceiptStamp()` hook and `InMemoryReceiptStore` usage patterns | WS-2.6     | WS-3.1 (Evidence Ledger -- swaps `InMemoryReceiptStore` for Supabase-backed `ReceiptStore`) |
| Station panel framework (`<StationPanel>`, body type slots)        | WS-2.6     | WS-3.5 (Station Template Selection -- AI proposes dynamic `StationTemplate` configurations) |
| All 6 district content implementations with station components     | WS-2.2-2.5 | WS-3.6 (AI Narrated Telemetry -- adds AI-generated insights per-station)                    |
| Constellation View global metrics aggregation                      | WS-2.7     | WS-3.7 (Attention Choreography -- system health drives ambient effect intensity)            |
| District Route Handlers at `/api/districts/{name}`                 | WS-2.2-2.4 | WS-3.4 (AI Router -- real provider integration may use district data for context)           |
| `ui.store.ts` with morph actions (`startMorph`, `reverseMorph`)    | WS-2.1     | WS-3.3 (Command Palette Enhancement -- "go {district}" calls `startMorph()`)                |

### Appendix E: Phase 1 Lessons Applied

| Phase 1 Lesson                                                                | How Phase 2 Applies It                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `framer-motion` vs. `motion/react` import path                                | All 7 SOWs consistently use `import { motion, AnimatePresence } from 'motion/react'`. No instances of `framer-motion` package name.                                                                                                 |
| `npm` vs. `pnpm`                                                              | No SOW references `npm install`. WS-2.6 references `@tarva/ui` without specifying package manager commands. Phase 0 established `pnpm` as canonical.                                                                                |
| Triple type duplication (Phase 1 Conflict #1)                                 | Phase 2 introduces new type duplication risk (Conflict 2: `src/types/` proliferation). This is the same pattern re-emerging: multiple SOW authors independently creating types for the same domain concepts in different locations. |
| CSS @keyframes duplication (Phase 1 Conflict #2)                              | Phase 2 Gap 7 identifies the same issue: WS-2.7 creates `constellation.css` with ambient-tier @keyframes instead of adding to the canonical `ambient-effects.css` from WS-1.6.                                                      |
| `src/types/` directory not in AD-9 (Phase 1 Gap 1)                            | Despite the Gap 1 recommendation to remove it, 4 of 7 Phase 2 workstreams create files in `src/types/`. This escalates from a gap to a structural decision that must be made (OQ-2.0.2).                                            |
| District world coordinates not in a single canonical location (Phase 1 Gap 3) | Phase 2 compounds this: WS-2.1 hardcodes `DISTRICT_WORLD_POSITIONS` in two separate hooks. If Phase 1 resolves Gap 3 with a shared constant, WS-2.1 must import from it.                                                            |

### Appendix F: Architecture Decisions (Phase 2)

| ID           | Decision                                                                              | Rationale                                                                                                                                                                                                                 | Source                 |
| ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| D-MORPH-1    | 4-phase state machine (idle/focusing/morphing/unfurling/settled) with explicit timing | Design-intentional durations enable theatrical pacing. setTimeout chaining (not rAF) preserves design intent. Camera flyTo uses rAF internally.                                                                           | WS-2.1                 |
| D-MORPH-2    | URL sync via `history.replaceState`, not Next.js router                               | Avoids React re-renders from router state changes during the morph animation. Critical for 60fps.                                                                                                                         | WS-2.1                 |
| D-MORPH-3    | Scale transforms only (not width/height) for capsule-to-district transition           | Per AD-3 and VISUAL-DESIGN-SPEC.md 4.3: only use transform for movement. Width/height changes trigger layout recalculation.                                                                                               | WS-2.1                 |
| D-STATION-1  | StationPanel always uses Active Glass tier (not Standard)                             | Stations are always the focused element at Z3. Standard glass is for Z2 unfurled/resting state. Active glass is the correct tier per VISUAL-DESIGN-SPEC.md Section 1.7.                                                   | WS-2.6                 |
| D-STATION-2  | 4-layer luminous border (not 3-layer as stated in scope)                              | The CSS implementation uses outer bleed + tight outer + inner bleed + tight inner = 4 layers. The "3-layer technique" from VISUAL-DESIGN-SPEC.md Section 4.4 refers to the visible glow effect, not the box-shadow count. | WS-2.6                 |
| D-STATION-3  | Receipt trace IDs are 4-character hex (not UUID)                                      | Phase 2 receipts are visual rituals, not audit records. 4-char hex is sufficient for display and provides the "mission control" aesthetic. UUID comes in Phase 3 with Supabase persistence.                               | WS-2.6                 |
| D-BEACON-1   | No click-to-navigate on Z0 beacons                                                    | 12px dots are poor click targets at Z0 zoom levels. Navigation happens by zooming in to Z1 where capsules are clickable.                                                                                                  | WS-2.7 D3              |
| D-BEACON-2   | No counter-scaling of beacon labels at Z0                                             | Text at Z0 is expected to be barely readable per VISUAL-DESIGN-SPEC.md Section 3.2. Beacons communicate through color and glow. Counter-scaling adds complexity for minimal gain.                                         | WS-2.7 D4              |
| D-BEACON-3   | System Pulse uses worst-of logic excluding OFFLINE/UNKNOWN                            | OFFLINE means intentionally absent; UNKNOWN means no data. Neither should drag the pulse indicator to a bad state.                                                                                                        | WS-2.7 D2              |
| D-BEACON-4   | Active Work parsed from pulse string with regex `^(\d+)`                              | Pragmatic approach avoiding a separate numeric field in the telemetry contract. No-match apps contribute 0.                                                                                                               | WS-2.7 D7              |
| D-DISTRICT-1 | All district Route Handlers return data even when upstream is offline                 | Graceful degradation with null/empty fields and status flags. The telemetry aggregator (WS-1.5) determines overall health; district handlers provide enrichment data.                                                     | WS-2.2, WS-2.3, WS-2.4 |
| D-DISTRICT-2 | District data hooks poll slower than telemetry (30s vs. 5-15s)                        | District-level data (runs, artifacts, conversations) changes less frequently than health status. Slower polling reduces server load and network traffic.                                                                  | WS-2.3, WS-2.4         |
| D-DISTRICT-3 | tarvaCODE permanently renders OFFLINE/UNKNOWN                                         | Planning-stage application with no runtime. Stub district validates the architecture for future apps without requiring a running process.                                                                                 | WS-2.5                 |
