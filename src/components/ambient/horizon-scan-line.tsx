/**
 * HorizonScanLine -- a barely-perceptible horizontal teal line that
 * sweeps slowly from top to bottom across the full viewport.
 *
 * Creates a subtle "scanner" effect reminiscent of radar/sonar displays.
 * The line itself is a 1px solid teal with soft gradients above (40px)
 * and below (8px) to create a ghostly leading/trailing edge.
 *
 * Implementation:
 * - Fixed-position viewport overlay (100vw x 100vh, overflow hidden)
 * - CSS animation (`enrichment-horizon-sweep-vp`) translates from top
 *   to bottom of viewport over 25s with 8s delay
 * - Opacity values are extremely low (0.03-0.06) for subliminal effect
 *
 * @module horizon-scan-line
 * @see Phase D: Discovery elements & polish
 */

'use client'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function HorizonScanLine() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 35,
      }}
    >
      <div
        className="enrichment-horizon-sweep-vp"
        style={{
          position: 'absolute',
          left: 0,
          width: '100%',
        }}
      >
        {/* Upper gradient: 40px tall, teal glow above the line */}
        <div
          style={{
            width: '100%',
            height: 40,
            background:
              'linear-gradient(to bottom, transparent, rgba(14, 165, 233, 0.06))',
          }}
        />
        {/* Main scan line: 1px solid teal */}
        <div
          style={{
            width: '100%',
            height: 1,
            backgroundColor: 'rgba(14, 165, 233, 0.12)',
          }}
        />
        {/* Lower gradient: 8px trail below the line */}
        <div
          style={{
            width: '100%',
            height: 8,
            background:
              'linear-gradient(to bottom, rgba(14, 165, 233, 0.04), transparent)',
          }}
        />
      </div>
    </div>
  )
}
