/**
 * DistrictViewDock -- glass panel with district information and controls.
 *
 * Position mirrors based on `panelSide`: docks to the right for
 * right-opening districts, left for left-opening districts.
 *
 * @module district-view-dock
 */

'use client'

import { useCallback } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { DISTRICTS, type NodeId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Station configuration per district
// ---------------------------------------------------------------------------

interface StationConfig {
  readonly description: string
  readonly url: string | null
  readonly stations: readonly string[]
}

const STATION_CONFIG: Record<string, StationConfig> = {
  'agent-builder': {
    description: 'Web IDE for creating and managing AI agents',
    url: 'http://localhost:3000',
    stations: ['Launch', 'Status', 'Pipeline', 'Library'],
  },
  'tarva-chat': {
    description: 'Multi-agent chat interface',
    url: 'http://localhost:4000',
    stations: ['Launch', 'Status', 'Conversations', 'Agents'],
  },
  'project-room': {
    description: 'Agent orchestration and project management',
    url: 'http://localhost:3005',
    stations: ['Launch', 'Status', 'Runs', 'Artifacts', 'Governance'],
  },
  'tarva-core': {
    description: 'Autonomous reasoning engine',
    url: null,
    stations: ['Status', 'Sessions'],
  },
  'tarva-erp': {
    description: 'Manufacturing ERP frontend',
    url: 'http://localhost:3002',
    stations: ['Status', 'Manufacturing'],
  },
  'tarva-code': {
    description: 'AI conversation knowledge management',
    url: null,
    stations: ['Status'],
  },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewDockProps {
  readonly districtId: string
  readonly panelSide: PanelSide
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewDock({ districtId, panelSide }: DistrictViewDockProps) {
  const district = DISTRICTS.find((d) => d.id === districtId)
  const displayName = district?.displayName ?? districtId
  const port = district?.port ?? null
  const config = STATION_CONFIG[districtId]

  const isRight = panelSide === 'right'
  const slideFrom = isRight ? 40 : -40

  const handleOpenApp = useCallback(() => {
    if (config?.url) {
      window.open(config.url, '_blank', 'noopener,noreferrer')
    }
  }, [config?.url])

  return (
    <motion.div
      className={cn(
        'fixed top-[42px] bottom-0 w-[360px]',
        isRight ? 'right-0 border-l' : 'left-0 border-r',
        'border-white/[0.06]',
        'backdrop-blur-[16px] backdrop-saturate-[130%]',
        'overflow-y-auto',
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        zIndex: 31,
        pointerEvents: 'auto',
      }}
      initial={{ x: slideFrom, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: slideFrom, opacity: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.1,
      }}
    >
      <div className="flex flex-col gap-0 px-6 pt-8 pb-8">
        {/* District name */}
        <span
          className="block font-mono text-[18px] font-medium tracking-[0.08em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.3)' }}
        >
          {displayName}
        </span>

        {/* Port if applicable */}
        {port !== null && (
          <span
            className="mt-1 block font-mono text-[11px] tracking-wider"
            style={{ color: 'rgba(14, 165, 233, 0.2)' }}
          >
            localhost:{port}
          </span>
        )}

        {/* Description */}
        <p
          className="mt-4 font-mono text-[11px] leading-[1.5]"
          style={{ color: 'rgba(255, 255, 255, 0.25)' }}
        >
          {config?.description}
        </p>

        {/* Open button (if URL exists) */}
        {config?.url && (
          <button
            onClick={handleOpenApp}
            className={cn(
              'mt-5 w-full rounded-md py-2',
              'border border-white/[0.06]',
              'bg-white/[0.04]',
              'font-mono text-[9px] font-medium tracking-[0.1em] uppercase',
              'transition-all duration-200',
              'hover:border-white/[0.12] hover:bg-white/[0.06]',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-[var(--color-ember-bright)]',
            )}
            style={{
              color: 'rgba(255, 255, 255, 0.35)',
              pointerEvents: 'auto',
            }}
          >
            Open {displayName}
          </button>
        )}

        {/* Separator */}
        <div
          className="my-5"
          style={{
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Status section */}
        <div className="flex flex-col gap-2">
          <span
            className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            STATUS
          </span>
          <div className="flex items-center gap-2">
            <div
              className="district-health-dot-pulse"
              style={{
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: 'var(--color-healthy, #22c55e)',
                flexShrink: 0,
              }}
            />
            <span
              className="font-mono text-[11px]"
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
              Operational
            </span>
          </div>
        </div>

        {/* Separator */}
        <div
          className="my-5"
          style={{
            height: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
          }}
        />

        {/* Stations list */}
        <div className="flex flex-col gap-3">
          <span
            className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            STATIONS
          </span>
          <div className="flex flex-wrap gap-2">
            {config?.stations.map((station) => (
              <span
                key={station}
                className={cn(
                  'rounded-md px-2.5 py-1',
                  'border border-white/[0.06]',
                  'bg-white/[0.02]',
                  'font-mono text-[9px] tracking-[0.08em] uppercase',
                )}
                style={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                {station}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
