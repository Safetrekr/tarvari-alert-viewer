/**
 * Shared scene primitives for district ambient views.
 *
 * These are small, reusable building blocks that district-specific ambient
 * scenes compose into richer backgrounds. All rendering uses inline styles
 * and CSS keyframe class names defined in `district-view.css` and
 * `enrichment.css`.
 *
 * Every component is wrapped in `React.memo` because ambient scenes
 * re-render infrequently and props rarely change.
 *
 * @module shared-scene-primitives
 * @see src/styles/district-view.css   -- `district-data-stream` keyframe
 * @see src/styles/enrichment.css      -- `enrichment-flicker`, `enrichment-circuit-pulse`
 */

'use client'

import { memo, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const MONO_FAMILY = 'var(--font-mono, monospace)'

// ---------------------------------------------------------------------------
// 1. GhostText
// ---------------------------------------------------------------------------

export interface GhostTextProps {
  /** The text to display. */
  text: string
  /** Font size in px. @default 10 */
  size?: number
  /** Text opacity (ignored when `color` is provided). @default 0.12 */
  opacity?: number
  /** Full rgba color string. Overrides `opacity` when set. */
  color?: string
  /** Apply the `enrichment-flicker` CSS animation. @default false */
  flicker?: boolean
  /** Apply text-transform uppercase. @default true */
  uppercase?: boolean
  /** Letter spacing value. @default '0.08em' */
  letterSpacing?: string
  /** Additional inline styles merged onto the span. */
  style?: React.CSSProperties
  /** Additional CSS class names. */
  className?: string
}

/**
 * Monospace ghost text rendered at low opacity. Used for ambient labels,
 * annotations, and decorative text overlays throughout district scenes.
 */
export const GhostText = memo(function GhostText({
  text,
  size = 10,
  opacity = 0.12,
  color,
  flicker = false,
  uppercase = true,
  letterSpacing = '0.08em',
  style,
  className,
}: GhostTextProps) {
  const resolvedColor = color ?? `rgba(255, 255, 255, ${opacity})`

  const classNames = [
    flicker ? 'enrichment-flicker' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <span
      className={classNames}
      style={{
        fontFamily: MONO_FAMILY,
        fontSize: size,
        color: resolvedColor,
        letterSpacing,
        textTransform: uppercase ? 'uppercase' : undefined,
        whiteSpace: 'pre',
        ...style,
      }}
    >
      {text}
    </span>
  )
})

// ---------------------------------------------------------------------------
// 2. DataStream
// ---------------------------------------------------------------------------

export interface DataStreamProps {
  /** Array of text lines to scroll vertically. */
  lines: string[]
  /** Container width in px. @default 280 */
  width?: number
  /** Container height in px. @default 400 */
  height?: number
  /** Text color. @default 'rgba(255,255,255,0.06)' */
  color?: string
  /** Font size in px. @default 9 */
  fontSize?: number
  /** Full scroll cycle duration in seconds. @default 45 */
  scrollDuration?: number
  /** Additional inline styles on the outer container. */
  style?: React.CSSProperties
}

/**
 * Vertical scrolling ticker of monospace text lines. Duplicates the line
 * array internally for a seamless CSS `translateY(-50%)` loop.
 *
 * The `district-data-stream` keyframe is defined in `district-view.css`.
 */
export const DataStream = memo(function DataStream({
  lines,
  width = 280,
  height = 400,
  color = 'rgba(255,255,255,0.06)',
  fontSize = 9,
  scrollDuration = 45,
  style,
}: DataStreamProps) {
  // Duplicate lines for seamless wrap-around
  const doubled = useMemo(() => [...lines, ...lines], [lines])

  return (
    <div
      style={{
        width,
        height,
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          animation: `district-data-stream ${scrollDuration}s linear infinite`,
        }}
      >
        {doubled.map((line, i) => (
          <div
            key={i}
            style={{
              padding: '4px 0',
              fontFamily: MONO_FAMILY,
              fontSize,
              color,
              whiteSpace: 'pre',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// 3. StatusDotGrid
// ---------------------------------------------------------------------------

export interface StatusDotGridProps {
  /** Number of rows. */
  rows: number
  /** Number of columns. */
  cols: number
  /** Dot diameter in px. @default 3 */
  dotSize?: number
  /** Gap between dots in px. @default 6 */
  gap?: number
  /** Color for active dots. @default 'rgba(14,165,233,0.25)' (teal) */
  activeColor?: string
  /** Color for inactive dots. @default 'rgba(255,255,255,0.04)' */
  dimColor?: string
  /** Fraction of dots that are active (0-1). @default 0.7 */
  activeRatio?: number
  /** Optional labels for each row, rendered as ghost text to the left. */
  labels?: string[]
  /** Additional inline styles on the outer container. */
  style?: React.CSSProperties
}

/**
 * An N x M grid of small colored dots with a deterministic active/dim
 * pattern. Active dots pulse via the `enrichment-circuit-pulse` CSS class.
 * Useful for skill matrices, server grids, and capacity indicators.
 */
export const StatusDotGrid = memo(function StatusDotGrid({
  rows,
  cols,
  dotSize = 3,
  gap = 6,
  activeColor = 'rgba(14,165,233,0.25)',
  dimColor = 'rgba(255,255,255,0.04)',
  activeRatio = 0.7,
  labels,
  style,
}: StatusDotGridProps) {
  // Deterministic grid pattern computed once per prop change.
  // Uses index-based modular arithmetic so the layout is stable
  // across re-renders without relying on Math.random().
  const grid = useMemo(() => {
    const period = Math.max(1, Math.ceil(1 / (1 - activeRatio)))
    return Array.from({ length: rows }, (_, rowIdx) =>
      Array.from(
        { length: cols },
        (_, colIdx) => (rowIdx * cols + colIdx) % period !== 0,
      ),
    )
  }, [rows, cols, activeRatio])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap,
        ...style,
      }}
    >
      {grid.map((row, rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap,
          }}
        >
          {/* Optional row label */}
          {labels && labels[rowIdx] != null && (
            <span
              style={{
                fontFamily: MONO_FAMILY,
                fontSize: 7,
                color: 'rgba(255, 255, 255, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                whiteSpace: 'pre',
                minWidth: 40,
              }}
            >
              {labels[rowIdx]}
            </span>
          )}

          {/* Dots */}
          {row.map((isActive, colIdx) => (
            <div
              key={colIdx}
              className={isActive ? 'enrichment-circuit-pulse' : undefined}
              style={{
                width: dotSize,
                height: dotSize,
                borderRadius: '50%',
                backgroundColor: isActive ? activeColor : dimColor,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  )
})

// ---------------------------------------------------------------------------
// 4. ProgressBar
// ---------------------------------------------------------------------------

export interface ProgressBarProps {
  /** Bar label text. */
  label: string
  /** Fill percentage (0-100). */
  value: number
  /** Bar width in px. @default 200 */
  width?: number
  /** Bar height in px. @default 4 */
  height?: number
  /** Fill color. @default 'rgba(14,165,233,0.3)' (teal) */
  fillColor?: string
  /** Background track color. @default 'rgba(255,255,255,0.04)' */
  trackColor?: string
  /** Label text color. @default 'rgba(255,255,255,0.12)' */
  labelColor?: string
  /** Show percentage value text to the right of the label. @default true */
  showValue?: boolean
  /** Additional inline styles on the outer container. */
  style?: React.CSSProperties
}

/**
 * Labeled horizontal progress bar with a smooth fill transition.
 * Used for capacity indicators, completion meters, and resource gauges.
 */
export const ProgressBar = memo(function ProgressBar({
  label,
  value,
  width = 200,
  height = 4,
  fillColor = 'rgba(14,165,233,0.3)',
  trackColor = 'rgba(255,255,255,0.04)',
  labelColor = 'rgba(255,255,255,0.12)',
  showValue = true,
  style,
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        width,
        ...style,
      }}
    >
      {/* Label row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
        }}
      >
        <span
          style={{
            fontFamily: MONO_FAMILY,
            fontSize: 8,
            color: labelColor,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {label}
        </span>
        {showValue && (
          <span
            style={{
              fontFamily: MONO_FAMILY,
              fontSize: 8,
              color: labelColor,
              letterSpacing: '0.04em',
            }}
          >
            {clampedValue}%
          </span>
        )}
      </div>

      {/* Track + fill */}
      <div
        style={{
          height,
          width: '100%',
          borderRadius: 2,
          backgroundColor: trackColor,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clampedValue}%`,
            backgroundColor: fillColor,
            borderRadius: 2,
            transition: 'width 600ms ease',
          }}
        />
      </div>
    </div>
  )
})

// ---------------------------------------------------------------------------
// 5. GhostCounter
// ---------------------------------------------------------------------------

export interface GhostCounterProps {
  /** The number or text to display prominently. */
  value: string | number
  /** Label text displayed below the number. */
  label: string
  /** Number font size in px. @default 72 */
  size?: number
  /** Opacity for the number text. @default 0.06 */
  numberOpacity?: number
  /** Opacity for the label text. @default 0.1 */
  labelOpacity?: number
  /** Additional inline styles on the outer container. */
  style?: React.CSSProperties
}

/**
 * Large monospace number display with a small label beneath.
 * Used for hero counters, aggregate metrics, and ambient numerics
 * that convey scale at a glance.
 */
export const GhostCounter = memo(function GhostCounter({
  value,
  label,
  size = 72,
  numberOpacity = 0.06,
  labelOpacity = 0.1,
  style,
}: GhostCounterProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      {/* Number */}
      <span
        style={{
          fontFamily: MONO_FAMILY,
          fontSize: size,
          color: `rgba(255, 255, 255, ${numberOpacity})`,
          fontWeight: 300,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </span>

      {/* Label */}
      <span
        style={{
          fontFamily: MONO_FAMILY,
          fontSize: 9,
          color: `rgba(255, 255, 255, ${labelOpacity})`,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginTop: 8,
        }}
      >
        {label}
      </span>
    </div>
  )
})
