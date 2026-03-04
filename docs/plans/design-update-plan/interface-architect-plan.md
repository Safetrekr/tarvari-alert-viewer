# Interface Architect Plan -- Enrichment Systems Architecture

**Author:** Interface Architect
**Date:** 2026-02-27
**Scope:** Systems architecture for 12 visual enrichment elements in Tarva Launch
**Status:** DRAFT

---

## 0. Executive Summary

The 12 proposed enrichment elements are not 12 independent decorations. They are a single information system that must tell a coherent story about the health, activity, and relationships of 6 interconnected applications. This plan defines the data model that feeds them, the state orchestration that coordinates them, the rendering architecture that keeps them performant, and the progressive enhancement strategy that lets them degrade gracefully across zoom levels, performance tiers, and feature availability.

The core architectural decision is: **one centralized mock data generator produces a unified `EnrichmentSnapshot` every tick, and every enrichment component subscribes to the slice it needs.** This is the same pattern already proven by `districts.store.ts` and the attention choreography system. When the real Telemetry Aggregator (WS-1.5) eventually replaces mock data, the swap is a single function replacement -- the enrichment components never know the difference.

---

## 1. Coherent Data Model

Every enrichment element must answer the question: "What am I showing, and where does the data come from?" The Oblivion Light Table works because every readout on the screen corresponds to something real in the story world. Our enrichments must maintain the same discipline, even with mock data.

### 1.1 Enrichment Data Dictionary

| Element | Data Displayed | Source Fields | Update Cadence |
|---------|---------------|---------------|----------------|
| **Orbital Readouts** | 6 text blocks around the capsule ring. Each shows a 3-letter code + numeric value for the closest district: `UPT 1847` (uptime seconds), `RSP 42ms` (response time), `ACT 12` (active work count), `ALT 0` (alert count), `FRS LIVE` (freshness), `VER 1.2.0` (version). | `AppTelemetry.uptime`, `.responseTimeMs`, `.alertCount`, `.version`, `CapsuleTelemetry.pulse`, `.freshness` | Every telemetry poll (5-30s) |
| **Range Rings + Compass Rose** | 3 concentric SVG circles at radii 200px, 400px, 600px from origin. Compass cardinal marks at N/S/E/W. Ring opacity modulated by system health (dimmer when calm, brighter on alert). Tick marks at 15-degree intervals. | `AttentionState` (calm/tighten), zoom level | On attention state change |
| **System Status Panel** (left sidebar) | Vertical stack: system epoch (uptime since page load), aggregate status word (`ALL CLEAR` / `ANOMALY DETECTED`), per-app health rows (6 rows, each: app code + health dot + response time), total alert count, last snapshot timestamp. Oblivion-style `TECH N° 49` header. | `SystemSnapshot.summary`, per-app `AppTelemetry`, `AttentionState` | Every telemetry poll |
| **Feed/Connection Panel** (right sidebar) | Vertical stack: `FEEDS` header, scrolling list of recent events (last 20), each row: timestamp + app code + event type icon + description. `DATALINKS` section: 6 connection status indicators showing link state between Launch and each app (connected/disconnected/latency). | Activity ticker data (shared), `AppTelemetry.status`, `.responseTimeMs` | Every tick (1s for ticker, 5-30s for datalinks) |
| **Signal Pulse Monitor** | SVG waveform (160px wide, 40px tall). Represents aggregate system "heartbeat" -- a composite signal derived from all 6 apps' response times. Healthy = slow sine wave, degraded = faster frequency + noise, down = flatline segments. | Composite of all `AppTelemetry.responseTimeMs` values | rAF (waveform animation), data update on poll |
| **Activity Ticker** | Horizontally scrolling tape of recent system events. Each entry: `[HH:MM:SS] APP_CODE event_description`. Events: health state changes, telemetry polls, alert triggers, mock agent deployments, mock chat messages. Max 50 entries, FIFO. | Generated from telemetry diffs + mock event generator | 1 new event every 2-5s (mock cadence) |
| **Radial Gauge Cluster** | 3 concentric arc gauges around the hub center: inner = aggregate CPU (0-100%), middle = aggregate memory (0-100%), outer = aggregate request throughput (0-max). Each gauge is a partial SVG arc with a fill indicator. | Mock performance metrics per app, aggregated | Every telemetry poll |
| **Coordinate Grid Overlays** | Registration marks at viewport corners (L-shaped brackets), center crosshair at origin (0,0), coordinate readout showing current camera position in world-space pixels. Grid lines at 500px world-space intervals (visible only at Z1-Z2). | `CameraState.offsetX`, `.offsetY`, `.zoom` | Every camera move (subscribe pattern) |
| **Inter-District Connection Paths** | Animated SVG `<path>` elements connecting district capsules. 5 connection types reflecting real data flows: AB->PR (agent deploy), AB->CH (agent deploy), CO->ALL (reasoning), CD->AB (knowledge), CD->CH (knowledge), ERP->PR (manufacturing data). Path dash-offset animation indicates data flow direction. Path color = health of the source district. | `AppTelemetry.status` for each endpoint, connection topology (static) | Path animation: CSS continuous. Color: on health change |
| **Deep-Zoom Micro-Details** | At Z3, reveal: circuit trace patterns (SVG hairlines along panel edges), serial number inscriptions (`TARVA-LAUNCH-SN-001`), component designator labels (`R1`, `C2`, `U3`), etched manufacturing date. Pure decoration -- no data dependency. | None (static decorative content) | Static (render on Z3 enter) |
| **Ambient Scan Line** | Horizontal sweep line that traverses the full viewport height over 8s. 1px primary line + 2 ghost lines trailing at 4px and 8px offset. Ember color at 0.06 opacity. Continuous ambient -- not triggered by events. | None (pure ambient animation) | Continuous CSS animation |
| **Halo Glow** | Radial gradient centered on origin. Ember color, 600px radius, 0.04 peak opacity. Breathes in sync with the existing `GlowBreathing` component. Modulated by attention state (brighter during tighten for anomalous districts). | `AttentionState`, `EffectConfig.breatheIntensity` | On attention state change |

### 1.2 The Narrative Contract

All enrichments must maintain internal consistency. When Agent Builder goes DOWN:

1. **Orbital readout** for AB shows `RSP ---` (no response) and `ALT 1` (alert incremented)
2. **System status panel** shows `ANOMALY DETECTED`, AB row turns red
3. **Feed panel** gets a new event: `[12:34:56] AB STATUS_CHANGE OPERATIONAL -> DOWN`
4. **Signal pulse** shifts frequency -- the composite waveform gains a flatline segment
5. **Activity ticker** scrolls a `AB SERVICE DOWN` entry
6. **Radial gauges** drop the AB contribution from aggregates
7. **Connection paths** from AB dim and their dash animation stops (data flow ceased)
8. **Range rings** brighten slightly (tighten state)
9. **Halo glow** shifts to tighten intensity
10. **Scan line** continues unchanged (ambient, not data-driven)
11. **Coordinate grid** unchanged (camera-driven, not data-driven)
12. **Micro-details** unchanged (decorative, not data-driven)

This cascading reaction is what makes the difference between a living command center and a collection of widgets.

---

## 2. Data Source Architecture

### 2.1 Central Mock Data Generator

A single module -- `src/lib/enrichment/mock-data-generator.ts` -- produces all mock data consumed by enrichment components. This is critical for narrative consistency: if the mock generator decides Agent Builder is DOWN, every enrichment element sees the same state.

```
┌──────────────────────────────────────────────────────────┐
│                  mock-data-generator.ts                    │
│                                                            │
│  Inputs:                                                   │
│    - Current districts store snapshot                       │
│    - Elapsed time since page load                          │
│    - Random seed (deterministic for dev, random for demo)  │
│                                                            │
│  Outputs (EnrichmentSnapshot):                             │
│    - orbitalReadouts: OrbitalReadout[]                     │
│    - activityEvents: ActivityEvent[]                        │
│    - performanceMetrics: PerformanceMetrics                 │
│    - connectionStates: ConnectionState[]                    │
│    - systemEpoch: number                                   │
│    - aggregateSignal: number[] (waveform samples)          │
│                                                            │
│  Cadence: called every 2s by a useEffect interval          │
│  Thread: main (computation is trivial -- < 1ms)            │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              enrichment.store.ts (Zustand + immer)        │
│                                                            │
│  State:                                                    │
│    enrichmentSnapshot: EnrichmentSnapshot | null           │
│    activityLog: ActivityEvent[] (capped at 50, FIFO)       │
│    waveformBuffer: Float32Array (256 samples, ring)        │
│                                                            │
│  Actions:                                                  │
│    updateSnapshot(snapshot: EnrichmentSnapshot)             │
│    pushActivityEvent(event: ActivityEvent)                  │
│    appendWaveformSamples(samples: number[])                │
│                                                            │
│  Selectors:                                                │
│    orbitalReadouts, performanceMetrics, connectionStates,  │
│    latestEvents(n), waveformSlice(offset, length),         │
│    systemEpoch, aggregateHealthWord                        │
└──────────────────────────────────────────────────────────┘
         │
    ┌────┴────┬────────────┬────────────┬──────────┐
    ▼         ▼            ▼            ▼          ▼
 Orbital   Status      Signal      Activity    Connection
 Readouts  Panel       Pulse       Ticker      Paths
           ...         ...         ...         ...
```

### 2.2 Why Not Individual Mock Generators?

Individual generators per component would be simpler to implement but create three problems:

1. **Inconsistency**: Component A shows AB as OPERATIONAL while Component B shows it as DOWN (different random seeds, different timing)
2. **Duplication**: Every component recalculates aggregate health, alert counts, etc.
3. **Migration friction**: When WS-1.5 provides real data, you replace N generators instead of one

The central generator also makes it trivial to add a "scenario mode" later -- feed a scripted sequence of states for demos.

### 2.3 Interface Contracts

These interfaces should be defined now in `src/lib/enrichment/enrichment-types.ts` and remain stable when mock data is replaced with real data.

```typescript
// ─── Orbital Readouts ────────────────────────────────────
interface OrbitalReadout {
  readonly districtId: DistrictId
  readonly code: string          // 3-letter: "UPT", "RSP", "ACT", "ALT", "FRS", "VER"
  readonly value: string         // Formatted: "1847", "42ms", "12", "0", "LIVE", "1.2.0"
  readonly unit: string          // "", "ms", "", "", "", ""
  readonly health: HealthState   // For color coding
}

// ─── Activity Events ─────────────────────────────────────
interface ActivityEvent {
  readonly id: string            // nanoid
  readonly timestamp: string     // ISO 8601
  readonly districtId: DistrictId | 'system'
  readonly districtCode: string  // "AB", "CH", "SYS"
  readonly eventType: 'health_change' | 'deployment' | 'chat_message' |
                      'agent_run' | 'error' | 'telemetry_poll' | 'alert'
  readonly description: string   // Human-readable
  readonly severity: Severity    // info | warning | error | critical
}

// ─── Performance Metrics (for gauges) ────────────────────
interface PerformanceMetrics {
  readonly cpu: number           // 0-100 aggregate
  readonly memory: number        // 0-100 aggregate
  readonly throughput: number    // requests/sec aggregate
  readonly maxThroughput: number // for gauge scale
  readonly perApp: Record<DistrictId, {
    readonly cpu: number
    readonly memory: number
    readonly throughput: number
  }>
}

// ─── Connection States ───────────────────────────────────
interface ConnectionState {
  readonly id: string            // "ab-pr", "ab-ch", "co-all", etc.
  readonly sourceId: DistrictId
  readonly targetId: DistrictId | 'all'
  readonly label: string         // "Agent Deploy", "Knowledge", "Reasoning", "Mfg Data"
  readonly flowType: 'deploy' | 'knowledge' | 'reasoning' | 'manufacturing'
  readonly active: boolean       // Is data currently flowing?
  readonly sourceHealth: HealthState
  readonly targetHealth: HealthState
  readonly latencyMs: number | null
}

// ─── Waveform Signal ─────────────────────────────────────
interface WaveformConfig {
  readonly sampleRate: number    // samples per second (e.g., 30)
  readonly bufferSize: number    // total samples in ring buffer (e.g., 256)
  readonly baseFrequency: number // Hz for healthy sine
  readonly noiseAmplitude: number // 0-1, added during degraded
}

// ─── Aggregate Enrichment Snapshot ───────────────────────
interface EnrichmentSnapshot {
  readonly timestamp: string
  readonly systemEpoch: number           // seconds since page load
  readonly orbitalReadouts: readonly OrbitalReadout[]
  readonly performanceMetrics: PerformanceMetrics
  readonly connectionStates: readonly ConnectionState[]
  readonly newEvents: readonly ActivityEvent[]   // events generated this tick
  readonly waveformSamples: readonly number[]    // new samples this tick
  readonly aggregateHealthWord: string           // "ALL CLEAR" | "ANOMALY DETECTED" | "CRITICAL"
}
```

### 2.4 Mock-to-Real Transition Path

When the Telemetry Aggregator (WS-1.5) is expanded with richer data:

1. **Phase 1 (current)**: `mock-data-generator.ts` reads the districts store and fabricates enriched data. The districts store itself is already populated by real telemetry polls -- so orbital readouts for uptime, response time, and status are already partially real. The generator only fabricates CPU, memory, throughput, activity events, and waveform.

2. **Phase 2 (WS-1.5 expansion)**: The `/api/telemetry` route handler is extended to return richer `AppTelemetry` with process-level metrics (CPU, memory) from the monitored apps' health endpoints. The mock generator checks for real data before falling back to mock.

3. **Phase 3 (full real data)**: The mock generator is replaced with a `real-data-transformer.ts` that maps the expanded `SystemSnapshot` directly to `EnrichmentSnapshot`. The enrichment store and all components are untouched.

The key insight: **the `EnrichmentSnapshot` interface is the stable contract.** Whether data is mock or real, components consume the same shape.

---

## 3. Semantic Relationships

### 3.1 The Relationship Graph

The enrichment elements form three layers of semantic coupling:

```
Layer 1: Data-Driven (react to telemetry changes)
┌──────────────────────────────────────────────────────────┐
│  Orbital Readouts ←→ System Status Panel ←→ Feed Panel   │
│         ↕                    ↕                    ↕       │
│  Activity Ticker ←→ Signal Pulse ←→ Radial Gauges        │
│         ↕                    ↕                    ↕       │
│  Connection Paths (react to source/target health)         │
└──────────────────────────────────────────────────────────┘

Layer 2: Attention-Driven (react to calm/tighten state)
┌──────────────────────────────────────────────────────────┐
│  Range Rings (opacity modulation)                         │
│  Halo Glow (intensity modulation)                         │
│  Connection Paths (dim on tighten for healthy paths)      │
└──────────────────────────────────────────────────────────┘

Layer 3: Camera-Driven (react to viewport position/zoom)
┌──────────────────────────────────────────────────────────┐
│  Coordinate Grid (updates on every camera move)           │
│  Deep-Zoom Micro-Details (appear/disappear at Z3)         │
│  Scan Line (continuous, camera-independent)               │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Cascading Health Changes

When a capsule's health changes, the update propagates through a well-defined sequence:

```
DistrictsStore.syncSnapshot()          ← telemetry poll arrives
  │
  ├── districts.store triggers re-render of capsule components
  │     └── CapsuleHealthBar, CapsuleTelemetry update
  │
  ├── useAttentionChoreography evaluates (2s interval)
  │     └── AttentionStore updated: calm → tighten (if anomaly)
  │           ├── CSS custom properties synced (ambient effects shift)
  │           ├── Range rings opacity changes
  │           ├── Halo glow intensity changes
  │           └── Next-best-actions surfaced
  │
  └── useEnrichmentCycle evaluates (2s interval, offset by 1s from attention)
        └── EnrichmentStore updated:
              ├── OrbitalReadouts for affected district update
              ├── New ActivityEvent pushed to log
              ├── PerformanceMetrics aggregates recalculated
              ├── ConnectionStates for affected paths update
              └── Waveform signal shifts frequency/amplitude
```

The enrichment cycle is deliberately offset 1 second from the attention cycle to prevent simultaneous computation and to ensure enrichment components see the latest attention state.

### 3.3 Cross-Element Color Coherence

Every enrichment element that shows district-specific data uses the same color derivation:

| Data Condition | Color Source | Token |
|---------------|-------------|-------|
| Healthy/operational data | Teal accent | `var(--color-teal)` / `var(--accent)` |
| Alert/warning data | Ember accent | `var(--color-ember)` / `var(--primary)` |
| Per-district health | Status color from `HEALTH_STATE_MAP` | `var(--status-success)`, `var(--status-warning)`, `var(--status-danger)`, `var(--status-neutral)` |
| Neutral/ambient | Foreground at reduced opacity | `var(--foreground)` at 0.38-0.60 opacity |
| Labels/codes | Foreground at ghost opacity | `var(--foreground)` at 0.15-0.38 opacity |

This means: the orbital readout for AB uses the same green as AB's capsule health bar, AB's connection path color, and AB's row in the system status panel. No element invents its own color mapping.

### 3.4 District Reference System

Every enrichment element that references a district uses the canonical identifiers from `src/lib/interfaces/district.ts`:

- **Full name**: `APP_DISPLAY_NAMES[districtId]` -- used in status panel rows
- **Short code**: `DISTRICT_CODES[districtId]` -- used in orbital readouts, activity ticker, feed panel
- **Health color**: `HEALTH_STATE_MAP[health]` -- used everywhere health is shown
- **Ring position**: `DISTRICTS[i].ringIndex` -- used for angular positioning of orbital readouts and connection path anchoring

### 3.5 Attention Focus Concept

When the user hovers a capsule (or selects it for morph), a "focus highlight" propagates to related enrichments:

1. **Orbital readouts**: The readout nearest the hovered capsule increases opacity from 0.38 to 0.87, others remain at 0.38
2. **Connection paths**: Paths connected to the hovered district increase stroke opacity and width; unrelated paths dim
3. **Status panel**: The corresponding row gets a subtle left-border accent
4. **Feed panel**: Events from the focused district float to top (or get a highlight background)
5. **Signal pulse**: A secondary trace line shows the isolated waveform for just that district

This is implemented via a `focusedDistrictId: DistrictId | null` field in the enrichment store, set by capsule hover handlers and cleared on mouse leave. It is NOT the same as `selectedDistrictId` in the UI store -- focus is transient (hover), selection is committed (click/morph).

---

## 4. State Orchestration

### 4.1 Store Topology

The enrichment layer introduces one new store and one new hook. It does NOT modify existing stores.

```
Existing stores (read-only for enrichments):
┌─────────────────────────────────────────────┐
│  camera.store    → Coordinate grid, culling  │
│  districts.store → All data-driven elements  │
│  ui.store        → Morph phase gating        │
│  attention.store → Attention-driven elements  │
│  settings.store  → effectsEnabled toggle      │
└─────────────────────────────────────────────┘

New store:
┌─────────────────────────────────────────────┐
│  enrichment.store.ts                         │
│                                              │
│  State:                                      │
│    snapshot: EnrichmentSnapshot | null        │
│    activityLog: ActivityEvent[]              │
│    waveformBuffer: Float32Array(256)         │
│    focusedDistrictId: DistrictId | null      │
│                                              │
│  Actions:                                    │
│    updateSnapshot(s: EnrichmentSnapshot)     │
│    setFocusedDistrict(id: DistrictId | null) │
│                                              │
│  Derived:                                    │
│    Selectors for each enrichment element     │
└─────────────────────────────────────────────┘

New orchestration hook:
┌─────────────────────────────────────────────┐
│  useEnrichmentCycle()                        │
│                                              │
│  - Mounted once in LaunchPage                │
│  - 2s interval, offset 1s from attention     │
│  - Reads districts.store + attention.store   │
│  - Calls mock-data-generator                 │
│  - Writes to enrichment.store               │
│  - Gated by settings.effectsEnabled          │
└─────────────────────────────────────────────┘
```

### 4.2 Event Flow Diagram

```
User Action / Timer
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌────────────────┐
│ Telemetry    │────▶│ districts    │────▶│ Attention      │
│ Poll (5-30s) │     │ .store       │     │ Choreography   │
└──────────────┘     └──────┬───────┘     │ (2s interval)  │
                            │             └───────┬────────┘
                            │                     │
                            ▼                     ▼
                     ┌──────────────┐     ┌────────────────┐
                     │ Enrichment   │◀────│ attention      │
                     │ Cycle        │     │ .store         │
                     │ (2s, +1s)    │     └────────────────┘
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │ enrichment   │
                     │ .store       │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         Data-Driven   Attention-     Camera-
         Elements      Driven Elems   Driven Elems
```

### 4.3 System Health to Ambient State Mapping

The existing `AttentionState` (calm/tighten) already drives ambient effect modulation. The enrichment layer extends this mapping to the new elements:

| AttentionState | Enrichment Behavior |
|---------------|-------------------|
| `calm` | Range rings at base opacity (0.08). Halo glow at base intensity. Connection paths all active (flowing animation). Signal pulse: slow sine wave. Status panel: `ALL CLEAR` in teal. |
| `tighten` | Range rings brighten to 0.15 (alertness). Halo glow intensity increases by 1.3x. Connection paths for healthy districts dim to 0.04 opacity. Connection paths for anomalous districts brighten. Signal pulse: faster frequency, noise added. Status panel: `ANOMALY DETECTED` in ember. |

This mapping is implemented as a simple lookup table in the enrichment store, not as per-component logic.

### 4.4 How `useAttentionChoreography` Drives Ambient Intensity

The existing attention choreography system already publishes CSS custom properties for effect modulation. The enrichment elements should read these same properties rather than inventing their own modulation:

- **Range rings**: Read `--attention-breathe-intensity` to scale ring opacity
- **Halo glow**: Read `--attention-breathe-duration` and `--attention-breathe-intensity`
- **Connection paths**: Read `beaconAnomalyGlowMultiplier` and `beaconHealthyGlowMultiplier` from the attention store (same selectors as `DistrictBeacon`)

New CSS custom properties needed (added to `syncAttentionCSSProperties`):

```typescript
{ property: '--attention-ring-opacity', getValue: (c) => String(c.breatheIntensity * 0.08) },
{ property: '--attention-connection-dim', getValue: (c) => String(c.beaconHealthyGlowMultiplier * 0.06) },
```

---

## 5. Rendering Architecture

### 5.1 Layer Placement

The enrichment elements occupy specific positions in the rendering tree. This is critical because some are world-space (move with pan/zoom), some are viewport-space (fixed overlays), and some are hybrid.

```
<SpatialViewport>                              ← fixed, full-screen
  │
  ├── <SpatialCanvas>                          ← CSS transform: translate + scale
  │     ├── <DotGrid />                        ← world-space, 20000x20000
  │     ├── <RangeRings />                     ← world-space, centered at origin ★ NEW
  │     ├── <CompassRose />                    ← world-space, centered at origin ★ NEW
  │     ├── <InterDistrictPaths />             ← world-space, paths between capsule positions ★ NEW
  │     ├── <HaloGlow />                       ← world-space, radial gradient at origin ★ NEW
  │     ├── <MorphOrchestrator>                ← world-space, capsule ring + districts
  │     │     └── <OrbitalReadouts />          ← world-space, positioned around ring ★ NEW
  │     ├── <DeepZoomMicroDetails />           ← world-space, visible only at Z3 ★ NEW
  │     ├── <EvidenceLedgerDistrict />         ← world-space, NW quadrant
  │     └── <CoordinateGrid />                 ← world-space, viewport-extent lines ★ NEW
  │
  ├── <AmbientScanLine />                      ← viewport-space, pointer-events: none ★ NEW
  ├── <RadialGaugeCluster />                   ← viewport-space, fixed center ★ NEW
  ├── <SignalPulseMonitor />                   ← viewport-space, fixed position ★ NEW
  │
  └── (existing overlays remain unchanged)
</SpatialViewport>

<NavigationHUD>                                ← fixed, z-40
  ├── <SpatialBreadcrumb />
  ├── <ZoomIndicator />
  ├── <Minimap />
  ├── <SystemStatusPanel />                    ← fixed, left sidebar ★ NEW
  ├── <FeedConnectionPanel />                  ← fixed, right sidebar ★ NEW
  └── <ActivityTicker />                       ← fixed, bottom strip ★ NEW
```

### 5.2 World-Space vs. Viewport-Space Decision Rationale

| Element | Space | Why |
|---------|-------|-----|
| Range rings | World | They are concentric around the capsule ring origin. They must scale with zoom. |
| Compass rose | World | Part of the range rings system. Must scale with zoom. |
| Connection paths | World | They connect world-positioned capsules. Must move and scale with pan/zoom. |
| Halo glow | World | Centered on origin, must scale with zoom. |
| Orbital readouts | World | Positioned relative to capsule positions. Must move with pan/zoom. |
| Coordinate grid | World | Registration marks are at world-space intervals. Must move with pan/zoom. |
| Deep-zoom details | World | Revealed by zoom level. Must be in world space. |
| System status panel | Viewport | Always visible regardless of pan/zoom. Fixed left sidebar. |
| Feed panel | Viewport | Always visible. Fixed right sidebar. |
| Activity ticker | Viewport | Always visible. Fixed bottom strip. |
| Signal pulse | Viewport | Always visible. Fixed position (bottom-center or bottom-left). |
| Radial gauges | Viewport | Always visible at hub center screen position. Fixed overlay. |
| Scan line | Viewport | Sweeps across viewport, not world. Fixed overlay. |

### 5.3 Performance Constraints

All world-space enrichment elements inside `<SpatialCanvas>` are transformed by the CSS transform on every pan/zoom frame. This means:

1. **No `backdrop-filter`** on enrichment elements (already established rule from WS-1.1). The existing pan-pause system disables backdrop-filter during pan; enrichment elements should not add new ones.

2. **SVG elements should use `will-change: transform`** on their root to promote to their own compositor layer. But do NOT use `will-change` on every path/circle -- only on the root `<svg>`.

3. **Viewport-space elements (panels, ticker, gauges) are outside the transform** and do not affect pan/zoom performance at all. They can use `backdrop-filter` freely because they are not reparented during camera movement.

4. **Connection path animation** uses CSS `stroke-dashoffset` animation, not JavaScript. This runs on the compositor thread and does not block the main thread.

5. **The waveform** (Signal Pulse Monitor) renders on a `<canvas>` element (same pattern as `ParticleField`). It uses `requestAnimationFrame` for smooth animation but only reads new data from the enrichment store on the 2s tick, not every frame.

### 5.4 Viewport Culling

World-space enrichment elements participate in viewport culling. The existing `ViewportCuller` component (WS-1.1) unmounts children outside the visible bounds. Enrichment elements that span large world areas need special handling:

- **Range rings** (1200px diameter): Always rendered (they surround the capsule ring, which is always near-center)
- **Connection paths**: Paths are anchored at capsule positions (within 300px of origin). At Z0-Z1 they are always visible. At Z3 they may be partially off-screen -- but SVG clipping handles this without unmounting.
- **Coordinate grid**: Only render grid lines within the current viewport bounds + 200px margin. Recalculate visible lines on camera change using `screenToWorld` from `spatial-math.ts`.
- **Deep-zoom details**: Guarded by `useSemanticZoom().isStation` -- not rendered at all below Z3.

---

## 6. Progressive Enhancement Strategy

### 6.1 Effects Toggle (`effectsEnabled = false`)

The `settings.store.ts` already has an `effectsEnabled` boolean. When false:

| Element | Behavior |
|---------|----------|
| Orbital readouts | **Shown** (data, not decoration) |
| Range rings | Hidden |
| Compass rose | **Shown** (navigation aid, not decoration) |
| System status panel | **Shown** (data) |
| Feed panel | **Shown** (data) |
| Signal pulse | Hidden |
| Activity ticker | **Shown** (data, but scrolling animation stops -- static list) |
| Radial gauges | **Shown** (data) |
| Coordinate grid | **Shown** (navigation aid, static -- no animations) |
| Connection paths | Hidden |
| Deep-zoom details | Hidden |
| Scan line | Hidden |
| Halo glow | Hidden |

**Rule**: Data-bearing elements remain visible. Pure-ambient elements are hidden. Navigation aids remain but lose their animations.

### 6.2 `prefers-reduced-motion`

| Element | Reduced Motion Behavior |
|---------|------------------------|
| Orbital readouts | Static (no number transition animation) |
| Range rings | Static opacity (no breathing modulation) |
| Connection paths | Static stroke (no dash-offset animation). Color still reflects health. |
| Signal pulse | Static waveform snapshot (no animation) |
| Activity ticker | Static list (no scroll animation). New items append without transition. |
| Radial gauges | Static fill (no animated transitions between values) |
| Scan line | Hidden entirely |
| Halo glow | Static opacity (no breathing) |
| Deep-zoom details | Shown without entrance animation |

### 6.3 Semantic Zoom Levels

| Element | Z0 (Constellation) | Z1 (Atrium) | Z2 (District) | Z3 (Station) |
|---------|-------------------|-------------|---------------|--------------|
| Orbital readouts | Hidden | Shown | Shown (fade during morph) | Hidden |
| Range rings | Hidden | Shown | Shown | Hidden (too close) |
| Compass rose | Hidden | Shown | Shown | Hidden |
| System status panel | Shown (compact: 3 lines) | Shown (full) | Shown (full) | Shown (full) |
| Feed panel | Hidden | Shown | Shown | Shown |
| Signal pulse | Hidden | Shown | Shown | Hidden |
| Activity ticker | Shown (compact: 1 line) | Shown (full) | Shown (full) | Hidden |
| Radial gauges | Hidden | Shown | Shown (fade during morph) | Hidden |
| Coordinate grid | Shown (no lines, just corner marks) | Shown (lines + corner marks) | Shown | Hidden |
| Connection paths | Shown (simplified: straight lines) | Shown (curved beziers) | Shown (but dim non-focused) | Hidden |
| Deep-zoom details | Hidden | Hidden | Hidden | **Shown** |
| Scan line | Hidden | Shown | Shown | Shown |
| Halo glow | Shown (small, beacon-like) | Shown (full) | Shown (reduced) | Hidden |

Implementation: Each enrichment component reads `useSemanticZoom()` and renders its zoom-appropriate variant. Components that are hidden at certain zoom levels return `null` (no DOM cost).

### 6.4 Morph Phase Gating

During morph transitions (phases: `focusing`, `expanding`, `morphing`, `unfurling`), several enrichments should fade or hide to reduce visual noise:

- **Orbital readouts**: Fade to 0 during `focusing`, remain hidden during `morphing` and `unfurling`, return on `settled` reverse or `idle`
- **Range rings**: Reduce opacity to 0.02 during morph
- **Radial gauges**: Fade to 0 during morph (they overlap with the morphing capsule)
- **Connection paths**: Fade non-focused paths to 0 during morph; focused path remains

Implementation: Read `useUIStore(uiSelectors.isMorphing)` and apply opacity transitions via `motion/react` `animate` prop.

### 6.5 Fallback When Services Are Unavailable

| Condition | Enrichment Behavior |
|-----------|-------------------|
| All apps OFFLINE/UNKNOWN (fresh page load, nothing running) | Status panel: `AWAITING CONTACT`. Gauges: 0%. Signal: flatline. Ticker: `[HH:MM:SS] SYS Awaiting first telemetry contact`. Readouts: `--- ---`. Connections: all dim, no animation. |
| Ollama down | No impact on enrichments (enrichments are data-driven, not AI-driven). Narration narrations are blank but enrichments continue. |
| Supabase not running | No impact on enrichments (enrichments use in-memory mock data, not database). Receipts may queue offline but enrichments are unaffected. |
| Districts store empty (before first poll) | Enrichment cycle skips generation (same guard pattern as `useAttentionChoreography`: `if (Object.keys(districts).length === 0) return`). Components show loading shimmer or "--" values. |

---

## 7. Oblivion-Inspired Design System Rules

### 7.1 Typography Hierarchy

All enrichment text uses the existing Geist font family from the project. The hierarchy is strict:

| Role | Font | Size | Weight | Tracking | Opacity | Example |
|------|------|------|--------|----------|---------|---------|
| Panel header | Geist Sans | 11px | 600 | 0.12em | 0.38 | `SYSTEM STATUS` |
| Section header | Geist Sans | 11px | 500 | 0.08em | 0.60 | `DATALINKS` |
| Label (key) | Geist Mono | 10px | 400 | 0.06em | 0.38 | `UPT` |
| Value (data) | Geist Mono | 12px | 500 | 0.04em | 0.87 | `1847` |
| Value (unit) | Geist Mono | 10px | 400 | 0.04em | 0.38 | `ms` |
| Ticker text | Geist Mono | 10px | 400 | 0.02em | 0.60 | `[12:34:56] AB Agent deployed` |
| Micro-inscription | Geist Mono | 8px | 300 | 0.08em | 0.15 | `TARVA-LAUNCH-SN-001` |

**Rule**: All data values use `font-variant-numeric: tabular-nums` to prevent horizontal jitter during updates. This is already established by `MetricCounter` (WS-1.5).

### 7.2 Label:Value Pair Formatting

The Oblivion Light Table uses a consistent `LABEL value` pattern. We formalize this:

```
┌─────────────────────────┐
│ UPT  1847               │  ← 3-char label, 2-space gap, right-aligned value
│ RSP  42ms               │
│ ACT  12                 │
│ ALT  0                  │
└─────────────────────────┘
```

Implementation: A reusable `<DataReadout label="UPT" value="1847" unit="s" />` component that enforces the layout. Label is always uppercase, 3 characters, Geist Mono, ghost opacity. Value is Geist Mono, primary opacity. Unit is Geist Mono, ghost opacity, no leading space.

### 7.3 Color System

Three semantic color channels, already defined by the existing design tokens:

| Channel | Usage | Token |
|---------|-------|-------|
| **Teal** (data/healthy) | Healthy values, sparklines, operational indicators, connection paths for healthy links | `var(--accent)` / `var(--color-teal)` |
| **Ember** (alert/primary) | Alerts, warnings, interactive elements, focused items, scan line | `var(--primary)` / `var(--color-ember)` |
| **White** (neutral) | Labels, structural lines, grid, range rings, compass marks | `var(--foreground)` at reduced opacity |
| **Status colors** | Per-health-state coloring | `var(--status-success)`, `var(--status-warning)`, `var(--status-danger)`, `var(--status-neutral)` |

**Rule**: No enrichment element introduces a new color. Every color used must trace back to an existing CSS custom property.

### 7.4 Opacity Scale

Matches the existing scale from `VISUAL-DESIGN-SPEC.md`:

| Level | Value | Usage |
|-------|-------|-------|
| Primary | 0.87 | Data values, active indicators |
| Secondary | 0.60 | Section headers, active ticker text |
| Tertiary | 0.38 | Labels, codes, inactive indicators |
| Ghost | 0.15 | Grid lines, registration marks, micro-inscriptions |
| Ambient | 0.06-0.08 | Range rings, halo glow, scan line |
| Void | 0.015-0.03 | Background dots, barely-there texture |

### 7.5 Line Weights and Styles

| Line Type | Width | Style | Color | Opacity |
|-----------|-------|-------|-------|---------|
| Range ring | 1px | solid | `var(--foreground)` | 0.06-0.15 (modulated) |
| Compass tick (major) | 1px | solid | `var(--foreground)` | 0.12 |
| Compass tick (minor) | 0.5px | solid | `var(--foreground)` | 0.06 |
| Connection path (active) | 1.5px | dashed (4,8) | Source health color | 0.20 |
| Connection path (inactive) | 1px | dashed (2,6) | `var(--foreground)` | 0.06 |
| Coordinate grid | 0.5px | solid | `var(--foreground)` | 0.04 |
| Registration mark | 1px | solid | `var(--foreground)` | 0.12 |
| Gauge arc (background) | 3px | solid | `var(--foreground)` | 0.06 |
| Gauge arc (fill) | 3px | solid | Teal/ember (by metric) | 0.60 |
| Scan line (primary) | 1px | solid | `var(--color-ember)` | 0.06 |
| Scan line (ghost) | 1px | solid | `var(--color-ember)` | 0.03 |

### 7.6 Corner Registration Marks

Four L-shaped brackets at viewport corners. Each is a pair of 20px lines meeting at a right angle, 12px inset from the edge. 1px solid, foreground at 0.12 opacity. Static -- they do not animate or respond to data.

Implementation: Pure CSS using `::before` and `::after` pseudo-elements on a full-viewport overlay div. No SVG needed.

### 7.7 Panel Frame Elements

The system status panel and feed panel share a frame style:

- Border: 1px solid `var(--border)` (0.06 opacity)
- Background: `var(--card)` at 0.80 opacity
- Backdrop filter: `blur(12px)` (viewport-space, so no pan performance issue)
- Top edge: 1px inset highlight at `rgba(255,255,255, 0.03)`
- Header separator: 1px solid at 0.06 opacity, with a 20px gap on the left (Oblivion asymmetric line style)

---

## 8. Interaction Model

### 8.1 Interaction Tiers

Not every enrichment element should be interactive. The Oblivion design philosophy is "everything is visible, not everything is clickable." We define three interaction tiers:

| Tier | Elements | Behavior |
|------|----------|----------|
| **Ambient** (pointer-events: none) | Range rings, compass rose, scan line, halo glow, coordinate grid, deep-zoom details, radial gauges | Zero interactivity. Cannot be clicked, hovered, or focused. Purely visual. Implemented with `pointer-events: none` on the element root. |
| **Reactive** (hover only) | Orbital readouts, connection paths, signal pulse | Respond to hover with opacity/highlight changes but are not clickable. Hovering an orbital readout highlights the associated capsule. Hovering a connection path highlights both endpoints. |
| **Interactive** (click + hover) | System status panel rows, feed panel events, activity ticker entries | Clickable. Clicking a status panel row triggers `flyToDistrict(districtId)`. Clicking a feed event opens the receipt detail (if it has a receipt ID). Clicking a ticker entry focuses the relevant district. |

### 8.2 Hover Effects on Connection Paths

When the user hovers a connection path:

1. Path stroke-width increases from 1.5px to 2.5px (CSS transition, 150ms)
2. Path opacity increases from 0.20 to 0.50
3. Source and target capsules get a subtle highlight (communicated via `focusedDistrictId` in enrichment store)
4. A tooltip appears showing: `Agent Builder → Project Room / Agent Deploy / 42ms latency`
5. Other paths dim to 0.04 opacity

On mouse leave, all paths return to their default state over 200ms.

### 8.3 Click-to-Focus from Panels

Clicking a district row in the system status panel:

1. Sets `focusedDistrictId` in the enrichment store
2. Calls `flyToDistrict(districtId)` from `spatial-actions.ts`
3. If already at Z1, this triggers the morph sequence
4. If at Z0, this zooms to Z1 and highlights the capsule

This reuses the existing `flyToDistrict` and `startMorph` infrastructure. No new navigation code is needed.

### 8.4 Tooltip Pattern

Enrichment tooltips use the existing `@tarva/ui` `Tooltip` component (Radix-based). Content is structured:

```
┌──────────────────────────────┐
│ AGENT BUILDER → PROJECT ROOM │  ← Geist Sans 11px, 0.87 opacity
│ Agent Deployment Link         │  ← Geist Sans 10px, 0.60 opacity
│ Latency: 42ms                │  ← Geist Mono 10px, teal
│ Status: Active               │  ← Geist Mono 10px, status color
└──────────────────────────────┘
```

Tooltip appears after 400ms hover delay (Radix default). Glass material background matches existing station panel tooltips.

---

## 9. Future Extensibility

### 9.1 WS-1.5 Telemetry Aggregator (Already Built)

The Telemetry Aggregator is already complete and polling real app health. The enrichment system reads from the same `districts.store` that the aggregator populates. Enrichments that show health, uptime, and response time are already partially "real" -- the mock generator supplements with fabricated CPU, memory, throughput, and activity events.

**Integration point**: When `/api/telemetry` is extended to return richer metrics (CPU, memory, active connections), the `EnrichmentSnapshot` interface already has fields for them. The mock generator's fallback is replaced with real values.

### 9.2 WS-2.x District Features

When district views gain richer content (WS-2.2 through WS-2.5), the enrichment system benefits:

- **Activity ticker**: Real events from district-specific route handlers (`/api/districts/agent-builder`, etc.) can be mixed into the activity log
- **Connection paths**: Real API call counts between districts can modulate path thickness
- **Orbital readouts**: District-specific metrics (agent count for AB, conversation count for CH) can replace generic pulse values

**Integration point**: Each district route handler already returns structured data. The enrichment cycle can read from TanStack Query caches (already populated by `useAgentBuilderDistrict`, `useTarvaChatDistrict`, etc.) without additional fetching.

### 9.3 WS-3.x AI + Receipts

When AI features are active:

- **Activity ticker**: AI actions (camera director commands, narrations generated) appear as events with `actor: 'ai'` badge
- **System status panel**: AI provider status row (Ollama health from `ai.store.ts`)
- **Feed panel**: AI narrations can appear as feed items
- **Signal pulse**: AI inference latency could modulate a secondary waveform trace

**Integration point**: The `ai.store.ts` already tracks provider health and session cost. The enrichment cycle can read these selectors.

### 9.4 WS-4.x Advanced AI + Polish

When real-time agent visualization arrives:

- **Connection paths**: Agent deployment flows become real-time (animated particles along the path during active deployment)
- **Radial gauges**: Per-agent CPU/memory usage becomes available
- **Orbital readouts**: Live agent execution metrics replace mock values

**Integration point**: The `EnrichmentSnapshot` interface is designed to be superset-compatible. New fields can be added without breaking existing consumers (all fields are readonly, consumers use selectors).

### 9.5 Extensibility Architecture

New enrichment elements can be added by:

1. Adding fields to `EnrichmentSnapshot` (if data-driven)
2. Adding a selector to `enrichment.store.ts`
3. Creating the component in `src/components/enrichment/`
4. Placing it in the appropriate layer (world-space or viewport-space) in `page.tsx`
5. Adding zoom-level visibility rules via `useSemanticZoom()`

No changes to existing enrichment components are needed when adding new ones. The architecture is additive, not invasive.

---

## 10. File Structure

```
src/
  lib/
    enrichment/
      enrichment-types.ts          ← All TypeScript interfaces
      mock-data-generator.ts       ← Central mock data producer
      connection-topology.ts       ← Static connection graph definition
      waveform-synthesizer.ts      ← Signal pulse math (sine + noise)
  stores/
    enrichment.store.ts            ← New Zustand store
  hooks/
    use-enrichment-cycle.ts        ← Orchestration hook (2s interval)
    use-focused-district.ts        ← Hover focus management
  components/
    enrichment/
      orbital-readouts.tsx         ← 6 text blocks around ring
      data-readout.tsx             ← Reusable LABEL VALUE component
      range-rings.tsx              ← SVG concentric circles
      compass-rose.tsx             ← SVG cardinal marks
      system-status-panel.tsx      ← Left sidebar (viewport-space)
      feed-connection-panel.tsx    ← Right sidebar (viewport-space)
      signal-pulse-monitor.tsx     ← Canvas waveform (viewport-space)
      activity-ticker.tsx          ← Scrolling event tape (viewport-space)
      radial-gauge-cluster.tsx     ← SVG arc gauges (viewport-space)
      coordinate-grid.tsx          ← Registration marks + grid lines
      inter-district-paths.tsx     ← Animated SVG connection paths
      deep-zoom-details.tsx        ← Z3-only decorative content
      ambient-scan-line.tsx        ← CSS sweep animation
      halo-glow.tsx                ← Radial gradient overlay
      enrichment-layer.tsx         ← Composition wrapper (convenience)
      index.ts                     ← Barrel export
```

---

## 11. Implementation Sequencing

The enrichment elements have internal dependencies. This is the recommended build order:

### Tier 1: Foundation (no visual dependencies)

1. `enrichment-types.ts` -- interfaces and type definitions
2. `enrichment.store.ts` -- new Zustand store
3. `mock-data-generator.ts` -- central data producer
4. `use-enrichment-cycle.ts` -- orchestration hook
5. `data-readout.tsx` -- reusable LABEL VALUE component

### Tier 2: Structural Elements (depend only on foundation)

6. `coordinate-grid.tsx` -- camera-driven, no data dependency
7. `ambient-scan-line.tsx` -- pure CSS ambient, no data dependency
8. `halo-glow.tsx` -- attention-driven, reads existing store
9. `range-rings.tsx` + `compass-rose.tsx` -- attention-driven + zoom-gated

### Tier 3: Data-Driven Elements (depend on enrichment store)

10. `orbital-readouts.tsx` -- reads `orbitalReadouts` selector
11. `system-status-panel.tsx` -- reads districts store + enrichment store
12. `feed-connection-panel.tsx` -- reads `activityLog` + `connectionStates`
13. `activity-ticker.tsx` -- reads `activityLog`
14. `signal-pulse-monitor.tsx` -- reads `waveformBuffer`
15. `radial-gauge-cluster.tsx` -- reads `performanceMetrics`

### Tier 4: Relational Elements (depend on multiple stores + focus system)

16. `inter-district-paths.tsx` -- reads `connectionStates` + `focusedDistrictId`
17. `use-focused-district.ts` -- hover focus management hook

### Tier 5: Detail Elements (depend on zoom level)

18. `deep-zoom-details.tsx` -- Z3-only decorative SVG

### Tier 6: Integration

19. `enrichment-layer.tsx` -- composition wrapper
20. Wire into `page.tsx` -- mount all elements in correct layer positions

---

## 12. Open Questions

| # | Question | Recommendation | Owner |
|---|----------|---------------|-------|
| OQ-1 | Should the system status panel and feed panel be collapsible (like drawers) or always visible? | Always visible at reduced width (200px each). The Oblivion reference shows persistent side panels. Collapsibility adds interaction complexity without clear benefit for a single-user tool. | UI Designer |
| OQ-2 | Should connection paths use Bezier curves or straight lines? | Bezier curves with a single control point offset perpendicular to the line midpoint. This gives a gentle arc that reads as "flow" without the complexity of multi-segment paths. Straight lines look too rigid for a spatial interface. | UI Designer |
| OQ-3 | Should the activity ticker scroll horizontally (news ticker style) or vertically (log style)? | Vertical scroll (log style). Horizontal tickers are harder to scan and read. The Oblivion reference uses vertical scrolling lists. The ticker should be a viewport-space panel at the bottom edge, 28px tall, showing the most recent event with a subtle fade-in transition. | UI Designer |
| OQ-4 | Should enrichment elements be rendered during the login scene or only after authentication? | Only after authentication. The login scene is deliberately minimal (void + attractor glyph). Enrichment elements appearing before login would spoil the "workspace comes alive" reveal in the storyboard (Frame 5). | Stakeholder |
| OQ-5 | How many connection paths should be rendered simultaneously? | All 6 defined connections. The topology is small enough that visual clutter is manageable. At Z0, simplify to straight lines. At Z1+, use Bezier curves with per-path hover interaction. | Interface Architect |

---

## 13. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Too many SVG elements in world-space cause pan/zoom jank | High | Medium | Profile with 25+ SVG elements at each zoom level during implementation. If FPS drops below 55, apply `will-change: transform` to SVG roots and reduce path complexity at Z0. Worst case: cull connection paths during active pan (same pattern as backdrop-filter). |
| Side panels occlude capsule content at narrow viewport widths | Medium | Medium | Set `max-width: 200px` on panels. At viewport width < 1200px, collapse panels to icon-only (40px wide). At < 900px, hide panels entirely. |
| Mock data feels obviously fake and undermines the "living" aesthetic | Medium | High | Invest in the mock generator's realism: use Perlin noise for metric drift (not random), correlate events across apps (deployment in AB triggers activity in PR), add realistic delays and error rates. The mock generator is a creative investment, not a throwaway. |
| Enrichment elements conflict with morph animation choreography | High | Medium | Strict morph-phase gating (Section 6.4). During morph, most enrichments fade to 0 opacity over 200ms. Only status panel, feed panel, and ticker remain (they are viewport-space and do not interfere). |
| Too much visual density makes the interface feel cluttered instead of "dense but scannable" | High | Medium | The opacity scale is the primary defense. Most enrichment elements sit at 0.06-0.15 opacity -- they are felt, not read. Only focused/hovered elements rise to 0.60-0.87. If the result still feels cluttered, reduce the number of orbital readouts from 6 to 3 (one per ring sextant, rotating which district is shown). |

---

## 14. Relationship to Other Team Plans

This plan provides the systems architecture. The other three team members own the implementation of specific elements:

- **UI Designer**: Visual design of each component (exact SVG shapes, CSS values, animation curves). This plan defines WHAT data each component shows and HOW it connects to state -- the UI Designer defines HOW it looks.
- **React Developer**: Component implementation, hook wiring, store integration, SVG rendering, Canvas rendering for the waveform. This plan provides the component tree, store topology, and data flow -- the React Developer writes the code.
- **Motion Designer**: Animation choreography for enrichment transitions (morph-phase fading, attention-state modulation, hover effects, ticker scroll). This plan defines WHAT should animate and WHEN -- the Motion Designer defines HOW it moves.

The `enrichment-types.ts` interfaces and the `enrichment.store.ts` contract are the shared agreements between all four roles. Changes to these files require team consensus.
