'use client'

/**
 * DistrictFilterPanel -- expandable glass-material panel with source
 * selector and viewport bbox toggle for district view filtering.
 *
 * @module district-filter-panel
 * @see WS-5.2 Section 4.6
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import type { MapRef } from 'react-map-gl/maplibre'

import { useCoverageStore, coverageSelectors } from '@/stores/coverage.store'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useMapBbox } from '@/hooks/use-map-bbox'
import type { BBox } from '@/hooks/use-coverage-map-data'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  staging: '#3b82f6',
  quarantine: '#eab308',
  disabled: '#6b7280',
}

const GHOST = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 9,
  fontWeight: 500 as const,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: 'rgba(255, 255, 255, 0.15)',
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictFilterPanelProps {
  readonly categoryId: string
  readonly mapRef: React.RefObject<MapRef | null>
  readonly onBboxChange: (bbox: BBox | null) => void
}

// ---------------------------------------------------------------------------
// Source Dropdown
// ---------------------------------------------------------------------------

function SourceDropdown({ categoryId }: { categoryId: string }) {
  const { data: metrics } = useCoverageMetrics()
  const sourceFilter = useCoverageStore((s) => s.districtSourceFilter)
  const setSourceFilter = useCoverageStore((s) => s.setDistrictSourceFilter)
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const sources = (metrics?.sourcesByCoverage ?? []).filter(
    (s) => s.category === categoryId,
  )

  const selectedSource = sources.find((s) => s.sourceKey === sourceFilter)
  const displayLabel = selectedSource?.name ?? 'All Sources'

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        setOpen(true)
        return
      }
      if (open) {
        const allOptions = [null, ...sources.map((s) => s.sourceKey)]
        const currentIdx = allOptions.indexOf(sourceFilter)
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          const next = Math.min(currentIdx + 1, allOptions.length - 1)
          setSourceFilter(allOptions[next])
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          const prev = Math.max(currentIdx - 1, 0)
          setSourceFilter(allOptions[prev])
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen(false)
        }
      }
    },
    [open, sources, sourceFilter, setSourceFilter],
  )

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select intel source"
        onClick={() => setOpen(!open)}
        onKeyDown={handleKeyDown}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.04)',
          cursor: 'pointer',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 11,
          color: sourceFilter ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
          textAlign: 'left',
        }}
      >
        {selectedSource && (
          <div
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: STATUS_COLORS[selectedSource.status] ?? STATUS_COLORS.disabled,
              flexShrink: 0,
            }}
          />
        )}
        <span className="flex-1 truncate">{displayLabel}</span>
        <span style={{ color: 'rgba(255, 255, 255, 0.12)', fontSize: 9 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Intel sources"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(10, 14, 24, 0.95)',
            backdropFilter: 'blur(16px)',
            zIndex: 10,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {/* All Sources option */}
          <button
            type="button"
            role="option"
            aria-selected={sourceFilter === null}
            onClick={() => { setSourceFilter(null); setOpen(false) }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              width: '100%',
              padding: '6px 10px',
              background: sourceFilter === null ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 11,
              color: sourceFilter === null ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
              textAlign: 'left',
            }}
          >
            All Sources
          </button>

          {sources.map((source) => (
            <button
              key={source.sourceKey}
              type="button"
              role="option"
              aria-selected={sourceFilter === source.sourceKey}
              onClick={() => { setSourceFilter(source.sourceKey); setOpen(false) }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '6px 10px',
                background: sourceFilter === source.sourceKey ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 11,
                color: sourceFilter === source.sourceKey ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: STATUS_COLORS[source.status] ?? STATUS_COLORS.disabled,
                  flexShrink: 0,
                }}
              />
              <span className="flex-1 truncate">{source.name}</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.1)', fontSize: 9 }}>
                {source.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bbox Toggle
// ---------------------------------------------------------------------------

function BboxToggle() {
  const enabled = useCoverageStore((s) => s.districtBboxEnabled)
  const setEnabled = useCoverageStore((s) => s.setDistrictBboxEnabled)

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Filter to viewport"
        onClick={() => setEnabled(!enabled)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Toggle track */}
        <div
          style={{
            width: 28,
            height: 14,
            borderRadius: 7,
            backgroundColor: enabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${enabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.06)'}`,
            position: 'relative',
            transition: 'background-color 150ms, border-color 150ms',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: enabled ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)',
              position: 'absolute',
              top: 1,
              left: enabled ? 15 : 1,
              transition: 'left 150ms, background-color 150ms',
            }}
          />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 11,
            color: enabled ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)',
          }}
        >
          Filter to Viewport
        </span>
      </button>
      <p
        style={{
          ...GHOST,
          marginTop: 4,
          lineHeight: 1.4,
          maxWidth: 180,
        }}
      >
        Constrains map data to the visible area. Auto-updates on pan/zoom.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DistrictFilterPanel({
  categoryId,
  mapRef,
  onBboxChange,
}: DistrictFilterPanelProps) {
  const enabled = useCoverageStore(coverageSelectors.districtBboxEnabled)
  const { bbox } = useMapBbox({ mapRef, enabled })

  // Propagate bbox changes to parent
  useEffect(() => {
    onBboxChange(bbox)
  }, [bbox, onBboxChange])

  return (
    <motion.div
      id="district-filter-panel"
      role="region"
      aria-label="District view filters"
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        top: 85,
        left: '50%',
        transform: 'translateX(-50%)',
        maxWidth: 480,
        width: '90%',
        zIndex: 33,
        borderRadius: 10,
        border: '1px solid rgba(255, 255, 255, 0.06)',
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(16px) saturate(130%)',
        padding: '16px 20px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', gap: 32 }}>
        {/* Source section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...GHOST, display: 'block', marginBottom: 8 }}>
            SOURCE
          </span>
          <SourceDropdown categoryId={categoryId} />
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            alignSelf: 'stretch',
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Bbox section */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...GHOST, display: 'block', marginBottom: 8 }}>
            GEOGRAPHIC
          </span>
          <BboxToggle />
        </div>
      </div>
    </motion.div>
  )
}
