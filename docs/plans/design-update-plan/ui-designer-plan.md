# Visual Enrichment Plan -- Tarva Launch Spatial Canvas

**Agent:** World-Class UI Designer
**Date:** 2026-02-27
**Scope:** Fill the spatial canvas with Oblivion-inspired ambient detail elements around and between the existing capsule ring.
**World-Space Convention:** Default zoom is 0.5. All dimensions below are in **world-space pixels**. To compute apparent screen size, divide by 2. A `24px` world-space font renders as `12px` on screen at default zoom.

---

## Coordinate System Reference

```
                          -Y (North)
                            |
                            |
              NW            |            NE
                            |
       -X ---------(0, 0)--+----(+X) ---------> East
                   Hub Center
              SW            |            SE
                            |
                            |
                          +Y (South)
```

- **Hub center:** `(0, 0)` -- the HubCenterGlyph sits here.
- **Capsule ring:** 840x840px container, centered on `(0, 0)`. Ring radius: 300px. 6 capsules at 60-degree intervals, starting at 12 o'clock (-90 degrees).
- **Capsule size:** 192x228px each.
- **Ring bounding box:** The outermost capsule edge extends to approximately `x: +-396, y: +-414` from center.
- **DotGrid:** 20000x20000px, from `(-10000, -10000)` to `(10000, 10000)`.
- **Evidence Ledger:** NW quadrant (existing, approximately `(-900, -700)`).

All positions below are expressed as `(x, y)` relative to the hub center `(0, 0)`.

---

## Table of Contents

1. [Range Rings and Compass Rose](#1-range-rings-and-compass-rose)
2. [Orbital Data Readouts](#2-orbital-data-readouts)
3. [Coordinate Grid Overlays](#3-coordinate-grid-overlays)
4. [System Status Sidebar (Left)](#4-system-status-sidebar-left)
5. [Feed/Connection Sidebar (Right)](#5-feedconnection-sidebar-right)
6. [Signal Pulse Monitor](#6-signal-pulse-monitor)
7. [Activity Ticker](#7-activity-ticker)
8. [Radial Gauge Cluster](#8-radial-gauge-cluster)
9. [Inter-District Connection Paths](#9-inter-district-connection-paths)
10. [Deep-Zoom Discovery Elements](#10-deep-zoom-discovery-elements)

---

## 1. Range Rings and Compass Rose

**Purpose:** Concentric measurement rings radiating outward from hub center, with cardinal-direction tick marks and labels. Establishes the "radar sweep" foundation for the Oblivion instrument-table aesthetic. This is the single most important atmospheric element -- it transforms the empty canvas into a navigational instrument surface.

**Oblivion reference:** UI_09 (weather instruments, compass rose with translucent teal sectors), UI_04 (diamond gauge with concentric dotted circles).

### 1.1 Concentric Range Rings

**Implementation:** Single SVG element, absolutely positioned at hub center, rendered behind the capsule ring (z-index below capsules).

**Container dimensions:** 2400x2400px (world-space)
**Position:** `(-1200, -1200)` top-left, centering on `(0, 0)`.

| Ring | Radius (px) | Stroke Color | Stroke Width | Dash Pattern | Opacity | Purpose |
|------|-------------|--------------|-------------|-------------|---------|---------|
| R1 | 160 | `rgba(255, 255, 255, 0.04)` | 1 | solid | 0.04 | Inner boundary (inside capsule ring) |
| R2 | 300 | `rgba(255, 255, 255, 0.06)` | 1 | `4 8` | 0.06 | Capsule orbit line |
| R3 | 480 | `rgba(255, 255, 255, 0.035)` | 1 | `2 12` | 0.035 | First outer ring |
| R4 | 700 | `rgba(255, 255, 255, 0.025)` | 1 | `1 16` | 0.025 | Mid-distance ring |
| R5 | 960 | `rgba(255, 255, 255, 0.018)` | 1 | `1 20` | 0.018 | Far ring |
| R6 | 1200 | `rgba(255, 255, 255, 0.012)` | 1 | `1 24` | 0.012 | Outermost ring (at container edge) |

**Typography -- range labels:** Each ring gets a small distance label placed at 45 degrees (NE direction).

- Font: Berkeley Mono / monospace
- Size: 16px (world-space, appears 8px on screen)
- Weight: 400
- Color: `rgba(255, 255, 255, 0.12)`
- Tracking: 0.08em
- Transform: uppercase
- Content: `R-160`, `R-300`, `R-480`, `R-700`, `R-960`, `R-1200`

**Border/glow:** None on rings themselves. The R2 ring (capsule orbit) gets a subtle teal glow:
```
filter: drop-shadow(0 0 3px rgba(14, 165, 233, 0.08))
```

### 1.2 Compass Rose

**Implementation:** SVG layer within the same 2400x2400 container.

**Cardinal ticks (N, E, S, W):**
- Line from radius 140px to radius 180px (crossing the R1 ring)
- Stroke: `rgba(255, 255, 255, 0.15)`
- Stroke width: 1.5px
- Label offset: 10px outside the outer end of tick
- Label font: Berkeley Mono, 20px (world-space), weight 600, tracking 0.14em, uppercase
- Label color: `rgba(255, 255, 255, 0.18)`
- Content: `N`, `E`, `S`, `W`

**Intercardinal ticks (NE, SE, SW, NW):**
- Line from radius 148px to radius 168px
- Stroke: `rgba(255, 255, 255, 0.08)`
- Stroke width: 1px
- No labels at these positions

**Minor ticks (every 15 degrees, 24 total):**
- Line from radius 152px to radius 162px
- Stroke: `rgba(255, 255, 255, 0.04)`
- Stroke width: 0.5px

**Degree markings (every 30 degrees at R3 ring):**
- Placed at radius 490px (just outside R3)
- Font: Berkeley Mono, 14px, weight 400, tracking 0.06em
- Color: `rgba(255, 255, 255, 0.07)`
- Content: `000`, `030`, `060`, `090`, `120`, `150`, `180`, `210`, `240`, `270`, `300`, `330`

### 1.3 Animated Sweep Line

A single radial line that rotates slowly around the compass, like a radar sweep.

- Origin: hub center `(0, 0)`
- Length: from radius 0 to radius 600px
- Stroke: linear gradient from `rgba(14, 165, 233, 0.12)` (at center) to `rgba(14, 165, 233, 0)` (at tip)
- Stroke width: 1px
- Animation: `@keyframes radarSweep` -- `rotate(0deg)` to `rotate(360deg)`
- Duration: 24s
- Timing: linear
- CSS: `animation: radarSweep 24s linear infinite`

**Sweep trail:** A 15-degree arc behind the sweep line, rendered as a conic gradient on a circle:
```css
background: conic-gradient(
  from var(--sweep-angle),
  rgba(14, 165, 233, 0.06) 0deg,
  transparent 15deg
);
```
- Radius: 600px
- Applied to a circular `<div>` or SVG `<path>`, co-rotating with the sweep line.

### 1.4 Glass Material

- Background: `transparent` (SVG element, no glass needed)
- Backdrop-blur: none
- Border: none (strokes are on the SVG elements themselves)

### 1.5 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 (< 0.27) | Hidden. Rings would be tiny dots -- not useful. |
| Z1 (0.30-0.79) | Visible. R1-R4 at full specified opacity. R5-R6 at 50% of specified opacity. Sweep line active. |
| Z2 (0.80-1.49) | R1-R2 visible but fade to 50%. R3-R6 fully visible. Degree markings appear. Minor tick marks appear. |
| Z3 (>= 1.50) | R1 hidden (user is "inside" it). R2-R4 at full. R5-R6 at full. All labels visible. |

---

## 2. Orbital Data Readouts

**Purpose:** 12 small text blocks positioned around the ring perimeter, each displaying a single system metric in Oblivion-style formatting. These are the ambient "technical noise" that makes the space feel like a live instrument panel.

**Oblivion reference:** UI_13 (data readouts with "LONGITUDINAL POSITION" / large number), UI_14 (axis/coordinate labels like "AXIS 04 56 908").

### 2.1 Readout Positions

Readouts are placed on the R3 ring (radius 480px) at 30-degree intervals, staggered between capsule positions to avoid overlap. Each readout is positioned with its center on the R3 arc, text radiating outward.

| ID | Angle (deg) | Position (x, y) | Content Label | Content Value |
|----|-------------|-----------------|---------------|---------------|
| ORB-01 | 0 | (480, 0) | `BEARING` | `000.00` |
| ORB-02 | 30 | (416, 240) | `RADIAL DIST` | `480.0 WU` |
| ORB-03 | 60 | (240, 416) | `CAPSULE ORBIT` | `R-300` |
| ORB-04 | 90 | (0, 480) | `SOUTH DATUM` | `S 00.000` |
| ORB-05 | 120 | (-240, 416) | `VECTOR ALIGN` | `120.45` |
| ORB-06 | 150 | (-416, 240) | `THERMAL IDX` | `0.73` |
| ORB-07 | 180 | (-480, 0) | `WEST HEADING` | `W 180.00` |
| ORB-08 | 210 | (-416, -240) | `SIGNAL GAIN` | `+12.4 dB` |
| ORB-09 | 240 | (-240, -416) | `FLUX DENSITY` | `2.81e4` |
| ORB-10 | 270 | (0, -480) | `NORTH DATUM` | `N 00.000` |
| ORB-11 | 300 | (240, -416) | `PKT RATE` | `1,247/s` |
| ORB-12 | 330 | (416, -240) | `EPOCH` | `T+00:42:18` |

### 2.2 Readout Visual Spec (per readout)

**Dimensions:** 120x44px (world-space)

**Layout (within the 120x44 box):**
```
+----------------------------+
|  LABEL TEXT               |   <- line 1, top-aligned
|  VALUE TEXT               |   <- line 2, 4px below label
+----------------------------+
```

**Typography -- label line:**
- Font: Berkeley Mono / monospace
- Size: 14px (world-space, appears 7px on screen)
- Weight: 400
- Tracking: 0.10em
- Transform: uppercase
- Color: `rgba(255, 255, 255, 0.15)` (same as `--color-text-ghost`)

**Typography -- value line:**
- Font: Berkeley Mono / monospace
- Size: 20px (world-space, appears 10px on screen)
- Weight: 500
- Tracking: 0.02em
- Transform: none
- Color: `rgba(14, 165, 233, 0.4)` (teal at 40% -- telemetry data uses teal accent)
- `font-variant-numeric: tabular-nums`

**Border/glow:** None. These are raw text -- no container, no card, no border. The Oblivion aesthetic uses floating labels with no enclosure.

**Glass material:** None.

**Rotation:** Each readout text is rotated so the top of the label faces outward (away from center). Rotation angle = readout's angular position. For readouts in the lower half (90-270 degrees), flip 180 degrees so text is never upside-down.

### 2.3 Animation

**Ambient value flicker:** Every 8-12 seconds, a random readout's value briefly flickers (opacity dips to 0.08 for 120ms, then returns). This simulates "data refresh" without distracting from the main UI.

- Keyframe name: `readoutFlicker`
- Duration: 120ms
- Timing: `steps(2, jump-none)` (abrupt digital flicker, not smooth)
- Properties: `opacity` (0.4 -> 0.08 -> 0.4)
- Trigger: JavaScript `setInterval` with random readout selection and random delay (8000-12000ms)

**Entry animation (on Z1 entrance):**
- Each readout fades in with a 60ms stagger (ORB-01 first, ORB-12 last = 720ms total sequence)
- From: `opacity: 0, translateY: 6px` (outward from center)
- To: `opacity: 1, translateY: 0`
- Duration: 400ms per readout
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

### 2.4 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible. Labels at 50% of specified opacity. Values at full specified opacity. |
| Z2 | Full visibility. Font sizes increase by 20% (label: 17px, value: 24px). |
| Z3 | Full visibility. Readouts that are within the viewport are fully legible. |

---

## 3. Coordinate Grid Overlays

**Purpose:** Registration marks, crosshairs, and axis lines that reinforce the "technical drawing" / "calibration target" quality of the Oblivion aesthetic. These are purely decorative structural elements.

**Oblivion reference:** UI_14 (camera viewer with corner L-shaped brackets, "SECTOR 042" labels), UI_03 (drone grid with node labels).

### 3.1 Hub Center Crosshair

**Position:** Centered at `(0, 0)`, rendered behind the HubCenterGlyph.

**Dimensions:** 80x80px (world-space)

**Construction:**
- Horizontal line: from `(-40, 0)` to `(40, 0)`, with a 16px gap in the center (for the glyph)
- Vertical line: from `(0, -40)` to `(0, 40)`, with a 16px gap in the center
- Stroke: `rgba(255, 255, 255, 0.06)`
- Stroke width: 0.5px
- Small 4px tick marks at the ends of each line, perpendicular, same stroke

### 3.2 Corner Registration Marks

**Purpose:** L-shaped bracket marks at the corners of an imaginary bounding box around the capsule ring. These are the "camera framing marks" from UI_14.

**Bounding box:** 900x900px centered on `(0, 0)` -- i.e., 30px outside the capsule ring container.

**Mark dimensions:** Each L-bracket is 32px on each arm, 1px stroke.

**Positions (top-left of each L):**
- Top-left: `(-450, -450)` -- arms extend right and down
- Top-right: `(450, -450)` -- arms extend left and down
- Bottom-left: `(-450, 450)` -- arms extend right and up
- Bottom-right: `(450, 450)` -- arms extend left and up

**Stroke:** `rgba(255, 255, 255, 0.08)`
**Stroke width:** 1px

**Typography -- sector labels (one per corner):**
- Placed 8px inside each L-bracket (toward center)
- Font: Berkeley Mono, 12px (world-space), weight 400, tracking 0.12em, uppercase
- Color: `rgba(255, 255, 255, 0.08)`
- Content: `SEC-NW`, `SEC-NE`, `SEC-SW`, `SEC-SE`

### 3.3 Axis Lines

Two faint axis lines extending from the hub center to the edge of the compass area.

- Horizontal axis: from `(-1200, 0)` to `(1200, 0)`
- Vertical axis: from `(0, -1200)` to `(0, 1200)`
- Stroke: `rgba(255, 255, 255, 0.02)` (nearly invisible -- felt more than seen)
- Stroke width: 0.5px
- Dash pattern: `1 24` (very sparse dots)

### 3.4 Coordinate Stamps

Small coordinate labels at the intersection of axis lines and range rings.

| Position | Content |
|----------|---------|
| `(480, 0)` | `X+480 Y+000` |
| `(-480, 0)` | `X-480 Y+000` |
| `(0, 480)` | `X+000 Y+480` |
| `(0, -480)` | `X+000 Y-480` |

- Font: Berkeley Mono, 12px (world-space), weight 400, tracking 0.06em
- Color: `rgba(255, 255, 255, 0.06)`
- Offset: 6px below and to the right of the intersection point

### 3.5 Animation

**None.** These are static structural elements. They appear and disappear with zoom transitions only.

### 3.6 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Corner registration marks visible. Hub crosshair visible. Axis lines visible. Coordinate stamps hidden. |
| Z2 | All visible. Coordinate stamps fade in. |
| Z3 | All visible at increased opacity (+50% from Z1 values). |

---

## 4. System Status Sidebar (Left)

**Purpose:** A fixed-position glass panel on the left side of the world space (not viewport-fixed -- it sits in world space and is part of the spatial canvas). Inspired by the Oblivion left sidebar showing "ONLINE" status, uptime counter, mission label, drone status dots, and toggle switches.

**Oblivion reference:** UI_02, UI_17-21 (left sidebar with TET symbol, ONLINE status, uptime counter, drone status, resource gatherer bars, radiation zones).

### 4.1 Panel Container

**Dimensions:** 320x680px (world-space)
**Position:** `(-720, -340)` top-left corner -- places it to the left of the capsule ring, vertically centered.
**Border radius:** 16px

**Glass material recipe:**
```css
background: rgba(255, 255, 255, 0.025);
backdrop-filter: blur(12px) saturate(120%);
-webkit-backdrop-filter: blur(12px) saturate(120%);
border: 1px solid rgba(255, 255, 255, 0.05);
box-shadow:
  inset 0 1px 0 0 rgba(255, 255, 255, 0.03),
  0 0 24px rgba(0, 0, 0, 0.3);
```

**Internal padding:** 24px all sides. Content area: 272x632px.

### 4.2 Content Blocks (top to bottom)

#### Block A: System Status Header (0-60px from top of content area)

```
  ONLINE                         [*]
  TARVA SYSTEM
```

- "ONLINE" label:
  - Font: Berkeley Mono, 18px, weight 600, tracking 0.14em, uppercase
  - Color: `#22c55e` (healthy green)
- Status dot `[*]`:
  - 8px circle, fill: `#22c55e`
  - Box-shadow: `0 0 8px rgba(34, 197, 94, 0.4)` (green glow)
  - Animation: `@keyframes statusPulse` -- scale 1.0 -> 1.3 -> 1.0, opacity 0.8 -> 1.0 -> 0.8
  - Duration: 3s, ease-in-out, infinite
- "TARVA SYSTEM" label:
  - Font: Berkeley Mono, 14px, weight 400, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.38)` (`--color-text-tertiary`)

**Separator:** 1px line, `rgba(255, 255, 255, 0.04)`, full width, 8px below this block.

#### Block B: Uptime Counter (68-120px)

```
  00:42:18
  SYSTEM UPTIME
```

- Uptime value:
  - Font: Berkeley Mono, 36px, weight 500, tracking 0.04em
  - Color: `rgba(255, 255, 255, 0.87)` (`--color-text-primary`)
  - `font-variant-numeric: tabular-nums`
- "SYSTEM UPTIME" label:
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.12em, uppercase
  - Color: `rgba(255, 255, 255, 0.15)` (`--color-text-ghost`)

**Animation:** The uptime counter ticks every second. Digits update with a 60ms vertical slide transition (old digit slides up 4px with opacity 0, new digit slides in from 4px below).
- Keyframe name: `digitTick`
- Duration: 60ms
- Timing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Properties: `transform: translateY`, `opacity`

#### Block C: Mission Label (128-180px)

```
  MISSION: PLATFORM MONITOR
  TECH N. 01    USER: OPERATOR
```

- "MISSION:" prefix:
  - Font: Berkeley Mono, 14px, weight 400, tracking 0.08em, uppercase
  - Color: `rgba(255, 255, 255, 0.25)`
- "PLATFORM MONITOR" value:
  - Same font, same size, weight 500
  - Color: `rgba(224, 82, 0, 0.7)` (ember at 70%)
- Second line:
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.20)`

**Separator:** 1px line, `rgba(255, 255, 255, 0.04)`, 8px below.

#### Block D: District Status Grid (196-420px)

A vertical list of all 6 districts with colored status dots and activity counts. Directly inspired by the Oblivion "DISPATCHED DRONE TABLE" pattern.

```
  DISTRICT STATUS
  --------------------------------
  [*] AGENT BUILDER      3 active
  [*] TARVA CHAT         12 conv
  [*] PROJECT ROOM       2 ws
  [*] TARVACOR           -- idle
  [*] TARVA ERP          1 proc
  [*] TARVACODE          offline
```

- Section header "DISTRICT STATUS":
  - Font: Berkeley Mono, 14px, weight 600, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.25)`
- Each row is 32px tall, with 4px gap between rows.
- Status dot: 6px circle. Color matches district health state (`#22c55e` / `#eab308` / `#ef4444` / `#6b7280`).
- District name:
  - Font: Berkeley Mono, 14px, weight 400, tracking 0.04em, uppercase
  - Color: `rgba(255, 255, 255, 0.60)` (`--color-text-secondary`)
- Activity count:
  - Font: Berkeley Mono, 14px, weight 500, tracking 0
  - Color: `rgba(14, 165, 233, 0.5)` (teal at 50%)
  - Right-aligned within the row

**Separator:** 1px line below.

#### Block E: Resource Bars (428-540px)

Stacked horizontal bars showing system resource utilization, inspired by UI_04's amber/teal/white segmented bars.

```
  RESOURCE ALLOCATION
  --------------------------------
  CPU     [===###-------] 42%
  MEMORY  [=====##------] 58%
  AGENTS  [==#----------] 18%
  TASKS   [====###------] 52%
```

- Section header: Same style as District Status header.
- Each bar is 8px tall, 200px wide (world-space), with 24px gap between bars.
- Bar background: `rgba(255, 255, 255, 0.03)`
- Bar fill (active portion): linear gradient from `rgba(224, 82, 0, 0.5)` to `rgba(14, 165, 233, 0.4)` (ember-to-teal gradient).
- Bar border: `1px solid rgba(255, 255, 255, 0.04)`
- Bar border-radius: 2px
- Percentage label:
  - Font: Berkeley Mono, 14px, weight 500, tracking 0.02em
  - Color: `rgba(255, 255, 255, 0.38)`
  - Positioned 8px to the right of the bar

#### Block F: Comm Link Status (548-620px)

```
  TARVA COMM LINK
  SKYTOWER N. 01        ACTIVE
  --------------------------------
  [OFF] [ON]
```

- "TARVA COMM LINK":
  - Font: Berkeley Mono, 14px, weight 600, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.25)`
- "SKYTOWER N. 01" / "ACTIVE":
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.08em, uppercase
  - Color: `rgba(255, 255, 255, 0.20)` / `#22c55e` for "ACTIVE"
- Toggle indicators [OFF] / [ON]:
  - Two 40x20px rounded-rect buttons (border-radius 4px)
  - OFF: `background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); color: rgba(255,255,255,0.2)`
  - ON: `background: rgba(224, 82, 0, 0.15); border: 1px solid rgba(224, 82, 0, 0.3); color: #E05200`
  - Font: Berkeley Mono, 12px, weight 600, tracking 0.12em, uppercase

### 4.3 Panel Animation

**Entry:** Panel slides in from `translateX(-40px), opacity: 0` to `translateX(0), opacity: 1`.
- Duration: 600ms
- Delay: 300ms after page mount (let the ring appear first)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

**Ambient:** The status dot in Block A pulses continuously (defined above). The uptime counter ticks (defined above). All other content is static.

### 4.4 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible at 80% opacity. Content simplified: only Block A (status) and Block D (district status) visible. |
| Z2 | Fully visible with all blocks. |
| Z3 | Fully visible. |

---

## 5. Feed/Connection Sidebar (Right)

**Purpose:** A glass panel on the right side of the world space showing feed channels, datalinks, and camera/sensor-style readouts. Mirror of the left sidebar in the Oblivion control station layout.

**Oblivion reference:** UI_02, UI_17-21 (right sidebar with "FEEDS" header, "DATALINKS: 3" count, MAIN MAP/FEED tabs, camera controls, circuit diagram).

### 5.1 Panel Container

**Dimensions:** 320x580px (world-space)
**Position:** `(400, -290)` top-left corner -- places it to the right of the capsule ring, vertically centered.
**Border radius:** 16px

**Glass material recipe:** Same as left sidebar (Section 4.1).

**Internal padding:** 24px all sides. Content area: 272x532px.

### 5.2 Content Blocks (top to bottom)

#### Block A: Feeds Header (0-50px)

```
  FEEDS
  DATALINKS: 5                  [|||]
```

- "FEEDS":
  - Font: Berkeley Mono, 20px, weight 600, tracking 0.12em, uppercase
  - Color: `rgba(255, 255, 255, 0.60)`
- "DATALINKS: 5":
  - Font: Berkeley Mono, 14px, weight 400, tracking 0.08em, uppercase
  - Color: `rgba(14, 165, 233, 0.5)` (teal)
- Signal strength bars `[|||]`:
  - 3 vertical bars, each 3x10px, 2px gap between
  - Fill: `rgba(14, 165, 233, 0.4)`, `rgba(14, 165, 233, 0.5)`, `rgba(14, 165, 233, 0.6)` (ascending intensity)

**Separator:** 1px line.

#### Block B: Feed Channel Tabs (58-150px)

```
  [MAIN MAP | FEED ]   <-- active
  [AGENT    | FEED ]
  [SYSTEM   | FEED ]
```

- Three tab rows, each 24px tall, 4px gap between.
- Active tab:
  - Background: `rgba(224, 82, 0, 0.1)`
  - Border: `1px solid rgba(224, 82, 0, 0.25)`
  - Text color: `rgba(224, 82, 0, 0.8)` (ember)
- Inactive tabs:
  - Background: `rgba(255, 255, 255, 0.02)`
  - Border: `1px solid rgba(255, 255, 255, 0.04)`
  - Text color: `rgba(255, 255, 255, 0.25)`
- Font: Berkeley Mono, 13px, weight 500, tracking 0.08em, uppercase
- Border-radius: 4px
- Full width (272px)

#### Block C: Sensor Readout (158-320px)

A grid of technical readouts mimicking camera/sensor controls from the Oblivion right panel.

```
  APERTURE    F5.6         AF
  ROTATION    090.         CW
  ELEVATION   +12.4        DEG
  GAIN        +0.0         dB

  SKYTOWER / ROT
  [=========--------] 62%
```

- Each parameter row:
  - Label: Berkeley Mono, 12px, weight 400, tracking 0.08em, uppercase, `rgba(255, 255, 255, 0.20)`
  - Value: Berkeley Mono, 16px, weight 500, tracking 0, `rgba(255, 255, 255, 0.50)`, tabular-nums
  - Unit: Berkeley Mono, 12px, weight 400, tracking 0.08em, uppercase, `rgba(255, 255, 255, 0.15)`
- Row height: 28px, 4px gap between rows.
- Gauge bar: Same style as resource bars in left sidebar but teal-only fill: `rgba(14, 165, 233, 0.35)`.

#### Block D: Connection Status (328-420px)

```
  ONLINE   O   OFFLINE
  --------------------------------
  APP HEALTH AGGREGATE
  [==========================] 92%
```

- "ONLINE / OFFLINE" radio selector:
  - Two labels with a circle indicator between them
  - Active: filled circle 8px, `#22c55e`
  - Inactive: outlined circle 8px, `rgba(255, 255, 255, 0.12)`, stroke 1px
  - Font: Berkeley Mono, 12px, weight 500, tracking 0.10em, uppercase
  - Active label color: `rgba(255, 255, 255, 0.60)`
  - Inactive label color: `rgba(255, 255, 255, 0.20)`
- Aggregate health bar:
  - 200px wide, 10px tall, border-radius 3px
  - Fill: linear gradient `#22c55e` to `#eab308` (green to amber, showing mixed health)
  - Background: `rgba(255, 255, 255, 0.03)`

#### Block E: Circuit Diagram (428-532px)

A purely decorative SVG circuit-board-style diagram in the bottom of the panel, inspired by the small circuit in the Oblivion right sidebar's bottom-right corner.

**Dimensions:** 200x100px (world-space)
**Position:** Centered horizontally in the content area, bottom-aligned.

**Construction:** SVG with:
- 6-8 horizontal and vertical lines, stroke `rgba(255, 255, 255, 0.04)`, width 0.5px
- 4-6 small circles (4px radius) at line intersections, stroke `rgba(14, 165, 233, 0.12)`, fill none
- 2-3 small filled rectangles (6x4px) as "component" placeholders, fill `rgba(255, 255, 255, 0.04)`
- One "active" node: 4px circle, fill `rgba(14, 165, 233, 0.3)`, with pulsing glow:
  ```css
  animation: circuitPulse 4s ease-in-out infinite;
  ```
  Glow: `box-shadow: 0 0 6px rgba(14, 165, 233, 0.2)`

### 5.3 Panel Animation

Same as left sidebar (Section 4.3), but from `translateX(+40px)` and with 400ms delay (appears slightly after the left panel).

### 5.4 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible at 80% opacity. Only Block A (feeds header) and Block D (connection status) shown. |
| Z2 | Fully visible. |
| Z3 | Fully visible. |

---

## 6. Signal Pulse Monitor

**Purpose:** A horizontal waveform/signal visualization placed below the capsule ring, showing a live-updating signal trace. Represents aggregate system activity as a continuous waveform.

**Oblivion reference:** UI_16-19 (layered area chart with teal/orange/cream fills, "UNKNOWN R: SIGNAL DATA" header, "DECODE" button).

### 6.1 Container

**Dimensions:** 480x120px (world-space)
**Position:** `(-240, 520)` top-left corner -- centered below the ring, 80px gap from the ring bottom edge.
**Border radius:** 8px

**Glass material recipe:**
```css
background: rgba(255, 255, 255, 0.02);
backdrop-filter: blur(8px) saturate(110%);
border: 1px solid rgba(255, 255, 255, 0.04);
box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.02);
```

### 6.2 Content Layout

```
+--------------------------------------------------+
|  SIGNAL DATA        R: AGGREGATE     [DECODE]    |  <- header, 24px tall
|  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|  <- waveform, 72px tall
|  MORSE CODE 2x  X1 177   T+00:42:18             |  <- footer, 16px tall
+--------------------------------------------------+
```

**Padding:** 12px all sides.

**Header row (top 24px):**
- "SIGNAL DATA":
  - Font: Berkeley Mono, 14px, weight 600, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.30)`
- "R: AGGREGATE":
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.06em, uppercase
  - Color: `rgba(14, 165, 233, 0.4)` (teal)
- "[DECODE]" button:
  - 56x20px, border-radius 3px
  - Background: `rgba(224, 82, 0, 0.15)`
  - Border: `1px solid rgba(224, 82, 0, 0.3)`
  - Font: Berkeley Mono, 11px, weight 600, tracking 0.12em, uppercase
  - Color: `#E05200`

**Waveform area (middle 72px):**

Implementation: HTML5 `<canvas>` element, 456x72px.

Three layered waveforms drawn as filled area charts:
1. **Background wave (teal):**
   - Fill: `rgba(14, 165, 233, 0.08)`
   - Stroke: `rgba(14, 165, 233, 0.15)`, width 1px
   - Amplitude: 20-50% of canvas height
   - Frequency: ~3 complete cycles across the width
2. **Mid wave (ember):**
   - Fill: `rgba(224, 82, 0, 0.06)`
   - Stroke: `rgba(224, 82, 0, 0.12)`, width 1px
   - Amplitude: 10-30% of canvas height
   - Frequency: ~5 cycles across the width
3. **Foreground wave (white):**
   - Fill: `rgba(255, 255, 255, 0.03)`
   - Stroke: `rgba(255, 255, 255, 0.10)`, width 0.5px
   - Amplitude: 5-15% of canvas height
   - Frequency: ~8 cycles (high-frequency noise overlay)

**Animation:** The waveform scrolls continuously left-to-right using `requestAnimationFrame`. Each frame shifts all data points 1px to the left and generates a new random point on the right edge. The scroll speed creates a ~6-second traverse of the full width.

**Pausing:** During active pan (detected via `data-panning="true"` on ancestor), the `rAF` loop pauses to conserve GPU.

**Footer row (bottom 16px):**
- "MORSE CODE 2x X1 177":
  - Font: Berkeley Mono, 11px, weight 400, tracking 0.06em, uppercase
  - Color: `rgba(255, 255, 255, 0.12)`
- "T+00:42:18":
  - Font: Berkeley Mono, 11px, weight 400, tracking 0.06em
  - Color: `rgba(255, 255, 255, 0.15)`
  - Right-aligned

### 6.3 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible. Waveform animates. |
| Z2 | Visible. Canvas detail increases (stroke widths +50%). |
| Z3 | Fully visible. |

---

## 7. Activity Ticker

**Purpose:** A scrolling vertical event log positioned to the right of the signal monitor, showing timestamped system events in receipt-stamp format. This is the "mission log" that makes the space feel alive.

**Oblivion reference:** UI_13 (3-letter code table with colored underlines: GSW 249, PXP 3408), UI_14 ("DATUM FEED XRS" labels).

### 7.1 Container

**Dimensions:** 260x240px (world-space)
**Position:** `(260, 490)` top-left corner -- to the right of the signal monitor, slightly higher to create visual rhythm.
**Border radius:** 8px

**Glass material recipe:** Same as signal monitor (Section 6.1).

### 7.2 Content Layout

```
+--------------------------------------+
|  ACTIVITY LOG          T-49          |  <- header
|  ====================================|  <- thin separator
|  00:42:15  AGENT BUILDER  BUILD OK   |  <- event row
|  00:42:12  TARVA CHAT     MSG RECV   |
|  00:41:58  PROJECT ROOM   SYNC       |
|  00:41:45  TARVACOR       HEARTBEAT  |
|  00:41:30  SYSTEM         TELEMETRY  |
|  00:41:18  AGENT BUILDER  DEPLOY     |
+--------------------------------------+
```

**Padding:** 12px all sides.

**Header row (top 24px):**
- "ACTIVITY LOG":
  - Font: Berkeley Mono, 14px, weight 600, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.30)`
- "T-49" (Oblivion tech designator):
  - Font: Berkeley Mono, 14px, weight 500, tracking 0.08em, uppercase
  - Color: `rgba(224, 82, 0, 0.4)`

**Separator:** 1px, `rgba(255, 255, 255, 0.06)`, 4px below header.

**Event rows (remaining height, scrollable):**

Each row is 28px tall.

- Timestamp:
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.02em
  - Color: `rgba(255, 255, 255, 0.20)`
  - Width: 60px (fixed)
- Source:
  - Font: Berkeley Mono, 12px, weight 500, tracking 0.04em, uppercase
  - Color: `rgba(255, 255, 255, 0.38)`
  - Width: 108px (fixed, truncated with ellipsis)
- Event type:
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.06em, uppercase
  - Color varies by type:
    - OK/BUILD/DEPLOY: `rgba(34, 197, 94, 0.5)` (green)
    - MSG/SYNC/HEARTBEAT: `rgba(14, 165, 233, 0.4)` (teal)
    - ERROR/FAIL: `rgba(239, 68, 68, 0.5)` (red)
    - TELEMETRY: `rgba(255, 255, 255, 0.20)` (neutral)

**Status underline per row:** A 2px-tall colored bar beneath each event row, spanning the full row width.
- Color: matches event type color but at 15% opacity
- This mimics the teal separator bars in UI_13.

### 7.3 Animation

**Scroll behavior:** New events appear at the top with a slide-down animation, pushing older events down. When the container is full, bottom events fade out and are removed.

- New event entry:
  - From: `opacity: 0, translateY: -12px`
  - To: `opacity: 1, translateY: 0`
  - Duration: 300ms
  - Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

- Bottom event exit:
  - From: `opacity: 1`
  - To: `opacity: 0`
  - Duration: 200ms
  - Easing: `ease-out`

**Event frequency:** A new mock event appears every 4-8 seconds (random interval).

### 7.4 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible. Events scroll. |
| Z2 | Visible. Font sizes increase to 14px for improved readability. |
| Z3 | Fully visible. |

---

## 8. Radial Gauge Cluster

**Purpose:** A set of 3 concentric arc gauges positioned above the capsule ring, representing aggregate system health metrics. Inspired by the Oblivion diamond gauge and the concentric ring gauges from UI_04 and UI_09.

**Oblivion reference:** UI_04 (diamond gauge with concentric dotted circles, 2-column data table), UI_09 (concentric ring gauge with tick marks).

### 8.1 Container

**Dimensions:** 280x200px (world-space)
**Position:** `(-140, -600)` top-left corner -- centered above the ring, 60px gap from the ring top edge.
**Border radius:** none (raw SVG, no card container)

### 8.2 Gauge Construction (SVG)

Three concentric semi-circular arcs (180-degree arcs, opening downward).

| Gauge | Center Y offset | Radius | Track Stroke | Fill Stroke | Angle Range | Metric |
|-------|----------------|--------|-------------|-------------|-------------|--------|
| Outer | 140 | 120 | `rgba(255,255,255,0.04)` | `rgba(34, 197, 94, 0.5)` (green) | 0-167deg (93%) | System Health |
| Middle | 140 | 90 | `rgba(255,255,255,0.04)` | `rgba(14, 165, 233, 0.5)` (teal) | 0-135deg (75%) | Data Throughput |
| Inner | 140 | 60 | `rgba(255,255,255,0.04)` | `rgba(224, 82, 0, 0.5)` (ember) | 0-108deg (60%) | Agent Utilization |

**All gauges:**
- Track stroke width: 4px
- Fill stroke width: 4px
- Stroke-linecap: round
- Track opacity: 0.04
- Fill uses `stroke-dasharray` and `stroke-dashoffset` to show partial fill.

**Tick marks:** 18 tick marks evenly spaced along each gauge's 180-degree arc (every 10 degrees).
- Length: 6px (extending outward from the arc)
- Stroke: `rgba(255, 255, 255, 0.06)`
- Width: 0.5px

### 8.3 Gauge Labels

Positioned below the gauge cluster.

```
  HEALTH 93%    THROUGHPUT 75%    AGENTS 60%
```

- Font: Berkeley Mono, 12px, weight 400, tracking 0.08em, uppercase
- Colors:
  - "HEALTH": `rgba(34, 197, 94, 0.4)`, "93%": `rgba(34, 197, 94, 0.6)`
  - "THROUGHPUT": `rgba(14, 165, 233, 0.4)`, "75%": `rgba(14, 165, 233, 0.6)`
  - "AGENTS": `rgba(224, 82, 0, 0.4)`, "60%": `rgba(224, 82, 0, 0.6)`

### 8.4 Animation

**Gauge fill animation (on mount):**
- Each gauge's `stroke-dashoffset` animates from 0% fill to its target fill.
- Duration: 1200ms
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`
- Stagger: 200ms between gauges (outer first, inner last)

**Ambient tick:** Every 8 seconds, the fill percentages subtly fluctuate by +-2% over 600ms, simulating live data updates.

### 8.5 Glow Treatment

Each gauge arc has a subtle glow matching its fill color:
```css
filter: drop-shadow(0 0 4px var(--gauge-color-at-15-percent));
```
For example, the green outer gauge:
```css
filter: drop-shadow(0 0 4px rgba(34, 197, 94, 0.15));
```

### 8.6 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Visible. Gauges animate in on first appearance. |
| Z2 | Visible with tick marks. Labels visible. |
| Z3 | Fully detailed. |

---

## 9. Inter-District Connection Paths

**Purpose:** Animated SVG curves connecting each capsule to its neighbors and to the hub center, showing data flow between districts. These "living wires" are inspired by the circuit traces and signal flows in Oblivion's interface graphics.

**Oblivion reference:** UI_02 (circuit-board diagram in sidebar), UI_16-19 (signal data flows).

### 9.1 Path Construction

**SVG container:** Same 2400x2400 container as the range rings (Section 1.1), rendered between the range rings and the capsule ring in z-order.

**Hub-to-capsule connections (6 paths):**
Each path is a straight line from the hub center `(0, 0)` to each capsule center (radius 300px at the capsule's angle).

- Stroke: `rgba(255, 255, 255, 0.03)`
- Stroke width: 1px
- Dash pattern: `4 12`

**Capsule-to-capsule connections (6 paths -- connecting adjacent capsules):**
Each path is a quadratic Bezier curve connecting two adjacent capsule centers, with the control point pulled 40px outward from the ring (radius 340px at the midpoint angle).

- Stroke: `rgba(255, 255, 255, 0.02)`
- Stroke width: 0.5px
- Dash pattern: `2 8`

### 9.2 Animated Data Particles

Small circles that travel along the connection paths, simulating data packets flowing between districts.

**Particle spec:**
- Size: 4px circle
- Fill: `rgba(14, 165, 233, 0.4)` (teal) for hub-to-capsule paths
- Fill: `rgba(224, 82, 0, 0.3)` (ember) for capsule-to-capsule paths
- Glow: `filter: drop-shadow(0 0 3px rgba(14, 165, 233, 0.3))` (teal variant)

**Animation:** Each particle uses SVG `<animateMotion>` along its parent `<path>`.
- Duration: 3-5 seconds per traverse (randomized per particle)
- Timing: linear
- Repeat: infinite
- Fill: `opacity` animates from 0 -> 0.4 -> 0.4 -> 0 (fade in at start, fade out at end)

**Particle count:** 1-2 particles per path at any time. Stagger their start times randomly.

### 9.3 Active Path Highlighting

When a capsule is hovered, its connections brighten:
- Hub-to-capsule stroke: `rgba(14, 165, 233, 0.12)` (4x brighter)
- Adjacent capsule strokes: `rgba(224, 82, 0, 0.08)` (4x brighter)
- Particle glow intensity doubles
- Transition: 200ms, `ease-out`

### 9.4 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Hub-to-capsule paths visible. Capsule-to-capsule paths visible. Particles active. |
| Z2 | All paths visible at increased opacity (+50%). Particles larger (6px). |
| Z3 | Paths visible but begin to feel "background" as station content dominates. |

---

## 10. Deep-Zoom Discovery Elements

**Purpose:** Hidden details that reward zooming in past Z2. These are the "Easter eggs" of the spatial canvas -- circuit traces, inscriptions, data stamps, and micro-typography that are invisible at normal zoom but reveal rich detail when a user explores closely. This is the design layer that creates the "wow, there's always more" quality.

**Oblivion reference:** UI_14 (dense micro-labels like "DATUM FEED XRS", ".CAM VIEWER", "WAVEFORM"), UI_03 (node labels "NODE X2", "NODE X6").

### 10.1 Circuit Trace Field

**Position:** A 600x400px area centered at `(0, 700)` -- below the signal monitor and activity ticker.

**Construction:** SVG with procedurally-placed circuit traces:
- 15-20 horizontal and vertical line segments, varying lengths (20-120px)
- Right-angle turns only (Manhattan routing)
- Line stroke: `rgba(255, 255, 255, 0.025)`
- Line stroke-width: 0.5px
- Junction nodes: 3px circles at line intersections, stroke `rgba(14, 165, 233, 0.06)`, fill none
- Active nodes: 2 of the junction nodes are "powered" -- fill `rgba(14, 165, 233, 0.15)` with a slow pulse animation (4s cycle, opacity 0.1 -> 0.2 -> 0.1)
- Component blocks: 4-5 small rectangles (8x4px) placed on traces, fill `rgba(255, 255, 255, 0.025)`, representing circuit components

### 10.2 Micro-Inscriptions

Extremely small text scattered around the canvas, only legible at Z2-Z3 zoom. These are "metadata stamps" that reinforce the Oblivion technical-surface aesthetic.

| ID | Position (x, y) | Content | Font Size (world-space) |
|----|-----------------|---------|------------------------|
| INS-01 | (-380, 480) | `DATUM FEED XRS` | 10px |
| INS-02 | (380, 480) | `.CAM VIEWER` | 10px |
| INS-03 | (-380, -480) | `NODE X2 // ACTIVE` | 10px |
| INS-04 | (380, -480) | `NODE X7 // STANDBY` | 10px |
| INS-05 | (0, 640) | `WAVEFORM BASELINE REF T-0` | 10px |
| INS-06 | (-600, 0) | `SECTOR 042 // WEST ARM` | 10px |
| INS-07 | (600, 0) | `SECTOR 084 // EAST ARM` | 10px |
| INS-08 | (0, -640) | `CALIBRATION MARK K7-226` | 10px |
| INS-09 | (-500, -300) | `DSP MTX 4.2.1 // REV 7F` | 8px |
| INS-10 | (500, 300) | `INTLK SYS 0xA3 // NORM` | 8px |
| INS-11 | (-200, 800) | `MFG: TARVA SYSTEMS LLC` | 8px |
| INS-12 | (200, -800) | `CAL DATE: 2026-02-27` | 8px |

**Typography (all inscriptions):**
- Font: Berkeley Mono, size as specified, weight 400, tracking 0.14em, uppercase
- Color: `rgba(255, 255, 255, 0.05)` (barely visible even when zoomed in -- ghostly)

### 10.3 Data Stamp Cluster

A cluster of technical data values arranged in a table-like grid, placed in the SW quadrant of the canvas. Only visible at Z2+.

**Position:** `(-700, 500)` top-left corner.
**Dimensions:** 200x160px (world-space)

```
  GSW   249
  PXP   3408
  TRZ   2208
  MKL   0017
  VXR   8841
  LPN   0442
```

- Code column:
  - Font: Berkeley Mono, 12px, weight 600, tracking 0.10em, uppercase
  - Color: `rgba(255, 255, 255, 0.08)`
- Value column:
  - Font: Berkeley Mono, 12px, weight 400, tracking 0.04em, tabular-nums
  - Color: `rgba(14, 165, 233, 0.12)` (teal, very faint)
- Row height: 22px
- Separator between columns: 16px gap

### 10.4 Transport Controls

A small media-transport-style control strip placed near the signal monitor. Purely decorative -- not interactive.

**Position:** `(-180, 650)` top-left corner.
**Dimensions:** 160x24px

```
  |<   <   >   >|
```

- 4 symbols spaced 32px apart, centered in the strip
- Font: Berkeley Mono, 14px, weight 400
- Color: `rgba(255, 255, 255, 0.06)`
- Active "play" button (`>`) highlighted: `rgba(224, 82, 0, 0.15)`

### 10.5 Zoom Visibility

| Level | Behavior |
|-------|----------|
| Z0 | Hidden |
| Z1 | Hidden (all deep-zoom elements are invisible at default zoom) |
| Z2 | Circuit traces fade in at 50% of their specified opacity. Inscriptions INS-01 through INS-08 become visible. Data stamp cluster appears. |
| Z3 | Everything at full specified opacity. INS-09 through INS-12 become visible. Transport controls appear. Junction node pulses active. |

---

## Implementation Component Map

Each section above maps to a React component. Here is the suggested file structure:

```
src/components/ambient/
  RangeRings.tsx           -- Section 1.1-1.2 (SVG range rings + compass rose)
  RadarSweep.tsx           -- Section 1.3 (animated sweep line)
  OrbitalReadouts.tsx      -- Section 2 (12 data readout blocks)
  CoordinateGrid.tsx       -- Section 3 (crosshair, registration marks, axis lines)
  SignalPulseMonitor.tsx   -- Section 6 (waveform canvas)
  ActivityTicker.tsx       -- Section 7 (scrolling event log)
  RadialGaugeCluster.tsx   -- Section 8 (concentric arc gauges)
  ConnectionPaths.tsx      -- Section 9 (inter-district SVG curves + particles)
  CircuitTraceField.tsx    -- Section 10.1 (deep-zoom circuit traces)
  MicroInscriptions.tsx    -- Section 10.2-10.4 (text stamps, data table, transport controls)

src/components/panels/
  SystemStatusPanel.tsx    -- Section 4 (left sidebar)
  FeedPanel.tsx            -- Section 5 (right sidebar)
```

### Rendering Order (z-index, back to front within `<SpatialCanvas>`)

1. DotGrid (existing, already rendered)
2. `RangeRings` + `CoordinateGrid` (behind everything, structural)
3. `ConnectionPaths` (between rings and capsules)
4. `RadarSweep` (rotating over the rings)
5. `CircuitTraceField` + `MicroInscriptions` (deep-zoom only)
6. `SystemStatusPanel` + `FeedPanel` (flanking the ring)
7. `OrbitalReadouts` (floating text around the ring perimeter)
8. `RadialGaugeCluster` (above the ring)
9. `SignalPulseMonitor` + `ActivityTicker` (below the ring)
10. `MorphOrchestrator` (existing -- capsule ring + district shells, on top)

### Performance Considerations

1. **All new ambient elements must be paused during pan/zoom.** Use the existing `data-panning` attribute on the ancestor `<div>` to conditionally pause CSS animations and `rAF` loops. Apply:
   ```css
   [data-panning="true"] .ambient-animated {
     animation-play-state: paused;
   }
   ```

2. **SVG elements should use `will-change: auto` (not `transform`)** since they are not individually animated via transforms -- the parent `SpatialCanvas` handles all transform movement.

3. **The Signal Pulse Monitor's `<canvas>` must pause its `rAF` loop** when `data-panning="true"` or when the element is culled by `ViewportCuller`.

4. **Deep-zoom elements (Section 10) should be wrapped in `ViewportCuller`** components that only render when the element is within the visible viewport bounds, to avoid DOM cost at Z0-Z1.

5. **Total new DOM nodes budget:** Aim for fewer than 200 new DOM elements across all 12 components. SVG paths are efficient. Avoid creating individual `<div>` elements for decorative lines when SVG `<line>` or `<path>` elements within a single SVG container will suffice.

6. **Backdrop-filter restriction:** Only the two sidebar panels (Sections 4, 5) use `backdrop-filter`. All other elements use opaque or transparent backgrounds. During pan, sidebars should drop to `backdrop-filter: none` with a solid fallback background of `rgba(15, 22, 31, 0.9)`.

---

## Integration Checkpoint

After all elements are implemented, the Launch page at Z1 (default zoom 0.5) should show:

1. The **existing capsule ring** (6 capsules + hub center glyph) -- unchanged
2. **Range rings and compass rose** visible as subtle concentric circles with tick marks and cardinal labels
3. **Radar sweep line** rotating slowly clockwise
4. **12 orbital readouts** arranged around the R3 ring in teal text
5. **Corner registration marks** framing the capsule ring
6. **System status sidebar** (left) showing ONLINE status, uptime, district grid, resource bars
7. **Feed sidebar** (right) showing FEEDS header, channel tabs, sensor readouts
8. **Signal pulse monitor** (below ring) with scrolling waveform
9. **Activity ticker** (below-right) with scrolling event log
10. **Radial gauge cluster** (above ring) with three arc gauges
11. **Inter-district connection paths** with flowing data particles
12. **Hub center crosshair** behind the Tarva star glyph

At Z0, all decorative elements disappear, leaving only the capsule ring beacons.
At Z2-Z3, deep-zoom elements (circuit traces, inscriptions, data stamps) fade into view.

The overall impression should be: a dark, living instrument surface -- dense with technical readouts but never noisy, every element ghostly and ambient until the user focuses on it. The Oblivion light table brought to life as a mission-control interface for the Tarva platform.
