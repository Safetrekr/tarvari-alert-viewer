/**
 * Visual Polish Audit Infrastructure
 *
 * Programmatic verification of all visual properties against
 * VISUAL-DESIGN-SPEC.md. Runs in-browser during development.
 *
 * Usage:
 *   import { runVisualPolishAudit } from '@/lib/audits'
 *   const report = await runVisualPolishAudit()
 *   console.table(report.summary)
 *
 * Source: WS-4.4 (Visual Polish Pass)
 * Reference: VISUAL-DESIGN-SPEC.md Sections 1-6
 */

// ============================================================
// TYPES
// ============================================================

export type AuditSeverity = 'error' | 'warning' | 'info'

export type AuditCategory =
  | 'glass-material'
  | 'glow-system'
  | 'typography'
  | 'color-consistency'
  | 'performance'
  | 'reduced-motion'
  | 'ambient-effects'
  | 'transitions'
  | 'design-tokens'

export interface AuditFinding {
  /** Unique identifier for the finding */
  readonly id: string
  /** Which audit category produced this finding */
  readonly category: AuditCategory
  /** Severity: error = spec violation, warning = potential issue, info = note */
  readonly severity: AuditSeverity
  /** CSS selector or component path that triggered the finding */
  readonly target: string
  /** Human-readable description of the issue */
  readonly message: string
  /** Expected value per VISUAL-DESIGN-SPEC.md */
  readonly expected: string
  /** Actual computed value found in the DOM */
  readonly actual: string
  /** VISUAL-DESIGN-SPEC.md section reference */
  readonly specRef: string
}

export interface AuditCategorySummary {
  readonly category: AuditCategory
  readonly total: number
  readonly errors: number
  readonly warnings: number
  readonly infos: number
  readonly passed: boolean
}

export interface VisualPolishReport {
  readonly timestamp: string
  readonly duration: number
  readonly findings: readonly AuditFinding[]
  readonly summary: readonly AuditCategorySummary[]
  readonly passed: boolean
}

type AuditFunction = () => AuditFinding[]

// ============================================================
// AUDIT REGISTRY
// ============================================================

const auditRegistry = new Map<AuditCategory, AuditFunction>()

/**
 * Register an audit function for a category.
 * Called by individual audit modules during import.
 */
export function registerAudit(category: AuditCategory, fn: AuditFunction): void {
  auditRegistry.set(category, fn)
}

// ============================================================
// AUDIT RUNNER
// ============================================================

/**
 * Run all registered visual polish audits and produce a report.
 *
 * @returns A complete VisualPolishReport with findings and summary.
 */
export async function runVisualPolishAudit(): Promise<VisualPolishReport> {
  if (process.env.NODE_ENV !== 'development') {
    return {
      timestamp: new Date().toISOString(),
      duration: 0,
      findings: [],
      summary: [],
      passed: true,
    }
  }

  const start = performance.now()
  const allFindings: AuditFinding[] = []

  for (const [category, auditFn] of auditRegistry) {
    try {
      const findings = auditFn()
      allFindings.push(...findings)
    } catch (err) {
      allFindings.push({
        id: `${category}-crash`,
        category,
        severity: 'error',
        target: 'audit-runner',
        message: `Audit crashed: ${err instanceof Error ? err.message : String(err)}`,
        expected: 'No crash',
        actual: 'Audit function threw',
        specRef: 'N/A',
      })
    }
  }

  const duration = performance.now() - start

  // Build per-category summary
  const categories = [...new Set(allFindings.map((f) => f.category))]
  const summary: AuditCategorySummary[] = categories.map((category) => {
    const catFindings = allFindings.filter((f) => f.category === category)
    const errors = catFindings.filter((f) => f.severity === 'error').length
    const warnings = catFindings.filter((f) => f.severity === 'warning').length
    const infos = catFindings.filter((f) => f.severity === 'info').length
    return {
      category,
      total: catFindings.length,
      errors,
      warnings,
      infos,
      passed: errors === 0,
    }
  })

  return {
    timestamp: new Date().toISOString(),
    duration,
    findings: allFindings,
    summary,
    passed: allFindings.every((f) => f.severity !== 'error'),
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse a CSS rgba() value into its components.
 */
export function parseRGBA(value: string): { r: number; g: number; b: number; a: number } | null {
  // Handle rgba(r, g, b, a) and rgba(r g b / a)
  const match = value.match(
    /rgba?\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*(?:[,/]\s*([\d.]+))?\s*\)/
  )
  if (!match) return null
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  }
}

/**
 * Compare two numeric values within a tolerance.
 */
export function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance
}

/**
 * Query all elements matching a selector and return computed styles.
 */
export function queryComputedStyles(
  selector: string
): Array<{ element: Element; style: CSSStyleDeclaration }> {
  const elements = document.querySelectorAll(selector)
  return Array.from(elements).map((element) => ({
    element,
    style: window.getComputedStyle(element),
  }))
}
