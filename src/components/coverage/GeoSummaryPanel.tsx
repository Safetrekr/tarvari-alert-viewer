'use client'

/**
 * GeoSummaryPanel -- geographic intelligence slide-over panel.
 *
 * 560px slide-over from the right edge at z-42. Displays AI-generated
 * threat assessments at three geographic levels (World, Region, Country).
 * The content hierarchy follows the 11 travel-security regions from AD-7.
 *
 * Sub-components are co-located in this file because they share types,
 * constants, and styling that are specific to this panel.
 *
 * @module GeoSummaryPanel
 * @see WS-4.3
 * @see AD-3 (560px slide-over, z-42)
 * @see AD-7 (11 travel-security regions)
 * @see AD-8 (threat picture lives here)
 * @see R10 (mutual exclusion with DistrictViewOverlay)
 */

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  X,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  AlertTriangle,
  MapPin,
  Clock,
  RefreshCw,
} from 'lucide-react'

import { useLatestGeoSummary, type GeoSummary, type StructuredBreakdown, type KeyEvent } from '@/hooks/use-geo-summaries'
import { useThreatPicture, type RegionBreakdown } from '@/hooks/use-threat-picture'
import { useCoverageStore } from '@/stores/coverage.store'
import { useUIStore } from '@/stores/ui.store'
import {
  type ThreatLevel,
  type TrendDirection,
  type GeoLevel,
  type SummaryType,
  GEO_REGION_KEYS,
  GEO_REGION_META,
  type GeoRegionKey,
  getGeoDisplayName,
  getCategoryMeta,
  SEVERITY_COLORS,
  SEVERITY_LEVELS,
  type SeverityLevel,
} from '@/lib/interfaces/coverage'

// ============================================================================
// Props
// ============================================================================

export interface GeoSummaryPanelProps {
  onClose: () => void
}

// ============================================================================
// Constants
// ============================================================================

const THREAT_LEVEL_CONFIG: Record<ThreatLevel, { label: string; color: string; bgColor: string; borderColor: string }> = {
  LOW:      { label: 'LOW',      color: 'rgba(34, 197, 94, 0.7)',  bgColor: 'rgba(34, 197, 94, 0.08)',  borderColor: 'rgba(34, 197, 94, 0.2)' },
  MODERATE: { label: 'MODERATE', color: 'rgba(234, 179, 8, 0.7)',  bgColor: 'rgba(234, 179, 8, 0.08)',  borderColor: 'rgba(234, 179, 8, 0.2)' },
  ELEVATED: { label: 'ELEVATED', color: 'rgba(249, 115, 22, 0.7)', bgColor: 'rgba(249, 115, 22, 0.08)', borderColor: 'rgba(249, 115, 22, 0.2)' },
  HIGH:     { label: 'HIGH',     color: 'rgba(239, 68, 68, 0.7)',  bgColor: 'rgba(239, 68, 68, 0.08)',  borderColor: 'rgba(239, 68, 68, 0.2)' },
  CRITICAL: { label: 'CRITICAL', color: 'rgba(220, 38, 38, 0.9)',  bgColor: 'rgba(220, 38, 38, 0.12)', borderColor: 'rgba(220, 38, 38, 0.3)' },
}

const GHOST: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
  fontSize: 10,
  color: 'rgba(255, 255, 255, 0.15)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  marginBottom: 8,
  fontWeight: 500,
}

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

// ============================================================================
// Utility sub-components
// ============================================================================

function SectionDivider() {
  return (
    <div
      style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)', margin: '20px 0' }}
      aria-hidden="true"
    />
  )
}

function GhostLabel({ children }: { children: React.ReactNode }) {
  return <div style={GHOST}>{children}</div>
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ', ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC'
  } catch {
    return iso
  }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') return <TrendingUp size={12} style={{ color: 'rgba(239, 68, 68, 0.6)' }} />
  if (trend === 'down') return <TrendingDown size={12} style={{ color: 'rgba(34, 197, 94, 0.6)' }} />
  return <Minus size={12} style={{ color: 'rgba(156, 163, 175, 0.4)' }} />
}

// ============================================================================
// Panel Header
// ============================================================================

function GeoBreadcrumb({
  level,
  geoKey,
  onNavigate,
}: {
  level: GeoLevel
  geoKey: string
  onNavigate: (level: GeoLevel, key: string) => void
}) {
  const segments: { label: string; onClick?: () => void }[] = []

  if (level === 'world') {
    segments.push({ label: 'World' })
  } else if (level === 'region') {
    segments.push({ label: 'World', onClick: () => onNavigate('world', 'world') })
    segments.push({ label: getGeoDisplayName('region', geoKey) })
  } else {
    segments.push({ label: 'World', onClick: () => onNavigate('world', 'world') })
    // We don't know which region this country belongs to, so we show just the country
    segments.push({ label: getGeoDisplayName('country', geoKey) })
  }

  return (
    <nav aria-label="Geographic breadcrumb" style={{ flex: 1 }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: 4, listStyle: 'none', margin: 0, padding: 0 }}>
        {segments.map((seg, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && (
              <span style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.12)' }}>&gt;</span>
            )}
            {seg.onClick ? (
              <button
                type="button"
                onClick={seg.onClick}
                style={{
                  ...MONO,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.25)',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)' }}
              >
                {seg.label}
              </button>
            ) : (
              <span style={{ ...MONO, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.4)' }}>
                {seg.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function SummaryTypeToggle({
  value,
  onChange,
}: {
  value: SummaryType
  onChange: (type: SummaryType) => void
}) {
  const types: SummaryType[] = ['hourly', 'daily']
  return (
    <div style={{ display: 'flex', gap: 2, borderRadius: 6, padding: 2, background: 'rgba(255, 255, 255, 0.03)' }}>
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          style={{
            ...MONO,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: value === t ? 600 : 400,
            color: value === t ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.2)',
            background: value === t ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            border: 'none',
            borderRadius: 4,
            padding: '4px 8px',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function PanelHeader({
  level,
  geoKey,
  summaryType,
  closeRef,
  onClose,
  onNavigate,
  onTypeChange,
}: {
  level: GeoLevel
  geoKey: string
  summaryType: SummaryType
  closeRef: React.RefObject<HTMLButtonElement | null>
  onClose: () => void
  onNavigate: (level: GeoLevel, key: string) => void
  onTypeChange: (type: SummaryType) => void
}) {
  return (
    <div
      style={{
        padding: '16px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close geographic summary"
        style={{
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'rgba(255, 255, 255, 0.35)',
          flexShrink: 0,
          transition: 'color 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.35)' }}
      >
        <X size={14} />
      </button>
      <GeoBreadcrumb level={level} geoKey={geoKey} onNavigate={onNavigate} />
      <SummaryTypeToggle value={summaryType} onChange={onTypeChange} />
    </div>
  )
}

// ============================================================================
// Content sections
// ============================================================================

function ThreatLevelBadge({ level }: { level: ThreatLevel }) {
  const config = THREAT_LEVEL_CONFIG[level]
  return (
    <div
      role="status"
      aria-label={`Current threat level: ${level}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        borderRadius: 8,
        background: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        marginBottom: 16,
      }}
    >
      <Shield size={16} style={{ color: config.color, flexShrink: 0 }} />
      <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.15)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        Threat Level
      </span>
      <span style={{ ...MONO, fontSize: 12, fontWeight: 700, color: config.color, letterSpacing: '0.1em', textTransform: 'uppercase', marginLeft: 'auto' }}>
        {config.label}
      </span>
    </div>
  )
}

function SummaryTimestamp({ generatedAt, validatedAt }: { generatedAt: string; validatedAt: string | null }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        ...MONO,
        fontSize: 9,
        color: 'rgba(255, 255, 255, 0.15)',
        letterSpacing: '0.04em',
        marginBottom: 16,
        flexWrap: 'wrap',
      }}
    >
      <RefreshCw size={10} style={{ flexShrink: 0 }} />
      <span>Generated: {formatTimestamp(generatedAt)}</span>
      <span style={{ color: 'rgba(255, 255, 255, 0.08)' }}>|</span>
      {validatedAt ? (
        <span>Validated: {formatTimestamp(validatedAt)}</span>
      ) : (
        <span style={{ color: 'rgba(234, 179, 8, 0.3)' }}>Awaiting validation</span>
      )}
    </div>
  )
}

/**
 * Parse a lightweight markdown string into an array of React nodes.
 * Handles: ## headings, **bold**, - bullet lists, blank-line paragraphs.
 */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let bulletBuffer: string[] = []
  let key = 0

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return
    nodes.push(
      <ul key={key++} style={{ margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {bulletBuffer.map((item, i) => (
          <li key={i} style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, lineHeight: 1.65 }}>
            {inlineBold(item)}
          </li>
        ))}
      </ul>,
    )
    bulletBuffer = []
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // Blank line — flush bullets, add spacing
    if (line.trim() === '') {
      flushBullets()
      continue
    }

    // Heading (## or ###)
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      flushBullets()
      nodes.push(
        <div
          key={key++}
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.5)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginTop: nodes.length > 0 ? 12 : 0,
            marginBottom: 4,
          }}
        >
          {headingMatch[1]}
        </div>,
      )
      continue
    }

    // Bullet item (- or *)
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/)
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1])
      continue
    }

    // Numbered list (1. 2. etc.)
    const numberedMatch = line.match(/^\s*\d+\.\s+(.+)$/)
    if (numberedMatch) {
      bulletBuffer.push(numberedMatch[1])
      continue
    }

    // Regular paragraph line
    flushBullets()
    nodes.push(
      <p key={key++} style={{ margin: '4px 0', color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, lineHeight: 1.7 }}>
        {inlineBold(line)}
      </p>,
    )
  }

  flushBullets()
  return nodes
}

/** Replace **bold** spans with styled <strong> elements. */
function inlineBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.55)' }}>
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function ExecutiveSummary({ text }: { text: string }) {
  const rendered = useMemo(() => renderMarkdown(text), [text])

  return (
    <div>
      <GhostLabel>Executive Summary</GhostLabel>
      <div
        style={{
          ...MONO,
          letterSpacing: '0.01em',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: 8,
          padding: '16px 18px',
        }}
      >
        {rendered}
      </div>
    </div>
  )
}

function WhatsChangedSection({ keyEvents, summaryType }: { keyEvents: KeyEvent[]; summaryType: SummaryType }) {
  return (
    <details open={summaryType === 'hourly'}>
      <summary
        style={{
          ...GHOST,
          marginBottom: 12,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          listStyle: 'none',
        }}
      >
        <Clock size={12} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
        <span>{"What's Changed"}</span>
      </summary>
      {keyEvents.length === 0 ? (
        <div style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.2)' }}>
          No significant changes in the last hour.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {keyEvents.slice(0, 10).map((event, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 0',
                borderBottom: i < keyEvents.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : undefined,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: SEVERITY_COLORS[event.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown,
                  flexShrink: 0,
                }}
              />
              <span style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.02em', flex: 1, minWidth: 0 }}>
                {event.title}
              </span>
              <span style={{ ...MONO, fontSize: 9, color: getCategoryMeta(event.category).color, letterSpacing: '0.06em', flexShrink: 0 }}>
                {getCategoryMeta(event.category).shortName}
              </span>
              <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', letterSpacing: '0.04em', flexShrink: 0 }}>
                {relativeTime(event.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </details>
  )
}

// ============================================================================
// Structured Breakdown sections
// ============================================================================

function CategoryBreakdownChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
  const maxCount = entries.length > 0 ? entries[0][1] : 1

  if (entries.length === 0) return null

  return (
    <div>
      <GhostLabel>Threats by Category</GhostLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {entries.map(([category, count]) => {
          const meta = getCategoryMeta(category)
          const pct = (count / maxCount) * 100
          return (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 500,
                  color: meta.color,
                  opacity: 0.6,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  width: 36,
                  flexShrink: 0,
                }}
              >
                {meta.shortName}
              </span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)' }}>
                <div
                  style={{
                    width: `${pct}%`,
                    height: '100%',
                    borderRadius: 3,
                    background: meta.color,
                    opacity: 0.4,
                  }}
                />
              </div>
              <span
                style={{
                  ...MONO,
                  fontSize: 10,
                  color: 'rgba(255, 255, 255, 0.3)',
                  letterSpacing: '0.04em',
                  fontVariantNumeric: 'tabular-nums',
                  width: 24,
                  textAlign: 'right',
                  flexShrink: 0,
                }}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SeverityDistributionBar({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  const orderedSeverities = SEVERITY_LEVELS.filter((s) => (data[s] ?? 0) > 0)

  return (
    <div>
      <GhostLabel>Severity Distribution</GhostLabel>
      <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
        {orderedSeverities.map((sev) => {
          const count = data[sev] ?? 0
          const pct = (count / total) * 100
          return (
            <div
              key={sev}
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: SEVERITY_COLORS[sev],
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
        {orderedSeverities.map((sev) => (
          <span key={sev} style={{ ...MONO, fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: SEVERITY_COLORS[sev] }}>{sev}</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.25)' }}>{data[sev]}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

function KeyEventsList({ events }: { events: KeyEvent[] }) {
  if (events.length === 0) return null

  return (
    <div>
      <GhostLabel>Key Events</GhostLabel>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {events.slice(0, 10).map((event, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              padding: '8px 0',
              borderBottom: i < Math.min(events.length, 10) - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : undefined,
            }}
          >
            <span
              style={{
                ...MONO,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: SEVERITY_COLORS[event.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown,
                padding: '1px 5px',
                borderRadius: 3,
                border: `1px solid ${SEVERITY_COLORS[event.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown}`,
                opacity: 0.7,
                flexShrink: 0,
              }}
            >
              {event.severity}
            </span>
            <span style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.02em', flex: 1, minWidth: 0 }}>
              {event.title}
              <span style={{ ...MONO, fontSize: 9, color: getCategoryMeta(event.category).color, marginLeft: 6 }}>
                ({getCategoryMeta(event.category).shortName})
              </span>
            </span>
            <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', letterSpacing: '0.04em', flexShrink: 0 }}>
              {relativeTime(event.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RecommendationsList({ items }: { items: string[] }) {
  return (
    <div>
      <GhostLabel>Recommendations</GhostLabel>
      {items.length === 0 ? (
        <div style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.2)' }}>
          No specific recommendations at this time.
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.04)',
            borderRadius: 8,
            padding: '14px 16px',
          }}
        >
          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((text, i) => (
              <li key={i} style={{ display: 'flex', gap: 8 }}>
                <span style={{ ...MONO, fontSize: 10, color: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }}>
                  {i + 1}.
                </span>
                <span style={{ ...MONO, fontSize: 11, lineHeight: 1.6, color: 'rgba(255, 255, 255, 0.35)', letterSpacing: '0.01em' }}>
                  {text}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Drill-down sections
// ============================================================================

function RegionDrillDown({
  regionData,
  onDrillDown,
}: {
  regionData: RegionBreakdown[]
  onDrillDown: (key: string) => void
}) {
  const regionMap = useMemo(
    () => new Map(regionData.map((r) => [r.region, r])),
    [regionData],
  )

  return (
    <div>
      <GhostLabel>Regions</GhostLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {GEO_REGION_KEYS.map((key) => {
          const meta = GEO_REGION_META[key]
          const data = regionMap.get(key)
          const alertCount = data?.alertCount ?? 0
          const trend = data?.trend ?? 'stable'
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDrillDown(key)}
              aria-label={`View threat summary for ${meta.displayName}, ${alertCount} alerts`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '12px 14px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 150ms ease, border-color 150ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.10)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ ...MONO, fontSize: 11, fontWeight: 500, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.04em' }}>
                  {meta.displayName}
                </span>
                <TrendIcon trend={trend} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', letterSpacing: '0.04em' }}>
                  {alertCount} alerts
                </span>
                <ChevronRight size={12} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// Loading / Error / Empty states
// ============================================================================

function SkeletonLine({ width }: { width: string }) {
  return (
    <div
      style={{
        height: 10,
        width,
        borderRadius: 4,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)',
        backgroundSize: '600px 100%',
        animation: 'geo-panel-shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

function PanelSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`@keyframes geo-panel-shimmer { 0% { background-position: -300px 0; } 100% { background-position: 300px 0; } }`}</style>
      {/* Threat badge skeleton */}
      <SkeletonLine width="160px" />
      {/* Summary lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="100%" />
        <SkeletonLine width="90%" />
        <SkeletonLine width="70%" />
      </div>
      {/* Bar chart skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[80, 60, 40, 25].map((w, i) => (
          <SkeletonLine key={i} width={`${w}%`} />
        ))}
      </div>
      {/* Events skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SkeletonLine width="95%" />
        <SkeletonLine width="85%" />
        <SkeletonLine width="75%" />
      </div>
    </div>
  )
}

function PanelError({ onRetry, level, geoKey }: { onRetry: () => void; level: GeoLevel; geoKey: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      <AlertTriangle size={24} style={{ color: 'rgba(239, 68, 68, 0.5)' }} />
      <div style={{ ...MONO, fontSize: 13, fontWeight: 500, color: 'rgba(255, 255, 255, 0.4)', letterSpacing: '0.04em' }}>
        Failed to load summary
      </div>
      <div style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.25)', letterSpacing: '0.02em', lineHeight: 1.6 }}>
        The threat summary for {getGeoDisplayName(level, geoKey)} could not be retrieved.
      </div>
      <button
        type="button"
        onClick={onRetry}
        style={{
          ...MONO,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 6,
          padding: '6px 14px',
          color: 'rgba(255, 255, 255, 0.4)',
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Retry
      </button>
    </div>
  )
}

function PanelEmpty({ level, geoKey }: { level: GeoLevel; geoKey: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      <MapPin size={24} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
      <div style={{ ...MONO, fontSize: 13, fontWeight: 500, color: 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.04em' }}>
        No summary available
      </div>
      <div style={{ ...MONO, fontSize: 11, color: 'rgba(255, 255, 255, 0.2)', letterSpacing: '0.02em', lineHeight: 1.6 }}>
        A threat summary for {getGeoDisplayName(level, geoKey)} has not been generated yet.
        Summaries are generated periodically by the intelligence system.
      </div>
    </div>
  )
}

// ============================================================================
// Summary content
// ============================================================================

function SummaryContent({
  summary,
  summaryType,
  level,
  regionData,
  onDrillDown,
}: {
  summary: GeoSummary
  summaryType: SummaryType
  level: GeoLevel
  regionData: RegionBreakdown[]
  onDrillDown: (level: GeoLevel, key: string) => void
}) {
  const { structuredBreakdown } = summary

  const handleRegionDrillDown = useCallback(
    (key: string) => onDrillDown('region', key),
    [onDrillDown],
  )

  return (
    <>
      <ThreatLevelBadge level={summary.threatLevel} />
      <SummaryTimestamp generatedAt={summary.generatedAt} validatedAt={summary.validatedAt} />
      <ExecutiveSummary text={summary.summaryText} />

      <SectionDivider />
      <WhatsChangedSection keyEvents={structuredBreakdown.keyEvents} summaryType={summaryType} />

      <SectionDivider />
      <CategoryBreakdownChart data={structuredBreakdown.threatsByCategory} />

      <SectionDivider />
      <SeverityDistributionBar data={structuredBreakdown.severityDistribution} />

      <SectionDivider />
      <KeyEventsList events={structuredBreakdown.keyEvents} />

      <SectionDivider />
      <RecommendationsList items={structuredBreakdown.recommendations} />

      {level === 'world' && (
        <>
          <SectionDivider />
          <RegionDrillDown regionData={regionData} onDrillDown={handleRegionDrillDown} />
        </>
      )}
    </>
  )
}

// ============================================================================
// Main component
// ============================================================================

export function GeoSummaryPanel({ onClose }: GeoSummaryPanelProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Store state
  const geoSummaryOpen = useCoverageStore((s) => s.geoSummaryOpen)
  const summaryGeoLevel = useCoverageStore((s) => s.summaryGeoLevel)
  const summaryGeoKey = useCoverageStore((s) => s.summaryGeoKey)
  const summaryType = useCoverageStore((s) => s.summaryType)
  const drillDownGeo = useCoverageStore((s) => s.drillDownGeo)
  const setSummaryType = useCoverageStore((s) => s.setSummaryType)

  // Data hooks
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useLatestGeoSummary(
    geoSummaryOpen ? summaryGeoLevel : null,
    geoSummaryOpen ? summaryGeoKey : null,
  )

  const { data: threatPicture } = useThreatPicture()
  const regionData = threatPicture?.byRegion ?? []

  // Morph mutual exclusion (R10)
  const morphPhase = useUIStore((s) => s.morph.phase)
  const closeGeoSummary = useCoverageStore((s) => s.closeGeoSummary)

  useEffect(() => {
    if (morphPhase === 'entering-district' || morphPhase === 'district') {
      closeGeoSummary()
    }
  }, [morphPhase, closeGeoSummary])

  // Focus close button when panel opens
  useEffect(() => {
    if (geoSummaryOpen) {
      requestAnimationFrame(() => closeRef.current?.focus())
    }
  }, [geoSummaryOpen])

  // Navigation within panel
  const handleNavigate = useCallback(
    (level: GeoLevel, key: string) => {
      if (level === 'world') {
        drillDownGeo('world', 'world')
      } else {
        drillDownGeo(level, key)
      }
    },
    [drillDownGeo],
  )

  // Determine content state — null means no summary exists for this scope
  const isEmpty = !isLoading && !isError && (!summary || !summary.summaryText)

  // Reduced motion
  const prefersReducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 }

  return (
    <AnimatePresence>
      {geoSummaryOpen && (
        <motion.div
          key="geo-summary-panel"
          initial={{ x: 560, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 560, opacity: 0 }}
          transition={transition}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 560,
            background: 'rgba(5, 9, 17, 0.96)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
            zIndex: 42,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          role="dialog"
          aria-label="Geographic threat summary"
          aria-modal="false"
        >
          <PanelHeader
            level={summaryGeoLevel}
            geoKey={summaryGeoKey}
            summaryType={summaryType}
            closeRef={closeRef}
            onClose={onClose}
            onNavigate={handleNavigate}
            onTypeChange={setSummaryType}
          />
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 20,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(255, 255, 255, 0.06) transparent',
            }}
          >
            {isLoading && <PanelSkeleton />}
            {isError && <PanelError onRetry={() => refetch()} level={summaryGeoLevel} geoKey={summaryGeoKey} />}
            {isEmpty && <PanelEmpty level={summaryGeoLevel} geoKey={summaryGeoKey} />}
            {!isLoading && !isError && summary && summary.summaryText && (
              <SummaryContent
                summary={summary}
                summaryType={summaryType}
                level={summaryGeoLevel}
                regionData={regionData}
                onDrillDown={handleNavigate}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
