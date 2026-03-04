/**
 * BuilderModePanel -- the main Builder Mode interface.
 *
 * Glass-material slide-in panel from the right side of the viewport.
 * Contains:
 * - District selector (which district to add the station to)
 * - Description textarea (natural language input)
 * - Submit button (sends to Claude)
 * - Proposal preview (live station rendering)
 * - Accept / Reject / Iterate controls
 * - Iteration history (collapsible)
 * - Gate status indicators
 *
 * Styling: Oblivion glass material per VISUAL-DESIGN-SPEC.md Section 1.7.
 * Animations: motion/react for slide-in/out.
 *
 * References: VISUAL-DESIGN-SPEC.md (glass-strong recipe), WS-2.6 (StationPanel),
 * WS-3.5 (template browser styling precedent)
 */

'use client'

import { AnimatePresence, motion } from 'motion/react'
import {
  Wand2,
  X,
  Check,
  RefreshCw,
  Sparkles,
  Loader,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@tarva/ui'
import { ScrollArea } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import { Tooltip, TooltipTrigger, TooltipContent } from '@tarva/ui'
import type { AppIdentifier } from '@/lib/interfaces/types'
import { ALL_APP_IDS, APP_DISPLAY_NAMES } from '@/lib/interfaces/types'
import type { UseBuilderModeReturn } from '@/hooks/use-builder-mode'
import { StationProposalPreview } from './StationProposalPreview'
import { BuilderIterationHistory } from './BuilderIterationHistory'
import { BUILDER_SHORTCUT } from '@/lib/ai/builder-gate'

// ============================================================================
// Props
// ============================================================================

interface BuilderModePanelProps {
  readonly builder: UseBuilderModeReturn
}

// ============================================================================
// Component
// ============================================================================

export function BuilderModePanel({ builder }: BuilderModePanelProps) {
  const { session, phase } = builder

  return (
    <AnimatePresence>
      {builder.panelOpen && (
        <motion.div
          className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col"
          initial={{ x: 480, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 480, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            background: 'rgba(15, 22, 31, 0.80)',
            backdropFilter: 'blur(24px) saturate(140%)',
            WebkitBackdropFilter: 'blur(24px) saturate(140%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04), -8px 0 32px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{
                  background: 'rgba(var(--ember-rgb), 0.15)',
                  boxShadow: '0 0 12px rgba(var(--ember-rgb), 0.08)',
                }}
              >
                <Wand2 className="h-4 w-4 text-[#ff773c]" />
              </div>
              <div>
                <h2
                  className="text-sm font-medium tracking-wide"
                  style={{ color: 'var(--color-text-primary, #def6ff)' }}
                >
                  STATION BUILDER
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-tertiary, #55667a)' }}>
                  Powered by Claude
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={builder.close} className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Close ({BUILDER_SHORTCUT.display})
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Body */}
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-6 p-6">
              {/* District Selector */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                >
                  Target District
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_APP_IDS.map((id: AppIdentifier) => (
                    <button
                      key={id}
                      onClick={() => builder.setTargetDistrict(id)}
                      className="rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150"
                      style={{
                        background:
                          session?.targetDistrictId === id
                            ? 'rgba(var(--ember-rgb), 0.2)'
                            : 'rgba(255, 255, 255, 0.03)',
                        border:
                          session?.targetDistrictId === id
                            ? '1px solid rgba(var(--ember-rgb), 0.4)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        color:
                          session?.targetDistrictId === id
                            ? '#ff773c'
                            : 'var(--color-text-secondary, #92a9b4)',
                      }}
                    >
                      {APP_DISPLAY_NAMES[id] ?? id}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Input */}
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs font-medium tracking-widest uppercase"
                  style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                >
                  Describe Your Station
                </label>
                <textarea
                  value={session?.description ?? ''}
                  onChange={(e) => builder.setDescription(e.target.value)}
                  placeholder="e.g., Show me a station that displays build pipeline status as a table with run name, duration, and result columns..."
                  disabled={phase === 'generating' || phase === 'accepted'}
                  rows={4}
                  className="resize-none rounded-lg px-4 py-3 text-sm transition-all duration-150 placeholder:text-[#33445a] focus:ring-1 focus:ring-[#ff773c]/40 focus:outline-none"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: 'var(--color-text-primary, #def6ff)',
                    fontFamily: 'var(--font-geist-sans)',
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                    {(session?.description ?? '').length} chars
                  </span>
                  {builder.iterationCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Iteration {builder.iterationCount + 1}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              {(phase === 'describing' || phase === 'idle' || phase === 'error') && (
                <Button
                  onClick={builder.submit}
                  disabled={!builder.canSubmit}
                  className="w-full"
                  style={{
                    background: builder.canSubmit
                      ? 'rgba(var(--ember-rgb), 0.8)'
                      : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Station
                </Button>
              )}

              {/* Generating State */}
              {phase === 'generating' && (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg px-6 py-8"
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <Loader className="h-6 w-6 animate-spin" style={{ color: '#ff773c' }} />
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary, #92a9b4)' }}>
                    Claude is designing your station...
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-tertiary, #55667a)' }}>
                    This typically takes 3-8 seconds
                  </p>
                </div>
              )}

              {/* Error State */}
              {phase === 'error' && session?.iterations.length && (
                <div
                  className="flex items-start gap-3 rounded-lg px-4 py-3"
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#ef4444]" />
                  <div>
                    <p className="text-sm text-[#f87171]">Generation Failed</p>
                    <p className="mt-1 text-xs text-[#ef4444]/70">
                      {session.iterations[session.iterations.length - 1]?.error ??
                        'Unknown error. Try rephrasing your description.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Proposal Preview */}
              {phase === 'reviewing' && session?.currentProposal && (
                <div className="flex flex-col gap-4">
                  {/* Confidence Badge */}
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium tracking-widest uppercase"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      Proposed Station
                    </span>
                    <Badge
                      variant={session.currentProposal.confidence >= 0.7 ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {Math.round(session.currentProposal.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  {/* Live Preview */}
                  <StationProposalPreview template={session.currentProposal.template} />

                  {/* Claude's Reasoning */}
                  <div
                    className="rounded-lg px-4 py-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.04)',
                    }}
                  >
                    <p
                      className="mb-1 text-xs font-medium tracking-widest uppercase"
                      style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                    >
                      Claude&apos;s Reasoning
                    </p>
                    <p
                      className="text-sm leading-relaxed"
                      style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
                    >
                      {session.currentProposal.reasoning}
                    </p>
                  </div>

                  {/* Alternatives */}
                  {session.currentProposal.alternatives.length > 0 && (
                    <div
                      className="rounded-lg px-4 py-3"
                      style={{
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                      }}
                    >
                      <p
                        className="mb-2 text-xs font-medium tracking-widest uppercase"
                        style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                      >
                        Alternatives Considered
                      </p>
                      {session.currentProposal.alternatives.map((alt, i) => (
                        <div key={i} className="flex items-start gap-2 py-1">
                          <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-[#55667a]" />
                          <p className="text-xs text-[#92a9b4]">{alt}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Accept / Reject / Iterate */}
                  <div className="flex gap-3">
                    <Button
                      onClick={builder.accept}
                      className="flex-1"
                      style={{ background: 'rgba(var(--healthy-rgb), 0.6)' }}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Accept
                    </Button>
                    <Button onClick={builder.iterate} variant="outline" className="flex-1">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Iterate
                    </Button>
                    <Button onClick={builder.reject} variant="ghost" className="flex-1">
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}

              {/* Accepted State */}
              {phase === 'accepted' && session?.currentProposal && (
                <div
                  className="flex flex-col items-center gap-3 rounded-lg px-6 py-8"
                  style={{
                    background: 'rgba(var(--healthy-rgb), 0.06)',
                    border: '1px solid rgba(var(--healthy-rgb), 0.2)',
                  }}
                >
                  <Check className="h-8 w-8 text-[#22c55e]" />
                  <p className="text-sm font-medium text-[#4ade80]">Station Created</p>
                  <p className="text-center text-xs text-[#22c55e]/70">
                    &quot;{session.currentProposal.template.displayName}&quot; has been added to{' '}
                    {session.targetDistrictId}. It will appear in the station panel for this
                    session.
                  </p>
                  <Button onClick={builder.reset} variant="outline" className="mt-2">
                    Build Another
                  </Button>
                </div>
              )}

              {/* Iteration History */}
              {session && session.iterations.length > 1 && (
                <BuilderIterationHistory iterations={session.iterations} />
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
            <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
              Session: {session?.id.slice(0, 8) ?? '--'}
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
              {builder.createdCount} station{builder.createdCount !== 1 ? 's' : ''} created
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
