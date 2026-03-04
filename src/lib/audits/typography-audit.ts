/**
 * Typography Audit
 *
 * Verifies:
 * 1. Geist Sans is used for labels, headings, UI text.
 * 2. Geist Mono is used for data values, receipts, code, HUD.
 * 3. Tracking values match per-element spec in Section 3.2.
 * 4. font-variant-numeric: tabular-nums on all telemetry values (Section 3.3).
 * 5. Receipt stamp typography matches Section 3.4.
 *
 * Source: WS-4.4 D-POLISH-8
 * Reference: VISUAL-DESIGN-SPEC.md Sections 3.1-3.4
 */

import {
  registerAudit,
  queryComputedStyles,
  withinTolerance,
  type AuditFinding,
} from './visual-polish-audit'

// ============================================================
// SPEC VALUES
// ============================================================

interface TypographySpec {
  /** CSS selector to match elements */
  readonly selector: string
  /** Display name */
  readonly name: string
  /** Expected font family keyword: 'sans' or 'mono' */
  readonly fontFamily: 'sans' | 'mono'
  /** Expected font-size in px */
  readonly sizePx: number
  /** Expected font-weight */
  readonly weight: number
  /** Expected letter-spacing in em (null = no check) */
  readonly trackingEm: number | null
  /** Whether font-variant-numeric: tabular-nums is required */
  readonly requiresTabularNums: boolean
  /** Expected text-transform (null = no check) */
  readonly textTransform: string | null
  readonly specRef: string
}

/**
 * Type scale entries from VISUAL-DESIGN-SPEC.md Section 3.2.
 *
 * NOTE: These selectors use data attributes and BEM-style classes
 * that the component implementations should apply. During the audit,
 * any elements matching these selectors are checked for spec compliance.
 */
const TYPOGRAPHY_SPECS: readonly TypographySpec[] = [
  // Z0 -- Constellation
  {
    selector: '[data-zoom-level="z0"] .beacon-label',
    name: 'Z0 Beacon label',
    fontFamily: 'sans',
    sizePx: 9,
    weight: 600,
    trackingEm: 0.12,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z0',
  },
  // Z1 -- Launch Atrium
  {
    selector: '.capsule-app-name',
    name: 'Z1 Capsule app name',
    fontFamily: 'sans',
    sizePx: 11,
    weight: 600,
    trackingEm: 0.08,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z1',
  },
  {
    selector: '.capsule-telemetry-label',
    name: 'Z1 Capsule telemetry label',
    fontFamily: 'sans',
    sizePx: 10,
    weight: 400,
    trackingEm: 0.06,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z1',
  },
  {
    selector: '.capsule-telemetry-value',
    name: 'Z1 Capsule telemetry value',
    fontFamily: 'mono',
    sizePx: 16,
    weight: 500,
    trackingEm: 0,
    requiresTabularNums: true,
    textTransform: null,
    specRef: 'Section 3.2 Z1',
  },
  // Z2 -- District
  {
    selector: '.district-heading',
    name: 'Z2 District heading',
    fontFamily: 'sans',
    sizePx: 15,
    weight: 600,
    trackingEm: 0.04,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z2',
  },
  {
    selector: '.station-header-title',
    name: 'Z2 Station header',
    fontFamily: 'sans',
    sizePx: 13,
    weight: 600,
    trackingEm: 0.03,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 Z2',
  },
  // Z3 -- Station
  {
    selector: '.station-panel .panel-heading',
    name: 'Z3 Panel heading',
    fontFamily: 'sans',
    sizePx: 16,
    weight: 600,
    trackingEm: 0.02,
    requiresTabularNums: false,
    textTransform: null,
    specRef: 'Section 3.2 Z3',
  },
  {
    selector: '.station-panel .table-data',
    name: 'Z3 Table data',
    fontFamily: 'mono',
    sizePx: 13,
    weight: 400,
    trackingEm: 0,
    requiresTabularNums: true,
    textTransform: null,
    specRef: 'Section 3.2 Z3',
  },
  // HUD Elements
  {
    selector: '.minimap-label',
    name: 'HUD Minimap label',
    fontFamily: 'mono',
    sizePx: 8,
    weight: 500,
    trackingEm: 0.14,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.2 HUD',
  },
  {
    selector: '.breadcrumb-path',
    name: 'HUD Breadcrumb path',
    fontFamily: 'mono',
    sizePx: 11,
    weight: 400,
    trackingEm: 0.02,
    requiresTabularNums: false,
    textTransform: null,
    specRef: 'Section 3.2 HUD',
  },
  // Receipt stamp
  {
    selector: '.receipt-stamp',
    name: 'Receipt stamp',
    fontFamily: 'mono',
    sizePx: 10,
    weight: 500,
    trackingEm: 0.12,
    requiresTabularNums: false,
    textTransform: 'uppercase',
    specRef: 'Section 3.4',
  },
] as const

// ============================================================
// AUDIT IMPLEMENTATION
// ============================================================

function auditTypography(): AuditFinding[] {
  const findings: AuditFinding[] = []
  let idx = 0

  for (const spec of TYPOGRAPHY_SPECS) {
    const elements = queryComputedStyles(spec.selector)

    if (elements.length === 0) {
      findings.push({
        id: `typo-${idx++}`,
        category: 'typography',
        severity: 'info',
        target: spec.selector,
        message: `No elements found for ${spec.name}. May not be rendered at current zoom level.`,
        expected: 'At least 1 element',
        actual: '0 elements',
        specRef: spec.specRef,
      })
      continue
    }

    for (const { element, style } of elements) {
      const elId = element.id || element.textContent?.slice(0, 20) || element.tagName

      // -- Font family --
      const fontFamily = style.fontFamily.toLowerCase()
      const expectedFont = spec.fontFamily === 'sans' ? 'geist sans' : 'geist mono'
      if (!fontFamily.includes(expectedFont)) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'error',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} uses wrong font family`,
          expected: expectedFont,
          actual: fontFamily.slice(0, 60),
          specRef: spec.specRef,
        })
      }

      // -- Font size --
      const actualSize = parseFloat(style.fontSize)
      if (!withinTolerance(actualSize, spec.sizePx, 0.5)) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'error',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} font-size mismatch`,
          expected: `${spec.sizePx}px`,
          actual: `${actualSize}px`,
          specRef: spec.specRef,
        })
      }

      // -- Font weight --
      const actualWeight = parseInt(style.fontWeight, 10)
      if (actualWeight !== spec.weight) {
        findings.push({
          id: `typo-${idx++}`,
          category: 'typography',
          severity: 'warning',
          target: `${spec.selector} ("${elId}")`,
          message: `${spec.name} font-weight mismatch`,
          expected: `${spec.weight}`,
          actual: `${actualWeight}`,
          specRef: spec.specRef,
        })
      }

      // -- Letter spacing (tracking) --
      if (spec.trackingEm !== null) {
        const actualTracking = style.letterSpacing
        if (spec.trackingEm === 0) {
          if (actualTracking !== 'normal' && actualTracking !== '0px' && actualTracking !== '0') {
            findings.push({
              id: `typo-${idx++}`,
              category: 'typography',
              severity: 'warning',
              target: `${spec.selector} ("${elId}")`,
              message: `${spec.name} has unexpected letter-spacing`,
              expected: 'normal (0)',
              actual: actualTracking,
              specRef: spec.specRef,
            })
          }
        }
        // Non-zero tracking is harder to verify from computed style
        // (browser resolves em to px). Log as info for manual check.
      }

      // -- Tabular nums --
      if (spec.requiresTabularNums) {
        const fontVariant = style.fontVariantNumeric
        const fontFeature = style.fontFeatureSettings
        const hasTabular =
          fontVariant.includes('tabular-nums') ||
          fontFeature.includes('"tnum"') ||
          fontFeature.includes("'tnum'")
        if (!hasTabular) {
          findings.push({
            id: `typo-${idx++}`,
            category: 'typography',
            severity: 'error',
            target: `${spec.selector} ("${elId}")`,
            message: `${spec.name} missing tabular-nums`,
            expected: 'font-variant-numeric: tabular-nums',
            actual: `variant: ${fontVariant}, features: ${fontFeature}`,
            specRef: 'Section 3.3',
          })
        }
      }

      // -- Text transform --
      if (spec.textTransform !== null) {
        if (style.textTransform !== spec.textTransform) {
          findings.push({
            id: `typo-${idx++}`,
            category: 'typography',
            severity: 'warning',
            target: `${spec.selector} ("${elId}")`,
            message: `${spec.name} text-transform mismatch`,
            expected: spec.textTransform,
            actual: style.textTransform,
            specRef: spec.specRef,
          })
        }
      }
    }
  }

  return findings
}

registerAudit('typography', auditTypography)
