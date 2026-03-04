# Spatial Enrichment -- Design Update Overview

**Date:** 2026-02-27
**Status:** Phase A-D implemented, audit complete, fixes applied
**Inspiration:** GMUNK's Oblivion Light Table UI (12 reference images analyzed)

---

## What This Is

The Tarva Launch spatial canvas had a working capsule ring, dot grid, and Evidence Ledger -- but the surrounding 20,000x20,000px world space felt empty. This design update adds 12 enrichment elements that transform the interface into a dense, explorable mission-control environment inspired by the Oblivion Light Table aesthetic.

Every element serves a purpose: range rings provide spatial orientation, connection paths show real data relationships between districts, orbital readouts report system telemetry, and deep-zoom details reward exploration. Nothing is pure decoration -- it's a living command center.

---

## Specialist Agent Plans

Four specialist agents each analyzed the same 12 Oblivion reference images and wrote independent plans from their domain expertise. These plans live alongside this overview:

| Agent | Plan File | Focus Area |
|-------|-----------|------------|
| **World-Class UX Designer** | [`ux-designer-plan.md`](./ux-designer-plan.md) | Information architecture by zoom level, data flow mapping, discovery moment design, responsive ambient states |
| **World-Class UI Designer** | [`ui-designer-plan.md`](./ui-designer-plan.md) | Pixel-precise visual specs (colors, typography, dimensions, radii), world-space coordinate system, glass treatment rules, animation timing |
| **React Developer** | [`react-developer-plan.md`](./react-developer-plan.md) | Component architecture, composition patterns for page.tsx, performance strategy (DOM budget, GPU layers, panning optimization), implementation order |
| **Interface Architect** | [`interface-architect-plan.md`](./interface-architect-plan.md) | Centralized data model (`EnrichmentSnapshot`), state orchestration via stores, progressive enhancement strategy, extensibility for real telemetry (WS-1.5) |

The consolidated master plan synthesized all four into a unified implementation spec with 4 phases, 12 elements, and clear component boundaries.

---

## The 12 Enrichment Elements

### Layer 1: Structural Foundation

| # | Element | Component | Description | Zoom Levels | Agent Responsible |
|---|---------|-----------|-------------|-------------|-------------------|
| 1 | **Halo Glow** | `halo-glow.tsx` | 800x800px radial gradient behind hub center. Ember-tinted `rgba(224,82,0,0.04)` with 8s CSS breathing animation. | All | **UI Designer** (visual spec) |
| 2 | **Range Rings + Compass** | `range-rings.tsx` | 1600x1600 SVG with 3 concentric circles (r=450/560/700), tick marks at 15-degree intervals, cardinal labels (N/E/S/W), rotating radar sweep line (24s/rev). | Z1, Z2 | **UI Designer** (spec), **React Developer** (SVG architecture) |
| 3 | **Coordinate Overlays** | `coordinate-overlays.tsx` | Hub crosshair (80px, 32px gap), 4 L-shaped corner brackets at 900x900, axis labels (X+/X-/Y+/Y-). | Z1, Z2 | **UI Designer** (registration mark spec), **UX Designer** (spatial orientation rationale) |

### Layer 2: Visual Impact

| # | Element | Component | Description | Zoom Levels | Agent Responsible |
|---|---------|-----------|-------------|-------------|-------------------|
| 4 | **Orbital Readouts** | `orbital-readouts.tsx` | 8 monospace text blocks at 380-480px radius. Content: SYS.UPTIME, TRACE, PKT.RATE, EPOCH, etc. Staggered flicker animation. | Z1, Z2 | **UX Designer** (data mapping), **UI Designer** (typography spec) |
| 5 | **Connection Paths** | `connection-paths.tsx` | 6 SVG bezier curves showing inter-district data flow. 5 teal (data) + 1 ember (reasoning). Animated dashed strokes. | Z1, Z2 | **UX Designer** (relationship mapping), **Interface Architect** (data model), **React Developer** (SVG path computation) |
| 6 | **Radial Gauge Cluster** | `radial-gauge-cluster.tsx` | 3 semi-arc SVG gauges above ring. Health (green), throughput (teal), capacity (ember). 18 tick marks per arc. | Z1, Z2 | **UI Designer** (gauge geometry), **Interface Architect** (metric definitions) |

### Layer 3: Data Panels

| # | Element | Component | Description | Zoom Levels | Agent Responsible |
|---|---------|-----------|-------------|-------------|-------------------|
| 7 | **System Status Panel** | `system-status-panel.tsx` | 320x680px glass panel at (-720,-340). ONLINE status, uptime, mission label, 6 district health rows, resource bars, COMM LINK. | Z1, Z2 | **UI Designer** (Oblivion left-sidebar spec), **Interface Architect** (health data model) |
| 8 | **Feed Panel** | `feed-panel.tsx` | 320x580px glass panel at (400,-290). FEEDS header, DATALINKS count, 3-tab selector, sensor readouts, signal bars, circuit decoration. | Z1, Z2 | **UI Designer** (Oblivion right-sidebar spec), **UX Designer** (feed information architecture) |
| 9 | **Signal Pulse Monitor** | `signal-pulse-monitor.tsx` | 480x120px glass panel at (-240,520). Canvas 2D with 3 sine waves (teal/ember/white). SIGNAL DATA header, DECODE accent. | Z1, Z2 | **UI Designer** (waveform spec), **React Developer** (Canvas 2D rAF loop, panning optimization) |
| 10 | **Activity Ticker** | `activity-ticker.tsx` | 260x240px glass panel at (260,490). 8 color-coded mock events in seamless CSS scroll loop. | Z1, Z2 | **UX Designer** (event taxonomy), **UI Designer** (ticker styling) |

### Layer 4: Discovery

| # | Element | Component | Description | Zoom Levels | Agent Responsible |
|---|---------|-----------|-------------|-------------|-------------------|
| 11 | **Horizon Scan Line** | `horizon-scan-line.tsx` | 1600px teal horizontal sweep, 25s cycle, 8s delay. Gradient trail above, thin trail below. | Z1 only | **UI Designer** (scan aesthetic) |
| 12 | **Deep Zoom Details** | `deep-zoom-details.tsx` | Composite: circuit traces (Z2+), capacitor dots (Z2+, 2 with pulse), data inscriptions (Z3 only, 7 labels including live zoom readout). | Z2, Z3 | **UX Designer** (discovery moment design), **UI Designer** (PCB aesthetic), **React Developer** (self-gating ZoomGate pattern) |

---

## Architecture

### Wrapper Components

| Component | File | Role |
|-----------|------|------|
| **EnrichmentLayer** | `enrichment-layer.tsx` | Gates all children behind `effectsEnabled` setting. Sets `aria-hidden`, `pointer-events:none`, propagates `data-panning`. |
| **ZoomGate** | `zoom-gate.tsx` | Memoized conditional renderer. Accepts `show: SemanticZoomLevel[]`, unmounts children entirely outside range. |

### Composition in `page.tsx`

```
SpatialCanvas
  +-- DotGrid (-10000,-10000, 20000x20000)
  +-- EnrichmentLayer (behind capsules)
  |     +-- HaloGlow
  |     +-- ZoomGate [Z1,Z2] -> RangeRings
  |     +-- ZoomGate [Z1,Z2] -> CoordinateOverlays
  |     +-- ZoomGate [Z1,Z2] -> ConnectionPaths
  |     +-- ZoomGate [Z1] -> HorizonScanLine
  +-- MorphOrchestrator (interactive layer)
  +-- Overlay div (above capsules, pointer-events:none)
  |     +-- ZoomGate [Z1,Z2] -> OrbitalReadouts
  |     +-- ZoomGate [Z1,Z2] -> RadialGaugeCluster
  +-- Data panels div (pointer-events:none)
  |     +-- ZoomGate [Z1,Z2] -> SystemStatusPanel
  |     +-- ZoomGate [Z1,Z2] -> FeedPanel
  |     +-- ZoomGate [Z1,Z2] -> SignalPulseMonitor
  |     +-- ZoomGate [Z1,Z2] -> ActivityTicker
  +-- Discovery div (pointer-events:none)
  |     +-- DeepZoomDetails (self-gating)
  +-- EvidenceLedger (NW quadrant)
```

### Animation Tiers

| Tier | Technology | Elements | Cost |
|------|-----------|----------|------|
| CSS @keyframes | Compositor thread | Halo breathe, sweep rotation, flicker, flow dash, ticker scroll, capacitor pulse, horizon sweep | Zero JS |
| Canvas 2D | Single rAF loop | Signal pulse waveform | ~1ms/frame |
| Static DOM | No animation | Coordinate marks, gauge arcs, data inscriptions, circuit traces | None |

### Performance Rules

- All enrichments: `pointer-events: none`, `aria-hidden: true`
- No `backdrop-filter` on world-space elements (glass panels use `rgba` backgrounds)
- Panning: CSS `[data-panning='true']` pauses all CSS animations; Canvas 2D stops rAF loop
- Reduced motion: `animation: none` across all enrichment classes
- Z0: All enrichments unmounted (ZoomGate)
- `effectsEnabled=false`: EnrichmentLayer returns null

### CSS

All keyframes and animation rules live in `src/styles/enrichment.css`:
- `enrichment-halo-breathe` (8s opacity cycle)
- `enrichment-sweep` (24s rotation)
- `enrichment-flicker` (0.3s opacity dip, with staggered delays)
- `enrichment-flow` (2s dash offset scroll)
- `enrichment-ticker-scroll` (60s vertical scroll)
- `enrichment-circuit-pulse` (3s teal glow)
- `enrichment-capacitor-pulse` (4s opacity cycle)
- `enrichment-horizon-sweep` (25s vertical translate, 8s delay)

---

## Oblivion Reference Map

Each element traces back to specific GMUNK Oblivion Light Table screenshots:

| Element | Primary Reference |
|---------|------------------|
| Range Rings | UI_09: Concentric weather radial displays |
| Orbital Readouts | UI_13: GSW/PXP/TRZ data table; UI_02: sidebar readouts |
| Connection Paths | UI_05: Diagonal crossing lines between panels |
| System Status Panel | UI_02/17/21: Left sidebar (ONLINE, TECH N-49, drone counts) |
| Feed Panel | UI_02/17: Right sidebar (FEEDS, DATALINKS, camera controls) |
| Signal Pulse Monitor | UI_16-19: Signal data waveform overlays |
| Activity Ticker | UI_13: PORT B/CAMERA VIEW labels, data readout table |
| Radial Gauges | UI_04: Diamond gauge + stacked bars; UI_09: ring gauges |
| Coordinate Grid | UI_13/14: Corner marks, SECTOR labels, registration marks |
| Deep Zoom Details | UI_02: Circuit diagram; UI_14: Dot-matrix, SECTOR 042 |
| Horizon Scan Line | General Oblivion systematic scanning aesthetic |
| Halo Glow | Hub center atmospheric presence |

---

## Audit Results (2026-02-27)

An `every-time` accuracy audit reviewed all 12 components. Results: **0 critical, 2 moderate, 5 minor, 7 cosmetic**. The following fixes have been applied:

| Issue | Severity | File | Fix |
|-------|----------|------|-----|
| Text anchor ternary returns `'start'` for both positive and negative x | Moderate | `deep-zoom-details.tsx:257` | Fixed: negative x now returns `'end'` |
| District name `'tarvacore'` should be `'tarva-core'` | Minor | `activity-ticker.tsx:59` | Fixed: uses canonical hyphenated DistrictId |
| `<defs>` nested inside rotating `<g>` | Minor | `range-rings.tsx` | Fixed: moved `<defs>` outside the rotating group |
| rAF loop runs continuously during panning (no-op frames) | Minor | `signal-pulse-monitor.tsx` | Fixed: stops rAF entirely during panning, MutationObserver restarts on resume |
| TarvaCORE-to-hub connection renders as straight line | Minor | `connection-paths.tsx` | Fixed: perpendicular offset when path is collinear with center |

Remaining items (cosmetic, deferred):
- DOM node count ~336 vs stated 65 budget (documentation update, not a code issue)
- Hardcoded tab label check in feed-panel.tsx
- Minor opacity inconsistencies across panel headers
- Missing reduced-motion fallback for horizon sweep delay

---

## Future Work

When the Telemetry Aggregator (WS-1.5) is implemented, the mock data in these components should be replaced with real system telemetry. The **Interface Architect plan** defines an `EnrichmentSnapshot` data model and centralized generator pattern that enables a single-function swap from mock to live data. The enrichment components themselves won't need to change -- only the data source.
