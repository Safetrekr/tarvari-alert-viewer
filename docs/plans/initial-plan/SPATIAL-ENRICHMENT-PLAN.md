# Tarva Launch -- Spatial Enrichment Plan v1.0

**Date:** 2026-02-27
**Authors:** world-class-ux-designer, world-class-ui-designer, react-developer, autonomous-interface-architect
**Status:** PROPOSAL -- ready for review
**Problem:** The spatial canvas feels empty. Beyond the capsule ring and the evidence ledger, there is vast empty space. Telemetry is mock data. No visual indicators exist for inter-app connections. Ambient effects are decorative but not responsive to system state.

---

## Design Thesis

Every element in the enriched space must satisfy at least one of three purposes:

1. **Orientation** -- Helps the user understand where they are in the spatial field.
2. **Signal** -- Communicates real or simulated system state (health, throughput, connections).
3. **Texture** -- Fills the void with structured, grid-aligned visual detail that rewards exploration without demanding attention.

Nothing is purely decorative. If it glows, it means something. If it moves, it correlates to a data signal. This is the GMUNK principle: **functional minimalism where every element serves a purpose.**

---

## 1. WORLD-SPACE COORDINATE REFERENCE

All positions are in world-space pixels, origin at `(0, 0)` = hub center. The capsule ring occupies an 840x840px area centered on the origin, with capsule centers at 300px radius.

```
                              NORTH
                          y: -620  System Chronometer
                                |
                    +-----------+-----------+
                    |     Range Ring 560    |
                    |   +-------+-------+  |
                    |   | Range Ring 450|  |
                    |   |   +---+---+   |  |
  WEST              |   |   | RING  |   |  |              EAST
  x: -620           |   |   | 300r  |   |  |              x: +620
  Alert Monitor     |   |   +---+---+   |  |         Throughput Gauge
                    |   +-------+-------+  |
                    +-----------+-----------+
                                |
                          y: +620  Activity Stream
                              SOUTH

  NW quadrant: Evidence Ledger (existing, at -800, -500)
```

**Viewport coverage at each zoom level** (assuming 1440x900 viewport):

| Zoom Level | World-Space Width | World-Space Height | Ring Visibility |
|---|---|---|---|
| Z0 (0.15) | ~9600px | ~6000px | Beacons only |
| Z1 (0.50) | ~2880px | ~1800px | Full capsules + peripherals |
| Z2 (1.00) | ~1440px | ~900px | Selected capsule + nearby instruments |
| Z3 (2.00) | ~720px | ~450px | Station detail + micro-discovery |

---

## 2. ENRICHMENT LAYERS (5 Groups)

### 2.1 Data Flow Network

**Purpose:** Visualize the real data relationships between the 6 Tarva applications. This is the single highest-impact enrichment -- it transforms disconnected capsules into a visible system.

**Component:** `DataFlowNetwork.tsx` (SVG, rendered inside SpatialCanvas)

#### Connection Topology

```
Agent Builder (AB) ---- agents deployed ----> Tarva Chat (CH)
Agent Builder (AB) ---- agents assigned ----> Project Room (PR)
Agent Builder (AB) ---- knowledge feeds ----> tarvaCODE (CD)
TarvaCORE (CO)    ---- runs agents ---------> Agent Builder (AB)
TarvaCORE (CO)    ---- executes tasks ------> Project Room (PR)
TarvaERP (ER)     ---- manufacturing data --> Project Room (PR)
Project Room (PR) ---- project comms -------> Tarva Chat (CH)
```

Total: 7 connections. Each is a quadratic bezier SVG path that arcs outward from the ring center (control point offset ~80px radially outward from the midpoint), avoiding the straight-line "asterisk" problem.

#### Visual Treatment by Zoom Level

| Zoom | Stroke | Color | Particles | Labels |
|---|---|---|---|---|
| Z0 | 0.5px, dotted | `--color-teal-dim` at 0.3 opacity | None | None |
| Z1 | 1px, solid | `--color-teal-muted` at 0.5 opacity | 2 per line, 3px teal dots | None |
| Z2 | 1.5px, solid | `--color-teal` at 0.7 opacity | 3 per line, 4px teal dots | Protocol badge (pill) |
| Z3 | 2px, solid | `--color-teal-bright` at 0.9 opacity | 5 per line, 5px teal dots | Protocol + throughput |

#### Particle Animation

- Teal dots (`--color-teal-glow`) travel along the bezier path using `getPointAtLength()`.
- Speed range: 40-120px/sec, correlated to conceptual throughput (higher = more traffic).
- Direction indicates data flow (from source to destination app).
- When a source or destination app is DOWN: particles on that connection slow to 0 and fade to 0.2 opacity over 2 seconds.
- When a source or destination app is DEGRADED: particles slow to 50% speed, color shifts to `--color-warning`.

#### Health-Reactive Line Color

| Connection State | Line Color | Particle Color |
|---|---|---|
| Both endpoints OPERATIONAL | `--color-teal-muted` | `--color-teal-glow` |
| One endpoint DEGRADED | `--color-warning` | `--color-warning-glow` |
| One endpoint DOWN | `--color-error-dim` | `--color-error` (stopped) |
| One endpoint OFFLINE | `--color-offline-dim` | None (no particles) |

#### World-Space Positions

Lines connect capsule centers. Capsule center positions (from `computeCapsuleCenter(ringIndex)` in `capsule-ring.tsx`):

| Capsule | Ring Index | Angle | X (approx) | Y (approx) |
|---|---|---|---|---|
| Agent Builder | 0 | -90deg (12 o'clock) | 0 | -300 |
| Tarva Chat | 1 | -30deg (2 o'clock) | +260 | -150 |
| Project Room | 2 | +30deg (4 o'clock) | +260 | +150 |
| TarvaCORE | 3 | +90deg (6 o'clock) | 0 | +300 |
| TarvaERP | 4 | +150deg (8 o'clock) | -260 | +150 |
| tarvaCODE | 5 | -150deg (10 o'clock) | -260 | -150 |

These positions are relative to the ring container's center, which is positioned at `(0, 0)` in world space.

---

### 2.2 Range Rings and Compass Rose

**Purpose:** Add structured spatial framework between the capsule ring and the peripherals. Creates the "radar display" / "targeting reticle" feel from Oblivion.

**Component:** `RangeRings.tsx` (SVG, inside SpatialCanvas, `pointer-events: none`)

#### Elements

**Inner Range Ring:**
- SVG `<circle>` at r=450px, centered at (0,0)
- Stroke: `rgba(255, 255, 255, 0.025)`, 1px, dashed (`stroke-dasharray: 4 8`)
- 8 tick marks at 45-degree intervals, 6px long, same opacity

**Outer Range Ring:**
- SVG `<circle>` at r=560px, centered at (0,0)
- Stroke: `rgba(255, 255, 255, 0.035)`, 1px, dashed (`stroke-dasharray: 4 8`)
- 24 tick marks at 15-degree intervals, 4px long, same opacity

**Compass Labels** (at cardinal points on the outer ring):
- N, E, S, W in 9px Geist Sans, `--color-text-ghost`, uppercase, tracking 0.12em
- Positioned 16px outside the outer ring at each cardinal direction

**Sector Labels** (between inner and outer rings, at 45-degree diagonals):
- NW: "GOVERNANCE" (aligns with Evidence Ledger quadrant)
- NE: "OPERATIONS" (aligns with TarvaCORE district direction)
- SW: "FORGE" (aligns with build/design tools)
- SE: "COMMS" (aligns with Chat + comms tools)
- 8px Geist Sans, `--color-text-ghost` at 0.5 opacity, uppercase, tracking 0.15em
- Rotated to follow the diagonal angle

#### Z-Level Visibility

| Zoom | Inner Ring | Outer Ring | Compass | Sectors |
|---|---|---|---|---|
| Z0 | Hidden | Hidden | Hidden | Hidden |
| Z1 | Visible (0.025 opacity) | Visible (0.035 opacity) | Visible | Visible |
| Z2 | Visible (0.05 opacity) | Visible (0.06 opacity) | Visible (brighter) | Hidden (zoomed past) |
| Z3 | Culled (off-viewport) | Culled (off-viewport) | Culled | Culled |

---

### 2.3 Peripheral Instrument Panels

**Purpose:** Four data readout stations positioned outside the ring, providing system-wide telemetry that fills the void and gives the "mission control" density.

**Design Language:** Glass panels using the existing `.glass` CSS recipe. Ultra-thin borders. Geist Mono for data values. Geist Sans for labels. Teal accent for telemetry data.

#### 2.3.1 System Chronometer (NORTH)

**Position:** `(0, -620)` -- centered above the ring
**Dimensions:** 280 x 88px
**Z-visibility:** Z1 compact, Z2 expanded
**Content:**

```
+------------------------------------------+
|  SYSTEM UPTIME              UTC CLOCK    |  Z1: compact
|  14d 07h 22m 15s           17:42:08Z     |
|  ~~~ heartbeat line (thin pulse) ~~~     |
+------------------------------------------+
```

At Z2, the panel expands to show:
- Last deployment timestamp
- Active session count
- Server boot time

**Implementation notes:**
- Uptime counter uses `setInterval(1000)` to tick seconds (pure CSS animation for the colon blink)
- Heartbeat line: 1px `--color-teal-dim` line that pulses (opacity 0.2 -> 0.6 -> 0.2) every 5 seconds
- Glass panel with `border: 1px solid rgba(255, 255, 255, 0.04)`

#### 2.3.2 Throughput Gauge (EAST)

**Position:** `(620, 0)` -- centered right of the ring
**Dimensions:** 240 x 168px
**Z-visibility:** Z1 compact, Z2 expanded
**Content:**

```
+-------------------------------+
|  THROUGHPUT                   |
|  1,247 req/s                  |  <- large teal number
|                               |
|  ~~~~ 60s sparkline ~~~~      |  <- teal-muted line
|                               |
|  AB: ===    CH: ==            |  <- Z2: per-app bars
|  PR: ====   CO: =             |
+-------------------------------+
```

**Data source:** Aggregate from districts store `throughput` field (mock: generate random walk around 1200)
**Sparkline:** 60 data points, one per second, teal-muted stroke, no fill. Uses the existing `CapsuleSparkline` component pattern.

#### 2.3.3 Activity Stream (SOUTH)

**Position:** `(0, 620)` -- centered below the ring
**Dimensions:** 320 x 192px
**Z-visibility:** Z1 (3 events), Z2 (5 events)
**Content:**

```
+------------------------------------------+
|  ACTIVITY                                |
|                                          |
|  17:42:01  AB  Agent deployed #a7f2      |
|  17:41:48  PR  Run completed #4821       |
|  17:41:33  CH  Session started #user3    |
|  17:41:12  CO  Reasoning cycle #rc99     |  <- Z2 only
|  17:41:01  ER  Order processed #m142     |  <- Z2 only
+------------------------------------------+
```

**Behavior:**
- Events scroll upward slowly (CSS `translateY` animation, 0.5px/sec)
- Each event has a district color-coded dot (2px) before the timestamp
- Events fade from `--color-text-secondary` to `--color-text-ghost` as they age
- Mock data: generate new events every 3-8 seconds with random district + action

#### 2.3.4 Alert Monitor (WEST)

**Position:** `(-620, 0)` -- centered left of the ring
**Dimensions:** 240 x 128px
**Z-visibility:** Z1 compact, Z2 expanded
**Content:**

```
+-------------------------------+
|  ALERTS                       |
|  2 active                     |  <- color matches worst severity
|                               |
|  [===green====|==amber==|]    |  <- severity bar
|                               |
|  WARN  Tarva Chat p95 > 2s   |  <- Z2: most recent alert
|  17:38:22                     |
+-------------------------------+
```

**Behavior:**
- Alert count uses status color (green if 0, amber if warnings, red if critical)
- Severity bar: horizontal stacked bar, width proportional to count per severity
- When alert count is 0: panel shows "ALL CLEAR" in `--color-healthy` with a subtle glow

---

### 2.4 Grid Enhancement Layer

**Purpose:** Transform the dot grid from a static texture into a living substrate that responds to system state and rewards zoom exploration.

#### 2.4.1 Health-Responsive Grid Pulse

**Current:** Periodic radial pulse from center (CSS `@keyframes` in `atrium.css`)
**Enhancement:** Pulse properties change based on aggregate system health.

| System State | Pulse Color | Pulse Interval | Pulse Radius |
|---|---|---|---|
| All OPERATIONAL | `--color-teal-dim` | 8s | 600px |
| Warnings present | `--color-warning-dim` | 5s | 800px |
| Any DOWN | `--color-error-dim` | 3s | 1000px |

**Implementation:** DotGrid component reads aggregate health from districts store and applies the corresponding CSS custom properties. The pulse keyframe animation references these properties via `var()`.

#### 2.4.2 Grid Coordinate Watermarks (Z2+)

**Component:** `GridCoordinates.tsx` (inside SpatialCanvas)

At zoom level Z2 and above, selected grid intersections display their world-space coordinates as ghost text. Not every intersection -- approximately 1 in every 12 (every ~576px of world space).

**Treatment:**
- Text: `(-384, 192)` format
- Font: 7px Geist Mono, `--color-text-ghost` at 0.4 opacity
- Positioned 4px below and right of the grid intersection dot
- Only rendered when the grid intersection is within the current viewport (culled otherwise)

**Implementation:** Generate coordinate positions at multiples of `48 * 12 = 576px`. Use `ViewportCuller` logic (or a simpler bounding-box check against camera store) to only render visible coordinates.

#### 2.4.3 Circuit Traces (Z3+)

**Component:** Part of `GridCoordinates.tsx` or separate `CircuitTraces.tsx`

At Z3, faint lines appear connecting some dot grid intersections, creating a circuit-board pattern in the background.

**Treatment:**
- Lines: 0.5px, `rgba(255, 255, 255, 0.02)`, connecting grid dots in orthogonal paths (horizontal or vertical only)
- Pattern: algorithmically generated from a seeded random based on grid coordinates (deterministic, not random each render)
- Density: approximately 15% of possible connections are drawn
- Effect: creates a subtle PCB/motherboard texture that only rewards deep zoom exploration

---

### 2.5 Discovery and Delight Layer

**Purpose:** Reward exploration with hidden details, micro-interactions, and contextual surprises. These are lowest-priority but highest-delight.

#### 2.5.1 Data Stamps (Z3, specific coordinates)

At Z3, certain grid intersections reveal tiny "data stamps" -- information fragments that look like embedded firmware labels.

**Locations and content** (seeded, deterministic):

| World Position | Content | Rotation |
|---|---|---|
| (576, -576) | `LAUNCH v1.0.0 // BUILD 2026.058` | 0deg |
| (-1152, 0) | `SPATIAL_ENGINE: CSS_TRANSFORMS` | 90deg |
| (0, 1152) | `TELEMETRY_INTERVAL: 30000ms` | 0deg |
| (-576, -1152) | `RECEIPT_SCHEMA: v2 // TRACE_ENABLED` | 90deg |
| (1152, 576) | `EMBER: #e05200 // TEAL: #277389` | 0deg |

**Treatment:**
- Font: 6px Geist Mono, `--color-text-ghost` at 0.3 opacity
- Uppercase, tracking 0.1em
- Appear with a 200ms fade-in when entering the viewport at Z3
- These are pure easter eggs -- they contain real system configuration values

#### 2.5.2 Hub Origin Inscription (Z3, at origin)

When zoomed to Z3 at the hub center, the breathing Tarva star reveals additional detail:

- Below the star SVG, at `(0, 40)` relative to center:
  `TARVA LAUNCH // MISSION CONTROL`
- Below that, at `(0, 56)`:
  `SPATIAL COORDINATE (0, 0) // ORIGIN`
- Font: 7px Geist Mono, `--color-text-ghost` at 0.25 opacity

This is visible only at Z3 and only when the viewport includes the origin.

#### 2.5.3 Connection Tooltips (Z2+, on hover)

When the user hovers a data flow line at Z2 or above, a tooltip appears describing the connection:

| Connection | Tooltip |
|---|---|
| AB -> CH | "Agents are deployed into chat as conversation participants" |
| AB -> PR | "Agents are assigned to projects for task execution" |
| AB -> CD | "Knowledge from CODE feeds agent training pipelines" |
| CO -> AB | "CORE runs agent inference cycles locally" |
| CO -> PR | "CORE executes autonomous tasks for active projects" |
| ER -> PR | "Manufacturing data feeds project planning and tracking" |
| PR -> CH | "Project teams use chat for coordination and updates" |

**Treatment:**
- Glass panel tooltip, max 280px wide
- Appears on hover with 150ms delay, disappears on leave
- Anchored to the cursor position, offset 12px
- Includes a small teal dot indicating the data flow direction

#### 2.5.4 Particle Cursor Interaction (Z1+)

When the user's cursor crosses within 30px of a particle, the particle:
1. Brightens briefly (opacity 0.6 -> 1.0, over 100ms)
2. Receives a small velocity impulse away from the cursor (like disturbing a particle field)
3. Returns to normal drift within 500ms

This is implemented in the existing `ParticleCanvas` component by adding a cursor position check to the rAF loop.

#### 2.5.5 Scanline Sweep on Zoom Transition

When the semantic zoom level changes (Z0->Z1, Z1->Z2, Z2->Z3), a single horizontal scanline sweeps across the viewport:

- Treatment: 1px line, `--color-teal-dim` at 0.3 opacity, with a slight glow trail
- Duration: 400ms, top to bottom
- Accompanies the content transition (beacons->capsules, capsules->district, etc.)
- Uses CSS `@keyframes` on the existing `ScanlineOverlay` component

---

## 3. RESPONSIVE AMBIENT SYSTEM

The ambient layer should function as a **system health barometer**. The user should be able to glance at the background and sense whether the system is healthy or stressed, without reading any specific metric.

### 3.1 Signal Hierarchy (What Changes and When)

| Signal | Trigger | Visual Change | Intensity |
|---|---|---|---|
| Grid pulse color | Worst health state changes | Pulse hue shifts (teal/amber/red) | Medium |
| Grid pulse frequency | Alert count changes | Faster or slower pulse | Medium |
| Particle color | Per-capsule health | Nearby particles shift color | Subtle |
| Particle agitation | System-wide stress | Drift speed increases | Subtle |
| Connection line color | Connection health | Line shifts color | High |
| Connection particles | Endpoint health | Speed/opacity change | High |
| Capsule background glow | Per-app activity | Glow radius/intensity | Subtle |
| Peripheral panel values | Telemetry poll | Numbers update | High |

### 3.2 State-Driven Ambient Profiles

**Profile: CALM (all healthy, low activity)**
- Grid pulse: slow teal, 8s interval
- Particles: ember color, gentle drift (0.3px/frame)
- Connections: teal, moderate particle speed
- Background: deep void, minimal ambient glow

**Profile: ACTIVE (all healthy, high activity)**
- Grid pulse: brighter teal, 5s interval
- Particles: ember, slightly faster drift (0.5px/frame), 2 additional particles spawn temporarily
- Connections: teal, fast particle speed
- Background: slight teal ambient glow behind active capsules

**Profile: ALERT (warnings present)**
- Grid pulse: amber tinge, 4s interval
- Particles: mix of ember and amber near affected capsule
- Connections to affected app: amber, slower particles
- Alert Monitor panel: border brightens to `--color-warning`

**Profile: CRITICAL (any app DOWN)**
- Grid pulse: red, 3s interval, larger radius
- Particles near affected capsule: red, turbulent (random velocity spikes)
- Connections to affected app: red, particles stopped
- Capsule: offline treatment (opacity 0.4, desaturated)
- Alert Monitor panel: border shifts to `--color-error`, count pulses

### 3.3 prefers-reduced-motion Adaptation

When `prefers-reduced-motion: reduce` is active:
- Grid pulse: replaced with a static color tint (no animation)
- Particle drift: disabled (particles rendered as static dots)
- Connection particles: disabled (lines remain, no animated dots)
- Data flow lines: remain visible (static, no animation)
- Peripheral instruments: update values without transition animation
- Scanline sweep: disabled

---

## 4. Z-LEVEL CONTENT MAP (Summary)

### Z0 -- Constellation (zoom < 0.27)

| Element | State | Notes |
|---|---|---|
| Beacon dots (6) | VISIBLE | Existing -- 40px beacons with status color |
| Global metrics bar | VISIBLE | Existing -- below ring |
| Constellation lines | NEW | Thin teal lines connecting beacons |
| System pulse ring | NEW | Large concentric ring, breathes with health |
| Range rings | HIDDEN | Too small to see at this zoom |
| Peripheral panels | HIDDEN | Too far from center |
| Data flow particles | HIDDEN | Too small at this scale |
| Grid coordinates | HIDDEN | Too small to read |

### Z1 -- Atrium (zoom 0.27-0.72, DEFAULT)

| Element | State | Notes |
|---|---|---|
| Capsule ring (6) | VISIBLE | Existing -- full 192x228 capsules |
| Hub center glyph | VISIBLE | Existing -- breathing Tarva star |
| Data flow network | NEW | Teal bezier lines + animated particles |
| Range rings | NEW | Inner (450r) + outer (560r) with ticks |
| Compass labels | NEW | N, E, S, W on outer ring |
| Sector labels | NEW | GOVERNANCE, OPERATIONS, FORGE, COMMS |
| System Chronometer | NEW | North, glass panel, uptime + clock |
| Throughput Gauge | NEW | East, glass panel, req/s + sparkline |
| Activity Stream | NEW | South, glass panel, scrolling events |
| Alert Monitor | NEW | West, glass panel, alert count + bar |
| Grid pulse | ENHANCED | Health-responsive color + frequency |
| Particle field | ENHANCED | Color-responsive to health |
| Evidence Ledger | EXISTING | NW quadrant |
| Dot grid | EXISTING | 48px spacing background |

### Z2 -- District (zoom 0.72-1.35)

| Element | State | Notes |
|---|---|---|
| Selected capsule (expanded) | VISIBLE | Existing -- morphed to district |
| Detail panel | VISIBLE | Existing -- side panel with stations |
| Data flow network | ENHANCED | Thicker lines, protocol labels appear |
| Connection tooltips | NEW | Hover for connection descriptions |
| Peripheral panels | EXPANDED | More detail rows visible |
| Grid coordinates | NEW | Sparse coordinate watermarks appear |
| Evidence Ledger | VISIBLE | Timeline strip view |

### Z3 -- Station (zoom 1.5+)

| Element | State | Notes |
|---|---|---|
| Station panels | VISIBLE | Existing -- full app-specific detail |
| Data flow network | FULL DETAIL | Throughput numbers, thick lines |
| Grid coordinates | VISIBLE | More coordinates visible |
| Circuit traces | NEW | Faint PCB lines between grid dots |
| Data stamps | NEW | Easter egg labels at specific coords |
| Hub inscription | NEW | "MISSION CONTROL" text at origin |
| Evidence Ledger | VISIBLE | Full panel view |

---

## 5. COMPONENT INVENTORY

| Component | File | Layer | Priority | Estimated Complexity |
|---|---|---|---|---|
| `DataFlowNetwork` | `src/components/districts/data-flow-network.tsx` | SpatialCanvas | P1 -- HIGH | Medium (SVG + rAF particles) |
| `RangeRings` | `src/components/districts/range-rings.tsx` | SpatialCanvas | P1 -- HIGH | Low (pure SVG) |
| `SystemChronometer` | `src/components/instruments/system-chronometer.tsx` | SpatialCanvas | P2 -- MEDIUM | Low (glass panel + timer) |
| `ThroughputGauge` | `src/components/instruments/throughput-gauge.tsx` | SpatialCanvas | P2 -- MEDIUM | Medium (sparkline + data) |
| `ActivityStream` | `src/components/instruments/activity-stream.tsx` | SpatialCanvas | P2 -- MEDIUM | Medium (scrolling events) |
| `AlertMonitor` | `src/components/instruments/alert-monitor.tsx` | SpatialCanvas | P2 -- MEDIUM | Low (aggregate + bar) |
| `GridCoordinates` | `src/components/districts/grid-coordinates.tsx` | SpatialCanvas | P3 -- LOW | Low (culled text labels) |
| `CircuitTraces` | `src/components/districts/circuit-traces.tsx` | SpatialCanvas | P3 -- LOW | Low (seeded SVG lines) |
| `DiscoveryStamps` | `src/components/districts/discovery-stamps.tsx` | SpatialCanvas | P4 -- DELIGHT | Low (static positioned text) |
| `ConstellationLines` | `src/components/districts/constellation-lines.tsx` | SpatialCanvas | P2 -- MEDIUM | Low (thin SVG lines) |

**Modifications to existing components:**

| Component | Modification | Priority |
|---|---|---|
| `DotGrid` | Health-responsive pulse color/frequency via CSS vars from store | P2 |
| `ParticleCanvas` (or equivalent) | Cursor interaction, health-responsive color, activity-driven density | P3 |
| `ScanlineOverlay` | Zoom-transition sweep trigger | P3 |
| `HubCenterGlyph` | Z3 inscription text below star | P4 |

---

## 6. IMPLEMENTATION SEQUENCE

### Phase A: Spatial Structure (fills the void immediately)

1. **RangeRings** -- SVG circles, tick marks, compass labels, sector labels. Pure visual structure, no data dependency. Renders inside SpatialCanvas at `(0, 0)`.

2. **DataFlowNetwork** -- SVG bezier paths between capsule centers. Static lines first, then add animated particles. Connection topology is a static config array. Health-reactive coloring reads from districts store.

### Phase B: Peripheral Instruments (adds data density)

3. **SystemChronometer** -- Glass panel at `(0, -620)`. Uptime counter, UTC clock. Reads from a simple store or computed value.

4. **AlertMonitor** -- Glass panel at `(-620, 0)`. Aggregates alert count from districts store. Severity bar.

5. **ThroughputGauge** -- Glass panel at `(620, 0)`. Aggregate throughput number + sparkline.

6. **ActivityStream** -- Glass panel at `(0, 620)`. Mock event generator + scrolling list.

### Phase C: Ambient Enhancement (adds life)

7. **Grid Pulse Enhancement** -- Modify DotGrid to accept health state and vary CSS custom properties for pulse color/frequency.

8. **ConstellationLines** -- Thin lines at Z0 connecting beacons, completing the "star chart" look.

9. **ScanlineOverlay zoom trigger** -- Fire scanline sweep on semantic zoom transitions.

### Phase D: Discovery Layer (adds delight)

10. **GridCoordinates** -- Sparse coordinate labels at Z2+.

11. **CircuitTraces** -- PCB-style lines at Z3.

12. **DiscoveryStamps** -- Easter egg data stamps at Z3.

13. **Hub Inscription** -- "MISSION CONTROL" text at Z3 origin.

14. **Particle Cursor Interaction** -- Cursor-proximity reaction in canvas overlay.

---

## 7. DATA DEPENDENCIES

| Data Point | Source | Current State | Needed By |
|---|---|---|---|
| District health states | `districts.store.ts` | Mock (all OPERATIONAL) | DataFlowNetwork, DotGrid, AlertMonitor |
| Alert counts per district | `districts.store.ts` | Mock (Chat: 2, rest: 0) | AlertMonitor, DataFlowNetwork |
| Aggregate throughput | Not yet defined | N/A | ThroughputGauge |
| System uptime | Not yet defined | N/A | SystemChronometer |
| Activity events | Not yet defined | N/A | ActivityStream |
| Connection topology | Static config | N/A (new) | DataFlowNetwork |

For the initial implementation, all data can be mock-generated (random walks, periodic events, static health states). Real telemetry integration happens in WS-1.5 (Telemetry Aggregator).

---

## 8. PERFORMANCE BUDGET

All enrichment elements are ambient and must not impact the 60fps pan/zoom target.

| Concern | Budget | Strategy |
|---|---|---|
| SVG elements (data flow + range rings) | < 200 nodes total | Static paths, no per-frame re-render |
| Animated particles (data flow) | 20-35 particles total | Single rAF loop, batch position updates |
| Peripheral instrument re-renders | 1/sec max | `setInterval` or telemetry poll cycle |
| Grid coordinates (Z2+) | < 50 visible at once | Viewport culling, memoized positions |
| Circuit traces (Z3) | < 100 visible at once | Viewport culling, seeded generation |
| Discovery stamps (Z3) | 5 total in world | Viewport culling, static text |

**Key performance rules:**
1. All ambient SVG uses `pointer-events: none` -- no hit testing overhead.
2. Data flow particle animation runs in a single `requestAnimationFrame` loop, not per-particle React state.
3. Peripheral instruments use `React.memo` and only re-render when their specific data slice changes.
4. Z-level gating: components return `null` when outside their visible zoom range, avoiding unnecessary DOM.
5. Viewport culling for grid coordinates and circuit traces: only render elements within the camera's visible bounds + 200px margin.

---

## 9. ACCESSIBILITY CONSIDERATIONS

| Element | Treatment |
|---|---|
| Data flow lines | `aria-hidden="true"` -- decorative. Connection info available via command palette search. |
| Range rings | `aria-hidden="true"` -- decorative spatial structure. |
| Peripheral instruments | Semantic HTML. Labels use `aria-label`. Values use `aria-live="polite"` for screen reader updates. |
| Grid coordinates | `aria-hidden="true"` -- decorative background detail. |
| Discovery stamps | `aria-hidden="true"` -- easter eggs, not functional. |
| Scanline sweep | `aria-hidden="true"`, disabled under `prefers-reduced-motion`. |
| Particle interaction | No accessibility impact -- purely visual. |
| Connection tooltips | Standard tooltip pattern with `role="tooltip"`, keyboard-accessible via focus on the line segment. |

---

## 10. DESIGN TOKEN ADDITIONS

New tokens needed for enrichment elements (extend the existing spatial token set):

```css
/* Range ring marks */
--color-range-ring: rgba(255, 255, 255, 0.03);
--color-range-tick: rgba(255, 255, 255, 0.04);

/* Data flow connections */
--color-flow-line: var(--color-teal-muted);
--color-flow-particle: var(--color-teal-glow);
--color-flow-degraded: var(--color-warning);
--color-flow-down: var(--color-error-dim);

/* Instrument panel (extends glass) */
--instrument-bg: rgba(255, 255, 255, 0.02);
--instrument-border: rgba(255, 255, 255, 0.04);
--instrument-label: var(--color-text-tertiary);
--instrument-value: var(--color-teal-bright);

/* Discovery layer */
--color-stamp: var(--color-text-ghost);
--color-circuit: rgba(255, 255, 255, 0.02);

/* Health-responsive pulse overrides */
--pulse-color-healthy: var(--color-teal-dim);
--pulse-color-warning: var(--color-warning-dim);
--pulse-color-critical: var(--color-error-dim);
--pulse-interval-healthy: 8s;
--pulse-interval-warning: 5s;
--pulse-interval-critical: 3s;
```

---

## 11. OPEN QUESTIONS

| # | Question | Impact | Suggested Owner |
|---|---|---|---|
| OQ-1 | Should data flow particles run on the existing ParticleCanvas (HTML5 Canvas) or as SVG `<circle>` elements? Canvas is more performant for many particles but requires coordinate transformation. SVG is simpler but may hit DOM limits if particle count is high. | Implementation approach for DataFlowNetwork | react-developer |
| OQ-2 | Should peripheral instrument data be mock-generated locally or should we implement a lightweight mock telemetry server (WS-1.5 prerequisite)? | Data layer for instruments | chief-technology-architect |
| OQ-3 | At Z0, should constellation lines animate (slow pulse) or remain static? Animation adds life but the Z0 view is very zoomed out and animation may not be perceptible. | Visual treatment for ConstellationLines | world-class-ui-designer |
| OQ-4 | Should the Activity Stream show real receipt events (from the receipt store) or mock events? If real, it creates a dependency on WS-3.x receipt infrastructure. | Data source for ActivityStream | chief-technology-architect |
| OQ-5 | Should we add ambient sound cues (subtle hum at Z0, click sounds on zoom transitions)? This aligns with the "cinematic" vision but may be unwanted in an internal tool. | Scope -- audio layer | Product decision |

---

## 12. SUCCESS CRITERIA

The enrichment is successful when:

1. **No empty void visible at Z1 default zoom.** Every direction from the capsule ring has structured visual content within the viewport.
2. **System health is visible at a glance.** A user can tell whether the system is healthy, degraded, or critical without reading any specific number -- the ambient color palette shifts to communicate it.
3. **Zoom is rewarded.** Each zoom level reveals new detail that was not visible before. Users who explore deeper discover more.
4. **Inter-app connections are visible.** The 6 districts are clearly part of one interconnected system, not 6 isolated cards.
5. **Performance is maintained.** Pan and zoom remain smooth at 60fps with all enrichment layers active.
6. **Reduced motion is respected.** All ambient animations are disabled or replaced with static equivalents when `prefers-reduced-motion: reduce` is active.

---

*End of Spatial Enrichment Plan v1.0*
