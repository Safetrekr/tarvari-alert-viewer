'use client'

/**
 * ThreatPictureCard -- prominent wide threat posture card.
 *
 * Positioned above the Intel Monitoring panel in world-space. Uses a
 * horizontal 3-column layout: posture + counts | top threats + regions |
 * summary availability (hourly/daily, global + regions).
 *
 * Clicking opens the full GeoSummaryPanel (WS-4.3) slide-over.
 *
 * @module ThreatPictureCard
 * @see WS-4.5
 */

import { useMemo } from 'react'
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Clock,
  Calendar,
  Globe,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { useThreatPicture } from '@/hooks/use-threat-picture'
import { tarvariGet } from '@/lib/tarvari-api'
import { getCategoryMeta } from '@/lib/interfaces/coverage'
import { DATA_MODE } from '@/lib/data-mode'

// ============================================================================
// Constants
// ============================================================================

const MONO: React.CSSProperties = {
  fontFamily: 'var(--font-mono, monospace)',
}

const GHOST: React.CSSProperties = {
  ...MONO,
  fontSize: 9,
  color: 'rgba(255, 255, 255, 0.2)',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontWeight: 500,
}

type PostureLevel = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'GUARDED' | 'LOW'

const POSTURE_CONFIG: Record<PostureLevel, { color: string; bg: string; border: string }> = {
  CRITICAL: { color: 'rgba(220, 38, 38, 0.9)', bg: 'rgba(220, 38, 38, 0.10)', border: 'rgba(220, 38, 38, 0.25)' },
  HIGH:     { color: 'rgba(239, 68, 68, 0.8)', bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.20)' },
  ELEVATED: { color: 'rgba(249, 115, 22, 0.8)', bg: 'rgba(249, 115, 22, 0.08)', border: 'rgba(249, 115, 22, 0.20)' },
  GUARDED:  { color: 'rgba(234, 179, 8, 0.8)', bg: 'rgba(234, 179, 8, 0.06)', border: 'rgba(234, 179, 8, 0.15)' },
  LOW:      { color: 'rgba(34, 197, 94, 0.7)', bg: 'rgba(34, 197, 94, 0.06)', border: 'rgba(34, 197, 94, 0.15)' },
}

// ============================================================================
// Summary availability fetcher
// ============================================================================

interface SummaryIndexItem {
  geo_level: string
  geo_key: string
  summary_type: string
  generated_at: string
}

interface SummaryAvailability {
  global: { hourly: string | null; daily: string | null }
  regions: Array<{ key: string; type: string; generatedAt: string }>
}

async function fetchSummaryAvailability(): Promise<SummaryAvailability> {
  if (DATA_MODE === 'supabase') {
    return { global: { hourly: null, daily: null }, regions: [] }
  }

  const data = await tarvariGet<{ items: SummaryIndexItem[] }>('/console/summaries')
  const items = data.items ?? []

  let hourly: string | null = null
  let daily: string | null = null
  const regions: SummaryAvailability['regions'] = []

  for (const item of items) {
    if (item.geo_level === 'world') {
      if (item.summary_type === 'hourly' && !hourly) hourly = item.generated_at
      if (item.summary_type === 'daily' && !daily) daily = item.generated_at
    } else if (item.geo_level === 'region' || item.geo_level === 'country') {
      regions.push({
        key: item.geo_key,
        type: item.summary_type,
        generatedAt: item.generated_at,
      })
    }
  }

  return { global: { hourly, daily }, regions }
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ============================================================================
// Props
// ============================================================================

export interface ThreatPictureCardProps {
  onClick: () => void
}

// ============================================================================
// Component
// ============================================================================

export function ThreatPictureCard({ onClick }: ThreatPictureCardProps) {
  const { data: tp, isLoading } = useThreatPicture()

  const { data: summaryAvail } = useQuery({
    queryKey: ['summary-availability'],
    queryFn: fetchSummaryAvailability,
    enabled: DATA_MODE !== 'supabase',
    staleTime: 120_000,
    refetchInterval: 120_000,
  })

  // Derive posture from severity distribution
  const posture: PostureLevel = useMemo(() => {
    if (!tp) return 'LOW'
    const extreme = tp.bySeverity.find((s) => s.severity === 'Extreme')?.count ?? 0
    const severe = tp.bySeverity.find((s) => s.severity === 'Severe')?.count ?? 0
    if (extreme >= 10) return 'CRITICAL'
    if (extreme > 0 || severe >= 50) return 'HIGH'
    if (severe > 0) return 'ELEVATED'
    if (tp.totalActiveAlerts > 0) return 'GUARDED'
    return 'LOW'
  }, [tp])

  const ps = POSTURE_CONFIG[posture]

  const p1 = tp?.byPriority.find((p) => p.priority === 'P1')?.count ?? 0
  const p2 = tp?.byPriority.find((p) => p.priority === 'P2')?.count ?? 0

  const topCats = useMemo(() => (tp?.byCategory ?? []).slice(0, 4), [tp])
  const topRegions = useMemo(() => (tp?.byRegion ?? []).slice(0, 4), [tp])

  const trendIcon = tp?.overallTrend === 'up'
    ? <TrendingUp size={11} style={{ color: 'rgba(239, 68, 68, 0.6)' }} />
    : tp?.overallTrend === 'down'
      ? <TrendingDown size={11} style={{ color: 'rgba(34, 197, 94, 0.6)' }} />
      : <Minus size={11} style={{ color: 'rgba(156, 163, 175, 0.4)' }} />

  const trendLabel = tp?.trendDetail
    ? `${tp.trendDetail.delta > 0 ? '+' : ''}${tp.trendDetail.delta} (${tp.trendDetail.pctChange > 0 ? '+' : ''}${Math.round(tp.trendDetail.pctChange)}%)`
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Threat posture: ${posture}. ${tp?.totalActiveAlerts ?? 0} active alerts. Click for full briefing.`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        padding: '14px 16px',
        borderRadius: 14,
        border: `1px solid ${ps.border}`,
        background: ps.bg,
        backdropFilter: 'blur(12px) saturate(120%)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 200ms ease, background 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = ps.color
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = ps.border
      }}
    >
      {/* Row 1: Shield + THREAT POSTURE + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Shield size={13} style={{ color: ps.color, flexShrink: 0 }} />
        <span style={{ ...GHOST }}>Threat Posture</span>
        <span
          style={{
            ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: '0.10em',
            color: ps.color, padding: '2px 7px', borderRadius: 4,
            border: `1px solid ${ps.border}`, background: ps.bg,
          }}
        >
          {isLoading ? '---' : posture}
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trendIcon}
          {trendLabel && (
            <span style={{
              ...MONO, fontSize: 9,
              color: tp?.overallTrend === 'up' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.2)',
              letterSpacing: '0.04em',
            }}>
              {trendLabel}
            </span>
          )}
        </span>
      </div>

      {/* Row 2: Big number + P1/P2 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{
            ...MONO, fontSize: 24, fontWeight: 700,
            color: 'rgba(255, 255, 255, 0.6)', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {isLoading ? '--' : tp?.totalActiveAlerts ?? 0}
          </span>
          <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', letterSpacing: '0.06em' }}>
            ACTIVE
          </span>
        </div>

        <div style={{ width: 1, height: 20, background: 'rgba(255, 255, 255, 0.06)', flexShrink: 0 }} />

        {/* P1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            ...MONO, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
            color: p1 > 0 ? 'rgba(239, 68, 68, 0.7)' : 'rgba(255, 255, 255, 0.15)',
            padding: '1px 4px', borderRadius: 3,
            border: `1px solid ${p1 > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)'}`,
          }}>P1</span>
          <span style={{
            ...MONO, fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
            color: p1 > 0 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.15)',
          }}>{isLoading ? '--' : p1}</span>
        </div>

        {/* P2 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{
            ...MONO, fontSize: 8, fontWeight: 600, letterSpacing: '0.06em',
            color: p2 > 0 ? 'rgba(249, 115, 22, 0.6)' : 'rgba(255, 255, 255, 0.15)',
            padding: '1px 4px', borderRadius: 3,
            border: `1px solid ${p2 > 0 ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
          }}>P2</span>
          <span style={{
            ...MONO, fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
            color: p2 > 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)',
          }}>{isLoading ? '--' : p2}</span>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.04)' }} />

      {/* Row 3: Two-column — Top Threats | Top Regions */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Left: top categories */}
        {topCats.length > 0 && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...GHOST, marginBottom: 4 }}>Top Threats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {topCats.map((cat) => {
                const meta = getCategoryMeta(cat.category)
                return (
                  <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: meta.color, flexShrink: 0 }} />
                    <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {meta.displayName}
                    </span>
                    <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                      {cat.count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Separator */}
        {topCats.length > 0 && topRegions.length > 0 && (
          <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.04)', flexShrink: 0 }} />
        )}

        {/* Right: top regions */}
        {topRegions.length > 0 && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...GHOST, marginBottom: 4 }}>Top Regions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {topRegions.map((r) => (
                <div key={r.region} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.3)', letterSpacing: '0.04em', flex: 1 }}>
                    {r.region}
                  </span>
                  <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.2)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {r.alertCount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.04)' }} />

      {/* Row 4: Summary availability — Global + Regions */}
      <div>
        <div style={{ ...GHOST, marginBottom: 5 }}>Intelligence Summaries</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Global summary row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Globe size={10} style={{ color: 'rgba(255, 255, 255, 0.2)', flexShrink: 0 }} />
            <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.3)', flex: 1 }}>Global</span>
            <SummaryTypePill type="hourly" available={!!summaryAvail?.global.hourly} timestamp={summaryAvail?.global.hourly ?? null} />
            <SummaryTypePill type="daily" available={!!summaryAvail?.global.daily} timestamp={summaryAvail?.global.daily ?? null} />
          </div>

          {/* Region summaries */}
          {(summaryAvail?.regions ?? []).map((r) => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, flexShrink: 0 }} />
              <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.25)', flex: 1 }}>
                {r.key}
              </span>
              <SummaryTypePill
                type={r.type as 'hourly' | 'daily'}
                available
                timestamp={r.generatedAt}
              />
            </div>
          ))}

          {/* No summaries state */}
          {!summaryAvail?.global.hourly && !summaryAvail?.global.daily && (summaryAvail?.regions ?? []).length === 0 && (
            <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.15)' }}>
              No summaries generated yet
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingTop: 4, borderTop: '1px solid rgba(255, 255, 255, 0.04)',
      }}>
        <span style={{ ...MONO, fontSize: 9, color: 'rgba(255, 255, 255, 0.25)', letterSpacing: '0.10em', textTransform: 'uppercase' as const }}>
          Full Briefing
        </span>
        <ChevronRight size={10} style={{ color: 'rgba(255, 255, 255, 0.15)' }} />
      </div>
    </button>
  )
}

// ============================================================================
// Summary type pill
// ============================================================================

function SummaryTypePill({
  type,
  available,
  timestamp,
}: {
  type: 'hourly' | 'daily'
  available: boolean
  timestamp: string | null
}) {
  const Icon = type === 'hourly' ? Clock : Calendar
  const age = available && timestamp ? relativeTime(timestamp) : null

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '1px 5px',
        borderRadius: 3,
        border: `1px solid ${available ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)'}`,
        background: available ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
      }}
    >
      <Icon size={8} style={{ color: available ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)' }} />
      <span
        style={{
          ...MONO,
          fontSize: 8,
          fontWeight: 500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase' as const,
          color: available ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        }}
      >
        {type}
      </span>
      {age && (
        <span style={{ ...MONO, fontSize: 7, color: 'rgba(255, 255, 255, 0.15)' }}>
          {age}
        </span>
      )}
    </span>
  )
}
