/**
 * FilmGrain -- static SVG feTurbulence noise overlay.
 *
 * Renders an inline SVG filter definition and a full-viewport overlay div
 * that applies the noise via CSS `filter: url(#tarva-noise)` with
 * `mix-blend-mode: overlay`. Produces a subtle analog film texture.
 *
 * This is a **Server Component** -- no interactivity, no hooks, no state.
 * The grain is purely textural and static; it is NOT suppressed by
 * reduced-motion preferences (it contains no animation).
 *
 * @module FilmGrain
 * @see WS-1.6 Deliverable 4.6
 * @see VISUAL-DESIGN-SPEC.md Section 5.6
 */

export function FilmGrain() {
  return (
    <>
      {/* Inline SVG filter definition -- zero visual footprint */}
      <svg
        aria-hidden="true"
        style={{
          width: 0,
          height: 0,
          overflow: 'hidden',
          position: 'absolute',
        }}
      >
        <defs>
          <filter id="tarva-noise">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves={3}
              stitchTiles="stitch"
            />
          </filter>
        </defs>
      </svg>

      {/* Full-viewport noise overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          pointerEvents: 'none',
          filter: 'url(#tarva-noise)',
          mixBlendMode: 'overlay',
          opacity: 'var(--opacity-ambient-grain, 0.035)',
        }}
      />
    </>
  )
}
