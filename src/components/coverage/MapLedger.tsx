'use client'

/**
 * MapLedger -- Legend panel for the global coverage map.
 *
 * Compact at Z1: shows title + section labels only.
 * Expanded at Z2+: reveals severity colors, cluster info, category grid.
 *
 * @module MapLedger
 */

import { useSemanticZoom } from '@/hooks/use-semantic-zoom'
import { SEVERITY_MAP_COLORS } from './map-utils'
import { KNOWN_CATEGORIES, type CategoryMeta } from '@/lib/interfaces/coverage'

// ---------------------------------------------------------------------------
// Section components (expanded view)
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="font-mono text-[10px] tracking-[0.14em] text-[rgba(255,255,255,0.25)] uppercase mb-2">
      {children}
    </div>
  )
}

function SeverityRow({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="shrink-0 rounded-full"
        style={{ width: 8, height: 8, backgroundColor: color }}
      />
      <span className="font-mono text-[10px] tracking-wider text-[rgba(255,255,255,0.4)]">
        {label}
      </span>
    </div>
  )
}

function CategoryRow({ meta }: { meta: CategoryMeta }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="shrink-0 rounded-sm"
        style={{ width: 6, height: 6, backgroundColor: meta.color }}
      />
      <span className="font-mono text-[10px] tracking-wider text-[rgba(255,255,255,0.35)]">
        {meta.shortName}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Compact label row (Z1)
// ---------------------------------------------------------------------------

function CompactLabel({ children }: { children: string }) {
  return (
    <span className="font-mono text-[10px] tracking-[0.10em] text-[rgba(255,255,255,0.20)] uppercase">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MapLedger() {
  const { isAtrium } = useSemanticZoom()
  const compact = isAtrium // Z1 = compact, Z2+ = expanded

  const severityEntries = Object.entries(SEVERITY_MAP_COLORS)

  return (
    <div
      className="flex flex-col rounded-xl border px-4 py-4
        bg-[rgba(var(--ambient-ink-rgb),0.05)] backdrop-blur-[12px] backdrop-saturate-[120%]
        border-[rgba(var(--ambient-ink-rgb),0.10)] transition-all duration-300"
      style={{ width: compact ? 140 : 160, gap: compact ? 8 : 16 }}
    >
      {/* Title */}
      <div className="font-mono text-[11px] font-bold tracking-[0.12em] text-[rgba(255,255,255,0.5)] uppercase">
        Map Ledger
      </div>

      {compact ? (
        /* Compact: just section names */
        <>
          <CompactLabel>Severity</CompactLabel>
          <CompactLabel>Clusters</CompactLabel>
          <CompactLabel>Categories</CompactLabel>
        </>
      ) : (
        /* Expanded: full details */
        <>
          {/* Severity colors */}
          <div>
            <SectionHeader>Severity</SectionHeader>
            <div className="flex flex-col gap-1.5">
              {severityEntries.map(([label, color]) => (
                <SeverityRow key={label} label={label} color={color} />
              ))}
            </div>
          </div>

          {/* Clusters */}
          <div>
            <SectionHeader>Clusters</SectionHeader>
            <div className="flex items-center gap-2">
              <div
                className="shrink-0 flex items-center justify-center rounded-full"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                <span className="font-mono text-[8px] text-[rgba(255,255,255,0.5)]">n</span>
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[rgba(255,255,255,0.35)]">
                Grouped alerts
              </span>
            </div>
          </div>

          {/* Categories */}
          <div>
            <SectionHeader>Categories</SectionHeader>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              {KNOWN_CATEGORIES.map((meta) => (
                <CategoryRow key={meta.id} meta={meta} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
