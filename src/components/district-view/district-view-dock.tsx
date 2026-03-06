/**
 * DistrictViewDock -- glass panel showing category info or alert detail.
 *
 * When no alert is selected: shows category metadata (name, description,
 * source counts, geographic regions).
 *
 * When an alert is selected: shows full alert detail (title, severity,
 * summary, event type, source, confidence, geo scope, timestamps).
 *
 * @module district-view-dock
 * @see WS-3.1 Section 4.4
 */

'use client'

import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { getCategoryMeta, getCategoryColor, SEVERITY_COLORS, type SeverityLevel } from '@/lib/interfaces/coverage'
import { PriorityBadge } from '@/components/coverage/PriorityBadge'
import { useCoverageMetrics } from '@/hooks/use-coverage-metrics'
import { useCategoryIntel, type CategoryIntelItem } from '@/hooks/use-category-intel'
import type { NodeId } from '@/lib/interfaces/district'
import type { PanelSide } from '@/lib/morph-types'

// ---------------------------------------------------------------------------
// Timestamp formatter
// ---------------------------------------------------------------------------

function formatTimestamp(iso: string | null): string {
  if (!iso) return '--'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })
}

// ---------------------------------------------------------------------------
// Dock detail row
// ---------------------------------------------------------------------------

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span
        className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.15)' }}
      >
        {label}
      </span>
      <div
        className="font-mono text-[11px] leading-[1.5]"
        style={{ color: 'rgba(255, 255, 255, 0.25)' }}
      >
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alert Detail View
// ---------------------------------------------------------------------------

function AlertDetailView({
  alert,
  categoryColor,
  onDeselect,
}: {
  alert: CategoryIntelItem
  categoryColor: string
  onDeselect: () => void
}) {
  const severityColor =
    SEVERITY_COLORS[alert.severity as SeverityLevel] ?? SEVERITY_COLORS.Unknown

  return (
    <motion.div
      key="alert-detail"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-0 px-6 pt-8 pb-8"
    >
      {/* Back to category overview */}
      <button
        type="button"
        onClick={onDeselect}
        className="mb-4 flex items-center gap-2 self-start rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
        style={{
          color: 'rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)'
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.25)'
        }}
      >
        ← Category
      </button>

      {/* Severity badge */}
      <span
        className="mb-3 inline-block self-start rounded px-2 py-1 font-mono text-[10px] font-medium tracking-[0.06em] uppercase"
        style={{
          backgroundColor: `color-mix(in srgb, ${severityColor} 20%, transparent)`,
          color: severityColor,
          border: `1px solid color-mix(in srgb, ${severityColor} 30%, transparent)`,
        }}
      >
        {alert.severity}
      </span>

      {/* Priority badge -- labeled, all levels visible */}
      {alert.operationalPriority && (
        <PriorityBadge priority={alert.operationalPriority} size="lg" showLabel className="mb-3" />
      )}

      {/* Title */}
      <span
        className="block font-mono text-[14px] font-medium leading-[1.4]"
        style={{ color: 'rgba(255, 255, 255, 0.4)' }}
      >
        {alert.title}
      </span>

      {/* Separator */}
      <div
        className="my-5"
        style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
      />

      {/* Summary */}
      {alert.shortSummary && (
        <>
          <DetailRow label="Summary">
            <p style={{ color: 'rgba(255, 255, 255, 0.3)' }}>{alert.shortSummary}</p>
          </DetailRow>
          <div
            className="my-4"
            style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          />
        </>
      )}

      {/* Metadata grid */}
      <div className="flex flex-col gap-4">
        {alert.eventType && (
          <DetailRow label="Event Type">
            <span className="capitalize">{alert.eventType}</span>
          </DetailRow>
        )}

        {alert.sourceKey && (
          <DetailRow label="Source">
            {alert.sourceKey}
          </DetailRow>
        )}

        {alert.confidence != null && (
          <DetailRow label="Confidence">
            <div className="flex items-center gap-2">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: 60,
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${alert.confidence}%`,
                    backgroundColor: categoryColor,
                    opacity: 0.5,
                  }}
                />
              </div>
              <span>{alert.confidence}%</span>
            </div>
          </DetailRow>
        )}

        {alert.geoScope && alert.geoScope.length > 0 && (
          <DetailRow label="Geographic Scope">
            <div className="flex flex-wrap gap-1.5">
              {alert.geoScope.map((code) => (
                <span
                  key={code}
                  className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
                  style={{ color: 'rgba(255, 255, 255, 0.2)' }}
                >
                  {code}
                </span>
              ))}
            </div>
          </DetailRow>
        )}
      </div>

      {/* Separator */}
      <div
        className="my-5"
        style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
      />

      {/* Timestamps */}
      <div className="flex flex-col gap-3">
        <DetailRow label="Ingested">
          {formatTimestamp(alert.ingestedAt)}
        </DetailRow>
        <DetailRow label="Sent">
          {formatTimestamp(alert.sentAt)}
        </DetailRow>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Category Overview View (original dock content)
// ---------------------------------------------------------------------------

function CategoryOverviewView({ districtId }: { districtId: string }) {
  const meta = getCategoryMeta(districtId)
  const categoryColor = getCategoryColor(districtId)
  const { data: metrics } = useCoverageMetrics()
  const categoryData = metrics?.byCategory.find((c) => c.category === districtId)

  return (
    <motion.div
      key="category-overview"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-0 px-6 pt-8 pb-8"
    >
      {/* Category name */}
      <span
        className="block font-mono text-[18px] font-medium tracking-[0.08em] uppercase"
        style={{ color: 'rgba(255, 255, 255, 0.3)' }}
      >
        {meta.displayName}
      </span>

      {/* Category short code */}
      <span
        className="mt-1 block font-mono text-[11px] tracking-wider"
        style={{ color: categoryColor, opacity: 0.4 }}
      >
        {meta.shortName}
      </span>

      {/* Description */}
      <p
        className="mt-4 font-mono text-[11px] leading-[1.5]"
        style={{ color: 'rgba(255, 255, 255, 0.25)' }}
      >
        {meta.description}
      </p>

      {/* Separator */}
      <div
        className="my-5"
        style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
      />

      {/* Sources section */}
      <div className="flex flex-col gap-2">
        <span
          className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          SOURCES
        </span>
        {categoryData ? (
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-[11px]"
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
              {categoryData.sourceCount} sources
            </span>
            <span
              className="font-mono text-[11px]"
              style={{ color: 'rgba(255, 255, 255, 0.15)' }}
            >
              ({categoryData.activeSources} active)
            </span>
          </div>
        ) : (
          <span
            className="font-mono text-[11px]"
            style={{ color: 'rgba(255, 255, 255, 0.15)' }}
          >
            No source data
          </span>
        )}
      </div>

      {/* Separator */}
      <div
        className="my-5"
        style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
      />

      {/* Alerts count */}
      {categoryData && (
        <>
          <div className="flex flex-col gap-2">
            <span
              className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
              style={{ color: 'rgba(255, 255, 255, 0.15)' }}
            >
              ALERTS
            </span>
            <span
              className="font-mono text-[11px]"
              style={{ color: 'rgba(255, 255, 255, 0.25)' }}
            >
              {categoryData.alertCount} alerts
            </span>
            <span
              className="font-mono text-[9px]"
              style={{ color: 'rgba(255, 255, 255, 0.12)' }}
            >
              Click an alert to view details
            </span>
          </div>

          <div
            className="my-5"
            style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.04)' }}
          />
        </>
      )}

      {/* Geographic regions */}
      <div className="flex flex-col gap-3">
        <span
          className="block font-mono text-[9px] font-medium tracking-[0.1em] uppercase"
          style={{ color: 'rgba(255, 255, 255, 0.15)' }}
        >
          COVERAGE REGIONS
        </span>
        <div className="flex flex-wrap gap-2">
          {(categoryData?.geographicRegions ?? []).length > 0 ? (
            categoryData!.geographicRegions.map((region) => (
              <span
                key={region}
                className={cn(
                  'rounded-md px-2.5 py-1',
                  'border border-white/[0.06]',
                  'bg-white/[0.02]',
                  'font-mono text-[9px] tracking-[0.08em] uppercase',
                )}
                style={{ color: 'rgba(255, 255, 255, 0.2)' }}
              >
                {region}
              </span>
            ))
          ) : (
            <span
              className="font-mono text-[9px]"
              style={{ color: 'rgba(255, 255, 255, 0.12)' }}
            >
              No region data
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DistrictViewDockProps {
  readonly districtId: NodeId
  readonly panelSide: PanelSide
  readonly selectedAlertId: string | null
  readonly onDeselectAlert: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DistrictViewDock({
  districtId,
  panelSide,
  selectedAlertId,
  onDeselectAlert,
}: DistrictViewDockProps) {
  const categoryColor = getCategoryColor(districtId)
  const { data: intelItems } = useCategoryIntel(districtId)

  const selectedAlert = selectedAlertId
    ? intelItems?.find((item) => item.id === selectedAlertId) ?? null
    : null

  const isRight = panelSide === 'right'
  const slideFrom = isRight ? 40 : -40

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
      <AnimatePresence mode="wait">
        {selectedAlert ? (
          <AlertDetailView
            alert={selectedAlert}
            categoryColor={categoryColor}
            onDeselect={onDeselectAlert}
          />
        ) : (
          <CategoryOverviewView districtId={districtId} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
