/**
 * Glass Material Audit
 *
 * Verifies all glass panel implementations match VISUAL-DESIGN-SPEC.md
 * Section 1.7 recipes and Section 4.1 blur values.
 *
 * Glass tiers:
 * - Standard:  bg rgba(255,255,255, 0.03), blur 12px, saturate 120%
 * - Active:    bg rgba(255,255,255, 0.06), blur 16px, saturate 130%
 * - Strong:    bg rgba(15, 22, 31, 0.80),  blur 24px, saturate 140%
 *
 * Source: WS-4.4 D-POLISH-4
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1.7, 4.1
 */

import {
  registerAudit,
  queryComputedStyles,
  parseRGBA,
  withinTolerance,
  type AuditFinding,
} from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

interface GlassSpec {
  /** CSS class selector that identifies this glass tier */
  readonly selector: string
  /** Display name for findings */
  readonly name: string
  /** Expected background RGBA */
  readonly bgRGBA: { r: number; g: number; b: number; a: number }
  /** Expected backdrop-filter blur value in px */
  readonly blurPx: number
  /** Expected backdrop-filter saturate percentage */
  readonly saturatePct: number
  /** Whether a top-edge inset highlight is required */
  readonly requiresTopHighlight: boolean
  /** VISUAL-DESIGN-SPEC.md section */
  readonly specRef: string
}

const GLASS_SPECS: readonly GlassSpec[] = [
  {
    selector: '.station-glass, .glass',
    name: 'Standard Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.03 },
    blurPx: 12,
    saturatePct: 120,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Standard Glass Panel"',
  },
  {
    selector: '.station-glass-active, .glass-active',
    name: 'Active Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.06 },
    blurPx: 16,
    saturatePct: 130,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Active Glass Panel"',
  },
  {
    selector: '.station-glass-hover, .glass-hover',
    name: 'Hover Glass',
    bgRGBA: { r: 255, g: 255, b: 255, a: 0.06 },
    blurPx: 16,
    saturatePct: 130,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 (blend of standard and active)',
  },
  {
    selector: '.glass-strong',
    name: 'Strong Glass',
    bgRGBA: { r: 15, g: 22, b: 31, a: 0.8 },
    blurPx: 24,
    saturatePct: 140,
    requiresTopHighlight: true,
    specRef: 'Section 1.7 "Strong Glass Panel"',
  },
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditGlassMaterials(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let findingIndex = 0

  for (const spec of GLASS_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `glass-${findingIndex++}`,
        category: 'glass-material',
        severity: 'info',
        target: spec.selector,
        message: `No elements found for ${spec.name}. May not be rendered in current view.`,
        expected: 'At least 1 element',
        actual: '0 elements',
        specRef: spec.specRef,
      })
      continue
    }

    for (const { element, style } of elements) {
      const elId = element.id || element.className.toString().slice(0, 40) || element.tagName

      // -- Check background-color --
      const bgColor = style.backgroundColor
      const parsedBg = parseRGBA(bgColor)

      if (parsedBg) {
        const alphaMatch = withinTolerance(parsedBg.a, spec.bgRGBA.a, 0.015)
        if (!alphaMatch) {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'error',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} background opacity mismatch`,
            expected: `rgba(${spec.bgRGBA.r}, ${spec.bgRGBA.g}, ${spec.bgRGBA.b}, ${spec.bgRGBA.a})`,
            actual: bgColor,
            specRef: spec.specRef,
          })
        }
      }

      // -- Check backdrop-filter --
      const backdropFilter =
        style.getPropertyValue('backdrop-filter') ||
        style.getPropertyValue('-webkit-backdrop-filter')

      if (!backdropFilter || backdropFilter === 'none') {
        // Check if panning -- backdrop-filter is intentionally disabled during pan
        const isPanning = element.closest('[data-panning="true"]') !== null
        if (!isPanning) {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'error',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} missing backdrop-filter`,
            expected: `blur(${spec.blurPx}px) saturate(${spec.saturatePct}%)`,
            actual: backdropFilter || 'none',
            specRef: spec.specRef,
          })
        }
      } else {
        // Verify blur value
        const blurMatch = backdropFilter.match(/blur\((\d+(?:\.\d+)?)px\)/)
        if (blurMatch) {
          const actualBlur = parseFloat(blurMatch[1])
          if (!withinTolerance(actualBlur, spec.blurPx, 1)) {
            findings.push({
              id: `glass-${findingIndex++}`,
              category: 'glass-material',
              severity: 'error',
              target: `${spec.selector} (${elId})`,
              message: `${spec.name} blur value mismatch`,
              expected: `${spec.blurPx}px`,
              actual: `${actualBlur}px`,
              specRef: spec.specRef,
            })
          }
        }

        // Verify saturate value
        const saturateMatch = backdropFilter.match(/saturate\((\d+(?:\.\d+)?)%?\)/)
        if (saturateMatch) {
          const actualSaturate = parseFloat(saturateMatch[1])
          // saturate can be expressed as 1.2 or 120%
          const normalizedActual = actualSaturate < 10 ? actualSaturate * 100 : actualSaturate
          if (!withinTolerance(normalizedActual, spec.saturatePct, 5)) {
            findings.push({
              id: `glass-${findingIndex++}`,
              category: 'glass-material',
              severity: 'error',
              target: `${spec.selector} (${elId})`,
              message: `${spec.name} saturate value mismatch`,
              expected: `${spec.saturatePct}%`,
              actual: `${normalizedActual}%`,
              specRef: spec.specRef,
            })
          }
        }
      }

      // -- Check top-edge highlight --
      if (spec.requiresTopHighlight) {
        const boxShadow = style.boxShadow
        const hasInsetTop = boxShadow.includes('inset') && boxShadow.includes('1px')
        if (!hasInsetTop && boxShadow !== 'none') {
          findings.push({
            id: `glass-${findingIndex++}`,
            category: 'glass-material',
            severity: 'warning',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} may be missing top-edge inset highlight`,
            expected: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.03-0.05)',
            actual: boxShadow.slice(0, 80),
            specRef: 'Section 4.1 "The top-edge highlight"',
          })
        }
      }
    }
  }

  return findings
}

// Register with the audit runner
registerAudit('glass-material', auditGlassMaterials)
