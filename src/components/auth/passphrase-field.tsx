'use client'

import { forwardRef, type KeyboardEvent } from 'react'
import { motion, type Variants } from 'motion/react'
import { Input } from '@tarva/ui'
import { cn } from '@/lib/utils'
import {
  FIELD_MATERIALIZE_DURATION,
  FIELD_COLLAPSE_DURATION,
  SHAKE_DURATION,
  SHAKE_AMPLITUDE,
} from './constants'

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const fieldVariants: Variants = {
  hidden: {
    opacity: 0,
    scaleX: 0.85,
    scaleY: 0.92,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
    filter: 'blur(0px)',
    transition: {
      duration: FIELD_MATERIALIZE_DURATION / 1000,
      ease: [0.22, 1, 0.36, 1], // --ease-morph
    },
  },
  collapsed: {
    opacity: 0,
    scaleX: 0.5,
    scaleY: 0.7,
    filter: 'blur(6px)',
    transition: {
      duration: FIELD_COLLAPSE_DURATION / 1000,
      ease: [0.4, 0, 1, 1], // ease-in
    },
  },
  shake: {
    x: [
      0,
      -SHAKE_AMPLITUDE,
      SHAKE_AMPLITUDE,
      -SHAKE_AMPLITUDE,
      SHAKE_AMPLITUDE,
      -SHAKE_AMPLITUDE,
      0,
    ],
    transition: {
      duration: SHAKE_DURATION / 1000,
      ease: 'easeInOut',
    },
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type FieldPhase = 'hidden' | 'visible' | 'collapsed' | 'shake'

interface PassphraseFieldProps {
  /** Current animation phase of the field. */
  phase: FieldPhase
  /** Current passphrase input value (controlled). */
  value: string
  /** Called on input change. */
  onChange: (value: string) => void
  /** Called when the user presses Enter. */
  onSubmit: () => void
  /** Called when the shake animation completes. */
  onShakeComplete?: () => void
  className?: string
}

export const PassphraseField = forwardRef<HTMLInputElement, PassphraseFieldProps>(
  function PassphraseField({ phase, value, onChange, onSubmit, onShakeComplete, className }, ref) {
    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onSubmit()
      }
    }

    return (
      <motion.div
        className={cn('w-full max-w-xs', className)}
        variants={fieldVariants}
        initial="hidden"
        animate={phase}
        onAnimationComplete={(definition) => {
          if (definition === 'shake') {
            onShakeComplete?.()
          }
        }}
      >
        <Input
          ref={ref}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="new-password"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          aria-label="Passphrase"
          className={cn(
            // Override @tarva/ui Input defaults for spatial aesthetic
            'h-12 w-full rounded-lg border-0 bg-transparent text-center',
            'font-mono text-base tracking-widest',
            'text-text-primary placeholder:text-text-ghost',
            'ring-1 ring-white/[0.06] ring-inset',
            'focus-visible:ring-ember-bright/40 focus-visible:outline-none',
            'transition-shadow duration-hover ease-hover'
          )}
          placeholder=""
        />
      </motion.div>
    )
  }
)
