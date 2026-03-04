# UX Designer Plan -- Enriching the Tarva Launch Spatial Canvas

**Author:** UX Designer
**Date:** 2026-02-27
**Objective:** Transform Tarva Launch from a functional spatial hub into a dense, explorable mission-control environment where the space "feels full of little things and nuances -- like there is a lot going on, or more to explore."
**Design Language:** Oblivion Light Table (GMUNK) + NASA mission-control density + Apple materials discipline

---

## Executive Summary

The current Tarva Launch canvas has a working capsule ring, dot grid, and Evidence Ledger, but the surrounding 20000x20000px world space is largely empty. The user perceives the interface as functional but sparse. This plan introduces four categories of enrichment:

1. **Peripheral Instrument Panels** -- Six Oblivion-inspired readout panels arranged around the capsule ring, each displaying a different facet of system telemetry
2. **Inter-District Data Flows** -- Animated connection lines between capsules showing real app-to-app data relationships
3. **Discovery Layers** -- Coordinate inscriptions, sector labels, calibration marks, and hidden message fragments that reward zooming and panning
4. **Responsive Ambient States** -- Environmental shifts (color, particle behavior, glow intensity, animation cadence) that reflect system health without requiring the user to read numbers

The result: a canvas that breathes, communicates, and rewards exploration at every zoom level.

---

## 1. Information Architecture by Zoom Level

### Guiding Principle

Each zoom level tells a different story. Z0 answers "where is the problem?" Z1 answers "what is the system doing?" Z2 answers "what is this app doing?" Z3 answers "show me everything." Content does not simply scale -- it transforms in meaning and density.

### Z0 -- Constellation (zoom < 0.27)

**Story:** A glanceable star chart. Find where attention is needed in under two seconds.

| Element | Current | Proposed Addition |
|---------|---------|-------------------|
| District beacons | 6 luminous dots with status color | Add faint **orbital ring** connecting all 6 beacons (thin teal line, 0.04 opacity) |
| Global metrics | 3 text readouts | Replace with **3 radial mini-gauges** (24px diameter, filled arc proportional to value) |
| Connection lines | None | Show **critical connections only** -- thick dashed lines between any two apps where one is DOWN/DEGRADED, colored by severity |
| Ambient | Dot grid + particles | Reduce dot grid to barely visible (0.008 opacity). Particles slow to near-stillness. The constellation should feel like deep space. |
| New: System pulse | -- | A single **concentric ring animation** expanding from center every 8s, radius matching the beacon ring, 0.03 opacity teal. This is the system's "heartbeat" visible from orbit. |

**Oblivion reference:** UI_01 center map -- the zoomed-out view shows positioned icons with status indicators on a gridded field. Our beacons with the orbital ring create the same "tactical overview" feel.

**World-space positions:** Beacons inherit capsule ring positions (300px radius). Orbital ring: 300px radius SVG circle centered at (0,0). System pulse: CSS animation on a div centered at (0,0).

---

### Z1 -- Atrium (zoom 0.27 -- 0.72, default 0.50)

**Story:** The mission-control desktop. Dense but scannable. Every glance reveals activity.

This is where the majority of new content lives. The capsule ring remains the focal center, but it is now surrounded by six peripheral instrument panels and interconnected by animated data-flow lines.

| Element | Current | Proposed Addition |
|---------|---------|-------------------|
| Capsule ring | 6 capsules, breathing hub glyph | No change to capsules. Add **connection lines** between capsules (see Section 3). |
| Hub center | Tarva star with glow | Surround star with a **micro-chronometer ring** -- a thin (2px) circular progress bar that completes one revolution per minute, teal color, 0.15 opacity |
| Background | Dot grid 48px, 0.015 opacity | Add **sector grid overlay** -- faint lines at 2000px intervals with sector codes (A1, A2, B1, etc.) at intersections, ghost text opacity (0.06) |
| Peripheral panels | None | **6 instrument panels** at 700-900px from center (see Section 2) |
| Coordinate display | None | Fixed HUD element (bottom-left area): current camera position as "LAT {y} / LON {x}" in Geist Mono 10px, ghost opacity, updating as camera moves |
| Ambient labels | None | Faint **cardinal direction labels** at 1500px from center: "N/SYS", "E/OPS", "S/DOCK", "W/FORGE" in 9px uppercase ghost text |

**Oblivion reference:** UI_01 full interface -- the left sidebar with status readouts, the right sidebar with feed selectors, the center map with its grid overlay and positioned elements. Our layout mirrors this three-zone structure: west instruments, center ring, east instruments.

---

### Z2 -- District (zoom 0.72 -- 1.35)

**Story:** The app under the microscope. Rich telemetry emerges alongside the station panels.

| Element | Current | Proposed Addition |
|---------|---------|-------------------|
| Morph/unfurl | Station panels appear | No change to morph choreography |
| Peripheral panels | Visible but distant | Panels gain **detail mode**: labels switch from abbreviations to full names, sparklines expand, secondary metrics appear |
| Connection lines | Visible | Lines connected to the selected district **brighten** (0.3 opacity); others dim to 0.04. Pulse particles accelerate on active lines. |
| New: Signal strip | -- | A **waveform readout** appears adjacent to the selected district (offset 280px to the right), showing last-60s activity as a layered area chart. Inspired by UI_16-19 signal data visualization. 200x80px, teal/ember fill areas. |
| New: Position data | -- | Below the selected capsule, a **position readout block** appears: district ID, coordinates, zoom level, session timestamp. Geist Mono 10px, 0.4 opacity. Inspired by UI_03 "POSITION DATA" concentric circles label. |
| Calibration marks | None | **Corner registration marks** appear at the four corners of the viewport (fixed position, not world-space). 16px L-shaped marks, 1px, 0.08 opacity. Inspired by UI_13-14 camera viewer frame. |

**Oblivion reference:** UI_03 drone diagnostic -- when you focus on a specific drone, detailed fuel status bars and position data appear. Our signal strip and position readout serve the same purpose for the selected district.

---

### Z3 -- Station (zoom 1.5+)

**Story:** Every surface is inscribed. The workspace rewards the curious.

| Element | Current | Proposed Addition |
|---------|---------|-------------------|
| Station panels | Full interactive panels | No change |
| New: Micro-inscriptions | -- | Faint text fragments scattered in the background near station panels (see Section 4.1). Build hashes, agent names, creation timestamps. 8px Geist Mono, 0.04 opacity. Become 0.12 on hover proximity (within 100px). |
| New: Data matrix | -- | Behind each station panel, a **background data matrix** -- a grid of random hex values that slowly scroll upward. 7px Geist Mono, 0.03 opacity. Think "The Matrix" but nearly invisible. Inspired by UI_16 matrix codes. |
| New: Timecode strip | -- | At the bottom edge of each station panel, a thin **timecode bar** showing the current time in SMPTE format (HH:MM:SS:FF). 9px Geist Mono, 0.25 opacity, teal. Inspired by UI_13 "26:08:36:08" timecode overlay. |
| Connection lines | Visible at reduced opacity | The specific connection lines touching the active district show **data type labels** at their midpoints ("AGENTS", "KNOWLEDGE", "MFG DATA"). 8px uppercase, 0.2 opacity. |

**Oblivion reference:** UI_13-14 camera viewer -- the timecode overlay, corner marks, and "DATUM FEED" label. Also UI_16-19 -- the layered data visualizations with DECODE buttons and matrix codes. Z3 is where the interface becomes maximally dense and inscription-rich.

---

## 2. Peripheral Instrument Panels

Six instrument panels positioned around the capsule ring, each serving a distinct monitoring function. All panels share a common visual language:

**Shared panel properties:**
- Glass material: `rgba(255, 255, 255, 0.025)`, `backdrop-filter: blur(8px)`, 1px border at 0.04 opacity
- Width: 180px (compact, instrument-like)
- Height: variable (180-320px depending on content)
- Corner radius: 12px
- Header: 3-letter panel code + full name, Geist Sans 9px uppercase, 0.5 opacity
- Accent: Teal for data readouts, ember for interactive elements
- All values in Geist Mono with `tabular-nums`
- Non-interactive at Z1 (ambient readouts only). Interactive elements appear at Z2+.
- `pointer-events: none` -- these are ambient instruments, not clickable panels. They inform, they do not act.

**Performance rule:** All panels are visibility-gated by `useSemanticZoom()`. They mount at Z1, unmount at Z0. Data updates are throttled to once per telemetry poll (10-15s), not per frame.

---

### 2.1 SYS -- System Status Panel

**Position:** West, (-800, 0) world-space
**Dimensions:** 180 x 300px
**Visible:** Z1+ (mount at zoom >= 0.27)
**Oblivion reference:** UI_01 left sidebar -- ONLINE indicator, uptime timer, mission label, drone counts with colored status dots

```
+------------------------------+
|  SYS  SYSTEM STATUS          |  <- 9px header, 0.5 opacity
|------------------------------|
|  STATUS     ONLINE           |  <- green dot + "ONLINE" in green
|  UPTIME     04:23:17:08      |  <- HH:MM:SS:FF, teal, updating
|  OPERATOR   1 / ACTIVE       |
|  SESSION    7F2A-B8C1        |  <- session hash
|------------------------------|
|  AB  [*] OPERATIONAL    04h  |  <- app rows, 3-letter code
|  CH  [*] OPERATIONAL    04h  |     status dot + state + uptime
|  PR  [*] DEGRADED       02h  |     amber row
|  CO  [-] OFFLINE          -  |     muted row
|  ER  [*] OPERATIONAL    04h  |
|  CD  [-] OFFLINE          -  |
|------------------------------|
|  ERR RATE   0.02%            |  <- aggregate, teal
|  LAST EVT   12:04:23         |
+------------------------------+
```

**Typography:**
- Labels (STATUS, UPTIME, etc.): Geist Sans 9px, uppercase, tracking 0.06em, `--color-text-ghost` (0.35 opacity)
- Values: Geist Mono 11px, weight 500, `--color-teal-bright`
- App codes: Geist Mono 10px, weight 600, tracking 0.08em
- Status words: Geist Sans 9px, color matches status dot

**Behavior:**
- Uptime counter increments every frame via CSS animation (not JS) using a monospace counter trick, or via a lightweight `setInterval` at 1000ms
- App rows update when telemetry refreshes
- At Z2+, each app row gains a tiny 40px sparkline showing last-10-polls response time

---

### 2.2 FED -- Activity Feed Panel

**Position:** East, (800, 0) world-space
**Dimensions:** 180 x 280px
**Visible:** Z1+ (mount at zoom >= 0.27)
**Oblivion reference:** UI_01 right sidebar -- DATALINKS count, button-style tabs (MAIN MAP / FEED), feed selectors

```
+------------------------------+
|  FED  ACTIVITY FEED          |
|------------------------------|
|  DATALINKS  6                |  <- total connected apps
|  EVENTS/HR  47               |
|------------------------------|
|  [ALL] [ERR] [AI]            |  <- filter tabs (visual only at Z1)
|------------------------------|
|  12:04  AB  DEPLOY     ok    |  <- scrolling event rows
|  12:03  CH  MSG_RECV   ok    |     newest at top
|  12:01  PR  RUN_START  ok    |
|  11:58  AB  BUILD      ok    |
|  11:55  CO  --         --    |  <- offline app: muted
|  11:52  CH  AGENT_ACT  ok    |
|  11:49  PR  ARTIFACT   ok    |
|  11:45  ER  MFG_CYCLE  ok    |
|  ...                         |
+------------------------------+
```

**Typography:**
- Event rows: Geist Mono 9px, 0.5 opacity for timestamps, 0.7 for app codes, 0.4 for event types
- "ok" results in teal; "err" results in ember-bright; "warn" in warning color
- Filter tabs: 9px uppercase, active tab at 0.8 opacity with subtle underline, inactive at 0.3

**Behavior:**
- Shows last 12 events (enough to fill the panel without scrolling)
- New events animate in from top with a 200ms slide-down, pushing older events down
- Tabs are non-interactive at Z1 (visual indicator only). At Z2+, clicking a tab filters the feed. This is a progressive disclosure moment.
- Events are sourced from the telemetry polling data (no separate API -- derived from status changes between polls)

---

### 2.3 THR -- Throughput Gauge

**Position:** North, (0, -700) world-space
**Dimensions:** 180 x 200px
**Visible:** Z1+ (mount at zoom >= 0.27)
**Oblivion reference:** UI_09 weather system -- radial displays with concentric circles and scattered data points; UI_04 resource gatherer -- diamond-shaped gauge with concentric rings

```
+------------------------------+
|  THR  THROUGHPUT              |
|------------------------------|
|                              |
|        .---.---.             |
|      /  .---.   \            |  <- concentric arcs (3 rings)
|     |  / 47  \   |           |     center number = total active
|     | |  ACT  |  |           |     processes across all apps
|      \ '---' /              |
|        '---'---'             |  <- ring segments colored by app
|                              |
|  PEAK    72    @ 11:30       |  <- peak value + time
|  AVG     34                  |
|  TREND   [==========>]      |  <- 60px horizontal trend bar
+------------------------------+
```

**Implementation:**
- The gauge is an SVG with 3 concentric circle arcs
- Each arc is divided into 6 segments (one per app), length proportional to that app's contribution to total throughput
- App segments use a muted version of the app's associated color (derived from position in ring)
- Center number uses Geist Mono 20px, teal-bright, weight 600
- "ACT" label below in 8px ghost text

**Behavior:**
- Arc segments animate smoothly when values change (CSS transition on `stroke-dasharray`)
- The outermost ring rotates very slowly (360 degrees per 60 seconds) as an ambient "scanning" indicator
- At Z2+, individual app labels appear at the end of each arc segment

---

### 2.4 NET -- Network Topology

**Position:** South, (0, 700) world-space
**Dimensions:** 200 x 200px
**Visible:** Z1+ (mount at zoom >= 0.27)
**Oblivion reference:** UI_03 drone diagnostic -- wireframe 3D view with teal glow lines, grid of numbered units

```
+------------------------------+
|  NET  NETWORK                 |
|------------------------------|
|                              |
|       AB ---- CH             |
|       | \    / |             |  <- schematic connection map
|       |  \  /  |             |     (simplified topology)
|       |   CO   |             |
|       |  / \   |             |
|       CD    PR----ER         |
|                              |
|  LINKS    8 / 8   HEALTHY    |  <- connection health summary
|  LATENCY  < 50ms             |
+------------------------------+
```

**Implementation:**
- SVG schematic with app nodes as small circles (8px radius) and connections as lines
- Node circles use status colors (green/amber/red/gray)
- Connection lines: 1px, teal at 0.3 opacity for healthy; amber for degraded; dashed red for broken
- Animated dots travel along connection lines (3px circles, 2s transit time, teal)
- Layout is a fixed schematic (not dynamic -- positions are hand-tuned for clarity)

**Behavior:**
- Connection health derived from: if both endpoints are OPERATIONAL, the connection is HEALTHY
- If either endpoint is DEGRADED, the connection line turns amber
- If either endpoint is DOWN, the connection becomes dashed red with no traveling dots
- At Z2+, hovering near a node highlights all its connections (opacity 0.5 on connected lines, 0.05 on others)

---

### 2.5 SIG -- Signal Monitor

**Position:** Northeast, (650, -450) world-space
**Dimensions:** 200 x 120px
**Visible:** Z2+ (mount at zoom >= 0.72) -- this panel rewards zooming in
**Oblivion reference:** UI_16-19 signal data visualization -- layered waveform displays with teal + orange + white fill areas

```
+------------------------------+
|  SIG  SIGNAL MONITOR          |
|------------------------------|
|  ____/\___/\___/\/\___       |  <- layered waveform area chart
| /    \/   \/   \/  \  \     |     6 overlapping lines (one per app)
|/______________________\___   |     teal fill area at 0.06 opacity
|  ^^                    ^^    |     ember highlight on anomalies
|  DECODE    [=====    ] 72%   |  <- decorative progress bar
+------------------------------+
```

**Implementation:**
- SVG area chart with 6 polyline paths, one per app
- Each line represents normalized activity (0-1 scale) over the last 60 seconds (one point per telemetry poll)
- Lines are stacked with decreasing opacity: frontmost at 0.15, rearmost at 0.04
- Fill area below each line in teal at 0.03 opacity
- If any app shows anomalous activity (spike > 2x average), that segment renders in ember instead of teal

**Behavior:**
- New data points shift in from the right, scrolling older data left (smooth SVG path animation)
- "DECODE" bar is purely decorative -- slowly fills over 30s, resets, repeats
- At Z3+, individual app labels appear next to their respective lines

---

### 2.6 ALT -- Alert Monitor

**Position:** Southwest, (-650, 450) world-space
**Dimensions:** 180 x 220px
**Visible:** Z1+ (mount at zoom >= 0.27)
**Oblivion reference:** UI_04 resource gatherer -- diamond-shaped gauge with concentric rings, numerical readouts, stacked horizontal bars

```
+------------------------------+
|  ALT  ALERTS                  |
|------------------------------|
|         /\                   |
|        /  \                  |  <- diamond gauge
|       / 02 \                 |     center number = total alerts
|       \    /                 |     fill level = severity
|        \  /                  |
|         \/                   |
|                              |
|  INFO     [===         ]  3  |  <- severity bars
|  WARN     [==          ]  2  |     length proportional to count
|  ERROR    [=           ]  1  |     color matches severity
|  CRIT     [            ]  0  |
|------------------------------|
|  LAST     AB  WARN  12:01   |  <- most recent alert
+------------------------------+
```

**Implementation:**
- Diamond gauge: rotated 45-degree square (CSS `transform: rotate(45deg)`) with clipped fill level
- Fill color: teal when 0 alerts, amber when 1-3, ember when 4-9, red when 10+
- Severity bars: thin (4px height) horizontal bars, max-width 100px, color per severity tier
- Center number: Geist Mono 18px, weight 600, color matches fill

**Behavior:**
- Diamond gauge fill level animates smoothly (CSS transition)
- When a new alert arrives, the diamond does a single pulse animation (scale 1.0 to 1.06 to 1.0, 300ms)
- Severity bars animate width changes on data refresh
- "LAST" row updates to show the most recent alert with timestamp

---

### Panel Spatial Layout (Top-Down View)

```
                        THR (0, -700)
                    Throughput Gauge
                          |
                          |
         SIG (650,-450)   |
         Signal Monitor   |
                \         |
                 \        |
SYS (-800, 0)    \   [CAPSULE RING]    FED (800, 0)
System Status  ---  * * * (0,0) * * *  --- Activity Feed
                   * Hub Center Star *
                  / * * * * * * * * *
                 /        |
                /         |
         ALT (-650,450)   |
         Alert Monitor    |
                          |
                        NET (0, 700)
                    Network Topology
```

All panels are positioned in world-space (inside the SpatialCanvas). They do NOT move with the viewport -- they exist as fixed points in the spatial world, just like capsules. At the default zoom of 0.5, the viewport shows roughly a 2880px-wide slice of world space (1440px viewport / 0.5 zoom), so panels at 800px from center are comfortably within view.

---

## 3. Inter-District Data Flow

### Connection Map

The following real data relationships exist between Tarva apps. Each is rendered as an animated bezier curve between the corresponding capsule positions in the ring.

| From | To | Relationship | Line Style |
|------|----|-------------|------------|
| Agent Builder | Project Room | Deploys agents | Solid, ember accent |
| Agent Builder | Tarva Chat | Deploys agents | Solid, ember accent |
| TarvaCORE | Agent Builder | Provides reasoning | Dotted, teal |
| TarvaCORE | Tarva Chat | Provides reasoning | Dotted, teal |
| TarvaCORE | Project Room | Provides reasoning | Dotted, teal |
| TarvaCORE | TarvaERP | Provides reasoning | Dotted, teal |
| TarvaCORE | tarvaCODE | Provides reasoning | Dotted, teal |
| tarvaCODE | Agent Builder | Provides knowledge | Dashed, teal |
| tarvaCODE | Tarva Chat | Provides knowledge | Dashed, teal |
| TarvaERP | Project Room | Manufacturing data | Solid, amber |

### Visual Language

**Line rendering:**
- SVG `<path>` elements inside a dedicated SVG overlay within the SpatialCanvas
- Quadratic bezier curves (not straight lines) -- the control point is offset toward the center of the ring, creating gentle arcs that avoid crossing through the hub glyph
- Base stroke: 1px, teal at 0.08 opacity (barely visible at rest)
- On hover near either endpoint capsule: connected lines brighten to 0.25 opacity
- When a district is selected (morph active): lines connected to that district brighten to 0.35; all other lines fade to 0.03

**Animated pulse dots:**
- Small circles (3px radius) that travel along each connection line
- Speed: one full traversal per 4 seconds
- Color: matches line accent color at 0.3 opacity
- Direction: follows the data flow direction (from source to destination)
- Count: 1 dot per line at Z1; 2 dots per line at Z2+
- Dots are SVG `<circle>` elements animated via `<animateMotion>` referencing the path -- zero JS cost

**Line type meanings:**
- **Solid:** Direct deployment/data transfer (strong coupling)
- **Dashed:** Knowledge/context sharing (medium coupling)
- **Dotted:** Reasoning/inference services (loose coupling, many-to-one)

**Connection status indicators:**
- Both endpoints OPERATIONAL: normal rendering
- One endpoint DEGRADED: line turns amber, dots slow to 6s traversal
- One endpoint DOWN: line turns red, dashed pattern, no dots, subtle opacity pulse (0.08 to 0.15, 2s cycle)
- One endpoint OFFLINE: line renders as very faint dashes at 0.03 opacity, no dots

### Z-Level Behavior

| Zoom Level | Connection Line Behavior |
|------------|------------------------|
| Z0 | Only lines between DEGRADED/DOWN endpoints visible (alert highlighting) |
| Z1 | All lines visible at base opacity. Single pulse dot per line. |
| Z2 | Connected-to-selected lines brighten. 2 dots per active line. Midpoint labels appear on brightest lines ("AGENTS", "KNOWLEDGE", "MFG DATA"). |
| Z3 | Full labels on all visible lines. Data type + volume indicator at midpoint. |

---

## 4. Discovery and Delight

### 4.1 Micro-Inscriptions (Z3 only)

Faint text fragments positioned in the background at seemingly random world-space coordinates near the capsule ring (within 400-600px of center). These are not functional -- they are environmental storytelling elements that reward deep zoom exploration.

**Content examples:**
```
BUILD:  7f2a8bc1 / 2026-02-27T04:23:17Z
AGENT:  chief-technology-architect v3.2
TRACE:  a6cc188 → b4d3963 → 52ea629
MODEL:  llama3.2:latest / ctx:4096
EPOCH:  1740000000 / TARVA-LAUNCH-001
HASH:   sha256:e3b0c44298fc1c149...
SPEC:   ZUI-CSS-TRANSFORM / 60FPS-TARGET
NOTE:   "The space reconfigures around intent."
```

**Rendering:**
- Geist Mono 8px, `--color-text-ghost` (0.04 opacity at rest)
- When the cursor is within 120px (world-space), opacity transitions to 0.12 over 400ms (CSS transition on a `data-proximity` attribute toggled by a lightweight `pointermove` listener)
- Positioned at irregular intervals -- not on a grid. 15-20 fragments total, clustered loosely around the hub.
- Content is static (hardcoded). Future enhancement: pull from real commit hashes, agent names, and build data.

**Oblivion reference:** UI_16 matrix codes and "UNKNOWN R: SIGNAL DATA" text overlays. The inscriptions create the same "data is everywhere" density without adding functional complexity.

---

### 4.2 Sector Grid Overlay (Z1+)

The world space is divided into a 4x4 sector grid. Grid lines appear at 2000px intervals, creating sectors labeled A1 through D4.

**Rendering:**
- Vertical and horizontal lines: 1px, `rgba(255, 255, 255, 0.02)` -- barely visible, more felt than seen
- Sector labels at each grid intersection: Geist Mono 10px, 0.04 opacity, offset 8px from intersection point
- Grid covers the range (-4000, -4000) to (4000, 4000) -- the "inhabited" portion of the world space

**Label format:** `SEC A1`, `SEC B3`, etc. All uppercase, tracked 0.1em.

**Oblivion reference:** UI_01 center map -- numbered columns/rows on the grid overlay. The sector labels serve the same spatial-reference function.

---

### 4.3 Calibration Marks (Z2+ fixed HUD)

Four L-shaped corner registration marks appear at the viewport corners when zoomed to Z2 or deeper. These are fixed-position HUD elements (not world-space), serving purely as cinematic framing devices.

**Rendering:**
- Each mark: two perpendicular lines, 16px long, 1px wide, `rgba(255, 255, 255, 0.06)`
- Positioned 12px from viewport edge
- Corners: top-left, top-right, bottom-left, bottom-right
- Between the top marks: "SECTOR {current_sector}" label, 9px Geist Mono, 0.15 opacity
- Between the bottom marks: "DATUM FEED" label, 9px Geist Mono, 0.08 opacity

**Oblivion reference:** UI_13-14 camera viewer -- clean bordered panel with corner registration marks, "SECTOR" number, "DATUM FEED" label. This is a direct adaptation.

---

### 4.4 Session Timecode (fixed HUD)

A running timecode displayed in the bottom-right corner of the viewport, always visible at all zoom levels.

**Format:** `HH:MM:SS:FF` where FF = frame counter (00-59, incrementing with `requestAnimationFrame` but throttled to update display every 1000ms for the SS, and every 16ms for FF)

**Rendering:**
- Geist Mono 10px, weight 500, tracking 0.06em
- Color: `--color-text-ghost` (0.25 opacity)
- Fixed position: 16px from bottom-right viewport corner
- Preceded by a small teal dot (3px, 0.3 opacity, pulsing at 2s cycle) indicating "recording"

**Oblivion reference:** UI_13 "26:08:36:08" timecode overlay. The timecode adds a cinematic "this is being recorded" quality to the interface.

---

### 4.5 Edge-World Message Fragments (Z3, far pan)

At extreme positions in the world space (3000-6000px from center), scattered message fragments appear as faint text blocks. These are discoverable only by panning far from the hub at high zoom.

**8 fragments total, positioned at:**

| ID | Position (x, y) | Content |
|----|-----------------|---------|
| M1 | (-4200, -3100) | `SIGNAL DECODED / TARVA GENESIS / EPOCH 0` |
| M2 | (3800, -2700) | `OPERATOR LOG / "The workspace is alive."` |
| M3 | (4500, 1200) | `CALIBRATION COMPLETE / ALL SYSTEMS NOMINAL` |
| M4 | (-3600, 2800) | `KNOWLEDGE GRAPH / 847 NODES / 2,341 EDGES` |
| M5 | (-2100, -4800) | `AUTONOMOUS REASONING / CYCLE 7,203` |
| M6 | (2900, 4100) | `MANUFACTURING UPTIME / 99.97% / 2026 YTD` |
| M7 | (5200, -800) | `COMM LINK / ESTABLISHED / LATENCY 0.003s` |
| M8 | (-4800, 400) | `ARCHIVE / RECEIPTS: 14,208 / EVIDENCE: INTACT` |

**Rendering:**
- Geist Mono 9px, `--color-teal-dim` at 0.08 opacity
- Bordered by a 1px frame at 0.03 opacity (subtle containing box)
- Max width 200px, word-wrapped
- Each fragment has a tiny "crosshair" mark (+ shape, 8px) at its center, visible at Z2+ to hint at the fragment's existence before the text is readable

**Oblivion reference:** UI_16-19 "UNKNOWN R: SIGNAL DATA" and "MORSE CODE" overlays. These fragments create the same mystery -- data that exists at the periphery, half-decoded, inviting exploration.

---

### 4.6 Environmental Drift (Ambient Variation Over Time)

Every 5 minutes (configurable via `AMBIENT_SHIFT_INTERVAL_MS`), a subtle environmental shift occurs:

1. **Dot grid hue rotation:** The grid dot color shifts by 5 degrees on the hue wheel (from the base blue-violet). After 72 shifts (6 hours), it completes a full cycle back to origin. Imperceptible per-shift but noticeable over a long session.

2. **Particle drift angle:** The dominant drift direction of ember particles rotates by 30 degrees. Creates a sense of "wind" changing.

3. **Canvas scan sweep:** A single thin line (1px, teal at 0.03 opacity) sweeps horizontally across the entire canvas over 3 seconds. This is the system performing a "scan." Occurs once per shift.

4. **Inscription value change:** 3-4 random micro-inscriptions (Section 4.1) update their values -- a new build hash, a new timestamp. The change is subtle (200ms crossfade) and most users will never notice, but those who look closely will see the world is alive.

---

## 5. Responsive Ambient States

The entire canvas environment responds to aggregate system health. Four states are defined, each modulating multiple environmental parameters simultaneously. State transitions are smooth (500ms crossfade) and driven by the existing Attention Choreography engine (WS-3.7).

### State Determination Logic

```
if (any app is DOWN)           → CRITICAL
else if (any app is DEGRADED)  → ALERT
else if (aggregate throughput > 80th percentile) → ACTIVE
else                           → CALM
```

### 5.1 CALM -- All Systems Nominal

The default state. The environment is quiet, inviting, contemplative.

| Parameter | Value |
|-----------|-------|
| Dot grid opacity | 0.015 (base) |
| Dot grid color | Base blue-violet |
| Particle count | 18 (base) |
| Particle speed | 0.3-1.5 px/s (base) |
| Particle color | Ember at base opacity |
| Hub glow cycle | 5s breathing |
| Hub glow intensity | Blur 20-48px, opacity 0.06-0.14 |
| Connection line pulse | 4s traversal |
| Instrument panel accent | Teal (base) |
| Overall ambient sound metaphor | Quiet hum |

### 5.2 ACTIVE -- High Throughput, All Healthy

The system is busy. More energy, more movement, more density.

| Parameter | Value | Delta from CALM |
|-----------|-------|-----------------|
| Dot grid opacity | 0.025 | +67% |
| Particle count | 24 | +6 particles |
| Particle speed | 0.5-2.5 px/s | Faster |
| Hub glow cycle | 4s | -1s (faster breathing) |
| Hub glow intensity | Blur 24-52px, opacity 0.08-0.18 | Brighter |
| Connection line pulse | 2.5s traversal | Faster dots |
| THR gauge outer ring rotation | 30s/revolution | Faster (from 60s) |
| New: Data burst particles | 4 particles spray from active capsules every 8s | Adds energy |

**Data burst particles:** When a capsule's activity metric exceeds a threshold, 4 small particles (2px, teal, 0.2 opacity) spray outward from the capsule in random directions over 800ms, then fade. This creates a "sparking" effect on busy apps.

### 5.3 ALERT -- Degraded Service

Something needs attention. The environment contracts, cools, focuses.

| Parameter | Value | Delta from CALM |
|-----------|-------|-----------------|
| Dot grid opacity | 0.012 | -20% (dimmer) |
| Dot grid color near affected capsule | Amber tint (radial gradient, 400px radius) | Localized warning |
| Particle speed | 0.2-0.8 px/s | Slower (tension) |
| Particle color | 30% of particles shift to amber | Visual warning |
| Hub glow color | Teal replaces ember | Cool-down signal |
| Hub glow cycle | 3s | Faster (urgency) |
| Connection lines to affected app | Amber, 0.2 opacity | Highlighted |
| ALT panel diamond | Amber fill, pulse animation | Active alert |
| SYS panel affected row | Amber text, 0.8 opacity pulse | Row highlight |
| New: Amber scan line | Thin horizontal scan (1px, amber at 0.06) sweeps every 8s | Environmental warning |

### 5.4 CRITICAL -- Service Down

The system demands attention. The environment signals urgency without being alarming.

| Parameter | Value | Delta from CALM |
|-----------|-------|-----------------|
| Dot grid color near affected capsule | Red tint (radial gradient, 600px radius, 0.04 opacity) | Localized danger zone |
| Particle behavior | Particles within 300px of affected capsule accelerate and cluster toward it | Gravity effect |
| Hub glow color | Alternates ember/red on 2s cycle | Alarm signal |
| Hub glow cycle | 2s | Fast (urgency) |
| Connection lines to affected app | Red, dashed, no pulse dots | Broken connection |
| Connection lines between healthy apps | Teal, unchanged | Contrast: healthy = normal |
| ALT panel diamond | Red fill, continuous pulse | Critical alert |
| SYS panel affected row | Red text, background flash at 0.04 opacity | Row highlight |
| New: "ALERT" watermark | Faint text "ALERT" (30px, 0.03 opacity) appears behind affected capsule | Environmental urgency |
| SYS chronometer | Flashes 0.5s on/off cycle | Demands attention |
| New: Affected capsule ring | A pulsing red ring (2px, 0.2 opacity, 300px radius) surrounds the affected capsule | Localized focus |

### State Transition Behavior

All state transitions use a 500ms crossfade (CSS transitions on opacity, color, and filter properties). The Attention Choreography engine (already implemented in WS-3.7) drives the state via `computeRawAttentionState()`. The new enrichment elements (instrument panels, connection lines, ambient parameters) subscribe to the attention store and modulate their rendering accordingly.

**Key constraint:** State transitions must be non-jarring. The user should feel the environment shift, not see it jump. All color changes use `transition: color 500ms, opacity 500ms, filter 500ms`. Particle behavior changes are gradual (new particles are added/removed one per frame, not all at once).

---

## 6. Implementation Guidance

### 6.1 New Component Hierarchy

```
src/components/
  instruments/                    <- NEW: instrument panel components
    shared/
      instrument-panel.tsx        <- shared glass panel container
      instrument-panel.css        <- glass material + readout typography
    sys-status-panel.tsx
    fed-activity-feed.tsx
    thr-throughput-gauge.tsx
    net-network-topology.tsx
    sig-signal-monitor.tsx
    alt-alert-monitor.tsx
    index.ts

  connections/                    <- NEW: inter-district data flow
    connection-overlay.tsx        <- SVG overlay with all connection paths
    connection-path.tsx           <- single bezier path + pulse dots
    connection-label.tsx          <- midpoint data-type label (Z2+)
    index.ts

  discovery/                      <- NEW: exploration/delight elements
    micro-inscriptions.tsx        <- scattered text fragments (Z3)
    sector-grid.tsx               <- 4x4 sector overlay (Z1+)
    calibration-marks.tsx         <- corner HUD marks (Z2+, fixed)
    session-timecode.tsx          <- running timecode (fixed HUD)
    edge-fragments.tsx            <- far-world message blocks (Z3)
    data-matrix.tsx               <- scrolling hex background (Z3)
    index.ts

  ambient/
    ... (existing files)
    ambient-state-modulator.tsx   <- NEW: subscribes to attention store,
                                     applies environmental CSS variables
```

### 6.2 Performance Budget

The current canvas runs at 60fps with 6 capsules, 18 particles, and ambient CSS animations. Adding 6 instrument panels, 10 connection lines, and discovery elements adds significant DOM complexity. The following constraints must be enforced:

| Element Category | Max DOM Nodes | Update Frequency | Thread |
|-----------------|--------------|-------------------|--------|
| Instrument panels (6) | 6 x ~30 = 180 nodes | Telemetry poll (10-15s) | Main |
| Connection lines (10) | 10 paths + 10-20 dots = 30 nodes | CSS animation (compositor) | GPU |
| Sector grid | 20 lines + 16 labels = 36 nodes | Static (never updates) | -- |
| Micro-inscriptions | 20 nodes | Pointer proximity (throttled 100ms) | Main |
| Calibration marks | 8 nodes (4 L-shapes + 2 labels) | Static | -- |
| Session timecode | 2 nodes | 1000ms interval | Main |
| Data matrix (Z3) | 1 canvas element | 16ms (rAF) | Main |

**Total new DOM nodes:** ~296 at maximum (all zoom levels visible). At Z1 (most common): ~246 (no Z2/Z3-only elements).

**Visibility gating is critical.** Every new element must check the current semantic zoom level via `useSemanticZoom()` and return `null` when outside its visible range. This is the primary performance protection.

**backdrop-filter rule:** Instrument panels use `backdrop-filter: blur(8px)` -- a lighter blur than capsules (12px) to reduce GPU load. During active pan (`data-panning="true"`), all instrument panel blur is disabled (swap to solid `rgba(10, 15, 24, 0.85)` fallback).

### 6.3 Data Sources

All new elements derive their data from existing sources -- no new API endpoints required.

| Element | Data Source |
|---------|------------|
| SYS panel | `districts.store.ts` (app statuses, uptimes) + session start time |
| FED panel | `districts.store.ts` (derive events from status change deltas between polls) |
| THR gauge | `districts.store.ts` (aggregate pulse metrics) |
| NET topology | Static connection map + `districts.store.ts` (endpoint health) |
| SIG monitor | `districts.store.ts` (accumulate 60s of normalized activity values in a ring buffer) |
| ALT monitor | `districts.store.ts` (alertCount per app, aggregate) |
| Connection lines | Static paths + `districts.store.ts` (endpoint health for styling) |
| Ambient states | `attention.store.ts` (already computed by WS-3.7) |
| Micro-inscriptions | Hardcoded content (future: derive from real build data) |
| Session timecode | `performance.now()` delta from session start |

### 6.4 Suggested Implementation Order

| Priority | Element | Rationale |
|----------|---------|-----------|
| 1 | Connection lines (Section 3) | Highest impact-to-effort ratio. SVG paths with CSS animations. Makes the ring feel interconnected immediately. |
| 2 | SYS + FED panels (Section 2.1, 2.2) | The "Oblivion sidebar" effect. Left and right panels flanking the ring create the mission-control framing. |
| 3 | Ambient state modulator (Section 5) | Wires existing attention engine to new CSS variables. Makes the environment responsive. |
| 4 | Sector grid + calibration marks (Section 4.2, 4.3) | Low-effort, high-atmosphere elements. Static SVG/CSS. |
| 5 | Session timecode (Section 4.4) | Single component, strong cinematic effect. |
| 6 | THR + ALT panels (Section 2.3, 2.6) | The gauge-style panels with SVG arcs and diamond shapes. |
| 7 | NET topology (Section 2.4) | Schematic rendering requires more layout work but adds significant density. |
| 8 | SIG monitor (Section 2.5) | Z2-only panel with waveform chart. Requires ring buffer for data accumulation. |
| 9 | Micro-inscriptions + edge fragments (Section 4.1, 4.5) | Discovery/delight layer. Low urgency but high delight. |
| 10 | Data matrix + environmental drift (Section 4.6) | Polish layer. The "wow, this thing is alive" details. |

---

## 7. Design Token Additions

The following new CSS custom properties should be added to `src/styles/spatial-tokens.css`:

```css
/* Instrument panel glass */
--glass-instrument-bg: rgba(255, 255, 255, 0.025);
--glass-instrument-border: rgba(255, 255, 255, 0.04);
--glass-instrument-blur: 8px;
--glass-instrument-fallback: rgba(10, 15, 24, 0.85);

/* Connection lines */
--connection-base-opacity: 0.08;
--connection-hover-opacity: 0.25;
--connection-active-opacity: 0.35;
--connection-dot-size: 3px;
--connection-dot-speed: 4s;

/* Discovery elements */
--inscription-base-opacity: 0.04;
--inscription-hover-opacity: 0.12;
--inscription-proximity-radius: 120px;
--sector-grid-opacity: 0.02;
--sector-label-opacity: 0.04;
--calibration-mark-opacity: 0.06;
--timecode-opacity: 0.25;

/* Ambient state modulation (overridden by ambient-state-modulator) */
--ambient-dot-grid-opacity: 0.015;
--ambient-particle-speed-multiplier: 1.0;
--ambient-hub-glow-cycle: 5s;
--ambient-hub-glow-max-blur: 48px;
--ambient-hub-glow-max-opacity: 0.14;
--ambient-connection-speed: 4s;
--ambient-scan-interval: 0s; /* 0 = disabled */

/* Readout typography */
--readout-label-size: 9px;
--readout-label-weight: 400;
--readout-label-tracking: 0.06em;
--readout-label-color: var(--color-text-ghost);
--readout-value-size: 11px;
--readout-value-weight: 500;
--readout-value-color: var(--color-teal-bright);
```

---

## 8. Accessibility Considerations

While WCAG compliance is not required per project constraints (internal localhost tool), the following guidelines ensure the interface remains usable:

1. **`prefers-reduced-motion`:** All new animations (connection dots, throughput ring rotation, scan sweeps, data matrix scroll, environmental drift) disable or reduce to static states when the media query matches.

2. **`aria-hidden="true"`:** All instrument panels, connection lines, discovery elements, and ambient effects are marked as decorative. They do not participate in the accessibility tree.

3. **No critical information in ambient-only channels:** The ambient state changes (Section 5) are supplementary. The actual health status is always readable in the SYS panel text and capsule health bars. Color is never the sole indicator -- text labels accompany every status.

4. **Keyboard navigation unaffected:** All new elements are `pointer-events: none`. They do not interfere with tab order or focus management of existing interactive elements (capsules, command palette, stations).

---

## 9. Oblivion Reference Map

Summary of which Oblivion images inspired each element in this plan:

| Oblivion Reference | Image Description | Tarva Launch Element |
|-------------------|-------------------|---------------------|
| UI_01 left sidebar | Status readouts, ONLINE, uptime, drone counts | SYS panel (Section 2.1) |
| UI_01 right sidebar | DATALINKS, feed tabs, camera controls | FED panel (Section 2.2) |
| UI_01 center map | Grid overlay, numbered columns, positioned icons | Sector grid (Section 4.2), connection lines (Section 3) |
| UI_03 drone diagnostic | Wireframe view, fuel bars, position data, drone cards | NET topology (Section 2.4), Z2 position readout |
| UI_04 resource gatherer | Diamond gauge, concentric rings, horizontal bars | ALT panel (Section 2.6), THR gauge (Section 2.3) |
| UI_09 weather system | Radial displays, wind rose, velocity vectors | THR gauge outer ring rotation |
| UI_13-14 camera viewer | Corner marks, timecode, SECTOR label, DATUM FEED | Calibration marks (Section 4.3), session timecode (Section 4.4) |
| UI_16-19 signal data | Waveform layers, DECODE bar, matrix codes, MORSE CODE | SIG monitor (Section 2.5), micro-inscriptions (Section 4.1), data matrix |
| UI data readouts | 3-letter codes, right-aligned values, monospace | All instrument panel typography |
| UI coordinates | LONGITUDINAL/LATITUDE POSITION readouts | Z2 position data block, coordinate display in HUD |

---

## 10. Success Criteria

The enrichment is successful when:

1. **At Z1 (default), the viewport feels populated in all four quadrants.** The eye has something to scan in every direction -- west instruments, east instruments, north gauge, south topology, and the central capsule ring with its connection web.

2. **Zooming from Z0 to Z3 reveals 4 distinct density tiers.** Each level adds visible content that was not present at the previous level. The user experiences progressive disclosure as exploration reward.

3. **The environment visibly responds to system state changes.** Switching an app from OPERATIONAL to DEGRADED produces a noticeable (but not jarring) environmental shift within 1 second.

4. **Connection lines make the 6-app ecosystem feel interconnected.** Even at a glance, the user can see that these apps are not isolated capsules -- they are nodes in a system.

5. **Performance remains at or above 55fps** during normal pan/zoom at Z1 with all new elements rendered. The 60fps target allows a 5fps budget for the new content.

6. **At least 2 users (including the stakeholder) spontaneously notice and comment on a discovery element** (micro-inscription, edge fragment, or environmental drift) without being told it exists.
