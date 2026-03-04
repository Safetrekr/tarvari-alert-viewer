/**
 * StationProposalPreview -- renders a proposed StationTemplate.
 *
 * Uses glass-material styling consistent with the builder panel to show
 * the proposed template with header, body type badge, description,
 * body type placeholder, disabled action buttons, and trigger conditions.
 *
 * The preview is read-only -- action buttons are disabled (they display
 * but do not execute commands). This prevents side effects during review.
 *
 * References: WS-2.6 (StationPanel), VISUAL-DESIGN-SPEC.md (glass material)
 */

'use client'

import { Eye } from 'lucide-react'
import type { StationTemplate } from '@/lib/interfaces/station-template-registry'

// ============================================================================
// Props
// ============================================================================

interface StationProposalPreviewProps {
  readonly template: StationTemplate
}

// ============================================================================
// Component
// ============================================================================

export function StationProposalPreview({ template }: StationProposalPreviewProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Preview Label */}
      <div className="flex items-center gap-2">
        <Eye className="h-3 w-3 text-[#55667a]" />
        <span
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: 'var(--color-text-tertiary, #55667a)' }}
        >
          Live Preview
        </span>
      </div>

      {/* Preview Container */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(12px) saturate(120%)',
          WebkitBackdropFilter: 'blur(12px) saturate(120%)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03)',
        }}
      >
        {/* Station Header */}
        <div className="flex items-center gap-3 border-b border-white/[0.04] px-4 py-3">
          {template.layout.header.icon && (
            <span className="text-xs" style={{ color: 'var(--color-ember-bright, #ff773c)' }}>
              {template.layout.header.icon}
            </span>
          )}
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-primary, #def6ff)' }}
          >
            {template.layout.header.title}
          </span>
        </div>

        {/* Station Body (preview representation) */}
        <div className="px-4 py-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  background: 'rgba(var(--teal-rgb), 0.15)',
                  color: '#3a99b8',
                  border: '1px solid rgba(var(--teal-rgb), 0.3)',
                }}
              >
                {template.layout.bodyType}
              </span>
              <span
                className="rounded-md px-2 py-0.5 text-xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: 'var(--color-text-tertiary, #55667a)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                }}
              >
                {template.category}
              </span>
            </div>
            <p
              className="text-xs leading-relaxed"
              style={{ color: 'var(--color-text-secondary, #92a9b4)' }}
            >
              {template.description}
            </p>

            {/* Body Type Placeholder */}
            <div
              className="mt-2 flex h-24 items-center justify-center rounded-lg"
              style={{
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px dashed rgba(255, 255, 255, 0.06)',
              }}
            >
              <span
                className="text-xs italic"
                style={{ color: 'var(--color-text-ghost, #2a3545)' }}
              >
                {template.layout.bodyType} content renders here at runtime
              </span>
            </div>
          </div>
        </div>

        {/* Station Actions */}
        {template.layout.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-white/[0.04] px-4 py-3">
            {template.layout.actions.map((action) => (
              <button
                key={action.id}
                disabled
                className="cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-medium opacity-60"
                style={{
                  background:
                    action.variant === 'default'
                      ? 'rgba(var(--ember-rgb), 0.3)'
                      : action.variant === 'destructive'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  color: 'var(--color-text-secondary, #92a9b4)',
                }}
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Trigger Conditions (if any) */}
        {template.triggers.length > 0 && (
          <div className="border-t border-white/[0.04] px-4 py-3">
            <p
              className="mb-2 text-xs font-medium tracking-widest uppercase"
              style={{ color: 'var(--color-text-ghost, #2a3545)' }}
            >
              Trigger Conditions
            </p>
            {template.triggers.map((trigger, i) => (
              <div key={i} className="flex items-center gap-2 py-0.5">
                <span className="font-mono text-xs" style={{ color: 'var(--color-teal, #277389)' }}>
                  {trigger.field}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                  {trigger.operator}
                </span>
                <span
                  className="font-mono text-xs"
                  style={{ color: 'var(--color-text-tertiary, #55667a)' }}
                >
                  {JSON.stringify(trigger.value)}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-ghost, #2a3545)' }}>
                  (w: {trigger.weight})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
