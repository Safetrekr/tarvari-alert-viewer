'use client'

/**
 * Visual Polish DevTool Hook
 *
 * Provides audit state management for the dev overlay.
 * Runs all visual polish audits and exposes results + frame budget.
 * Only active in development mode.
 *
 * Source: WS-4.4 D-POLISH-1
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1-6
 */

import { useState, useCallback, useEffect } from 'react'
import { runVisualPolishAudit, type VisualPolishReport } from '@/lib/audits'
import { useFrameBudgetMonitor, type FrameBudgetState } from './use-frame-budget-monitor'

export interface VisualPolishDevToolState {
  /** Latest audit report (null if not yet run) */
  readonly report: VisualPolishReport | null
  /** Frame budget monitoring state */
  readonly frameBudget: FrameBudgetState
  /** Whether the overlay panel is expanded */
  readonly expanded: boolean
  /** Whether an audit is currently running */
  readonly loading: boolean
  /** Toggle expanded state */
  toggleExpanded: () => void
  /** Run the audit manually */
  runAudit: () => Promise<void>
}

const IS_DEV = process.env.NODE_ENV === 'development'

export function useVisualPolishDevtool(): VisualPolishDevToolState {
  const [report, setReport] = useState<VisualPolishReport | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const frameBudget = useFrameBudgetMonitor()

  const runAudit = useCallback(async () => {
    if (!IS_DEV) return
    setLoading(true)
    try {
      const result = await runVisualPolishAudit()
      setReport(result)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev)
  }, [])

  // Run once on mount after DOM settles
  useEffect(() => {
    if (!IS_DEV) return
    const timer = setTimeout(runAudit, 2000)
    return () => clearTimeout(timer)
  }, [runAudit])

  // Keyboard shortcut: Alt+V to toggle overlay
  useEffect(() => {
    if (!IS_DEV) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'v') {
        e.preventDefault()
        setExpanded((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return {
    report,
    frameBudget,
    expanded,
    loading,
    toggleExpanded,
    runAudit,
  }
}
