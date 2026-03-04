/**
 * BuilderIterationHistory -- collapsible timeline of builder iterations.
 *
 * Shows a chronological list of description/proposal pairs from the
 * current session. Each iteration shows the description, outcome
 * (accepted/rejected/iterated/error), and the proposed template name.
 *
 * References: WS-3.2 (Evidence Ledger timeline pattern)
 */

'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronRight, Check, X, RefreshCw, AlertCircle } from 'lucide-react'
import type { BuilderIteration } from '@/lib/ai/builder-types'

// ============================================================================
// Props
// ============================================================================

interface BuilderIterationHistoryProps {
  readonly iterations: readonly BuilderIteration[]
}

// ============================================================================
// Component
// ============================================================================

export function BuilderIterationHistory({ iterations }: BuilderIterationHistoryProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.01)',
        border: '1px solid rgba(255, 255, 255, 0.03)',
      }}
    >
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
          <ChevronRight className="h-3 w-3 text-[#55667a]" />
        </motion.div>
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--color-text-tertiary, #55667a)' }}
        >
          Iteration History ({iterations.length})
        </span>
      </button>

      {/* Timeline */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-4 pb-4">
              {iterations.map((iter) => (
                <div
                  key={iter.iterationNumber}
                  className="flex items-start gap-3 rounded-md px-3 py-2"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {/* Outcome Icon */}
                  <div className="mt-0.5">
                    {iter.outcome === 'accepted' && <Check className="h-3 w-3 text-[#22c55e]" />}
                    {iter.outcome === 'rejected' && <X className="h-3 w-3 text-[#ef4444]" />}
                    {iter.outcome === 'iterated' && (
                      <RefreshCw className="h-3 w-3 text-[#ff773c]" />
                    )}
                    {iter.outcome === 'error' && <AlertCircle className="h-3 w-3 text-[#ef4444]" />}
                    {iter.outcome === 'pending' && (
                      <ChevronRight className="h-3 w-3 text-[#55667a]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      #{iter.iterationNumber}: &quot;{iter.description.slice(0, 80)}
                      {iter.description.length > 80 ? '...' : ''}&quot;
                    </p>
                    {iter.proposal && (
                      <p
                        className="mt-0.5 text-xs"
                        style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                      >
                        Proposed: {iter.proposal.template.displayName} (
                        {iter.proposal.template.layout.bodyType})
                      </p>
                    )}
                    {iter.error && (
                      <p className="mt-0.5 text-xs text-[#ef4444]/70">{iter.error.slice(0, 100)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
