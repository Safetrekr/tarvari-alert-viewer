/**
 * InterventionStation -- renders exception recovery UI.
 *
 * Receives an InterventionState and renders the appropriate recovery panel
 * based on the classification category. Uses WS-2.6 station panel framework
 * for the 3-zone layout (header/body/actions) with glass material styling.
 *
 * Sub-panels:
 * - RetryPanel (transient) -- countdown timer, retry button
 * - EscalationPanel (permanent) -- error details, next steps
 * - ConfigurationPanel (policy) -- policy violation, setting to change
 * - InformationRequestPanel (missing-info) -- investigation prompts
 *
 * References: AD-7, WS-2.6 (Station Panel Framework),
 * VISUAL-DESIGN-SPEC.md (glass material, status colors)
 */

'use client'

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, RefreshCw, Settings, HelpCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@tarva/ui'
import { Badge } from '@tarva/ui'
import type { InterventionState } from '@/lib/interfaces/exception-triage'
import { useTriageStore } from '@/stores/triage.store'
import { RetryPanel } from './intervention-panels/RetryPanel'
import { EscalationPanel } from './intervention-panels/EscalationPanel'
import { ConfigurationPanel } from './intervention-panels/ConfigurationPanel'
import { InformationRequestPanel } from './intervention-panels/InformationRequestPanel'

// ============================================================================
// Props
// ============================================================================

interface InterventionStationProps {
  intervention: InterventionState
  /** Callback when the user takes an action (for receipt generation). */
  onAction?: (actionId: string, command: string | null) => void
}

// ============================================================================
// Category Metadata
// ============================================================================

const CATEGORY_META = {
  transient: {
    icon: RefreshCw,
    label: 'Transient',
    color: 'var(--status-warning)',
    badgeVariant: 'outline' as const,
  },
  permanent: {
    icon: AlertTriangle,
    label: 'Permanent',
    color: 'var(--status-danger)',
    badgeVariant: 'destructive' as const,
  },
  policy: {
    icon: Settings,
    label: 'Policy',
    color: 'var(--status-warning)',
    badgeVariant: 'outline' as const,
  },
  'missing-info': {
    icon: HelpCircle,
    label: 'Needs Info',
    color: 'var(--accent)',
    badgeVariant: 'secondary' as const,
  },
} as const

// ============================================================================
// Component
// ============================================================================

export function InterventionStation({ intervention, onAction }: InterventionStationProps) {
  const resolveIntervention = useTriageStore((s) => s.resolveIntervention)
  const category = intervention.classification.category
  const meta = CATEGORY_META[category]
  const Icon = meta.icon

  const handleDismiss = useCallback(() => {
    resolveIntervention(intervention.exception.id, 'dismissed')
    onAction?.('dismiss', null)
  }, [intervention.exception.id, resolveIntervention, onAction])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={intervention.exception.id}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="intervention-station"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: `inset 0 1px 0 0 rgba(255, 255, 255, 0.03), 0 0 1px 0 ${meta.color}40`,
          borderRadius: '12px',
          padding: '16px',
          width: '100%',
        }}
      >
        {/* ---- Header Zone ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            paddingBottom: '8px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          <Icon size={16} style={{ color: meta.color, flexShrink: 0 }} />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: 'var(--foreground)',
              flex: 1,
            }}
          >
            {intervention.exception.displayName}
          </span>
          <Badge variant={meta.badgeVariant}>{meta.label}</Badge>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              color: 'rgba(222, 246, 255, 0.4)',
            }}
          >
            {Math.round(intervention.classification.confidence * 100)}%
          </span>
        </div>

        {/* ---- Body Zone (category-specific panel) ---- */}
        <div style={{ marginBottom: '12px' }}>
          {category === 'transient' && (
            <RetryPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'permanent' && (
            <EscalationPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'policy' && (
            <ConfigurationPanel intervention={intervention} onAction={onAction} />
          )}
          {category === 'missing-info' && (
            <InformationRequestPanel intervention={intervention} onAction={onAction} />
          )}
        </div>

        {/* ---- Actions Zone ---- */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          }}
        >
          {intervention.status === 'resolved' ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--status-success)',
              }}
            >
              <CheckCircle size={14} />
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)' }}>Resolved</span>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                <XCircle size={14} />
                Dismiss
              </Button>
              {intervention.classification.suggestedActions
                .filter((a) => a.actionType !== 'dismiss')
                .slice(0, 2)
                .map((action) => (
                  <Button
                    key={action.id}
                    variant={action.actionType === 'retry' ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => onAction?.(action.id, action.command)}
                  >
                    {action.label}
                  </Button>
                ))}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
