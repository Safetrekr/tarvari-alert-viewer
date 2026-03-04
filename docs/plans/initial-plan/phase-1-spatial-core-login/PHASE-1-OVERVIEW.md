# Phase 1 Overview: Spatial Core + Login

> **Synthesized by:** CTA + SPO + STW + PMO
> **Parent Plan:** MASTER-PLAN.md (pending creation)
> **Phase Objective:** Deliver a working ZUI with Launch Atrium, 6 capsules with live status, login experience, and ambient effects.
> **Estimated Complexity:** L (5-6 weeks)
> **Workstreams:** WS-1.1 (ZUI Engine), WS-1.2 (Launch Atrium), WS-1.3 (Login Experience), WS-1.4 (Navigation Instruments), WS-1.5 (Telemetry Aggregator), WS-1.6 (Ambient Effects Layer), WS-1.7 (Core Interfaces)
> **Agents:** `react-developer` (WS-1.1, WS-1.4), `world-class-ui-designer` (WS-1.2, WS-1.3, WS-1.6), `world-class-backend-api-engineer` (WS-1.5), `chief-technology-architect` (WS-1.7)
> **Date:** 2026-02-25

---

## 1. Executive Summary

Phase 1 transforms the validated tech spike from Phase 0 into a production spatial experience. It delivers seven workstreams across four agents: a CSS-transform-based ZUI engine, a six-capsule Launch Atrium with live telemetry, a theatrical passphrase login, navigation instruments (minimap, breadcrumb, zoom indicator, command palette stub), a server-side telemetry aggregator with adaptive polling, six ambient visual effects (particles, heartbeat, breathing, grid pulse, scanlines, film grain), and six TypeScript interface contracts that establish the integration seams for Phase 2 and beyond.

The seven SOWs are architecturally coherent in their macro design -- all align on the CSS transforms spatial engine (AD-1), three-tier animation architecture (AD-3), five-state health model (Gap 3), and Zustand subscribe pattern for 60fps DOM writes. However, five specific cross-workstream conflicts are identified in Section 3, of which two are high-severity: **triple type duplication** across WS-1.2, WS-1.5, and WS-1.7 for the same domain concepts (district identifiers, health states), and **CSS @keyframes duplication** between WS-1.2 and WS-1.6 defining identical animation names. Both are resolvable with clear precedence rules but require explicit coordination before execution begins.

The most significant planning risk is the **world-class-ui-designer bottleneck**: this agent owns three of seven workstreams (WS-1.2, WS-1.3, WS-1.6), representing approximately 60% of the visual surface area. The critical path runs through WS-1.1 (ZUI Engine) which blocks WS-1.2, WS-1.4, and WS-1.6 -- three of the four most visible deliverables. One open question (OQ-1.5.1: port 3000 conflict between Launch and Agent Builder) is blocking and must be resolved before WS-1.5 execution begins.

The "L (5-6 weeks)" estimate is achievable if the designer bottleneck is mitigated by starting WS-1.3 (Login Experience, independent of ZUI) immediately while WS-1.1 is in progress, and if WS-1.7 (Core Interfaces) delivers its type definitions early enough for WS-1.5 to consume them. The critical path spans approximately 4.5-5.5 weeks of serial work, leaving 0.5-1.5 weeks of buffer within the 6-week envelope.

---

## 2. Key Findings (grouped by theme)

### Spatial Engine Architecture

- **CSS transforms approach is consistently specified across all 7 SOWs.** The single-container `transform: translate(x, y) scale(z)` architecture validated in WS-0.3 is adopted without deviation. `SpatialViewport` captures events, `SpatialCanvas` receives transforms via Zustand `subscribe()` bypassing React reconciliation, and `transform-origin: 0 0` is mandated (WS-1.1 D2). All SOWs agree on this approach.
- **Camera store is the central nervous system.** WS-1.1 defines the production camera store with `CameraState` + `CameraActions` + exported `cameraSelectors` object. WS-1.2 reads semantic zoom level via `useSemanticZoom()`. WS-1.4 reads full camera state for minimap and breadcrumb. WS-1.6 subscribes to `isPanning` for pan-pause. WS-1.7 defines a `CameraController` interface that wraps the store. All five consumers agree on what they need from the camera store.
- **Pan-pause system is well-specified with clear ownership.** WS-1.1 owns the `usePanPause` hook (150ms debounce, returns `isPanActive`). WS-1.2 consumes it for hover suppression during pan. WS-1.6 consumes it to freeze ambient effects during motion. WS-1.4 consumes it for HUD opacity fade. The signal flow is unidirectional (camera store -> usePanPause -> consumers) with no circular dependencies.
- **Semantic zoom hysteresis is consistently defined.** Four levels (Z0 Constellation, Z1 Launch Atrium, Z2 District, Z3 Station) with enter/exit thresholds to prevent flickering. WS-1.1 implements the logic; WS-1.2 and WS-1.4 consume the level via `useSemanticZoom()`.

### Telemetry and Health Model

- **Five-state health model is adopted consistently.** All SOWs reference OPERATIONAL, DEGRADED, DOWN, OFFLINE, UNKNOWN per Gap Resolution #3. The OFFLINE vs. DOWN distinction (intentional absence vs. failure) is preserved through contact history tracking in WS-1.5.
- **Telemetry data flow is well-defined.** WS-1.5 implements a server-side Route Handler (`GET /api/telemetry`) that polls 6 local apps (HTTP health checks for 4, TCP socket for TarvaCORE, stub for tarvaCODE). The client-side `useTelemetry()` hook uses TanStack Query with adaptive polling intervals (15s normal, 5s degraded, 30s after 5 stable cycles). Data flows through the districts store to capsule components.
- **WS-1.7 defines the `SystemStateProvider` interface** that WS-1.5 implements. WS-1.5 OQ-3 explicitly asks for alignment with this interface, and the types are designed as a superset of what the interface needs.

### Login Experience

- **WS-1.3 is architecturally independent.** The login experience at `/login` has no dependency on the ZUI engine, telemetry, or ambient effects. It depends only on WS-0.1 (scaffolding) and WS-0.2 (design tokens). This independence makes it an ideal early-start workstream for the ui-designer while WS-1.1 is in progress.
- **Auth model is consistently simple.** Hardcoded passphrase (D-1.3.1), sessionStorage (tab-scoped, no cookies), client-side auth guard on `(launch)/layout.tsx`, `crypto.randomUUID()` session key. All SOWs agree on this model. WS-1.3 D-1.3.3 correctly identifies that server-side middleware cannot access sessionStorage.
- **ViewTransition to hub is specified with fallback.** React 19 `unstable_ViewTransition` is used with a `router.push()` fallback (D-1.3.6). The 600ms receipt stamp dwell time provides visual continuity between login and the spatial hub.

### Visual Design and Animation

- **Three-tier animation architecture (AD-3) is consistently applied.** Physics tier (rAF for camera, particles) is in WS-1.1 and WS-1.6. Choreography tier (Framer Motion for hover, selection, morph) is in WS-1.2 and WS-1.3. Ambient tier (CSS @keyframes for heartbeat, breathing, grid pulse) is in WS-1.2 and WS-1.6. No SOW violates the tier boundaries.
- **Glass material specification is consistent.** `rgba(255,255,255,0.03)` background, `backdrop-filter: blur(12px) saturate(120%)`, `1px solid rgba(255,255,255,0.06)` border, and multi-layer box-shadow glows. WS-1.2 uses this for capsules (D4 -- custom shell, not `@tarva/ui Card`). WS-1.6 does not apply glass material to ambient effects.
- **`prefers-reduced-motion` compliance is mandated across all visual workstreams.** WS-1.2 (AC A4), WS-1.3 (AC-12), and WS-1.6 (AC-13) all specify that animations stop when reduced motion is active.

### Interface Contracts and Type System

- **WS-1.7 defines six canonical interfaces with Phase 1 implementations.** CameraController (ManualCameraController), SystemStateProvider (PollingSystemStateProvider), ReceiptStore (InMemoryReceiptStore), StationTemplateRegistry (StaticStationTemplateRegistry), AIRouter (StubAIRouter -- returns `success: false` for all features), CommandPalette (StructuredCommandPalette). These create the integration seams for Phase 2-3 enhancements.
- **`AppIdentifier` is the canonical district identifier.** WS-1.7 D-10 establishes `src/lib/interfaces/types.ts` as the single source of truth for shared domain types. This directly conflicts with WS-1.2's `DistrictId` type in `src/types/district.ts` (see Conflict #1).
- **Station template system (AD-8) is well-defined.** Each district has 2 universal stations (Launch Briefing, Status Wall) plus app-specific stations. Templates describe structure, not React components (WS-1.7 D-5), enabling AI to propose templates without generating code.

### Naming and Terminology Compliance

- **"ember"/"teal" naming is used consistently** across all 7 SOWs. No instances of "frost," "cyan," or other prohibited color names.
- **"@tarva/ui" is used correctly** throughout. No standalone "shadcn" references.
- **`(launch)/` route group is used consistently** in all SOWs, per PLANNING-LOG.md Deviation #2.
- **One naming inconsistency exists**: WS-1.2 uses `ZUIViewport` in its dependency table (Section 3) while WS-1.1 names the component `SpatialViewport`. WS-1.2 also references `useZoomLevel()` while WS-1.1 exports `useSemanticZoom()`. These are alias issues that should be unified to WS-1.1's names.

---

## 3. Cross-Workstream Conflicts

### Conflict #1: Triple Domain Type Duplication (HIGH SEVERITY)

**SOWs involved:** WS-1.2 (Section 4.2) vs. WS-1.5 (Section 4.1) vs. WS-1.7 (Section 4.1)

**Disagreement:** Three workstreams independently define the same domain concepts in three different files with different names:

| Concept              | WS-1.2                                                        | WS-1.5                                                       | WS-1.7                                                    |
| -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| District identifier  | `DistrictId` in `src/types/district.ts`                       | `id` field in `AppTelemetry` in `src/lib/telemetry-types.ts` | `AppIdentifier` in `src/lib/interfaces/types.ts`          |
| Health/status state  | `HealthState` in `src/types/district.ts` (5 states)           | `AppStatus` in `src/lib/telemetry-types.ts` (5 states)       | `HealthState` in `src/lib/interfaces/types.ts` (5 states) |
| Telemetry data shape | `CapsuleTelemetry` in `src/types/district.ts`                 | `AppTelemetry` in `src/lib/telemetry-types.ts`               | `AppState` in `src/lib/interfaces/types.ts`               |
| District metadata    | `DistrictMeta` + `DISTRICTS` array in `src/types/district.ts` | `TelemetryAppConfig` array in `src/lib/telemetry-config.ts`  | `ALL_APP_IDS` in `src/lib/interfaces/types.ts`            |

All three define identical values (`'agent-builder' | 'tarva-chat' | 'project-room' | 'tarva-core' | 'tarva-erp' | 'tarva-code'`) and identical health states (`OPERATIONAL | DEGRADED | DOWN | OFFLINE | UNKNOWN`) but with different type names and in different files.

**Resolution recommendation:** WS-1.7 must be treated as the canonical source. Per WS-1.7 D-10, shared domain types belong in `src/lib/interfaces/types.ts`. Specifically:

1. `AppIdentifier` (from WS-1.7) is the canonical type for district identifiers. WS-1.2 must import it instead of defining `DistrictId`. If the `DistrictId` alias is preferred for readability in capsule code, it should be a `type DistrictId = AppIdentifier` re-export, not an independent definition.
2. `HealthState` (from WS-1.7) is the canonical type for health states. WS-1.2's `HealthState` in `src/types/district.ts` and WS-1.5's `AppStatus` in `src/lib/telemetry-types.ts` must import from WS-1.7's types.
3. `ALL_APP_IDS` (from WS-1.7) is the canonical list of district identifiers. WS-1.2's `DISTRICTS` array and WS-1.5's config array must derive from this.
4. The `src/types/district.ts` file (WS-1.2) should not exist. WS-1.2 should import its domain types from `@/lib/interfaces/types` and define only component-specific types (e.g., `CapsuleProps`, `CapsuleTelemetry` display shape) locally.

**Severity:** High. Three independent type definitions will compile correctly but create maintenance drift. If any SOW adds a 7th district or a 6th health state, only one file gets updated and the others diverge silently. Must be resolved before execution.

### Conflict #2: CSS @keyframes Duplication (HIGH SEVERITY)

**SOWs involved:** WS-1.2 (Section 4.10 -- `src/styles/atrium.css`) vs. WS-1.6 (Section 4.1 -- `src/components/ambient/ambient-effects.css`)

**Disagreement:** Both workstreams define identical CSS `@keyframes` animation names:

| Animation                   | WS-1.2 Location         | WS-1.6 Location                              | Identical?                                |
| --------------------------- | ----------------------- | -------------------------------------------- | ----------------------------------------- |
| `@keyframes heartbeat`      | `src/styles/atrium.css` | `src/components/ambient/ambient-effects.css` | Yes (same timing, opacity, scaleY values) |
| `@keyframes breathe`        | `src/styles/atrium.css` | `src/components/ambient/ambient-effects.css` | Yes (same 5s cycle, box-shadow values)    |
| `@keyframes grid-pulse`     | `src/styles/atrium.css` | `src/components/ambient/ambient-effects.css` | Yes (same 12s radial expansion)           |
| `@keyframes flash-error`    | `src/styles/atrium.css` | Not in WS-1.6                                | N/A                                       |
| `@keyframes scanline-sweep` | Not in WS-1.2           | `src/components/ambient/ambient-effects.css` | N/A                                       |

If both CSS files are imported, the browser will see duplicate `@keyframes` declarations. The last-loaded definition wins, which depends on CSS import order -- a fragile state.

**Resolution recommendation:** WS-1.6 owns all ambient-tier `@keyframes` definitions per its mandate as the "Ambient Effects Layer." WS-1.2 should not define `heartbeat`, `breathe`, or `grid-pulse` in `atrium.css`. Instead:

1. WS-1.6's `ambient-effects.css` is the single source of truth for all ambient-tier keyframes.
2. WS-1.2's `atrium.css` imports or references the keyframe names from WS-1.6 without redefining them.
3. WS-1.2 retains `flash-error` as it is atrium-specific (not an ambient effect).
4. Both CSS files must be imported in the correct order in `globals.css` or the layout.

**Severity:** High. Duplicate @keyframes declarations create a maintenance hazard and a load-order dependency. Must be resolved before execution.

### Conflict #3: Camera Controller Duality

**SOWs involved:** WS-1.1 (Section 4.1 -- `camera.store.ts`) vs. WS-1.7 (Section 4.2 -- `ManualCameraController`)

**Disagreement:** WS-1.1 defines a Zustand camera store with `flyTo()` using spring physics (semi-implicit Euler integration, rAF loop, convergence within 1000ms). WS-1.7 defines a `ManualCameraController` class that implements `CameraController` interface with its own `flyTo()` using `ease-out` cubic animation via a separate `requestAnimationFrame` loop and its own internal state (`currentPosition`, `isAnimating`). These are two independent animation systems for the same operation.

Additionally, WS-1.7's `ManualCameraController` contains hardcoded `DISTRICT_POSITIONS` (approximate coordinates), while WS-1.2 computes exact positions trigonometrically (300px radius, 60-degree spacing).

**Resolution recommendation:** WS-1.7's `ManualCameraController` should delegate to WS-1.1's camera store rather than maintaining independent animation state. Specifically:

1. `ManualCameraController.flyTo()` should call `useCameraStore.getState().flyTo(x, y, zoom)` rather than running its own rAF loop.
2. `ManualCameraController.getCurrentPosition()` should read from `useCameraStore.getState()`.
3. The `DISTRICT_POSITIONS` in `ManualCameraController` should be imported from a shared constant (ideally defined by WS-1.2 after its ring layout is computed) rather than hardcoded.
4. The `CameraController` interface remains unchanged -- it is the public contract. Only the Phase 1 implementation changes.

**Severity:** Medium. Two rAF loops competing for the same camera position will cause visual conflicts. However, since `ManualCameraController` is a Phase 1 stub that will be replaced, the impact is contained if the delegation pattern is adopted.

### Conflict #4: Store Ownership for Telemetry State

**SOWs involved:** WS-1.5 (Section 4.5 -- replaces `districts.store.ts`) vs. WS-1.7 (Section 4.3 -- `PollingSystemStateProvider`)

**Disagreement:** WS-1.5 replaces the WS-0.1 skeleton `districts.store.ts` with a full Zustand store that holds merged `SystemSnapshot` data with accumulating `responseTimeHistory`. WS-1.7 defines a `PollingSystemStateProvider` class that implements `SystemStateProvider` interface and creates its own polling loop, maintaining its own internal snapshot state independent of any Zustand store.

The question is: who owns the runtime telemetry state? WS-1.5's Zustand store (reactive, consumable by React components) or WS-1.7's `PollingSystemStateProvider` (class-based, consumed by interface callers)?

**Resolution recommendation:** WS-1.5's Zustand store is the runtime source of truth for telemetry state, consumed by all React components. WS-1.7's `PollingSystemStateProvider` should be a thin adapter that reads from WS-1.5's store (via `useDistrictsStore.getState()`) rather than maintaining its own polling loop. Specifically:

1. WS-1.5 owns the polling mechanism (TanStack Query + store sync).
2. WS-1.7's `PollingSystemStateProvider.getSnapshot()` reads from the WS-1.5 store.
3. WS-1.7's `PollingSystemStateProvider.subscribe()` delegates to the WS-1.5 store's `subscribe()`.
4. The `SystemStateProvider` interface contract is unchanged -- it provides a clean abstraction for Phase 2-3 consumers (especially AI features) that should not import Zustand stores directly.

**Severity:** Medium. Two independent polling loops would double the HTTP requests to `/api/telemetry` and create state divergence between what capsules display and what AI features read.

### Conflict #5: Component Name Aliases

**SOWs involved:** WS-1.2 (Section 3) vs. WS-1.1 (Section 4.3-4.4) and WS-1.4 (Section 4 vs. exported function naming)

**Disagreement:** WS-1.2's input dependencies table references `<ZUIViewport>` and `useZoomLevel()`, but WS-1.1 names these `<SpatialViewport>` and `useSemanticZoom()`. WS-1.4 exports `returnToHub()` in `spatial-actions.ts`, while WS-1.1 defines `flyToLaunch()` in the camera store, and WS-1.7's ManualCameraController uses `flyTo({ type: 'home' })`.

| Action              | WS-1.1 Name                    | WS-1.4 Name               | WS-1.7 Name                                  |
| ------------------- | ------------------------------ | ------------------------- | -------------------------------------------- |
| Container component | `SpatialViewport`              | (consumes)                | (not referenced)                             |
| Zoom level hook     | `useSemanticZoom()`            | (consumes)                | (not referenced)                             |
| Return to hub       | `flyToLaunch()` (store action) | `returnToHub()` (utility) | `flyTo({ type: 'home' })` (interface method) |

**Resolution recommendation:** WS-1.1's names are canonical for React components and hooks (it owns the ZUI engine). WS-1.2 must update its dependency references. WS-1.4's `returnToHub()` is a legitimate convenience wrapper around WS-1.1's `flyToLaunch()`. WS-1.7's `flyTo({ type: 'home' })` is the interface-level abstraction. All three can coexist at different abstraction layers:

- Store level: `useCameraStore.getState().flyToLaunch()`
- Utility level: `returnToHub()` (calls the store action)
- Interface level: `controller.flyTo({ type: 'home' })` (for AI and command palette consumers)

**Severity:** Low. Name mismatches in the SOW documentation will cause confusion during implementation but do not create runtime conflicts if the canonical names are established. Update WS-1.2 to use `SpatialViewport` and `useSemanticZoom()`.

---

### File Modification Convention

When a later workstream provides full file contents for a file already created by an earlier workstream, the later version supersedes the earlier version entirely. Any elements from the earlier version that must be preserved are explicitly listed in the later SOW's deliverable section.

| File                             | Created By           | Superseded By                           | Preservation Notes                                                                                    |
| -------------------------------- | -------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/stores/camera.store.ts`     | WS-0.1 (skeleton)    | WS-0.3 (spike) then WS-1.1 (production) | Full replacement. WS-1.1 evolves the spike API into production with full types, actions, selectors.   |
| `src/lib/spatial-math.ts`        | WS-0.3 (spike)       | WS-1.1 (production)                     | Full replacement. All functions carry forward with production signatures.                             |
| `src/app/(launch)/page.tsx`      | WS-0.1 (placeholder) | WS-1.1 (SpatialViewport integration)    | Full replacement. WS-1.1 renders `<SpatialViewport>` with test content. WS-1.2 adds capsule ring.     |
| `src/stores/districts.store.ts`  | WS-0.1 (skeleton)    | WS-1.5 (full telemetry store)           | Full replacement. WS-1.5 adds TanStack Query sync, responseTimeHistory, merged snapshots.             |
| `src/app/api/telemetry/route.ts` | WS-0.1 (placeholder) | WS-1.5 (full aggregator)                | Full replacement. WS-1.5 implements all health check logic, contact history, and response formatting. |
| `src/lib/constants.ts`           | WS-0.1 (skeleton)    | WS-1.1 (spatial constants)              | Additive. WS-1.1 extends with spatial constants (zoom range, thresholds, friction, spring config).    |

---

## 4. Architecture Decisions (consolidated from all SOWs)

| ID                    | Decision                                                                       | Rationale                                                                                                                                                                    | SOW Source     |
| --------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| **Spatial Engine**    |                                                                                |                                                                                                                                                                              |                |
| D-SPATIAL-1           | Camera store uses `immer` middleware (production)                              | Validated in WS-0.3. `subscribe()` bypasses React for 60fps DOM writes. `immer` overhead is limited to state update functions (once per rAF frame).                          | WS-1.1 D1      |
| D-SPATIAL-2           | `transform-origin: 0 0` is required on SpatialCanvas                           | Zoom-to-cursor formula assumes top-left origin. Confirmed by WS-0.3 spike.                                                                                                   | WS-1.1 D2      |
| D-SPATIAL-3           | Viewport culling uses unmount, not `visibility: hidden`                        | Unmounting frees DOM nodes at scale (20+ elements at Z1). Confirmed by WS-0.3 spike.                                                                                         | WS-1.1 D3      |
| D-SPATIAL-4           | `will-change: transform` is permanent on SpatialCanvas                         | Promotes to compositor layer for GPU acceleration. Memory cost acceptable for single promoted layer on desktop.                                                              | WS-1.1 D4      |
| D-SPATIAL-5           | URL sync uses `history.replaceState()`, not Next.js router                     | Camera position changes many times per second. `router.replace()` would trigger re-renders and RSC refetches.                                                                | WS-1.1 D5      |
| D-SPATIAL-6           | Pan-pause uses camera store flags + debounce hook (not EventTarget)            | Simpler than custom events. Camera store already knows panning/animating state.                                                                                              | WS-1.1 D6      |
| D-SPATIAL-7           | `Home` key for return-to-hub (not Space)                                       | Space conflicts with scroll, button activation, and future text input. Home has no common web conflicts.                                                                     | WS-1.4 D-5     |
| D-SPATIAL-8           | Minimap uses inline SVG (not Canvas)                                           | SVG provides declarative rendering, CSS styling, accessibility, and click events for 6 dots + 1 rectangle.                                                                   | WS-1.4 D-1     |
| D-SPATIAL-9           | Breadcrumb derives path from camera state, not URL                             | The ZUI is client-side -- no route changes during zoom. Camera position is the spatial truth.                                                                                | WS-1.4 D-2     |
| **Atrium & Capsules** |                                                                                |                                                                                                                                                                              |                |
| D-ATRIUM-1            | 3 telemetry rows visible at Z1 (Pulse, Last Event, Alerts)                     | 192x228px capsule has 120px telemetry zone. Three rows at 24px spacing fit cleanly. Remaining fields on hover/Z2.                                                            | WS-1.2 D1      |
| D-ATRIUM-2            | No `@tarva/ui Card` wrapper for capsules                                       | Capsule glass material, glow, and animation requirements diverge from Card defaults. Custom shell avoids fighting Card styles. Reuse Badge, StatusBadge, Sparkline, Tooltip. | WS-1.2 D4      |
| D-ATRIUM-3            | Absolute positioning for ring layout (not CSS grid/flex)                       | Trigonometric placement is the only way to get pixel-perfect circular arrangement. CSS containment isolates repaint.                                                         | WS-1.2 D3      |
| D-ATRIUM-4            | UNKNOWN health uses dashed border to differentiate from OFFLINE (solid border) | Both share dimmed treatment; border style distinguishes "no data ever" from "intentionally stopped."                                                                         | WS-1.2 D6      |
| D-ATRIUM-5            | `onSelect` callback, not direct router navigation                              | Capsule ring fires events; parent or WS-2.1 morph choreography consumes them for zoom transitions.                                                                           | WS-1.2 D8      |
| **Login**             |                                                                                |                                                                                                                                                                              |                |
| D-LOGIN-1             | Hardcode passphrase in `auth.store.ts` (not .env)                              | Internal localhost tool. Ceremonial gate, not a security boundary. Simplifies deployment.                                                                                    | WS-1.3 D-1.3.1 |
| D-LOGIN-2             | Manual `hydrate()` action (not Zustand `persist` middleware)                   | Only `sessionKey` is persisted. Manual hydrate is simpler, avoids unnecessary serialization, gives explicit control.                                                         | WS-1.3 D-1.3.2 |
| D-LOGIN-3             | Client-side auth guard (not Next.js middleware)                                | Auth is sessionStorage-only, not accessible in server middleware. Client-side check in `(launch)/layout.tsx`.                                                                | WS-1.3 D-1.3.3 |
| D-LOGIN-4             | React 19 `unstable_ViewTransition` with `router.push()` fallback               | Correct API for Next.js 16 + React 19 scene transitions. Fallback ensures login works if API changes.                                                                        | WS-1.3 D-1.3.6 |
| D-LOGIN-5             | Attractor glyph centered (not upper-right)                                     | Combined-recommendations overrides storyboard. Centered glyph IS the hub center before workspace materializes.                                                               | WS-1.3 D-1.3.4 |
| **Telemetry**         |                                                                                |                                                                                                                                                                              |                |
| D-TELEM-1             | Contact history stored in-memory (not DB)                                      | Localhost-only deployment. On restart, re-learning is correct behavior -- avoids stale DOWN states.                                                                          | WS-1.5 D-1     |
| D-TELEM-2             | `responseTimeHistory` maintained client-side (not server)                      | Sparkline data is a presentation concern. Client accumulates naturally via poll responses.                                                                                   | WS-1.5 D-2     |
| D-TELEM-3             | TCP check for TarvaCORE (not HTTP)                                             | TarvaCORE has no HTTP API (Gap 7). TCP socket to port 11435 is lightest-weight check. Server-side only.                                                                      | WS-1.5 D-10    |
| D-TELEM-4             | Malformed health responses treated as DEGRADED (not UNKNOWN/OFFLINE)           | App responded (alive) but with broken contract. DEGRADED + warning log is correct.                                                                                           | WS-1.5 D-6     |
| D-TELEM-5             | `select` callback in TanStack Query for store sync (not useEffect)             | Runs synchronously after fetch, before re-render. More efficient, co-located with query definition.                                                                          | WS-1.5 D-5     |
| **Ambient Effects**   |                                                                                |                                                                                                                                                                              |                |
| D-AMBIENT-1           | Canvas for particles, CSS for all other effects                                | Canvas uses 1 compositing layer for 18 particles (vs. 18 individual layers with CSS). rAF loop already exists for parallax.                                                  | WS-1.6 D-1.6.1 |
| D-AMBIENT-2           | Single `ambient-effects.css` for all @keyframes                                | Enables single `prefers-reduced-motion` block. Easier auditing of animation timings against spec.                                                                            | WS-1.6 D-1.6.2 |
| D-AMBIENT-3           | SVG `feTurbulence` filter for film grain (not PNG texture)                     | Resolution-independent grain that scales with DPI. PNG texture is the documented fallback.                                                                                   | WS-1.6 D-1.6.7 |
| D-AMBIENT-4           | FilmGrain is a Server Component (no `'use client'`)                            | Zero interactivity, no hooks, no browser APIs. SVG filter is declarative markup. Reduces client JS.                                                                          | WS-1.6 D-1.6.6 |
| D-AMBIENT-5           | Scanlines are NOT paused during pan                                            | Scanlines are triggered by discrete events (selection, auth), not ambient cycling. Sweep during pan is valid.                                                                | WS-1.6 D-1.6.4 |
| D-AMBIENT-6           | Parallax reads camera via `getState()`, not subscription                       | Avoids recreating rAF loop on every camera change (60x/sec during pan). Standard Zustand imperative pattern.                                                                 | WS-1.6 D-1.6.8 |
| **Core Interfaces**   |                                                                                |                                                                                                                                                                              |                |
| D-IFACE-1             | All interfaces use `readonly` on properties and return types                   | Enforces immutability at type level. Matches append-only receipts and read-only snapshots.                                                                                   | WS-1.7 D-1     |
| D-IFACE-2             | Phase 1 `InMemoryReceiptStore` uses UUID v4 (not v7)                           | UUID v7 needs polyfill. Phase 1 receipts are in-memory, lost on refresh. WS-3.1 will use proper v7.                                                                          | WS-1.7 D-2     |
| D-IFACE-3             | `CameraDirective` is universal navigation instruction format                   | Manual interactions and AI Camera Director produce the same data structure. Controller is source-agnostic.                                                                   | WS-1.7 D-3     |
| D-IFACE-4             | `SystemSnapshot` is read-only aggregate, not live subscription                 | Point-in-time snapshots avoid race conditions between AI reads and polling writes.                                                                                           | WS-1.7 D-4     |
| D-IFACE-5             | `StationTemplate` is configuration, not React component                        | Rendering maps `bodyType` to components (WS-2.x). AI can propose templates without generating code.                                                                          | WS-1.7 D-5     |
| D-IFACE-6             | `StubAIRouter` returns `success: false` (does not throw)                       | Callers check `response.success`. Indistinguishable from "all providers down" -- Phase 1 reality.                                                                            | WS-1.7 D-6     |
| D-IFACE-7             | Shared types in `src/lib/interfaces/types.ts`, NOT `src/types/`                | AD-9 does not include `src/types/`. `src/lib/` is established for utilities and constants per WS-0.1.                                                                        | WS-1.7 D-10    |

---

## 5. Cross-Workstream Dependencies

```
WS-1.7 (Core Interfaces)          WS-1.3 (Login Experience)
  |  [no deps except WS-0.1]         |  [depends on WS-0.1, WS-0.2]
  |                                    |  [fully independent of ZUI]
  v                                    v
WS-1.5 (Telemetry Aggregator)     (can start immediately)
  |  [depends on WS-0.1, WS-1.7]
  |
  v
WS-1.1 (ZUI Engine)
  |  [depends on WS-0.1, WS-0.3]
  |  [CRITICAL PATH -- blocks 3 workstreams]
  |
  +---> WS-1.2 (Launch Atrium)       [depends on WS-1.1, WS-0.2]
  |       [depends also on WS-1.5 for telemetry data integration]
  |
  +---> WS-1.4 (Navigation Instruments)  [depends on WS-1.1]
  |
  +---> WS-1.6 (Ambient Effects Layer)   [depends on WS-1.1, WS-0.2]
```

**Key dependency facts:**

- **WS-1.7 and WS-1.3 are independent of WS-1.1** and can start immediately after Phase 0 completes.
- **WS-1.5 depends on WS-1.7** (for `SystemStateProvider` interface alignment per WS-1.5 OQ-3), but can start its Route Handler implementation before WS-1.7 is complete.
- **WS-1.1 is the critical bottleneck.** It blocks WS-1.2, WS-1.4, and WS-1.6 -- three of the four most visible deliverables.
- **WS-1.2 has a soft dependency on WS-1.5** for telemetry data to populate capsule content. WS-1.2 can build capsules with mock data first, integrating real telemetry data when WS-1.5 delivers.
- **WS-1.4 and WS-1.6 are independent of each other** and can run in parallel after WS-1.1 completes.
- **WS-1.2, WS-1.4, and WS-1.6 are all independent of WS-1.3** (login), allowing the login to ship on its own track.

**External dependencies (outside Phase 1):**

- Phase 0 deliverables: buildable project (WS-0.1), design tokens (WS-0.2), spike-validated camera store and spatial math (WS-0.3).
- `@tarva/ui` components: StatusBadge, Sparkline, Badge, Tooltip, Input, CommandDialog, Breadcrumb.
- Agent Builder reference codebase for Zustand patterns (read-only).

---

## 6. Consolidated Open Questions

### Blocking (must resolve before execution)

| ID       | Question                                                                                                           | SOW    | Impact                                                                                                                                                                                                                        | Recommended Owner |
| -------- | ------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| OQ-1.5.1 | Should Tarva Launch run on a different dev port (e.g., 3100) to avoid conflicting with Agent Builder on port 3000? | WS-1.5 | Blocks telemetry aggregator from reaching Agent Builder during development. Three options: (a) Launch on port 3100, (b) Agent Builder port is configurable, (c) accept Agent Builder always shows OFFLINE during development. | Project Lead      |

### Should Resolve Before Execution

| ID       | Question                                                                                                                  | SOW    | Impact                                                                                            | Recommended Owner                  |
| -------- | ------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------- |
| OQ-1.7.1 | Should `camera.store.ts` re-export `SemanticLevel` from `src/lib/interfaces/types.ts` to avoid type duplication?          | WS-1.7 | Two identical `SemanticLevel` definitions will compile but create maintenance burden.             | react-developer                    |
| OQ-1.7.2 | Should `districts.store.ts` adopt `AppState` and `HealthState` types from WS-1.7?                                         | WS-1.7 | Aligns store with interface contract. Requires WS-1.5 to import from WS-1.7 types.                | react-developer / backend-engineer |
| OQ-1.5.3 | What is the WS-1.7 `SystemStateProvider` interface shape? WS-1.5 types should align with it.                              | WS-1.5 | If contracts diverge, WS-1.5 types need adaptation.                                               | chief-technology-architect         |
| OQ-1.6.1 | Camera store `isPanning` field: Will it be a boolean or a pan-state enum (idle/panning/momentum)?                         | WS-1.6 | `usePanPause` hook selector depends on the shape. Low risk -- hook is simple to adapt.            | react-developer                    |
| OQ-1.4.1 | What are the exact world coordinates for each of the 6 district positions? Minimap needs these to render dots accurately. | WS-1.4 | Affects minimap dot placement, breadcrumb district targets, and ManualCameraController positions. | WS-1.2 owner                       |

### Can Resolve During Execution

| ID       | Question                                                                             | SOW    | Impact                                                                                                                         | Resolved By              |
| -------- | ------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| OQ-1.1.1 | Should keyboard pan (arrow keys) be supported for accessibility?                     | WS-1.1 | Low. Defer to post-Phase 1. SpatialViewport can add handlers without API changes.                                              | WS-1.1 execution         |
| OQ-1.1.2 | Should trackpad pinch-to-zoom be handled differently from scroll wheel?              | WS-1.1 | Medium. `ctrlKey: true` detection in useZoom. Start with same factor; tune during integration.                                 | WS-1.1 execution         |
| OQ-1.1.3 | Where should viewport dimensions be stored?                                          | WS-1.1 | Low. Propose adding to camera store (option a). Switch to parameter approach (b) if unwanted subscriptions occur.              | WS-1.1 execution         |
| OQ-1.2.1 | What is the Tarva logomark SVG for the hub center glyph?                             | WS-1.2 | Low. Proceed with geometric placeholder (circle with inner ring).                                                              | Brand asset delivery     |
| OQ-1.2.3 | How does WS-1.5 telemetry aggregator deliver data to capsules?                       | WS-1.2 | Medium. Assume context provider + `useCapsuleData(districtId)` hook. Build capsules as controlled components.                  | WS-1.5 delivery          |
| OQ-1.3.1 | What is the exact passphrase value? SOW uses `"tarva"` as placeholder.               | WS-1.3 | Low. Single-line constant change.                                                                                              | Stakeholder confirmation |
| OQ-1.3.2 | Should the login page include ambient effects from WS-1.6?                           | WS-1.3 | Medium. Propose: login starts as pure void. If WS-1.6 effects are global, they appear naturally.                               | WS-1.6 execution         |
| OQ-1.3.4 | Does React 19 `unstable_ViewTransition` require config in `next.config.ts`?          | WS-1.3 | Low. Check Next.js 16 docs. One-line addition if needed.                                                                       | WS-1.3 execution         |
| OQ-1.4.5 | Should command palette use strong glass (`glass-strong`) or standard?                | WS-1.4 | Low. Strong glass is recommended per VISUAL-DESIGN-SPEC.md for modals/overlays.                                                | UI Designer              |
| OQ-1.5.2 | Should WS-1.5 register custom Launch statuses in `@tarva/ui`'s StatusBadge registry? | WS-1.5 | Low. HealthBadge overrides via explicit `category` prop; centralized registration would be cleaner if other consumers need it. | Backend Engineer         |
| OQ-1.5.4 | Should telemetry route be protected by authentication?                               | WS-1.5 | Low. Localhost-only tool. Defer to post WS-1.3.                                                                                | Project Lead             |
| OQ-1.6.2 | Grid pulse origin: should it track hub center in screen-space or use fixed 50%/50%?  | WS-1.6 | Low. Default to 50%/50%. WS-1.2 can pass screen-space hub position via props if needed.                                        | WS-1.6 execution         |

---

## 7. Phase Exit Criteria

| #     | Criterion                                                                                                                                                                                                | Met?    | Evidence                              |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------- |
| EC-1  | **ZUI engine functional**: SpatialViewport renders, camera store works with pan/momentum/zoom-to-cursor/flyTo/semantic zoom/viewport culling/URL sync. 60fps with 10+ elements.                          | Pending | WS-1.1 AC-1 through AC-17             |
| EC-2  | **Launch Atrium renders**: 6 capsules in ring at 300px radius, each showing 3 telemetry rows, health bar, sparkline. Hub center glyph breathing. Dot grid with radial pulse.                             | Pending | WS-1.2 AC F1-F10, D1-D10              |
| EC-3  | **Login experience works**: `/login` route, attractor glyph, any-key-to-type passphrase, receipt stamp, ViewTransition to hub. sessionStorage persistence. Auth guard on `(launch)/` routes.             | Pending | WS-1.3 AC-1 through AC-13             |
| EC-4  | **Navigation instruments work**: Minimap with district dots and viewport rectangle, breadcrumb with semantic path, zoom indicator badge, `Home` key return-to-hub, `Cmd+K` command palette stub.         | Pending | WS-1.4 AC-1 through AC-22             |
| EC-5  | **Telemetry aggregator works**: `GET /api/telemetry` returns valid `SystemSnapshot` for 6 apps. Adaptive polling (15s/5s/30s). Contact history (OFFLINE vs. DOWN).                                       | Pending | WS-1.5 AC-1 through AC-17             |
| EC-6  | **Ambient effects render**: 18 Canvas particles with Brownian drift and parallax, heartbeat pulse, hub breathing, grid pulse, scanline sweep, film grain. Pan-pause freezes/resumes all ambient effects. | Pending | WS-1.6 AC-1 through AC-20             |
| EC-7  | **Core interfaces defined**: All 6 interfaces + shared types in `src/lib/interfaces/`. Phase 1 implementations pass all acceptance criteria. `pnpm typecheck` passes with zero errors.                   | Pending | WS-1.7 AC-1 through AC-16             |
| EC-8  | **Performance target met**: Sustained 60fps (>= 55 avg, >= 45 min) during pan/zoom with all Phase 1 content active (capsules, ambient effects, HUD). Zero layout thrashing.                              | Pending | Chrome DevTools Performance trace     |
| EC-9  | **`prefers-reduced-motion` compliance**: All animations disabled when reduced motion is enabled system-wide.                                                                                             | Pending | WS-1.2 A4, WS-1.3 AC-12, WS-1.6 AC-13 |
| EC-10 | **Zero TypeScript errors**: `pnpm typecheck` passes with zero errors across all Phase 1 files. No `any` types, no `@ts-ignore`.                                                                          | Pending | `pnpm typecheck`                      |
| EC-11 | **All blocking open questions resolved** (OQ-1.5.1 at minimum)                                                                                                                                           | Pending | Pre-execution resolution confirmed    |

**Phase 1 is COMPLETE when:** EC-1 through EC-10 are all met, AND EC-11 is resolved. Performance criterion EC-8 is the most likely to require iteration -- the pan-pause system (D-SPATIAL-6) and viewport culling (D-SPATIAL-3) are the primary mitigations if FPS drops below budget when all content is composed.

---

## 8. Inputs Required by Next Phase

Phase 2 (District Morph + Content) requires the following outputs from Phase 1:

| Input                                                                                      | Source                             | Consumed By                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production ZUI engine (SpatialViewport, SpatialCanvas, camera store, all hooks)            | WS-1.1                             | WS-2.1 (Morph Choreography), WS-2.7 (Constellation View)                                                                                                                                       |
| Capsule ring with 6 district capsules and computed positions                               | WS-1.2                             | WS-2.1 (morph choreography needs capsule refs and positions), WS-2.2-2.5 (district content)                                                                                                    |
| Auth store and session management                                                          | WS-1.3                             | All Phase 2 workstreams (auth gate is the entry point)                                                                                                                                         |
| Navigation instruments (minimap, breadcrumb, zoom indicator, command palette)              | WS-1.4                             | WS-2.1 (morph choreography coordinates with camera flyTo), WS-3.3 (command palette enhancement)                                                                                                |
| Telemetry aggregator pipeline (Route Handler, TanStack Query hook, districts store)        | WS-1.5                             | WS-2.2-2.5 (district content reads telemetry), WS-3.1 (Supabase receipt system)                                                                                                                |
| Ambient effects layer (particles, heartbeat, breathing, grid pulse, scanlines, film grain) | WS-1.6                             | WS-3.7 (Attention Choreography), WS-4.4 (ambient tuning)                                                                                                                                       |
| 6 interface contracts with Phase 1 implementations                                         | WS-1.7                             | WS-2.6 (Station Panel Framework), WS-3.1 (ReceiptStore -> Supabase), WS-3.3 (CommandPalette enhancement), WS-3.4 (AIRouter real providers), WS-3.5 (StationTemplateRegistry dynamic templates) |
| Capsule ref hand-off contract (`Record<DistrictId, RefObject>`)                            | WS-1.2 D10                         | WS-2.1 (morph choreography needs direct DOM refs for position measurement)                                                                                                                     |
| Pan-pause system API (`usePanPause()`)                                                     | WS-1.1                             | WS-2.1 (pause morph during camera motion), WS-3.7 (attention choreography ambient tuning)                                                                                                      |
| District world-coordinate positions                                                        | WS-1.2 (trigonometric ring layout) | WS-1.4 (minimap dot placement), WS-1.7 (ManualCameraController navigation), WS-2.7 (constellation beacons)                                                                                     |

---

## 9. Gaps and Recommendations

### Gap 1: `src/types/` Directory Created by WS-1.2 but Not in AD-9 (HIGH IMPACT)

**Impact:** WS-1.2 creates `src/types/district.ts` with `DistrictId`, `HealthState`, `CapsuleTelemetry`, and related types. This directory is not part of the AD-9 project structure (established in WS-0.1). WS-1.7 D-10 explicitly states that shared types go in `src/lib/interfaces/types.ts`, NOT `src/types/`. If WS-1.2 creates `src/types/`, it introduces a directory outside the architectural convention and duplicates types that WS-1.7 canonically defines.

**Recommendation:** Remove `src/types/district.ts` from WS-1.2's deliverables. WS-1.2 should import `AppIdentifier`, `HealthState`, and `SemanticLevel` from `@/lib/interfaces/types`. Component-specific types (e.g., `CapsuleProps`, display-specific shapes) should be defined in the component file or in a co-located types file within `src/components/districts/types.ts`.

### Gap 2: No Testing Framework in Phase 1

**Impact:** Phase 0 deferred Vitest setup. Phase 1 now has 7 workstreams producing production code with a combined 122 acceptance criteria, but no automated test runner. The spatial math functions (WS-1.1) and interface implementations (WS-1.7) are ideal unit test candidates. The telemetry aggregator (WS-1.5) would benefit from integration tests against mock HTTP/TCP servers.

**Recommendation:** Add a WS-1.0 or pre-execution task to configure Vitest. This is a 2-4 hour effort that unblocks writing tests alongside implementation. If deferring, note that Phase 2 will inherit 7 workstreams of untested code, compounding the debt.

### Gap 3: District World Coordinates Not Defined in a Single Canonical Location

**Impact:** Three workstreams need district positions: WS-1.2 (capsule ring layout), WS-1.4 (minimap dot placement), and WS-1.7 (ManualCameraController navigation targets). WS-1.2 computes them trigonometrically (300px radius, 60-degree spacing, starting at 270 degrees / 12 o'clock). WS-1.4 OQ-1 asks for these coordinates. WS-1.7 hardcodes approximate values in `DISTRICT_POSITIONS`. There is no single constant file that all three reference.

**Recommendation:** WS-1.2 should export computed district positions as a shared constant (e.g., `DISTRICT_POSITIONS` in `src/lib/constants.ts` or `src/lib/interfaces/types.ts`). WS-1.4's minimap and WS-1.7's ManualCameraController should import from this constant rather than computing or hardcoding their own positions. Define this as a cross-workstream coordination task before execution.

### Gap 4: `usePanPause` Hook Defined Twice

**Impact:** WS-1.1 (Section 4.8) defines `usePanPause` as a deliverable of the ZUI engine in `src/hooks/use-pan-pause.ts`. WS-1.6 (Section 4.2) also defines `usePanPause` as a deliverable of the ambient effects layer. The implementations described are functionally identical (150ms debounce, reads `isPanning` from camera store). Two SOWs claim ownership of the same hook.

**Recommendation:** WS-1.1 owns the `usePanPause` hook. It is an engine-level primitive (like `useSemanticZoom` and `useFlyTo`) that other layers consume. WS-1.6 should import from WS-1.1, not define its own. Remove `usePanPause` from WS-1.6's deliverable list and replace with an import reference.

### Gap 5: No Explicit Integration Test for Full-Stack Composition

**Impact:** Each workstream has its own acceptance criteria, but there is no criterion that validates the full composition: login -> ZUI engine + capsule ring + telemetry + ambient effects + navigation instruments all rendering simultaneously at 60fps. Performance regressions from composing all layers are a known risk (WS-1.1 R9: "Downstream workstreams add content that exceeds performance budget").

**Recommendation:** Add a Phase 1 integration acceptance criterion: "With all Phase 1 workstreams composed, sustained pan/zoom at the Z1 (Launch Atrium) view maintains >= 55 avg FPS with Chrome DevTools Performance panel, and no visual glitches are observed during 30 seconds of continuous interaction." This should be the final verification before marking Phase 1 complete.

### Gap 6: Styled-jsx Decision in WS-1.3 May Conflict with Project Conventions

**Impact:** WS-1.3 D-1.3.7 specifies styled-jsx for component-scoped @keyframes in the login experience. The rest of the project uses either global CSS files (`globals.css`, `spatial-tokens.css`, `atrium.css`, `ambient-effects.css`) or Tailwind utility classes. Styled-jsx is a different CSS-in-JS approach that may not be configured in the Next.js 16 project (it was the default in earlier Next.js versions but may need explicit setup in Next.js 16).

**Recommendation:** Verify styled-jsx availability in the Phase 0 scaffolding. If not available or not desired for consistency, WS-1.3 should use a co-located CSS Module (`login-scene.module.css`) or add its @keyframes to a login-specific CSS file in `src/styles/`. The SOW already acknowledges this as a fallback (D-1.3.7: "If the implementer prefers CSS Modules, the keyframes can be extracted").

### Gap 7: `@tarva/ui` Component APIs Referenced but Not Verified

**Impact:** WS-1.5 Appendix C documents specific `@tarva/ui` component APIs (StatusBadge, Sparkline, Badge) based on source code reading. WS-1.2 references `@tarva/ui` Sparkline, Badge, StatusBadge, and Tooltip. WS-1.4 references `@tarva/ui` Badge, CommandDialog, and Breadcrumb. If any of these APIs have changed since the SOW was written, the integration will fail at build time.

**Recommendation:** Before execution begins, verify the `@tarva/ui` package version and confirm that all referenced component APIs (StatusBadge `category` prop, Sparkline CSS custom property names, CommandDialog slot structure, Breadcrumb `asChild` pattern) match the installed version. This is a 30-minute verification task.

### Gap 8: WS-1.2 References Non-Existent Hook Name

**Impact:** WS-1.2 Section 3 references `useZoomLevel()` as a hook provided by WS-1.1. WS-1.1 does not export a hook by this name. The corresponding hook is `useSemanticZoom()`, which returns the current semantic level. This mismatch will cause an import error if WS-1.2 is implemented literally.

**Recommendation:** Update WS-1.2 to reference `useSemanticZoom()` from WS-1.1. Similarly, update WS-1.2's reference to `<ZUIViewport>` to `<SpatialViewport>`.

---

## 10. Effort & Sequencing Assessment (PMO)

### Execution Order

```
Week 1:    WS-1.7 (CTA)              -- Core Interfaces [no deps, can start Day 1]
           WS-1.3 (ui-designer)      -- Login Experience [no ZUI deps, can start Day 1]
           WS-1.1 (react-developer)  -- ZUI Engine [CRITICAL PATH, starts Day 1]

Week 2:    WS-1.1 (react-developer)  -- ZUI Engine continues
           WS-1.5 (backend-engineer) -- Telemetry Aggregator [after WS-1.7 types]
           WS-1.3 (ui-designer)      -- Login Experience continues/completes

Week 3:    WS-1.1 (react-developer)  -- ZUI Engine completes
           WS-1.5 (backend-engineer) -- Telemetry Aggregator completes
           WS-1.4 (react-developer)  -- Navigation Instruments [after WS-1.1]

Week 4:    WS-1.2 (ui-designer)      -- Launch Atrium [after WS-1.1, uses WS-1.5 data]
           WS-1.4 (react-developer)  -- Navigation Instruments completes
           WS-1.6 (ui-designer)      -- Ambient Effects [after WS-1.1, if designer available]

Week 5:    WS-1.2 (ui-designer)      -- Launch Atrium completes
           WS-1.6 (ui-designer)      -- Ambient Effects completes

Week 5-6:  Integration testing, performance tuning, conflict resolution buffer
```

### Resource Loading

| Agent                              | WS-1.1   | WS-1.2   | WS-1.3   | WS-1.4   | WS-1.5   | WS-1.6   | WS-1.7   | Total Load               |
| ---------------------------------- | -------- | -------- | -------- | -------- | -------- | -------- | -------- | ------------------------ |
| `react-developer`                  | 2-2.5 wk | --       | --       | 1-1.5 wk | --       | --       | --       | **3-4 weeks (serial)**   |
| `world-class-ui-designer`          | --       | 1.5-2 wk | 1-1.5 wk | --       | --       | 1-1.5 wk | --       | **3.5-5 weeks (serial)** |
| `world-class-backend-api-engineer` | --       | --       | --       | --       | 1-1.5 wk | --       | --       | **1-1.5 weeks**          |
| `chief-technology-architect`       | --       | --       | --       | --       | --       | --       | 0.5-1 wk | **0.5-1 week**           |

### Effort Estimates vs. Complexity

| Workstream | Deliverable Count         | AC Count           | Realistic Estimate | Assessment                                                                                                                                              |
| ---------- | ------------------------- | ------------------ | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WS-1.1     | 14 files (evolve/create)  | 17                 | 2-2.5 weeks        | **Realistic but tight.** Production camera store, 10 spatial math functions, 8 hooks, 3 components. Evolves validated spike code, which reduces risk.   |
| WS-1.2     | 10 files (create)         | 26 (F10+A6+P6+D10) | 1.5-2 weeks        | **Achievable.** Mostly component implementation with well-specified CSS and Framer Motion. Trigonometric ring layout is the main engineering challenge. |
| WS-1.3     | 8 files (create)          | 13                 | 1-1.5 weeks        | **Realistic.** Self-contained login flow. Theatrical animations are well-specified. ViewTransition is the main uncertainty.                             |
| WS-1.4     | 7 files (create)          | 22                 | 1-1.5 weeks        | **Achievable.** Components are relatively simple (SVG minimap, breadcrumb, badge). Command palette stub uses `@tarva/ui` CommandDialog.                 |
| WS-1.5     | 10 files (create/replace) | 17                 | 1-1.5 weeks        | **Realistic.** Server-side Route Handler + client hook + 4 display components. TCP check for TarvaCORE is non-trivial but well-specified.               |
| WS-1.6     | 9 files (create)          | 20                 | 1-1.5 weeks        | **Achievable.** Canvas particles are the main effort. CSS animations are well-specified from the VISUAL-DESIGN-SPEC.md.                                 |
| WS-1.7     | 9 files (create)          | 16                 | 0.5-1 week         | **Realistic.** Primarily TypeScript interface definitions with stub implementations. ManualCameraController spring animation is the main logic.         |

**Total acceptance criteria: 131** across 7 workstreams. Each criterion is a specific, verifiable checkpoint.

### Parallel Execution Opportunities

1. **WS-1.7 and WS-1.3 start Day 1.** Both have no dependency on WS-1.1. WS-1.7 produces types consumed by WS-1.5. WS-1.3 is fully independent.
2. **WS-1.1 starts Day 1.** It is the critical path and should begin immediately.
3. **WS-1.5 starts after WS-1.7 types are available** (~end of Week 1). The Route Handler can be built before WS-1.7 is fully complete -- only the type alignment matters.
4. **WS-1.2 and WS-1.6 can overlap** if the ui-designer splits attention, but serial execution is safer for quality. WS-1.2 should come first (it is more complex and blocks Phase 2).
5. **WS-1.4 fills the react-developer's gap** between WS-1.1 completion and Phase 2 start.

### Bottleneck Risks

| Risk                                                                           | Likelihood | Impact                                                                           | Mitigation                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **world-class-ui-designer overloaded** (3 workstreams: WS-1.2, WS-1.3, WS-1.6) | High       | High -- designer is on the critical path for 3.5-5 weeks                         | Start WS-1.3 immediately (no ZUI deps); pipeline WS-1.2 before WS-1.6; consider splitting WS-1.6 particle implementation to react-developer if designer falls behind                                        |
| **WS-1.1 takes longer than 2.5 weeks**                                         | Medium     | High -- delays WS-1.2, WS-1.4, WS-1.6 by the same amount                         | WS-1.1 evolves validated spike code, reducing risk. Time-box to 2.5 weeks; if incomplete, ship a minimal API surface that unblocks downstream workstreams and iterate.                                      |
| **Port 3000 conflict unresolved** (OQ-1.5.1)                                   | Medium     | Medium -- Agent Builder always shows OFFLINE during dev                          | Resolve before WS-1.5 starts. Recommended: Launch on port 3100 (`next dev --port 3100` in `package.json` scripts).                                                                                          |
| **Type duplication not resolved before execution** (Conflict #1)               | Medium     | Medium -- three SOWs create divergent type files, requiring cleanup sprint       | Resolve canonical type location (WS-1.7's `src/lib/interfaces/types.ts`) before any SOW begins execution. Update WS-1.2 and WS-1.5 to import from WS-1.7.                                                   |
| **Performance regression when all layers compose**                             | Medium     | Medium -- individual workstreams pass FPS targets but composition exceeds budget | Reserve Week 5-6 for integration performance testing. Pan-pause (D-SPATIAL-6) and viewport culling (D-SPATIAL-3) are primary defenses. Profile and optimize the most expensive layer if budget is exceeded. |
| **React 19 ViewTransition API breaks or changes** (WS-1.3 R-1.3.1)             | Low        | Medium -- login-to-hub transition falls back to `router.push()`                  | Fallback is already specified in WS-1.3 D-1.3.6. Pin React 19 minor version.                                                                                                                                |

### Critical Path Summary

```
Day 1 -----> WS-1.7 (0.5-1wk) -----> WS-1.5 (1-1.5wk) -----> [off critical path after delivery]
Day 1 -----> WS-1.3 (1-1.5wk) -----> [off critical path after delivery]
Day 1 -----> WS-1.1 (2-2.5wk) -----> WS-1.4 (1-1.5wk) -----> [off critical path]
                                  \-> WS-1.2 (1.5-2wk) -----> [on critical path: blocks Phase 2]
                                  \-> WS-1.6 (1-1.5wk) -----> [off critical path]
```

**Critical path: WS-1.1 (2-2.5wk) -> WS-1.2 (1.5-2wk) + integration buffer (0.5-1wk) = 4-5.5 weeks.**

The "L (5-6 weeks)" estimate is **achievable** with the following conditions:

1. WS-1.7 and WS-1.3 start Day 1 to get the designer and CTA productive immediately.
2. WS-1.1 completes within 2.5 weeks to unblock the three visual workstreams.
3. The designer pipelines WS-1.3 -> WS-1.2 -> WS-1.6 without gaps.
4. The react-developer pipelines WS-1.1 -> WS-1.4 without gaps.
5. At least 3 working days are reserved for integration testing and performance tuning.

### Recommended Execution Order Within Phase

1. **Pre-execution (Day 0):** Resolve OQ-1.5.1 (port conflict). Establish canonical type location (Conflict #1 resolution). Verify `@tarva/ui` component APIs (Gap 7). Resolve @keyframes ownership (Conflict #2 resolution).
2. **Week 1:** WS-1.7 (CTA), WS-1.3 (designer), WS-1.1 start (react-developer).
3. **Week 2:** WS-1.1 continues. WS-1.5 starts (backend-engineer, after WS-1.7 types). WS-1.3 completes.
4. **Week 3:** WS-1.1 completes. WS-1.5 completes. WS-1.4 starts (react-developer). WS-1.2 starts (designer).
5. **Week 4:** WS-1.4 completes. WS-1.2 continues. WS-1.6 starts (designer, if capacity allows overlap with WS-1.2).
6. **Week 5:** WS-1.2 completes. WS-1.6 completes. Integration testing begins.
7. **Week 5-6:** Performance tuning, conflict resolution, composition verification. Phase gate review.

---

## Appendix A: Risk Register (Consolidated from All SOWs)

| ID      | Risk                                                                 | SOW    | Likelihood | Impact | Mitigation                                                                                                                                                    |
| ------- | -------------------------------------------------------------------- | ------ | ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-1.1.2 | `backdrop-filter: blur(12px)` drops FPS below 45 during pan          | WS-1.1 | High       | Medium | Pan-pause system disables backdrop-filter during motion, re-enables after 150ms stillness. Fallback: solid semi-transparent backgrounds.                      |
| R-1.1.9 | Downstream workstreams add content exceeding performance budget      | WS-1.1 | Medium     | Medium | Engine validated with 10+ elements. Pan-pause and viewport culling are primary defenses. Monitor FPS as content integrates.                                   |
| R-1.2.1 | Backdrop-filter jank during pan/zoom                                 | WS-1.2 | High       | Medium | `[data-panning="true"]` CSS override disables backdrop-filter and simplifies glow to single-layer during pan. `contain: layout style paint` on every capsule. |
| R-1.2.5 | Capsule ref hand-off to WS-2.1 breaks during morph                   | WS-1.2 | Medium     | High   | Define ref contract (`Record<DistrictId, RefObject>`) as shared type. Unit test asserting all 6 refs populated.                                               |
| R-1.3.1 | React 19 ViewTransition API instability                              | WS-1.3 | Medium     | Medium | Fallback to `router.push()` when ViewTransition is undefined. Pin React 19 minor version.                                                                     |
| R-1.3.3 | Flash of unprotected content on initial load                         | WS-1.3 | Medium     | Medium | Auth guard renders full-screen `bg-void` div while checking auth. Matches login background -- no flash.                                                       |
| R-1.3.7 | Race condition between hydrate() and auth guard redirect             | WS-1.3 | Medium     | High   | Auth guard uses `setTimeout(0)` to defer redirect. Reads `getState()` (sync snapshot) inside timeout.                                                         |
| R-1.4.1 | Camera store `flyTo()` not ready when WS-1.4 begins                  | WS-1.4 | Medium     | High   | Stub `flyTo()` with instant position set. Replace when WS-1.1 delivers.                                                                                       |
| R-1.4.4 | `Cmd+K` conflicts with browser address bar focus                     | WS-1.4 | Medium     | Medium | `event.preventDefault()` in keyboard handler. Standard approach used by VS Code, Linear, Notion.                                                              |
| R-1.4.6 | District positions not available when minimap first renders          | WS-1.4 | High       | Medium | Render minimap with hub dot and viewport rect even without district data. Dots appear as telemetry arrives.                                                   |
| R-1.5.1 | Existing apps lack `/api/health` endpoints                           | WS-1.5 | High       | Medium | Graceful degradation built in. Apps without health endpoints are OFFLINE (never contacted) or DOWN (if previously known).                                     |
| R-1.5.3 | Port conflict: Launch and Agent Builder both on port 3000            | WS-1.5 | High       | Medium | OQ-1.5.1. Configure Launch on port 3100 via `next dev --port 3100`.                                                                                           |
| R-1.6.1 | Canvas particle rendering competes with camera physics rAF loop      | WS-1.6 | Medium     | High   | Particle loop is lightweight (18 arcs per frame). WS-0.3 validated Canvas + CSS at 60fps. Reduce count or skip frames if tight.                               |
| R-1.6.4 | Camera store `isPanning` not available at WS-1.6 implementation time | WS-1.6 | Medium     | Low    | Safe degradation: effects animate continuously. Pan-pause activates once WS-1.1 adds isPanning.                                                               |
| R-1.7.1 | Interface contracts change significantly in Phase 2-3                | WS-1.7 | Medium     | High   | Interfaces designed with extension points (optional fields, discriminated unions, generic payloads). Breaking changes require ADR approval.                   |
| R-1.7.5 | Type duplication between camera.store.ts and interfaces/types.ts     | WS-1.7 | High       | Low    | Both define identical union types. OQ-1.7.1 tracks resolution. Compile-time safe regardless.                                                                  |

---

## Appendix B: Acceptance Criteria Summary

| SOW       | # Criteria | Key Verification Methods                                                                                                 |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| WS-1.1    | 17         | React DevTools for re-render verification, Chrome DevTools Performance panel, manual interaction tests, `pnpm typecheck` |
| WS-1.2    | 26         | Snapshot tests, Framer Motion variant assertions, visual regression, CSS inspection, DOM measurement, code review        |
| WS-1.3    | 13         | Visual inspection, keyboard interaction tests, sessionStorage verification, media query tests                            |
| WS-1.4    | 22         | Visual inspection, keyboard shortcut tests, screen reader audit, `pnpm typecheck`                                        |
| WS-1.5    | 17         | `curl` + `jq` API validation, network request timing, store state inspection, `pnpm typecheck`                           |
| WS-1.6    | 20         | Visual inspection, performance traces, code review against spec, Canvas draw call analysis                               |
| WS-1.7    | 16         | Import and type-check verification, method call verification, `pnpm typecheck`                                           |
| **Total** | **131**    |                                                                                                                          |

---

## Appendix C: File Manifest (All Workstreams)

| File                                               | WS  | Action  | Description                                                             |
| -------------------------------------------------- | --- | ------- | ----------------------------------------------------------------------- |
| `src/stores/camera.store.ts`                       | 1.1 | Evolve  | Production camera store (replaces WS-0.3 spike)                         |
| `src/lib/spatial-math.ts`                          | 1.1 | Evolve  | Production spatial math utilities                                       |
| `src/lib/constants.ts`                             | 1.1 | Evolve  | Add all spatial constants                                               |
| `src/components/spatial/SpatialViewport.tsx`       | 1.1 | Evolve  | Production viewport component                                           |
| `src/components/spatial/SpatialCanvas.tsx`         | 1.1 | Evolve  | Production CSS-transform container                                      |
| `src/components/spatial/ViewportCuller.tsx`        | 1.1 | Create  | Viewport culling wrapper                                                |
| `src/hooks/use-pan.ts`                             | 1.1 | Evolve  | Pan + momentum hook                                                     |
| `src/hooks/use-zoom.ts`                            | 1.1 | Evolve  | Zoom-to-cursor hook                                                     |
| `src/hooks/use-semantic-zoom.ts`                   | 1.1 | Evolve  | Semantic level reader                                                   |
| `src/hooks/use-viewport-cull.ts`                   | 1.1 | Evolve  | Viewport culling hook                                                   |
| `src/hooks/use-fly-to.ts`                          | 1.1 | Create  | Fly-to with animation state                                             |
| `src/hooks/use-pan-pause.ts`                       | 1.1 | Create  | Debounced pan-active signal                                             |
| `src/hooks/use-camera-sync.ts`                     | 1.1 | Create  | URL sync for camera position                                            |
| `src/app/(launch)/page.tsx`                        | 1.1 | Evolve  | Render SpatialViewport                                                  |
| `src/components/districts/capsule-ring.tsx`        | 1.2 | Create  | Ring layout + hub center                                                |
| `src/components/districts/district-capsule.tsx`    | 1.2 | Create  | Individual capsule component                                            |
| `src/components/districts/capsule-health-bar.tsx`  | 1.2 | Create  | 3px animated health indicator                                           |
| `src/components/districts/capsule-telemetry.tsx`   | 1.2 | Create  | 3 key-value telemetry rows                                              |
| `src/components/districts/capsule-sparkline.tsx`   | 1.2 | Create  | Decorative bottom sparkline                                             |
| `src/components/districts/hub-center-glyph.tsx`    | 1.2 | Create  | Breathing center glyph                                                  |
| `src/components/districts/dot-grid.tsx`            | 1.2 | Create  | Background dot grid + pulse                                             |
| `src/components/districts/scanline-overlay.tsx`    | 1.2 | Create  | Selection scanline sweep                                                |
| `src/components/districts/index.ts`                | 1.2 | Create  | Barrel export                                                           |
| `src/styles/atrium.css`                            | 1.2 | Create  | Atrium-specific CSS (flash-error only; ambient @keyframes from WS-1.6)  |
| `src/app/login/page.tsx`                           | 1.3 | Create  | Login route page                                                        |
| `src/components/auth/LoginScene.tsx`               | 1.3 | Create  | Login state machine + animation                                         |
| `src/components/auth/AttractorGlyph.tsx`           | 1.3 | Create  | Breathing attractor glyph                                               |
| `src/components/auth/PassphraseField.tsx`          | 1.3 | Create  | Password input with materialization                                     |
| `src/components/auth/ReceiptStamp.tsx`             | 1.3 | Create  | Auth success receipt display                                            |
| `src/components/auth/AuthGate.tsx`                 | 1.3 | Create  | Route protection wrapper                                                |
| `src/stores/auth.store.ts`                         | 1.3 | Create  | Auth state + sessionStorage                                             |
| `src/lib/auth-utils.ts`                            | 1.3 | Create  | Passphrase validation, session helpers                                  |
| `src/components/spatial/NavigationHUD.tsx`         | 1.4 | Create  | Fixed overlay container                                                 |
| `src/components/spatial/Minimap.tsx`               | 1.4 | Create  | SVG minimap with district dots                                          |
| `src/components/spatial/ZoomIndicator.tsx`         | 1.4 | Create  | Semantic zoom level badge                                               |
| `src/components/spatial/CommandPaletteStub.tsx`    | 1.4 | Create  | Command palette shell                                                   |
| `src/components/ui/SpatialBreadcrumb.tsx`          | 1.4 | Create  | Semantic path breadcrumb                                                |
| `src/hooks/useKeyboardShortcuts.ts`                | 1.4 | Create  | Global keyboard listener                                                |
| `src/lib/spatial-actions.ts`                       | 1.4 | Create  | returnToHub utility                                                     |
| `src/lib/telemetry-types.ts`                       | 1.5 | Create  | Telemetry TypeScript types (imports HealthState from WS-1.7)            |
| `src/lib/telemetry-config.ts`                      | 1.5 | Create  | App registry, timeouts, polling intervals                               |
| `src/app/api/telemetry/route.ts`                   | 1.5 | Replace | Full aggregator implementation                                          |
| `src/hooks/use-telemetry.ts`                       | 1.5 | Create  | TanStack Query hook with adaptive polling                               |
| `src/stores/districts.store.ts`                    | 1.5 | Replace | Full telemetry state management                                         |
| `src/components/telemetry/health-badge.tsx`        | 1.5 | Create  | Status indicator                                                        |
| `src/components/telemetry/telemetry-sparkline.tsx` | 1.5 | Create  | Teal-tinted sparkline                                                   |
| `src/components/telemetry/metric-counter.tsx`      | 1.5 | Create  | Geist Mono numeric display                                              |
| `src/components/telemetry/alert-indicator.tsx`     | 1.5 | Create  | Red count badge                                                         |
| `src/components/telemetry/index.ts`                | 1.5 | Create  | Barrel export                                                           |
| `src/components/ambient/ambient-effects.css`       | 1.6 | Create  | All ambient @keyframes (heartbeat, breathe, grid-pulse, scanline-sweep) |
| `src/components/ambient/ParticleField.tsx`         | 1.6 | Create  | Canvas particle drift + parallax                                        |
| `src/components/ambient/HeartbeatPulse.tsx`        | 1.6 | Create  | Capsule health bar pulse                                                |
| `src/components/ambient/GlowBreathing.tsx`         | 1.6 | Create  | Hub center glow animation                                               |
| `src/components/ambient/GridPulse.tsx`             | 1.6 | Create  | Dot grid radial wave                                                    |
| `src/components/ambient/ScanlineOverlay.tsx`       | 1.6 | Create  | State-change scanline sweep                                             |
| `src/components/ambient/FilmGrain.tsx`             | 1.6 | Create  | SVG feTurbulence noise (Server Component)                               |
| `src/components/ambient/index.ts`                  | 1.6 | Create  | Barrel export                                                           |
| `src/lib/interfaces/types.ts`                      | 1.7 | Create  | Shared domain types (AppIdentifier, HealthState, SemanticLevel, etc.)   |
| `src/lib/interfaces/camera-controller.ts`          | 1.7 | Create  | CameraController interface + ManualCameraController                     |
| `src/lib/interfaces/system-state-provider.ts`      | 1.7 | Create  | SystemStateProvider interface + PollingSystemStateProvider              |
| `src/lib/interfaces/receipt-store.ts`              | 1.7 | Create  | ReceiptStore interface + InMemoryReceiptStore                           |
| `src/lib/interfaces/station-template-registry.ts`  | 1.7 | Create  | StationTemplateRegistry interface + StaticStationTemplateRegistry       |
| `src/lib/interfaces/ai-router.ts`                  | 1.7 | Create  | AIRouter interface + StubAIRouter                                       |
| `src/lib/interfaces/command-palette.ts`            | 1.7 | Create  | CommandPalette interface + StructuredCommandPalette                     |
| `src/lib/interfaces/index.ts`                      | 1.7 | Create  | Barrel export                                                           |

**Total files: 67** (14 evolve/replace + 53 create)
