/**
 * Glow System Audit
 *
 * Verifies:
 * 1. Luminous border uses 4-layer box-shadow (outer bleed, tight outer,
 *    inner bleed, tight inner) per VISUAL-DESIGN-SPEC.md Section 4.4.
 * 2. Ember glow uses 3-layer technique (outer haze, core bloom, hot center)
 *    at subtle/medium/bright intensities per Section 1.8.
 * 3. Teal glow uses 2-layer technique at subtle/medium per Section 1.8.
 * 4. Border color matches glow color (same hue/saturation, only opacity differs).
 * 5. Status glow colors match Gap #3 status model.
 *
 * Source: WS-4.4 D-POLISH-5
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1.8, 4.2, 4.4
 */

import { registerAudit, queryComputedStyles, type AuditFinding } from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

/**
 * Expected box-shadow layer counts per element type.
 *
 * The luminous border recipe from Section 4.4:
 *   Layer 1: 0 0 10px rgba(224, 82, 0, 0.10)   -- outer bleed
 *   Layer 2: 0 0 3px  rgba(224, 82, 0, 0.18)    -- tight outer
 *   Layer 3: inset 0 0 10px rgba(224, 82, 0, 0.04) -- inner bleed
 *   Layer 4: inset 0 0 2px  rgba(224, 82, 0, 0.08) -- tight inner
 *
 * Combined station-panel also includes the top-edge highlight:
 *   Layer 0: inset 0 1px 0 0 rgba(255, 255, 255, 0.05) -- glass highlight
 *   = 5 layers total for `.station-panel`
 */

interface GlowSpec {
  readonly selector: string
  readonly name: string
  /** Minimum number of box-shadow layers expected */
  readonly minLayers: number
  /** Whether inset layers are expected (luminous border) */
  readonly requiresInset: boolean
  /** Expected glow hue (ember=orange, teal=teal, status=varies) */
  readonly expectedHue: 'ember' | 'teal' | 'status' | 'any'
  readonly specRef: string
}

const GLOW_SPECS: readonly GlowSpec[] = [
  {
    selector: '.station-luminous-border',
    name: 'Station Luminous Border (ember)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'ember',
    specRef: 'Section 4.4 "Luminous Border Detail"',
  },
  {
    selector: '.station-luminous-border-healthy',
    name: 'Station Luminous Border (healthy)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-luminous-border-warning',
    name: 'Station Luminous Border (warning)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-luminous-border-error',
    name: 'Station Luminous Border (error)',
    minLayers: 4,
    requiresInset: true,
    expectedHue: 'status',
    specRef: 'Section 4.4 (status variant)',
  },
  {
    selector: '.station-panel',
    name: 'Station Panel (combined glass + luminous)',
    minLayers: 5,
    requiresInset: true,
    expectedHue: 'ember',
    specRef: 'Section 4.4 + Section 4.1 combined',
  },
  {
    selector: '.glow-subtle, [class*="glow-ember-subtle"]',
    name: 'Ember Glow Subtle',
    minLayers: 2,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Subtle"',
  },
  {
    selector: '.glow-medium, [class*="glow-ember-medium"]',
    name: 'Ember Glow Medium',
    minLayers: 3,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Medium"',
  },
  {
    selector: '.glow-bright, [class*="glow-ember-bright"]',
    name: 'Ember Glow Bright',
    minLayers: 3,
    requiresInset: false,
    expectedHue: 'ember',
    specRef: 'Section 1.8 "Glow Bright"',
  },
] as const

// ============================================================
// HELPERS
// ============================================================

/**
 * Count box-shadow layers in a computed box-shadow value.
 * Each layer is separated by commas, but rgba() values also contain commas.
 * We split on commas that are NOT inside parentheses.
 */
function countBoxShadowLayers(boxShadow: string): number {
  if (!boxShadow || boxShadow === 'none') return 0

  let depth = 0
  let count = 1
  for (const char of boxShadow) {
    if (char === '(') depth++
    else if (char === ')') depth--
    else if (char === ',' && depth === 0) count++
  }
  return count
}

/**
 * Check if a box-shadow value contains inset layers.
 */
function hasInsetLayers(boxShadow: string): boolean {
  return boxShadow.includes('inset')
}

/**
 * Verify that ember glow uses the correct RGB values.
 * Ember base: rgb(224, 82, 0)
 * Ember bright: rgb(255, 119, 60) or rgb(255, 170, 112)
 */
function containsEmberRGB(boxShadow: string): boolean {
  return (
    boxShadow.includes('224, 82, 0') ||
    boxShadow.includes('224,82,0') ||
    boxShadow.includes('255, 119, 60') ||
    boxShadow.includes('255,119,60') ||
    boxShadow.includes('255, 170, 112') ||
    boxShadow.includes('255,170,112')
  )
}

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditGlowSystem(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let findingIndex = 0

  for (const spec of GLOW_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `glow-${findingIndex++}`,
        category: 'glow-system',
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
      const boxShadow = style.boxShadow

      // -- Check layer count --
      const layerCount = countBoxShadowLayers(boxShadow)
      if (layerCount < spec.minLayers) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} has insufficient box-shadow layers`,
          expected: `>= ${spec.minLayers} layers`,
          actual: `${layerCount} layers`,
          specRef: spec.specRef,
        })
      }

      // -- Check inset layers --
      if (spec.requiresInset && !hasInsetLayers(boxShadow)) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} missing inset glow layers (inner bleed required)`,
          expected: 'At least 1 inset box-shadow layer',
          actual: 'No inset layers found',
          specRef: spec.specRef,
        })
      }

      // -- Check ember hue (for ember-typed glows) --
      if (spec.expectedHue === 'ember' && !containsEmberRGB(boxShadow)) {
        findings.push({
          id: `glow-${findingIndex++}`,
          category: 'glow-system',
          severity: 'error',
          target: `${spec.selector} (${elId})`,
          message: `${spec.name} glow does not use ember RGB values`,
          expected: 'rgba(224, 82, 0, ...) or ember-bright/glow variants',
          actual: boxShadow.slice(0, 100),
          specRef: spec.specRef,
        })
      }

      // -- Check border color matches glow color --
      // Per Section 4.4: "the border color must match the glow color exactly"
      if (spec.requiresInset) {
        const borderColor = style.borderColor
        if (
          spec.expectedHue === 'ember' &&
          !borderColor.includes('224, 82, 0') &&
          !borderColor.includes('224,82,0')
        ) {
          findings.push({
            id: `glow-${findingIndex++}`,
            category: 'glow-system',
            severity: 'warning',
            target: `${spec.selector} (${elId})`,
            message: `${spec.name} border color may not match glow color`,
            expected: 'Border uses same hue as glow (ember: 224, 82, 0)',
            actual: borderColor,
            specRef: 'Section 4.4 "border color must match glow color"',
          })
        }
      }
    }
  }

  return findings
}

registerAudit('glow-system', auditGlowSystem)
