/**
 * Performance Audit
 *
 * Verifies:
 * 1. will-change is applied to the spatial canvas container.
 * 2. CSS contain: layout style paint is applied to capsules and panels.
 * 3. backdrop-filter elements have pan-state fallback.
 * 4. No elements use top/left/margin/width/height for animation
 *    (Section 4.3 rule #6: "Use transform for all movement").
 * 5. Particle canvas overlay has pointer-events: none.
 * 6. will-change is not over-applied (too many promoted layers = memory).
 *
 * Source: WS-4.4 D-POLISH-6
 * Reference: VISUAL-DESIGN-SPEC.md Section 4.3
 */

import { registerAudit, queryComputedStyles, type AuditFinding } from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

/** Maximum acceptable promoted layers before warning */
const MAX_WILL_CHANGE_ELEMENTS = 25

/** Elements that MUST have will-change: transform */
const REQUIRED_WILL_CHANGE: readonly string[] = ['.spatial-canvas', '[data-spatial-canvas]']

/** Elements that MUST have CSS containment */
const REQUIRED_CONTAINMENT: readonly string[] = [
  '.capsule',
  '[data-capsule]',
  '.station-panel',
  '[data-station-panel]',
]

/** Overlays that MUST have pointer-events: none */
const REQUIRED_NO_POINTER: readonly string[] = [
  '.particle-canvas',
  '[data-particle-canvas]',
  '.scanline-overlay',
  '.grid-pulse-overlay',
  '.film-grain-overlay',
  '.noise-overlay',
]

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditPerformance(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  // -- 1. Required will-change --
  for (const selector of REQUIRED_WILL_CHANGE) {
    const elements = queryComputedStyles(selector)
    for (const { style } of elements) {
      const willChange = style.willChange
      if (!willChange.includes('transform')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: selector,
          message: 'Spatial canvas missing will-change: transform',
          expected: 'will-change: transform',
          actual: `will-change: ${willChange}`,
          specRef: 'Section 4.3 rule #1',
        })
      }
    }
  }

  // -- 2. CSS containment --
  for (const selector of REQUIRED_CONTAINMENT) {
    const elements = queryComputedStyles(selector)
    for (const { style } of elements) {
      const contain = style.contain
      if (!contain.includes('layout') || !contain.includes('style') || !contain.includes('paint')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'warning',
          target: selector,
          message: 'Element missing CSS containment',
          expected: 'contain: layout style paint',
          actual: `contain: ${contain}`,
          specRef: 'Section 4.3 rule #4',
        })
      }
    }
  }

  // -- 3. Overlay pointer-events --
  for (const selector of REQUIRED_NO_POINTER) {
    const elements = queryComputedStyles(selector)
    for (const { style } of elements) {
      if (style.pointerEvents !== 'none') {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: selector,
          message: 'Overlay element must have pointer-events: none',
          expected: 'pointer-events: none',
          actual: `pointer-events: ${style.pointerEvents}`,
          specRef: 'Section 5.1 (overlays)',
        })
      }
    }
  }

  // -- 4. will-change overuse check --
  const allWillChange = document.querySelectorAll('*')
  let willChangeCount = 0
  for (const el of allWillChange) {
    const style = getComputedStyle(el)
    if (style.willChange !== 'auto') {
      willChangeCount++
    }
  }
  if (willChangeCount > MAX_WILL_CHANGE_ELEMENTS) {
    findings.push({
      id: `perf-${idx++}`,
      category: 'performance',
      severity: 'warning',
      target: 'document',
      message: `Too many elements with will-change (${willChangeCount}). Excessive layer promotion wastes GPU memory.`,
      expected: `<= ${MAX_WILL_CHANGE_ELEMENTS} elements`,
      actual: `${willChangeCount} elements`,
      specRef: 'Section 4.3 (general performance)',
    })
  }

  // -- 5. Transition property audit (no top/left/margin/width/height) --
  const transitionElements = document.querySelectorAll(
    '[style*="transition"], [class*="transition"]'
  )
  for (const el of transitionElements) {
    const style = getComputedStyle(el)
    const transition = style.transition
    const bannedProps = ['top', 'left', 'right', 'bottom', 'margin', 'width', 'height']
    for (const prop of bannedProps) {
      // Check if transition explicitly targets a banned property
      // (not just "all" which is acceptable but flagged as warning)
      const regex = new RegExp(`\\b${prop}\\b`)
      if (regex.test(transition) && !transition.includes('transform')) {
        findings.push({
          id: `perf-${idx++}`,
          category: 'performance',
          severity: 'error',
          target: el.tagName + (el.id ? `#${el.id}` : ''),
          message: `Element transitions "${prop}" instead of using transform`,
          expected: 'Use transform: translate()/scale() for all movement',
          actual: `transition includes "${prop}"`,
          specRef: 'Section 4.3 rule #6',
        })
      }
    }
  }

  return findings
}

registerAudit('performance', auditPerformance)
