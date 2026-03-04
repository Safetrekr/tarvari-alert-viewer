# Tarva Launch -- Visual Enrichment Plan v1.0

**Date:** 2026-02-27
**Authors:** world-class-ui-designer + collaborators
**Context:** Post-WS-1.1/1.2 enrichment layer. All elements are ambient (non-interactive, `pointer-events: none`) unless explicitly noted. They exist to transform the functional ZUI canvas into a living, breathing Oblivion-class mission control environment.

**Prerequisite state:** Capsule ring (840x840, 6 capsules at 300px radius), hub center glyph (28px Tarva star), dot grid (48px spacing), particle field (18 embers), film grain, connector lines, HUD overlay, constellation view at Z0.

---

## Coordinate System Reference

All positions use the SpatialCanvas world-space coordinate system:
- **Origin (0, 0):** Center of the capsule ring (hub center glyph)
- **Ring radius:** 300px from origin to capsule centers
- **Ring container:** 840x840px, positioned at (-420, -420) top-left
- **Capsule size:** 192x228px at Z1

Capsule center positions (relative to world origin):
| Index | District      | Angle | X     | Y     |
|-------|---------------|-------|-------|-------|
| 0     | Agent Builder | -90   | 0     | -300  |
| 1     | Tarva Chat    | -30   | +260  | -150  |
| 2     | TarvaCORE     | +30   | +260  | +150  |
| 3     | Project Room  | +90   | 0     | +300  |
| 4     | Tarva ERP     | +150  | -260  | +150  |
| 5     | TarvaCODE     | +210  | -260  | -150  |

Zoom level thresholds (from `src/lib/constants.ts`):
| Level | Enter    | Exit     | Default |
|-------|----------|----------|---------|
| Z0    | < 0.27   | >= 0.30  | --      |
| Z1    | >= 0.30  | < 0.72   | 0.50    |
| Z2    | >= 0.80  | < 1.35   | --      |
| Z3    | >= 1.50  | --       | --      |

---

## Element 1: Orbital Data Readouts

**Concept:** Small blocks of monospace text scattered around the ring perimeter at ~380-440px from center. They read like machine-generated telemetry labels -- timestamps, hex identifiers, coordinate tags, status codes. In Oblivion, these fragments appear at the edges of every display surface, grounding the UI in a sense of active instrumentation.

### 1.1 Layout

Place 8 readout blocks at angular positions that fall *between* capsules (at 30-degree offsets from capsule positions, so at 15deg intervals from the capsule ring):

| ID        | Angle (deg) | Radius (px) | World X | World Y | Content Template                    |
|-----------|-------------|-------------|---------|---------|-------------------------------------|
| ORB-NNE   | -60         | 400         | +346    | -200    | `SYS.UPTIME 99.7%`                 |
| ORB-ENE   | 0           | 380         | +380    | 0       | `NODE.ACTIVE 06`                   |
| ORB-ESE   | +60         | 420         | +364    | +210    | `LAT.P95 142ms`                    |
| ORB-SSE   | +120        | 390         | +195    | +338    | `TRACE 7F2A.B91C`                  |
| ORB-SSW   | +180        | 400         | -400    | 0       | `EPOCH 1740672138`                 |
| ORB-WSW   | +210        | 410         | -355    | -205    | `QUEUE.DEPTH 03`                   |
| ORB-WNW   | +240        | 380         | -190    | -329    | `PKG.HASH A3F2`                    |
| ORB-NNW   | +300        | 420         | +210    | -364    | `ALERT.COUNT 00`                   |

### 1.2 Visual Spec

```
+-----------------------------+
|  SYS.UPTIME  99.7%         |   <-- 2 lines, label + value
|  2026-02-27T15:42:18Z       |   <-- timestamp below
+-----------------------------+
```

| Property            | Value                                          |
|---------------------|------------------------------------------------|
| Font                | `var(--font-mono)` (Geist Mono)                |
| Label font-size     | 9px                                            |
| Value font-size     | 10px                                           |
| Font weight         | 400 (label), 500 (value)                       |
| Letter-spacing      | 0.12em (label), 0.08em (value)                 |
| Text transform      | uppercase                                      |
| Label color         | `var(--color-text-ghost)` rgba(255,255,255,0.15)|
| Value color         | `var(--color-text-tertiary)` #55667a            |
| Timestamp color     | rgba(255, 255, 255, 0.08)                      |
| Line height         | 1.4                                            |
| Text align          | Left (NE/E/SE quadrant), Right (NW/W/SW)       |
| Container width     | auto (content-fit)                             |
| Container padding   | 0 (no box, just floating text)                 |
| Background          | none (bare text on void)                       |
| Tabular numerics    | `font-variant-numeric: tabular-nums`           |

### 1.3 Animation

Each readout has a subtle "data refresh" cycle:

```css
@keyframes readout-refresh {
  0%, 90%, 100% { opacity: var(--readout-opacity, 0.5); }
  93% { opacity: 0.1; }
  96% { opacity: 0.7; }
}
```

| Property           | Value                                    |
|--------------------|------------------------------------------|
| Animation          | `readout-refresh 15s ease infinite`      |
| Stagger per block  | +1.8s per index (via `animation-delay`)  |
| Reduced motion     | `animation: none; opacity: 0.4`         |
| Pan optimization   | Fade to `opacity: 0.15` during pan       |

### 1.4 Zoom Visibility

| Level | Behavior                                              |
|-------|-------------------------------------------------------|
| Z0    | Hidden (`opacity: 0`, no GPU cost via `display: none`)|
| Z1    | Visible at base opacity 0.5 (default landing)        |
| Z2    | Visible, opacity increases to 0.7                    |
| Z3    | Fully visible at 1.0, additional detail lines appear  |

### 1.5 Data Source

Values are pulled from the `useDistrictsStore` telemetry state. Updates on the narration cycle (WS-3.7) or telemetry poll (WS-1.5). Fallback: static placeholder strings.

---

## Element 2: Inter-District Connection Paths

**Concept:** Thin animated SVG curves connecting adjacent capsules in the ring, showing conceptual data flow between districts. Oblivion uses thin dashed lines between instrument clusters; here they form a subtle hexagonal web inside the ring.

### 2.1 Topology

6 connections forming the ring edge graph (adjacent capsules only):

| Path ID | From (index) | To (index) | Curve Direction |
|---------|-------------|------------|-----------------|
| LINK-01 | 0           | 1          | CW arc outward  |
| LINK-12 | 1           | 2          | CW arc outward  |
| LINK-23 | 2           | 3          | CW arc outward  |
| LINK-34 | 3           | 4          | CW arc outward  |
| LINK-45 | 4           | 5          | CW arc outward  |
| LINK-50 | 5           | 0          | CW arc outward  |

Plus 2 cross-connections for visual depth:

| Path ID  | From (index) | To (index) | Notes              |
|----------|-------------|------------|---------------------|
| XLINK-03 | 0           | 3          | Vertical through hub|
| XLINK-14 | 1           | 4          | Diagonal            |

### 2.2 Path Geometry

Each connection is an SVG quadratic Bezier curve. Start and end points are at the capsule border edges (not centers). The control point pushes outward from the ring center by 40px to create a gentle arc:

```
M startX,startY Q controlX,controlY endX,endY
```

Control point formula for adjacent connections:
```
midX = (start.x + end.x) / 2
midY = (start.y + end.y) / 2
// Push control point outward from center
angle = atan2(midY, midX)
controlX = midX + cos(angle) * 40
controlY = midY + sin(angle) * 40
```

Cross-connections pass through the hub center with a slight offset:
```
controlX = 0 + random_offset(-20, 20)
controlY = 0 + random_offset(-20, 20)
```

### 2.3 Visual Spec

| Property            | Value                                          |
|---------------------|------------------------------------------------|
| Stroke color        | `rgba(39, 115, 137, 0.12)` (teal at 12%)      |
| Stroke width        | 1px                                            |
| Stroke dasharray    | `4 8` (4px dash, 8px gap)                      |
| Fill                | none                                           |
| Stroke linecap      | round                                          |
| Container           | SVG overlaid on the ring container, 840x840    |
| z-index             | 1 (below capsules at z-index 2)                |

Cross-connections use a different treatment:
| Property            | Value                                          |
|---------------------|------------------------------------------------|
| Stroke color        | `rgba(39, 115, 137, 0.06)` (teal at 6%)       |
| Stroke dasharray    | `2 12` (shorter dashes, wider gaps)            |
| Stroke width        | 0.5px                                          |

### 2.4 Animation: Flowing Dash

The dash pattern animates along the path to create the illusion of data flowing between districts:

```css
@keyframes flow-dash {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -24; }
  /* 24 = dasharray period (4 + 8) * 2 for smooth loop */
}
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Animation          | `flow-dash 8s linear infinite`                 |
| Direction          | Normal (CW flow for ring, varied for cross)    |
| Stagger            | +1.3s per path index                           |
| Reduced motion     | `animation: none` (static dashes remain)       |
| Pan optimization   | Pause animation, reduce opacity to 0.04        |

### 2.5 Interaction with Morph

When a capsule is selected (morph begins), all connection paths fade to `opacity: 0` over 200ms. The existing `ConnectorLines` component (capsule-to-detail-panel) replaces them. On morph reverse, connection paths fade back in over 300ms after the ring settles.

### 2.6 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden                                               |
| Z1    | Visible at base opacity                              |
| Z2    | Fade to opacity 0.06 (paths become background noise) |
| Z3    | Hidden                                               |

---

## Element 3: System Pulse Monitor

**Concept:** An ECG-style waveform visualization positioned below the capsule ring. It renders a continuous SVG polyline that updates based on aggregate system health, creating a hospital-monitor heartbeat effect. This is the most iconic "mission control" element.

### 3.1 Position

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| World position     | Center X: 0, Top Y: +380 (below ring bottom)  |
| Container size     | 320px wide, 48px tall                          |
| Anchor             | Centered horizontally below the ring           |
| World coords       | left: -160, top: +380                          |

### 3.2 Visual Spec

The waveform container has a thin border and minimal glass treatment:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Background           | `rgba(255, 255, 255, 0.015)`                |
| Border               | `1px solid rgba(255, 255, 255, 0.04)`        |
| Border radius        | 6px                                          |
| Backdrop blur        | 4px                                          |
| Padding              | 8px horizontal, 4px vertical                 |
| Box-shadow           | `inset 0 1px 0 0 rgba(255,255,255,0.02)`    |

The waveform itself is an SVG polyline:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Stroke color (OK)    | `var(--color-teal)` #277389 at 0.6 opacity   |
| Stroke color (WARN)  | `var(--color-warning)` #eab308 at 0.6        |
| Stroke color (ERR)   | `var(--color-error)` #ef4444 at 0.6          |
| Stroke width         | 1.5px                                        |
| Fill                 | none                                         |
| Stroke linecap       | round                                        |
| Stroke linejoin      | round                                        |
| SVG viewBox          | `0 0 304 40`                                 |

Glow line (duplicate path behind the main stroke):

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Stroke color         | Same as main, at 0.15 opacity                |
| Stroke width         | 4px                                          |
| Filter               | `blur(3px)`                                  |

### 3.3 Waveform Shape

The waveform is a repeating ECG-like pattern. Each "beat" spans 76px horizontally:

```
Baseline (Y=20) for 30px
Sharp peak up to Y=6 over 4px
Drop to Y=28 over 4px
Return to baseline over 6px
Baseline for 16px
Small bump to Y=16 over 4px (T-wave)
Return to baseline over 4px
Baseline for 8px
[repeat]
```

SVG path for one beat (relative to beat start):
```
L 30,20 L 34,6 L 38,28 L 44,20 L 60,20 L 64,16 L 68,20 L 76,20
```

4 beats fill the 304px viewBox width.

### 3.4 Animation

The waveform scrolls left continuously, creating the illusion of a live signal:

```css
@keyframes pulse-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-76px); }
  /* One beat width for seamless loop */
}
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Animation          | `pulse-scroll 2s linear infinite`              |
| Clip               | `overflow: hidden` on container clips the scroll|
| SVG width          | 380px (304px + 76px buffer for seamless tile)  |
| Reduced motion     | Static waveform at midpoint, no scroll         |
| Pan optimization   | Pause animation                                |

### 3.5 Label

A tiny label sits above the waveform:

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Text               | `SYS.PULSE`                                   |
| Font               | `var(--font-mono)`, 8px, weight 500            |
| Letter-spacing     | 0.14em                                         |
| Transform          | uppercase                                      |
| Color              | `var(--color-text-ghost)` rgba(255,255,255,0.15)|
| Position           | 4px above the container top-left               |

### 3.6 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden                                               |
| Z1    | Visible, full animation                              |
| Z2    | Visible, slightly brighter (opacity +0.1)            |
| Z3    | Hidden (too far from hub)                            |

---

## Element 4: Coordinate Grid Labels + Registration Marks

**Concept:** Machine-vision overlay elements that ground the spatial canvas in a sense of measured precision. Crosshair registration marks at axis intersections, compass-direction labels, and subtle grid coordinates. These are the "frame lines" of a camera viewfinder or targeting system.

### 4.1 Axis Registration Marks (4 marks at compass points)

Placed at the ring perimeter on the cardinal axes:

| Mark ID | World Position | Description                    |
|---------|---------------|--------------------------------|
| REG-N   | (0, -460)     | Top axis, north of ring        |
| REG-E   | (+460, 0)     | Right axis, east of ring       |
| REG-S   | (0, +460)     | Bottom axis, south of ring     |
| REG-W   | (-460, 0)     | Left axis, west of ring        |

Each mark is a small crosshair SVG:

```svg
<!-- 16x16px crosshair -->
<svg width="16" height="16" viewBox="0 0 16 16">
  <line x1="8" y1="0" x2="8" y2="5" stroke="currentColor" stroke-width="0.5" />
  <line x1="8" y1="11" x2="8" y2="16" stroke="currentColor" stroke-width="0.5" />
  <line x1="0" y1="8" x2="5" y2="8" stroke="currentColor" stroke-width="0.5" />
  <line x1="11" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="0.5" />
  <!-- center dot -->
  <circle cx="8" cy="8" r="1" fill="currentColor" />
</svg>
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Stroke color       | `rgba(255, 255, 255, 0.08)`                   |
| Center dot fill    | `rgba(255, 255, 255, 0.12)`                   |
| Size               | 16x16px                                        |

### 4.2 Compass Labels

Adjacent to each registration mark:

| Label | Position       | Text        | Alignment  |
|-------|---------------|-------------|------------|
| N     | (0, -478)     | `N.0420`    | Center     |
| E     | (+478, 0)     | `E.0420`    | Left       |
| S     | (0, +478)     | `S.0420`    | Center     |
| W     | (-478, 0)     | `W.0420`    | Right      |

The numbers reference the ring center coordinate in world-space (420 = half of 840, the ring container midpoint in pre-offset terms).

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Font               | `var(--font-mono)`, 8px, weight 400            |
| Letter-spacing     | 0.10em                                         |
| Color              | `rgba(255, 255, 255, 0.08)`                   |
| Transform          | uppercase                                      |

### 4.3 Corner Frame Lines

Machine-vision bracket marks at the corners of a 960x960px bounding box centered on the hub (the "operational perimeter"):

```
Top-left corner:
  Horizontal line: from (-480, -480) rightward 32px
  Vertical line: from (-480, -480) downward 32px

Top-right corner:
  Horizontal line: from (+480, -480) leftward 32px
  Vertical line: from (+480, -480) downward 32px

Bottom-left corner:
  Horizontal line: from (-480, +480) rightward 32px
  Vertical line: from (-480, +480) upward 32px

Bottom-right corner:
  Horizontal line: from (+480, +480) leftward 32px
  Vertical line: from (+480, +480) upward 32px
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Stroke color       | `rgba(255, 255, 255, 0.04)`                   |
| Stroke width       | 0.5px                                          |
| Line length        | 32px per arm                                   |

### 4.4 Tick Marks on Grid Axes

Small perpendicular tick marks every 96px (every 2 dot-grid cells) along the cardinal axes, within the operational perimeter (-480 to +480):

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Tick length         | 4px (perpendicular to axis)                   |
| Stroke color       | `rgba(255, 255, 255, 0.04)`                   |
| Stroke width       | 0.5px                                          |
| Count              | ~10 ticks per axis, 40 total                   |

### 4.5 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden                                               |
| Z1    | Corner frames + compass labels visible at 0.04-0.08 opacity |
| Z2    | All marks visible, opacity increases to 0.12         |
| Z3    | Full visibility, tick marks sharpen to 0.15 opacity  |

### 4.6 Animation

No continuous animation. On zoom level change, marks fade in/out over 300ms using `var(--ease-default)`.

---

## Element 5: Ambient Scan Line

**Concept:** A periodic horizontal sweep line that traverses the entire operational canvas from top to bottom, like a slow radar refresh. Very subtle -- barely perceptible. Creates a subliminal sense of the system "scanning" itself.

### 5.1 Visual Spec

The scan line is a full-width horizontal gradient stripe:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Width                | 100% of operational perimeter (960px)        |
| Height               | 1px (the scan line itself)                   |
| Gradient above       | 40px tall, `rgba(39,115,137, 0.03)` to transparent |
| Gradient below       | 8px tall, `rgba(39,115,137, 0.015)` to transparent  |
| Line color           | `rgba(39, 115, 137, 0.06)` (teal at 6%)     |
| Container            | 960x960px div at (-480, -480), overflow hidden|

The scan line is teal (not ember) to differentiate it from event-triggered scanlines on capsules (which are ember).

### 5.2 Animation

```css
@keyframes ambient-sweep {
  0% {
    transform: translateY(-60px);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  95% {
    opacity: 1;
  }
  100% {
    transform: translateY(960px);
    opacity: 0;
  }
}
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Animation          | `ambient-sweep 25s ease-in-out infinite`       |
| Delay              | 8s (offset from page load so it doesn't distract during arrival) |
| Reduced motion     | `display: none`                                |
| Pan optimization   | `animation-play-state: paused`                 |

### 5.3 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden                                               |
| Z1    | Visible (very subtle, the full sweep is barely noticed) |
| Z2    | Visible, same treatment                              |
| Z3    | Hidden (too zoomed in; the sweep would be off-screen) |

---

## Element 6: Activity Log Ticker

**Concept:** A horizontally scrolling ribbon of monospace text positioned below the system pulse monitor. Displays a continuous stream of system events in a telegraph/ticker-tape format. Like a news ticker but for mission control events.

### 6.1 Position

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| World position     | Center X: 0, Top Y: +448 (below pulse monitor)|
| Container size     | 480px wide, 20px tall                          |
| World coords       | left: -240, top: +448                          |

### 6.2 Visual Spec

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Font                 | `var(--font-mono)`, 9px, weight 400          |
| Letter-spacing       | 0.06em                                       |
| Color                | `var(--color-text-ghost)` rgba(255,255,255,0.15)|
| Text transform       | uppercase                                    |
| White-space          | nowrap                                       |
| Overflow             | hidden (clip at container edges)             |
| Background           | none                                         |
| Separator            | `//` between entries, at 0.08 opacity        |
| Mask                 | Linear gradient fade at left and right edges (32px each) |

### 6.3 Content Format

Each ticker entry follows this pattern:
```
[HH:MM] VERB.NOUN RESULT // [HH:MM] VERB.NOUN RESULT // ...
```

Examples:
```
14:32 HEALTH.CHECK NOMINAL // 14:31 AGENT.DEPLOY OK // 14:30 QUEUE.FLUSH 0ms // 14:28 BUILD.PASS #1247
```

Content sources:
- Narration cycle events (WS-3.7)
- Telemetry poll results (WS-1.5)
- Fallback: rotating set of 12 static entries

### 6.4 Animation

```css
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
  /* Content is duplicated so -50% loops seamlessly */
}
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Animation          | `ticker-scroll 60s linear infinite`            |
| Content width      | 2x visible (duplicate text for seamless loop)  |
| Reduced motion     | Static, show most recent 3 entries centered    |
| Pan optimization   | Pause animation                                |

### 6.5 Edge Masks

CSS mask for fade-out at container edges:

```css
.ticker-container {
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 32px,
    black calc(100% - 32px),
    transparent 100%
  );
}
```

### 6.6 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden                                               |
| Z1    | Visible, scrolling                                   |
| Z2    | Visible, slightly brighter                           |
| Z3    | Hidden                                               |

---

## Element 7: Radial Gauge Cluster

**Concept:** Concentric SVG ring gauges surrounding the hub center glyph. They show aggregate system metrics as arc segments with tick marks around the perimeter. This is the most distinctly Oblivion-inspired element -- GMUNK's control room interfaces feature these prominently.

### 7.1 Ring Layout

3 concentric gauge rings around the hub center, inside the capsule ring:

| Ring | Radius | Metric             | Arc Color                         |
|------|--------|--------------------|------------------------------------|
| Inner| 60px   | System Uptime %    | `var(--color-teal)` at 0.25 opacity|
| Mid  | 85px   | Active Throughput  | `var(--color-ember)` at 0.15 opacity|
| Outer| 110px  | Capacity Utilization| `rgba(255,255,255, 0.08)`         |

### 7.2 Visual Spec: Gauge Ring

Each ring is an SVG `<circle>` with `stroke-dasharray` and `stroke-dashoffset` to create a partial arc:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Stroke width         | 1px (inner, outer), 1.5px (mid)              |
| Fill                 | none                                         |
| Stroke linecap       | round                                        |
| Background track     | Same circle at 0.03 opacity (the "empty" portion)|
| Arc start angle      | -90deg (12 o'clock)                          |
| Arc direction        | Clockwise                                    |
| Transform origin     | center center                                |

Gauge value mapping:
```
circumference = 2 * PI * radius
dasharray = circumference
dashoffset = circumference * (1 - value/100)
```

### 7.3 Tick Marks

Small radial tick marks around the outer gauge ring perimeter:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Count                | 24 ticks (every 15 degrees)                  |
| Tick length          | 3px (standard), 5px (every 90 degrees)       |
| Stroke color         | `rgba(255, 255, 255, 0.06)`                  |
| Stroke width         | 0.5px                                        |
| Major tick color     | `rgba(255, 255, 255, 0.10)`                  |
| Radius (tick center) | 118px (just outside the outer gauge)          |

### 7.4 Data Readouts

Tiny numeric readouts at the 3 o'clock position of each gauge:

| Ring  | Readout Format | Position           |
|-------|---------------|--------------------|
| Inner | `99.7%`       | (68, 0) from center|
| Mid   | `847/s`       | (94, 0)            |
| Outer | `62%`         | (120, 0)           |

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Font                 | `var(--font-mono)`, 8px, weight 500          |
| Color                | Matches arc color at +0.15 opacity           |
| Letter-spacing       | 0.08em                                       |

### 7.5 Animation

The gauge arcs animate smoothly when values change:

```typescript
// motion/react spring for arc transitions
const gaugeSpring = {
  type: 'spring',
  stiffness: 80,
  damping: 20,
  mass: 0.8,
}
```

Continuous subtle rotation on the tick mark ring:

```css
@keyframes gauge-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

| Property           | Value                                          |
|--------------------|------------------------------------------------|
| Tick rotation      | `gauge-rotate 120s linear infinite`            |
| Direction          | Normal (very slow clockwise drift)             |
| Reduced motion     | `animation: none`                              |
| Pan optimization   | Pause rotation                                 |

### 7.6 Glass Material (Gauge Background)

A subtle circular glass disk behind the gauges, smaller than the inner capsule ring:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Radius               | 130px                                        |
| Background           | `rgba(255, 255, 255, 0.01)`                 |
| Border               | `1px solid rgba(255, 255, 255, 0.025)`       |
| Border radius        | 50% (circle)                                 |
| Backdrop blur        | 4px                                          |
| Box-shadow           | `inset 0 1px 0 0 rgba(255,255,255,0.015)`   |

### 7.7 Zoom Visibility

| Level | Behavior                                             |
|-------|------------------------------------------------------|
| Z0    | Hidden (hub collapses to beacon)                     |
| Z1    | Visible: gauge arcs + readouts, tick rotation active |
| Z2    | Visible, opacity increases, tick marks sharpen       |
| Z3    | Hidden (hub area is outside viewport at deep zoom)   |

### 7.8 Interaction with Hub Glyph

The radial gauges surround but never overlap the hub center glyph (64x64px, centered at origin). The inner gauge ring at 60px radius clears the glyph by 28px on each side.

When a capsule is selected (`hasSelection = true`), gauges dim to `opacity: 0.3` along with the hub glyph (matching existing behavior).

---

## Element 8: Deep-Zoom Micro-Details

**Concept:** Visual rewards for users who zoom in beyond Z1. These elements only appear at Z2 and Z3, creating a sense of depth and detail that rewards exploration. They are the "hidden textures" of the Oblivion control room.

### 8.1 Capsule Circuit Traces (Z2+)

Thin decorative line patterns on the capsule glass surface, appearing when zoomed into a district. They look like etched circuit board traces on glass.

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Pattern              | 3-4 L-shaped line segments per capsule face  |
| Stroke color         | `rgba(224, 82, 0, 0.04)` (ember at 4%)      |
| Stroke width         | 0.5px                                        |
| Stroke dasharray     | `2 4` (subtle dash)                          |
| Position             | Corners and edges of the capsule interior    |
| Visibility           | Z2+ only (opacity 0 below Z2, fade in 300ms)|

Example pattern for one capsule corner:
```svg
<path d="M 8,20 L 8,8 L 24,8" />      <!-- top-left L -->
<path d="M 184,20 L 184,8 L 168,8" />  <!-- top-right L -->
<path d="M 8,208 L 8,220 L 24,220" />  <!-- bottom-left L -->
```

### 8.2 Hex Grid Underlay (Z2+)

A finer hexagonal grid pattern that appears beneath the standard dot grid when zoomed in, creating a layered depth effect.

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Cell size            | 24px (half the dot grid spacing)             |
| Stroke color         | `rgba(39, 115, 137, 0.02)` (teal at 2%)     |
| Stroke width         | 0.5px                                        |
| Coverage             | 1200x1200px centered on origin               |
| Visibility           | Z2+ only, scales opacity with zoom           |

Opacity formula:
```
opacity = clamp((zoom - 0.8) / 0.7, 0, 0.04)
```

At zoom 0.8 (Z2 entry): opacity 0
At zoom 1.5 (Z3 entry): opacity 0.04

### 8.3 Data Inscriptions (Z3)

Ultra-fine text inscriptions that appear on glass surfaces when deeply zoomed. They look like manufacturing labels or version stamps etched into the glass.

Placed on the detail panel and station panels:

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Font                 | `var(--font-mono)`, 7px, weight 300          |
| Letter-spacing       | 0.16em                                       |
| Color                | `rgba(255, 255, 255, 0.04)`                 |
| Text transform       | uppercase                                    |
| Content examples     | `TARVA.LAUNCH.V1.2`, `PANEL.SERIAL.00A3F2`, `MFG.2026.02` |
| Position             | Bottom-right corner of panels, 8px inset     |
| Visibility           | Z3 only (opacity 0 below Z3, fade in 200ms) |

### 8.4 Particle Detail Enhancement (Z2+)

At Z2+, each ember particle gains a subtle "tail" -- a short trailing line in the direction of its velocity. This transforms the floating dots into micro-meteors.

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Tail length          | `2 * particle.size` px                       |
| Tail color           | Same as particle, at 50% of particle opacity |
| Tail stroke width    | `particle.size * 0.5` px                     |
| Direction            | Opposite of velocity vector                  |
| Visibility           | Z2+ only                                     |
| Implementation       | Canvas 2D lineTo() in ParticleField render   |

### 8.5 Capacitor Dots (Z2+)

Small static dots placed at the intersections of circuit traces (8.1) and connection paths (Element 2), creating the appearance of electronic components on a circuit board.

| Property             | Value                                        |
|----------------------|----------------------------------------------|
| Size                 | 2px radius                                   |
| Fill color           | `rgba(39, 115, 137, 0.10)` (teal at 10%)    |
| Glow                 | `0 0 4px rgba(39, 115, 137, 0.08)`           |
| Count                | 2-3 per capsule face, 12-18 total            |
| Visibility           | Z2+ only                                     |

### 8.6 Zoom Visibility Summary

| Sub-element          | Z0   | Z1   | Z2   | Z3   |
|----------------------|------|------|------|------|
| Circuit traces       | --   | --   | 0.04 | 0.08 |
| Hex grid underlay    | --   | --   | 0.02 | 0.04 |
| Data inscriptions    | --   | --   | --   | 0.04 |
| Particle tails       | --   | --   | yes  | yes  |
| Capacitor dots       | --   | --   | 0.10 | 0.15 |

---

## Implementation Architecture

### Component Hierarchy

All enrichment elements mount as children of `SpatialCanvas` in the launch page, wrapped in a single container:

```tsx
{/* Visual enrichment layer -- ambient, non-interactive */}
<div
  className="absolute pointer-events-none"
  style={{
    left: -480,
    top: -480,
    width: 960,
    height: 960,
  }}
  aria-hidden="true"
  data-panning={isPanActive ? 'true' : 'false'}
>
  <CoordinateGrid />         {/* Element 4 */}
  <AmbientSweepLine />       {/* Element 5 */}
  <InterDistrictPaths />     {/* Element 2 */}
</div>

{/* Elements that relate to the ring (inside 840x840) -- placed in CapsuleRing children */}
<RadialGaugeCluster />       {/* Element 7 */}
<OrbitalReadouts />          {/* Element 1 */}

{/* Elements below the ring */}
<SystemPulseMonitor />       {/* Element 3 */}
<ActivityLogTicker />        {/* Element 6 */}

{/* Deep-zoom details are embedded in existing components */}
{/* - Circuit traces: inside DistrictCapsule */}
{/* - Hex grid: alongside DotGrid */}
{/* - Data inscriptions: inside station panels */}
{/* - Particle tails: inside ParticleField */}
{/* - Capacitor dots: inside InterDistrictPaths */}
```

### New Files

| File Path                                                | Element | Type           |
|----------------------------------------------------------|---------|----------------|
| `src/components/ambient/OrbitalReadouts.tsx`              | 1       | Client component|
| `src/components/ambient/InterDistrictPaths.tsx`           | 2       | Client component|
| `src/components/ambient/SystemPulseMonitor.tsx`           | 3       | Client component|
| `src/components/ambient/CoordinateGrid.tsx`               | 4       | Server component|
| `src/components/ambient/AmbientSweepLine.tsx`             | 5       | Client component|
| `src/components/ambient/ActivityLogTicker.tsx`            | 6       | Client component|
| `src/components/ambient/RadialGaugeCluster.tsx`           | 7       | Client component|
| `src/styles/enrichment.css`                               | All     | CSS keyframes  |

### New CSS Tokens (add to `spatial-tokens.css`)

```css
/* ============================================================
   ENRICHMENT: AMBIENT OVERLAY OPACITIES
   ============================================================ */
--opacity-readout-base: 0.5;
--opacity-readout-z2: 0.7;
--opacity-readout-z3: 1.0;
--opacity-connection-path: 0.12;
--opacity-registration-mark: 0.08;
--opacity-sweep-line: 0.06;
--opacity-ticker-text: 0.15;
--opacity-gauge-arc: 0.25;
--opacity-gauge-track: 0.03;
--opacity-circuit-trace: 0.04;
--opacity-hex-grid: 0.02;
--opacity-data-inscription: 0.04;
--opacity-capacitor-dot: 0.10;

/* ============================================================
   ENRICHMENT: ANIMATION DURATIONS
   ============================================================ */
--duration-readout-refresh: 15s;
--duration-flow-dash: 8s;
--duration-pulse-scroll: 2s;
--duration-ambient-sweep: 25s;
--duration-ticker-scroll: 60s;
--duration-gauge-rotate: 120s;
```

### New CSS Keyframes (`src/styles/enrichment.css`)

```css
/* Orbital readout data refresh flicker */
@keyframes readout-refresh {
  0%, 90%, 100% { opacity: var(--readout-opacity, 0.5); }
  93% { opacity: 0.1; }
  96% { opacity: 0.7; }
}

/* Inter-district path flowing dashes */
@keyframes flow-dash {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -24; }
}

/* System pulse monitor waveform scroll */
@keyframes pulse-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-76px); }
}

/* Ambient sweep line top-to-bottom traverse */
@keyframes ambient-sweep {
  0% { transform: translateY(-60px); opacity: 0; }
  5% { opacity: 1; }
  95% { opacity: 1; }
  100% { transform: translateY(960px); opacity: 0; }
}

/* Activity ticker horizontal scroll */
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Radial gauge tick mark slow rotation */
@keyframes gauge-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Reduced motion: disable all enrichment animations */
@media (prefers-reduced-motion: reduce) {
  .orbital-readout,
  .inter-district-path,
  .pulse-monitor-wave,
  .ambient-sweep-line,
  .activity-ticker-track,
  .gauge-tick-ring {
    animation: none !important;
  }
}

/* Pan optimization: pause all enrichment animations */
[data-panning='true'] .orbital-readout,
[data-panning='true'] .inter-district-path,
[data-panning='true'] .pulse-monitor-wave,
[data-panning='true'] .ambient-sweep-line,
[data-panning='true'] .activity-ticker-track,
[data-panning='true'] .gauge-tick-ring {
  animation-play-state: paused !important;
}

[data-panning='true'] .orbital-readout {
  opacity: 0.15 !important;
}

[data-panning='true'] .inter-district-path {
  opacity: 0.04 !important;
}
```

### Performance Budget

| Element               | GPU Layers | DOM Nodes | Estimated Paint Cost |
|-----------------------|-----------|-----------|---------------------|
| Orbital Readouts      | 0         | 8 divs   | Minimal (text only) |
| Inter-District Paths  | 0         | 1 SVG    | Low (thin strokes)  |
| System Pulse Monitor  | 1         | 1 SVG    | Low (clipped scroll)|
| Coordinate Grid       | 0         | ~50 lines| Minimal (static)    |
| Ambient Sweep Line    | 1         | 1 div    | Minimal (translateY)|
| Activity Log Ticker   | 1         | 1 div    | Minimal (translateX)|
| Radial Gauge Cluster  | 1         | 1 SVG    | Low (arcs + ticks)  |
| Deep-Zoom Details     | 0         | Varies   | Zero at Z0/Z1       |
| **Total**             | **4**     | **~65**  | **Well within budget**|

All enrichment elements combined add approximately 4 GPU-composited layers and ~65 DOM nodes. At Z0, all elements are `display: none`, so zero cost. At Z1 (default), the active elements use compositor-thread CSS animations (translateX/Y, rotate) which do not trigger layout or paint.

### Accessibility

- All enrichment elements have `aria-hidden="true"`
- All containers have `pointer-events: none`
- All animations respect `prefers-reduced-motion: reduce`
- No enrichment element is interactive or conveys critical information
- Screen readers skip the entire enrichment layer

---

## Visual Composition Preview

```
                    N.0420
                      +
                 SYS.UPTIME 99.7%
        PKG.HASH          ALERT.COUNT
         A3F2     .-''-.    00
               ./   .    \.
         [---/  ( gauge )  \---]
        |  /   ` ring  '   \  |
    +---| |  [AB]     [TC]  | |---+
    |   |  \   cluster  /  |  |   |
    |   [TC] '-.______.-' [PR] |
    |     \                /     |
    +------\--------------/------+
            \            /
      QUEUE   '--------'   TRACE
      DEPTH     |    |     7F2A
       03       |    |
             [SYS.PULSE ~~~~~~]
       14:32 HEALTH.CHECK NOMINAL // ...

    + = registration marks
    [ ] = capsules
    --- = connection paths
    ~~~ = pulse waveform
```

This is a rough spatial map. The actual rendering is layered with z-index ordering:
1. Dot grid (z: 0)
2. Hex grid underlay (z: 0, Z2+ only)
3. Coordinate grid + registration marks (z: 1)
4. Ambient sweep line (z: 1)
5. Inter-district paths (z: 1)
6. Radial gauge cluster (z: 2)
7. Capsule ring + hub glyph (z: 3)
8. Orbital readouts (z: 3)
9. Connector lines (z: 15, during morph only)
10. Detail panel (z: 20, during morph only)
11. Pulse monitor + ticker (z: 3, below ring)
12. Film grain overlay (z: 9999, fixed)
13. HUD (z: 40, fixed)

---

## Implementation Priority

| Priority | Element                     | Complexity | Visual Impact | Dependencies |
|----------|-----------------------------|-----------|---------------|-------------|
| P1       | Radial Gauge Cluster        | Medium    | Very High     | None        |
| P1       | Orbital Data Readouts       | Low       | High          | telemetry store |
| P1       | Inter-District Paths        | Medium    | High          | capsule-ring positions |
| P2       | System Pulse Monitor        | Medium    | High          | telemetry store |
| P2       | Coordinate Grid + Marks     | Low       | Medium        | None        |
| P2       | Ambient Sweep Line          | Low       | Medium        | None        |
| P3       | Activity Log Ticker         | Low-Med   | Medium        | narration cycle |
| P3       | Deep-Zoom Micro-Details     | Medium    | Medium (Z2+)  | Multiple    |

P1 elements should be implemented first as they provide the most visual transformation for the least risk. P2 elements add polish. P3 elements are optional refinements.

---

## Design Validation Checklist

Before each element is merged:

- [ ] Renders at correct world-space coordinates
- [ ] Respects zoom visibility table (hidden at Z0, visible at Z1+)
- [ ] Pauses/simplifies during pan (`data-panning` attribute)
- [ ] Respects `prefers-reduced-motion: reduce`
- [ ] Uses only tokens from `spatial-tokens.css` (no magic hex values)
- [ ] `pointer-events: none` on all ambient containers
- [ ] `aria-hidden="true"` on all ambient containers
- [ ] Does not increase layout shift during capsule interactions
- [ ] Does not interfere with morph choreography (fades out during morph)
- [ ] Visual regression test passes (Chromatic screenshot matches baseline)
- [ ] Total DOM node count stays within budget (~65 new nodes)
- [ ] No new GPU layers beyond the 4 budgeted
- [ ] Build passes: `pnpm typecheck && pnpm build`
