/**
 * Ambient Effects Layer -- barrel export.
 *
 * Re-exports all ambient effect components for clean imports:
 *
 * ```ts
 * import { ParticleField, HeartbeatPulse, GlowBreathing, GridPulse, ScanlineOverlay, FilmGrain } from '@/components/ambient'
 * import { EnrichmentLayer, ZoomGate, HaloGlow, RangeRings } from '@/components/ambient'
 * ```
 *
 * @module ambient
 * @see WS-1.6
 */

export { ParticleField } from './ParticleField'
export { HeartbeatPulse } from './HeartbeatPulse'
export { GlowBreathing } from './GlowBreathing'
export { GridPulse } from './GridPulse'
export { ScanlineOverlay } from './ScanlineOverlay'
export { FilmGrain } from './FilmGrain'

// Spatial enrichment components (Phase A)
export { EnrichmentLayer } from './enrichment-layer'
export { ZoomGate } from './zoom-gate'
export { HaloGlow } from './halo-glow'
export { RangeRings } from './range-rings'

// Spatial enrichment components (Phase B)
export { OrbitalReadouts } from './orbital-readouts'
export { ConnectionPaths } from './connection-paths'
export { CoordinateOverlays } from './coordinate-overlays'
export { RadialGaugeCluster } from './radial-gauge-cluster'

// Spatial enrichment components (Phase C)
export { SystemStatusPanel } from './system-status-panel'
export { FeedPanel } from './feed-panel'
export { SignalPulseMonitor } from './signal-pulse-monitor'
export { ActivityTicker } from './activity-ticker'

// Spatial enrichment components (Phase D)
export { HorizonScanLine } from './horizon-scan-line'
export { DeepZoomDetails } from './deep-zoom-details'

// Spatial enrichment components (Phase E)
export { SessionTimecode } from './session-timecode'
export { SectorGrid } from './sector-grid'
export { CalibrationMarks } from './calibration-marks'
export { EdgeFragments } from './edge-fragments'
export { MicroChronometer } from './micro-chronometer'

// Spatial enrichment components (Phase F — top/bottom viewport details)
export { TopTelemetryBar } from './top-telemetry-bar'
export { BottomStatusStrip } from './bottom-status-strip'
