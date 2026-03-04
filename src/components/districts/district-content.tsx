/**
 * DistrictContent -- renders station content inside the district shell.
 *
 * Maps each DistrictId to a set of lightweight station cards that show
 * key information for that district. Uses the telemetry store for
 * health status and the district-specific data hooks where available.
 *
 * This is the Phase 2 integration layer. Station cards render directly
 * without the full StationPanel framework (which requires templates +
 * receipt stores from Phase 3). Each card provides a launch button
 * and summary data.
 *
 * @module district-content
 * @see WS-2.2-2.5 (station components)
 * @see WS-2.6 (station panel framework, Phase 3 integration)
 */

'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { ExternalLink } from 'lucide-react'
import { Button } from '@tarva/ui'
import { useDistrictsStore } from '@/stores/districts.store'
import type { DistrictId } from '@/lib/interfaces/district'
import type { AppTelemetry } from '@/lib/telemetry-types'

// ============================================================================
// District Config
// ============================================================================

interface DistrictConfig {
  readonly displayName: string
  readonly url: string | null
  readonly port: string | null
  readonly description: string
  readonly stations: readonly string[]
}

const DISTRICT_CONFIG: Record<DistrictId, DistrictConfig> = {
  'agent-builder': {
    displayName: 'Agent Builder',
    url: 'http://localhost:3000',
    port: '3000',
    description: 'Web IDE for creating and managing AI agents',
    stations: ['Launch', 'Status', 'Pipeline', 'Library'],
  },
  'tarva-chat': {
    displayName: 'Tarva Chat',
    url: 'http://localhost:4000',
    port: '4000',
    description: 'Multi-agent chat interface',
    stations: ['Launch', 'Status', 'Conversations', 'Agents'],
  },
  'project-room': {
    displayName: 'Project Room',
    url: 'http://localhost:3005',
    port: '3005',
    description: 'Agent orchestration and project management',
    stations: ['Launch', 'Status', 'Runs', 'Artifacts', 'Governance'],
  },
  'tarva-core': {
    displayName: 'TarvaCORE',
    url: null,
    port: null,
    description: 'Electron desktop autonomous reasoning engine',
    stations: ['Status', 'Sessions'],
  },
  'tarva-erp': {
    displayName: 'TarvaERP',
    url: 'http://localhost:3002',
    port: '3002',
    description: 'Manufacturing ERP frontend',
    stations: ['Launch', 'Status', 'Manufacturing'],
  },
  'tarva-code': {
    displayName: 'tarvaCODE',
    url: null,
    port: null,
    description: 'AI conversation knowledge management (planning stage)',
    stations: ['Status'],
  },
}

// ============================================================================
// Health helpers
// ============================================================================

function getHealthColor(status: string | undefined): string {
  switch (status) {
    case 'OPERATIONAL':
      return 'var(--color-healthy, #22c55e)'
    case 'DEGRADED':
      return 'var(--color-warning, #eab308)'
    case 'DOWN':
      return 'var(--color-error, #ef4444)'
    default:
      return 'var(--color-offline, #6b7280)'
  }
}

function getHealthLabel(status: string | undefined): string {
  switch (status) {
    case 'OPERATIONAL':
      return 'Operational'
    case 'DEGRADED':
      return 'Degraded'
    case 'DOWN':
      return 'Down'
    case 'OFFLINE':
      return 'Offline'
    default:
      return 'Unknown'
  }
}

// ============================================================================
// Station Card (lightweight Phase 2 replacement for full StationPanel)
// ============================================================================

function StationCard({
  title,
  children,
  index,
}: {
  title: string
  children: React.ReactNode
  index: number
}) {
  return (
    <motion.div
      className="border-b border-white/[0.06] pb-5 last:border-b-0 last:pb-0"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <span className="mb-3 block font-sans text-[20px] font-semibold tracking-[0.06em] uppercase text-[var(--color-text-tertiary)]">
        {title}
      </span>
      {children}
    </motion.div>
  )
}

// ============================================================================
// District Content
// ============================================================================

interface DistrictContentProps {
  readonly districtId: DistrictId
}

export function DistrictContent({ districtId }: DistrictContentProps) {
  const config = DISTRICT_CONFIG[districtId]
  const telemetry = useDistrictsStore(
    (s) => s.districts[districtId] as AppTelemetry | undefined,
  )

  const handleLaunch = useCallback(() => {
    if (config.url) {
      window.open(config.url, '_blank', 'noopener,noreferrer')
    }
  }, [config.url])

  return (
    <div className="flex flex-col gap-4">
      {/* Launch Card */}
      <StationCard title="Launch" index={0}>
        <p className="mb-4 font-sans text-[24px] leading-relaxed text-[var(--color-text-secondary)]">
          {config.description}
        </p>
        {config.url ? (
          <Button
            variant="default"
            size="lg"
            onClick={handleLaunch}
            className="w-full text-[22px] py-5"
          >
            <ExternalLink className="mr-2 h-6 w-6" />
            Open {config.displayName}
          </Button>
        ) : (
          <span className="block text-center font-mono text-[20px] text-[var(--color-text-ghost)]">
            Desktop app — no web interface
          </span>
        )}
        {config.port && (
          <span className="mt-3 block text-center font-mono text-[18px] text-[var(--color-text-ghost)]">
            localhost:{config.port}
          </span>
        )}
      </StationCard>

      {/* Status Card */}
      <StationCard title="Status" index={1}>
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: getHealthColor(telemetry?.status) }}
          />
          <span className="font-sans text-[24px] text-[var(--color-text-primary)]">
            {getHealthLabel(telemetry?.status)}
          </span>
        </div>
        {telemetry?.responseTimeMs !== undefined && (
          <div className="mt-3 flex items-center justify-between">
            <span className="font-sans text-[20px] text-[var(--color-text-tertiary)]">
              Response time
            </span>
            <span className="font-mono text-[22px] text-[var(--color-text-secondary)] tabular-nums">
              {telemetry.responseTimeMs}ms
            </span>
          </div>
        )}
        {telemetry?.alertCount !== undefined && telemetry.alertCount > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <span className="font-sans text-[20px] text-[var(--color-text-tertiary)]">
              Alerts
            </span>
            <span className="font-mono text-[22px] text-[var(--color-error)] tabular-nums">
              {telemetry.alertCount}
            </span>
          </div>
        )}
      </StationCard>

      {/* Station list */}
      <StationCard title="Stations" index={2}>
        <div className="flex flex-wrap gap-3">
          {config.stations.map((station) => (
            <span
              key={station}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-1.5 font-sans text-[20px] text-[var(--color-text-tertiary)]"
            >
              {station}
            </span>
          ))}
        </div>
      </StationCard>
    </div>
  )
}
