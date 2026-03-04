/**
 * Launch page -- the main spatial mission-control entry point.
 *
 * Renders the ZUI engine (SpatialViewport + SpatialCanvas) with the
 * Coverage Grid: live TarvaRI intel category cards in a CSS Grid,
 * over an ambient dot grid with periodic radial pulse.
 *
 * WS-2.1: Uses MorphOrchestrator to coordinate the coverage grid and
 * category icon grid across semantic zoom levels. Selection state is
 * managed by the UI store morph state machine, not local component state.
 * Coverage metrics come from useCoverageMetrics() (TanStack Query).
 *
 * Composes the Navigation HUD overlay (minimap, breadcrumb, zoom indicator)
 * and command palette outside the spatial canvas for fixed-position display.
 *
 * @module (launch)/page
 * @see WS-1.1 Deliverable 14
 * @see WS-1.2 Launch Atrium
 * @see WS-1.4 Navigation Instruments
 * @see WS-2.1 Coverage Grid
 * @see WS-3.3 Command Palette (replaces CommandPaletteStub)
 */

'use client'

import { useEffect, useMemo, useRef } from 'react'

import { SpatialViewport } from '@/components/spatial/SpatialViewport'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { MorphOrchestrator } from '@/components/districts/morph-orchestrator'
import { DotGrid } from '@/components/districts/dot-grid'
import { NavigationHUD } from '@/components/spatial/NavigationHUD'
import { Minimap } from '@/components/spatial/Minimap'
import { ZoomIndicator } from '@/components/spatial/ZoomIndicator'
import { SpatialBreadcrumb } from '@/components/ui/SpatialBreadcrumb'
import { CommandPalette } from '@/components/spatial/CommandPalette'
import { EvidenceLedgerDistrict, EVIDENCE_LEDGER_POSITION } from '@/components/evidence-ledger/evidence-ledger-district'
import {
  EnrichmentLayer,
  ZoomGate,
  HaloGlow,
  RangeRings,
  CoordinateOverlays,
  ConnectionPaths,
  OrbitalReadouts,
  RadialGaugeCluster,
  SystemStatusPanel,
  FeedPanel,
  SignalPulseMonitor,
  ActivityTicker,
  HorizonScanLine,
  DeepZoomDetails,
  SectorGrid,
  EdgeFragments,
  MicroChronometer,
  SessionTimecode,
  CalibrationMarks,
  TopTelemetryBar,
  BottomStatusStrip,
} from '@/components/ambient'
import { DistrictViewOverlay } from '@/components/district-view'
import { usePanPause } from '@/hooks/use-pan-pause'
import {
  useKeyboardShortcuts,
  type KeyboardShortcutConfig,
} from '@/hooks/use-keyboard-shortcuts'
import { useNarrationCycle } from '@/hooks/use-narration-cycle'
import { useAttentionChoreography } from '@/hooks/use-attention-choreography'
import { useEnrichmentCycle } from '@/hooks/use-enrichment-cycle'
import { useUIStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { useSettingsStore } from '@/stores/settings.store'
import { ColorSchemeSwitcher } from '@/components/ui/ColorSchemeSwitcher'
import { returnToHub } from '@/lib/spatial-actions'
import { DISTRICTS, type DistrictId } from '@/lib/interfaces/district'
import { buildGridItems, type CategoryGridItem } from '@/lib/interfaces/coverage'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { syncCoverageFromUrl } from '@/stores/coverage.store'
import { CoverageOverviewStats } from '@/components/coverage/CoverageOverviewStats'
import { GRID_HEIGHT } from '@/components/coverage/CoverageGrid'
import { InMemoryReceiptStore } from '@/lib/interfaces/receipt-store'

import '@/styles/atrium.css'
import '@/styles/morph.css'
import '@/styles/constellation.css'
import '@/styles/enrichment.css'
import '@/styles/district-view.css'
import '@/styles/coverage.css'

// ---------------------------------------------------------------------------
// Phase 3 side-effect hooks (mounted once, no UI)
// ---------------------------------------------------------------------------

/** Singleton receipt store for Evidence Ledger (in-memory fallback when Supabase isn't running). */
const receiptStore = new InMemoryReceiptStore()

function Phase3Effects() {
  const effectsEnabled = useSettingsStore((s) => s.effectsEnabled)
  useNarrationCycle(effectsEnabled)
  useAttentionChoreography()
  useEnrichmentCycle()
  return null
}

// ---------------------------------------------------------------------------
// Reduced motion detection
// ---------------------------------------------------------------------------

function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// ---------------------------------------------------------------------------
// URL-based initial district loading
// ---------------------------------------------------------------------------

/**
 * On initial page load, if the URL contains `?district={id}`,
 * skip animation and render directly in the `settled` state.
 */
function useInitialDistrictFromUrl(): void {
  const startMorph = useUIStore((s) => s.startMorph)
  const setMorphPhase = useUIStore((s) => s.setMorphPhase)
  const phase = useUIStore((s) => s.morph.phase)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    const districtParam = url.searchParams.get('district')

    if (
      districtParam &&
      phase === 'idle' &&
      DISTRICTS.some((d) => d.id === districtParam)
    ) {
      const districtId = districtParam as DistrictId

      // Skip animation: start morph then immediately jump to settled
      // No camera movement needed — panel appears alongside capsule ring
      startMorph(districtId)
      setMorphPhase('settled')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Run once on mount
  }, [])
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function LaunchPage() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const isPanActive = usePanPause()
  const prefersReducedMotion = usePrefersReducedMotion()

  // URL-based initial district (legacy compatibility)
  useInitialDistrictFromUrl()

  // Coverage data (WS-2.1)
  const { data: coverageMetrics, isLoading: isMetricsLoading } = useCoverageMetrics()

  // Build grid items from live metrics (Decision 4: only categories with >= 1 source)
  const gridItems: CategoryGridItem[] = useMemo(
    () => (coverageMetrics ? buildGridItems(coverageMetrics.byCategory) : []),
    [coverageMetrics],
  )

  // URL sync for category selection
  useEffect(() => {
    syncCoverageFromUrl()
  }, [])

  // Auth
  const logout = useAuthStore((s) => s.logout)

  // Settings-gated HUD visibility
  const minimapVisible = useSettingsStore((s) => s.minimapVisible)
  const breadcrumbVisible = useSettingsStore((s) => s.breadcrumbVisible)

  // Hide peripheral world elements during morph
  const morphPhase = useUIStore((s) => s.morph.phase)
  const isMorphActive = morphPhase !== 'idle'

  // Keyboard shortcuts (WS-1.4)
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette)
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen)

  const shortcuts: KeyboardShortcutConfig[] = useMemo(
    () => [
      {
        key: 'Home',
        handler: returnToHub,
        label: 'Return to Hub',
      },
      {
        key: 'k',
        meta: true,
        preventDefault: true,
        handler: toggleCommandPalette,
        label: 'Toggle Command Palette',
      },
      // Note: Escape for morph reverse is handled by useMorphChoreography.
      // This Escape handler only closes the command palette.
      {
        key: 'Escape',
        handler: () => setCommandPaletteOpen(false),
        label: 'Close Command Palette',
      },
    ],
    [toggleCommandPalette, setCommandPaletteOpen],
  )

  useKeyboardShortcuts(shortcuts)

  return (
    <>
      <SpatialViewport
        viewportRef={viewportRef}
        className={isPanActive ? '' : undefined}
        enableKeyboardShortcuts={false}
      >
        <SpatialCanvas>
          {/* Dot grid background layer -- sized large enough to cover the
              viewport at minimum zoom (0.08). At that zoom, a 1440px-wide
              viewport spans ~18000px of world space, so we use 20000x20000. */}
          <div
            className="absolute"
            style={{
              left: -10000,
              top: -10000,
              width: 20000,
              height: 20000,
              pointerEvents: 'none',
            }}
          >
            <DotGrid />
          </div>

          {/* Sector grid: faint 2000px grid with sector labels (SEC A1..D4).
              Self-gated to Z1+. Sits behind everything else in world-space. */}
          <SectorGrid />

          {/* Enrichment layer: ambient glow + range rings behind capsules.
              Gated by effectsEnabled in settings store. Positioned at
              world-space origin (0,0) to align with capsule ring center.
              Blurs subtly during morph to focus attention on selected card. */}
          <EnrichmentLayer isPanning={isPanActive}>
            <div
              className="morph-ambient-fade"
              data-morph-active={isMorphActive ? 'true' : 'false'}
            >
              <HaloGlow />
              <MicroChronometer />
              <RangeRings />
              <ZoomGate show={['Z1', 'Z2']}>
                <CoordinateOverlays />
              </ZoomGate>
              <ZoomGate show={['Z1', 'Z2']}>
                <ConnectionPaths />
              </ZoomGate>
            </div>
            {/* Horizon scan line moved to fixed viewport overlay below */}
          </EnrichmentLayer>

          {/* Coverage overview stats -- positioned above the grid, Z1+ only */}
          <ZoomGate show={['Z1', 'Z2', 'Z3']}>
            <div
              className="absolute"
              style={{
                left: -(560 / 2),
                top: -(GRID_HEIGHT / 2) - 100 - 60,
                width: 560,
                pointerEvents: 'auto',
              }}
            >
              <CoverageOverviewStats
                totalSources={coverageMetrics?.totalSources ?? 0}
                activeSources={coverageMetrics?.activeSources ?? 0}
                categoriesCovered={coverageMetrics?.categoriesCovered ?? 0}
                isLoading={isMetricsLoading}
              />
            </div>
          </ZoomGate>

          {/* Morph Orchestrator: manages coverage grid + category icon grid.
              Re-enable pointer-events here because SpatialCanvas disables them
              (per Q4: children re-enable individually). */}
          <div data-panning={isPanActive ? 'true' : 'false'} style={{ pointerEvents: 'auto' }}>
            <MorphOrchestrator
              items={gridItems}
              metrics={coverageMetrics}
              prefersReducedMotion={prefersReducedMotion}
              isPanning={isPanActive}
            />
          </div>

          {/* Decorative overlays above capsules: readouts + gauge cluster.
              Blur + fade during morph to focus on selected card. */}
          <div
            className="morph-ambient-fade"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            data-panning={isPanActive ? 'true' : 'false'}
            data-morph-active={isMorphActive ? 'true' : 'false'}
          >
            <ZoomGate show={['Z1', 'Z2']}>
              <OrbitalReadouts />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <RadialGaugeCluster />
            </ZoomGate>
          </div>

          {/* Phase C data panels: push outward + blur during morph. */}
          <div
            className="morph-panels-scatter"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            data-panning={isPanActive ? 'true' : 'false'}
            data-morph-active={isMorphActive ? 'true' : 'false'}
          >
            <ZoomGate show={['Z1', 'Z2']}>
              <SystemStatusPanel />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <FeedPanel />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <SignalPulseMonitor />
            </ZoomGate>
            <ZoomGate show={['Z1', 'Z2']}>
              <ActivityTicker />
            </ZoomGate>
          </div>

          {/* Phase D: Deep-zoom discovery details -- fade during morph. */}
          <div
            className="morph-ambient-fade"
            style={{ pointerEvents: 'none' }}
            aria-hidden="true"
            data-panning={isPanActive ? 'true' : 'false'}
            data-morph-active={isMorphActive ? 'true' : 'false'}
          >
            <DeepZoomDetails />
            <EdgeFragments />
          </div>

          {/* Evidence Ledger: NW quadrant, visible at Z2/Z3, hidden during morph */}
          {!isMorphActive && (
            <div
              className="absolute"
              style={{
                left: EVIDENCE_LEDGER_POSITION.x,
                top: EVIDENCE_LEDGER_POSITION.y,
                pointerEvents: 'auto',
              }}
            >
              <EvidenceLedgerDistrict receiptStore={receiptStore} />
            </div>
          )}
        </SpatialCanvas>
      </SpatialViewport>

      {/* District view overlay (fixed, z-30) -- self-gates on morph phase */}
      <DistrictViewOverlay />

      {/* Navigation HUD overlay (fixed, z-40) */}
      <NavigationHUD isPanActive={isPanActive}>
        {/* Tarva white logo -- top-left corner */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo/tarva-white-logo.svg"
          alt="Tarva"
          className="pointer-events-none fixed left-4 opacity-40"
          style={{ height: 14, top: 21, transform: 'translateY(-50%)' }}
        />
        {breadcrumbVisible && <SpatialBreadcrumb />}
        {minimapVisible && <Minimap />}
        {/* Bottom-left: logout button (above bottom footer bar) */}
        <div className="pointer-events-auto fixed bottom-10 left-4 flex items-center gap-3">
          <button
            onClick={logout}
            className="rounded-md border border-white/[0.06] bg-surface/80 px-2.5 py-1 font-mono text-[10px] tracking-wider text-text-tertiary uppercase backdrop-blur-sm transition-colors hover:border-white/[0.12] hover:text-text-secondary"
          >
            Logout
          </button>
        </div>
      </NavigationHUD>

      {/* Top-right: theme toggle + zoom indicator, vertically centered in header */}
      <div
        className="pointer-events-auto fixed right-4 z-40 flex items-center gap-2"
        style={{ top: 21, transform: 'translateY(-50%)' }}
      >
        <ColorSchemeSwitcher />
        <ZoomIndicator />
      </div>

      {/* Fixed-position viewport overlays: scan line, timecode, calibration */}
      <HorizonScanLine />
      <SessionTimecode />
      <CalibrationMarks />
      <TopTelemetryBar />
      <BottomStatusStrip />

      {/* Command palette (outside HUD, has its own z-50 via Dialog) */}
      <CommandPalette onRefresh={async () => { /* WS-1.5 telemetry refresh */ }} />

      {/* Phase 3 background effects (narration cycle + attention choreography) */}
      <Phase3Effects />
    </>
  )
}
