/**
 * Reduced Motion Audit
 *
 * Verifies:
 * 1. All CSS @keyframes referenced by ambient-effects.css are disabled
 *    inside @media (prefers-reduced-motion: reduce).
 * 2. All motion/react animated components use useReducedMotion() and
 *    provide a static fallback.
 * 3. The ParticleField Canvas renders static positions (no drift).
 * 4. WS-2.1 morph choreography skips animated phases.
 * 5. WS-3.7 attention choreography resolves to static EffectConfig.
 *
 * This audit is split into two parts:
 * - Runtime CSS check (can the browser confirm animations are off?)
 * - Static checklist (must be manually verified and checked off)
 *
 * Source: WS-4.4 D-POLISH-7
 * Reference: VISUAL-DESIGN-SPEC.md (all animation sections), AD-3
 */

import { registerAudit, type AuditFinding } from './visual-polish-audit'

// ============================================================
// KNOWN ANIMATION CLASSES
// ============================================================

/**
 * All CSS classes that apply animation. These MUST have their animation
 * property set to "none" when prefers-reduced-motion: reduce is active.
 *
 * Source: WS-1.6 ambient-effects.css @media rule.
 */
const ANIMATED_CLASSES = [
  '.ambient-heartbeat',
  '.ambient-breathe',
  '.ambient-grid-pulse',
  '.ambient-scanline',
  '.health-bar',
  '.hub-center',
  '.grid-pulse-overlay',
  '.scanline',
] as const

/**
 * All motion/react components that must check useReducedMotion().
 * These are verified by checking for the data-reduced-motion attribute
 * that components should apply when reduced motion is active.
 */
const MOTION_COMPONENTS = [
  '[data-morph-container]',
  '[data-station-entrance]',
  '[data-receipt-stamp]',
  '[data-narration-panel]',
  '[data-next-best-actions]',
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditReducedMotion(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  // Detect if reduced motion is currently active
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!isReducedMotion) {
    findings.push({
      id: `rm-${idx++}`,
      category: 'reduced-motion',
      severity: 'info',
      target: 'media query',
      message:
        'prefers-reduced-motion is NOT active. Enable it in OS settings or ' +
        'Chrome DevTools (Rendering > Emulate CSS media feature) to run the ' +
        'full reduced motion audit.',
      expected: 'prefers-reduced-motion: reduce',
      actual: 'no-preference',
      specRef: 'AD-3 (ambient tier)',
    })
    return findings
  }

  // -- 1. Check that all animated CSS classes have animation: none --
  for (const selector of ANIMATED_CLASSES) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      const style = getComputedStyle(el)
      const animation = style.animation || style.getPropertyValue('animation')
      const animName = style.animationName

      if (animName !== 'none' && animName !== '' && !animation.includes('none')) {
        findings.push({
          id: `rm-${idx++}`,
          category: 'reduced-motion',
          severity: 'error',
          target: selector,
          message: 'Animation still active during prefers-reduced-motion: reduce',
          expected: 'animation: none !important',
          actual: `animation-name: ${animName}`,
          specRef: 'WS-1.6 ambient-effects.css @media rule',
        })
      }
    }
  }

  // -- 2. Check that ParticleField Canvas is static --
  const particleCanvases = document.querySelectorAll('canvas[data-particle-canvas]')
  for (const canvas of particleCanvases) {
    const isStatic = canvas.getAttribute('data-reduced-motion') === 'true'
    if (!isStatic) {
      findings.push({
        id: `rm-${idx++}`,
        category: 'reduced-motion',
        severity: 'error',
        target: 'canvas[data-particle-canvas]',
        message: 'ParticleField should render static positions in reduced motion',
        expected: 'data-reduced-motion="true"',
        actual: canvas.getAttribute('data-reduced-motion') || '(not set)',
        specRef: 'WS-1.6 ParticleField reduced motion behavior',
      })
    }
  }

  // -- 3. Check motion/react components for reduced motion handling --
  for (const selector of MOTION_COMPONENTS) {
    const elements = document.querySelectorAll(selector)
    for (const el of elements) {
      // In reduced motion, motion/react components should either:
      // (a) Render with no transition (instant state), or
      // (b) Apply data-reduced-motion="true" for verification.
      const style = getComputedStyle(el)
      const transition = style.transition
      const hasReducedAttr = el.getAttribute('data-reduced-motion') === 'true'

      // If element has active transitions and no reduced-motion marker,
      // it may not be handling reduced motion correctly.
      if (
        !hasReducedAttr &&
        transition &&
        transition !== 'none' &&
        transition !== 'all 0s ease 0s'
      ) {
        findings.push({
          id: `rm-${idx++}`,
          category: 'reduced-motion',
          severity: 'warning',
          target: selector,
          message: 'motion/react component may not handle reduced motion',
          expected: 'Instant state change or data-reduced-motion="true"',
          actual: `transition: ${transition.slice(0, 60)}`,
          specRef: 'AD-3 (choreography tier)',
        })
      }
    }
  }

  return findings
}

registerAudit('reduced-motion', auditReducedMotion)
